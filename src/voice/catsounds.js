/**
 * Cat vocalisations, synthesised rather than sampled.
 *
 * Synthesised because a purr needs to respond continuously to how he is being
 * stroked — starting, deepening, trailing off — and a looped audio file cannot
 * do that convincingly. Also because it keeps the app a handful of text files
 * with no binary assets, which matters for something meant to run offline.
 *
 * The purr is modelled on the real thing: a low rumble amplitude-modulated at
 * roughly 25 Hz, which is the frequency range domestic cats actually purr in.
 * It is the one sound here with a plausible claim to doing something — low
 * frequency rhythmic sound is soothing, and the point of the purr in this app
 * is to give someone a slow steady rhythm to be near while they talk.
 */

/** Cat purrs sit at roughly 20-30 Hz amplitude modulation. */
export const PURR_HZ = 25;

/**
 * Map stroke credit (0..12) onto purr parameters.
 *
 * Pure function so the curve can be reasoned about and tested without an audio
 * context. The purr should arrive quickly enough to feel responsive to the first
 * couple of strokes, then deepen slowly rather than maxing out immediately.
 *
 * @param {number} credit
 * @returns {{gain:number, rate:number, brightness:number, active:boolean}}
 */
export function purrParams(credit) {
  const c = Math.max(0, Math.min(12, credit));
  const t = c / 12;
  return {
    active: c > 0.15,
    // Fast initial rise, then a long gentle approach to full.
    gain: Number((0.34 * Math.sqrt(t)).toFixed(4)),
    // A contented purr slows very slightly as it settles.
    rate: Number((PURR_HZ + 3.5 * (1 - t)).toFixed(2)),
    // And opens up a little in timbre.
    brightness: Number((420 + 260 * t).toFixed(0)),
  };
}

function ctxOf(existing) {
  const Ctx = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
  if (!Ctx) return null;
  const ctx = existing ?? new Ctx();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Shared noise buffer; generating it per-sound is wasteful and audibly identical. */
let noiseBuffer = null;
function noise(ctx, seconds = 2) {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) return noiseBuffer;
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // Brown-ish noise: integrated white, which sits lower and reads as breath
  // rather than as hiss.
  let last = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.2;
  }
  noiseBuffer = buffer;
  return buffer;
}

/**
 * A continuous purr whose depth follows how much he is being stroked.
 */
export class Purr {
  constructor(audioContext) {
    this.ctx = audioContext ?? null;
    this.nodes = null;
    this.credit = 0;
  }

  _build() {
    const ctx = ctxOf(this.ctx);
    if (!ctx) return null;
    this.ctx = ctx;

    // Rumble: a low saw gives the buzzy harmonic content a purr has.
    const rumble = ctx.createOscillator();
    rumble.type = 'sawtooth';
    rumble.frequency.value = 46;

    // Breath underneath it.
    const breath = ctx.createBufferSource();
    breath.buffer = noise(ctx);
    breath.loop = true;
    const breathGain = ctx.createGain();
    breathGain.gain.value = 0.35;

    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 520;
    tone.Q.value = 0.7;

    // The purr itself: amplitude modulation at ~25 Hz.
    const modulator = ctx.createOscillator();
    modulator.type = 'sine';
    modulator.frequency.value = PURR_HZ;
    const modDepth = ctx.createGain();
    modDepth.gain.value = 0.42;

    const modulated = ctx.createGain();
    modulated.gain.value = 0.5;         // centre, so the LFO swings 0.08..0.92
    modulator.connect(modDepth).connect(modulated.gain);

    const master = ctx.createGain();
    master.gain.value = 0;

    rumble.connect(tone);
    breath.connect(breathGain).connect(tone);
    tone.connect(modulated).connect(master).connect(ctx.destination);

    rumble.start();
    breath.start();
    modulator.start();

    this.nodes = { rumble, breath, tone, modulator, modulated, master };
    return this.nodes;
  }

  /**
   * @param {number} credit stroke credit, 0..12
   */
  setCredit(credit) {
    this.credit = credit;
    const params = purrParams(credit);
    if (!params.active) {
      if (this.nodes) this._ramp(this.nodes.master.gain, 0, 0.5);
      return params;
    }
    const nodes = this.nodes ?? this._build();
    if (!nodes) return params;

    this._ramp(nodes.master.gain, params.gain, 0.28);
    this._ramp(nodes.modulator.frequency, params.rate, 0.6);
    this._ramp(nodes.tone.frequency, params.brightness, 0.6);
    return params;
  }

  _ramp(param, value, seconds) {
    const now = this.ctx.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(value, now + seconds);
  }

  stop() {
    if (!this.nodes) return;
    this._ramp(this.nodes.master.gain, 0, 0.35);
    const { rumble, breath, modulator } = this.nodes;
    const nodes = this.nodes;
    this.nodes = null;
    setTimeout(() => {
      for (const n of [rumble, breath, modulator]) {
        try { n.stop(); } catch { /* already stopped */ }
      }
      try { nodes.master.disconnect(); } catch { /* already gone */ }
    }, 450);
  }
}

/**
 * One-shot reactions.
 *
 * Each is a short shaped burst. They are deliberately small and dry: a cartoon
 * that yelps loudly every time you touch it stops being something you want near
 * you when you feel awful.
 */
export const REACTION_SOUNDS = {
  /** A short questioning chirp — the "mrrp?" a cat makes when it notices you. */
  chirp: { peak: 0.16, duration: 0.2, sweep: [620, 980, 700], type: 'triangle', filter: 2200 },
  /** Startled. Quick, up, gone. */
  yelp: { peak: 0.2, duration: 0.15, sweep: [520, 1150], type: 'square', filter: 2600 },
  /** Pleased. Lower, rounder. */
  trill: { peak: 0.14, duration: 0.34, sweep: [430, 720, 560, 640], type: 'triangle', filter: 1800 },
  /** Grumbled complaint at having his tail pulled. */
  grumble: { peak: 0.17, duration: 0.3, sweep: [190, 150, 175], type: 'sawtooth', filter: 700 },
  /** Sleepy. Long and falling. */
  yawn: { peak: 0.11, duration: 0.75, sweep: [360, 500, 300], type: 'sine', filter: 1100 },
};

/**
 * Play a one-shot reaction.
 * @param {string} name key of REACTION_SOUNDS
 * @param {AudioContext} [audioContext]
 * @param {{volume?:number}} [opts]
 */
export function playReaction(name, audioContext, opts = {}) {
  const spec = REACTION_SOUNDS[name];
  const ctx = ctxOf(audioContext);
  if (!spec || !ctx) return null;

  const osc = ctx.createOscillator();
  osc.type = spec.type;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = spec.filter;

  const gain = ctx.createGain();
  const now = ctx.currentTime;
  const peak = spec.peak * (opts.volume ?? 1);

  // Fast attack, quick decay: percussive, not musical.
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak, now + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + spec.duration);

  // Walk the frequency sweep.
  const step = spec.duration / Math.max(1, spec.sweep.length - 1);
  osc.frequency.setValueAtTime(spec.sweep[0], now);
  spec.sweep.slice(1).forEach((f, i) => {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, f), now + step * (i + 1));
  });

  osc.connect(filter).connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + spec.duration + 0.05);
  return { ctx, durationMs: spec.duration * 1000 };
}

/** A sneeze: a noise burst rather than a tone. */
export function playSneeze(audioContext, opts = {}) {
  const ctx = ctxOf(audioContext);
  if (!ctx) return null;

  const source = ctx.createBufferSource();
  source.buffer = noise(ctx);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.1;

  const gain = ctx.createGain();
  const now = ctx.currentTime;
  const peak = 0.26 * (opts.volume ?? 1);

  // Tiny inhale, then the burst.
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak * 0.2, now + 0.09);
  gain.gain.linearRampToValueAtTime(0.0001, now + 0.13);
  gain.gain.linearRampToValueAtTime(peak, now + 0.155);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

  filter.frequency.setValueAtTime(900, now);
  filter.frequency.linearRampToValueAtTime(2600, now + 0.16);
  filter.frequency.exponentialRampToValueAtTime(420, now + 0.34);

  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(now);
  source.stop(now + 0.4);
  return { ctx, durationMs: 400 };
}
