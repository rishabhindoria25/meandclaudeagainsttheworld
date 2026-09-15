/**
 * The intervention library.
 *
 * Each protocol is a short, structured exercise drawn from a specific evidence
 * base, expressed as a sequence of conversational steps. Three design rules run
 * through all of them:
 *
 *  1. **Arousal gating.** Cognitive work does not function at high arousal.
 *     Asking someone mid-panic to evaluate the evidence for their thought is
 *     both ineffective and subtly invalidating. Every protocol declares the
 *     arousal band it is usable in, and the director regulates before it thinks.
 *
 *  2. **Permission first.** Every protocol is offered, with a reason, and can be
 *     declined without friction. This is the elicit–provide–elicit structure from
 *     motivational interviewing, and it is what separates guidance from being
 *     talked at.
 *
 *  3. **The person does the work.** Steps ask; they do not tell. Where a protocol
 *     supplies information (psychoeducation), it is brief, it is offered rather
 *     than delivered, and it is immediately handed back for the person's reaction.
 *
 * `expects` describes the shape of the answer the step wants:
 *   'free'   — open text
 *   'rating' — a 0–10 number
 *   'yesno'  — assent
 *   'list'   — several items
 *   'none'   — Tom continues without waiting
 */

/** Arousal bands a protocol can be run in. */
export const AROUSAL = Object.freeze({ LOW: [0, 0.45], MID: [0.25, 0.8], HIGH: [0.6, 1], ANY: [0, 1] });

/**
 * @typedef {object} Step
 * @property {string} id
 * @property {string} say
 * @property {'free'|'rating'|'yesno'|'list'|'none'} expects
 * @property {string} [store]      Key to store the answer under
 * @property {string} [ifNo]       Step id to jump to on a "no"
 * @property {boolean} [optional]
 */

/**
 * @typedef {object} Protocol
 * @property {string} id
 * @property {string} name
 * @property {string} modality
 * @property {string} evidence      One-line provenance, shown in the "why this" panel
 * @property {string} rationale     What Tom says when offering it
 * @property {string} offer         The permission question
 * @property {[number, number]} arousalBand
 * @property {string[]} indications
 * @property {string[]} [contraindications]
 * @property {number} approxTurns
 * @property {Step[]} steps
 * @property {string} [closing]
 */

/* ================================================================== *
 * Downregulation — usable when arousal is too high for anything else
 * ================================================================== */

/** @type {Protocol} */
export const PACED_BREATHING = {
  id: 'paced_breathing',
  name: 'Slower out-breath',
  modality: 'DBT / applied psychophysiology',
  evidence: 'The P in DBT’s TIPP skills. Lengthening the exhale relative to the inhale raises vagal tone and lowers heart rate; it is the fastest non-pharmacological way to shift physiological arousal.',
  rationale: 'When the body is running this hot, thinking clearly is not really available yet — that is physiology, not weakness. The out-breath is the lever.',
  offer: 'Would you be up for about ninety seconds of breathing with me first? Then we can think.',
  arousalBand: [0.7, 1],
  indications: ['panic', 'high_arousal', 'anger', 'overwhelm'],
  approxTurns: 5,
  steps: [
    { id: 'settle', expects: 'none', say: 'Put both feet flat on the floor. You do not have to close your eyes if that feels worse.' },
    { id: 'in', expects: 'none', say: 'Breathe in through your nose for four. One… two… three… four.' },
    { id: 'out', expects: 'none', say: 'Now out through your mouth for six, slowly, like you are fogging a window. One… two… three… four… five… six.' },
    { id: 'repeat', expects: 'none', say: 'Again. In for four… and out, longer, for six. The out-breath is the one doing the work.' },
    { id: 'again', expects: 'none', say: 'Twice more, at your own pace. I will wait.' },
    { id: 'check', expects: 'rating', store: 'after', say: 'Where is it now, nought to ten?' },
  ],
  closing: 'That is the body coming down a notch. It does not fix anything, it just gives you back the room to think.',
};

/** @type {Protocol} */
export const GROUNDING_54321 = {
  id: 'grounding_54321',
  name: '5-4-3-2-1 grounding',
  modality: 'DBT distress tolerance',
  evidence: 'Sensory grounding, used in DBT distress tolerance. Works best when distress comes with dissociation, derealisation, or racing thoughts, by reoccupying attention with present-moment sensory input.',
  rationale: 'When the mind is somewhere else — the past, the worst case, nowhere at all — the senses are the quickest route back into the room.',
  offer: 'Can we bring you back into the room for a minute? It is quick, and it is a bit odd, and it works.',
  arousalBand: AROUSAL.HIGH,
  indications: ['dissociation', 'panic', 'flashback', 'numbness', 'racing_thoughts'],
  approxTurns: 6,
  steps: [
    { id: 'five', expects: 'list', store: 'see', say: 'Five things you can see. Say them out loud, however boring.' },
    { id: 'four', expects: 'list', store: 'hear', say: 'Four things you can hear. Including the ones underneath the obvious ones.' },
    { id: 'three', expects: 'list', store: 'touch', say: 'Three things you can feel touching you. The chair, your clothes, the floor.' },
    { id: 'two', expects: 'list', store: 'smell', say: 'Two things you can smell. Or two things you could smell if you went looking.' },
    { id: 'one', expects: 'free', store: 'taste', say: 'And one thing you can taste.' },
    { id: 'check', expects: 'rating', store: 'after', say: 'Nought to ten — how far away does it feel now?' },
  ],
  closing: 'You came back. That is a skill, and it gets faster with use.',
};

/** @type {Protocol} */
export const TIPP = {
  id: 'tipp',
  name: 'TIPP',
  modality: 'DBT distress tolerance',
  evidence: 'Temperature, Intense exercise, Paced breathing, Paired muscle relaxation. Designed for distress at 8/10 and above, where the aim is to change body chemistry directly rather than to reason.',
  rationale: 'At this level of distress, nothing verbal is going to touch it. TIPP changes your physiology directly — cold water triggers the dive reflex and drops your heart rate within seconds.',
  offer: 'This is the one for when it is unbearable rather than merely awful. Shall I walk you through it?',
  arousalBand: AROUSAL.HIGH,
  indications: ['crisis', 'urge_to_self_harm', 'panic', 'extreme_distress'],
  contraindications: ['cardiac condition', 'eating disorder with low heart rate', 'pregnancy — check with a doctor before the cold-water step'],
  approxTurns: 4,
  steps: [
    { id: 'safety', expects: 'yesno', store: 'safe_for_cold', say: 'One check first, and I do mean it: do you have any heart condition, low heart rate, or eating disorder? If yes we skip the cold part and go straight to the breathing.', ifNo: 'temperature' },
    { id: 'temperature', expects: 'none', say: 'Cold water on your face — hold your breath and put your face in a bowl of cold water, or hold something very cold against your eyes and upper cheeks, for about thirty seconds.' },
    { id: 'exercise', expects: 'none', say: 'Then move hard for sixty seconds. Star jumps, running on the spot, stairs. You are trying to burn off the adrenaline rather than get fit.' },
    { id: 'breathing', expects: 'rating', store: 'after', say: 'Then slow the breathing right down, out-breath longer than in. Where is the distress now, nought to ten?' },
  ],
  closing: 'That is chemistry, not willpower. Nothing is solved, but you have made it through the peak, and the peak is the dangerous part.',
};

/** @type {Protocol} */
export const STOP_SKILL = {
  id: 'stop_skill',
  name: 'STOP',
  modality: 'DBT distress tolerance',
  evidence: 'Stop, Take a step back, Observe, Proceed mindfully. A brief interrupt that creates the pause in which every other skill becomes possible.',
  rationale: 'The gap between the urge and the action is where all the choice lives. STOP is how you widen it.',
  offer: 'Before you do anything — can we take four steps together? It takes twenty seconds.',
  arousalBand: AROUSAL.HIGH,
  indications: ['urge', 'impulsivity', 'anger', 'about_to_act'],
  approxTurns: 4,
  steps: [
    { id: 'stop', expects: 'none', say: 'Stop. Do not move, do not send, do not reply. Freeze for a second. Your body does not have to obey the urge instantly.' },
    { id: 'step_back', expects: 'none', say: 'Take a step back. Literally, if you can — out of the room, away from the phone. Take one breath out, longer than the one in.' },
    { id: 'observe', expects: 'free', store: 'observation', say: 'Observe. What is actually happening, right now, in facts rather than in interpretation? And what is happening in your body?' },
    { id: 'proceed', expects: 'free', store: 'plan', say: 'Proceed mindfully. Knowing what you want out of this in an hour’s time — what is the next thing you do?' },
  ],
};

/* ================================================================== *
 * Cognitive work — requires arousal to be moderate or low
 * ================================================================== */

/** @type {Protocol} */
export const THOUGHT_RECORD = {
  id: 'thought_record',
  name: 'Thought record',
  modality: 'CBT',
  evidence: 'The foundational tool of Beckian cognitive therapy. Separates situation, thought, feeling and evidence so each can be examined on its own instead of arriving as one undifferentiated lump.',
  rationale: 'Thoughts arrive feeling like facts. Pulling the moment apart into its pieces is what lets you see which parts are observation and which parts are interpretation.',
  offer: 'Would it be useful to slow that thought right down and look at it properly? It takes a few minutes and it is a bit methodical.',
  arousalBand: AROUSAL.MID,
  indications: ['negative_automatic_thought', 'self_criticism', 'anxiety', 'rumination'],
  contraindications: ['high arousal — regulate first', 'acute grief, where the thought is not distorted and does not need testing'],
  approxTurns: 8,
  steps: [
    { id: 'situation', expects: 'free', store: 'situation', say: 'Start with the facts. Where were you, what was happening, and when? Just what a camera would have recorded.' },
    { id: 'emotion', expects: 'free', store: 'emotion', say: 'And what did you feel? One or two words.' },
    { id: 'intensity', expects: 'rating', store: 'before', say: 'How strong was it, nought to ten?' },
    { id: 'thought', expects: 'free', store: 'thought', say: 'Now the important one. What went through your mind right then? The actual sentence, in your own words — not the tidied-up version.' },
    { id: 'belief', expects: 'rating', store: 'belief_before', say: 'How much do you believe that thought, nought to ten?' },
    { id: 'evidence_for', expects: 'list', store: 'evidence_for', say: 'What is the evidence that it is true? Real evidence — things that happened, things that were said. Not how strongly it feels true.' },
    { id: 'evidence_against', expects: 'list', store: 'evidence_against', say: 'And now the harder half: what is the evidence it is not true, or not entirely true? Including anything that does not fit.' },
    { id: 'friend', expects: 'free', store: 'friend_view', say: 'If someone you love told you this exact thing about themselves — same situation, same thought — what would you say to them?', optional: true },
    { id: 'balanced', expects: 'free', store: 'balanced', say: 'Given both columns, what is a version you could actually believe? Not a positive one — a true one.' },
    { id: 'rerate', expects: 'rating', store: 'after', say: 'And how strong is the feeling now, nought to ten?' },
  ],
  closing: 'The point was never to think happy thoughts. It was to stop the first thought getting the final word.',
};

/** @type {Protocol} */
export const DOWNWARD_ARROW = {
  id: 'downward_arrow',
  name: 'Downward arrow',
  modality: 'CBT',
  evidence: 'Traces an automatic thought down to the intermediate rule or core belief sustaining it. Used when the surface thought keeps returning after being successfully challenged.',
  rationale: 'Sometimes the thought on the surface is not the one doing the damage. It helps to follow it down.',
  offer: 'Can I ask the same annoying question a few times in a row? It goes somewhere.',
  arousalBand: AROUSAL.LOW,
  indications: ['recurrent_thought', 'core_belief', 'perfectionism', 'shame'],
  contraindications: ['high distress — this deliberately goes toward the painful belief', 'active suicidal ideation'],
  approxTurns: 5,
  steps: [
    { id: 'thought', expects: 'free', store: 'thought', say: 'What is the thought? Say it in one sentence.' },
    { id: 'arrow1', expects: 'free', store: 'level1', say: 'Suppose that were true. What would that mean?' },
    { id: 'arrow2', expects: 'free', store: 'level2', say: 'And if that were true — what would be so bad about that?' },
    { id: 'arrow3', expects: 'free', store: 'level3', say: 'And what would that say about you?' },
    { id: 'land', expects: 'free', store: 'core', say: 'That last one sounds like it goes deep. Is that a belief you have carried for a long time?' },
  ],
  closing: 'That belief did not appear from nowhere — it was almost certainly true of somewhere you once were. The question worth sitting with is whether it is still true of where you are now. That is good work to do with a real therapist.',
};

/** @type {Protocol} */
export const BEHAVIOURAL_EXPERIMENT = {
  id: 'behavioural_experiment',
  name: 'Behavioural experiment',
  modality: 'CBT',
  evidence: 'Testing a prediction against reality. Behavioural experiments produce larger and more durable belief change than verbal disputation alone.',
  rationale: 'Arguing with a prediction rarely shifts it. Finding out does.',
  offer: 'Rather than debating whether that is true — shall we design a way to actually find out?',
  arousalBand: AROUSAL.LOW,
  indications: ['fortune_telling', 'mind_reading', 'avoidance', 'social_anxiety'],
  approxTurns: 6,
  steps: [
    { id: 'prediction', expects: 'free', store: 'prediction', say: 'What exactly do you predict will happen? Be specific enough that we would know if it came true.' },
    { id: 'confidence', expects: 'rating', store: 'confidence', say: 'How confident are you that it will go that way, nought to ten?' },
    { id: 'test', expects: 'free', store: 'test', say: 'What is the smallest thing you could do this week that would test it? Small enough that you would actually do it.' },
    { id: 'measure', expects: 'free', store: 'measure', say: 'What would count as evidence either way? What would you be watching for?' },
    { id: 'safety_behaviours', expects: 'free', store: 'safety_behaviours', say: 'Anything you usually do to hedge — rehearsing, apologising first, having an exit lined up? Those tend to contaminate the result.', optional: true },
    { id: 'when', expects: 'free', store: 'when', say: 'When will you run it? Day and rough time.' },
  ],
  closing: 'Whatever happens is useful. If the prediction is wrong, the belief takes a real hit. If it is right, we find out what actually made it so.',
};

/** @type {Protocol} */
export const WORRY_TRIAGE = {
  id: 'worry_triage',
  name: 'Worry triage',
  modality: 'CBT for GAD',
  evidence: 'Separates hypothetical worry from current problems. Current problems get problem-solving; hypothetical worries get postponement and acceptance, because problem-solving a hypothetical is what keeps it running.',
  rationale: 'Worry mixes two very different things together: problems you can act on, and futures you cannot. They need opposite treatments, so the first job is to sort them.',
  offer: 'Shall we sort what is actually on your mind into two piles? It helps more than it sounds like it will.',
  arousalBand: AROUSAL.MID,
  indications: ['worry', 'rumination', 'anxiety', 'future_orientation'],
  approxTurns: 6,
  steps: [
    { id: 'dump', expects: 'list', store: 'worries', say: 'Tell me everything on the list. All of it, in no particular order — do not tidy it.' },
    { id: 'sort', expects: 'free', store: 'sorted', say: 'Now, of those: which are real problems happening now, where there is a step you could take — and which are "what ifs" about a future that has not happened?' },
    { id: 'current', expects: 'free', store: 'first_step', say: 'Take the most pressing real one. What is the single next action? Not solving it — the next action.' },
    { id: 'when', expects: 'free', store: 'when', say: 'When will you do that?' },
    { id: 'hypothetical', expects: 'free', store: 'hypothetical_plan', say: 'Now the "what ifs". These cannot be solved, only fed. Would you be willing to give them a slot — fifteen minutes at a set time tomorrow, worry as hard as you like, and when they show up before then you note them and say "not now, six o’clock"?' },
    { id: 'check', expects: 'rating', store: 'after', say: 'How loud is it now, nought to ten?' },
  ],
  closing: 'Postponing a worry is not suppressing it. You are keeping the appointment — just not letting it set the agenda all day.',
};

/* ================================================================== *
 * Acceptance and Commitment Therapy
 * ================================================================== */

/** @type {Protocol} */
export const DEFUSION = {
  id: 'defusion',
  name: 'Cognitive defusion',
  modality: 'ACT',
  evidence: 'One of the six processes of the ACT hexaflex. Changes the *relationship* to a thought rather than its content, which is useful when a thought is accurate, or when disputing it has already failed.',
  rationale: 'Some thoughts do not need to be argued with. They need to be seen as thoughts — words showing up in a mind — rather than as instructions or verdicts.',
  offer: 'Want to try something that sounds ridiculous? It is meant to. It works because it is ridiculous.',
  arousalBand: AROUSAL.MID,
  indications: ['self_criticism', 'recurrent_thought', 'rumination', 'fusion', 'thought_resisted_disputation'],
  approxTurns: 6,
  steps: [
    { id: 'thought', expects: 'free', store: 'thought', say: 'Give me the thought, in its shortest form. Five or six words. The way it actually shows up.' },
    { id: 'believe', expects: 'rating', store: 'before', say: 'How much does it hook you right now, nought to ten?' },
    { id: 'prefix', expects: 'none', say: 'Now say it again with this in front of it: "I am having the thought that…". Say the whole thing.' },
    { id: 'prefix2', expects: 'free', store: 'noticed', say: 'And once more, one layer further out: "I notice I am having the thought that…". What changed, if anything?' },
    { id: 'silly', expects: 'free', store: 'silly', say: 'Last one, and this is the ridiculous part. Say it in a cartoon voice. Mine, if you like. Or sing it to Happy Birthday.' },
    { id: 'rerate', expects: 'rating', store: 'after', say: 'How much does it hook you now, nought to ten?' },
  ],
  closing: 'The thought is still there — we did not delete it, and we were not trying to. It just has less of a grip. That is the whole trick.',
};

/** @type {Protocol} */
export const VALUES_CLARIFICATION = {
  id: 'values_clarification',
  name: 'What actually matters',
  modality: 'ACT',
  evidence: 'Values clarification and committed action, the two ACT processes most closely linked to behaviour change. Values give action a direction that survives bad days, which goals do not.',
  rationale: 'Goals can be finished or failed. Values are directions you can keep moving in even on a terrible day — which makes them a much better thing to organise a life around.',
  offer: 'Can I ask you something bigger than the problem for a minute?',
  arousalBand: AROUSAL.LOW,
  indications: ['meaninglessness', 'stuck', 'life_decision', 'low_mood', 'burnout'],
  approxTurns: 6,
  steps: [
    { id: 'domains', expects: 'free', store: 'domain', say: 'Of these — relationships, work, health, learning, community, play, and the way you treat yourself — which one is furthest from how you would want it?' },
    { id: 'why', expects: 'free', store: 'why', say: 'What is it about that one that stings? What would it look like if it were going well?' },
    { id: 'eulogy', expects: 'free', store: 'quality', say: 'Here is an odd question. If someone who knew you properly described how you were in that part of your life — and you got to choose the words — what would you want them to be able to say?' },
    { id: 'gap', expects: 'rating', store: 'alignment', say: 'Nought to ten, how close is your actual week to that?' },
    { id: 'step', expects: 'free', store: 'step', say: 'What is one small thing you could do in the next few days that would move it one point?' },
    { id: 'obstacle', expects: 'free', store: 'obstacle', say: 'And what will get in the way? Be realistic — we plan for the real obstacle, not the tidy one.' },
  ],
  closing: 'A value is not something you achieve. It is a direction you keep choosing, including on the days you do it badly.',
};

/** @type {Protocol} */
export const WILLINGNESS = {
  id: 'willingness',
  name: 'Making room',
  modality: 'ACT',
  evidence: 'Acceptance / expansion. The struggle to not feel a feeling reliably costs more than the feeling does; willingness is the alternative to that struggle, not resignation to the situation.',
  rationale: 'Fighting a feeling tends to keep it in the room longer. Making room for it is not giving in — it frees up the effort you were spending on the fight.',
  offer: 'Rather than trying to get rid of it — can we try making room for it instead? It is counter-intuitive.',
  arousalBand: AROUSAL.MID,
  indications: ['anxiety', 'grief', 'unavoidable_pain', 'avoidance', 'chronic_illness'],
  approxTurns: 5,
  steps: [
    { id: 'locate', expects: 'free', store: 'location', say: 'Where is it in your body? Most feelings have an address — chest, throat, stomach, jaw.' },
    { id: 'describe', expects: 'free', store: 'shape', say: 'If it had a shape, a weight, a temperature — what would they be? You are not fixing it, just observing it, like a curious scientist.' },
    { id: 'breathe', expects: 'none', say: 'Now breathe into that spot. Not to get rid of it. To make the space around it a bit bigger.' },
    { id: 'allow', expects: 'free', store: 'allowing', say: 'See if you can let it be there, without needing it to leave. What happens when you stop pushing against it?' },
    { id: 'cost', expects: 'free', store: 'cost', say: 'What has the fight against this feeling been costing you — in time, energy, things you have not done?' },
  ],
  closing: 'Willingness is not wanting it. It is being open to what is already here, so you can spend your energy on what you actually care about.',
};

/* ================================================================== *
 * Behavioural activation
 * ================================================================== */

/** @type {Protocol} */
export const BEHAVIOURAL_ACTIVATION = {
  id: 'behavioural_activation',
  name: 'Getting moving',
  modality: 'Behavioural activation',
  evidence: 'Behavioural activation performs at least as well as cognitive therapy and antidepressant medication for adults with major depression, including more severe presentations, across more than thirty controlled trials.',
  rationale: 'Depression narrows life down to what feels manageable, and the narrowing is what keeps it going. Action comes before motivation here, not after — that order is the whole intervention.',
  offer: 'Can we look at what your days actually contain at the moment? Not to make you do more — to find out where the reward went.',
  arousalBand: AROUSAL.LOW,
  indications: ['depression', 'withdrawal', 'anhedonia', 'avoidance', 'low_energy'],
  contraindications: ['acute grief in the first weeks', 'physical illness limiting activity — scale accordingly'],
  approxTurns: 7,
  steps: [
    { id: 'monitor', expects: 'free', store: 'yesterday', say: 'Walk me through yesterday. Roughly, hour by hour — including the hours where the answer is "bed" or "phone".' },
    { id: 'spot', expects: 'free', store: 'best_moment', say: 'Anywhere in there, even for two minutes, where you felt slightly less bad, or slightly more like yourself?' },
    { id: 'avoided', expects: 'free', store: 'avoided', say: 'And what did you avoid? Things you put off, cancelled, or did not open.' },
    { id: 'values_link', expects: 'free', store: 'matters', say: 'Of the things you have stopped doing — which one did you actually used to care about, rather than just feel you should do?' },
    { id: 'tiny', expects: 'free', store: 'activity', say: 'Now shrink it until it is almost insultingly small. Not "go for a run" — "put my trainers by the door". What is the insultingly small version?' },
    { id: 'schedule', expects: 'free', store: 'when', say: 'When, specifically? Day and time. Vague plans do not survive contact with a bad morning.' },
    { id: 'barrier', expects: 'free', store: 'barrier', say: 'What will stop you? And what is the plan for when it does — because it probably will, and that is not failure, it is data.' },
  ],
  closing: 'Waiting to feel like it is the trap — the feeling tends to arrive after the action, not before. So the job is to make the action small enough to do without the feeling.',
};

/* ================================================================== *
 * Solution-focused and motivational
 * ================================================================== */

/** @type {Protocol} */
export const SCALING = {
  id: 'scaling',
  name: 'Scaling',
  modality: 'Solution-focused brief therapy',
  evidence: 'Scaling questions locate existing progress and make the next step concrete and small. The question that does the work is "why that number and not lower?", which surfaces resources the person had not counted.',
  rationale: 'Numbers make the invisible visible — including the part of this you are already managing.',
  offer: 'Can I ask you to put a number on it? It is more useful than it sounds.',
  arousalBand: AROUSAL.MID,
  indications: ['stuck', 'hopelessness', 'progress_review', 'ambivalence'],
  approxTurns: 4,
  steps: [
    { id: 'rate', expects: 'rating', store: 'now', say: 'Nought to ten, where ten is this being as good as it could realistically get and nought is the worst it has been — where are you today?' },
    { id: 'why_not_lower', expects: 'free', store: 'resources', say: 'Why that number, and not two lower? What is already in place that is holding it up there?' },
    { id: 'one_up', expects: 'free', store: 'next_step', say: 'What would one point higher look like? Not ten — one point. What would be different that someone else could notice?' },
    { id: 'step', expects: 'free', store: 'action', say: 'And what is the smallest thing that would move it that one point?' },
  ],
  closing: 'You are not at nought. Whatever is holding you where you are took something to build, and it is worth knowing what it is.',
};

/** @type {Protocol} */
export const EXCEPTION_FINDING = {
  id: 'exception_finding',
  name: 'Finding the exceptions',
  modality: 'Solution-focused brief therapy',
  evidence: 'Exceptions are the times the problem could have happened and did not. They are direct evidence of existing capability and are usually invisible to the person until asked about.',
  rationale: 'Problems are almost never constant, even when they feel it. The gaps are where the information is.',
  offer: 'Can we go looking for the times this is slightly less bad?',
  arousalBand: AROUSAL.MID,
  indications: ['all_or_nothing', 'hopelessness', 'overgeneralisation'],
  approxTurns: 4,
  steps: [
    { id: 'exception', expects: 'free', store: 'exception', say: 'When was the last time this could have happened and somehow did not? Or was even slightly easier?' },
    { id: 'different', expects: 'free', store: 'difference', say: 'What was different about that time? Where were you, who was there, what had you done beforehand?' },
    { id: 'agency', expects: 'free', store: 'agency', say: 'What part of that was down to something you did — even something small you might not have counted?' },
    { id: 'more', expects: 'free', store: 'replicate', say: 'What would it take to have more of that?' },
  ],
};

/** @type {Protocol} */
export const READINESS_RULERS = {
  id: 'readiness_rulers',
  name: 'Importance and confidence',
  modality: 'Motivational interviewing',
  evidence: 'Importance and confidence rulers separate two very different reasons for not changing: not caring enough, and not believing you can. They call for opposite responses.',
  rationale: 'Being stuck can mean two completely different things, and the way out is different for each.',
  offer: 'Could I ask you for two quick numbers? They usually make the shape of the stuckness obvious.',
  arousalBand: AROUSAL.MID,
  indications: ['ambivalence', 'stuck', 'behaviour_change', 'sustain_talk'],
  approxTurns: 5,
  steps: [
    { id: 'target', expects: 'free', store: 'target', say: 'What is the change we are talking about? Name it in one line.' },
    { id: 'importance', expects: 'rating', store: 'importance', say: 'Nought to ten — how important is it to you to make that change?' },
    { id: 'why_importance', expects: 'free', store: 'importance_reasons', say: 'Why that number rather than a lower one? What makes it matter as much as it does?' },
    { id: 'confidence', expects: 'rating', store: 'confidence', say: 'And nought to ten — if you decided to do it, how confident are you that you could?' },
    { id: 'why_confidence', expects: 'free', store: 'confidence_reasons', say: 'What would need to be true for that number to be one higher?' },
  ],
  closing: 'High importance and low confidence is a completely different problem from low importance. It is worth knowing which one you are actually in.',
};

/* ================================================================== *
 * Self-relating
 * ================================================================== */

/** @type {Protocol} */
export const SELF_COMPASSION_BREAK = {
  id: 'self_compassion_break',
  name: 'Self-compassion break',
  modality: 'Mindful self-compassion',
  evidence: 'Neff’s three components: mindfulness of the pain, common humanity, and self-kindness. Self-compassion is associated with lower shame and, contrary to the common worry, with more rather than less accountability.',
  rationale: 'Shame says the problem is you, and it makes change harder rather than easier. Compassion is not letting yourself off — it is what makes it survivable to look at what happened.',
  offer: 'Can I ask you to try something you will probably resist?',
  arousalBand: AROUSAL.MID,
  indications: ['shame', 'self_criticism', 'guilt', 'perfectionism', 'failure'],
  approxTurns: 5,
  steps: [
    { id: 'name', expects: 'free', store: 'moment', say: 'Bring the moment to mind. Say what happened, plainly.' },
    { id: 'mindfulness', expects: 'none', say: 'First part: name it. "This is hard." Or "this hurts." Out loud if you can — it is meant to feel awkward.' },
    { id: 'humanity', expects: 'free', store: 'humanity', say: 'Second part: you are not uniquely broken here. Who else do you think has felt exactly this? Not abstractly — someone real.' },
    { id: 'kindness', expects: 'free', store: 'kind_words', say: 'Third part, and the hard one. What would you say to a friend in exactly this position? The actual words.' },
    { id: 'turn', expects: 'free', store: 'to_self', say: 'Now say those words to yourself. Use your own name if it helps. What comes up when you try?' },
  ],
  closing: 'If that felt fraudulent, that is the most common reaction and it does not mean it is not working. Shame does not give up territory quickly.',
};

/** @type {Protocol} */
export const SLEEP_RESET = {
  id: 'sleep_reset',
  name: 'Sleep reset',
  modality: 'CBT for insomnia (brief)',
  evidence: 'Stimulus control and sleep restriction are the two active ingredients of CBT-I, which outperforms sleeping medication at follow-up and is the recommended first-line treatment for chronic insomnia.',
  rationale: 'Most sleep advice is about relaxing. The parts that actually work are about breaking the association between your bed and lying awake — which is a learning problem, not a relaxation problem.',
  offer: 'Want the two bits of sleep advice that actually have evidence behind them, rather than the lavender?',
  arousalBand: AROUSAL.LOW,
  indications: ['insomnia', 'sleep', 'rumination_at_night'],
  contraindications: ['bipolar disorder or epilepsy — sleep restriction needs clinical supervision'],
  approxTurns: 6,
  steps: [
    { id: 'pattern', expects: 'free', store: 'pattern', say: 'What does a bad night actually look like? What time do you go up, how long are you awake, what are you doing while you are awake?' },
    { id: 'stimulus_control', expects: 'yesno', store: 'willing_to_leave_bed', say: 'Here is the first one, and it is the one people hate: if you are awake for more than about twenty minutes, get out of bed. Go somewhere else, dim light, something dull, come back when sleepy. Your bed needs to stop being the place where you lie awake. Could you try it?' },
    { id: 'anchor', expects: 'free', store: 'wake_time', say: 'Second one: a fixed wake time, every day, including weekends. It is what sets the whole rhythm. What time could you actually hold to?' },
    { id: 'worry_window', expects: 'free', store: 'worry_window', say: 'If the problem is your mind rather than your body, the worry usually needs somewhere else to go. Could you write tomorrow’s list at seven in the evening instead of at midnight?' },
    { id: 'caffeine', expects: 'free', store: 'substances', say: 'Two quick checks: when is your last caffeine, and is alcohol involved? Alcohol gets you to sleep and then fragments the second half of the night.', optional: true },
    { id: 'commit', expects: 'free', store: 'commitment', say: 'Which one of those will you try first? One is plenty.' },
  ],
  closing: 'Give it a fortnight before you judge it. It gets slightly worse before it gets better, which is why people stop on night three.',
};

/** @type {Protocol} */
export const PROBLEM_SOLVING = {
  id: 'problem_solving',
  name: 'Problem solving',
  modality: 'Problem-solving therapy',
  evidence: 'Structured problem-solving is an effective stand-alone treatment for depression, particularly where low mood is maintained by real and unresolved practical problems.',
  rationale: 'Some problems are not distorted thinking. They are problems. Those need a different tool.',
  offer: 'This one sounds like it might be an actual problem rather than an anxious thought about one. Shall we treat it as such?',
  arousalBand: AROUSAL.MID,
  indications: ['practical_problem', 'overwhelm', 'decision', 'money', 'work'],
  approxTurns: 6,
  steps: [
    { id: 'define', expects: 'free', store: 'problem', say: 'Define it as narrowly as you can. Not "my life is a mess" — the specific, concrete problem, in one sentence.' },
    { id: 'goal', expects: 'free', store: 'goal', say: 'What would "good enough" look like? Not perfect. Good enough.' },
    { id: 'options', expects: 'list', store: 'options', say: 'Now list every option, including the stupid ones and the ones you have already rejected. Do not evaluate yet — that comes next, and doing both at once is what stops people generating anything.' },
    { id: 'evaluate', expects: 'free', store: 'evaluation', say: 'Which two are least bad? What does each cost you?' },
    { id: 'choose', expects: 'free', store: 'choice', say: 'Pick one. It does not have to be right, it has to be reversible enough to start.' },
    { id: 'first_step', expects: 'free', store: 'first_step', say: 'What is the first action, and when? Something you could do in under ten minutes.' },
  ],
};

/** @type {Protocol} */
export const OPPOSITE_ACTION = {
  id: 'opposite_action',
  name: 'Opposite action',
  modality: 'DBT emotion regulation',
  evidence: 'Acting opposite to an emotion’s action urge weakens the emotion — but only when the emotion does not fit the facts, or when acting on it would be ineffective. Checking the facts first is not optional.',
  rationale: 'Every emotion comes with an urge. When the emotion does not fit the situation, following the urge feeds it, and doing the opposite — fully, not half-heartedly — turns it down.',
  offer: 'Can we check whether the feeling fits the facts here? That decides which way to go.',
  arousalBand: AROUSAL.MID,
  indications: ['avoidance', 'shame', 'anger', 'depression', 'urge'],
  approxTurns: 5,
  steps: [
    { id: 'emotion', expects: 'free', store: 'emotion', say: 'What is the emotion, and what does it want you to do? Every feeling has an urge attached.' },
    { id: 'fits', expects: 'free', store: 'fits_facts', say: 'Does it fit the facts? Anger fits if you were genuinely wronged; fear fits if there is a real threat; shame fits if you actually violated your own values. Which is it here?' },
    { id: 'effective', expects: 'free', store: 'effective', say: 'And even if it fits — would acting on the urge get you what you want in the longer run?' },
    { id: 'opposite', expects: 'free', store: 'opposite', say: 'If not, what is the opposite? Avoidance becomes approach. Hiding becomes being seen. Attacking becomes gently stepping away.' },
    { id: 'all_the_way', expects: 'free', store: 'commit', say: 'It only works done fully — posture, voice, all of it. Half-hearted opposite action rehearses the emotion. What would doing it all the way look like?' },
  ],
};

export const PROTOCOLS = [
  PACED_BREATHING, GROUNDING_54321, TIPP, STOP_SKILL,
  THOUGHT_RECORD, DOWNWARD_ARROW, BEHAVIOURAL_EXPERIMENT, WORRY_TRIAGE,
  DEFUSION, VALUES_CLARIFICATION, WILLINGNESS,
  BEHAVIOURAL_ACTIVATION,
  SCALING, EXCEPTION_FINDING, READINESS_RULERS,
  SELF_COMPASSION_BREAK, SLEEP_RESET, PROBLEM_SOLVING, OPPOSITE_ACTION,
];

export const PROTOCOLS_BY_ID = Object.fromEntries(PROTOCOLS.map((p) => [p.id, p]));

/** @param {string} id */
export function getProtocol(id) { return PROTOCOLS_BY_ID[id] ?? null; }

/**
 * Protocols usable at a given arousal level. This is the arousal gate: it is the
 * reason Tom will not hand someone a thought record mid-panic.
 * @param {number} arousal 0..1
 */
export function usableAt(arousal) {
  return PROTOCOLS.filter((p) => arousal >= p.arousalBand[0] && arousal <= p.arousalBand[1]);
}

/**
 * Rank protocols against the current understanding.
 *
 * @param {object} signals
 * @param {number} signals.arousal
 * @param {string[]} [signals.indications] Derived indication tags
 * @param {string[]} [signals.recentlyUsed] Protocol ids already used this session
 * @returns {Array<{protocol: Protocol, score: number, reasons: string[]}>}
 */
export function rankProtocols(signals) {
  const { arousal = 0.5, indications = [], recentlyUsed = [] } = signals;
  const wanted = new Set(indications);

  return PROTOCOLS.map((p) => {
    const reasons = [];
    let score = 0;

    const [lo, hi] = p.arousalBand;
    if (arousal < lo || arousal > hi) {
      // Out of band is a hard exclusion for cognitive work, a soft one otherwise.
      return { protocol: p, score: -Infinity, reasons: ['outside usable arousal band'] };
    }
    score += 1;

    const matched = p.indications.filter((i) => wanted.has(i));
    score += matched.length * 2;
    if (matched.length) reasons.push(`indicated for ${matched.join(', ')}`);

    // Narrower arousal bands are more specifically targeted, so prefer them.
    score += (1 - (hi - lo)) * 0.5;

    if (recentlyUsed.includes(p.id)) {
      score -= 4;
      reasons.push('already used this session');
    }

    return { protocol: p, score, reasons };
  })
    .filter((r) => r.score > -Infinity)
    .sort((a, b) => b.score - a.score);
}
