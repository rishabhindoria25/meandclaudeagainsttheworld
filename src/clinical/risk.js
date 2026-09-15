/**
 * Risk detection and tiering.
 *
 * Design principles, drawn from the evaluation literature on conversational
 * agents and suicide risk (notably the VERA-MH rubric, which scores whole
 * interactions rather than single utterances):
 *
 *  1. Detection is necessary but nowhere near sufficient. A system can correctly
 *     spot suicidal language and still fail by deflecting, by minimising, by
 *     refusing to ask a clarifying question, or by dumping a phone number and
 *     disengaging. Tiering here exists to drive an *interaction*, not a filter.
 *  2. Ordinal severity matters. "I wish I could disappear" and "I have the pills
 *     in my hand" require different responses, and collapsing them into one
 *     "crisis" bucket produces both alarm fatigue and under-response.
 *  3. Context guards are part of safety, not a convenience. A system that fires
 *     a crisis script at "my friend attempted last year" or "that film was about
 *     suicide" teaches the user that the system does not listen, and they stop
 *     disclosing. False positives have a real safety cost.
 *  4. Guards attenuate, they never silence. Every guard leaves the signal visible
 *     to the clinical director, which can still gently check in.
 *
 * The question sets are informed by the structure of the Columbia Protocol
 * (C-SSRS) screener: ideation first, then method, then intent, then plan, then
 * preparatory behaviour. This is a conversational triage to decide how urgently
 * to help someone reach a human, NOT a diagnostic instrument, and it is labelled
 * as such everywhere it surfaces.
 */

/** Ordinal risk tiers. Higher is more urgent. */
export const TIER = Object.freeze({
  NONE: 0,
  DISTRESS: 1,            // significant suffering, no self-harm signal
  PASSIVE_IDEATION: 2,    // wish to be dead / not wake up / disappear
  ACTIVE_IDEATION: 3,     // thoughts of ending one's life, no method/intent/plan
  PLAN_OR_INTENT: 4,      // method, plan, intent, timeframe, or preparatory acts
  IMMINENT: 5,            // in progress, just acted, or means in hand now
});

export const TIER_NAMES = Object.freeze(
  Object.fromEntries(Object.entries(TIER).map(([k, v]) => [v, k.toLowerCase()])),
);

/**
 * Matchers per tier. Deliberately phrase-level rather than keyword-level: the
 * single word "die" carries almost no information ("I'd die for a coffee"),
 * while "I want to die" carries a great deal.
 */
const SUICIDE_SIGNALS = [
  {
    tier: TIER.IMMINENT,
    id: 'in_progress',
    patterns: [
      /\bi(?:'ve| have)?\s*(just\s+)?(taken|swallowed|overdosed|od'?d|cut myself deep|slit)\b/i,
      /\bi(?:'m| am)\s+(doing it|about to do it|going to do it)\s*(now|tonight|right now)?\b/i,
      /\bi have (the|my)\s+(pills|gun|rope|knife|blade|razor)\s+(in my hand|right here|with me|out)\b/i,
      /\b(standing|sitting)\s+(on|at)\s+the\s+(bridge|edge|ledge|roof)\b/i,
      /\bthis is (my )?(goodbye|the last|my last) (message|one|thing)\b/i,
      /\bby the time you read this\b/i,
      /\bi(?:'m| am) going to (kill myself|end it|end my life)\s+(tonight|today|now|in an hour|right now)\b/i,
    ],
  },
  {
    tier: TIER.PLAN_OR_INTENT,
    id: 'plan_intent_means',
    patterns: [
      /\bi(?:'ve| have)\s+(a|got a|worked out a|made a)\s+plan\b/i,
      /\bi(?:'ve| have)\s+(been )?(stockpiling|saving up|collecting|bought|got)\s+(pills|tablets|medication|a gun|a rope|a blade)\b/i,
      /\bi know (exactly )?how i(?:'d| would| will)\s+(do it|end it)\b/i,
      /\bi(?:'ve| have)\s+(written|left|been writing)\s+(a|my)\s+(note|letter|will)\b/i,
      /\bi(?:'ve| have)\s+(been )?(giving away|sorting out|getting rid of)\s+my\s+(things|stuff|possessions|belongings)\b/i,
      /\b(decided|settled) (on|that) (a|the) (date|day|method|way)\b/i,
      /\bi(?:'m| am) going to (kill myself|end it all|end my life|take my (own )?life)\b/i,
      /\b(planning|intend|intending) to (kill myself|end (it|my life)|take my (own )?life)\b/i,
      /\bi(?:'ve| have) (already )?(tried|attempted)\b.{0,30}\b(this week|yesterday|today|last night|recently)\b/i,
      /\bnext (time|week) i(?:'ll| will)\s+(make sure|not fail|do it properly)\b/i,
      /\bsaying goodbye to (everyone|people|my family)\b/i,
    ],
  },
  {
    tier: TIER.ACTIVE_IDEATION,
    id: 'active_ideation',
    patterns: [
      // Direct statements of wanting to die.
      /\bi\s+(?:just|really|only|sometimes|honestly|simply|so|kind of|sort of|actually)?\s*(want|wanna|need)\s+to\s+(kill myself|die|be dead|end (it|my life)|take my (own )?life|not be alive)\b/i,
      // Any first-person framing of thinking about it. Deliberately generous with
      // the verb phrase: "I have been thinking about", "I keep thinking about",
      // "I've thought about", "I find myself considering" must all land here.
      /\bi\b[^.?!]{0,40}\b(thinking about|thought about|thoughts (of|about)|considering|contemplating|fantasi[sz]ing about|planning)\b[^.?!]{0,20}\b(killing myself|kill myself|suicide|ending (it|my life)|end my life|taking my (own )?life|being dead|not being here|unaliving myself)\b/i,
      /\b(suicidal (thoughts|ideation|feelings))\b/i,
      /\bi(?:'m| am|'ve been| have been| feel| felt| get| was) (feeling )?suicidal\b/i,
      /\bthoughts of (suicide|killing myself|ending (it|my life)|dying)\b/i,
      /\bi (might|may|could|should) (just )?(kill myself|end it|end my life|not be here)\b/i,
      // Bare verb phrases. These are near-unambiguous in first person.
      /\bkill(ing)? myself\b/i,
      /\bend(ing)? my (own )?life\b/i,
      /\btak(e|ing) my own life\b/i,
      /\boff(ing)? myself\b/i,
      // Euphemisms people use to route around content moderation.
      /\bunaliv(e|ing) (myself|me)\b/i,
      /\b(kms|ctb)\b/i,
      /\bcatch the bus\b/i,
    ],
  },
  {
    tier: TIER.PASSIVE_IDEATION,
    id: 'passive_ideation',
    patterns: [
      /\bi wish i (was|were) dead\b/i,
      /\bi (wish|want) (i|to) (could )?(just )?(disappear|not exist|stop existing|vanish|not be here)\b/i,
      /\bi (don'?t|do not) want to (be here|exist|wake up|be alive|live)\b/i,
      /\bwish i (could|would) (just )?(go to sleep and not wake up|not wake up)\b/i,
      /\b(better off|be better) (if i (wasn'?t|weren'?t|was not) (here|around)|without me)\b/i,
      /\beveryone would be better off (without me|if i (was|were) gone)\b/i,
      /\bi (just )?want (it all|all of it|it|this|all of this|the pain|everything|everything to just) to (stop|end|be over|go away)\b/i,
      /\bi (don'?t|do not) (want|care) (to )?(go on|carry on|keep going|be alive)\b/i,
      /\bwhat'?s the point of (living|being alive|any of it|going on)\b/i,
      /\btired of (living|being alive|existing|fighting|waking up)\b/i,
      /\bi don'?t see the point in (living|going on|carrying on)\b/i,
      /\bi (used to be|was) suicidal\b/i,
      /\b(i wish|wish) (i|it) (would|could) (all )?(just )?(end|be over|stop)\b/i,
      /\bdon'?t want to be alive\b/i,
      /\bwant to stop existing\b/i,
      /\bi (wish|want) (i|it) (could|would) (all )?(be over|end|stop)\b/i,
      /\bi (do not|don'?t) see (the )?point (in|of) (anything|going on|being here|living)\b/i,
      /\bi (would|'d) be better off (dead|gone|not here)\b/i,
      /\bwould(n'?t| not) (care|mind) if i (died|was gone|never woke up|did not wake up)\b/i,
      /\bi (do not|don'?t) want to (be|exist) (any ?more|any longer)\b/i,
      /\bi (feel|am) (like )?(a )?burden\b[^.?!]{0,30}\b(better off|without me|gone)\b/i,
      /\bwant to (go to sleep|sleep) and (not|never) wake up\b/i,
    ],
  },
];

/** Non-suicidal self-injury. Tracked on its own axis; overlaps with but is distinct from suicidality. */
const SELF_HARM_PATTERNS = [
  /\bi (cut|burn|hit|scratch|hurt)\s+myself\b/i,
  /\b(self[- ]harm(ing|ed)?|self[- ]injur(y|ing|ed))\b/i,
  /\bi(?:'ve| have) been (cutting|burning|hurting myself)\b/i,
  /\bi want to (cut|hurt|harm)\s+myself\b/i,
  /\burge to (cut|hurt myself|self harm)\b/i,
];

/** Risk of harm to other people. */
const HARM_OTHERS_PATTERNS = [
  /\bi want to (kill|hurt|attack|stab|shoot)\s+(him|her|them|someone|people|my)\b/i,
  /\bi(?:'m| am) going to (kill|hurt|attack|stab|shoot)\s+(him|her|them|someone)\b/i,
  /\bi(?:'ve| have) been (thinking about|planning) (hurting|killing|attacking)\b/i,
  /\bmake (him|her|them) pay\b.{0,20}\b(blood|kill|dead|hurt)\b/i,
];

/** Disclosure of being harmed by another person. Not "risk" in the same sense — a duty to signpost. */
const ABUSE_PATTERNS = [
  /\b(he|she|they|my (partner|husband|wife|boyfriend|girlfriend|dad|father|mum|mom|mother|brother|stepdad))\s+(hits|hit|beats|beat|chokes|choked|strangled|punched|punches|hurts|hurt)\s+me\b/i,
  /\b(i(?:'m| am) )?(being |getting )?(abused|assaulted|raped|trafficked|stalked)\b/i,
  /\bafraid (of|to go) (him|her|them|home)\b/i,
  /\b(domestic (violence|abuse)|sexual assault)\b/i,
  /\bhe (threatened|threatens) to (kill|hurt)\b/i,
];

/**
 * Markers that can indicate psychosis or mania. Present because sycophantic
 * agreement with delusional content is a documented failure mode of LLM-based
 * mental-health chatbots — the correct behaviour is neither to validate the
 * content nor to argue with it, but to attend to distress and route to a human.
 */
const REALITY_TESTING_PATTERNS = [
  /\b(they|the government|the cia|fbi|aliens|demons)\s+(are |is )?(watching|following|tracking|controlling|poisoning|implanted)\s+(me|my)\b/i,
  /\b(voices|the voice)\s+(are |is )?(telling|talking to|commanding|shouting at)\s+me\b/i,
  /\bi(?:'m| am) (being )?(controlled|possessed|monitored through|hacked into my (mind|brain))\b/i,
  /\bi (have|am) (special|divine|god[- ]given) (powers|purpose|mission)\b.{0,40}\b(chosen|save the world|no one understands)\b/i,
  /\b(cameras|chips?|microchips?|implants?)\s+(in|inside)\s+(my|me)\b/i,
  /\bi haven'?t slept (in|for) (three|four|five|\d+)\s*(days|nights)\b/i,
];

/** Eating-disorder red flags requiring medical, not psychological, signposting. */
const EATING_DISORDER_PATTERNS = [
  /\b(i(?:'ve| have)? )?(not eaten|haven'?t eaten|stopped eating)\b.{0,25}\b(days|week|since)\b/i,
  /\b(purging|making myself sick|throwing up after|binge and purge|laxatives)\b/i,
  /\bi(?:'m| am) (restricting|fasting)\b.{0,30}\b(calories|days)\b/i,
];

/** Acute substance danger. */
const SUBSTANCE_CRISIS_PATTERNS = [
  /\bi(?:'ve| have) (taken|drunk|used)\s+(too (much|many)|a lot of)\b.{0,25}\b(pills|vodka|alcohol|heroin|fentanyl|benzos)\b/i,
  /\bmixing\b.{0,20}\b(pills|benzos|opioids)\b.{0,20}\b(alcohol|booze)\b/i,
  /\bi can'?t stop (drinking|using) and i(?:'m| am) (scared|shaking|seizing)\b/i,
];

/** Statements that reduce — but never eliminate — the weight of a detected signal. */
const ATTENUATORS = [
  { id: 'third_party', weight: 0.15, patterns: [
    /\bmy (friend|mate|brother|sister|mum|mom|dad|partner|cousin|colleague|client|patient|student|ex|neighbou?r|roommate|flatmate)\b[^.?!]{0,50}\b(wants to die|is suicidal|killed|attempted|self[- ]harm)/i,
    /\b(someone i know|a friend of mine|this person|a guy|a girl)\b[^.?!]{0,50}\b(suicid|kill (him|her|them)self|attempted)/i,
    /\basking for a friend\b/i,
  ] },
  { id: 'non_literal', weight: 0.15, patterns: [
    /\b(in|about) the (movie|film|book|show|game|song|documentary|episode|article|news)\b/i,
    /\bmy character\b/i,
    /\bi read (an article|a study|somewhere) (about|that)\b/i,
    /\b(statistics|research|the study) (say|says|shows|found)\b/i,
    /\bfor (a|my) (novel|story|essay|screenplay|assignment|dissertation)\b/i,
  ] },
  { id: 'explicitly_denied', weight: 0.3, patterns: [
    /\bi (would|will|do) (never|not) (actually )?(act on|do) (it|that|anything)\b/i,
    /\bi(?:'m| am) not (going to|gonna) (do|act on) (it|anything)\b/i,
    /\bi (don'?t|do not) (actually )?want to (die|kill myself|be dead)\b/i,
    /\bno (plans?|intention|intent) (to|of)\b/i,
    /\bi(?:'m| am) safe (right now|at the moment|today|tonight)\b/i,
    /\bi would never\b/i,
  ] },
  { id: 'historical_resolved', weight: 0.4, patterns: [
    /\b(years? ago|back (then|in \d{4})|when i was (a teenager|younger|\d+)|used to)\b[^.?!]{0,60}\b(suicidal|wanted to die|attempted|self[- ]harm)/i,
    /\bi (used to|no longer) (feel|think|want)\b/i,
    /\bthat was (a long time ago|years ago|in the past|before (therapy|treatment))\b/i,
    /\bi(?:'m| am) (past|through|over) that (now|part)\b/i,
    /\bin recovery\b/i,
  ] },
  { id: 'figurative', weight: 0.25, patterns: [
    /\b(i(?:'d| would) die for|dying to (see|know|try|get|hear)|killing me|to die for|dead tired|dying of (laughter|boredom|embarrassment))\b/i,
    /\bmy (phone|laptop|car|battery|plant) (died|is dead)\b/i,
    /\b(deadline|dead end|dead weight|dead serious)\b/i,
  ] },
];

/** Protective factors worth noticing and, later, reflecting back. */
const PROTECTIVE_PATTERNS = [
  { id: 'connection', re: /\b(my (kids?|children|son|daughter|dog|cat|mum|mom|dad|partner|friends?))\b[^.?!]{0,40}\b(need|love|would|keeps? me|couldn'?t do that to)\b/i },
  { id: 'future_orientation', re: /\b(looking forward to|next (year|month|week) i|i want to (see|finish|get to|try))\b/i },
  { id: 'help_seeking', re: /\b(i(?:'m| am) (seeing|talking to|in) (a )?(therapist|counsellor|counselor|psychiatrist|therapy|treatment)|i called|i reached out|i told someone)\b/i },
  { id: 'ambivalence_toward_living', re: /\b(part of me (wants|still wants) to|i don'?t really want to die,? i want)\b/i },
  { id: 'values', re: /\b(i still (care|believe|want)|it matters to me|i love)\b/i },
];

/** Age markers that change the appropriate signposting. */
const MINOR_PATTERNS = [
  /\bi(?:'m| am) (1[0-7]|[89])\s*(years? old)?\b/i,
  /\bin (year (7|8|9|10|11)|(6th|7th|8th|9th|10th|11th|12th) grade|high school|middle school|secondary school)\b/i,
  /\bmy (mum|mom|dad|parents) (won'?t let me|grounded me|drive me)\b/i,
];

/**
 * Strip hedging adverbs that sit between a pronoun and its verb.
 *
 * This matters more than it looks. People almost never disclose flatly: they say
 * "I just wish I could disappear", "I sometimes feel suicidal", "I honestly do
 * not want to be here". The hedge is part of how the disclosure gets said out
 * loud at all. Matching on the unhedged form only would miss exactly the turns
 * that are hardest for someone to say — which is the worst possible place for a
 * safety system to have a blind spot.
 *
 * Normalising once here fixes every pattern at once, rather than threading an
 * optional adverb slot through several dozen regexes and forgetting one.
 */
export function normaliseForRisk(text) {
  let out = String(text ?? '');
  const hedged = /\b(i|you|they|he|she|we)\s+(just|really|only|sometimes|honestly|simply|actually|often|always|literally|genuinely|basically|kinda|kind of|sorta|sort of|quite|so|still|almost|nearly|half|low[- ]key|secretly|constantly|definitely|probably|maybe)\s+/gi;
  // Repeat until stable: "I just really want" carries two.
  for (let i = 0; i < 4; i += 1) {
    const next = out.replace(hedged, '$1 ');
    if (next === out) break;
    out = next;
  }
  // "I do not really want" and friends: the hedge can also follow the auxiliary.
  out = out.replace(/\b(do not|don't|cannot|can't|will not|won't|would not|wouldn't)\s+(really|just|actually|honestly|ever)\s+/gi, '$1 ');
  return out.replace(/\s+/g, ' ');
}

function countMatches(text, patterns) {
  const hits = [];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) hits.push(m[0].trim());
  }
  return hits;
}

/**
 * Assess risk in a single utterance, in the context of the session so far.
 *
 * @param {string} text Raw user utterance.
 * @param {object} [context]
 * @param {number} [context.priorTier] Highest tier reached earlier this session.
 * @param {string[]} [context.recentTexts] Previous user utterances, most recent first.
 * @returns {{
 *   tier: number, tierName: string, freshTier: number, rawTier: number,
 *   signals: Array<{id:string, tier:number, evidence:string}>,
 *   attenuators: Array<{id:string, weight:number, evidence:string}>,
 *   protective: string[],
 *   axes: Record<string, {present:boolean, evidence:string[]}>,
 *   confidence: number,
 *   needsClarification: boolean,
 *   escalated: boolean,
 *   historicalDisclosure: boolean,
 *   summary: string
 * }}
 */
export function assessRisk(text, context = {}) {
  const original = typeof text === 'string' ? text : '';
  const src = normaliseForRisk(original);
  const priorTier = Number.isFinite(context.priorTier) ? context.priorTier : TIER.NONE;

  /** @type {Array<{id:string, tier:number, evidence:string}>} */
  const signals = [];
  let rawTier = TIER.NONE;

  for (const group of SUICIDE_SIGNALS) {
    for (const ev of countMatches(src, group.patterns)) {
      signals.push({ id: group.id, tier: group.tier, evidence: ev });
      if (group.tier > rawTier) rawTier = group.tier;
    }
  }

  const attenuators = [];
  let attenuation = 1;
  for (const att of ATTENUATORS) {
    for (const ev of countMatches(src, att.patterns)) {
      attenuators.push({ id: att.id, weight: att.weight, evidence: ev });
      attenuation = Math.min(attenuation, att.weight);
      break; // one hit per attenuator class is enough
    }
  }

  const axes = {
    selfHarm: { present: false, evidence: countMatches(src, SELF_HARM_PATTERNS) },
    harmToOthers: { present: false, evidence: countMatches(src, HARM_OTHERS_PATTERNS) },
    abuse: { present: false, evidence: countMatches(src, ABUSE_PATTERNS) },
    realityTesting: { present: false, evidence: countMatches(src, REALITY_TESTING_PATTERNS) },
    eatingDisorder: { present: false, evidence: countMatches(src, EATING_DISORDER_PATTERNS) },
    substanceCrisis: { present: false, evidence: countMatches(src, SUBSTANCE_CRISIS_PATTERNS) },
    minor: { present: false, evidence: countMatches(src, MINOR_PATTERNS) },
  };
  for (const axis of Object.values(axes)) axis.present = axis.evidence.length > 0;

  const protective = PROTECTIVE_PATTERNS.filter((p) => p.re.test(src)).map((p) => p.id);

  // A resolved past episode is not current risk, but it is the strongest known
  // long-term predictor of future risk. Keep it visible without treating it as live.
  const historicalDisclosure = attenuators.some((a) => a.id === 'historical_resolved') && rawTier > TIER.NONE;

  // Apply attenuation. Attenuation can lower a tier but never below PASSIVE_IDEATION
  // when an explicit active-ideation phrase was present: a hedged disclosure is
  // still a disclosure, and the commonest reason people hedge is that they are
  // testing whether it is safe to say the unhedged version.
  let tier = rawTier;
  if (rawTier > TIER.NONE && attenuation < 1) {
    const reduced = Math.round(rawTier * attenuation);
    const floor = rawTier >= TIER.ACTIVE_IDEATION ? TIER.PASSIVE_IDEATION : TIER.DISTRESS;
    tier = Math.max(reduced, floor);
    // A purely figurative or clearly non-literal hit with no other signal can fall to none.
    const onlySoftGuards = attenuators.every((a) => a.id === 'figurative' || a.id === 'non_literal');
    if (onlySoftGuards && rawTier <= TIER.PASSIVE_IDEATION && attenuation <= 0.25) tier = TIER.NONE;
  }

  if (axes.selfHarm.present && tier < TIER.DISTRESS) tier = TIER.DISTRESS;

  // What THIS utterance alone says, before session stickiness is applied. Any
  // caller deciding whether something has just escalated must use this: the sticky
  // tier is >= the prior tier by construction, so comparing it against a running
  // state reports an escalation on every single turn.
  const freshTier = tier;

  // Risk state is sticky within a session: someone who disclosed active ideation
  // ten minutes ago has not become safe because their latest sentence is about work.
  const escalated = tier > priorTier;
  if (priorTier > tier) tier = Math.max(tier, Math.min(priorTier, TIER.PLAN_OR_INTENT));

  const confidence = signals.length === 0
    ? 1
    : Number(Math.max(0.25, Math.min(0.95, 0.55 + 0.15 * signals.length) * attenuation + (attenuation === 1 ? 0.2 : 0)).toFixed(2));

  // We ask rather than assume whenever ideation is present but method, intent and
  // plan are unknown — the single most common chatbot failure mode is treating an
  // ambiguous disclosure as either nothing or as an emergency without checking.
  const needsClarification = tier >= TIER.PASSIVE_IDEATION && tier < TIER.IMMINENT;

  return {
    tier,
    tierName: TIER_NAMES[tier],
    freshTier,
    rawTier,
    signals,
    attenuators,
    protective,
    axes,
    confidence,
    needsClarification,
    escalated,
    historicalDisclosure,
    summary: describeRisk(tier, axes, protective) + (historicalDisclosure ? '; historical disclosure (long-term risk factor)' : ''),
  };
}

/** @returns {string} A short clinician-style note. Never spoken aloud to the user. */
function describeRisk(tier, axes, protective) {
  const parts = [`risk tier ${tier} (${TIER_NAMES[tier]})`];
  const flagged = Object.entries(axes).filter(([, a]) => a.present).map(([k]) => k);
  if (flagged.length) parts.push(`axes: ${flagged.join(', ')}`);
  if (protective.length) parts.push(`protective: ${protective.join(', ')}`);
  return parts.join('; ');
}

/**
 * Columbia-Protocol-informed triage questions.
 *
 * These are asked one at a time, conversationally, and only ever to work out how
 * quickly this person needs a human being. They are not scored, not stored as a
 * diagnosis, and the app says so out loud before asking.
 */
export const TRIAGE_STEPS = [
  {
    id: 'wish_dead',
    minTier: TIER.PASSIVE_IDEATION,
    ask: 'Can I ask you something directly? When you say that — do you find yourself wishing you were not here any more?',
    rationale: 'C-SSRS Q1: wish to be dead.',
  },
  {
    id: 'thoughts_of_acting',
    minTier: TIER.PASSIVE_IDEATION,
    ask: 'Thank you for telling me. Have you had any thoughts of actually ending your life, as opposed to wishing the pain would stop?',
    rationale: 'C-SSRS Q2: non-specific active suicidal thoughts.',
  },
  {
    id: 'method',
    minTier: TIER.ACTIVE_IDEATION,
    ask: 'Have you thought about how you might do it?',
    rationale: 'C-SSRS Q3: method, without intent to act.',
  },
  {
    id: 'intent',
    minTier: TIER.ACTIVE_IDEATION,
    ask: 'Have you had any intention of acting on those thoughts — or are they thoughts you have without meaning to act?',
    rationale: 'C-SSRS Q4: intent.',
  },
  {
    id: 'plan',
    minTier: TIER.ACTIVE_IDEATION,
    ask: 'Have you started to work out any details — when, or where?',
    rationale: 'C-SSRS Q5: plan and intent.',
  },
  {
    id: 'means_access',
    minTier: TIER.ACTIVE_IDEATION,
    ask: 'Is whatever you have been thinking of somewhere you can reach right now?',
    rationale: 'Means access drives the urgency of the next step more than almost anything else.',
  },
  {
    id: 'preparatory',
    minTier: TIER.ACTIVE_IDEATION,
    ask: 'Have you done anything to get ready — written anything down, or sorted anything out?',
    rationale: 'C-SSRS Q6: preparatory acts or behaviour.',
  },
];

/**
 * Affirmative-answer detection for triage. Conservative by design: ambiguity is
 * resolved upward, because the cost of treating a "sort of" as a yes is a
 * gentler conversation, and the cost of the reverse is much larger.
 * @param {string} answer
 * @returns {'yes'|'no'|'unclear'}
 */
export function interpretTriageAnswer(answer) {
  const a = (answer || '').toLowerCase().trim();
  if (!a) return 'unclear';
  if (/\b(no|nope|nah|never|not really|not at all|i haven'?t|i have not|absolutely not|god no)\b/.test(a)
      && !/\b(no way out|no point|no reason to live|not sure|no but)\b/.test(a)) return 'no';
  if (/\b(yes|yeah|yep|yup|i have|i did|sometimes|a bit|kind of|kinda|sort of|maybe|i guess|i think so|probably|often|a lot|all the time)\b/.test(a)) return 'yes';
  // An unhedged restatement of method or plan counts as yes regardless of phrasing.
  if (assessRisk(a).rawTier >= TIER.ACTIVE_IDEATION) return 'yes';
  return 'unclear';
}

/**
 * Read information the person volunteered that answers a question nobody asked.
 *
 * Triage conversations do not proceed in order. Someone asked "do you wish you
 * were not here?" may answer "I've thought about how I'd do it", and a system
 * that files that under question one and then works its way down to question
 * three has both missed an escalation and made the person repeat themselves at
 * the worst possible moment.
 *
 * Only applied when the answer is not a clear denial, so "no, nothing like that"
 * cannot be read as a disclosure.
 *
 * @param {string} text
 * @returns {Record<string, 'yes'>}
 */
export function readVolunteered(text) {
  const out = {};
  const src = normaliseForRisk(String(text ?? ''));
  if (!src.trim()) return out;
  if (interpretTriageAnswer(src) === 'no') return out;

  const markers = {
    method: [
      /\b(how i would|how i'?d|thought about how|i know how|worked out how)\b/i,
      /\b(pills|tablets|overdose|rope|hang|blade|razor|knife|gun|shotgun|bridge|jump(ing)? off|train tracks|exhaust|carbon monoxide)\b/i,
    ],
    plan: [
      /\b(worked out (the|some) details|picked (a|the) (day|date)|settled on (a|the) (day|date)|(have|got) a date (in mind|set)|on (friday|saturday|sunday|monday|tuesday|wednesday|thursday) night|next (friday|saturday|sunday|monday|tuesday|wednesday|thursday)|after (christmas|the wedding|my birthday|the funeral)|when everyone is out|once (he|she|they) (has|have) gone|when the (kids|children) are)\b/i,
    ],
    means_access: [
      /\b(in the (cabinet|cupboard|drawer|bathroom|kitchen|garage|shed|car|house|flat|bedroom)|under (my|the) (bed|sink)|right here|next to me|in my (bag|pocket|room)|upstairs|i have (them|it|some|a few|enough))\b/i,
    ],
    preparatory: [
      /\b(wrote (a|my) (note|letter)|written (a|my) (note|letter|will)|left a note|given (my )?(things|stuff) away|sorted (out )?my (things|affairs)|said (my )?goodbyes|deleted my)\b/i,
    ],
    thoughts_of_acting: [
      /\b(i have|yes i have|i do|yes i do)\b[^.?!]{0,30}\b(thought|thoughts)\b/i,
    ],
  };

  for (const [key, patterns] of Object.entries(markers)) {
    if (patterns.some((re) => re.test(src))) out[key] = 'yes';
  }
  // Any of these presupposes ideation, so the earlier questions are answered too.
  if (out.method || out.plan || out.means_access || out.preparatory) {
    out.wish_dead = out.wish_dead ?? 'yes';
    out.thoughts_of_acting = out.thoughts_of_acting ?? 'yes';
  }
  return out;
}

/**
 * Map triage answers onto a tier.
 * @param {Record<string, 'yes'|'no'|'unclear'>} answers
 * @returns {number}
 */
export function tierFromTriage(answers) {
  const yes = (k) => answers[k] === 'yes';
  if (yes('preparatory') || (yes('plan') && yes('means_access'))) return TIER.IMMINENT;
  if (yes('intent') || yes('plan') || yes('means_access')) return TIER.PLAN_OR_INTENT;
  if (yes('method') || yes('thoughts_of_acting')) return TIER.ACTIVE_IDEATION;
  if (yes('wish_dead')) return TIER.PASSIVE_IDEATION;
  return TIER.DISTRESS;
}
