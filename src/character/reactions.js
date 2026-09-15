/**
 * What Tom does when you touch him.
 *
 * The reaction table is the heart of the toy. Two rules shape all of it:
 *
 *  1. **Instant and specific.** Every region does something different, and it
 *     happens on the same frame as the touch. Generic or delayed reactions are
 *     what make an interactive character feel like a button instead of an animal.
 *  2. **Never punishing, never needy.** He is not hurt by rough handling and he
 *     does not sulk, because a companion that can be damaged puts the burden of
 *     looking after it onto someone who came here to be looked after. Equally he
 *     does not escalate his charm to keep you touching him. The original app's
 *     "punch him until he is knocked out" loop is the one thing from it that is
 *     deliberately not reproduced.
 *
 * `say` lines are rare by design — a cat that comments on every stroke is
 * exhausting, and during a difficult conversation it would be an interruption.
 */

import { GESTURE } from './touch.js';

/**
 * @typedef {object} Reaction
 * @property {string} id
 * @property {string} gesture         Animator gesture to play
 * @property {string} [sound]         Key into REACTION_SOUNDS, or 'sneeze'
 * @property {{family:string, intensity:number}} [emotion]
 * @property {string[]} [say]         Occasional lines, chosen at random
 * @property {number} [sayChance]     0..1, default 0
 * @property {number} cooldownMs
 * @property {boolean} [soothing]     Counts as regulating rather than playful
 * @property {boolean} [playful]      Suppressed while risk is present
 */

/** Keyed `${region}:${gestureType}`, with `${region}:*` and `*:${gestureType}` fallbacks. */
export const REACTIONS = {
  /* ---- petting: the soothing half ---- */
  'head:stroke': {
    id: 'pet_head', gesture: 'lean_into', emotion: { family: 'calm', intensity: 0.55 },
    cooldownMs: 0, soothing: true,
    say: ['That is nice.', 'Mm. Keep going if you like.'], sayChance: 0.05,
  },
  'cheek:stroke': {
    id: 'pet_cheek', gesture: 'lean_into', emotion: { family: 'calm', intensity: 0.6 },
    cooldownMs: 0, soothing: true,
  },
  'body:stroke': {
    id: 'pet_body', gesture: 'lean_into', emotion: { family: 'calm', intensity: 0.5 },
    cooldownMs: 0, soothing: true,
  },
  'belly:stroke': {
    id: 'pet_belly', gesture: 'squirm', emotion: { family: 'joy', intensity: 0.4 },
    sound: 'trill', cooldownMs: 900, playful: true,
    say: ['Careful. That is a trap and I am not responsible for what happens.'], sayChance: 0.12,
  },
  'muzzle:stroke': {
    id: 'pet_chin', gesture: 'lean_into', emotion: { family: 'calm', intensity: 0.65 },
    cooldownMs: 0, soothing: true,
  },
  'ear_l:stroke': { id: 'pet_ear', gesture: 'lean_into', emotion: { family: 'calm', intensity: 0.55 }, cooldownMs: 0, soothing: true },
  'ear_r:stroke': { id: 'pet_ear', gesture: 'lean_into', emotion: { family: 'calm', intensity: 0.55 }, cooldownMs: 0, soothing: true },

  /* ---- a hand simply resting on him ---- */
  '*:hold': {
    id: 'rest_hand', gesture: 'slow_blink', emotion: { family: 'connection', intensity: 0.5 },
    cooldownMs: 2600, soothing: true,
    say: ['I am not going anywhere.'], sayChance: 0.08,
  },

  /* ---- taps: noticing you ---- */
  'head:tap': { id: 'tap_head', gesture: 'slow_blink', sound: 'chirp', emotion: { family: 'calm', intensity: 0.4 }, cooldownMs: 420 },
  'ear_l:tap': { id: 'tap_ear', gesture: 'ear_flick', sound: 'chirp', cooldownMs: 320 },
  'ear_r:tap': { id: 'tap_ear', gesture: 'ear_flick', sound: 'chirp', cooldownMs: 320 },
  'ear_l:poke': { id: 'poke_ear', gesture: 'ear_flick', sound: 'yelp', cooldownMs: 300, playful: true },
  'ear_r:poke': { id: 'poke_ear', gesture: 'ear_flick', sound: 'yelp', cooldownMs: 300, playful: true },

  'nose:tap': {
    id: 'boop', gesture: 'sneeze', sound: 'sneeze', emotion: { family: 'joy', intensity: 0.35 },
    cooldownMs: 1500, playful: true,
    say: ['Boop received.', 'That tickles.'], sayChance: 0.18,
  },
  'nose:poke': { id: 'boop_hard', gesture: 'sneeze', sound: 'sneeze', cooldownMs: 1500, playful: true },

  'eye_l:tap': { id: 'eye_poke', gesture: 'startle', sound: 'yelp', cooldownMs: 700, playful: true },
  'eye_r:tap': { id: 'eye_poke', gesture: 'startle', sound: 'yelp', cooldownMs: 700, playful: true },

  'belly:tap': {
    id: 'belly_poke', gesture: 'squirm', sound: 'trill', emotion: { family: 'joy', intensity: 0.5 },
    cooldownMs: 600, playful: true,
  },
  'belly:poke': { id: 'belly_jab', gesture: 'squirm', sound: 'yelp', cooldownMs: 500, playful: true },

  'paw_l:tap': { id: 'paw', gesture: 'paw_tuck', sound: 'chirp', cooldownMs: 600, playful: true },
  'paw_r:tap': { id: 'paw', gesture: 'paw_tuck', sound: 'chirp', cooldownMs: 600, playful: true },

  /* ---- the tail: he minds, and says so, and that is the end of it ---- */
  'tail:drag': {
    id: 'tail_pull', gesture: 'grumble', sound: 'grumble', emotion: { family: 'anger', intensity: 0.3 },
    cooldownMs: 1200, playful: true,
    say: ['Ow. Still attached, though.', 'I felt that.'], sayChance: 0.25,
  },
  'tail:tap': { id: 'tail_tap', gesture: 'ear_flick', cooldownMs: 500 },
  'tail:poke': { id: 'tail_poke', gesture: 'grumble', sound: 'grumble', cooldownMs: 900, playful: true },

  /* ---- fallbacks ---- */
  '*:poke': { id: 'poke', gesture: 'startle', sound: 'yelp', cooldownMs: 420, playful: true },
  '*:tap': { id: 'tap', gesture: 'ear_flick', sound: 'chirp', cooldownMs: 380 },
  '*:stroke': { id: 'stroke', gesture: 'lean_into', emotion: { family: 'calm', intensity: 0.45 }, cooldownMs: 0, soothing: true },
  '*:drag': { id: 'drag', gesture: 'grumble', cooldownMs: 700, playful: true },
};

/** Cheeks share one reaction; normalise the side away before lookup. */
function canonical(region) {
  if (region === 'cheek_l' || region === 'cheek_r') return 'cheek';
  return region;
}

/**
 * Resolve a touch into a reaction.
 *
 * @param {{type:string, region:string|null}} gesture
 * @param {{riskTier?:number, lastFired?:Record<string, number>, now?:number}} [context]
 * @returns {Reaction|null}
 */
export function resolveReaction(gesture, context = {}) {
  if (!gesture?.type) return null;
  const region = canonical(gesture.region ?? 'body');
  const now = context.now ?? Date.now();

  const candidate = REACTIONS[`${region}:${gesture.type}`]
    ?? REACTIONS[`*:${gesture.type}`]
    ?? null;
  if (!candidate) return null;

  // While there is any risk signal, the comedy stops. A cat sneezing for laughs
  // in the middle of a disclosure would be grotesque; being stroked would not,
  // so soothing contact stays available the whole way through.
  if ((context.riskTier ?? 0) > 0 && candidate.playful) {
    return candidate.soothing ? candidate : null;
  }

  const lastFired = context.lastFired ?? {};
  if (candidate.cooldownMs && now - (lastFired[candidate.id] ?? -Infinity) < candidate.cooldownMs) {
    return null;
  }

  return candidate;
}

/** @param {Reaction} reaction */
export function pickLine(reaction, random = Math.random) {
  if (!reaction?.say?.length) return null;
  if (random() > (reaction.sayChance ?? 0)) return null;
  return reaction.say[Math.floor(random() * reaction.say.length)];
}

/**
 * Lines for sustained stroking, offered at thresholds rather than continuously.
 *
 * The second one is the point of the whole feature: it converts idle petting
 * into paced breathing, which is a real distress-tolerance skill and the fastest
 * non-pharmacological way to shift arousal. Someone too wound up to accept an
 * "exercise" will often accept it framed as stroking a cat.
 */
export const STROKE_MILESTONES = [
  { atCredit: 3, id: 'purring', text: null, gesture: 'slow_blink' },
  {
    atCredit: 6,
    id: 'breathe_with',
    text: 'If you want — try breathing out while you stroke, and in on the way back. No particular reason. It just tends to help.',
    gesture: 'lean_into',
  },
  {
    atCredit: 10,
    id: 'still_here',
    text: 'Still here. Whenever you are ready to say the thing.',
    gesture: 'slow_blink',
  },
];

/**
 * @param {number} credit
 * @param {Set<string>} already
 */
export function strokeMilestone(credit, already) {
  for (const milestone of STROKE_MILESTONES) {
    if (credit >= milestone.atCredit && !already.has(milestone.id)) return milestone;
  }
  return null;
}

/** What Tom says the first time handling gets rough. Curious, never a telling-off. */
export const AGITATION_LINES = [
  'You are giving me a proper going over there. I do not mind at all — is something wound up?',
  'I can take it, for the record. But that is a lot of poking. What is going on?',
];
