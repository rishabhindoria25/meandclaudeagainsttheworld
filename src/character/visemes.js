/**
 * Text-to-viseme conversion for lip sync.
 *
 * A viseme is the visual counterpart of a phoneme: the mouth shape a sound
 * produces. Many phonemes share one shape — /p/, /b/ and /m/ are identical from
 * the outside — so a small shape library covers all of English. This uses the
 * ten-shape Preston Blair set that hand-drawn animation has relied on since the
 * 1940s, which remains the most practical basis for stylised characters because
 * it reads clearly at low frame rates and small sizes.
 *
 * We estimate phonemes from English orthography rather than using a pronunciation
 * dictionary. English spelling is famously unfaithful to its sounds, so this is
 * approximate — but lip sync tolerates approximation remarkably well. The eye
 * checks two things: that the mouth opens on open vowels, and that it closes on
 * bilabials. Get those right and the rest reads as correct.
 *
 * Where the speech synthesiser emits word-boundary events, the timeline is
 * re-anchored to them at runtime, which corrects accumulated drift.
 */

/** The ten Preston Blair shapes, plus an explicit rest. */
export const VISEMES = Object.freeze({
  REST: 'rest',   // closed, neutral
  MBP: 'MBP',     // lips pressed together: m, b, p
  FV: 'FV',       // lower lip to upper teeth: f, v
  TH: 'TH',       // tongue to teeth: th
  EE: 'EE',       // wide and narrow: ee, i, y
  AA: 'AA',       // wide open: ah, a
  OH: 'OH',       // rounded, medium: oh, aw
  OO: 'OO',       // rounded, small: oo, w, u
  L: 'L',         // tongue up, mouth open: l
  CONS: 'CONS',   // generic consonant: c d g k n r s t z
});

/**
 * Mouth geometry per viseme, normalised.
 * `open` drives jaw drop, `width` drives corner separation, `round` drives
 * protrusion, `teeth` shows the upper teeth, `tongue` shows the tongue.
 */
export const VISEME_SHAPES = Object.freeze({
  rest: { open: 0.06, width: 0.5, round: 0.1, teeth: 0, tongue: 0 },
  MBP:  { open: 0.0,  width: 0.45, round: 0.15, teeth: 0, tongue: 0 },
  FV:   { open: 0.14, width: 0.5, round: 0.05, teeth: 0.8, tongue: 0 },
  TH:   { open: 0.22, width: 0.5, round: 0.0, teeth: 0.4, tongue: 0.8 },
  EE:   { open: 0.3,  width: 1.0, round: 0.0, teeth: 0.5, tongue: 0 },
  AA:   { open: 1.0,  width: 0.72, round: 0.05, teeth: 0.2, tongue: 0.15 },
  OH:   { open: 0.62, width: 0.3, round: 0.75, teeth: 0, tongue: 0 },
  OO:   { open: 0.3,  width: 0.16, round: 1.0, teeth: 0, tongue: 0 },
  L:    { open: 0.45, width: 0.58, round: 0.05, teeth: 0.3, tongue: 1.0 },
  CONS: { open: 0.24, width: 0.6, round: 0.08, teeth: 0.45, tongue: 0.1 },
});

/** Base durations in milliseconds at a normal speaking rate. */
const DURATION = { vowel: 115, diphthong: 150, consonant: 62, plosive: 48, pause: 170, comma: 240, sentence: 380 };

const VOWELS = 'aeiou';

/**
 * Multi-character graphemes checked before single letters. Order matters:
 * longer sequences must be tested first.
 */
const DIGRAPHS = [
  ['ough', VISEMES.OH, DURATION.diphthong],
  ['augh', VISEMES.AA, DURATION.diphthong],
  ['tion', VISEMES.OO, DURATION.diphthong],
  ['sion', VISEMES.OO, DURATION.diphthong],
  ['eigh', VISEMES.EE, DURATION.diphthong],
  ['ai', VISEMES.EE, DURATION.diphthong],
  ['ay', VISEMES.EE, DURATION.diphthong],
  ['ea', VISEMES.EE, DURATION.diphthong],
  ['ee', VISEMES.EE, DURATION.vowel],
  ['ie', VISEMES.EE, DURATION.diphthong],
  ['ey', VISEMES.EE, DURATION.diphthong],
  ['oa', VISEMES.OH, DURATION.diphthong],
  ['oe', VISEMES.OH, DURATION.diphthong],
  ['ow', VISEMES.OH, DURATION.diphthong],
  ['ou', VISEMES.OO, DURATION.diphthong],
  ['oo', VISEMES.OO, DURATION.vowel],
  ['ue', VISEMES.OO, DURATION.diphthong],
  ['ui', VISEMES.OO, DURATION.diphthong],
  ['oi', VISEMES.OH, DURATION.diphthong],
  ['oy', VISEMES.OH, DURATION.diphthong],
  ['au', VISEMES.AA, DURATION.diphthong],
  ['aw', VISEMES.AA, DURATION.diphthong],
  ['th', VISEMES.TH, DURATION.consonant],
  ['sh', VISEMES.CONS, DURATION.consonant],
  ['ch', VISEMES.CONS, DURATION.consonant],
  ['ph', VISEMES.FV, DURATION.consonant],
  ['wh', VISEMES.OO, DURATION.consonant],
  ['ck', VISEMES.CONS, DURATION.plosive],
  ['ng', VISEMES.CONS, DURATION.consonant],
  ['qu', VISEMES.OO, DURATION.consonant],
];

const SINGLES = {
  a: [VISEMES.AA, DURATION.vowel],
  e: [VISEMES.EE, DURATION.vowel],
  i: [VISEMES.EE, DURATION.vowel],
  o: [VISEMES.OH, DURATION.vowel],
  u: [VISEMES.OO, DURATION.vowel],
  y: [VISEMES.EE, DURATION.vowel],
  m: [VISEMES.MBP, DURATION.consonant],
  b: [VISEMES.MBP, DURATION.plosive],
  p: [VISEMES.MBP, DURATION.plosive],
  f: [VISEMES.FV, DURATION.consonant],
  v: [VISEMES.FV, DURATION.consonant],
  w: [VISEMES.OO, DURATION.consonant],
  l: [VISEMES.L, DURATION.consonant],
  r: [VISEMES.OH, DURATION.consonant],
};

/**
 * Convert text into a timed viseme sequence.
 *
 * @param {string} text
 * @param {{rate?: number, wordsPerMinute?: number}} [opts]
 *   `rate` is the synthesiser's rate multiplier (1 = normal).
 * @returns {{frames: Array<{viseme:string, at:number, duration:number, wordIndex:number, stress:number}>, duration:number, words: Array<{word:string, at:number, index:number}>}}
 */
export function textToVisemes(text, opts = {}) {
  const rate = Math.max(0.4, Math.min(2.5, opts.rate ?? 1));
  const scale = 1 / rate;
  const src = String(text ?? '');

  const frames = [];
  const words = [];
  let t = 0;
  let wordIndex = -1;

  // Split into words while keeping the punctuation that follows each one, since
  // punctuation is where the pauses live and pauses are most of what makes
  // synthetic speech readable.
  const tokens = src.match(/[A-Za-z']+|[.,;:!?…—-]+|\s+/g) ?? [];

  for (const token of tokens) {
    if (/^\s+$/.test(token)) continue;

    if (/^[.,;:!?…—-]+$/.test(token)) {
      const pause = /[.!?…]/.test(token) ? DURATION.sentence : /[,;:]/.test(token) ? DURATION.comma : DURATION.pause;
      frames.push({ viseme: VISEMES.REST, at: t, duration: pause * scale, wordIndex, stress: 0 });
      t += pause * scale;
      continue;
    }

    wordIndex += 1;
    words.push({ word: token, at: t, index: wordIndex });

    const lower = token.toLowerCase().replace(/'/g, '');
    let i = 0;
    let syllable = 0;

    while (i < lower.length) {
      let matched = null;

      for (const [graph, viseme, dur] of DIGRAPHS) {
        if (lower.startsWith(graph, i)) { matched = { viseme, dur, len: graph.length }; break; }
      }

      if (!matched) {
        const ch = lower[i];
        // A silent terminal 'e' changes the vowel before it rather than sounding.
        if (ch === 'e' && i === lower.length - 1 && lower.length > 2 && !VOWELS.includes(lower[i - 1])) {
          i += 1;
          continue;
        }
        const single = SINGLES[ch];
        matched = single
          ? { viseme: single[0], dur: single[1], len: 1 }
          : { viseme: VISEMES.CONS, dur: /[tdkgpbc]/.test(ch) ? DURATION.plosive : DURATION.consonant, len: 1 };
      }

      const isVowel = [VISEMES.AA, VISEMES.EE, VISEMES.OH, VISEMES.OO].includes(matched.viseme);
      if (isVowel) syllable += 1;

      // The first syllable of a word carries a little extra length and openness,
      // which is a cheap approximation of English stress and reads as natural.
      const stress = isVowel && syllable === 1 ? 1 : isVowel ? 0.6 : 0.2;
      const duration = matched.dur * scale * (stress === 1 ? 1.18 : 1);

      frames.push({ viseme: matched.viseme, at: t, duration, wordIndex, stress });
      t += duration;
      i += matched.len;
    }

    // A short coarticulatory gap between words, without fully closing the mouth.
    t += 26 * scale;
  }

  frames.push({ viseme: VISEMES.REST, at: t, duration: 200 * scale, wordIndex, stress: 0 });
  return { frames, duration: t + 200 * scale, words };
}

/**
 * Sample the timeline at a point in time, blending between adjacent shapes.
 *
 * Coarticulation — the way one mouth shape bleeds into the next — is what
 * separates lip sync that reads as speech from lip sync that reads as a slide
 * show, so shapes are interpolated rather than switched.
 *
 * @param {ReturnType<typeof textToVisemes>} timeline
 * @param {number} tMs
 * @returns {{open:number, width:number, round:number, teeth:number, tongue:number, viseme:string}}
 */
export function sampleViseme(timeline, tMs) {
  const frames = timeline.frames;
  if (!frames.length) return { ...VISEME_SHAPES.rest, viseme: VISEMES.REST };

  let index = 0;
  for (let i = 0; i < frames.length; i += 1) {
    if (tMs >= frames[i].at) index = i; else break;
  }

  const current = frames[index];
  const next = frames[index + 1];
  const shape = VISEME_SHAPES[current.viseme] ?? VISEME_SHAPES.rest;

  if (!next) return { ...shape, viseme: current.viseme };

  // Blend over the trailing 45% of each frame, so the mouth is already moving
  // toward the next shape before the current one ends.
  const elapsed = tMs - current.at;
  const blendStart = current.duration * 0.55;
  if (elapsed <= blendStart) return { ...shape, viseme: current.viseme };

  const k = Math.min(1, (elapsed - blendStart) / Math.max(1, current.duration - blendStart));
  const nextShape = VISEME_SHAPES[next.viseme] ?? VISEME_SHAPES.rest;
  const eased = k * k * (3 - 2 * k); // smoothstep

  return {
    open: lerp(shape.open, nextShape.open, eased),
    width: lerp(shape.width, nextShape.width, eased),
    round: lerp(shape.round, nextShape.round, eased),
    teeth: lerp(shape.teeth, nextShape.teeth, eased),
    tongue: lerp(shape.tongue, nextShape.tongue, eased),
    viseme: eased > 0.5 ? next.viseme : current.viseme,
  };
}

function lerp(a, b, t) { return a + (b - a) * t; }

/**
 * Re-anchor a timeline to a real word boundary reported by the synthesiser.
 *
 * Estimated durations drift; the boundary events are ground truth. Rather than
 * jumping the mouth, we scale the remaining frames so the correction is spread
 * out and invisible.
 *
 * @param {ReturnType<typeof textToVisemes>} timeline
 * @param {number} wordIndex
 * @param {number} actualMs
 */
export function reanchor(timeline, wordIndex, actualMs) {
  const word = timeline.words.find((w) => w.index === wordIndex);
  if (!word) return timeline;
  const drift = actualMs - word.at;
  if (Math.abs(drift) < 25) return timeline;

  const remaining = timeline.duration - word.at;
  if (remaining <= 0) return timeline;
  const factor = Math.max(0.55, Math.min(1.8, (remaining - drift) / remaining));

  for (const f of timeline.frames) {
    if (f.at < word.at) continue;
    f.at = word.at + (f.at - word.at) * factor + drift;
    f.duration *= factor;
  }
  for (const w of timeline.words) {
    if (w.at < word.at) continue;
    w.at = word.at + (w.at - word.at) * factor + drift;
  }
  timeline.duration = word.at + remaining * factor + drift;
  return timeline;
}
