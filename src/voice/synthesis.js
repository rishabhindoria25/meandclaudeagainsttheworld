/**
 * Speech synthesis, with prosody shaped by clinical context.
 *
 * How something is said carries as much as what is said, and the mapping is well
 * established: raised F0, higher intensity and faster rate read as activation;
 * lowered pitch, reduced intensity and a slower rate read as calm or sadness.
 *
 * The therapeutically important case is the crisis one. When someone is highly
 * activated, a voice that matches their arousal escalates them, and a voice that
 * is markedly slower, lower and steadier gives them something to settle against.
 * So Tom's voice slows and drops as risk rises — the opposite of what an
 * engagement-optimised assistant would do.
 *
 * Browsers largely ignore SSML in `speak()`, so pauses are produced by chunking
 * at punctuation and inserting real gaps between utterances. Chunking also works
 * around the long-standing bug where a long utterance is silently truncated.
 */

const MAX_CHUNK_CHARS = 180;

/** Baseline voice settings for Tom. Slightly higher than default: he is a cat. */
const BASE = { rate: 0.96, pitch: 1.34, volume: 1 };

/**
 * Prosody deltas per emotional intent, applied on top of BASE.
 * Values are multiplicative for rate and additive for pitch.
 */
const PROSODY = {
  calm:        { rate: 0.95, pitch: -0.04 },
  sadness:     { rate: 0.88, pitch: -0.12 },
  grief:       { rate: 0.84, pitch: -0.14 },
  hopelessness:{ rate: 0.86, pitch: -0.12 },
  numbness:    { rate: 0.9,  pitch: -0.1 },
  exhaustion:  { rate: 0.88, pitch: -0.1 },
  anxiety:     { rate: 0.92, pitch: -0.02 }, // steadier than the person, deliberately
  overwhelm:   { rate: 0.9,  pitch: -0.04 },
  anger:       { rate: 0.94, pitch: -0.06 },
  shame:       { rate: 0.9,  pitch: -0.06 },
  loneliness:  { rate: 0.9,  pitch: -0.06 },
  confusion:   { rate: 0.96, pitch: 0 },
  hope:        { rate: 1.0,  pitch: 0.06 },
  joy:         { rate: 1.06, pitch: 0.14 },
  pride:       { rate: 1.0,  pitch: 0.08 },
  gratitude:   { rate: 0.98, pitch: 0.05 },
  connection:  { rate: 0.95, pitch: 0.02 },
};

/** Voices that tend to sound warm rather than clipped, in rough order of preference. */
const PREFERRED = [
  'Google UK English Female', 'Microsoft Sonia', 'Microsoft Libby', 'Samantha',
  'Karen', 'Moira', 'Serena', 'Google US English', 'Microsoft Aria', 'Fiona',
];

export function isSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Voice list population is asynchronous in most browsers and racy in all of them. */
export function loadVoices(timeoutMs = 2000) {
  return new Promise((resolve) => {
    if (!isSupported()) return resolve([]);
    const existing = speechSynthesis.getVoices();
    if (existing.length) return resolve(existing);

    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      speechSynthesis.onvoiceschanged = null;
      resolve(speechSynthesis.getVoices());
    };
    speechSynthesis.onvoiceschanged = done;
    setTimeout(done, timeoutMs);
  });
}

/**
 * @param {SpeechSynthesisVoice[]} voices
 * @param {string} [lang]
 */
export function pickVoice(voices, lang = 'en') {
  if (!voices?.length) return null;
  const base = lang.split('-')[0].toLowerCase();
  const matching = voices.filter((v) => v.lang?.toLowerCase().startsWith(base));
  const pool = matching.length ? matching : voices;

  for (const name of PREFERRED) {
    const hit = pool.find((v) => v.name.includes(name));
    if (hit) return hit;
  }
  // Local voices do not need a network round trip and do not send text anywhere.
  return pool.find((v) => v.localService) ?? pool[0];
}

/**
 * Split text at punctuation into chunks that speak cleanly, carrying the pause
 * each boundary implies.
 * @param {string} text
 * @returns {Array<{text:string, pauseAfter:number}>}
 */
export function chunk(text) {
  const src = String(text ?? '').trim();
  if (!src) return [];

  const pieces = src.match(/[^.!?…]+[.!?…]*\s*/g) ?? [src];
  const out = [];

  for (const piece of pieces) {
    const trimmed = piece.trim();
    if (!trimmed) continue;
    const pause = /[.!?…]$/.test(trimmed) ? 340 : 180;

    if (trimmed.length <= MAX_CHUNK_CHARS) {
      out.push({ text: trimmed, pauseAfter: pause });
      continue;
    }
    // Long sentences are split at clause boundaries rather than mid-phrase.
    const clauses = trimmed.split(/(?<=[,;:—])\s+/);
    let current = '';
    for (const clause of clauses) {
      if ((current + ' ' + clause).trim().length > MAX_CHUNK_CHARS && current) {
        out.push({ text: current.trim(), pauseAfter: 140 });
        current = clause;
      } else {
        current = `${current} ${clause}`.trim();
      }
    }
    if (current) out.push({ text: current.trim(), pauseAfter: pause });
  }
  return out;
}

/**
 * Compute the utterance settings for a given emotional intent and risk level.
 * @param {{family?:string, intensity?:number}} emotion
 * @param {{riskTier?:number, userArousal?:number, rateScale?:number}} [context]
 */
export function prosodyFor(emotion = {}, context = {}) {
  const p = PROSODY[emotion.family ?? 'calm'] ?? PROSODY.calm;
  const intensity = Math.max(0, Math.min(1, emotion.intensity ?? 0.4));

  let rate = BASE.rate * (1 + (p.rate - 1) * (0.5 + intensity * 0.5));
  let pitch = BASE.pitch + p.pitch * (0.5 + intensity * 0.5);

  // Risk overrides intent. Slower, lower, steadier — a voice to settle against.
  const tier = context.riskTier ?? 0;
  if (tier >= 2) {
    rate *= 1 - Math.min(0.22, 0.06 * tier);
    pitch -= Math.min(0.2, 0.05 * tier);
  } else if ((context.userArousal ?? 0) > 0.78) {
    rate *= 0.93;
    pitch -= 0.06;
  }

  return {
    rate: clamp(rate * (context.rateScale ?? 1), 0.55, 1.5),
    pitch: clamp(pitch, 0.5, 2),
    volume: BASE.volume,
  };
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/**
 * Speaks text as a sequence of chunks, reporting progress for lip sync.
 */
export class Speaker {
  constructor() {
    this.voice = null;
    this.speaking = false;
    this.queue = [];
    this._cancelled = false;
    /**
     * Whether synthesis actually produces speech here. Null until we find out.
     *
     * Several environments report `speechSynthesis` support and then never
     * speak — a headless browser, a muted device policy, an autoplay block, a
     * platform voice that failed to load. Paying the start-up watchdog on every
     * chunk of every turn in that case makes the whole app feel broken, so the
     * first failure is remembered and speech is skipped from then on. Captions
     * carry the conversation, which is the design anyway.
     */
    this.functional = null;
    this._onBoundary = null;
    this._onChunk = null;
  }

  async init(lang) {
    const voices = await loadVoices();
    this.voice = pickVoice(voices, lang);
    return this.voice;
  }

  /**
   * @param {string} text
   * @param {{emotion?:object, riskTier?:number, userArousal?:number, rateScale?:number,
   *          onChunk?:(chunk:{text:string, settings:object})=>void,
   *          onBoundary?:(info:{charIndex:number, elapsedMs:number})=>void}} [opts]
   * @returns {Promise<void>} resolves when speech finishes or is cancelled
   *
   * If synthesis turns out not to work here, this returns quickly and stays
   * quiet thereafter; the captions are unaffected.
   */
  async speak(text, opts = {}) {
    if (!isSupported()) return;
    this.cancel();
    this._cancelled = false;

    if (this.functional === false) return;

    const settings = prosodyFor(opts.emotion, opts);
    const chunks = chunk(text);
    this.speaking = true;

    for (const piece of chunks) {
      if (this._cancelled) break;
      opts.onChunk?.({ text: piece.text, settings });
      const spoke = await this._speakChunk(piece.text, settings, opts.onBoundary);
      if (!spoke) {
        // Never started. Do not spend the rest of the turn waiting on silence.
        this.functional = false;
        break;
      }
      this.functional = true;
      if (this._cancelled) break;
      if (piece.pauseAfter) await delay(piece.pauseAfter / settings.rate);
    }

    this.speaking = false;
  }

  _speakChunk(text, settings, onBoundary) {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      if (this.voice) utterance.voice = this.voice;
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      utterance.volume = settings.volume;

      const startedAt = performance.now();
      let finished = false;
      let started = false;
      const timers = [];
      const finish = () => {
        if (finished) return;
        finished = true;
        for (const t of timers) clearTimeout(t);
        resolve(started);
      };

      utterance.onstart = () => { started = true; };
      utterance.onboundary = (event) => {
        started = true;
        onBoundary?.({ charIndex: event.charIndex ?? 0, elapsedMs: performance.now() - startedAt });
      };
      utterance.onend = finish;
      utterance.onerror = finish;

      // Two watchdogs, because speech synthesis fails in two different ways.
      //
      // It can fail to start at all — no audio output, a platform that reports
      // support it does not have, an autoplay policy. Waiting out a duration
      // estimate in that case leaves the interface frozen for ten seconds per
      // sentence while the person sits looking at a cat that will not respond.
      timers.push(setTimeout(() => { if (!started) finish(); }, 900));

      // Or it can start and then never report finishing, which some browsers do
      // on long utterances. That one needs the duration estimate.
      const estimate = (text.length / 14) * 1000 / settings.rate + 1200;
      timers.push(setTimeout(finish, estimate));

      speechSynthesis.speak(utterance);
    });
  }

  /** Re-test synthesis, e.g. after the person interacts and autoplay unblocks. */
  resetAvailability() {
    this.functional = null;
  }

  cancel() {
    this._cancelled = true;
    this.speaking = false;
    if (isSupported()) {
      try { speechSynthesis.cancel(); } catch { /* nothing queued */ }
    }
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { BASE, PROSODY };
