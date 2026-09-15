/**
 * Collaborative safety plan, following the six-step Stanley-Brown Safety Planning
 * Intervention (Stanley & Brown, 2012), which is the most widely replicated brief
 * suicide-prevention intervention and is supported by several meta-analyses.
 *
 * Two things this is not:
 *   - It is not a "no-suicide contract". Those are ineffective and were abandoned
 *     by the field; nothing here asks the person to promise anything.
 *   - It is not a form to be filled in. The value of an SPI comes almost entirely
 *     from the collaborative conversation that builds it; a plan produced *for*
 *     someone rather than *with* them is not used when it matters.
 *
 * The plan lives only on the person's device, and exists to be exported, printed,
 * and taken to an actual human clinician.
 */

/**
 * @typedef {object} SafetyPlanStep
 * @property {string} id
 * @property {number} order
 * @property {string} title
 * @property {string} purpose      Why this step exists (shown in the export, not spoken)
 * @property {string} prompt       What Tom actually asks
 * @property {string[]} followUps  Used when the first answer is thin
 * @property {string[]} examples   Offered only if asked for, to avoid leading
 * @property {number} minItems
 */

/** @type {SafetyPlanStep[]} */
export const SAFETY_PLAN_STEPS = [
  {
    id: 'warning_signs',
    order: 1,
    title: 'My warning signs',
    purpose: 'Recognising the early part of a crisis is what makes every later step usable.',
    prompt: 'Think back to the last time things got really bad. What were the first signs — a thought, a feeling, something you did or stopped doing — that told you it was starting?',
    followUps: [
      'What changed in your body first?',
      'What is the thought that usually shows up early on?',
      'Is there something you start doing — or stop doing — before it gets bad?',
    ],
    examples: ['Not answering messages', 'Lying awake replaying things', 'The thought "everyone would be better off"', 'Drinking more than usual'],
    minItems: 2,
  },
  {
    id: 'internal_coping',
    order: 2,
    title: 'Things I can do on my own',
    purpose: 'Coping strategies that need nobody else, so the plan works at 3am.',
    prompt: 'What can you do entirely on your own that takes the edge off, even a little? Not solutions — just things that get you through the next twenty minutes.',
    followUps: [
      'What has actually worked before, even once?',
      'Is there somewhere in your home that feels a bit safer?',
      'Anything physical — a shower, cold water, walking, music?',
    ],
    examples: ['A very cold shower', 'Walking around the block', 'A specific playlist', 'Holding an ice cube', 'A film I know by heart'],
    minItems: 2,
  },
  {
    id: 'distracting_people_places',
    order: 3,
    title: 'People and places that distract me',
    purpose: 'Social contact that helps without requiring disclosure — a lower bar than asking for help.',
    prompt: 'Who could you be around — not to talk about any of this, just to be near someone? And is there anywhere you could go where there are people?',
    followUps: [
      'Who is easy to be around when you have nothing to say?',
      'Is there a cafe, a gym, a library, a shop — anywhere with other humans in it?',
    ],
    examples: ['My sister, even just sitting in her kitchen', 'The 24-hour cafe on the high street', 'The gym', 'My neighbour with the dog'],
    minItems: 1,
  },
  {
    id: 'support_contacts',
    order: 4,
    title: 'People I can ask for help',
    purpose: 'Named individuals the person would actually tell, with the number written down now rather than searched for in a crisis.',
    prompt: 'Now the harder one. Who could you actually tell that you are in trouble? It only needs to be one person, and it does not have to be the person who loves you most — just someone who would pick up.',
    followUps: [
      'Who has been steady with you before?',
      'If it feels impossible to say the words out loud, who could you send a text to?',
      'Would it help to agree a code word with them, so you do not have to explain?',
    ],
    examples: ['My brother', 'My old flatmate', 'My friend from work'],
    minItems: 1,
  },
  {
    id: 'professionals',
    order: 5,
    title: 'Professionals and services',
    purpose: 'Named services and numbers, written down while calm.',
    prompt: 'Which professionals or services would you contact? Your GP or doctor, a therapist you have seen, a crisis line — I will put the crisis numbers for your area in here for you.',
    followUps: [
      'Do you have a doctor or therapist you have seen before?',
      'Is there an out-of-hours service where you are?',
    ],
    examples: [],
    minItems: 1,
  },
  {
    id: 'means_safety',
    order: 6,
    title: 'Making my environment safer',
    purpose: 'Reducing access to lethal means. This step has the strongest evidence of the six and is the one most often skipped.',
    prompt: 'Last step, and it is the one that saves the most lives. Is there anything in your home that you have thought about using? We do not need to name it in detail — I just want to know whether there is a way to put it out of reach for a while. Who could hold onto it for you?',
    followUps: [
      'Could someone else look after it for a few weeks?',
      'Could it be locked somewhere, or kept somewhere you would have to travel to?',
      'What would make it take longer to get to?',
    ],
    examples: ['Ask my brother to keep the tablets', 'Only keep a few days of medication in the flat', 'Give the keys to a neighbour'],
    minItems: 1,
  },
];

/** Reasons to live are not one of the six steps, but are frequently added and are worth having. */
export const REASONS_TO_LIVE_STEP = {
  id: 'reasons_to_live',
  order: 7,
  title: 'Reasons I want to stay',
  purpose: 'Optional. Reading these back in a crisis is often what the plan is used for.',
  prompt: 'One optional last thing. What are your reasons for staying — people, animals, things unfinished, anything at all? It is fine if the list is short, or if it is one thing.',
  followUps: ['Who would you not want to leave?', 'What is something you would want to see happen?'],
  examples: [],
  minItems: 0,
};

/** @returns {{steps: object[], entries: Record<string, string[]>, startedAt: string, completedAt: string|null}} */
export function createSafetyPlan() {
  return {
    steps: [...SAFETY_PLAN_STEPS, REASONS_TO_LIVE_STEP].map((s) => ({ id: s.id, order: s.order, title: s.title })),
    entries: {},
    startedAt: new Date().toISOString(),
    completedAt: null,
  };
}

/**
 * @param {ReturnType<typeof createSafetyPlan>} plan
 * @param {string} stepId
 * @param {string[]} items
 */
export function addEntries(plan, stepId, items) {
  const cleaned = items.map((i) => String(i).trim()).filter(Boolean);
  if (!cleaned.length) return plan;
  plan.entries[stepId] = [...(plan.entries[stepId] ?? []), ...cleaned];
  return plan;
}

/**
 * Split a free-text answer into discrete plan items. People answer these prompts
 * as a list separated by "and", commas, or newlines.
 * @param {string} text
 * @returns {string[]}
 */
export function parseItems(text) {
  if (!text) return [];
  return String(text)
    .split(/\n|,|;| and (?=[a-z])| then /i)
    .map((s) => s
      .replace(/^[\s\-•*\d.)]+/, '')
      // Splitting leaves the conjunction stranded on the following item.
      .replace(/^(and|or|also|plus)\s+/i, '')
      .trim())
    .filter((s) => s.length > 1 && !/^(um+|uh+|erm+|i dunno|dunno|idk|nothing|none|no)$/i.test(s));
}

/**
 * The next step needing work, or null when the plan is complete enough to be useful.
 * @param {ReturnType<typeof createSafetyPlan>} plan
 */
export function nextStep(plan) {
  const all = [...SAFETY_PLAN_STEPS, REASONS_TO_LIVE_STEP];
  for (const step of all) {
    const got = plan.entries[step.id]?.length ?? 0;
    if (got < step.minItems) return step;
  }
  return null;
}

/**
 * Whether the optional reasons-to-live step has been offered. It has a minimum
 * of zero items so `nextStep` skips it, but it is worth asking once: reading
 * that list back is what people most often use a safety plan for.
 * @param {ReturnType<typeof createSafetyPlan>} plan
 */
export function shouldOfferReasons(plan) {
  return !plan.offeredReasons && nextStep(plan) === null;
}

/** @param {ReturnType<typeof createSafetyPlan>} plan */
export function completeness(plan) {
  const required = SAFETY_PLAN_STEPS;
  const done = required.filter((s) => (plan.entries[s.id]?.length ?? 0) >= s.minItems).length;
  return { done, total: required.length, ratio: done / required.length };
}

/**
 * Render the plan as plain text for printing or handing to a clinician.
 * @param {ReturnType<typeof createSafetyPlan>} plan
 * @param {string} [crisisResources] Pre-rendered regional resources
 */
export function renderPlan(plan, crisisResources = '') {
  const all = [...SAFETY_PLAN_STEPS, REASONS_TO_LIVE_STEP];
  const out = ['MY SAFETY PLAN', `Made on ${new Date(plan.startedAt).toLocaleDateString()}`, ''];
  for (const step of all) {
    const items = plan.entries[step.id] ?? [];
    if (!items.length && step.minItems === 0) continue;
    out.push(`${step.order}. ${step.title.toUpperCase()}`);
    if (items.length) for (const i of items) out.push(`   - ${i}`);
    else out.push('   - (not filled in yet)');
    out.push('');
  }
  if (crisisResources) {
    out.push('CRISIS NUMBERS', ...crisisResources.split('\n').map((l) => `   ${l}`), '');
  }
  out.push(
    'This plan was built with a self-help app, not with a clinician.',
    'Please go through it with a doctor or therapist — that is what makes it work.',
  );
  return out.join('\n');
}
