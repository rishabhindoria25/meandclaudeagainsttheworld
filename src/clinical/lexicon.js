/**
 * Affect lexicon and lightweight linguistic resources.
 *
 * Emotion families are organised around the dimensional model used throughout
 * affective science (valence x arousal; Russell, 1980) while retaining the
 * discrete-category labels that clients actually use for themselves. Each entry
 * carries an intensity weight (1 = mild, 2 = moderate, 3 = severe) because
 * "a bit down" and "utterly destroyed" are clinically different events that a
 * naive bag-of-words model flattens into the same thing.
 *
 * Valence: -1 (highly unpleasant) .. +1 (highly pleasant)
 * Arousal:  0 (deactivated / flat) .. 1 (highly activated)
 */

/** @typedef {{v:number, a:number, terms:Array<[string, 1|2|3]>}} EmotionFamily */

/** @type {Record<string, EmotionFamily>} */
export const EMOTION_FAMILIES = {
  sadness: {
    v: -0.7, a: 0.25,
    terms: [
      ['sad', 2], ['down', 1], ['low', 1], ['blue', 1], ['unhappy', 2], ['miserable', 3],
      ['depressed', 3], ['despondent', 3], ['heartbroken', 3], ['gutted', 3], ['tearful', 2],
      ['crying', 2], ['weeping', 2], ['sobbing', 3], ['melancholy', 2], ['dejected', 2],
      ['downhearted', 2], ['glum', 1], ['hurt', 2], ['aching', 2], ['sorrow', 3], ['grief', 3],
      ['wistful', 1], ['bummed', 1], ['upset', 2], ['crushed', 3], ['devastated', 3],
      ['ended', 2], ['broke up', 2], ['left me', 3], ['walked out', 2], ['over between us', 2],
      ['missing', 2], ['aching for', 2], ['welling up', 2],
      ['breaks my heart', 3], ['broke my heart', 3], ['breaking my heart', 3],
    ],
  },
  anxiety: {
    v: -0.6, a: 0.8,
    terms: [
      ['anxious', 2], ['anxiety', 2], ['nervous', 2], ['worried', 2], ['worry', 2], ['worrying', 2],
      ['scared', 2], ['afraid', 2], ['fear', 2], ['fearful', 2], ['terrified', 3], ['panicking', 3],
      ['panic', 3], ['panicky', 3], ['dread', 3], ['uneasy', 1], ['apprehensive', 2], ['on edge', 2],
      ['jumpy', 2], ['restless', 2], ['tense', 2], ['jittery', 2], ['freaking out', 3],
      ['spiralling', 3], ['spiraling', 3], ['catastrophizing', 2], ['petrified', 3], ['stressed', 2],
      ['racing thoughts', 3], ['cant breathe', 3], ["can't breathe", 3], ['hyperventilating', 3],
      ['can not breathe', 3], ['chest is tight', 3], ['chest goes tight', 3], ['heart racing', 3],
      ['heart is pounding', 3], ['think i am dying', 3], ['going to pass out', 3], ['shaking', 2],
      ['trembling', 2], ['dizzy', 2], ['sick with', 2], ['knot in my stomach', 2], ['clammy', 2],
    ],
  },
  anger: {
    v: -0.6, a: 0.85,
    terms: [
      ['angry', 2], ['anger', 2], ['mad', 2], ['furious', 3], ['livid', 3], ['irate', 3],
      ['enraged', 3], ['rage', 3], ['irritated', 1], ['annoyed', 1], ['frustrated', 2],
      ['frustration', 2], ['resentful', 2], ['resentment', 2], ['bitter', 2], ['pissed', 2],
      ['pissed off', 2], ['fed up', 2], ['seething', 3], ['fuming', 3], ['hostile', 2],
      ['indignant', 2], ['outraged', 3],
    ],
  },
  shame: {
    v: -0.8, a: 0.5,
    terms: [
      ['ashamed', 3], ['shame', 3], ['embarrassed', 2], ['humiliated', 3], ['guilty', 2],
      ['guilt', 2], ['remorse', 2], ['mortified', 3], ['worthless', 3], ['pathetic', 3],
      ['disgusting', 3], ['failure', 3], ['stupid', 2], ['useless', 3], ['broken', 3],
      ['unlovable', 3], ['defective', 3], ['inadequate', 2], ['not good enough', 3],
      ['a burden', 3], ['self loathing', 3], ['hate myself', 3], ['disappointed in myself', 2],
      ['hiding it', 2], ['pretending', 2], ['putting on a face', 2], ['a fraud', 3], ['found out', 2],
      ['ashamed of how', 3], ['cringe', 1], ['humiliating', 3],
    ],
  },
  loneliness: {
    v: -0.7, a: 0.3,
    terms: [
      ['lonely', 2], ['alone', 2], ['isolated', 2], ['abandoned', 3], ['rejected', 2],
      ['left out', 2], ['unwanted', 3], ['disconnected', 2], ['invisible', 2], ['forgotten', 2],
      ['no one cares', 3], ['nobody cares', 3], ['on my own', 2], ['unseen', 2], ['excluded', 2],
      ['the only one', 2], ['no one to tell', 3], ['stopped answering', 2], ['shut everyone out', 3],
      ['pulled away', 2], ['withdrawn', 2],
    ],
  },
  hopelessness: {
    v: -0.9, a: 0.15,
    terms: [
      ['hopeless', 3], ['pointless', 3], ['no point', 3], ['meaningless', 3], ['futile', 3],
      ['despair', 3], ['giving up', 3], ['give up', 3], ['gave up', 2], ['defeated', 2],
      ['trapped', 3], ['stuck', 2], ['no way out', 3], ['never get better', 3], ['whats the point', 3],
      ["what's the point", 3], ['nothing matters', 3], ['nothing helps', 3], ['nothing works', 3],
      ['no future', 3], ['cant go on', 3], ["can't go on", 3],
    ],
  },
  overwhelm: {
    v: -0.6, a: 0.75,
    terms: [
      ['overwhelmed', 3], ['overwhelming', 3], ['too much', 2], ['drowning', 3], ['swamped', 2],
      ['buried', 2], ['cant cope', 3], ["can't cope", 3], ['falling apart', 3], ['breaking down', 3],
      ['at my limit', 3], ['maxed out', 2], ['stretched thin', 2], ['crushing', 3], ['suffocating', 3],
      ['pressure', 2], ['juggling', 1],
      ['not coping', 3], ['barely coping', 3], ['struggling', 2], ['falling behind', 2],
      ['keeping my head above water', 2], ['holding it together', 2], ['about to snap', 3],
      ['spread too thin', 2], ['relentless', 2], ['never stops', 2],
    ],
  },
  exhaustion: {
    v: -0.5, a: 0.1,
    terms: [
      ['exhausted', 3], ['tired', 1], ['drained', 2], ['depleted', 3], ['burnt out', 3],
      ['burned out', 3], ['burnout', 3], ['worn out', 2], ['knackered', 2], ['fatigued', 2],
      ['no energy', 2], ['running on empty', 3], ['wiped out', 2], ['weary', 2],
    ],
  },
  numbness: {
    v: -0.4, a: 0.05,
    terms: [
      ['numb', 3], ['empty', 3], ['hollow', 3], ['nothing', 2], ['flat', 2], ['blank', 2],
      ['detached', 2], ['dissociated', 3], ['unreal', 2], ['going through the motions', 2],
      ['on autopilot', 2], ['disconnected from myself', 3], ['dont feel anything', 3],
      ["don't feel anything", 3], ['feel nothing', 3], ['void', 3], ['apathetic', 2],
    ],
  },
  grief: {
    v: -0.8, a: 0.35,
    terms: [
      ['grieving', 3], ['grief', 3], ['loss', 2], ['lost him', 3], ['lost her', 3], ['lost them', 3],
      ['passed away', 3], ['died', 3], ['death', 2], ['funeral', 2], ['mourning', 3], ['bereaved', 3],
      ['miss him', 2], ['miss her', 2], ['miss them', 2], ['gone forever', 3],
    ],
  },
  jealousy: {
    v: -0.5, a: 0.6,
    terms: [
      ['jealous', 2], ['jealousy', 2], ['envious', 2], ['envy', 2], ['left behind', 2],
      ['everyone else', 1], ['comparing myself', 2], ['behind everyone', 2],
    ],
  },
  confusion: {
    v: -0.2, a: 0.5,
    terms: [
      ['confused', 2], ['lost', 2], ['unsure', 1], ['uncertain', 1], ['torn', 2], ['conflicted', 2],
      ['dont know', 1], ["don't know", 1], ['mixed up', 2], ['foggy', 2], ['muddled', 2],
      ['cant think straight', 2], ["can't think straight", 2],
    ],
  },
  disgust: {
    v: -0.7, a: 0.55,
    terms: [['disgusted', 2], ['repulsed', 3], ['sickened', 2], ['revolted', 3], ['grossed out', 1]],
  },
  hope: {
    v: 0.6, a: 0.5,
    terms: [
      ['hopeful', 2], ['hope', 2], ['optimistic', 2], ['looking forward', 2], ['excited', 2],
      ['encouraged', 2], ['motivated', 2], ['determined', 2], ['ready', 1], ['possible', 1],
      ['a bit better', 1], ['lighter', 2], ['promising', 1],
    ],
  },
  joy: {
    v: 0.85, a: 0.7,
    terms: [
      ['happy', 2], ['joyful', 3], ['glad', 1], ['delighted', 3], ['thrilled', 3], ['elated', 3],
      ['great', 1], ['good', 1], ['wonderful', 2], ['amazing', 2], ['fantastic', 2], ['cheerful', 2],
      ['upbeat', 2], ['buzzing', 2], ['over the moon', 3],
    ],
  },
  calm: {
    v: 0.6, a: 0.1,
    terms: [
      ['calm', 2], ['peaceful', 2], ['relaxed', 2], ['settled', 2], ['grounded', 2], ['steady', 1],
      ['content', 2], ['at ease', 2], ['serene', 3], ['relieved', 2], ['relief', 2], ['safe', 2],
      ['okay', 1], ['alright', 1], ['fine', 1],
    ],
  },
  pride: {
    v: 0.75, a: 0.55,
    terms: [
      ['proud', 2], ['pride', 2], ['accomplished', 2], ['capable', 2], ['confident', 2],
      ['strong', 2], ['pleased with myself', 2], ['achieved', 2], ['managed it', 2],
    ],
  },
  gratitude: {
    v: 0.8, a: 0.4,
    terms: [
      ['grateful', 2], ['gratitude', 2], ['thankful', 2], ['appreciate', 1], ['appreciated', 2],
      ['blessed', 2], ['lucky', 1],
    ],
  },
  connection: {
    v: 0.8, a: 0.45,
    terms: [
      ['loved', 3], ['love', 2], ['supported', 2], ['understood', 2], ['heard', 2], ['seen', 2],
      ['close to', 2], ['connected', 2], ['belong', 2], ['cared for', 2], ['held', 2],
    ],
  },
};

/** Multiplies the intensity of the emotion term that follows. */
export const INTENSIFIERS = {
  'so': 1.35, 'very': 1.3, 'really': 1.3, 'extremely': 1.6, 'incredibly': 1.55, 'utterly': 1.7,
  'completely': 1.6, 'totally': 1.5, 'absolutely': 1.6, 'insanely': 1.6, 'unbelievably': 1.55,
  'deeply': 1.45, 'profoundly': 1.5, 'terribly': 1.5, 'awfully': 1.45, 'super': 1.3,
  'crazy': 1.4, 'hella': 1.4, 'seriously': 1.3, 'genuinely': 1.2, 'truly': 1.25, 'always': 1.3,
  'constantly': 1.4, 'unbearably': 1.75, 'overwhelmingly': 1.7, 'desperately': 1.6, 'fucking': 1.6,
};

/** Reduces the intensity of the emotion term that follows. */
export const DOWNTONERS = {
  'slightly': 0.6, 'somewhat': 0.7, 'a bit': 0.65, 'a little': 0.6, 'kind of': 0.7, 'kinda': 0.7,
  'sort of': 0.7, 'sorta': 0.7, 'mildly': 0.6, 'fairly': 0.8, 'rather': 0.85, 'slight': 0.6,
  'occasionally': 0.7, 'sometimes': 0.75, 'once in a while': 0.65, 'mostly': 0.9, 'barely': 0.5,
  'hardly': 0.5, 'not very': 0.5, 'not that': 0.55, 'less': 0.7, 'little bit': 0.6,
};

/**
 * Negators flip polarity within a short window. Scoped rather than global:
 * "I'm not happy" negates; "I'm not going to lie, I'm exhausted" must not.
 */
export const NEGATORS = [
  'not', "n't", 'no', 'never', 'none', 'nothing', 'nobody', 'nowhere', 'neither', 'nor',
  'cannot', "can't", 'cant', 'without', 'hardly', 'scarcely', 'barely', 'rarely', 'seldom',
  'stopped', 'refuse', 'refused', 'dont', "don't", 'doesnt', "doesn't", 'isnt', "isn't",
  'wasnt', "wasn't", 'arent', "aren't", 'wouldnt', "wouldn't",
];

/** Phrases after which a negator should not be applied to the rest of the clause. */
export const NEGATION_ESCAPES = [
  'not going to lie', 'not gonna lie', 'not only', 'not to mention', 'no doubt', 'not just',
  'no wonder', 'not sure if', 'not that it matters',
];

/** Clause boundaries terminate a negation window. */
export const CLAUSE_BOUNDARIES = new Set(['but', 'however', 'although', 'though', 'yet', 'because', 'so', 'and', 'while', 'whereas']);

/** Common contraction expansions applied before tokenisation. */
export const CONTRACTIONS = {
  "i'm": 'i am', "i've": 'i have', "i'd": 'i would', "i'll": 'i will',
  "you're": 'you are', "you've": 'you have', "you'd": 'you would', "you'll": 'you will',
  "he's": 'he is', "she's": 'she is', "it's": 'it is', "that's": 'that is', "there's": 'there is',
  "we're": 'we are', "we've": 'we have', "they're": 'they are', "they've": 'they have',
  "can't": 'can not', "cannot": 'can not', "won't": 'will not', "don't": 'do not',
  "doesn't": 'does not', "didn't": 'did not', "isn't": 'is not', "aren't": 'are not',
  "wasn't": 'was not', "weren't": 'were not', "haven't": 'have not', "hasn't": 'has not',
  "hadn't": 'had not', "wouldn't": 'would not', "shouldn't": 'should not', "couldn't": 'could not',
  "mustn't": 'must not', "let's": 'let us', "what's": 'what is', "who's": 'who is',
  "ain't": 'am not', "y'all": 'you all', "gonna": 'going to', "wanna": 'want to', "gotta": 'got to',
};

/** Lexical stems that signal the speaker is describing somebody other than themselves. */
export const THIRD_PARTY_SUBJECTS = [
  'my friend', 'a friend', 'my mate', 'my brother', 'my sister', 'my mum', 'my mom', 'my dad',
  'my partner', 'my wife', 'my husband', 'my son', 'my daughter', 'my colleague', 'my coworker',
  'my client', 'my patient', 'my student', 'someone i know', 'a guy', 'this person', 'my cousin',
  'my neighbour', 'my neighbor', 'my ex', 'my boss', 'my teacher', 'my roommate', 'my flatmate',
];

/** Framings that mark the surrounding text as hypothetical, fictional, or quoted. */
export const NON_LITERAL_FRAMES = [
  'in the movie', 'in the film', 'in the book', 'in the show', 'the character', 'the lyrics',
  'the song', 'a novel', 'the news said', 'i read that', 'i saw an article', 'hypothetically',
  'what if someone', 'asking for a friend', 'in the game', 'my character', 'the plot',
  'a study found', 'statistics say', 'the documentary',
];

const TERM_INDEX = (() => {
  /** @type {Map<string, Array<{family:string, weight:1|2|3}>>} */
  const index = new Map();
  for (const [family, def] of Object.entries(EMOTION_FAMILIES)) {
    for (const [term, weight] of def.terms) {
      if (!index.has(term)) index.set(term, []);
      index.get(term).push({ family, weight });
    }
  }
  return index;
})();

/** Longest multi-word emotion term, used to bound n-gram scanning. */
export const MAX_TERM_WORDS = Math.max(
  ...[...TERM_INDEX.keys()].map((t) => t.split(' ').length),
);

/**
 * Look up an n-gram in the emotion lexicon.
 * @param {string} phrase lower-cased phrase
 * @returns {Array<{family:string, weight:1|2|3, v:number, a:number}>}
 */
export function lookupEmotion(phrase) {
  const hits = TERM_INDEX.get(phrase);
  if (!hits) return [];
  return hits.map((h) => ({ ...h, v: EMOTION_FAMILIES[h.family].v, a: EMOTION_FAMILIES[h.family].a }));
}

/** Families grouped by the therapeutic response they typically call for. */
export const FAMILY_GROUPS = {
  activatedDistress: ['anxiety', 'anger', 'overwhelm', 'jealousy'],
  deactivatedDistress: ['sadness', 'hopelessness', 'numbness', 'exhaustion', 'loneliness', 'grief'],
  selfDirected: ['shame'],
  positive: ['hope', 'joy', 'calm', 'pride', 'gratitude', 'connection'],
  ambiguous: ['confusion', 'disgust'],
};

/** Plain-language feeling words Tom uses when reflecting, keyed by family + intensity band. */
export const REFLECTION_FEELING_WORDS = {
  sadness: { low: 'a bit low', mid: 'sad', high: 'deeply sad' },
  anxiety: { low: 'uneasy', mid: 'anxious', high: 'really frightened' },
  anger: { low: 'irritated', mid: 'angry', high: 'furious' },
  shame: { low: 'self-critical', mid: 'ashamed', high: 'like there is something wrong with you' },
  loneliness: { low: 'a bit apart from people', mid: 'lonely', high: 'completely alone in it' },
  hopelessness: { low: 'discouraged', mid: 'hopeless', high: 'like there is no way out' },
  overwhelm: { low: 'stretched', mid: 'overwhelmed', high: 'like it is more than you can carry' },
  exhaustion: { low: 'tired', mid: 'drained', high: 'completely spent' },
  numbness: { low: 'a bit distant', mid: 'numb', high: 'cut off from yourself' },
  grief: { low: 'quietly sad about it', mid: 'deep in the grief', high: 'weighed down by losing them' },
  jealousy: { low: 'aware of the comparison', mid: 'left behind', high: 'painfully far behind everyone' },
  confusion: { low: 'unsure', mid: 'torn', high: 'completely lost' },
  disgust: { low: 'put off', mid: 'repulsed', high: 'sickened' },
  hope: { low: 'slightly hopeful', mid: 'hopeful', high: 'genuinely hopeful' },
  joy: { low: 'pleased', mid: 'happy', high: 'really joyful' },
  calm: { low: 'settled', mid: 'calm', high: 'genuinely at peace' },
  pride: { low: 'pleased with yourself', mid: 'proud', high: 'really proud' },
  gratitude: { low: 'appreciative', mid: 'grateful', high: 'deeply grateful' },
  connection: { low: 'connected', mid: 'cared for', high: 'really held by them' },
};
