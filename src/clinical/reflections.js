/**
 * Reflective listening.
 *
 * Reflection is the single highest-frequency skill in motivational interviewing
 * and the hardest to do well. The MITI fidelity coding system distinguishes
 * *simple* reflections (restating at the same level of meaning) from *complex*
 * ones (adding inferred meaning, feeling, or the unspoken next sentence), and
 * competence thresholds require both a high complex-to-simple ratio and at least
 * two reflections for every question asked.
 *
 * Both of those constraints are enforced by the director; this module supplies
 * the raw material. It builds reflections out of what the person actually said —
 * their nouns, their verbs, their images — rather than fitting their words into
 * a pre-written sentence, because a reflection that could have been produced
 * without listening is worse than no reflection at all.
 */

import { feelingWord, normalise } from './nlu.js';

/* ------------------------------------------------------------------ *
 * Person transformation
 * ------------------------------------------------------------------ */

/**
 * Ordered so multi-word forms are rewritten before their constituents:
 * "i am" must become "you are" before a bare "i" becomes "you".
 */
const PERSON_RULES = [
  [/\bi am\b/gi, 'you are'],
  [/\bi was\b/gi, 'you were'],
  [/\bi have been\b/gi, 'you have been'],
  [/\bi was not\b/gi, 'you were not'],
  [/\bam i\b/gi, 'are you'],
  [/\bwas i\b/gi, 'were you'],
  [/\bwe are\b/gi, 'you are'],
  [/\bwe were\b/gi, 'you were'],
  [/\bmyself\b/gi, 'yourself'],
  [/\bourselves\b/gi, 'yourselves'],
  [/\bmine\b/gi, 'yours'],
  [/\bmy\b/gi, 'your'],
  [/\bour\b/gi, 'your'],
  [/\bme\b/gi, 'you'],
  [/\bus\b/gi, 'you'],
  [/\bwe\b/gi, 'you'],
  [/\bi\b/gi, 'you'],
];

/** Filler and discourse markers that make a reflection sound like a transcript. */
const LEADING_FILLER = /^(so|and|but|like|well|um+|uh+|erm+|yeah|i mean|you know|basically|honestly|just|okay|ok)\b[,\s]*/i;
const TRAILING_FILLER = /[,\s]*\b(you know|i guess|i suppose|or whatever|and stuff|i dunno|i don't know|like)\b[.!?]*$/i;

/**
 * Rewrite a first-person clause into second person so it can be reflected.
 *
 * Returns `null` when the clause is addressed to Tom rather than about the
 * speaker ("do you actually understand me?"). Reflecting such a clause back
 * produces nonsense, and the caller should choose a different move.
 *
 * @param {string} clause
 * @returns {string|null}
 */
export function toSecondPerson(clause) {
  let text = String(clause ?? '').trim();
  if (!text) return null;

  // Second-person subjects mean the clause is about Tom, not about the speaker.
  if (/\byou(r|rs|rself)?\b/i.test(text) && !/\bi\b|\bmy\b|\bme\b/i.test(text)) return null;

  // Filler stacks ("so basically I…", "well I mean…"), so strip repeatedly.
  for (let i = 0; i < 3; i += 1) {
    const stripped = text.replace(LEADING_FILLER, '');
    if (stripped === text) break;
    text = stripped;
  }
  text = text.replace(TRAILING_FILLER, '');
  // Expand contractions first so the person rules see "i am", not "i'm".
  text = text
    .replace(/\bi'm\b/gi, 'i am').replace(/\bi've\b/gi, 'i have')
    .replace(/\bi'd\b/gi, 'i would').replace(/\bi'll\b/gi, 'i will')
    .replace(/\bwe're\b/gi, 'we are').replace(/\bwe've\b/gi, 'we have');

  for (const [re, to] of PERSON_RULES) text = text.replace(re, to);

  // Clean up artefacts and strip terminal punctuation so the caller can embed it.
  text = text.replace(/\s+/g, ' ').replace(/\s+([,.!?;:])/g, '$1').replace(/[.!?]+$/, '').trim();
  return text.length >= 2 ? decapitalise(text) : null;
}

function decapitalise(s) {
  // Leave acronyms and proper nouns alone; only lower an ordinary sentence-initial word.
  if (/^[A-Z]{2,}\b/.test(s)) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/** @param {string} s */
export function capitalise(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/* ------------------------------------------------------------------ *
 * Reflection frames
 * ------------------------------------------------------------------ */

/**
 * Frames are stems, not scripts. `{c}` is the transformed clause, `{f}` the
 * feeling word. Several deliberately have no stem at all: the strongest simple
 * reflection is often just the person's own sentence handed back, which invites
 * continuation instead of signalling that a technique is in progress.
 */
const SIMPLE_FRAMES = [
  '{C}.',
  'So {c}.',
  '{C}, then.',
  'Right — {c}.',
  'You are saying {c}.',
];

const COMPLEX_FEELING_FRAMES = [
  'It leaves you feeling {f}.',
  'You sound {f}.',
  'Underneath it, you sound {f}.',
  'My sense is you are feeling {f}.',
  'More than anything, you sound {f}.',
  '{C} — and feeling {f} underneath it.',
];

/**
 * Continuing-the-paragraph reflections, which guess the sentence the person has
 * not said yet. These are the highest-yield and highest-risk complex reflections:
 * when they land, people feel deeply understood; when they miss, they say so,
 * and the correction itself is useful. Tom offers them tentatively.
 */
const CONTINUATION_FRAMES = [
  'And part of you wonders {g}.',
  'It is almost as if {g}.',
  'My guess is {g} — tell me if that is off.',
  'I wonder whether {g}.',
  'Something in that sounds like {g}.',
];

const MEANING_FRAMES = [
  'What matters to you here is {m}.',
  'It sounds like this is really about {m}.',
  'Underneath it, {m} seems to be the thing.',
];

const DOUBLE_SIDED_FRAMES = [
  'So on the one hand {a} — and at the same time {b}.',
  '{A} — and right alongside that, {b}.',
  '{A}, and yet {b}. Both of those are true at once.',
  'One part of it: {a}. And the other part: {b}. That is a genuinely hard place to stand.',
];

const AFFIRMATION_FRAMES = [
  'It took something to {x}.',
  'You kept going anyway — that is not nothing.',
  '{X}. That is a real thing to have done.',
  'You did not have to {x}, and you did.',
  'That is you, looking after yourself.',
];

const TENTATIVE_HEDGES = ['I might have this wrong, but', 'Tell me if this misses, but', 'Correct me if not, but'];

/* ------------------------------------------------------------------ *
 * Generation
 * ------------------------------------------------------------------ */

/**
 * Tracks recently used frames so Tom does not fall into a verbal tic. Repetition
 * is the fastest way for a conversational agent to stop feeling like it is
 * listening — the words become a pattern the person can predict.
 */
export class FrameMemory {
  constructor(window = 6) { this.window = window; this.used = []; }
  /** @param {string[]} frames */
  pick(frames) {
    const fresh = frames.filter((f) => !this.used.includes(f));
    const pool = fresh.length ? fresh : frames;
    const choice = pool[Math.floor(Math.random() * pool.length)];
    this.used.push(choice);
    if (this.used.length > this.window) this.used.shift();
    return choice;
  }
  reset() { this.used = []; }
}

function fill(frame, vars) {
  return frame
    .replace(/\{C\}/g, capitalise(vars.c ?? ''))
    .replace(/\{c\}/g, vars.c ?? '')
    .replace(/\{f\}/g, vars.f ?? '')
    .replace(/\{g\}/g, vars.g ?? '')
    .replace(/\{m\}/g, vars.m ?? '')
    .replace(/\{A\}/g, capitalise(vars.a ?? ''))
    .replace(/\{a\}/g, vars.a ?? '')
    .replace(/\{b\}/g, vars.b ?? '')
    .replace(/\{X\}/g, capitalise(vars.x ?? ''))
    .replace(/\{x\}/g, vars.x ?? '');
}

/**
 * A simple reflection: same level of meaning, handed back.
 * @param {import('./nlu.js').Understanding} u
 * @param {FrameMemory} [memory]
 */
export function simpleReflection(u, memory = new FrameMemory()) {
  const c = toSecondPerson(u.salient || u.raw);
  if (!c) return null;
  return { type: 'simple', text: fill(memory.pick(SIMPLE_FRAMES), { c }), complex: false };
}

/**
 * A complex reflection that names the feeling the person did not name.
 * @param {import('./nlu.js').Understanding} u
 * @param {FrameMemory} [memory]
 */
export function feelingReflection(u, memory = new FrameMemory()) {
  const primary = u.affect.families[0];
  if (!primary) return null;
  const f = feelingWord(primary.family, primary.score);
  const c = toSecondPerson(u.salient || u.raw);

  // Handing back a word the person has already used is a simple reflection in a
  // complex reflection's clothes. Prefer the strongest family whose feeling word
  // is NOT already in what they said — usually the more avoided one, and the one
  // worth voicing.
  const said = u.normalised ?? String(u.raw ?? '').toLowerCase();
  const namesIt = (word) => word.split(/\s+/).some((token) => token.length > 3 && said.includes(token));

  let chosen = { family: primary.family, word: f };
  if (namesIt(f)) {
    for (const candidate of u.affect.families) {
      const word = feelingWord(candidate.family, candidate.score);
      if (!namesIt(word)) { chosen = { family: candidate.family, word }; break; }
    }
  }
  return {
    type: 'complex_feeling', complex: true,
    text: fill(memory.pick(COMPLEX_FEELING_FRAMES), { f: chosen.word, c }),
  };
}

/**
 * Continuing the paragraph: voice the next sentence the person has not said.
 * @param {import('./nlu.js').Understanding} u
 * @param {string} guess A second-person clause, e.g. "you will be found out"
 * @param {FrameMemory} [memory]
 */
export function continuationReflection(u, guess, memory = new FrameMemory()) {
  if (!guess) return null;
  const text = fill(memory.pick(CONTINUATION_FRAMES), { g: guess });
  return { type: 'continuation', complex: true, text };
}

/**
 * Reflect the value or need beneath the complaint. Complaints are values
 * speaking in the negative: someone furious about being ignored at work
 * usually cares a great deal about doing work that counts.
 */
const VALUE_INFERENCE = [
  { when: /\b(ignored|overlooked|not (heard|listened|seen)|dismissed|talked over|invisible)\b/i, value: 'being taken seriously' },
  { when: /\b(unfair|unjust|not fair|deserved|earned it|they got away)\b/i, value: 'fairness' },
  { when: /\b(let (them|him|her|everyone) down|disappoint|failed (them|him|her))\b/i, value: 'being someone people can rely on' },
  { when: /\b(alone|lonely|no one (there|around)|nobody (checks|calls))\b/i, value: 'being genuinely close to someone' },
  { when: /\b(control|out of control|powerless|helpless|no say|trapped)\b/i, value: 'having some say over your own life' },
  { when: /\b(pointless|meaningless|what is the point|no purpose)\b/i, value: 'your life adding up to something' },
  { when: /\b(not good enough|failure|useless|behind|inadequate)\b/i, value: 'being competent at something that matters to you' },
  { when: /\b(guilt|guilty|selfish|should have been there)\b/i, value: 'being a good person to the people you love' },
  { when: /\b(exhausted|burnt out|burned out|no energy|running on empty)\b/i, value: 'having a life with some room in it' },
  { when: /\b(judged|embarrass|humiliat|ashamed|what they think)\b/i, value: 'being accepted as you actually are' },
  { when: /\b(ended|broke up|left me|walked out|divorce|split up)\b/i, value: 'having someone who stays' },
  { when: /\b(hiding it|pretending|putting on a face|nobody knows|no one would guess)\b/i, value: 'being able to stop performing' },
  { when: /\b(not coping|barely coping|holding it together|keeping my head above water)\b/i, value: 'having enough room to actually manage' },
  { when: /\b(the only one|everyone else (is|seems) (fine|coping|okay))\b/i, value: 'not being alone in it' },
  { when: /\b(fraud|found out|imposter|impostor|do not deserve|don'?t deserve)\b/i, value: 'belonging where you have earned your place' },
  { when: /\b(stopped answering|shut everyone out|pulled away|cancelled on)\b/i, value: 'keeping the people who matter close' },
];

/**
 * @param {import('./nlu.js').Understanding} u
 * @param {FrameMemory} [memory]
 */
export function meaningReflection(u, memory = new FrameMemory()) {
  const hit = VALUE_INFERENCE.find((v) => v.when.test(u.raw));
  if (!hit) return null;
  return { type: 'complex_meaning', complex: true, text: fill(memory.pick(MEANING_FRAMES), { m: hit.value }), value: hit.value };
}

/**
 * Double-sided reflection: hold both sides of ambivalence in one sentence,
 * joined by "and" rather than "but", because "but" deletes everything before it
 * and quietly takes a side.
 *
 * @param {import('./nlu.js').Understanding} u
 * @param {FrameMemory} [memory]
 */
export function doubleSidedReflection(u, memory = new FrameMemory()) {
  if (!u.changeTalk.ambivalent) return null;

  const changeSource = Object.values(u.changeTalk.types).flat()[0];
  const sustainSource = u.changeTalk.sustain[0];
  if (!changeSource || !sustainSource) return null;

  // Recover each side's full clause from the original text so the reflection uses
  // the person's own reasons rather than a generic "you want to change".
  const a = clauseAround(u.raw, changeSource);
  const b = clauseAround(u.raw, sustainSource);
  const aT = toSecondPerson(a);
  const bT = toSecondPerson(b);
  if (!aT || !bT) return null;

  return { type: 'double_sided', complex: true, text: fill(memory.pick(DOUBLE_SIDED_FRAMES), { a: aT, b: bT }) };
}

/**
 * Extract the clause containing a matched fragment.
 *
 * Splits on sentence punctuation and on the contrastive conjunctions that mark
 * the seam of an ambivalent statement, then returns whichever segment the
 * fragment actually falls inside.
 */
function clauseAround(text, fragment) {
  const src = String(text ?? '');
  const frag = String(fragment ?? '');
  const idx = src.toLowerCase().indexOf(frag.toLowerCase());
  if (idx < 0 || !frag) return frag;

  const boundary = /(?:[.;!?]+\s*|,?\s+(?:but|yet|although|though|however|whereas)\s+)/gi;
  /** @type {Array<{start:number, end:number}>} */
  const segments = [];
  let cursor = 0;
  let m;
  while ((m = boundary.exec(src)) !== null) {
    segments.push({ start: cursor, end: m.index });
    cursor = m.index + m[0].length;
  }
  segments.push({ start: cursor, end: src.length });

  const hit = segments.find((seg) => idx >= seg.start && idx < seg.end);
  const slice = hit ? src.slice(hit.start, hit.end) : src;
  return slice.replace(/^[\s,]+|[\s,.;!?]+$/g, '').trim() || frag;
}

/**
 * Affirmation of effort, strength, or intention. MI distinguishes affirmations
 * from praise: praise ("well done!") positions the speaker as an evaluator,
 * while affirmation names something real the person did. Tom never says
 * "I'm proud of you" — it is not his to be proud of.
 *
 * @param {import('./nlu.js').Understanding} u
 * @param {FrameMemory} [memory]
 */
export function affirmation(u, memory = new FrameMemory()) {
  const steps = u.changeTalk.types.takingSteps?.[0];
  const commitment = u.changeTalk.types.commitment?.[0];
  const source = steps || commitment;
  if (source) {
    const x = toSecondPerson(clauseAround(u.raw, source));
    if (x) return { type: 'affirmation', complex: true, text: fill(memory.pick(AFFIRMATION_FRAMES), { x }) };
  }
  // Turning up and saying a hard thing out loud is itself worth naming.
  if (u.affect.intensity > 0.4 && u.wordCount > 15) {
    return { type: 'affirmation', complex: true, text: 'It is not easy to put that into words, and you just did.' };
  }
  return null;
}

/**
 * Collecting summary: gather several threads and hand them back, which both
 * demonstrates listening and lets the person hear the shape of their own story.
 *
 * @param {string[]} threads Second-person clauses gathered over the session
 * @param {{invite?: boolean}} [opts]
 */
export function summary(threads, opts = {}) {
  const items = threads.filter(Boolean).slice(-4);
  if (!items.length) return null;
  const body = items.length === 1
    ? items[0]
    : `${items.slice(0, -1).join('; ')}; and ${items[items.length - 1]}`;
  const invite = opts.invite === false ? '' : ' What have I missed?';
  return { type: 'summary', complex: true, text: `Let me see if I have this. ${capitalise(body)}.${invite}` };
}

/** Wrap a reflection in a hedge, for guesses that could miss. */
export function hedge(text, memory = new FrameMemory()) {
  const h = memory.pick(TENTATIVE_HEDGES);
  return `${h} ${decapitalise(text)}`;
}

/**
 * Choose the strongest available reflection for this turn.
 *
 * Ordering encodes a clinical preference: ambivalence is reflected before
 * anything else (it is the engine of change), then meaning, then feeling, and
 * only then a simple restatement.
 *
 * @param {import('./nlu.js').Understanding} u
 * @param {FrameMemory} [memory]
 * @param {{preferSimple?: boolean, guess?: string}} [opts]
 */
export function reflect(u, memory = new FrameMemory(), opts = {}) {
  if (opts.preferSimple) return simpleReflection(u, memory) ?? feelingReflection(u, memory);
  return doubleSidedReflection(u, memory)
    ?? (opts.guess ? continuationReflection(u, opts.guess, memory) : null)
    ?? meaningReflection(u, memory)
    ?? feelingReflection(u, memory)
    ?? simpleReflection(u, memory);
}

export { normalise };
