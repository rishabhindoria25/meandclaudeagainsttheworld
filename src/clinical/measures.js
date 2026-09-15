/**
 * Measurement-based care.
 *
 * Routine outcome monitoring is one of the few things that reliably improves
 * psychotherapy outcomes independent of modality: therapists who track symptoms
 * and alliance session by session, and act on deterioration, get better results
 * than therapists who rely on clinical impression. The same logic applies with
 * more force to a self-help tool, which has no clinical impression to rely on.
 *
 * Instruments included:
 *   - PHQ-9 / PHQ-2 (Kroenke, Spitzer & Williams). Public domain; no permission
 *     required to reproduce, translate, display or distribute.
 *   - GAD-7 / GAD-2 (Spitzer, Kroenke, Williams & Löwe). Same terms.
 *   - WHO-5 Well-Being Index (WHO Regional Office for Europe). Free to use with
 *     attribution.
 *   - A session feedback check covering Bordin's three alliance components
 *     (bond, goals, tasks) plus an overall rating. This is written from scratch
 *     rather than reproducing a proprietary instrument such as the SRS, but it
 *     is used the same way: a low score is a prompt to talk about the low score.
 *
 * None of these produce a diagnosis. They are self-report screens whose only job
 * here is to notice a trend and to say so out loud.
 */

const FREQ_OPTIONS = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
];

export const PHQ9 = {
  id: 'phq9',
  name: 'PHQ-9',
  fullName: 'Patient Health Questionnaire-9',
  domain: 'depressive symptoms',
  window: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
  options: FREQ_OPTIONS,
  attribution: 'Kroenke, Spitzer & Williams (2001). Public domain.',
  items: [
    'Little interest or pleasure in doing things',
    'Feeling down, depressed, or hopeless',
    'Trouble falling or staying asleep, or sleeping too much',
    'Feeling tired or having little energy',
    'Poor appetite or overeating',
    'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
    'Trouble concentrating on things, such as reading the newspaper or watching television',
    'Moving or speaking so slowly that other people could have noticed — or the opposite, being so fidgety or restless that you have been moving around a lot more than usual',
    'Thoughts that you would be better off dead, or of hurting yourself in some way',
  ],
  // Item 9 is a risk item, not merely a symptom item, and is routed to the safety layer.
  riskItemIndex: 8,
  max: 27,
  bands: [
    { min: 0, max: 4, label: 'minimal', note: 'Below the range usually described as clinically significant.' },
    { min: 5, max: 9, label: 'mild' },
    { min: 10, max: 14, label: 'moderate', note: 'At or above the usual screening threshold of 10.' },
    { min: 15, max: 19, label: 'moderately severe' },
    { min: 20, max: 27, label: 'severe' },
  ],
  clinicalCutoff: 10,
  reliableChange: 5,
};

export const GAD7 = {
  id: 'gad7',
  name: 'GAD-7',
  fullName: 'Generalised Anxiety Disorder-7',
  domain: 'anxiety symptoms',
  window: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
  options: FREQ_OPTIONS,
  attribution: 'Spitzer, Kroenke, Williams & Löwe (2006). Public domain.',
  items: [
    'Feeling nervous, anxious, or on edge',
    'Not being able to stop or control worrying',
    'Worrying too much about different things',
    'Trouble relaxing',
    'Being so restless that it is hard to sit still',
    'Becoming easily annoyed or irritable',
    'Feeling afraid, as if something awful might happen',
  ],
  riskItemIndex: null,
  max: 21,
  bands: [
    { min: 0, max: 4, label: 'minimal' },
    { min: 5, max: 9, label: 'mild' },
    { min: 10, max: 14, label: 'moderate', note: 'At or above the usual screening threshold of 10.' },
    { min: 15, max: 21, label: 'severe' },
  ],
  clinicalCutoff: 10,
  reliableChange: 4,
};

export const WHO5 = {
  id: 'who5',
  name: 'WHO-5',
  fullName: 'WHO-5 Well-Being Index',
  domain: 'well-being',
  window: 'Over the last two weeks…',
  higherIsBetter: true,
  options: [
    { value: 5, label: 'All of the time' },
    { value: 4, label: 'Most of the time' },
    { value: 3, label: 'More than half the time' },
    { value: 2, label: 'Less than half the time' },
    { value: 1, label: 'Some of the time' },
    { value: 0, label: 'At no time' },
  ],
  attribution: 'WHO Regional Office for Europe. Free to use with attribution.',
  items: [
    'I have felt cheerful and in good spirits',
    'I have felt calm and relaxed',
    'I have felt active and vigorous',
    'I woke up feeling fresh and rested',
    'My daily life has been filled with things that interest me',
  ],
  riskItemIndex: null,
  max: 25,
  // Reported as a percentage of maximum, which is how the WHO-5 is conventionally scored.
  scale: 4,
  bands: [
    { min: 0, max: 28, label: 'poor', note: 'At or below 28 (percentage scale) is often used as a prompt to screen for depression.' },
    { min: 29, max: 50, label: 'reduced', note: 'At or below 50 suggests well-being worth attending to.' },
    { min: 51, max: 75, label: 'moderate' },
    { min: 76, max: 100, label: 'good' },
  ],
  clinicalCutoff: 50,
  reliableChange: 10,
};

/**
 * Session feedback, covering Bordin's three alliance components plus an overall
 * rating. Asked at the end of a session; a score below the threshold is treated
 * as a possible alliance rupture and opens a conversation rather than a log entry.
 */
export const SESSION_FEEDBACK = {
  id: 'session_feedback',
  name: 'Session feedback',
  fullName: 'End-of-session alliance check',
  domain: 'working alliance',
  window: 'Thinking about just now:',
  higherIsBetter: true,
  options: Array.from({ length: 11 }, (_, i) => ({ value: i, label: String(i) })),
  attribution: 'Original items, built on Bordin (1979): bond, goals, tasks.',
  items: [
    'I felt heard and taken seriously', // bond
    'We worked on what actually matters to me', // goals
    'The way we went about it suited me', // tasks
    'Overall, this was worth my time', // global
  ],
  components: ['bond', 'goals', 'tasks', 'overall'],
  riskItemIndex: null,
  max: 40,
  bands: [
    { min: 0, max: 24, label: 'poor', note: 'Something is off. Worth naming directly.' },
    { min: 25, max: 32, label: 'mixed', note: 'Below the level at which alliance feedback is usually treated as fine.' },
    { min: 33, max: 40, label: 'good' },
  ],
  clinicalCutoff: 33,
  reliableChange: 5,
};

export const INSTRUMENTS = { phq9: PHQ9, gad7: GAD7, who5: WHO5, session_feedback: SESSION_FEEDBACK };

/** Two-item ultra-brief screens, used as the routine mood check so sessions are not front-loaded with forms. */
export const PHQ2 = { id: 'phq2', name: 'PHQ-2', parent: 'phq9', items: PHQ9.items.slice(0, 2), options: FREQ_OPTIONS, max: 6, clinicalCutoff: 3, window: PHQ9.window };
export const GAD2 = { id: 'gad2', name: 'GAD-2', parent: 'gad7', items: GAD7.items.slice(0, 2), options: FREQ_OPTIONS, max: 6, clinicalCutoff: 3, window: GAD7.window };

/**
 * Score a set of item responses.
 *
 * @param {object} instrument One of the exported instrument definitions
 * @param {number[]} responses One value per item, in item order
 * @returns {{raw:number, scaled:number, max:number, band:string, note:string|undefined, aboveCutoff:boolean, riskItem:number|null, complete:boolean}}
 */
export function score(instrument, responses) {
  const items = instrument.items ?? [];
  const values = items.map((_, i) => Number(responses?.[i]));
  const complete = values.every((v) => Number.isFinite(v));
  const raw = values.reduce((sum, v) => sum + (Number.isFinite(v) ? v : 0), 0);
  const scaled = instrument.scale ? raw * instrument.scale : raw;
  const bands = instrument.bands ?? [];
  const band = bands.find((b) => scaled >= b.min && scaled <= b.max) ?? bands[bands.length - 1] ?? { label: 'unscored' };

  const aboveCutoff = instrument.higherIsBetter
    ? scaled <= (instrument.clinicalCutoff ?? -Infinity)
    : scaled >= (instrument.clinicalCutoff ?? Infinity);

  const riskIdx = instrument.riskItemIndex;
  const riskItem = Number.isInteger(riskIdx) && Number.isFinite(values[riskIdx]) ? values[riskIdx] : null;

  return {
    raw,
    scaled,
    max: instrument.scale ? instrument.max * instrument.scale : instrument.max,
    band: band.label,
    note: band.note,
    aboveCutoff,
    riskItem,
    complete,
  };
}

/**
 * Compare two administrations using the Reliable Change Index threshold, so the
 * app never reports normal measurement noise as progress or deterioration.
 *
 * @param {object} instrument
 * @param {number} previousScaled
 * @param {number} currentScaled
 */
export function changeSince(instrument, previousScaled, currentScaled) {
  const delta = currentScaled - previousScaled;
  const threshold = instrument.reliableChange ?? 5;
  const magnitude = Math.abs(delta);
  const reliable = magnitude >= threshold;
  const improved = instrument.higherIsBetter ? delta > 0 : delta < 0;

  let direction = 'stable';
  if (reliable) direction = improved ? 'improved' : 'deteriorated';

  return {
    delta,
    magnitude,
    reliable,
    direction,
    threshold,
    description: reliable
      ? `${magnitude} point ${improved ? 'improvement' : 'increase'} — above the ${threshold}-point threshold usually treated as a real change rather than noise.`
      : `${magnitude} point change — within the range normally treated as measurement noise.`,
  };
}

/**
 * Detect deterioration across a series. Acting on deterioration signals is the
 * component of routine outcome monitoring with the clearest evidence behind it.
 *
 * @param {object} instrument
 * @param {Array<{scaled:number, at:string}>} history oldest first
 */
export function trend(instrument, history) {
  if (!history || history.length < 2) return { direction: 'insufficient', points: history?.length ?? 0 };
  const first = history[0];
  const last = history[history.length - 1];
  const overall = changeSince(instrument, first.scaled, last.scaled);
  const recent = changeSince(instrument, history[history.length - 2].scaled, last.scaled);

  return {
    direction: overall.direction,
    overall,
    recent,
    points: history.length,
    // Sustained deterioration is the flag that should prompt a human referral.
    alert: recent.direction === 'deteriorated' && overall.direction !== 'improved',
  };
}

/**
 * Render a short, non-diagnostic, plain-language reading of a score.
 * @param {object} instrument
 * @param {ReturnType<typeof score>} scored
 */
export function describe(instrument, scored) {
  const unit = instrument.scale ? `${scored.scaled} out of ${scored.max}` : `${scored.raw} out of ${scored.max}`;
  const lines = [`${instrument.name}: ${unit} — ${scored.band} range.`];
  if (scored.note) lines.push(scored.note);
  lines.push('That is a screening questionnaire, not a diagnosis. Only a clinician can tell you what it means for you.');
  return lines.join(' ');
}

/**
 * Suggest which instrument to offer next, given what the conversation is about
 * and when each was last taken. Screens are offered, never imposed, and never
 * more often than every two weeks — the recall window they ask about.
 *
 * @param {{topics?:string[], affect?:{families:Array<{family:string}>}}} understanding
 * @param {Record<string, {at:string}>} lastTaken ISO timestamps keyed by instrument id
 * @param {number} [nowMs]
 */
export function suggestInstrument(understanding, lastTaken = {}, nowMs = Date.now()) {
  const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;
  const due = (id) => {
    const at = lastTaken[id]?.at;
    return !at || nowMs - new Date(at).getTime() >= TWO_WEEKS;
  };
  const families = new Set((understanding?.affect?.families ?? []).map((f) => f.family));

  if ((families.has('sadness') || families.has('hopelessness') || families.has('numbness')) && due('phq9')) return PHQ9;
  if ((families.has('anxiety') || families.has('overwhelm')) && due('gad7')) return GAD7;
  if (due('who5')) return WHO5;
  return null;
}
