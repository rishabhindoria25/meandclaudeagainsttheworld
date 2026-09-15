/**
 * Voice effects: the playful bit.
 *
 * Tom's ancestry is the talking-cat toy that repeats what you say in a squeaky
 * voice, and that is worth keeping for a reason beyond nostalgia. Sessions that
 * are unrelentingly earnest are hard to stay in; a moment of daftness lets
 * somebody put something down for a second. It is also the oldest trick in
 * cognitive defusion — ACT asks people to say a tormenting thought in a silly
 * voice precisely because hearing it that way loosens its grip.
 *
 * So the echo is offered in two places only: as an explicit toy the person can
 * trigger themselves, and as the last step of the defusion exercise. It is
 * hard-gated off whenever there is any risk signal or sustained distress, since
 * a cartoon voice repeating a disclosure would be grotesque.
 *
 * Implementation note: synthesised speech cannot be routed through Web Audio in
 * any browser, so this operates only on microphone audio the user has recorded
 * for the purpose. Everything happens on-device and buffers are discarded.
 */

/**
 * Pitch-shift an AudioBuffer while preserving its duration.
 *
 * Overlap-add granular resynthesis: the signal is cut into short Hann-windowed
 * grains, and grains are read from the input at a different rate than they are
 * written to the output. Cheap, robust, and its characteristic slight roughness
 * is exactly the texture a cartoon voice wants.
 *
 * @param {AudioBuffer} buffer
 * @param {number} semitones positive is higher
 * @param {BaseAudioContext} ctx
 * @param {{grainMs?:number, overlap?:number}} [opts]
 * @returns {AudioBuffer}
 */
export function pitchShift(buffer, semitones, ctx, opts = {}) {
  const ratio = Math.pow(2, semitones / 12);
  const sampleRate = buffer.sampleRate;
  const grainSize = Math.max(128, Math.floor((opts.grainMs ?? 70) * sampleRate / 1000));
  const overlap = opts.overlap ?? 0.5;
  const hop = Math.max(1, Math.floor(grainSize * (1 - overlap)));

  const out = ctx.createBuffer(buffer.numberOfChannels, buffer.length, sampleRate);
  const window = hann(grainSize);

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const input = buffer.getChannelData(channel);
    const output = out.getChannelData(channel);
    const normalise = new Float32Array(buffer.length);

    for (let start = 0; start + grainSize < buffer.length; start += hop) {
      for (let i = 0; i < grainSize; i += 1) {
        // Read position advances faster (or slower) than the write position,
        // which is what moves the pitch; the grain still lands at `start`, which
        // is what preserves the duration.
        const readPos = start + i * ratio;
        const idx = Math.floor(readPos);
        if (idx + 1 >= buffer.length) break;

        const frac = readPos - idx;
        const sample = input[idx] * (1 - frac) + input[idx + 1] * frac;
        const w = window[i];
        output[start + i] += sample * w;
        normalise[start + i] += w;
      }
    }

    // Divide out the accumulated window, so overlaps do not boost the amplitude.
    for (let i = 0; i < output.length; i += 1) {
      if (normalise[i] > 0.0001) output[i] /= normalise[i];
    }
  }

  return out;
}

function hann(size) {
  const w = new Float32Array(size);
  for (let i = 0; i < size; i += 1) w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
  return w;
}

/**
 * Records a short clip from the microphone and plays it back as Tom.
 *
 * Deliberately capped at a few seconds: this is a toy, not a recorder, and a
 * short hard limit is easier to trust than a policy.
 */
export class EchoToy {
  /**
   * @param {{maxMs?:number, semitones?:number}} [opts]
   */
  constructor(opts = {}) {
    this.maxMs = Math.min(opts.maxMs ?? 4000, 6000);
    this.semitones = opts.semitones ?? 6;
    this.ctx = null;
    this.recording = false;
  }

  _context() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  /**
   * Capture from a live stream for up to `maxMs`, returning the raw buffer.
   * @param {MediaStream} stream
   * @param {(level:number)=>void} [onLevel]
   * @returns {Promise<AudioBuffer>}
   */
  record(stream, onLevel) {
    const ctx = this._context();
    const source = ctx.createMediaStreamSource(stream);
    const processorSize = 4096;
    const chunks = [];
    let total = 0;
    const maxSamples = Math.floor((this.maxMs / 1000) * ctx.sampleRate);

    return new Promise((resolve) => {
      // ScriptProcessor is deprecated but universally available; an AudioWorklet
      // would need a separate module file for what is a four-second toy.
      const node = ctx.createScriptProcessor(processorSize, 1, 1);
      this.recording = true;

      const finish = () => {
        if (!this.recording) return;
        this.recording = false;
        try { node.disconnect(); source.disconnect(); } catch { /* already gone */ }

        const buffer = ctx.createBuffer(1, Math.max(1, total), ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let offset = 0;
        for (const c of chunks) { data.set(c, offset); offset += c.length; }
        resolve(buffer);
      };

      node.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0);
        const copy = new Float32Array(input.length);
        copy.set(input);
        chunks.push(copy);
        total += copy.length;

        if (onLevel) {
          let peak = 0;
          for (let i = 0; i < input.length; i += 1) peak = Math.max(peak, Math.abs(input[i]));
          onLevel(peak);
        }
        if (total >= maxSamples) finish();
      };

      source.connect(node);
      // Zero-gain sink: ScriptProcessor only runs when connected to a destination,
      // and we must not route the microphone to the speakers (feedback).
      const sink = ctx.createGain();
      sink.gain.value = 0;
      node.connect(sink);
      sink.connect(ctx.destination);

      this.stopRecording = finish;
      setTimeout(finish, this.maxMs + 250);
    });
  }

  /**
   * Play a buffer back in Tom's voice.
   * @param {AudioBuffer} buffer
   * @returns {Promise<{durationMs:number}>}
   */
  play(buffer) {
    const ctx = this._context();
    const shifted = pitchShift(buffer, this.semitones, ctx);

    const source = ctx.createBufferSource();
    source.buffer = shifted;
    // A gentle presence lift; cartoon voices live in the upper mids.
    const filter = ctx.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = 2400;
    filter.gain.value = 4;
    filter.Q.value = 0.8;

    const gain = ctx.createGain();
    gain.gain.value = 0.9;

    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();

    return new Promise((resolve) => {
      source.onended = () => resolve({ durationMs: shifted.duration * 1000 });
    });
  }

  dispose() {
    if (this.ctx && this.ctx.state !== 'closed') {
      try { this.ctx.close(); } catch { /* already closed */ }
    }
    this.ctx = null;
  }
}

/**
 * Whether the playful echo is allowed right now.
 *
 * This is a safety gate, not a preference. A cartoon voice repeating something
 * said in distress would be humiliating, and the cost of being wrong here is far
 * higher than the cost of the toy being unavailable.
 *
 * @param {{riskTier?:number, valence?:number, intensity?:number, everAtRisk?:boolean}} state
 */
export function echoAllowed(state = {}) {
  if ((state.riskTier ?? 0) > 0) return false;
  if (state.everAtRisk) return false;
  if ((state.valence ?? 0) < -0.4 && (state.intensity ?? 0) > 0.35) return false;
  return true;
}
