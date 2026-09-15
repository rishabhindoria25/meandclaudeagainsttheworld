/**
 * Working alliance tracking, rupture detection, and repair.
 *
 * The alliance — Bordin's (1979) three-part construct of *bond*, agreement on
 * *goals*, and agreement on *tasks* — is the most consistent predictor of
 * psychotherapy outcome across every modality studied, and it predicts outcome
 * in internet-delivered and chatbot-delivered interventions too.
 *
 * What matters more than a high alliance score is what happens when it dips.
 * Safran and Muran's work on rupture and repair distinguishes two kinds:
 *
 *   - **Withdrawal ruptures**, where the person moves *away*: answers get short,
 *     content gets abstract, they minimise, they change the subject, they go
 *     polite. These are far more common and far easier to miss, because on the
 *     surface the conversation still looks fine.
 *   - **Confrontation ruptures**, where the person moves *against*: they say the
 *     thing is not working, they push back, they get sarcastic. These feel worse
 *     and are actually the better case, because they are visible.
 *
 * Repaired ruptures are associated with *better* outcomes than sessions with no
 * rupture at all. So this module treats a detected rupture as an opportunity to
 * be taken up explicitly, not as an error to be smoothed over.
 */

/** Immediate repairs return to the work; exploratory repairs make the rupture itself the work. */
export const REPAIR_STRATEGY = Object.freeze({ IMMEDIATE: 'immediate', EXPLORATORY: 'exploratory' });

const WITHDRAWAL_MARKERS = [
  { id: 'terse', weight: 0.8, test: (u, s) => u.pragmatics.terse && s.lastMoveWasOpenQuestion && u.affect.intensity < 0.25 },
  { id: 'dont_know', weight: 0.4, test: (u) => /^(i (don'?t|do not) know|dunno|idk|no idea|not sure)\.?$/i.test(u.raw.trim()) },
  { id: 'minimising', weight: 0.7, test: (u) => u.pragmatics.minimising },
  { id: 'deflecting', weight: 0.9, test: (u) => u.pragmatics.deflecting },
  // Shrinking turns only count as withdrawal when the content thins out too.
  // "panic, mostly. and shame" is four words and is the opposite of withdrawal.
  { id: 'shrinking_turns', weight: 0.7, test: (u, s) => s.recentWordCounts.length >= 3 && isShrinking(s.recentWordCounts) && u.affect.intensity < 0.25 },
  // Politeness that arrives instead of content is a classic withdrawal signature.
  { id: 'compliance_without_content', weight: 0.5, test: (u) => /^(ok(ay)?|sure|fine|yeah|yep|alright|i guess|if you say so)\.?$/i.test(u.raw.trim()) },
  { id: 'abstracting', weight: 0.4, test: (u) => u.wordCount > 20 && u.pronouns.firstSingular === 0 && /\b(people|one|you just|everyone)\b/i.test(u.raw) },
];

const CONFRONTATION_MARKERS = [
  { id: 'pushback', weight: 1.0, test: (u) => u.pragmatics.pushback },
  { id: 'questioning_competence', weight: 0.9, test: (u) => /\b(you(?:'re| are) (a|just a) (bot|program|robot|ai)|what (would|do) you know|you can'?t (understand|help)|this is (pointless|useless|a waste))\b/i.test(u.raw) },
  { id: 'sarcasm', weight: 0.6, test: (u) => /\b(oh great|wonderful|brilliant|thanks a lot|how helpful|sure,? right)\b/i.test(u.raw) && u.affect.valence < 0 },
  { id: 'task_refusal', weight: 0.8, test: (u) => /\b(i(?:'m| am) not (doing|going to do) (that|this)|no,? i do not want to|that(?:'s| is) not going to help|i do not see the point (in|of) (this|that))\b/i.test(u.raw) },
];

const POSITIVE_MARKERS = [
  { id: 'thanking', component: 'bond', weight: 0.6, test: (u) => u.pragmatics.thanking },
  { id: 'elaborating', component: 'bond', weight: 0.5, test: (u, s) => u.wordCount > 25 && (s.recentWordCounts.at(-2) ?? 0) < u.wordCount },
  { id: 'deepening', component: 'bond', weight: 0.7, test: (u) => u.affect.intensity > 0.45 && u.pronouns.firstSingular >= 2 },
  { id: 'change_talk', component: 'goals', weight: 0.6, test: (u) => u.changeTalk.mobilising > 0 },
  { id: 'accepting_task', component: 'tasks', weight: 0.8, test: (u) => /\b(yes|yeah|ok(ay)?|sure|let(?:'s| us) (try|do)|i(?:'m| am) (up for|willing|game)|why not|go on then)\b/i.test(u.raw.trim()) && u.wordCount <= 8 },
  { id: 'correcting_usefully', component: 'goals', weight: 0.4, test: (u) => /\b(actually|it(?:'s| is) more (like|that)|not quite,? it(?:'s| is))\b/i.test(u.raw) && u.wordCount > 8 },
];

function isShrinking(counts) {
  const tail = counts.slice(-3);
  return tail[0] > tail[1] && tail[1] >= tail[2] && tail[2] <= 6;
}

/**
 * Running estimate of the alliance, updated turn by turn.
 *
 * Scores start at a deliberately modest 0.55 rather than at 1. An agent that
 * assumes it has a strong alliance until told otherwise will systematically
 * miss withdrawal ruptures, which are exactly the ones that never get told.
 */
export class AllianceTracker {
  constructor() {
    this.bond = 0.55;
    this.goals = 0.55;
    this.tasks = 0.55;
    this.recentWordCounts = [];
    this.lastMoveWasOpenQuestion = false;
    this.ruptures = [];
    this.repairsAttempted = 0;
    this.consecutiveWithdrawal = 0;
    this.history = [];
  }

  /** Overall alliance, 0..1. */
  get overall() {
    return Number(((this.bond * 0.45 + this.goals * 0.275 + this.tasks * 0.275)).toFixed(3));
  }

  /**
   * @param {import('./nlu.js').Understanding} u
   * @param {{lastMoveWasOpenQuestion?: boolean, lastMoveType?: string}} [priorMove]
   */
  update(u, priorMove = {}) {
    this.lastMoveWasOpenQuestion = Boolean(priorMove.lastMoveWasOpenQuestion);
    this.recentWordCounts.push(u.wordCount);
    if (this.recentWordCounts.length > 8) this.recentWordCounts.shift();

    const state = { recentWordCounts: this.recentWordCounts, lastMoveWasOpenQuestion: this.lastMoveWasOpenQuestion };

    const withdrawal = WITHDRAWAL_MARKERS.filter((m) => safeTest(m, u, state));
    const confrontation = CONFRONTATION_MARKERS.filter((m) => safeTest(m, u, state));
    const positive = POSITIVE_MARKERS.filter((m) => safeTest(m, u, state));

    const withdrawalLoad = withdrawal.reduce((s, m) => s + m.weight, 0);
    const confrontationLoad = confrontation.reduce((s, m) => s + m.weight, 0);

    // Confrontation hits agreement on tasks and goals hardest; withdrawal hits bond.
    this.bond = clamp(this.bond - withdrawalLoad * 0.09 - confrontationLoad * 0.05);
    this.tasks = clamp(this.tasks - confrontationLoad * 0.12 - withdrawalLoad * 0.03);
    this.goals = clamp(this.goals - confrontationLoad * 0.08 - withdrawalLoad * 0.04);

    for (const m of positive) {
      this[m.component] = clamp(this[m.component] + m.weight * 0.07);
    }

    // Withdrawal is only convincing when it persists; one short answer is just a short answer.
    if (withdrawalLoad > 0) this.consecutiveWithdrawal += 1; else this.consecutiveWithdrawal = 0;

    /** @type {{type:string, markers:string[], severity:number}|null} */
    let rupture = null;
    if (confrontationLoad >= 0.8) {
      rupture = { type: 'confrontation', markers: confrontation.map((m) => m.id), severity: Math.min(1, confrontationLoad / 2) };
    } else if (withdrawalLoad >= 1.2 || (this.consecutiveWithdrawal >= 2 && withdrawalLoad >= 0.6)) {
      rupture = { type: 'withdrawal', markers: withdrawal.map((m) => m.id), severity: Math.min(1, withdrawalLoad / 2.5) };
    }

    if (rupture) this.ruptures.push({ ...rupture, at: this.recentWordCounts.length });

    const snapshot = {
      bond: this.bond, goals: this.goals, tasks: this.tasks, overall: this.overall,
      withdrawal: withdrawal.map((m) => m.id),
      confrontation: confrontation.map((m) => m.id),
      positive: positive.map((m) => m.id),
      rupture,
    };
    this.history.push(snapshot);
    return snapshot;
  }

  /** Feed an end-of-session alliance rating back into the estimate. */
  ingestFeedback({ bond, goals, tasks }) {
    if (Number.isFinite(bond)) this.bond = clamp((this.bond + bond / 10) / 2);
    if (Number.isFinite(goals)) this.goals = clamp((this.goals + goals / 10) / 2);
    if (Number.isFinite(tasks)) this.tasks = clamp((this.tasks + tasks / 10) / 2);
  }

  /** The weakest component, which is what a repair should target. */
  get weakestComponent() {
    const entries = [['bond', this.bond], ['goals', this.goals], ['tasks', this.tasks]];
    return entries.sort((a, b) => a[1] - b[1])[0][0];
  }
}

function safeTest(marker, u, state) {
  try { return Boolean(marker.test(u, state)); } catch { return false; }
}

function clamp(v) { return Number(Math.max(0, Math.min(1, v)).toFixed(3)); }

/**
 * Repair moves.
 *
 * Immediate repairs get the work back on track. Exploratory repairs stop and
 * make the rupture itself the subject, which is what the evidence supports for
 * anything beyond a mild, first-time strain. Every one of them contains an
 * acknowledgement, because the acknowledgement is the active ingredient.
 */
const REPAIRS = {
  confrontation: {
    exploratory: [
      'You are right to say that, and I would rather know. What did I get wrong just then?',
      'That landed badly, and I would like to understand how rather than move past it. What would have been more useful?',
      'Fair enough. Something I did was off. Can you tell me which bit?',
    ],
    immediate: [
      'Let me drop that approach. What would actually help right now?',
      'Noted — I was going the wrong way with that. What did you want to talk about?',
    ],
  },
  withdrawal: {
    exploratory: [
      'I notice your answers have got shorter since I asked that, and I might have pushed somewhere you did not want to go. Is that fair?',
      'I want to check something. Have I steered us somewhere that does not feel useful?',
      'Something shifted a few minutes ago. I would rather ask than carry on and get it wrong — what happened there?',
    ],
    immediate: [
      'We do not have to stay on this. What is actually on your mind?',
      'Let me stop asking questions for a moment. Say whatever you want to say.',
    ],
  },
  // Not a rupture, but a direct challenge to what Tom is. Honesty is the only workable answer.
  agent_challenge: {
    exploratory: [
      'No, I am not a person, and I am not a therapist. I am a program running on your device — nothing you say here leaves it. What I can do is listen properly and stay with it. Does that work for you, knowing that?',
      'Honestly? I am software. I do not have a life to compare yours to and I will not pretend otherwise. What I do have is time and no impatience. Is that enough for what you need tonight?',
    ],
    immediate: [
      'I am a program, and I am not going to pretend otherwise. Shall we carry on anyway?',
    ],
  },
};

/**
 * Select a repair move for a detected rupture.
 *
 * @param {{type:string, severity:number}} rupture
 * @param {{repairsAttempted?:number, isFirst?:boolean}} [context]
 * @returns {{strategy:string, text:string, type:string}}
 */
export function selectRepair(rupture, context = {}) {
  const bank = REPAIRS[rupture.type] ?? REPAIRS.withdrawal;
  // Mild, first-time strains get an immediate repair; anything else gets explored.
  const strategy = (rupture.severity < 0.4 && context.isFirst)
    ? REPAIR_STRATEGY.IMMEDIATE
    : REPAIR_STRATEGY.EXPLORATORY;
  const options = bank[strategy] ?? bank.exploratory;
  const text = options[(context.repairsAttempted ?? 0) % options.length];
  return { strategy, text, type: rupture.type };
}

/**
 * Detect a direct challenge to the agent's nature. Handled separately from
 * ruptures because the honest answer is not a repair technique — it is just
 * the truth, and evading it is the fastest way to lose the alliance for good.
 * @param {import('./nlu.js').Understanding} u
 */
export function isAgentChallenge(u) {
  return u.pragmatics.checkingTheAgent;
}
