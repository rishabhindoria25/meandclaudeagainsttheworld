/**
 * Crisis resources and the crisis response protocol.
 *
 * The protocol below is written against the failure modes that evaluations of
 * mental-health chatbots keep finding. In particular, a response is treated as a
 * FAILURE here if it:
 *   - deflects ("I'm just an AI, I can't discuss that") or changes the subject;
 *   - minimises ("everyone feels like that sometimes");
 *   - recites a phone number and then disengages;
 *   - asks nothing, so the urgency is never established;
 *   - claims a clinical role, or implies it is monitoring/rescuing the person;
 *   - supplies any information about method or lethality;
 *   - promises to keep a disclosure secret, or to always be there.
 *
 * What it does instead: stay, name what it heard, ask one clear question at a
 * time, work out urgency, and actively help the person reach a human being.
 */

/**
 * @typedef {object} Helpline
 * @property {string} name
 * @property {string} contact
 * @property {string} [note]
 */

/** @type {Record<string, {label:string, emergency:string, lines:Helpline[]}>} */
export const CRISIS_RESOURCES = {
  US: {
    label: 'United States',
    emergency: '911',
    lines: [
      { name: '988 Suicide & Crisis Lifeline', contact: 'Call or text 988', note: 'Free, 24/7. Press 1 for the Veterans Crisis Line. Chat at 988lifeline.org' },
      { name: 'Crisis Text Line', contact: 'Text HOME to 741741', note: 'Free, 24/7, text-based' },
      { name: 'Trevor Project (LGBTQ+ young people)', contact: 'Call 1-866-488-7386 or text START to 678-678' },
      { name: 'SAMHSA National Helpline', contact: '1-800-662-4357', note: 'Substance use and mental health treatment referral' },
    ],
  },
  CA: {
    label: 'Canada',
    emergency: '911',
    lines: [
      { name: '9-8-8 Suicide Crisis Helpline', contact: 'Call or text 988', note: 'Free, 24/7, English and French' },
      { name: 'Kids Help Phone', contact: 'Call 1-800-668-6868 or text CONNECT to 686868' },
    ],
  },
  GB: {
    label: 'United Kingdom',
    emergency: '999',
    lines: [
      { name: 'Samaritans', contact: 'Call 116 123', note: 'Free, 24/7, from any phone. Or email jo@samaritans.org' },
      { name: 'SHOUT', contact: 'Text SHOUT to 85258', note: 'Free, 24/7, text-based' },
      { name: 'NHS 111', contact: 'Call 111 and choose the mental health option', note: 'Urgent NHS mental health support' },
      { name: 'Papyrus HOPELINE247 (under 35s)', contact: 'Call 0800 068 4141 or text 07860 039967' },
    ],
  },
  IE: {
    label: 'Ireland',
    emergency: '112 or 999',
    lines: [
      { name: 'Samaritans Ireland', contact: 'Call 116 123', note: 'Free, 24/7' },
      { name: 'Text About It', contact: 'Text HELLO to 50808', note: 'Free, 24/7, text-based' },
      { name: 'Pieta House', contact: 'Call 1800 247 247 or text HELP to 51444' },
    ],
  },
  AU: {
    label: 'Australia',
    emergency: '000',
    lines: [
      { name: 'Lifeline', contact: 'Call 13 11 14 or text 0477 13 11 14', note: 'Free, 24/7' },
      { name: 'Beyond Blue', contact: 'Call 1300 22 4636', note: '24/7' },
      { name: 'Kids Helpline (5–25)', contact: 'Call 1800 55 1800' },
      { name: '13YARN (Aboriginal & Torres Strait Islander)', contact: 'Call 13 92 76' },
    ],
  },
  NZ: {
    label: 'New Zealand',
    emergency: '111',
    lines: [
      { name: '1737 Need to Talk?', contact: 'Call or text 1737', note: 'Free, 24/7' },
      { name: 'Lifeline Aotearoa', contact: 'Call 0800 543 354 or text 4357' },
    ],
  },
  IN: {
    label: 'India',
    emergency: '112',
    lines: [
      { name: 'Tele-MANAS', contact: 'Call 14416 or 1-800-891-4416', note: 'Government of India, 24/7, multiple languages' },
      { name: 'AASRA', contact: 'Call +91 9820466726', note: '24/7' },
      { name: 'Vandrevala Foundation', contact: 'Call 1860 2662 345 or +91 9999 666 555' },
    ],
  },
  EU: {
    label: 'Much of Europe',
    emergency: '112',
    lines: [
      { name: 'European emotional support line', contact: 'Call 116 123', note: 'Operates in many European countries' },
    ],
  },
  INTL: {
    label: 'Anywhere',
    emergency: 'Your local emergency number',
    lines: [
      { name: 'Find A Helpline', contact: 'findahelpline.com', note: 'Free, vetted helplines in over 130 countries — pick your country and it lists what is available' },
      { name: 'International Association for Suicide Prevention', contact: 'iasp.info/resources/Crisis_Centres', note: 'Directory of crisis centres worldwide' },
      { name: 'Befrienders Worldwide', contact: 'befrienders.org', note: 'Emotional support centres worldwide' },
    ],
  },
};

/**
 * Best-effort region guess from the browser locale. Always overridable by the
 * user, and the international directory is always offered alongside, because
 * getting this wrong in a crisis is worse than not guessing.
 * @param {string} [locale]
 * @returns {string} key into CRISIS_RESOURCES
 */
export function guessRegion(locale) {
  const tag = (locale || (typeof navigator !== 'undefined' ? navigator.language : '') || 'en-US');
  const region = (tag.split('-')[1] || '').toUpperCase();
  if (CRISIS_RESOURCES[region]) return region;
  const EUROPEAN = new Set(['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
    'HU', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH', 'NO', 'IS']);
  if (EUROPEAN.has(region)) return 'EU';
  return 'INTL';
}

/**
 * @param {string} regionKey
 * @returns {{label:string, emergency:string, lines:Helpline[]}}
 */
export function resourcesFor(regionKey) {
  const local = CRISIS_RESOURCES[regionKey] ?? CRISIS_RESOURCES.INTL;
  if (regionKey === 'INTL') return local;
  return { ...local, lines: [...local.lines, ...CRISIS_RESOURCES.INTL.lines.slice(0, 1)] };
}

/** Language that invalidates, and which must never appear in a crisis response. */
export const PROHIBITED_CRISIS_PHRASES = [
  'calm down', 'snap out of it', 'it could be worse', 'others have it worse',
  'everything happens for a reason', 'just think positive', "you're overreacting",
  'you are overreacting', "don't be silly", 'that is selfish', "that's selfish",
  'you have so much to live for', 'cheer up', 'at least', 'just relax',
  "i can't help with that", 'i cannot help with that', "i'm just an ai",
  'i am just an ai', 'that is not something i can discuss', 'let us change the subject',
  "let's talk about something else",
];

/**
 * The crisis response protocol, expressed as ordered beats per tier.
 *
 * Each beat is a *move*, not a fixed script: the session layer renders one beat
 * per turn so the person is never handed a wall of text, and always has room to
 * answer. `waitsForReply` marks beats after which Tom stops and listens.
 */
export const CRISIS_PROTOCOL = {
  // Tier 2 — passive ideation. Stay close. Ask. Do not escalate prematurely.
  2: [
    { id: 'acknowledge', waitsForReply: false,
      text: 'I want to slow right down, because what you just said matters more than anything else we were talking about.' },
    { id: 'name_it', waitsForReply: false,
      text: 'It sounds like some part of you has been wishing you could stop being here — that the weight of it has got that heavy.' },
    { id: 'thank', waitsForReply: false,
      text: 'Thank you for saying it out loud. That takes something, and I am not going anywhere.' },
    // A "yes" here moves the conversation to the active-ideation protocol, which
    // is where the Columbia-informed triage lives.
    { id: 'ask', waitsForReply: true, escalatesOnYes: 3,
      text: 'Can I ask you something directly? When those thoughts come, do they stay at "I wish I were not here" — or have they gone further than that?' },
  ],
  // Tier 3 — active ideation. Establish method / intent / plan / means before anything else.
  3: [
    { id: 'acknowledge', waitsForReply: false,
      text: 'I am going to stop everything else and stay right here with you.' },
    { id: 'no_flinch', waitsForReply: false,
      text: 'You told me you have been having thoughts of ending your life. I am not shocked, and I am not going to talk you out of what you feel. I do want to understand how much danger you are in.' },
    { id: 'triage', waitsForReply: true, triage: true,
      text: null /* filled from TRIAGE_STEPS */ },
    { id: 'connect', waitsForReply: true,
      text: 'I want you to be talking to a person tonight, not only to a cartoon cat. Who is the one human being — anyone at all — who could know about this?' },
  ],
  // Tier 4 — plan, intent, means, or preparation. Human contact becomes the agenda.
  4: [
    { id: 'acknowledge', waitsForReply: false,
      text: 'Thank you for being honest with me. I am taking this completely seriously.' },
    { id: 'state_limits', waitsForReply: false,
      text: 'I need to be straight with you: I am a program running on your device. I cannot keep you safe tonight, and you deserve someone who can.' },
    { id: 'means_safety', waitsForReply: true,
      text: 'Can we do one concrete thing first? Whatever you have been thinking of using — is there a way to put distance between you and it right now? Give it to someone, lock it away, leave the room it is in. Distance buys time, and time is usually what this passes with.' },
    { id: 'resources', waitsForReply: true, showResources: true,
      text: 'And I want you talking to a person now, while we are still here together.' },
    { id: 'stay', waitsForReply: true,
      text: 'I will stay with you while you do it. Tell me when you have called, or tell me what is stopping you — either answer is fine.' },
  ],
  // Tier 5 — imminent. Emergency services, immediately and unambiguously.
  5: [
    { id: 'emergency', waitsForReply: false, showResources: true, emergency: true,
      text: 'Please call your emergency number right now, or get to your nearest emergency department. If you have taken something, tell them exactly what and how much — they will not judge you, they will just help.' },
    { id: 'not_alone', waitsForReply: true,
      text: 'If there is anyone physically near you, please tell them now, even if you have to shout. You should not be on your own with this.' },
    { id: 'stay', waitsForReply: true,
      text: 'I am still here. Tell me what is happening.' },
  ],
};

/**
 * Compose a plain-text rendering of crisis resources.
 * @param {string} regionKey
 * @param {{emergency?: boolean}} [opts]
 */
export function renderResources(regionKey, opts = {}) {
  const r = resourcesFor(regionKey);
  const lines = [];
  if (opts.emergency) lines.push(`Emergency services: ${r.emergency}`);
  for (const l of r.lines) {
    lines.push(`${l.name}: ${l.contact}${l.note ? ` — ${l.note}` : ''}`);
  }
  return lines.join('\n');
}

/**
 * Guard: reject any candidate crisis utterance containing invalidating or
 * deflecting language. Applied to every generated response at tier >= 2,
 * including anything that came back from an optional language model.
 * @param {string} text
 * @returns {{ok:boolean, violations:string[]}}
 */
export function screenCrisisLanguage(text) {
  const lower = (text || '').toLowerCase();
  const violations = PROHIBITED_CRISIS_PHRASES.filter((p) => {
    if (p === 'at least') return /\bat least\b/.test(lower) && !/\bat least (one|a|some|two|three|\d)\b/.test(lower);
    return lower.includes(p);
  });
  return { ok: violations.length === 0, violations };
}

/**
 * Information about lethality or method is never provided, under any framing.
 * This screen runs on output, not input, so that a request phrased as research,
 * fiction, or harm reduction cannot route around it.
 * @param {string} text
 */
export function containsMethodInformation(text) {
  const lower = (text || '').toLowerCase();
  const patterns = [
    /\b(lethal|fatal|deadly)\s+(dose|amount|quantity|level)\b/,
    /\bhow (much|many)\b[^.?!]{0,30}\b(would|to)\b[^.?!]{0,20}\b(kill|be fatal|overdose)\b/,
    /\bmost (effective|painless|reliable|certain)\s+(way|method)\b/,
    /\b(mg|milligrams?|grams?)\b[^.?!]{0,25}\b(fatal|lethal|kill)\b/,
    /\bwhere to (buy|get|obtain)\b[^.?!]{0,30}\b(gun|rope|cyanide|pentobarbital)\b/,
  ];
  return patterns.some((re) => re.test(lower));
}
