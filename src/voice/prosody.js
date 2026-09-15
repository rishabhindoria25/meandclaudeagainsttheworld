/**
 * Vocal prosody analysis.
 *
 * People routinely say "I'm fine" in a voice that is not fine. Acoustic features
 * carry affective information that the words do not, and the systematic review
 * literature is consistent about which ones: fundamental frequency (F0) and
 * intensity track arousal robustly, and speech rate and pause structure add to
 * them. Anger and stress raise F0, intensity and rate together; sadness lowers
 * all three; depressed speech is characteristically flatter in F0 range and
 * slower, with longer pauses.
 *
 * What this module does and does not claim:
 *   - It estimates **arousal**, and it does so within a speaker, against that
 *     speaker's own baseline, calibrated over their first several utterances.
 *   - It does NOT classify emotions, detect lying, screen for depression, or
 *     produce anything resembling a clinical measurement. Cross-speaker acoustic
 *     inference is unreliable and cross-cultural inference more so.
 *   - Its output is a soft prior with a confidence attached, fused with the
 *     lexical signal at low weight. It can make Tom ask "you sound tired — are
 *     you?"; it can never make Tom assert what someone feels.
 *
 * Audio never leaves the device, and nothing is recorded: frames are analysed
 * and discarded.
 */

/** Human speech fundamental frequency spans roughly 70-400 Hz across speakers. */
const F0_MIN = 70;
const F0_MAX = 400;

/**
 * Estimate fundamental frequency by normalised autocorrelation.
 *
 * Autocorrelation rather than spectral peak-picking because in speech the first
 * harmonic is frequently louder than the fundamental, and a naive spectral peak
 * lands an octave high.
 *
 * Two details that matter more than the algorithm choice:
 *
 *  - The correlation is normalised by the energy of *both* overlapping windows.
 *    Normalising by anything else makes the score depend on loudness, which
 *    collapses the whole estimate.
 *  - We take the FIRST peak that clears 92% of the best peak, not the global
 *    maximum. A perfectly periodic signal correlates just as well at twice its
 *    period, so global-max selection produces octave-down errors on exactly the
 *    clean, sustained vowels where pitch matters most.
 *
 * The signal is decimated to roughly 16 kHz first: 400 Hz needs nothing like
 * 48 kHz of resolution, and the cost is quadratic in the lag search.
 *
 * @param {Float32Array} buffer time-domain samples, -1..1
 * @param {number} sampleRate
 * @returns {{f0: number, clarity: number}} f0 in Hz, 0 when unvoiced
 */
export function estimateF0(buffer, sampleRate) {
  let level = 0;
  for (let i = 0; i < buffer.length; i += 1) level += buffer[i] * buffer[i];
  level = Math.sqrt(level / buffer.length);
  if (level < 0.008) return { f0: 0, clarity: 0 }; // silence or breath

  const decimation = Math.max(1, Math.floor(sampleRate / 16000));
  const sr = sampleRate / decimation;
  const n = Math.floor(buffer.length / decimation);
  if (n < 128) return { f0: 0, clarity: 0 };

  const x = new Float32Array(n);
  if (decimation === 1) {
    x.set(buffer.subarray(0, n));
  } else {
    // Box-average while decimating, which doubles as a crude anti-alias filter.
    for (let i = 0; i < n; i += 1) {
      let sum = 0;
      for (let k = 0; k < decimation; k += 1) sum += buffer[i * decimation + k];
      x[i] = sum / decimation;
    }
  }

  // Remove any DC offset; a bias inflates every correlation equally.
  let mean = 0;
  for (let i = 0; i < n; i += 1) mean += x[i];
  mean /= n;
  for (let i = 0; i < n; i += 1) x[i] -= mean;

  const minLag = Math.max(2, Math.floor(sr / F0_MAX));
  const maxLag = Math.min(Math.floor(sr / F0_MIN), n - 64);
  if (maxLag <= minLag) return { f0: 0, clarity: 0 };

  const scores = new Float32Array(maxLag + 1);
  let best = 0;
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let correlation = 0;
    let energyA = 0;
    let energyB = 0;
    for (let i = 0; i < n - lag; i += 1) {
      const a = x[i];
      const b = x[i + lag];
      correlation += a * b;
      energyA += a * a;
      energyB += b * b;
    }
    const denom = Math.sqrt(energyA * energyB);
    const score = denom > 0 ? correlation / denom : 0;
    scores[lag] = score;
    if (score > best) best = score;
  }

  if (best < 0.3) return { f0: 0, clarity: best };

  // First local maximum reaching 92% of the best score: the true period, rather
  // than one of its multiples.
  const threshold = best * 0.92;
  let chosen = -1;
  for (let lag = minLag + 1; lag < maxLag; lag += 1) {
    if (scores[lag] >= threshold && scores[lag] >= scores[lag - 1] && scores[lag] >= scores[lag + 1]) {
      chosen = lag;
      break;
    }
  }
  if (chosen < 0) return { f0: 0, clarity: best };

  // Parabolic interpolation across the score curve for sub-sample resolution.
  const y0 = scores[chosen - 1];
  const y1 = scores[chosen];
  const y2 = scores[chosen + 1];
  const denom = y0 - 2 * y1 + y2;
  const refined = denom === 0 ? chosen : chosen - 0.5 * ((y0 - y2) / denom);

  const f0 = sr / refined;
  if (f0 < F0_MIN || f0 > F0_MAX) return { f0: 0, clarity: best };
  return { f0, clarity: best };
}

/** @param {Float32Array} buffer */
export function rms(buffer) {
  let sum = 0;
  for (let i = 0; i < buffer.length; i += 1) sum += buffer[i] * buffer[i];
  return Math.sqrt(sum / buffer.length);
}

/**
 * Accumulates per-frame measurements across one utterance, and maintains a
 * rolling per-speaker baseline so arousal is judged against the person's own
 * habitual voice rather than a population average.
 */
export class ProsodyAnalyser {
  constructor({ sampleRate = 48000, frameMs = 42 } = {}) {
    this.sampleRate = sampleRate;
    this.frameMs = frameMs;
    this.reset();

    // Baseline, learned over the session.
    this.baseline = { f0: null, energy: null, rate: null, samples: 0 };
  }

  reset() {
    this.f0s = [];
    this.energies = [];
    this.voicedFrames = 0;
    this.totalFrames = 0;
    this.pauseFrames = 0;
    this.longestPause = 0;
    this._currentPause = 0;
    this.startedAt = null;
  }

  /**
   * Feed one analysis frame.
   * @param {Float32Array} buffer
   */
  push(buffer) {
    if (this.startedAt == null) this.startedAt = Date.now();
    this.totalFrames += 1;

    const energy = rms(buffer);
    this.energies.push(energy);

    const { f0, clarity } = estimateF0(buffer, this.sampleRate);
    if (f0 > 0 && clarity > 0.35) {
      this.f0s.push(f0);
      this.voicedFrames += 1;
      this._currentPause = 0;
    } else if (energy < 0.012) {
      this.pauseFrames += 1;
      this._currentPause += 1;
      this.longestPause = Math.max(this.longestPause, this._currentPause);
    }
  }

  /**
   * Summarise the utterance and estimate arousal.
   *
   * @param {{wordCount?: number}} [context]
   * @returns {{arousal:number, confidence:number, f0Mean:number, f0Range:number, energyMean:number, speechRate:number, pauseRatio:number, flat:boolean, note:string}}
   */
  summarise(context = {}) {
    const durationS = this.startedAt ? (Date.now() - this.startedAt) / 1000 : 0;
    const voiced = this.f0s.filter((f) => f > 0).sort((a, b) => a - b);

    // Not enough voiced audio to say anything. Report zero confidence rather than a guess.
    if (voiced.length < 6 || durationS < 0.7) {
      return {
        arousal: 0.5, confidence: 0, f0Mean: 0, f0Range: 0, energyMean: 0,
        speechRate: 0, pauseRatio: 0, flat: false,
        note: 'Not enough voiced audio for a usable estimate.',
      };
    }

    // Medians and interdecile range: robust to the octave errors that pitch
    // trackers inevitably make on a few frames.
    const f0Mean = median(voiced);
    const f0Range = percentile(voiced, 0.9) - percentile(voiced, 0.1);
    const energyMean = median([...this.energies].sort((a, b) => a - b));
    const pauseRatio = this.totalFrames ? this.pauseFrames / this.totalFrames : 0;
    const speechRate = context.wordCount && durationS > 0 ? context.wordCount / durationS : 0;

    this._updateBaseline({ f0: f0Mean, energy: energyMean, rate: speechRate });

    // Score each cue as a deviation from this speaker's own baseline.
    const b = this.baseline;
    const settled = b.samples >= 3;
    const f0Dev = settled && b.f0 ? clamp((f0Mean - b.f0) / (b.f0 * 0.28), -1, 1) : 0;
    const energyDev = settled && b.energy ? clamp((energyMean - b.energy) / (b.energy * 0.6), -1, 1) : 0;
    const rateDev = settled && b.rate && speechRate ? clamp((speechRate - b.rate) / (b.rate * 0.4), -1, 1) : 0;
    const pauseDev = clamp((0.28 - pauseRatio) / 0.28, -1, 1);

    // F0 and intensity carry the most weight; rate and pause structure refine it.
    const raw = 0.5 + (f0Dev * 0.34 + energyDev * 0.3 + rateDev * 0.22 + pauseDev * 0.14) * 0.5;
    const arousal = clamp(raw, 0, 1);

    // Reduced F0 range with a slow rate is the flat, monotone pattern associated
    // with low mood. Reported as an observation, never as a screening result.
    const flat = settled && f0Range < f0Mean * 0.18 && (speechRate === 0 || speechRate < (b.rate ?? 3) * 0.85);

    const confidence = clamp(
      Math.min(1, voiced.length / 40) * (settled ? 1 : 0.45) * Math.min(1, durationS / 2.5),
      0, 0.8,
    );

    return {
      arousal: round(arousal), confidence: round(confidence),
      f0Mean: Math.round(f0Mean), f0Range: Math.round(f0Range),
      energyMean: round(energyMean), speechRate: round(speechRate),
      pauseRatio: round(pauseRatio), flat,
      note: describe(arousal, flat, settled),
    };
  }

  _updateBaseline({ f0, energy, rate }) {
    const b = this.baseline;
    // Exponential moving average, weighted toward early samples settling quickly.
    const alpha = b.samples < 5 ? 0.4 : 0.12;
    b.f0 = b.f0 == null ? f0 : b.f0 * (1 - alpha) + f0 * alpha;
    b.energy = b.energy == null ? energy : b.energy * (1 - alpha) + energy * alpha;
    if (rate > 0) b.rate = b.rate == null ? rate : b.rate * (1 - alpha) + rate * alpha;
    b.samples += 1;
  }
}

function describe(arousal, flat, settled) {
  if (!settled) return 'Still learning your usual voice; treating this as neutral.';
  if (flat) return 'Flatter and slower than your usual range.';
  if (arousal > 0.7) return 'Higher and louder than your usual range.';
  if (arousal < 0.3) return 'Quieter and lower than your usual range.';
  return 'Close to your usual range.';
}

function median(sorted) {
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)));
  return sorted[idx];
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function round(v) { return Number(v.toFixed(3)); }

/**
 * Wire an analyser to a live microphone stream.
 *
 * Returns a stop function. No audio is stored: each frame is measured into
 * running statistics and then discarded.
 *
 * @param {MediaStream} stream
 * @param {ProsodyAnalyser} analyser
 * @param {AudioContext} [audioContext]
 */
export function attachToStream(stream, analyser, audioContext) {
  const ctx = audioContext ?? new (window.AudioContext || window.webkitAudioContext)();
  const source = ctx.createMediaStreamSource(stream);
  const node = ctx.createAnalyser();
  node.fftSize = 2048;
  source.connect(node);

  analyser.sampleRate = ctx.sampleRate;
  const buffer = new Float32Array(node.fftSize);
  let raf = 0;

  const tick = () => {
    node.getFloatTimeDomainData(buffer);
    analyser.push(buffer);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    try { source.disconnect(); node.disconnect(); } catch { /* already torn down */ }
  };
}
