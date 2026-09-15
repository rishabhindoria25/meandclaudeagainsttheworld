/**
 * Natural-language understanding for therapeutic dialogue.
 *
 * This is a deliberately transparent, rule-based parser rather than a neural
 * model. Three reasons, all clinical rather than technical:
 *
 *  1. It runs on the device with no network call, so nothing a person says in
 *     distress leaves their machine. Privacy is not a feature here, it is the
 *     precondition for honest disclosure.
 *  2. Every decision is inspectable. When the engine reflects a feeling back,
 *     you can see exactly which words produced it — which matters when the thing
 *     being modelled is somebody's suffering.
 *  3. It degrades predictably. A neural classifier that is wrong is wrong in
 *     unpredictable ways; this one is wrong in ways you can read and fix.
 *
 * Where a language model is available it is layered *on top* of this, never in
 * place of it: the safety and structure decisions stay here.
 */

import {
  EMOTION_FAMILIES, INTENSIFIERS, DOWNTONERS, NEGATORS, NEGATION_ESCAPES,
  CLAUSE_BOUNDARIES, CONTRACTIONS, MAX_TERM_WORDS, lookupEmotion,
  REFLECTION_FEELING_WORDS,
} from './lexicon.js';
import { detectDistortions } from './distortions.js';
import { assessRisk } from './risk.js';

/* ------------------------------------------------------------------ *
 * Text normalisation
 * ------------------------------------------------------------------ */

/** @param {string} text */
export function normalise(text) {
  let t = String(text ?? '').toLowerCase();
  t = t.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...');
  for (const [from, to] of Object.entries(CONTRACTIONS)) {
    t = t.replace(new RegExp(`\\b${from.replace(/'/g, "'")}\\b`, 'g'), to);
  }
  return t.replace(/\s+/g, ' ').trim();
}

/** @param {string} text */
export function tokenise(text) {
  return normalise(text).split(/[^a-z0-9']+/).filter(Boolean);
}

/** Split into sentences, keeping the original casing for later reflection work. */
export function splitSentences(text) {
  return String(text ?? '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/* ------------------------------------------------------------------ *
 * Affect
 * ------------------------------------------------------------------ */

const NEGATION_WINDOW = 4;

/**
 * Score emotional content with scoped negation and modifier handling.
 *
 * Negation is windowed and clause-bounded rather than global. "I'm not happy,
 * I'm exhausted" must not negate "exhausted", and "I'm not going to lie, I feel
 * awful" must not negate anything at all.
 *
 * @param {string} text
 * @returns {{families: Array<{family:string, score:number, terms:string[]}>, valence:number, arousal:number, intensity:number, primary:string|null, negatedFamilies:string[]}}
 */
export function scoreAffect(text) {
  const norm = normalise(text);
  const escapes = NEGATION_ESCAPES.filter((e) => norm.includes(e));
  const tokens = norm.split(/[^a-z0-9']+/).filter(Boolean);

  /** @type {Map<string, {score:number, terms:string[]}>} */
  const families = new Map();
  const negated = new Set();
  let i = 0;

  while (i < tokens.length) {
    let matched = null;
    // Longest-match n-gram scan so "no one cares" beats "cares".
    for (let n = Math.min(MAX_TERM_WORDS, tokens.length - i); n >= 1; n -= 1) {
      const phrase = tokens.slice(i, i + n).join(' ');
      const hits = lookupEmotion(phrase);
      if (hits.length) { matched = { phrase, hits, n }; break; }
    }
    if (!matched) { i += 1; continue; }

    // Modifiers: look back up to three tokens for intensifiers/downtoners.
    let modifier = 1;
    for (let back = 1; back <= 3 && i - back >= 0; back += 1) {
      const window = tokens.slice(i - back, i).join(' ');
      if (INTENSIFIERS[window]) { modifier *= INTENSIFIERS[window]; break; }
      if (DOWNTONERS[window]) { modifier *= DOWNTONERS[window]; break; }
    }

    // Negation: look back within a window, stopping at clause boundaries.
    let isNegated = false;
    for (let back = 1; back <= NEGATION_WINDOW && i - back >= 0; back += 1) {
      const tok = tokens[i - back];
      if (CLAUSE_BOUNDARIES.has(tok)) break;
      if (NEGATORS.includes(tok)) {
        const around = tokens.slice(Math.max(0, i - back - 2), i + matched.n).join(' ');
        if (!escapes.some((e) => around.includes(e))) isNegated = true;
        break;
      }
    }

    for (const hit of matched.hits) {
      const weight = hit.weight * modifier;
      if (isNegated) {
        negated.add(hit.family);
        // "Not happy" is weak evidence of low mood, not strong evidence of its opposite.
        const inverse = hit.v > 0 ? 'sadness' : 'calm';
        upsert(families, inverse, weight * 0.4, `not ${matched.phrase}`);
      } else {
        upsert(families, hit.family, weight, matched.phrase);
      }
    }
    i += matched.n;
  }

  // Punctuation and capitalisation carry arousal information that words do not.
  const raw = String(text ?? '');
  const exclamations = (raw.match(/!/g) || []).length;
  const shouting = /\b[A-Z]{3,}\b/.test(raw) && raw.length > 6;
  const arousalBoost = Math.min(0.2, exclamations * 0.06) + (shouting ? 0.12 : 0);

  const list = [...families.entries()]
    .map(([family, v]) => ({ family, score: Number(v.score.toFixed(3)), terms: v.terms }))
    .sort((a, b) => b.score - a.score);

  const total = list.reduce((s, f) => s + f.score, 0);
  const valence = total ? list.reduce((s, f) => s + EMOTION_FAMILIES[f.family].v * f.score, 0) / total : 0;
  const arousal = total
    ? Math.min(1, list.reduce((s, f) => s + EMOTION_FAMILIES[f.family].a * f.score, 0) / total + arousalBoost)
    : 0.35 + arousalBoost;

  return {
    families: list,
    valence: Number(valence.toFixed(3)),
    arousal: Number(arousal.toFixed(3)),
    intensity: Number(Math.min(1, total / 6).toFixed(3)),
    primary: list[0]?.family ?? null,
    negatedFamilies: [...negated],
  };
}

function upsert(map, family, score, term) {
  const cur = map.get(family) ?? { score: 0, terms: [] };
  cur.score += score;
  if (!cur.terms.includes(term)) cur.terms.push(term);
  map.set(family, cur);
}

/**
 * The feeling word Tom will use when reflecting, chosen for intensity band.
 * @param {string} family
 * @param {number} score
 */
export function feelingWord(family, score) {
  const band = score >= 4 ? 'high' : score >= 2 ? 'mid' : 'low';
  return REFLECTION_FEELING_WORDS[family]?.[band] ?? family;
}

/* ------------------------------------------------------------------ *
 * Motivational interviewing: change talk and sustain talk
 * ------------------------------------------------------------------ */

/**
 * DARN-CAT: Desire, Ability, Reason, Need (preparatory change talk) and
 * Commitment, Activation, Taking steps (mobilising change talk). Mobilising
 * change talk is the sub-type that actually predicts behaviour change, which is
 * why the two are counted separately rather than lumped into one score.
 */
const CHANGE_TALK = {
  // Desire talk is not always 'want to ...': 'I want things to be different' is
  // the same move with the verb phrase further out.
  desire:      [/\bi (want|wish|would like|would love|hope)\s+(to|it|this|that|things|something|life|them|him|her|us)\b/i, /\bi('?d| would) rather\b/i, /\bi (wanna|long to)\b/i],
  ability:     [/\bi (can|could|am able to|know how to)\b(?!\s*(not|n't)\b)/i, /\bi might be able to\b/i, /\bi think i could\b/i],
  reason:      [/\b(because|so that|it would (help|mean|be better)|the (reason|point) is)\b/i, /\bif i did,? (i|it)\b/i],
  need:        [/\bi (need|have) to\b/i, /\bi (really )?should\b/i, /\bsomething (has|needs) to (change|give)\b/i, /\bi can'?t (keep|go on) (like this|doing this)\b/i],
  commitment:  [/\bi (will|am going to|am gonna|intend to|promise to|plan to)\b/i, /\bi('?ve| have) decided\b/i, /\bi am ready to\b/i],
  activation:  [/\bi('?m| am) (ready|willing|prepared|thinking about|considering)\b/i, /\bi could (try|start)\b/i, /\bmaybe i (will|could|should)\b/i],
  // The adverb slot matters: "I finally called the doctor" is the highest-value
  // change talk there is, and an exact-adjacency pattern misses all of it.
  takingSteps: [
    /\bi\s+(?:finally|just|actually|really|even|already|eventually|today)?\s*(started|began|have been|tried|did|called|booked|signed up|went|spoke to|reached out|turned up|showed up|asked for)\b/i,
    /\bthis week i\b/i, /\bi managed to\b/i, /\balready (started|been)\b/i,
  ],
};

const SUSTAIN_TALK = [
  /\bi (can'?t|can ?not|could not|am not able to)\b/i,
  /\bit(?:'s| is) (too hard|impossible|not worth it|pointless)\b/i,
  /\bi('?ve| have) tried (everything|that|it) (and|but)\b/i,
  /\bi (don'?t|do not) (want|see the point|have the energy)\b/i,
  /\bthat (won'?t|would not) work (for me)?\b/i,
  /\bi'?m not (ready|going to|the kind of person)\b/i,
  /\bwhat(?:'s| is) the point\b/i,
  /\byes,? but\b/i,
];

/** Mobilising sub-types carry more predictive weight than preparatory ones. */
const MOBILISING = new Set(['commitment', 'activation', 'takingSteps']);

/** @param {string} text */
export function scoreChangeTalk(text) {
  const src = String(text ?? '');
  /** @type {Record<string, string[]>} */
  const hits = {};
  let preparatory = 0;
  let mobilising = 0;

  for (const [type, patterns] of Object.entries(CHANGE_TALK)) {
    for (const re of patterns) {
      const m = src.match(re);
      if (m) {
        (hits[type] ??= []).push(m[0].trim());
        if (MOBILISING.has(type)) mobilising += 1; else preparatory += 1;
        break;
      }
    }
  }

  const sustain = SUSTAIN_TALK.map((re) => src.match(re)?.[0]?.trim()).filter(Boolean);
  const changeScore = preparatory + mobilising * 2;
  const sustainScore = sustain.length;

  return {
    types: hits,
    preparatory,
    mobilising,
    sustain,
    changeScore,
    sustainScore,
    // Ambivalence is the signature of the evoking phase and calls for a
    // double-sided reflection rather than a push in either direction.
    ambivalent: changeScore > 0 && sustainScore > 0,
    ratio: sustainScore === 0 ? changeScore : Number((changeScore / (changeScore + sustainScore)).toFixed(2)),
  };
}

/* ------------------------------------------------------------------ *
 * Pragmatics and content
 * ------------------------------------------------------------------ */

const GREETINGS = /^(hi|hey|hello|yo|morning|good morning|good evening|good afternoon|hiya|sup|howdy|hi there)\b/i;
// 'i am going' alone matched 'I am going to be found out', which ended sessions
// mid-disclosure. A farewell needs an actual departure, not a future auxiliary.
const FAREWELLS = /\b(bye|goodbye|see you( later| soon)?|got to go|gotta go|have to go|need to go|talk later|speak (soon|later)|good ?night|thanks,? bye|i(?:'m| am) (off|going) (now|to bed|to sleep)|that(?:'s| is) enough for (today|now)|let(?:'s| us) (stop|leave it) (there|here))\b/i;
const ADVICE_SEEKING = /\b(what should i do|what do (you think|i do)|any (advice|ideas|tips)|how do i|can you (help|tell me)|tell me what to do|what would you do)\b/i;
const MINIMISING = /\b(it(?:'s| is) (not|no) (big deal|that bad|really anything)|i(?:'m| am) (fine|okay|ok|alright)|(never ?mind|forget it|it does not matter|it doesn'?t matter)|(i shouldn'?t complain)|(other people have it worse)|(sorry,? (for |i(?:'m| am) )?(rambling|ranting|venting|being dramatic|oversharing|going on|moaning|complaining)))\b/i;
const DEFLECTING = /\b(anyway|whatever|moving on|let(?:'s| us) (not|talk about something else)|i (don'?t|do not) want to talk about (it|that))\b/i;
const CHECKING_THE_AGENT = /\b(are you (a )?(real|human|bot|ai|robot|therapist)|do you (actually )?(care|understand|remember)|you(?:'re| are) (just )?(a|an) (bot|ai|program|computer)|is this (real|recorded|private)|who (can )?(sees|reads) this)\b/i;
const GRATITUDE_TO_AGENT = /\b(thank you|thanks|that (helped|helps|is helpful)|appreciate (it|you)|that(?:'s| is) (a good|a fair) point)\b/i;
const PUSHBACK = /\b(that(?:'s| is) not (it|what i|right|helpful)|you(?:'re| are) not (listening|getting it|understanding)|no,? that(?:'s| is) not|you keep (saying|asking)|stop (asking|saying)|that(?:'s| is) (useless|rubbish|nonsense)|this (is|isn'?t) (not )?(working|helping)|you don'?t (get|understand) it)\b/i;

const SOMATIC = /\b(chest|heart racing|stomach|sick|nausea|headache|shaking|trembling|sweating|dizzy|tight|can not breathe|breathless|tense|clenched|jaw|shoulders|throat)\b/i;
const SLEEP = /\b(sleep|sleeping|slept|insomnia|awake|nightmare|bed ?time|napping|3 ?am|four ?am|lying awake)\b/i;

/** Life domains, used to keep track of what a session has actually been about. */
const TOPIC_PATTERNS = {
  work:          /\b(work|job|boss|manager|career|office|colleague|coworker|redundan|fired|laid off|promotion|deadline|shift|unemployed|interview)\b/i,
  study:         /\b(uni|university|college|school|exam|dissertation|thesis|coursework|revision|degree|grades|lecturer|tutor)\b/i,
  relationship:  /\b(partner|boyfriend|girlfriend|husband|wife|marriage|divorce|breakup|broke up|dating|relationship|ex\b|affair|split up)\b/i,
  family:        /\b(mum|mom|dad|father|mother|parents|brother|sister|sibling|son|daughter|kids|children|family|grandma|grandad|in-laws|stepdad)\b/i,
  friendship:    /\b(friend|friends|mate|mates|friendship|fell out|social)\b/i,
  health:        /\b(diagnosis|illness|pain|chronic|surgery|hospital|doctor|medication|meds|symptoms|disability|scan|treatment)\b/i,
  money:         /\b(money|rent|debt|bills|afford|broke|financ|savings|mortgage|benefits|salary|cost of living)\b/i,
  grief:         /\b(died|death|funeral|passed away|grief|grieving|loss|bereave|anniversary of)\b/i,
  identity:      /\b(who i am|identity|purpose|meaning|myself|my life|the person i|coming out|gender|sexuality|faith|religion)\b/i,
  sleep:         SLEEP,
  self_worth:    /\b(confidence|self esteem|self-esteem|worth|good enough|proud of myself|imposter)\b/i,
  loneliness:    /\b(lonely|alone|isolated|no one|nobody|friendless|no friends)\b/i,
  substances:    /\b(drinking|drink|alcohol|drunk|weed|cannabis|cocaine|pills|sober|sobriety|relapse|using)\b/i,
  parenting:     /\b(my kids|my son|my daughter|parenting|childcare|school run|newborn|baby)\b/i,
};

/**
 * Pronoun analysis. First-person-singular density is one of the most replicated
 * linguistic correlates of depressed mood, and the I/we ratio tracks felt
 * isolation. Used as a soft signal only — never as a diagnostic claim.
 */
function pronounProfile(tokens) {
  const count = (set) => tokens.filter((t) => set.has(t)).length;
  const i = count(new Set(['i', 'me', 'my', 'myself', 'mine']));
  const we = count(new Set(['we', 'us', 'our', 'ourselves']));
  const you = count(new Set(['you', 'your', 'yours']));
  const they = count(new Set(['they', 'them', 'their', 'he', 'him', 'his', 'she', 'her', 'hers']));
  const total = tokens.length || 1;
  return {
    firstSingular: i, firstPlural: we, second: you, third: they,
    selfFocus: Number((i / total).toFixed(3)),
    // High self-focus with near-zero plural reference is a marker worth noticing.
    isolationIndex: Number((i / (i + we + 1)).toFixed(3)),
  };
}

/** Temporal orientation: rumination lives in the past, worry lives in the future. */
function temporalProfile(text) {
  const past = (text.match(/\b(was|were|had|did|used to|yesterday|last (week|night|year|month)|ago|when i was|back then|remember)\b/gi) || []).length;
  const future = (text.match(/\b(will|going to|gonna|tomorrow|next (week|month|year)|soon|what if|about to|later|upcoming)\b/gi) || []).length;
  const present = (text.match(/\b(am|is|are|now|right now|today|currently|at the moment|these days)\b/gi) || []).length;
  const total = past + future + present || 1;
  return {
    past, present, future,
    orientation: past >= future && past >= present ? 'past' : future > present ? 'future' : 'present',
    ruminationLean: Number((past / total).toFixed(2)),
    worryLean: Number((future / total).toFixed(2)),
  };
}

/**
 * Extract the clause most worth reflecting back — usually the one carrying the
 * emotional load, which is not always the longest or the last.
 * @param {string} text
 */
export function salientClause(text) {
  const sentences = splitSentences(text);
  if (!sentences.length) return '';
  let best = sentences[0];
  let bestScore = -Infinity;
  for (const s of sentences) {
    const affect = scoreAffect(s);
    const words = tokenise(s).length;
    // Favour emotionally loaded, first-person, reasonably-sized clauses.
    const score = affect.intensity * 3
      + (/\bi\b|\bmy\b|\bme\b/i.test(s) ? 1 : 0)
      + (words >= 4 && words <= 30 ? 0.5 : 0)
      - (words > 45 ? 1 : 0);
    if (score > bestScore) { bestScore = score; best = s; }
  }
  return best.trim();
}

/* ------------------------------------------------------------------ *
 * Top-level parse
 * ------------------------------------------------------------------ */

/**
 * @typedef {ReturnType<typeof parse>} Understanding
 */

/**
 * Parse a single user turn into everything the clinical director needs.
 * @param {string} text
 * @param {object} [context]
 * @param {number} [context.priorTier]
 * @param {string[]} [context.recentTexts]
 * @param {{arousal?:number, confidence?:number}} [context.prosody] Optional acoustic evidence
 */
export function parse(text, context = {}) {
  const raw = String(text ?? '');
  const norm = normalise(raw);
  const tokens = tokenise(raw);
  const sentences = splitSentences(raw);

  const affect = scoreAffect(raw);
  const risk = assessRisk(raw, context);
  const distortions = detectDistortions(raw);
  const changeTalk = scoreChangeTalk(raw);

  // Acoustic arousal, when available, is fused with lexical arousal. Voice is
  // often the earlier signal: people say "I'm fine" in a voice that is not.
  let arousal = affect.arousal;
  // Somatic description is itself evidence of activation. "My chest goes tight and
  // I think I am dying" contains no feeling word and is one of the most aroused
  // things a person can say.
  const somatic = SOMATIC.test(raw);
  if (somatic) arousal = Math.min(1, arousal + 0.22);
  let affectMismatch = false;
  if (context.prosody && Number.isFinite(context.prosody.arousal)) {
    const w = Math.min(0.45, Math.max(0, context.prosody.confidence ?? 0.5) * 0.45);
    arousal = Number(((1 - w) * affect.arousal + w * context.prosody.arousal).toFixed(3));
    affectMismatch = Math.abs(context.prosody.arousal - affect.arousal) > 0.45;
  }

  const topics = Object.entries(TOPIC_PATTERNS)
    .filter(([, re]) => re.test(raw))
    .map(([name]) => name);

  const wordCount = tokens.length;

  return {
    raw,
    normalised: norm,
    tokens,
    sentences,
    wordCount,
    salient: salientClause(raw),

    affect: { ...affect, arousal, affectMismatch },
    risk,
    distortions,
    changeTalk,

    pronouns: pronounProfile(tokens),
    temporal: temporalProfile(raw),
    topics,

    pragmatics: {
      isQuestion: /\?\s*$/.test(raw.trim()) || /^(what|why|how|when|where|who|do|does|did|can|could|should|would|is|are|am)\b/i.test(raw.trim()),
      isGreeting: GREETINGS.test(raw.trim()),
      isFarewell: FAREWELLS.test(raw),
      asksForAdvice: ADVICE_SEEKING.test(raw),
      minimising: MINIMISING.test(raw),
      deflecting: DEFLECTING.test(raw),
      checkingTheAgent: CHECKING_THE_AGENT.test(raw),
      thanking: GRATITUDE_TO_AGENT.test(raw),
      pushback: PUSHBACK.test(raw),
      somatic: SOMATIC.test(raw),
      // Very short turns after an open question often mean the question missed,
      // or that the person has gone guarded. Either way it is information.
      terse: wordCount > 0 && wordCount <= 3,
      // A bare assent is a reply to the previous turn, not new content. Reflecting
      // one back ("Yes ok, then.") is the single most robotic thing a listener can do.
      bareAssent: /^\s*(?:(?:yes|yeah|yep|yup|ok|okay|sure|alright|fine|please|go on|why not|lets?|let's|let us|do it|try it|try|ahead|go|i'?m up for it|i am up for it|sounds good|good)[\s,.!-]*){1,5}$/i.test(raw.trim()),
      bareDissent: /^\s*(?:(?:no|nope|nah|not now|not really|not today|rather not|pass|skip it|skip|thanks but no)[\s,.!-]*){1,4}$/i.test(raw.trim()),
      // "I don't know" is rarely literal. It usually means the question missed, or
      // the answer is not yet sayable, and both need something other than a reflection.
      dontKnow: /^\s*(i (do not|don'?t) know|dunno|idk|no idea|not sure|hard to say|i (do not|don'?t) know,? (i|maybe|really))\b/i.test(raw.trim()),
      silent: wordCount === 0,
      // Long uninterrupted turns usually mean the person needs space, not a technique.
      extended: wordCount > 90,
    },
  };
}
