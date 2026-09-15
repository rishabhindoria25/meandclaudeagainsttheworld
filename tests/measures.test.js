/** Measurement-based care tests. */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  PHQ9, GAD7, WHO5, SESSION_FEEDBACK, score, changeSince, trend, describe as describeScore, suggestInstrument,
} from '../src/clinical/measures.js';

describe('scoring', () => {
  test('PHQ-9 totals and bands correctly', () => {
    const s = score(PHQ9, [2, 3, 3, 3, 1, 3, 2, 1, 1]);
    assert.equal(s.raw, 19);
    assert.equal(s.band, 'moderately severe');
    assert.equal(s.aboveCutoff, true);
  });

  test('PHQ-9 surfaces the risk item separately from the total', () => {
    const s = score(PHQ9, [0, 0, 0, 0, 0, 0, 0, 0, 2]);
    assert.equal(s.raw, 2);
    assert.equal(s.band, 'minimal', 'the total is low');
    assert.equal(s.riskItem, 2, 'but item 9 must not be buried in it');
  });

  test('GAD-7 bands correctly', () => {
    assert.equal(score(GAD7, [3, 3, 2, 2, 1, 2, 3]).band, 'severe');
    assert.equal(score(GAD7, [0, 1, 0, 1, 0, 0, 0]).band, 'minimal');
  });

  test('WHO-5 is reported on the percentage scale and inverted', () => {
    const s = score(WHO5, [1, 1, 2, 0, 1]);
    assert.equal(s.raw, 5);
    assert.equal(s.scaled, 20, 'raw x 4');
    assert.equal(s.aboveCutoff, true, 'low well-being is the clinically notable direction');
  });

  test('incomplete responses are reported as incomplete', () => {
    assert.equal(score(GAD7, [1, 2]).complete, false);
  });

  test('session feedback flags a possible rupture below threshold', () => {
    assert.equal(score(SESSION_FEEDBACK, [8, 6, 5, 7]).aboveCutoff, true);
    assert.equal(score(SESSION_FEEDBACK, [10, 9, 9, 10]).aboveCutoff, false);
  });
});

describe('reliable change', () => {
  test('changes under the threshold are reported as noise', () => {
    const c = changeSince(PHQ9, 14, 12);
    assert.equal(c.reliable, false);
    assert.equal(c.direction, 'stable');
  });

  test('a five-point PHQ-9 drop is a real improvement', () => {
    const c = changeSince(PHQ9, 19, 13);
    assert.equal(c.reliable, true);
    assert.equal(c.direction, 'improved');
  });

  test('direction respects instruments where higher is better', () => {
    assert.equal(changeSince(WHO5, 30, 50).direction, 'improved');
    assert.equal(changeSince(WHO5, 50, 30).direction, 'deteriorated');
  });
});

describe('trend', () => {
  test('sustained deterioration raises an alert', () => {
    const t = trend(PHQ9, [{ scaled: 12 }, { scaled: 14 }, { scaled: 20 }]);
    assert.equal(t.alert, true);
  });

  test('improvement does not alert', () => {
    assert.equal(trend(PHQ9, [{ scaled: 20 }, { scaled: 14 }, { scaled: 9 }]).alert, false);
  });

  test('a single data point is insufficient', () => {
    assert.equal(trend(PHQ9, [{ scaled: 12 }]).direction, 'insufficient');
  });
});

describe('framing', () => {
  test('every reading states it is not a diagnosis', () => {
    const text = describeScore(PHQ9, score(PHQ9, [3, 3, 3, 3, 3, 3, 3, 3, 0]));
    assert.match(text, /not a diagnosis/i);
  });
});

describe('suggestion', () => {
  test('suggests the instrument matching the presentation', () => {
    assert.equal(suggestInstrument({ affect: { families: [{ family: 'anxiety' }] } }, {}).id, 'gad7');
    assert.equal(suggestInstrument({ affect: { families: [{ family: 'hopelessness' }] } }, {}).id, 'phq9');
  });

  test('does not re-offer inside the recall window', () => {
    const recent = { phq9: { at: new Date().toISOString() } };
    const s = suggestInstrument({ affect: { families: [{ family: 'sadness' }] } }, recent);
    assert.notEqual(s?.id, 'phq9', 'the questionnaire asks about the last two weeks');
  });
});
