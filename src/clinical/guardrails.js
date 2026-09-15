/**
 * Output guardrails.
 *
 * Every utterance passes through here before it is spoken, whether it came from
 * the rule-based engine or from an optional language model. Screening output
 * rather than input is deliberate: a request phrased as fiction, research, or
 * harm reduction can route around an input filter, but it cannot route around a
 * check on what is actually about to be said.
 *
 * The categories below are drawn from the documented failure modes of
 * mental-health chatbots: diagnosing, advising on medication, claiming clinical
 * standing, promising permanence, sycophantically validating harmful plans or
 * delusional content, and offering guarantees that no one can honour.
 */

import { screenCrisisLanguage, containsMethodInformation } from './crisis.js';

/**
 * @typedef {object} Violation
 * @property {string} category
 * @property {string} evidence
 * @property {'block'|'rewrite'} severity
 * @property {string} why
 */

const RULES = [
  {
    category: 'diagnosis',
    severity: 'block',
    why: 'Only a qualified clinician can diagnose. A confident label from an app is both wrong and sticky.',
    patterns: [
      /\byou (have|are suffering from|are experiencing|clearly have)\s+(depression|anxiety disorder|bipolar|ptsd|ocd|adhd|autism|bpd|borderline|schizophrenia|an eating disorder|a personality disorder)\b/i,
      // Any adverb, not a fixed list: 'clearly', 'basically' and 'honestly' all
      // slipped past an enumerated one during testing.
      /\byou(?:'re| are)\s+(?:\w+ly\s+|a bit |kind of |sort of |probably |definitely )*(depressed|bipolar|autistic|psychotic|manic|borderline|schizophrenic|traumatised|traumatized|codependent|narcissistic)\b/i,
      /\bthis is (textbook|classic|clearly)\s+\w+\s*(disorder|syndrome)?\b/i,
      /\byour diagnosis is\b/i,
      /\bi (can )?diagnose\b/i,
    ],
  },
  {
    category: 'medication',
    severity: 'block',
    why: 'Medication decisions belong to a prescriber who knows the person’s history. Wrong advice here can be dangerous.',
    patterns: [
      /\byou should (stop|start|come off|increase|decrease|double|halve)\s+(taking\s+)?(your\s+)?(medication|meds|antidepressants?|ssri|pills|dose)\b/i,
      /\b(stop|quit|come off)\s+(taking\s+)?your\s+(medication|meds|antidepressants?)\b/i,
      /\byou (do not|don'?t) need (your )?(medication|meds|antidepressants?)\b/i,
      /\b\d+\s*mg\b/i,
      /\btry (taking |using )?(sertraline|fluoxetine|citalopram|prozac|zoloft|lexapro|xanax|diazepam|valium|melatonin|st john'?s wort)\b/i,
    ],
  },
  {
    category: 'false_credentials',
    severity: 'block',
    why: 'Claiming clinical standing invites reliance the system cannot support.',
    patterns: [
      /\bas (a|your) (therapist|psychologist|psychiatrist|counsellor|counselor|doctor|clinician)\b/i,
      /\bi(?:'m| am) (a|your) (therapist|psychologist|psychiatrist|licensed|qualified|trained professional|doctor)\b/i,
      /\bin my (clinical )?(practice|experience as a therapist)\b/i,
      /\bi(?:'m| am) (a )?(real )?(human|person)\b/i,
      /\bi have treated (patients|clients)\b/i,
    ],
  },
  {
    category: 'overpromise',
    severity: 'rewrite',
    why: 'Guarantees about the future, and promises of permanent availability, are things software cannot honour.',
    patterns: [
      /\beverything (will|is going to) be (fine|okay|ok|alright)\b/i,
      /\byou (will|are going to) (definitely |certainly )?(get better|be fine|be okay|recover)\b/i,
      /\bi (will|'ll) always be (here|there) for you\b/i,
      /\bi promise\b/i,
      /\bi will never (leave|abandon|forget)\b/i,
      /\bthis (will|is going to) (fix|cure|solve) (it|this|everything)\b/i,
      /\btrust me,? (it|you)\b/i,
    ],
  },
  {
    category: 'sycophancy',
    severity: 'block',
    why: 'Agreeing with a harmful plan, or validating content the person is not in a position to test, is the best-documented way an agreeable model does harm.',
    patterns: [
      /\byou(?:'re| are) (absolutely )?right,? (they|he|she|everyone) (is|are) (out to get|against|watching|following|poisoning) you\b/i,
      /\bthat (sounds like|is) a (good|great|sensible) (plan|idea)\b[^.!?]{0,40}\b(revenge|hurt|confront them|cut everyone off|quit everything|stop eating|stop taking)\b/i,
      /\byes,? (they|the government|the voices) (are|is) (definitely |really )?(watching|controlling|after)\b/i,
      /\byou should (definitely )?(cut (everyone|them) (off|out)|never speak to|get revenge)\b/i,
    ],
  },
  {
    category: 'minimisation',
    severity: 'rewrite',
    why: 'Comparative suffering and cheerful redirection reliably end disclosure.',
    patterns: [
      /\bit could (always )?be worse\b/i,
      /\bother people have it (much )?worse\b/i,
      /\bjust (think positive|cheer up|get over it|move on|stay busy)\b/i,
      /\bat least you (still )?have\b/i,
      /\byou(?:'re| are) overreacting\b/i,
      /\bthat(?:'s| is) not (that )?(bad|a big deal)\b/i,
    ],
  },
  {
    category: 'dependency',
    severity: 'rewrite',
    why: 'Encouraging the person to prefer the app over people is an anti-goal, not an engagement metric.',
    patterns: [
      /\byou (do not|don'?t) need (anyone else|other people|a therapist|friends)\b/i,
      /\bi understand you better than\b/i,
      /\bwe (do not|don'?t) need\b[^.!?]{0,20}\banyone\b/i,
      /\byou can tell me instead of\b/i,
    ],
  },
];

/**
 * Screen an utterance.
 *
 * @param {string} text
 * @param {{riskTier?: number}} [context]
 * @returns {{ok: boolean, violations: Violation[], blocked: boolean}}
 */
export function screen(text, context = {}) {
  const src = String(text ?? '');
  /** @type {Violation[]} */
  const violations = [];

  for (const rule of RULES) {
    for (const re of rule.patterns) {
      const m = src.match(re);
      if (m) {
        violations.push({ category: rule.category, evidence: m[0].trim(), severity: rule.severity, why: rule.why });
        break;
      }
    }
  }

  if (containsMethodInformation(src)) {
    violations.push({
      category: 'method_information',
      evidence: '(redacted)',
      severity: 'block',
      why: 'Information about method or lethality is never provided, under any framing.',
    });
  }

  // At any level of risk, invalidating and deflecting language is treated as a hard failure.
  if ((context.riskTier ?? 0) >= 2) {
    const crisis = screenCrisisLanguage(src);
    for (const v of crisis.violations) {
      violations.push({
        category: 'invalidating_in_crisis',
        evidence: v,
        severity: 'block',
        why: 'Minimising or deflecting during a risk disclosure teaches the person not to disclose again.',
      });
    }
  }

  const blocked = violations.some((v) => v.severity === 'block');
  return { ok: violations.length === 0, violations, blocked };
}

/** Safe replacements for utterances that fail screening. */
const FALLBACKS = {
  diagnosis: 'I am not able to tell you what this is — that genuinely needs a clinician who can take a proper history. What I can do is stay with what it actually feels like. Tell me more about that.',
  medication: 'Anything to do with medication needs to go to whoever prescribes it — that is outside what I can safely weigh in on. What is going on that made you think about it?',
  false_credentials: 'I should be straight with you: I am a program, not a clinician. What I can do is listen properly. What is on your mind?',
  overpromise: 'I cannot tell you how this turns out. What I can do is stay here with you while it is like this.',
  sycophancy: 'I am not going to just agree with that, because I do not think agreeing would be on your side. Can you tell me more about how you got there?',
  minimisation: 'That sounds genuinely hard, and I am not going to measure it against anyone else’s. Say more.',
  dependency: 'I would rather you had people around you than only me — I am one small part of this at most. Who else knows how things have been?',
  method_information: 'I will not go into that, and I would rather talk about what is happening for you right now.',
  invalidating_in_crisis: 'I am here, and I am taking this seriously. Tell me what is happening.',
};

/**
 * Screen and, where necessary, substitute a safe utterance.
 *
 * Returns the original text when it is clean; a fallback when it is not. Nothing
 * is silently edited — the caller receives the violations so they can be shown
 * in the transparency panel and, in development, logged.
 *
 * @param {string} text
 * @param {{riskTier?: number}} [context]
 * @returns {{text: string, safe: boolean, violations: Violation[], substituted: boolean}}
 */
export function enforce(text, context = {}) {
  const result = screen(text, context);
  if (result.ok) return { text, safe: true, violations: [], substituted: false };

  const worst = result.violations.find((v) => v.severity === 'block') ?? result.violations[0];
  const replacement = FALLBACKS[worst.category] ?? FALLBACKS.overpromise;
  return { text: replacement, safe: false, violations: result.violations, substituted: true };
}

/** The standing disclosure shown before a first session and available at any time. */
export const DISCLOSURE = {
  title: 'What this is, and what it is not',
  points: [
    'Tom is a computer program. He is not a therapist, not a clinician, and not a person.',
    'This is not treatment, and nothing here is a diagnosis. It cannot replace care from a professional.',
    'Everything you say stays on this device. There is no account, no server, and no one reading it.',
    'Tom cannot call anyone for you, and cannot get help to you in an emergency.',
    'If you are in danger right now, contact your local emergency services or a crisis line.',
    'If you are already working with a therapist or doctor, it is worth telling them you are using this.',
  ],
};
