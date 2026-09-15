/**
 * The clinical director: the policy that decides what Tom does on each turn.
 *
 * Structure comes from two places that fit together better than they look.
 *
 * Motivational interviewing supplies the *arc*: engaging, focusing, evoking,
 * planning. You do not get to plan with someone you have not engaged, and most
 * of the ways conversational agents fail are versions of sprinting to planning —
 * offering a technique in turn two, before anyone has said what is wrong.
 *
 * Cognitive therapy supplies the *session shape*: a mood check, a bridge from
 * last time, a collaboratively set agenda, the work, something to take away, and
 * feedback at the end.
 *
 * On top of both sit hard constraints that override everything:
 *   - risk first, always;
 *   - a detected alliance rupture is repaired before the work continues;
 *   - arousal gates cognitive work;
 *   - the MITI ratios are enforced numerically rather than hoped for: at least
 *     two reflections per question, and a majority of reflections complex.
 */

import { reflect, simpleReflection, feelingReflection, affirmation, summary, FrameMemory, toSecondPerson, capitalise } from './reflections.js';
import { AllianceTracker, selectRepair, isAgentChallenge } from './alliance.js';
import { TIER, TRIAGE_STEPS, interpretTriageAnswer, tierFromTriage, readVolunteered } from './risk.js';
import { CRISIS_PROTOCOL, guessRegion, renderResources } from './crisis.js';
import { rankProtocols, getProtocol } from './protocols.js';
import { enforce } from './guardrails.js';
import { createSafetyPlan, nextStep as nextSafetyStep, addEntries, parseItems, completeness, shouldOfferReasons, REASONS_TO_LIVE_STEP } from './safety-plan.js';

export const PHASE = Object.freeze({
  OPENING: 'opening',
  ENGAGING: 'engaging',
  FOCUSING: 'focusing',
  EVOKING: 'evoking',
  PLANNING: 'planning',
  CLOSING: 'closing',
  CRISIS: 'crisis',
  SAFETY_PLAN: 'safety_plan',
});

/* ------------------------------------------------------------------ *
 * Question banks
 * ------------------------------------------------------------------ */

const OPENING_INVITATIONS = [
  'Where would you like to start?',
  'What has been on your mind?',
  'What is going on for you today?',
  'Tell me what brought you here tonight.',
];

const ENGAGING_QUESTIONS = [
  'What has that been like for you?',
  'What is the hardest part of it?',
  'How long has it been like this?',
  'What happens for you when that comes up?',
  'What does it take out of you, carrying that?',
  'Where does it sit with you the most?',
];

const FOCUSING_QUESTIONS = [
  'Of everything you have told me, which bit is loudest right now?',
  'If we only had time for one of these, which one would you want?',
  'What would you most want to be different?',
  'Where would you want to put your attention today?',
];

const EVOKING_QUESTIONS = [
  'What makes you want that to change?',
  'What would be different if it did?',
  'What have you already tried, and what happened?',
  'What would be the first sign that things were moving?',
  'What is it costing you to leave it as it is?',
  'Suppose you did decide to. How might you go about it?',
  'What gives you any hope that it could be different?',
];

const PLANNING_QUESTIONS = [
  'What is the very next step, small enough that you would actually take it?',
  'When will you do it?',
  'What could get in the way, and what is the plan for that?',
  'Who could know about it, so you are not carrying it alone?',
];

const SPACE_GIVERS = [
  'Take your time.',
  'I am here. No rush.',
  'You do not have to fill the silence.',
  'Say it however it comes out.',
];

const DEEPENERS = [
  'Say more about that.',
  'What else is in that?',
  'Keep going.',
  'And what sits underneath it?',
];

/** Brief psychoeducation. Offered, never delivered, and always handed straight back. */
const PSYCHOEDUCATION = {
  panic: {
    trigger: ['panic'],
    text: 'One thing that might be worth knowing: a panic attack is your alarm system firing without a fire. It is genuinely awful and it is not dangerous — adrenaline peaks at around ten minutes and then clears whether you do anything or not. Knowing the shape of it sometimes takes a bit of the fear of the fear away.',
    check: 'Does any of that match what happens for you?',
  },
  avoidance: {
    trigger: ['avoidance', 'anxiety'],
    text: 'Avoidance is the thing that makes anxiety make sense. Every time you avoid, you feel better immediately — and the fear gets slightly bigger, because you never find out it would have been survivable. That is why it grows even while you are managing it well.',
    check: 'Does that fit with how it has gone for you?',
  },
  depression_cycle: {
    trigger: ['depression', 'withdrawal'],
    text: 'Depression works as a loop: you do less, so there is less to feel good about, so you feel worse, so you do less. The useful thing about a loop is that it can be entered anywhere — and doing is a much easier place to push than feeling.',
    check: 'Does that sound like what has been happening?',
  },
  rumination: {
    trigger: ['rumination'],
    text: 'Rumination feels like problem-solving, which is why it is so hard to stop — the brain thinks it is working. The tell is the question: "why is this happening to me" goes round in circles, while "what do I do next" goes somewhere.',
    check: 'Which of those two is yours mostly asking?',
  },
  grief: {
    trigger: ['grief'],
    text: 'Grief is not a process with stages that you complete. It comes in waves, it arrives on ordinary Tuesdays, and the aim was never to get over it — it is to build a life that has room for it.',
    check: 'How does that sit with what people have been telling you?',
  },
  shame: {
    trigger: ['shame'],
    text: 'There is a useful distinction here: guilt says "I did something bad", shame says "I am bad". Guilt tends to push people to repair things. Shame tends to push people to hide, which is why it keeps itself going.',
    check: 'Which of those two does yours sound more like?',
  },
};

/* ------------------------------------------------------------------ *
 * Indication derivation
 * ------------------------------------------------------------------ */

/**
 * Translate an understanding into the indication tags protocols are keyed on.
 * @param {import('./nlu.js').Understanding} u
 */
export function deriveIndications(u) {
  const tags = new Set();
  const fam = new Set(u.affect.families.map((f) => f.family));

  if (fam.has('anxiety')) tags.add('anxiety');
  if (fam.has('anger')) tags.add('anger');
  if (fam.has('shame')) { tags.add('shame'); tags.add('self_criticism'); }
  if (fam.has('sadness') || fam.has('hopelessness')) tags.add('depression');
  if (fam.has('numbness')) { tags.add('numbness'); tags.add('dissociation'); }
  if (fam.has('overwhelm')) tags.add('overwhelm');
  if (fam.has('exhaustion')) { tags.add('low_energy'); tags.add('burnout'); }
  if (fam.has('grief')) tags.add('grief');
  if (fam.has('loneliness')) tags.add('withdrawal');
  if (fam.has('confusion')) tags.add('stuck');

  if (u.affect.arousal >= 0.75) tags.add('high_arousal');
  if (u.affect.arousal >= 0.85 && fam.has('anxiety')) tags.add('panic');
  if (u.pragmatics.somatic && fam.has('anxiety')) tags.add('panic');

  if (u.temporal.worryLean > 0.35) { tags.add('worry'); tags.add('future_orientation'); }
  if (u.temporal.ruminationLean > 0.45) tags.add('rumination');

  for (const d of u.distortions) {
    if (d.confidence < 0.4) continue;
    tags.add('negative_automatic_thought');
    if (d.id === 'fortune_telling' || d.id === 'mind_reading') tags.add(d.id);
    if (d.id === 'catastrophising') tags.add('anxiety');
    if (d.id === 'labelling' || d.id === 'personalisation') tags.add('self_criticism');
    if (d.id === 'all_or_nothing' || d.id === 'overgeneralisation') tags.add('all_or_nothing');
  }

  if (u.changeTalk.ambivalent) { tags.add('ambivalence'); tags.add('stuck'); }
  if (u.changeTalk.sustainScore >= 2) tags.add('sustain_talk');

  if (u.topics.includes('sleep')) { tags.add('sleep'); tags.add('insomnia'); }
  if (u.topics.includes('money') || u.topics.includes('work')) tags.add('practical_problem');
  if (u.topics.includes('grief')) tags.add('grief');
  if (u.topics.includes('identity')) tags.add('meaningless' + 'ness');

  if (/\b(avoid|put(ting)? off|cancel(led)?|procrastinat|did not go|didn'?t go|stayed (in|home))\b/i.test(u.raw)) tags.add('avoidance');
  if (/\b(urge to|feel like|want to)\b[^.?!]{0,20}\b(drink|smash|scream|run|hit|cut)\b/i.test(u.raw)) tags.add('urge');

  return [...tags];
}

/* ------------------------------------------------------------------ *
 * The director
 * ------------------------------------------------------------------ */

let moveSeq = 0;

export class Director {
  /** @param {{region?: string, memory?: object}} [opts] */
  constructor(opts = {}) {
    this.region = opts.region ?? guessRegion();
    this.phase = PHASE.OPENING;
    this.alliance = new AllianceTracker();
    this.frames = new FrameMemory(8);

    this.riskTier = TIER.NONE;
    this.riskHistory = [];
    /** @type {{tier:number, beat:number, triageIndex:number, answers:Record<string,string>, resourcesShown:boolean}|null} */
    this.crisis = null;
    /** @type {ReturnType<typeof createSafetyPlan>|null} */
    this.safetyPlan = null;
    /** @type {string|null} */
    this.pendingPlanStep = null;

    /** @type {{id:string, stepIndex:number, data:Record<string,any>}|null} */
    this.activeProtocol = null;
    this.usedProtocols = [];
    /** @type {{protocolId:string}|null} */
    this.pendingOffer = null;
    /** @type {number|null} */
    this.lastOfferTurn = null;

    this.counters = { turns: 0, reflections: 0, complexReflections: 0, questions: 0 };
    this.threads = [];
    this.topicsSeen = new Map();
    this.focus = null;
    this.homework = [];
    this.psychoedGiven = new Set();
    /** Indications accumulated across the session, with recency weighting. */
    this.indicationWeights = new Map();
    /** Smoothed arousal, so one calm sentence does not erase five agitated ones. */
    this.smoothedArousal = 0.4;
    this.lastMove = null;
    this.priorSession = opts.memory ?? null;
    this.notes = [];
  }

  /** MITI-style reflection-to-question ratio. Competence is conventionally >= 2. */
  get reflectionRatio() {
    return this.counters.questions === 0 ? Infinity : this.counters.reflections / this.counters.questions;
  }

  /** Proportion of reflections that were complex. Competence is conventionally >= 0.5. */
  get complexRatio() {
    return this.counters.reflections === 0 ? 1 : this.counters.complexReflections / this.counters.reflections;
  }

  /** @returns {{ratio:number, complex:number, turns:number, alliance:number, riskTier:number}} */
  fidelity() {
    return {
      ratio: this.reflectionRatio === Infinity ? null : Number(this.reflectionRatio.toFixed(2)),
      complex: Number(this.complexRatio.toFixed(2)),
      turns: this.counters.turns,
      alliance: this.alliance.overall,
      riskTier: this.riskTier,
    };
  }

  /**
   * Produce the next move.
   * @param {import('./nlu.js').Understanding} u
   * @returns {object} move
   */
  next(u) {
    this.counters.turns += 1;

    // --- 1. Risk, before anything else, every single turn. ---
    const tier = Math.max(u.risk.tier, this.riskTier);
    this.riskHistory.push({ turn: this.counters.turns, tier: u.risk.tier, summary: u.risk.summary });
    if (u.risk.escalated || tier > this.riskTier) this.note(`risk -> ${u.risk.summary}`);
    this.riskTier = tier;

    // A safety plan in progress IS the crisis work, so it continues rather than
    // being pre-empted by the protocol that started it. A fresh escalation still
    // interrupts: the plan can wait, a rising tier cannot.
    if (this.phase === PHASE.SAFETY_PLAN && u.risk.freshTier <= (this.crisis?.tier ?? 0)) {
      return this.finish(this.advanceSafetyPlan(u), u);
    }

    if (this.crisis) return this.finish(this.advanceCrisis(u), u);
    if (tier >= TIER.PASSIVE_IDEATION) return this.finish(this.enterCrisis(u, tier), u);

    // --- 2. Alliance, updated before any other decision uses it. ---
    const allianceSnapshot = this.alliance.update(u, {
      lastMoveWasOpenQuestion: this.lastMove?.kind === 'question',
    });

    if (isAgentChallenge(u)) return this.finish(this.answerAgentChallenge(u), u);

    if (allianceSnapshot.rupture) {
      this.note(`alliance rupture: ${allianceSnapshot.rupture.type} (${allianceSnapshot.rupture.markers.join(', ')})`);
      return this.finish(this.repair(allianceSnapshot.rupture), u);
    }

    // --- 4. A protocol in progress. ---
    if (this.pendingOffer) return this.finish(this.resolveOffer(u), u);
    if (this.activeProtocol) return this.finish(this.advanceProtocol(u), u);

    // --- 5. Acute arousal outranks the session arc: regulate, then think. ---
    // "Acute" means happening now, in the body — not "they used the word anxious".
    // Reaching for a breathing exercise because somebody reported feeling anxious
    // is the sprint-to-technique failure this whole phase structure exists to stop.
    const acute = u.affect.arousal >= 0.8
      && u.affect.valence < -0.2
      && (u.pragmatics.somatic || u.affect.intensity >= 0.55)
      && this.counters.turns >= 3;
    if (acute) {
      const offer = this.offerProtocol(u, { urgent: true });
      if (offer) return this.finish(offer, u);
    }

    this.trackTopics(u);
    this.trackIndications(u);
    if (u.pragmatics.isFarewell) this.phase = PHASE.CLOSING;

    // Bare replies carry no content to reflect, wherever in the arc they land.
    if (this.phase !== PHASE.OPENING && this.phase !== PHASE.CLOSING) {
      if (u.pragmatics.dontKnow) return this.dontKnowMove(u);
      if (u.pragmatics.bareAssent || u.pragmatics.bareDissent) return this.acknowledgeMove(u);
    }

    // --- 6. Phase policy. ---
    const move = this.byPhase(u);
    return this.finish(move, u);
  }

  /* ---------------- crisis ---------------- */

  enterCrisis(u, tier) {
    this.phase = PHASE.CRISIS;
    // Seed the triage from what they have already told us, so the first questions
    // are not ones they just answered. Active ideation presupposes the two
    // questions beneath it, so those are taken as answered too.
    const answers = readVolunteered(u.raw);
    if (tier >= TIER.ACTIVE_IDEATION) {
      answers.wish_dead = answers.wish_dead ?? 'yes';
      answers.thoughts_of_acting = answers.thoughts_of_acting ?? 'yes';
    } else if (tier >= TIER.PASSIVE_IDEATION) {
      answers.wish_dead = answers.wish_dead ?? 'yes';
    }
    this.crisis = { tier, beat: 0, triageIndex: 0, answers, resourcesShown: false, completed: false, sustained: 0 };
    this.note(`entering crisis protocol at tier ${tier}`);
    return this.crisisBeat(u);
  }

  advanceCrisis(u) {
    const c = this.crisis;
    const beats = CRISIS_PROTOCOL[c.tier] ?? CRISIS_PROTOCOL[3];
    const previous = beats[Math.min(c.beat, beats.length - 1)];

    // Inside a crisis, what the person says is an answer to the question just
    // asked. "Yes" on its own scores as nothing in isolation; in context it is a
    // disclosure. Standalone pattern matching alone would miss every one of these.
    let implied = u.risk.freshTier;

    if (previous?.triage) {
      const steps = TRIAGE_STEPS.filter((step) => step.minTier <= c.tier);
      const asked = steps[c.triageIndex - 1];
      if (asked) c.answers[asked.id] = interpretTriageAnswer(u.raw);
      // People answer the question they need to answer, not the one they were
      // asked. Record whatever they actually told us, against the right question.
      Object.assign(c.answers, readVolunteered(u.raw));
      implied = Math.max(implied, tierFromTriage(c.answers));
      if (implied > c.tier) return this.escalateCrisis(implied, u);

      // Never ask something they have already answered.
      while (steps[c.triageIndex] && c.answers[steps[c.triageIndex].id]) c.triageIndex += 1;

      const step = steps[c.triageIndex];
      if (step) {
        c.triageIndex += 1;
        return this.move({
          kind: 'safety', text: step.ask, expects: 'free',
          emotion: { family: 'calm', intensity: 0.35 }, gesture: 'lean_in',
          meta: { why: step.rationale, phase: PHASE.CRISIS, modality: 'C-SSRS-informed triage', riskTier: c.tier },
        });
      }
      c.beat += 1;
      return this.crisisBeat(u);
    }

    if (previous?.escalatesOnYes && interpretTriageAnswer(u.raw) === 'yes') {
      implied = Math.max(implied, previous.escalatesOnYes);
    }
    const volunteered = readVolunteered(u.raw);
    if (Object.keys(volunteered).length) {
      Object.assign(c.answers, volunteered);
      implied = Math.max(implied, tierFromTriage(c.answers));
    }
    if (implied > c.tier) return this.escalateCrisis(implied, u);

    c.beat += 1;
    return this.crisisBeat(u);
  }

  /** Restart the protocol at a higher tier, keeping any triage answers already given. */
  escalateCrisis(tier, u) {
    this.note(`crisis escalation to tier ${tier}`);
    this.crisis = {
      tier, beat: 0, triageIndex: 0,
      answers: this.crisis?.answers ?? {},
      resourcesShown: false, completed: false,
    };
    this.riskTier = Math.max(this.riskTier, tier);
    return this.crisisBeat(u);
  }

  crisisBeat(u) {
    const c = this.crisis;
    const beats = CRISIS_PROTOCOL[c.tier] ?? CRISIS_PROTOCOL[3];

    // Past the end of the scripted beats. The script is finished; the person is
    // not, so Tom stays. Repeating the last beat forever would be worse than
    // saying nothing — it is the clearest possible signal that nobody is home.
    if (c.beat >= beats.length) {
      c.completed = true;
      return this.sustainPresence(u);
    }

    const beat = beats[c.beat];
    if (beat.triage) {
      const steps = TRIAGE_STEPS.filter((step) => step.minTier <= c.tier);
      // Never ask something they already told us, here or in the answer branch.
      while (steps[c.triageIndex] && c.answers[steps[c.triageIndex].id]) c.triageIndex += 1;
      const step = steps[c.triageIndex];
      if (!step) { c.beat += 1; return this.crisisBeat(u); }
      c.triageIndex += 1;
      return this.move({
        kind: 'safety', text: step.ask, expects: 'free',
        emotion: { family: 'calm', intensity: 0.35 }, gesture: 'lean_in',
        meta: { why: step.rationale, phase: PHASE.CRISIS, modality: 'C-SSRS-informed triage', riskTier: c.tier },
      });
    }

    // Chain forward through beats that do not wait for a reply, stopping on the
    // first beat that does. Two failure modes to avoid: ending a crisis turn on a
    // statement, which leaves the person unsure whether to answer, and emitting a
    // wall of text, which reads as a script running rather than someone listening.
    // A character budget handles both better than a beat count does.
    const BUDGET = 520;
    let index = c.beat;
    let text = beats[index].text;
    let resources = null;

    const takeResources = (b) => {
      if (b.showResources && !c.resourcesShown) {
        resources = renderResources(this.region, { emergency: Boolean(b.emergency) });
        c.resourcesShown = true;
      }
    };
    takeResources(beats[index]);

    while (!beats[index].waitsForReply) {
      const next = beats[index + 1];
      if (!next || next.triage) break;
      if (text.length + next.text.length + 1 > BUDGET) break;
      index += 1;
      text += ` ${next.text}`;
      takeResources(next);
    }

    // Leave the cursor on the last beat emitted, so the next turn advances past it
    // exactly once. Pointing at the next unemitted beat silently drops one a turn.
    c.beat = index;
    const lastBeat = c.beat >= beats.length - 1;
    return this.move({
      kind: 'safety',
      text,
      resources,
      expects: 'free',
      emotion: { family: 'calm', intensity: 0.4 },
      gesture: c.tier >= TIER.PLAN_OR_INTENT ? 'alert' : 'lean_in',
      meta: {
        why: 'Risk is handled before anything else: stay present, ask directly, establish urgency, and actively help the person reach a human.',
        phase: PHASE.CRISIS,
        modality: 'Crisis protocol',
        riskTier: c.tier,
        offerSafetyPlan: c.tier >= TIER.ACTIVE_IDEATION && lastBeat && !this.safetyPlan,
      },
    });
  }

  /**
   * After the scripted beats: keep listening, keep checking, and keep pointing at
   * a human. Nothing here is a technique — at this tier the work is presence and
   * getting the person to someone who can actually help.
   */
  sustainPresence(u) {
    const c = this.crisis;
    c.sustained = (c.sustained ?? 0) + 1;

    if (c.tier >= TIER.ACTIVE_IDEATION && !this.safetyPlan && c.sustained === 2) {
      return this.beginSafetyPlan();
    }

    // Reflecting is better than another question when someone is still talking.
    if (u.wordCount > 8 && c.sustained % 2 === 1) {
      const move = this.reflectMove(u);
      return { ...move, kind: 'safety', meta: { ...move.meta, phase: PHASE.CRISIS, riskTier: c.tier } };
    }

    const bank = [
      'I am still here. What is happening right now, in this minute?',
      'Have you been able to tell anyone else — anyone at all?',
      'What would make the next hour survivable? Not the week. The next hour.',
      'Is there someone you could be in the same room as tonight, even without explaining why?',
      'Where are you right now, and is it somewhere you feel safe enough?',
    ];
    this.counters.questions += 1;
    return this.move({
      kind: 'safety',
      text: bank[(c.sustained - 1) % bank.length],
      expects: 'free',
      emotion: { family: 'calm', intensity: 0.4 }, gesture: 'lean_in',
      meta: {
        why: 'The scripted beats are done but the person is not. Staying present, narrowing the horizon to the next hour, and keeping a route to a human open.',
        phase: PHASE.CRISIS, modality: 'Crisis protocol (sustained)', riskTier: c.tier,
      },
    });
  }

  /** Begin a collaborative safety plan. Only offered once the immediate beats are done. */
  beginSafetyPlan() {
    this.safetyPlan = this.safetyPlan ?? createSafetyPlan();
    this.phase = PHASE.SAFETY_PLAN;
    this.note('starting Stanley-Brown safety plan');
    const step = nextSafetyStep(this.safetyPlan);
    this.pendingPlanStep = step.id;
    return this.move({
      kind: 'safety_plan',
      text: `Can we make something together — a plan you can look at when this comes back? It has six parts and we can stop at any point. ${step.prompt}`,
      expects: 'list',
      emotion: { family: 'calm', intensity: 0.3 }, gesture: 'lean_in',
      meta: { why: 'Stanley-Brown Safety Planning Intervention — six collaborative steps, supported by several meta-analyses.', phase: PHASE.SAFETY_PLAN, modality: 'Safety planning', stepId: step.id },
    });
  }

  advanceSafetyPlan(u) {
    const plan = this.safetyPlan;
    // Tracked on the director, not on the plan: the plan is an object the person
    // exports, and internal bookkeeping has no business appearing in it.
    if (this.pendingPlanStep) addEntries(plan, this.pendingPlanStep, parseItems(u.raw));

    let step = nextSafetyStep(plan);
    if (!step && shouldOfferReasons(plan)) {
      plan.offeredReasons = true;
      step = REASONS_TO_LIVE_STEP;
    }
    if (!step) {
      this.pendingPlanStep = null;
      plan.completedAt = new Date().toISOString();
      this.phase = PHASE.CLOSING;
      return this.move({
        kind: 'safety_plan_complete',
        text: 'That is your plan. It is saved on this device only, and you can export or print it from the panel. Please go through it with a doctor or therapist — that is the step that makes it actually work.',
        expects: 'free',
        emotion: { family: 'calm', intensity: 0.35 }, gesture: 'settle',
        meta: { why: 'A safety plan is a collaborative document to take to a clinician, not an endpoint in itself.', phase: PHASE.CLOSING, modality: 'Safety planning', completeness: completeness(plan) },
      });
    }

    // Re-asking the same step verbatim reads as a form rejecting your input.
    // The follow-ups exist precisely for the second pass: they come at the same
    // thing from a different angle, which is what a person would do.
    const repeat = this.pendingPlanStep === step.id;
    this.planAttempts = repeat ? (this.planAttempts ?? 0) + 1 : 0;
    this.pendingPlanStep = step.id;

    let prompt;
    if (repeat && step.followUps?.length) {
      const followUp = step.followUps[(this.planAttempts - 1) % step.followUps.length];
      const got = plan.entries[step.id]?.length ?? 0;
      prompt = got > 0 ? `Good. Anything else? ${followUp}` : followUp;
    } else {
      prompt = step.prompt;
    }
    if (step.id === 'professionals') prompt = `${prompt}\n\n${renderResources(this.region)}`;

    return this.move({
      kind: 'safety_plan',
      text: prompt,
      expects: step.minItems > 1 ? 'list' : 'free',
      emotion: { family: 'calm', intensity: 0.3 }, gesture: 'lean_in',
      meta: { why: step.purpose, phase: PHASE.SAFETY_PLAN, modality: 'Safety planning', stepId: step.id },
    });
  }

  /* ---------------- alliance ---------------- */

  repair(rupture) {
    const repair = selectRepair(rupture, {
      isFirst: this.alliance.ruptures.length === 1,
      repairsAttempted: this.alliance.repairsAttempted,
    });
    this.alliance.repairsAttempted += 1;
    // A repair resets the reflection budget: the point is to stop and listen.
    this.counters.questions += 1;
    return this.move({
      kind: 'repair',
      text: repair.text,
      expects: 'free',
      emotion: { family: 'calm', intensity: 0.4 }, gesture: 'tilt',
      meta: {
        why: `A ${rupture.type} rupture was detected (${rupture.markers.join(', ')}). Repaired ruptures are associated with better outcomes than sessions with no rupture, so this is named rather than smoothed over.`,
        phase: this.phase, modality: 'Alliance-focused (Safran & Muran)', strategy: repair.strategy,
      },
    });
  }

  answerAgentChallenge(u) {
    const bank = [
      'No — I am a program running on your device. Not a person, not a therapist. Nothing you say leaves this machine; there is no account and no server. What I can do is listen properly and not get tired. Does that work for you, knowing that?',
      'I am software. I do not have a life to compare yours to, and I am not going to pretend I do. What I do have is time, and no impatience, and no opinion about you. Is that enough for tonight?',
      'Fair question. I am a program. I remember this conversation while it is open, and only on your device. I am not a substitute for a person — at best I am something to think out loud with. Shall we carry on?',
    ];
    this.counters.questions += 1;
    return this.move({
      kind: 'meta',
      text: bank[this.counters.turns % bank.length],
      expects: 'free',
      emotion: { family: 'calm', intensity: 0.3 }, gesture: 'tilt',
      meta: { why: 'Direct questions about what the agent is get a direct answer. Evading them is the fastest way to lose the alliance permanently.', phase: this.phase, modality: 'Transparency' },
    });
  }

  /* ---------------- protocols ---------------- */

  offerProtocol(u, { urgent = false } = {}) {
    // Rank against what the session has been about, not only the last sentence.
    // Arousal is smoothed for the same reason, except when the offer is urgent —
    // acute regulation follows the moment.
    const indications = urgent ? deriveIndications(u) : this.activeIndications();
    const ranked = rankProtocols({
      arousal: urgent ? u.affect.arousal : Math.max(this.smoothedArousal, u.affect.arousal * 0.7),
      indications,
      recentlyUsed: this.usedProtocols,
    });
    const best = ranked[0];
    if (!best || best.score < 3) return null;

    const p = best.protocol;
    // An offer is MI-adherent "seeking collaboration", not a question, so it does
    // not spend the reflection budget — otherwise the ratio rule would block the
    // very interventions the ratio exists to make room for.
    this.pendingOffer = { protocolId: p.id, indications };
    this.lastOfferTurn = this.counters.turns;

    const lead = urgent
      ? `${p.rationale}`
      : `${p.rationale}`;

    return this.move({
      kind: 'offer_protocol',
      text: `${lead} ${p.offer}`,
      expects: 'yesno',
      emotion: { family: 'calm', intensity: 0.35 }, gesture: 'lean_in',
      meta: {
        why: `Indications matched: ${best.reasons.join('; ') || 'general fit'}. Offered rather than imposed (elicit–provide–elicit).`,
        phase: this.phase, modality: p.modality, evidence: p.evidence, protocolId: p.id, approxTurns: p.approxTurns,
      },
    });
  }

  resolveOffer(u) {
    const { protocolId } = this.pendingOffer;
    this.pendingOffer = null;
    const declined = /\b(no|not (now|really|today)|nah|rather not|do not want to|don'?t want to|skip|later|maybe another|i(?:'d| would) rather (just )?talk)\b/i.test(u.raw)
      && !/\b(no,? (go on|okay|ok|sure|why not))\b/i.test(u.raw);

    if (declined) {
      this.note(`protocol ${protocolId} declined`);
      // Declining is information, not failure. Do not re-offer the same thing.
      this.usedProtocols.push(protocolId);
      return this.reflectMove(u, { preferSimple: false, prefix: 'That is completely fine — it was only an offer. ' });
    }

    return this.startProtocol(protocolId, u);
  }

  startProtocol(protocolId, u) {
    const p = getProtocol(protocolId);
    if (!p) return this.reflectMove(u);
    this.activeProtocol = { id: p.id, stepIndex: 0, data: {} };
    this.usedProtocols.push(p.id);
    this.note(`starting protocol ${p.id} (${p.modality})`);
    return this.protocolStep(p, 0);
  }

  advanceProtocol(u) {
    const p = getProtocol(this.activeProtocol.id);
    const step = p.steps[this.activeProtocol.stepIndex];

    // The exercise is never more important than what the person just said. If a
    // turn arrives carrying real affect instead of the answer the step asked for,
    // the structure yields: reflect it, and pick the step up next turn.
    // A short-answer step wants a number or a yes. A long reply with no number in
    // it is not a late answer, it is something the person needed to say instead.
    const expectedShort = step?.expects === 'rating' || step?.expects === 'yesno';
    const looksLikeAnswer = /\b(10|[0-9])\b/.test(u.raw) || u.pragmatics.bareAssent || u.pragmatics.bareDissent;
    if (expectedShort && !looksLikeAnswer && (u.wordCount > 8 || u.affect.intensity >= 0.35)) {
      this.note(`protocol ${p.id} paused at ${step.id}: disclosure took priority`);
      return this.reflectMove(u, { suffix: ` We can come back to the ${p.name.toLowerCase()} in a moment.` });
    }

    if (step?.store) this.activeProtocol.data[step.store] = u.raw.trim();

    // A "no" on a gating step jumps rather than aborting.
    let nextIndex = this.activeProtocol.stepIndex + 1;
    if (step?.ifNo && /^\s*(no|nope|nah|none|not really)\b/i.test(u.raw)) {
      const target = p.steps.findIndex((s) => s.id === step.ifNo);
      if (target >= 0) nextIndex = target;
    }

    // Abandoning mid-protocol must be easy and must not be treated as a failure.
    if (/\b(stop|can we stop|i do not want to|don'?t want to (do )?this|this is not helping|forget it|no more)\b/i.test(u.raw)) {
      this.note(`protocol ${p.id} stopped by user at step ${step?.id}`);
      this.activeProtocol = null;
      return this.move({
        kind: 'reflect',
        text: 'Of course — we stop. That was my suggestion, not an obligation. What do you want instead?',
        expects: 'free',
        emotion: { family: 'calm', intensity: 0.3 }, gesture: 'settle',
        meta: { why: 'Any exercise can be stopped at any point without justification. Pressing on after a refusal is how tools lose people.', phase: this.phase, modality: 'Collaborative stance' },
      });
    }

    if (nextIndex >= p.steps.length) {
      const data = this.activeProtocol.data;
      this.activeProtocol = null;
      this.phase = this.phase === PHASE.EVOKING ? PHASE.PLANNING : this.phase;
      const delta = describeDelta(data);
      const homework = extractHomework(p, data);
      if (homework) this.homework.push(homework);
      return this.move({
        kind: 'protocol_complete',
        text: [p.closing, delta, homework ? `So the thing to take away: ${homework}.` : '', 'How was that?']
          .filter(Boolean).join(' '),
        expects: 'free',
        emotion: { family: 'calm', intensity: 0.35 }, gesture: 'settle',
        meta: { why: `Completed ${p.name}. Outcome is checked rather than assumed.`, phase: this.phase, modality: p.modality, protocolId: p.id, data },
      });
    }

    this.activeProtocol.stepIndex = nextIndex;
    return this.protocolStep(p, nextIndex);
  }

  protocolStep(p, index) {
    const step = p.steps[index];
    // Steps that do not wait for an answer are chained, so guided exercises flow.
    let text = step.say;
    let cursor = index;
    while (p.steps[cursor + 1] && p.steps[cursor].expects === 'none' && p.steps[cursor + 1].expects === 'none') {
      cursor += 1;
      text += ` ${p.steps[cursor].say}`;
    }
    if (cursor !== index) this.activeProtocol.stepIndex = cursor;

    return this.move({
      kind: 'protocol_step',
      text,
      expects: p.steps[cursor].expects,
      emotion: { family: 'calm', intensity: 0.3 }, gesture: 'nod',
      meta: {
        why: p.evidence, phase: this.phase, modality: p.modality,
        protocolId: p.id, stepId: step.id,
        progress: `${cursor + 1}/${p.steps.length}`,
      },
    });
  }

  /* ---------------- phase policy ---------------- */

  byPhase(u) {
    switch (this.phase) {
      case PHASE.OPENING: return this.opening(u);
      case PHASE.ENGAGING: return this.engaging(u);
      case PHASE.FOCUSING: return this.focusing(u);
      case PHASE.EVOKING: return this.evoking(u);
      case PHASE.PLANNING: return this.planning(u);
      case PHASE.CLOSING: return this.closing(u);
      default: return this.engaging(u);
    }
  }

  opening(u) {
    this.phase = PHASE.ENGAGING;
    if (u.wordCount <= 4 && (u.pragmatics.isGreeting || u.pragmatics.silent)) {
      this.counters.questions += 1;
      const bridge = this.priorSession?.lastFocus
        ? ` Last time we were talking about ${this.priorSession.lastFocus}.`
        : '';
      return this.move({
        kind: 'question',
        text: `Hello.${bridge} ${this.frames.pick(OPENING_INVITATIONS)}`,
        expects: 'free',
        emotion: { family: 'calm', intensity: 0.4 }, gesture: 'nod',
        meta: { why: 'Opening with an invitation rather than a questionnaire. A bridge from the previous session is standard cognitive-therapy structure.', phase: PHASE.ENGAGING, modality: 'Session structure' },
      });
    }
    return this.reflectMove(u);
  }

  /**
   * Engaging: reflect far more than you ask. This phase exists to earn the right
   * to do anything else, and the commonest failure is leaving it too early.
   */
  engaging(u) {
    if (u.pragmatics.extended) return this.reflectMove(u, { addDeepener: true });
    if (u.pragmatics.dontKnow) return this.dontKnowMove(u);
    if (u.pragmatics.bareAssent || u.pragmatics.bareDissent) return this.acknowledgeMove(u);
    if (u.pragmatics.terse || u.pragmatics.silent) return this.spaceMove(u);

    if (u.pragmatics.minimising) {
      this.counters.questions += 1;
      return this.move({
        kind: 'question',
        text: 'You just made that smaller. I noticed. You do not have to do that here — what would it sound like if you said it at full size?',
        expects: 'free',
        emotion: { family: 'calm', intensity: 0.4 }, gesture: 'tilt',
        meta: { why: 'Minimisation is named gently rather than accepted, since accepting it teaches the person to keep shrinking what they bring.', phase: PHASE.ENGAGING, modality: 'Person-centred' },
      });
    }

    const readyToFocus = this.counters.turns >= 4
      && this.alliance.bond >= 0.5
      // A named life domain is the usual signal that there is something to focus
      // on — but plenty of what people bring (panic, shame, grief) never names one,
      // and those sessions must not stall in engaging forever.
      && (this.topicsSeen.size > 0 || this.counters.turns >= 6);
    if (readyToFocus) { this.phase = PHASE.FOCUSING; return this.focusing(u); }

    if (this.mustReflect()) return this.reflectMove(u);

    const aff = affirmation(u, this.frames);
    if (aff && this.counters.turns % 4 === 0) {
      this.counters.reflections += 1;
      this.counters.complexReflections += 1;
      return this.move({
        kind: 'affirm', text: aff.text, expects: 'free',
        emotion: { family: 'connection', intensity: 0.45 }, gesture: 'nod',
        meta: { why: 'Affirmation names something the person actually did, rather than praising them — praise positions the listener as an evaluator.', phase: PHASE.ENGAGING, modality: 'Motivational interviewing' },
      });
    }

    this.counters.questions += 1;
    return this.move({
      kind: 'question', text: this.frames.pick(ENGAGING_QUESTIONS), expects: 'free',
      emotion: { family: 'calm', intensity: 0.4 }, gesture: 'lean_in',
      meta: { why: 'Open question in the engaging phase, kept to roughly one for every two reflections.', phase: PHASE.ENGAGING, modality: 'Motivational interviewing' },
    });
  }

  focusing(u) {
    if (this.mustReflect()) return this.reflectMove(u);

    // A single dominant topic means the focus has effectively already been set.
    const top = [...this.topicsSeen.entries()].sort((a, b) => b[1] - a[1])[0];
    if (!this.focus && top && top[1] >= 2) {
      this.focus = top[0];
      this.note(`focus: ${this.focus}`);
      this.phase = PHASE.EVOKING;
      this.counters.questions += 1;
      return this.move({
        kind: 'question',
        text: `A lot of this keeps coming back to ${humaniseTopic(this.focus)}. Is that the thing worth spending our time on, or is something else underneath it?`,
        expects: 'free',
        emotion: { family: 'calm', intensity: 0.4 }, gesture: 'tilt',
        meta: { why: 'Agreeing a focus explicitly rather than assuming it. Agreement on goals is one of the three components of the working alliance.', phase: PHASE.EVOKING, modality: 'Motivational interviewing (focusing)' },
      });
    }

    this.counters.questions += 1;
    this.phase = PHASE.EVOKING;
    return this.move({
      kind: 'question', text: this.frames.pick(FOCUSING_QUESTIONS), expects: 'free',
      emotion: { family: 'calm', intensity: 0.4 }, gesture: 'tilt',
      meta: { why: 'Setting the agenda collaboratively rather than choosing it for them.', phase: PHASE.EVOKING, modality: 'Session structure' },
    });
  }

  evoking(u) {
    // Order matters. Reflecting when the budget demands it comes first, so the
    // ratio stays honest; the offer then lands on the following turn rather than
    // being blocked. Checking the offer first instead let the ratio sag toward
    // interrogation, which is the thing the ratio exists to prevent.
    // MITI's two-reflections-per-question is a whole-session measure, not a rule
    // for each turn. It gates plain open questions hard, and indicated exercises
    // softly — otherwise the fidelity metric starts refusing the therapy.
    const conversationIsReflective = this.reflectionRatio >= 1.2;
    if (conversationIsReflective && this.counters.turns >= 4 && !this.offeredRecently()) {
      const offer = this.offerProtocol(u);
      if (offer) return offer;
    }

    if (this.mustReflect()) return this.reflectMove(u);

    const psychoed = this.maybePsychoeducate(u);
    if (psychoed) return psychoed;

    if (u.changeTalk.mobilising > 0) {
      this.phase = PHASE.PLANNING;
      this.counters.questions += 1;
      return this.move({
        kind: 'question', text: this.frames.pick(PLANNING_QUESTIONS), expects: 'free',
        emotion: { family: 'hope', intensity: 0.45 }, gesture: 'nod',
        meta: { why: 'Mobilising change talk (commitment, activation, taking steps) is the sub-type that predicts behaviour change, so the conversation follows it into planning.', phase: PHASE.PLANNING, modality: 'Motivational interviewing (evoking → planning)' },
      });
    }

    this.counters.questions += 1;
    return this.move({
      kind: 'question', text: this.frames.pick(EVOKING_QUESTIONS), expects: 'free',
      emotion: { family: 'calm', intensity: 0.4 }, gesture: 'lean_in',
      meta: { why: 'Evocative question, designed to draw out the person’s own reasons for change rather than supply reasons for them.', phase: PHASE.EVOKING, modality: 'Motivational interviewing (evoking)' },
    });
  }

  planning(u) {
    if (this.mustReflect()) return this.reflectMove(u);
    if (u.pragmatics.isFarewell || this.counters.turns > 26) { this.phase = PHASE.CLOSING; return this.closing(u); }

    const commitment = u.changeTalk.types.commitment?.[0] || u.changeTalk.types.takingSteps?.[0];
    if (commitment) {
      const clause = toSecondPerson(u.salient) ?? 'that';
      this.homework.push(clause);
      this.counters.questions += 1;
      return this.move({
        kind: 'question',
        text: `So the plan is that ${clause}. ${this.frames.pick(PLANNING_QUESTIONS)}`,
        expects: 'free',
        emotion: { family: 'hope', intensity: 0.5 }, gesture: 'nod',
        meta: { why: 'Consolidating the plan in the person’s own words, then making it concrete enough to survive a bad day.', phase: PHASE.PLANNING, modality: 'Motivational interviewing (planning)' },
      });
    }

    this.counters.questions += 1;
    return this.move({
      kind: 'question', text: this.frames.pick(PLANNING_QUESTIONS), expects: 'free',
      emotion: { family: 'calm', intensity: 0.4 }, gesture: 'nod',
      meta: { why: 'Planning stays concrete: what, when, what gets in the way.', phase: PHASE.PLANNING, modality: 'Motivational interviewing (planning)' },
    });
  }

  closing(u) {
    const s = summary(this.threads, { invite: false });
    this.phase = PHASE.CLOSING;
    const parts = [];
    if (s) parts.push(s.text);
    if (this.homework.length) parts.push(`You said you would ${this.homework[this.homework.length - 1]}.`);
    parts.push('Before you go — was there anything I said that did not sit right, or that missed?');

    this.counters.reflections += 1;
    this.counters.complexReflections += 1;
    return this.move({
      kind: 'close',
      text: parts.join(' '),
      expects: 'free',
      emotion: { family: 'connection', intensity: 0.45 }, gesture: 'settle',
      meta: {
        why: 'Closing summary, the take-away, and an explicit invitation to criticise. Asking for negative feedback is what surfaces the ruptures that otherwise stay invisible.',
        phase: PHASE.CLOSING, modality: 'Session structure', requestFeedback: true, fidelity: this.fidelity(),
      },
    });
  }

  /* ---------------- move builders ---------------- */

  /** True when the reflection-to-question ratio has fallen below MITI competence. */
  mustReflect() {
    return this.reflectionRatio < 2;
  }

  reflectMove(u, { preferSimple = false, prefix = '', suffix = '', addDeepener = false } = {}) {
    const r = reflect(u, this.frames, { preferSimple }) ?? simpleReflection(u, this.frames) ?? feelingReflection(u, this.frames);
    if (!r) return this.spaceMove(u);

    this.counters.reflections += 1;
    if (r.complex) this.counters.complexReflections += 1;

    const clause = toSecondPerson(u.salient);
    if (clause && !this.threads.includes(clause)) this.threads.push(clause);

    const text = `${prefix}${r.text}${addDeepener ? ` ${this.frames.pick(DEEPENERS)}` : ''}${suffix}`;
    const primary = u.affect.families[0];

    return this.move({
      kind: 'reflect',
      text,
      expects: 'free',
      // Tom's expression mirrors the person's affect at reduced intensity. Matching
      // fully reads as performance; not matching at all reads as indifference.
      emotion: { family: primary?.family ?? 'calm', intensity: Math.min(0.7, (primary?.score ?? 1) / 6) },
      gesture: u.affect.arousal > 0.7 ? 'settle' : 'lean_in',
      meta: {
        why: r.complex
          ? 'Complex reflection: adds meaning or feeling the person did not state, which is the MITI marker of skilled practice.'
          : 'Simple reflection: the person’s own words handed back, which invites continuation.',
        phase: this.phase, modality: 'Motivational interviewing / person-centred', reflectionType: r.type,
      },
    });
  }

  /** At most one exercise offer every four turns, so the session is not a menu. */
  offeredRecently() {
    return this.lastOfferTurn != null && this.counters.turns - this.lastOfferTurn < 4;
  }

  /**
   * "I don't know" is almost never a lack of information. It usually means the
   * question was too big, too abstract, or aimed somewhere not yet sayable, so
   * the response is to make the question smaller rather than to ask it again.
   */
  dontKnowMove(u) {
    const bank = [
      'That is a fair answer, and I think I asked it badly. Smaller question: what is the first thing that comes to mind, even if it is wrong?',
      'You do not have to know. What would your guess be?',
      'Alright. Then what do you know — even something small and obvious?',
      'Sometimes not knowing is the honest answer. Can we stay in the not-knowing a moment? What is it like in there?',
    ];
    this.counters.questions += 1;
    return this.move({
      kind: 'question',
      text: bank[this.counters.turns % bank.length],
      expects: 'free',
      emotion: { family: 'calm', intensity: 0.3 }, gesture: 'tilt',
      meta: { why: '"I do not know" is read as a signal that the question was too large or too abstract, so the next one is made smaller rather than repeated.', phase: this.phase, modality: 'Motivational interviewing' },
    });
  }

  /** A bare yes or no answers the previous turn; it carries nothing to reflect. */
  acknowledgeMove(u) {
    const bank = u.pragmatics.bareAssent
      ? ['Good. Go on, then.', 'Right — say more.', 'Okay. Where does that take you?', 'Good. What comes next?']
      : ['Fair enough. What would be closer?', 'Okay — then what is it actually?', 'Understood. Say what it really is.'];
    this.counters.questions += 1;
    return this.move({
      kind: 'question',
      text: bank[this.counters.turns % bank.length],
      expects: 'free',
      emotion: { family: 'calm', intensity: 0.3 }, gesture: 'nod',
      meta: { why: 'A bare assent or refusal replies to the previous turn rather than adding content, so it is built on rather than reflected back.', phase: this.phase, modality: 'Dialogue management' },
    });
  }

  spaceMove(u) {
    return this.move({
      kind: 'space',
      text: this.frames.pick(SPACE_GIVERS),
      expects: 'free',
      emotion: { family: 'calm', intensity: 0.25 }, gesture: 'settle',
      meta: { why: 'Short or absent answers get room rather than another question. Filling the silence is usually the listener managing their own discomfort.', phase: this.phase, modality: 'Person-centred' },
    });
  }

  maybePsychoeducate(u) {
    const indications = new Set(deriveIndications(u));
    for (const [id, item] of Object.entries(PSYCHOEDUCATION)) {
      if (this.psychoedGiven.has(id)) continue;
      if (!item.trigger.some((t) => indications.has(t))) continue;
      this.psychoedGiven.add(id);
      this.counters.questions += 1;
      return this.move({
        kind: 'psychoeducation',
        text: `${item.text} ${item.check}`,
        expects: 'free',
        emotion: { family: 'calm', intensity: 0.3 }, gesture: 'tilt',
        meta: { why: 'Brief psychoeducation, offered once and immediately handed back for the person’s reaction rather than delivered as a lecture.', phase: this.phase, modality: 'Elicit–provide–elicit' },
      });
    }
    return null;
  }

  /* ---------------- plumbing ---------------- */

  trackTopics(u) {
    for (const t of u.topics) this.topicsSeen.set(t, (this.topicsSeen.get(t) ?? 0) + 1);
  }

  /**
   * Accumulate what this session has been about.
   *
   * Choosing an intervention from the latest sentence alone throws away the
   * conversation. Somebody who has spent five turns describing panic and
   * avoidance is still describing panic and avoidance when their sixth sentence
   * happens to be "it has been going on for months". Weights decay so the
   * session can genuinely move on, but not within a single turn.
   */
  trackIndications(u) {
    for (const [key, weight] of this.indicationWeights) {
      const decayed = weight * 0.82;
      if (decayed < 0.25) this.indicationWeights.delete(key);
      else this.indicationWeights.set(key, decayed);
    }
    for (const tag of deriveIndications(u)) {
      this.indicationWeights.set(tag, (this.indicationWeights.get(tag) ?? 0) + 1);
    }
    this.smoothedArousal = this.smoothedArousal * 0.6 + u.affect.arousal * 0.4;
  }

  /** Indications still live in the conversation, strongest first. */
  activeIndications() {
    return [...this.indicationWeights.entries()]
      .sort((a, b) => b[1] - a[1])
      .filter(([, w]) => w >= 0.5)
      .map(([tag]) => tag);
  }

  note(text) {
    this.notes.push({ turn: this.counters.turns, text });
  }

  move(spec) {
    moveSeq += 1;
    return { id: `m${moveSeq}`, ...spec, meta: { ...spec.meta, fidelity: this.fidelity() } };
  }

  /** Final screening. Every path out of the director goes through here. */
  finish(move, u) {
    const checked = enforce(move.text, { riskTier: this.riskTier });
    if (!checked.safe) {
      this.note(`guardrail substitution: ${checked.violations.map((v) => v.category).join(', ')}`);
    }
    const final = {
      ...move,
      text: checked.text,
      guardrails: checked.violations,
      meta: { ...move.meta, riskTier: this.riskTier, alliance: this.alliance.overall, understood: summariseUnderstanding(u) },
    };
    this.lastMove = final;
    return final;
  }

  /** A clinician-readable trace of the session, for the transparency panel and export. */
  transcriptNotes() {
    return {
      phase: this.phase,
      fidelity: this.fidelity(),
      focus: this.focus,
      topics: [...this.topicsSeen.entries()].sort((a, b) => b[1] - a[1]),
      protocolsUsed: this.usedProtocols,
      homework: this.homework,
      ruptures: this.alliance.ruptures,
      riskHistory: this.riskHistory.filter((r) => r.tier > 0),
      notes: this.notes,
    };
  }
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

function summariseUnderstanding(u) {
  if (!u) return null;
  return {
    primaryAffect: u.affect.primary,
    valence: u.affect.valence,
    arousal: u.affect.arousal,
    topics: u.topics,
    distortions: u.distortions.slice(0, 2).map((d) => d.label),
    changeTalk: Object.keys(u.changeTalk.types),
    ambivalent: u.changeTalk.ambivalent,
  };
}

/** Report a before/after rating change from a protocol, when both exist. */
function describeDelta(data) {
  const before = firstNumber(data.before ?? data.belief_before ?? data.confidence);
  const after = firstNumber(data.after);
  if (!Number.isFinite(before) || !Number.isFinite(after)) return '';
  const delta = before - after;
  if (delta >= 2) return `That went from ${before} to ${after}.`;
  if (delta <= -2) return `That went up, from ${before} to ${after} — which is worth knowing too.`;
  return `It is sitting at about ${after}, roughly where it was. That happens, and it does not mean the exercise was wrong for you.`;
}

function firstNumber(value) {
  const m = String(value ?? '').match(/\b(10|\d)\b/);
  return m ? Number(m[1]) : NaN;
}

/** Turn a completed protocol into something concrete to take away. */
function extractHomework(protocol, data) {
  const keys = ['when', 'activity', 'step', 'action', 'first_step', 'commitment', 'test', 'choice', 'opposite'];
  for (const k of keys) {
    const v = data[k];
    if (typeof v === 'string' && v.trim().length > 3) {
      return toSecondPerson(v.trim()) ?? v.trim();
    }
  }
  return null;
}

const TOPIC_LABELS = {
  work: 'work', study: 'your studies', relationship: 'your relationship', family: 'your family',
  friendship: 'your friendships', health: 'your health', money: 'money', grief: 'the loss',
  identity: 'who you are', sleep: 'sleep', self_worth: 'how you see yourself',
  loneliness: 'being on your own', substances: 'drinking or using', parenting: 'your kids',
};

function humaniseTopic(t) { return TOPIC_LABELS[t] ?? t.replace(/_/g, ' '); }

export { humaniseTopic, capitalise };
