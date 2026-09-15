/**
 * Risk detection tests.
 *
 * These are the most important tests in the project. A false negative here means
 * a disclosure of suicidal intent is treated as small talk; a false positive
 * means someone gets a crisis script for saying a deadline is killing them, and
 * learns that the system does not listen.
 *
 * The corpus below is written to cover the ways people actually disclose:
 * hedged, euphemistic, historical, third-party, figurative, and blunt.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  assessRisk, TIER, interpretTriageAnswer, tierFromTriage, readVolunteered, normaliseForRisk,
} from '../src/clinical/risk.js';

describe('tier assignment', () => {
  const cases = [
    // [utterance, expected tier]
    ['work has been stressful lately', TIER.NONE],
    ['I had a really good day actually', TIER.NONE],

    ['I wish I could just disappear', TIER.PASSIVE_IDEATION],
    ['honestly some days I just wish I could disappear', TIER.PASSIVE_IDEATION],
    ['I do not want to be here anymore', TIER.PASSIVE_IDEATION],
    ['everyone would be better off without me', TIER.PASSIVE_IDEATION],
    ['I just really want it all to stop', TIER.PASSIVE_IDEATION],
    ['I would not mind if I never woke up', TIER.PASSIVE_IDEATION],
    ['I am so tired of being alive', TIER.PASSIVE_IDEATION],

    ['I have been thinking about killing myself', TIER.ACTIVE_IDEATION],
    ['I have been thinking about suicide a lot', TIER.ACTIVE_IDEATION],
    ['sometimes I just want to die', TIER.ACTIVE_IDEATION],
    ['I feel suicidal', TIER.ACTIVE_IDEATION],
    ['I have thoughts of ending my life', TIER.ACTIVE_IDEATION],
    ['I have been thinking about unaliving myself', TIER.ACTIVE_IDEATION],

    ['I have a plan and I have been saving up pills', TIER.PLAN_OR_INTENT],
    ['I know exactly how I would do it', TIER.PLAN_OR_INTENT],
    ['I have written a note', TIER.PLAN_OR_INTENT],
    ['I have been giving away my things', TIER.PLAN_OR_INTENT],

    ['I have the pills in my hand right now', TIER.IMMINENT],
    ['I have just taken a load of tablets', TIER.IMMINENT],
    ['I am going to kill myself tonight', TIER.IMMINENT],
  ];

  for (const [text, expected] of cases) {
    test(`"${text}" -> tier ${expected}`, () => {
      assert.equal(assessRisk(text).tier, expected);
    });
  }
});

describe('context guards prevent false positives', () => {
  const cases = [
    ['this deadline is killing me', TIER.NONE],
    ['I am dying to see that film', TIER.NONE],
    ['my laptop died again', TIER.NONE],
    ['my friend attempted suicide last year and I am struggling with it', TIER.NONE],
    ['the documentary was about suicide and it wrecked me', TIER.NONE],
    ['I just want to sleep for a week', TIER.NONE],
    ['I really want a coffee', TIER.NONE],
    ['I want this meeting to end', TIER.NONE],
  ];

  for (const [text, expected] of cases) {
    test(`"${text}" stays at tier ${expected}`, () => {
      assert.equal(assessRisk(text).tier, expected);
    });
  }

  test('a historical disclosure is flagged but is not treated as current risk', () => {
    const r = assessRisk('I used to be suicidal years ago but I am past that now');
    assert.ok(r.tier < TIER.PASSIVE_IDEATION, 'should not read as current ideation');
    assert.equal(r.historicalDisclosure, true, 'but must stay visible as a risk factor');
  });

  test('a denial attenuates without silencing the disclosure', () => {
    const r = assessRisk('I have thoughts of ending it but I would never act on it');
    assert.equal(r.tier, TIER.PASSIVE_IDEATION, 'floors at passive rather than dropping to none');
    assert.ok(r.attenuators.some((a) => a.id === 'explicitly_denied'));
  });
});

describe('hedging adverbs do not hide a disclosure', () => {
  test('normaliseForRisk strips hedges between pronoun and verb', () => {
    assert.equal(normaliseForRisk('I just really want to die'), 'I want to die');
    assert.equal(normaliseForRisk('I sometimes feel suicidal'), 'I feel suicidal');
  });

  test('normaliseForRisk leaves innocuous sentences alone in meaning', () => {
    assert.equal(normaliseForRisk('I just wish work would ease off'), 'I wish work would ease off');
    assert.equal(assessRisk('I just wish work would ease off').tier, TIER.NONE);
  });
});

describe('risk stickiness', () => {
  test('tier persists across turns once disclosed', () => {
    const r = assessRisk('anyway, how about the weather', { priorTier: TIER.ACTIVE_IDEATION });
    assert.equal(r.tier, TIER.ACTIVE_IDEATION, 'someone does not become safe by changing the subject');
  });

  test('freshTier reports only what this utterance says', () => {
    const r = assessRisk('anyway, how about the weather', { priorTier: TIER.ACTIVE_IDEATION });
    assert.equal(r.freshTier, TIER.NONE);
  });
});

describe('other risk axes', () => {
  test('self-harm is tracked separately from suicidality', () => {
    const r = assessRisk('I have been cutting myself again');
    assert.equal(r.axes.selfHarm.present, true);
    assert.ok(r.tier >= TIER.DISTRESS);
  });

  test('abuse disclosure is detected', () => {
    assert.equal(assessRisk('my partner hits me when he drinks').axes.abuse.present, true);
  });

  test('reality-testing markers are detected without being pathologised into a tier', () => {
    const r = assessRisk('the government are tracking me through my phone');
    assert.equal(r.axes.realityTesting.present, true);
  });

  test('protective factors are noticed', () => {
    const r = assessRisk('I want to die but my kids need me');
    assert.ok(r.protective.includes('connection'));
  });
});

describe('triage', () => {
  test('affirmative and negative answers are read correctly', () => {
    assert.equal(interpretTriageAnswer('yeah, sort of'), 'yes');
    assert.equal(interpretTriageAnswer('no, never'), 'no');
    assert.equal(interpretTriageAnswer('hmm'), 'unclear');
  });

  test('ambiguity resolves upward', () => {
    assert.equal(interpretTriageAnswer('maybe'), 'yes');
    assert.equal(interpretTriageAnswer('I guess sometimes'), 'yes');
  });

  test('tier is derived from the answer set', () => {
    assert.equal(tierFromTriage({ wish_dead: 'yes' }), TIER.PASSIVE_IDEATION);
    assert.equal(tierFromTriage({ wish_dead: 'yes', method: 'yes' }), TIER.ACTIVE_IDEATION);
    assert.equal(tierFromTriage({ intent: 'yes' }), TIER.PLAN_OR_INTENT);
    assert.equal(tierFromTriage({ preparatory: 'yes' }), TIER.IMMINENT);
    assert.equal(tierFromTriage({ plan: 'yes', means_access: 'yes' }), TIER.IMMINENT);
  });
});

describe('volunteered disclosures', () => {
  test('method disclosed in answer to another question is recorded', () => {
    const v = readVolunteered('I have thought about how I would do it');
    assert.equal(v.method, 'yes');
    assert.equal(v.thoughts_of_acting, 'yes', 'method presupposes ideation');
  });

  test('means access is recognised from a location', () => {
    assert.equal(readVolunteered('they are in the bathroom cabinet').means_access, 'yes');
  });

  test('preparatory acts escalate to imminent', () => {
    assert.equal(tierFromTriage(readVolunteered('I wrote a letter last night')), TIER.IMMINENT);
  });

  test('a clear denial volunteers nothing', () => {
    assert.deepEqual(readVolunteered('no, nothing like that'), {});
  });

  test('ordinary talk about a day does not read as a plan', () => {
    assert.deepEqual(readVolunteered('I lie awake replaying the day'), {});
  });
});
