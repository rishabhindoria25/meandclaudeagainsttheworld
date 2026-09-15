/**
 * Cognitive distortion taxonomy with surface-form detectors and Socratic probes.
 *
 * Taxonomy follows Beck's cognitive model as popularised by Burns, which is the
 * vocabulary almost every CBT self-help resource and therapist training uses.
 *
 * A note on how these are used: naming a distortion at someone is a reliable way
 * to make them feel corrected rather than understood. The engine therefore treats
 * a detection as a *hypothesis that earns a question*, never as a label to
 * announce. `probes` are collaborative-empiricism questions (examine the evidence)
 * rather than disputation, and `gentleName` is only ever offered with permission.
 */

/**
 * @typedef {object} Distortion
 * @property {string} id
 * @property {string} label            Clinical name (used in notes, not spoken at the client)
 * @property {string} gentleName       How Tom would name it out loud, if invited to
 * @property {string} description      Plain-language description
 * @property {RegExp[]} patterns       Surface forms that raise the hypothesis
 * @property {string[]} probes         Socratic questions (collaborative empiricism)
 * @property {string} reframeCue       Scaffold for building a balanced alternative
 */

/** @type {Distortion[]} */
export const DISTORTIONS = [
  {
    id: 'all_or_nothing',
    label: 'All-or-nothing thinking',
    gentleName: 'all-or-nothing thinking',
    description: 'Seeing a situation in only two categories rather than on a continuum.',
    patterns: [
      /\b(always|never)\b(?!\s+(mind|the\s+less))/i,
      /\b(everyone|everybody|nobody|no one|no-one)\b/i,
      /\b(everything|nothing)\s+(is|goes|works|matters|helps)\b/i,
      /\b(complete|total|utter)\s+(failure|disaster|mess|waste)\b/i,
      /\b(either|only)\s+.{2,30}\bor\b/i,
      /\b(perfect|flawless)\s+or\b/i,
      /\bif\s+(i|it)\s+(can'?t|cannot|don'?t)\s+.{2,40}\bthen\s+(i|it)('?s| am|'m)?\s*(a\s+)?(complete|total|utter|worthless|failure|pointless)/i,
    ],
    probes: [
      'If this were on a scale from nought to ten rather than all-or-nothing, where would it actually land?',
      'Is there a version of this that is partly true and partly not?',
      'What would the in-between look like, if there were one?',
    ],
    reframeCue: 'find the percentage rather than the absolute',
  },
  {
    id: 'catastrophising',
    label: 'Catastrophising',
    gentleName: 'catastrophising',
    description: 'Predicting the worst outcome while treating the prediction as settled fact.',
    patterns: [
      /\b(disaster|catastrophe|catastrophic|ruined|destroyed|the end of (me|everything)|over for me)\b/i,
      /\b(worst[- ]case|worst thing)\b/i,
      /\bwhat if\b.{0,60}\b(die|dies|fail|fails|leave|leaves|lose|loses|fired|sick|wrong|happens)\b/i,
      /\b(i('| a)m going to|i'?ll|it'?s going to)\s+(lose|fail|die|be fired|get fired|be homeless|fall apart|ruin)\b/i,
      /\b(never (recover|get over|be able to)|can'?t come back from)\b/i,
      /\bspiral(ling|ing)?\s+(into|out of control)\b/i,
    ],
    probes: [
      'What is the worst that could happen — and then, honestly, what is the most likely?',
      'If the worst did happen, what would you do next? People usually have more moves than the fear allows.',
      'Has your mind predicted something like this before? How did that prediction turn out?',
    ],
    reframeCue: 'separate the feared outcome from the probable one, then plan for the probable',
  },
  {
    id: 'mind_reading',
    label: 'Mind reading',
    gentleName: 'mind reading',
    description: 'Assuming you know what others think without adequate evidence.',
    patterns: [
      /\b(they|he|she|everyone|everybody|people|she|he)\s+(all\s+)?(think|thinks|thought|must think|probably think|assume|assumes|believe|believes)\b/i,
      /\b(they|he|she|everyone|people)\s+(hate|hates|hated|judge|judges|judged|resent|resents|don'?t like|doesn'?t like)\s+me\b/i,
      /\bi (just )?(know|can tell)\s+(they|he|she|everyone|people)\b/i,
      /\b(could tell|obviously)\s+(they|he|she)\s+(were|was|is|are)\b/i,
      /\bmust have (thought|seemed|looked)\b/i,
    ],
    probes: [
      'What did you actually observe, before your mind filled in what it meant?',
      'If a friend described that same moment to you, what other readings might you offer them?',
      'What would it take to find out, rather than to guess?',
    ],
    reframeCue: 'separate the observation from the interpretation',
  },
  {
    id: 'fortune_telling',
    label: 'Fortune telling',
    gentleName: 'predicting the future as fact',
    description: 'Treating an uncertain future as though it were already decided.',
    patterns: [
      /\b(it|this|that|things?)\s+(will|won'?t|is going to|isn'?t going to)\s+(never\s+)?(work|change|get better|help|matter|last)\b/i,
      /\bi('| a)?m\s+(going to|gonna)\s+(fail|mess (it )?up|screw (it )?up|blow it|ruin)\b/i,
      /\b(there'?s|there is)\s+no\s+(point|way)\s+(in\s+)?(trying|it)\b/i,
      /\bnothing (will|is going to) (change|help|work|get better)\b/i,
      /\bi (already )?know how (this|it) (ends|goes|will go)\b/i,
    ],
    probes: [
      'That is a prediction rather than a report. What is the evidence on each side of it?',
      'How confident are you, as a percentage? And what would move that number?',
      'What is one small experiment that would actually test it?',
    ],
    reframeCue: 'turn the prediction into a testable experiment',
  },
  {
    id: 'should_statements',
    label: 'Should statements',
    gentleName: '"should" rules',
    description: 'Rigid rules about how you or others must be, which mostly generate guilt.',
    patterns: [
      // Deontic "must", not epistemic: "I must be" in "so I must be" is an inference, not a rule.
      /\bi (should|shouldn'?t|ought to|have to|need to)\s+(?!.*\b(ask|tell you|mention|say)\b)/i,
      /\bi must(?!\s+(be|have been|have|admit|say))\b/i,
      /\b(should|shouldn'?t) (have|be able to|know|feel|want)\b/i,
      /\b(they|he|she|people) (should|shouldn'?t|ought to)\b/i,
      /\bsupposed to (be|feel|have|do|know)\b/i,
      /\ba (normal|real|good) (person|adult|parent|friend|partner) would\b/i,
    ],
    probes: [
      'Where did that rule come from, and does it still serve you?',
      'What happens in your body when you say "should" to yourself?',
      'What would change if it were "I would like to" rather than "I should"?',
    ],
    reframeCue: 'convert the rule into a preference and check whether it is still worth keeping',
  },
  {
    id: 'labelling',
    label: 'Labelling',
    gentleName: 'labelling yourself',
    description: 'Attaching a fixed, global label to yourself on the basis of one event.',
    patterns: [
      /\bi(?:'| a)?m\s+(such\s+)?(a\s+)?(failure|loser|idiot|mess|disaster|fraud|burden|joke|waste)\b/i,
      /\bi(?:'| a)?m\s+(just\s+)?(stupid|pathetic|worthless|useless|broken|damaged|lazy|selfish|weak|toxic|unlovable)\b/i,
      /\bthat'?s (just )?who i am\b/i,
      /\bi'?ve always been (the|a)\b/i,
    ],
    probes: [
      'Is that a description of what happened, or a verdict on who you are?',
      'Would you use that word about someone you love who did the same thing?',
      'What would it sound like to describe the behaviour instead of the person?',
    ],
    reframeCue: 'replace the global label with a specific, behavioural description',
  },
  {
    id: 'personalisation',
    label: 'Personalisation',
    gentleName: 'taking the whole weight of it',
    description: 'Assigning yourself responsibility for outcomes you did not solely control.',
    patterns: [
      /\bit(?:'| i)?s (all )?my fault\b/i,
      /\bi (ruined|wrecked|caused|made) (it|them|everything|this|her|him)\b/i,
      /\bif (only )?i (had(n'?t)?|hadn'?t|would'?ve|were|was)\b/i,
      /\bi should have (seen|known|stopped|prevented|done more)\b/i,
      /\bbecause of me\b/i,
      /\bi let (them|everyone|him|her|you) down\b/i,
    ],
    probes: [
      'If you drew a pie chart of everything that contributed, how big would your slice honestly be?',
      'Who or what else had a hand in this?',
      'What was actually within your control at the time — with the information you had then, not now?',
    ],
    reframeCue: 'apportion responsibility across every contributing factor before taking a share',
  },
  {
    id: 'emotional_reasoning',
    label: 'Emotional reasoning',
    gentleName: 'treating a feeling as evidence',
    description: 'Taking the strength of a feeling as proof that the thought behind it is true.',
    patterns: [
      /\bi feel (like )?(such )?(a )?(failure|worthless|useless|stupid|unlovable|guilty|disgusting|broken)\b/i,
      /\bit feels (true|real|right|wrong|hopeless|impossible)\b/i,
      /\bi (just )?feel it,? so it (must be|is)\b/i,
      /\bif i feel (this|like) .{0,20}(then|it must)\b/i,
    ],
    probes: [
      'Feelings are real information about your state — are they also accurate information about the facts here?',
      'What would you conclude if you only had the evidence, without the feeling attached?',
      'Can something feel completely true and still not be true?',
    ],
    reframeCue: 'honour the feeling as real while testing the claim separately',
  },
  {
    id: 'mental_filter',
    label: 'Mental filter',
    gentleName: 'the spotlight on what went wrong',
    description: 'Dwelling on a single negative detail so the whole picture darkens.',
    patterns: [
      /\ball i (can )?(think about|see|remember)\b/i,
      /\bthe only thing (that|i)\b/i,
      /\bi keep (going back to|replaying|thinking about)\b/i,
      /\bi can'?t stop (thinking about|replaying)\b/i,
      /\bone (mistake|thing|comment|moment)\b.{0,40}\b(ruined|everything|whole)\b/i,
    ],
    probes: [
      'What else was in the frame that day, alongside the part you keep returning to?',
      'If you zoomed out to the whole week, what proportion of it was that moment?',
      'What are you leaving out because it does not fit the feeling?',
    ],
    reframeCue: 'widen the frame to include the whole of the evidence',
  },
  {
    id: 'discounting_positive',
    label: 'Discounting the positive',
    gentleName: 'discounting the good bits',
    description: 'Rejecting positive evidence so a negative belief can survive contact with reality.',
    patterns: [
      /\b(that|it) (doesn'?t|does not) (count|matter)\b/i,
      /\b(just|only) (got )?lucky\b/i,
      /\bthey (were|are) (just )?being (nice|polite|kind)\b/i,
      /\banyone (could|would) have\b/i,
      /\byeah,? but\b/i,
      /\bit'?s not (a )?(big deal|that impressive|really an achievement)\b/i,
    ],
    probes: [
      'You moved past that quickly — what would it mean if it did count?',
      'What would you have to believe about yourself for that to be dismissible?',
      'If someone else had done exactly that, what would you call it?',
    ],
    reframeCue: 'let the positive evidence stand at full weight before judging it',
  },
  {
    id: 'overgeneralisation',
    label: 'Overgeneralisation',
    gentleName: 'one instance becoming a pattern',
    description: 'Drawing a sweeping rule from a single event.',
    patterns: [
      /\b(this|it) always happens\b/i,
      /\bevery (time|single time)\b/i,
      /\bi never (get|manage|can|do|am able)\b/i,
      /\btypical\b/i,
      /\bthis is (just )?how it (always )?(goes|is|ends)\b/i,
      /\bstory of my life\b/i,
    ],
    probes: [
      'How many times has it actually gone this way, and how many times has it not?',
      'What is the most recent exception you can find, even a small one?',
      'Is "always" the accurate word here, or the word the feeling reaches for?',
    ],
    reframeCue: 'count the actual instances, including the exceptions',
  },
  {
    id: 'comparison',
    label: 'Unfair comparison',
    gentleName: 'measuring yourself against someone else’s outside',
    description: 'Comparing your interior experience to other people’s visible surface.',
    patterns: [
      /\beveryone else (is|has|seems|can|manages)\b/i,
      /\b(compared to|next to) (him|her|them|everyone|my friends)\b/i,
      /\b(they|he|she) (has|have|got) (it )?(all )?(together|figured out|sorted)\b/i,
      /\bi'?m (so )?(far )?behind\b/i,
      /\bat my age i should\b/i,
    ],
    probes: [
      'What are you comparing — your whole inside against their edited outside?',
      'What would a fair comparison look like, with the same information on both sides?',
      'Whose measure is this, and did you ever agree to it?',
    ],
    reframeCue: 'compare like with like, or change the yardstick to your own values',
  },
];

const ESCAPE_PATTERNS = [
  // Reported speech and hypotheticals: the speaker is quoting, not asserting.
  /\b(my (therapist|friend|mum|mom|dad|partner) (said|says|told me))\b/i,
  /\b(i used to think|i know (logically|rationally)|part of me knows|i can see that)\b/i,
];

/**
 * Detect candidate cognitive distortions in a user utterance.
 *
 * Returns hypotheses ordered by confidence. Confidence is deliberately capped
 * below 1: surface forms are weak evidence, and the engine should hold these
 * loosely.
 *
 * @param {string} text raw user text
 * @returns {Array<{id:string, label:string, gentleName:string, confidence:number, evidence:string, probes:string[], reframeCue:string}>}
 */
export function detectDistortions(text) {
  if (!text || typeof text !== 'string') return [];
  const escaped = ESCAPE_PATTERNS.some((re) => re.test(text));
  const results = [];

  for (const d of DISTORTIONS) {
    let matches = 0;
    let evidence = '';
    for (const re of d.patterns) {
      const m = text.match(re);
      if (m) {
        matches += 1;
        if (!evidence) evidence = m[0].trim();
      }
    }
    if (!matches) continue;
    // Two independent surface forms is meaningfully stronger evidence than one.
    let confidence = Math.min(0.42 + 0.18 * (matches - 1), 0.85);
    if (escaped) confidence *= 0.5;
    results.push({
      id: d.id,
      label: d.label,
      gentleName: d.gentleName,
      confidence: Number(confidence.toFixed(3)),
      evidence,
      probes: d.probes,
      reframeCue: d.reframeCue,
    });
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}

/** @param {string} id */
export function getDistortion(id) {
  return DISTORTIONS.find((d) => d.id === id) ?? null;
}
