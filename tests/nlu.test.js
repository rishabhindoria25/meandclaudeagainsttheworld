/** Understanding tests: affect, negation scoping, change talk, pragmatics. */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parse, scoreAffect, scoreChangeTalk, normalise, salientClause } from '../src/clinical/nlu.js';
import { detectDistortions } from '../src/clinical/distortions.js';

describe('normalisation', () => {
  test('expands contractions', () => {
    assert.equal(normalise("I'm fine, I can't do it"), 'i am fine, i can not do it');
  });
  test('handles smart quotes', () => {
    assert.equal(normalise('I’m tired'), 'i am tired');
  });
});

describe('affect scoring', () => {
  test('identifies the dominant family', () => {
    assert.equal(scoreAffect('I am so anxious about tomorrow').primary, 'anxiety');
    assert.equal(scoreAffect('I feel completely hopeless').primary, 'hopelessness');
  });

  test('intensifiers raise intensity', () => {
    const mild = scoreAffect('I am a bit sad');
    const strong = scoreAffect('I am utterly devastated');
    assert.ok(strong.intensity > mild.intensity, `${strong.intensity} should exceed ${mild.intensity}`);
  });

  test('valence and arousal separate activated from deactivated distress', () => {
    const panic = scoreAffect('I am panicking, I cannot breathe');
    const flat = scoreAffect('I feel numb and empty');
    assert.ok(panic.arousal > flat.arousal, 'panic should be higher arousal than numbness');
    assert.ok(panic.valence < 0 && flat.valence < 0);
  });

  test('negation is scoped, not global', () => {
    // "not happy" should not be read as happiness.
    const a = scoreAffect('I am not happy');
    assert.ok(!a.families.some((f) => f.family === 'joy' && f.score > 0.5));
    // A negation must not leak across a clause boundary.
    const b = scoreAffect('I am not happy, but I am grateful for my friends');
    assert.ok(b.families.some((f) => f.family === 'gratitude'), 'gratitude survives the earlier negation');
  });

  test('negation escapes are respected', () => {
    const a = scoreAffect('not going to lie, I am exhausted');
    assert.equal(a.primary, 'exhaustion');
  });

  test('multi-word terms beat their constituents', () => {
    const a = scoreAffect('no one cares about me');
    assert.equal(a.primary, 'loneliness');
  });
});

describe('change talk', () => {
  test('separates preparatory from mobilising', () => {
    const prep = scoreChangeTalk('I want things to be different');
    const mob = scoreChangeTalk('I booked the appointment this morning');
    assert.ok(prep.preparatory > 0 && prep.mobilising === 0);
    assert.ok(mob.mobilising > 0);
  });

  test('detects ambivalence', () => {
    const a = scoreChangeTalk('I want to leave but I can not afford to');
    assert.equal(a.ambivalent, true);
  });

  test('does not read negated ability as change talk', () => {
    const a = scoreChangeTalk('I can not do this');
    assert.ok(!a.types.ability, 'negated "can" is sustain talk, not ability');
    assert.ok(a.sustain.length > 0);
  });
});

describe('pragmatics', () => {
  test('recognises bare assents including multi-token ones', () => {
    assert.equal(parse('yes').pragmatics.bareAssent, true);
    assert.equal(parse('yes ok lets try').pragmatics.bareAssent, true);
    assert.equal(parse('sure, go on').pragmatics.bareAssent, true);
    assert.equal(parse('yes I called the doctor this morning').pragmatics.bareAssent, false);
  });

  test('recognises "I do not know"', () => {
    assert.equal(parse('I do not know').pragmatics.dontKnow, true);
    assert.equal(parse('idk').pragmatics.dontKnow, true);
  });

  test('recognises minimising and pushback', () => {
    assert.equal(parse('sorry for rambling, it is not a big deal').pragmatics.minimising, true);
    assert.equal(parse('you are not listening to me').pragmatics.pushback, true);
  });

  test('recognises questions about what the agent is', () => {
    assert.equal(parse('are you a real therapist?').pragmatics.checkingTheAgent, true);
  });
});

describe('topics and temporal orientation', () => {
  test('identifies life domains', () => {
    assert.ok(parse('my manager keeps piling work on').topics.includes('work'));
    assert.ok(parse('I have not slept in three days').topics.includes('sleep'));
  });

  test('tiredness is affect, not a sleep topic', () => {
    assert.ok(!parse('I am exhausted from work').topics.includes('sleep'));
  });

  test('distinguishes rumination from worry by tense', () => {
    assert.equal(parse('I keep replaying what I said yesterday').temporal.orientation, 'past');
    assert.equal(parse('what if it all goes wrong tomorrow').temporal.orientation, 'future');
  });
});

describe('salient clause selection', () => {
  test('picks the emotionally loaded clause, not just the first', () => {
    const s = salientClause('I had a meeting at two. I felt completely humiliated in front of everyone.');
    assert.match(s, /humiliated/);
  });
});

describe('cognitive distortions', () => {
  const cases = [
    ['I always mess everything up', 'all_or_nothing'],
    ['they all think I am an idiot', 'mind_reading'],
    ['it is going to be a total disaster', 'catastrophising'],
    ['I am such a failure', 'labelling'],
    ['it is all my fault', 'personalisation'],
    ['yeah but anyone could have done that', 'discounting_positive'],
    ['everyone else has it figured out', 'comparison'],
  ];
  for (const [text, id] of cases) {
    test(`"${text}" raises ${id}`, () => {
      assert.ok(detectDistortions(text).some((d) => d.id === id));
    });
  }

  test('epistemic "must" is not a should-statement', () => {
    assert.ok(!detectDistortions('I must be tired').some((d) => d.id === 'should_statements'));
  });

  test('confidence is capped below certainty', () => {
    for (const d of detectDistortions('I always fail at everything, every single time')) {
      assert.ok(d.confidence < 1, 'surface forms are weak evidence and must be held loosely');
    }
  });

  test('reported speech attenuates the hypothesis', () => {
    const direct = detectDistortions('I am a total failure')[0];
    const quoted = detectDistortions('I know logically that I am not a total failure')[0];
    assert.ok(quoted.confidence < direct.confidence);
  });
});

describe('prosody fusion', () => {
  test('acoustic arousal shifts the estimate without overriding the words', () => {
    const plain = parse('I am fine');
    const hot = parse('I am fine', { prosody: { arousal: 0.95, confidence: 0.8 } });
    assert.ok(hot.affect.arousal > plain.affect.arousal);
    assert.equal(hot.affect.affectMismatch, true, 'a calm sentence in an activated voice is a mismatch');
  });
});
