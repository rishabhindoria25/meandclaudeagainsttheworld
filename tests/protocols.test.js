/** Protocol library, safety planning, and local memory. */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { PROTOCOLS, rankProtocols, getProtocol, usableAt } from '../src/clinical/protocols.js';
import {
  createSafetyPlan, addEntries, parseItems, nextStep, completeness, renderPlan,
  shouldOfferReasons, SAFETY_PLAN_STEPS,
} from '../src/clinical/safety-plan.js';
import {
  load, recordSession, bridge, recordProtocolOutcome, recordMeasure, exportAll,
} from '../src/clinical/memory.js';

describe('protocol library', () => {
  test('every protocol is well formed', () => {
    for (const p of PROTOCOLS) {
      assert.ok(p.id && p.name && p.modality, `${p.id} is missing identity`);
      assert.ok(p.evidence && p.evidence.length > 40, `${p.id} has no evidence statement`);
      assert.ok(p.rationale && p.offer, `${p.id} cannot be offered`);
      assert.ok(Array.isArray(p.steps) && p.steps.length >= 3, `${p.id} has too few steps`);
      assert.ok(p.arousalBand[0] < p.arousalBand[1], `${p.id} has an invalid arousal band`);
      assert.ok(p.indications.length > 0, `${p.id} is indicated for nothing`);
      for (const step of p.steps) {
        assert.ok(step.id && step.say, `${p.id}/${step.id} is incomplete`);
        assert.ok(['free', 'rating', 'yesno', 'list', 'none'].includes(step.expects),
          `${p.id}/${step.id} expects "${step.expects}"`);
      }
    }
  });

  test('step ids are unique within a protocol', () => {
    for (const p of PROTOCOLS) {
      const ids = p.steps.map((s) => s.id);
      assert.equal(new Set(ids).size, ids.length, `${p.id} has duplicate step ids`);
    }
  });

  test('every ifNo target exists', () => {
    for (const p of PROTOCOLS) {
      for (const step of p.steps) {
        if (!step.ifNo) continue;
        assert.ok(p.steps.some((s) => s.id === step.ifNo), `${p.id}/${step.id} jumps to a missing step`);
      }
    }
  });

  test('protocols are offered as questions, not instructions', () => {
    for (const p of PROTOCOLS) {
      assert.match(p.offer, /\?/, `${p.id} does not ask permission`);
    }
  });
});

describe('the arousal gate', () => {
  test('cognitive work is unavailable during panic', () => {
    const atPanic = usableAt(0.92).map((p) => p.id);
    assert.ok(!atPanic.includes('thought_record'),
      'asking someone mid-panic to evaluate evidence is ineffective and quietly invalidating');
    assert.ok(!atPanic.includes('downward_arrow'));
  });

  test('downregulation is available during panic', () => {
    const atPanic = usableAt(0.92).map((p) => p.id);
    assert.ok(atPanic.includes('paced_breathing') || atPanic.includes('grounding_54321'));
  });

  test('regulation ranks above cognition when arousal is high', () => {
    const top = rankProtocols({ arousal: 0.9, indications: ['panic', 'high_arousal'] })[0];
    assert.ok(['paced_breathing', 'grounding_54321', 'tipp'].includes(top.protocol.id));
  });

  test('behavioural activation ranks first for low-arousal depression', () => {
    const top = rankProtocols({ arousal: 0.2, indications: ['depression', 'withdrawal', 'anhedonia'] })[0];
    assert.equal(top.protocol.id, 'behavioural_activation');
  });

  test('self-compassion ranks first for shame', () => {
    const top = rankProtocols({ arousal: 0.5, indications: ['shame', 'self_criticism'] })[0];
    assert.equal(top.protocol.id, 'self_compassion_break');
  });

  test('something already used is deprioritised', () => {
    const fresh = rankProtocols({ arousal: 0.5, indications: ['shame'] })[0].protocol.id;
    const after = rankProtocols({ arousal: 0.5, indications: ['shame'], recentlyUsed: [fresh] })[0].protocol.id;
    assert.notEqual(after, fresh);
  });

  test('protocols with medical caveats declare them', () => {
    assert.ok(getProtocol('tipp').contraindications.some((c) => /cardiac|heart/i.test(c)),
      'the cold-water step needs a cardiac caveat');
    assert.ok(getProtocol('sleep_reset').contraindications.length > 0);
  });
});

describe('safety planning', () => {
  test('follows the six Stanley-Brown steps in order', () => {
    const ids = SAFETY_PLAN_STEPS.map((s) => s.id);
    assert.deepEqual(ids, [
      'warning_signs', 'internal_coping', 'distracting_people_places',
      'support_contacts', 'professionals', 'means_safety',
    ]);
  });

  test('means safety is the final step and is never optional', () => {
    const last = SAFETY_PLAN_STEPS[SAFETY_PLAN_STEPS.length - 1];
    assert.equal(last.id, 'means_safety');
    assert.ok(last.minItems >= 1, 'the step with the strongest evidence must not be skippable');
  });

  test('free text is split into discrete items', () => {
    assert.deepEqual(
      parseItems('not answering my phone, lying awake and drinking more than usual'),
      ['not answering my phone', 'lying awake', 'drinking more than usual'],
    );
  });

  test('stranded conjunctions are stripped', () => {
    assert.deepEqual(parseItems('my kitchen, or the 24 hour cafe'), ['my kitchen', 'the 24 hour cafe']);
  });

  test('non-answers are discarded', () => {
    assert.deepEqual(parseItems('um, idk, nothing'), []);
  });

  test('steps advance only when their minimum is met', () => {
    const plan = createSafetyPlan();
    assert.equal(nextStep(plan).id, 'warning_signs');
    addEntries(plan, 'warning_signs', ['one thing']);
    assert.equal(nextStep(plan).id, 'warning_signs', 'one item does not satisfy a two-item step');
    addEntries(plan, 'warning_signs', ['another thing']);
    assert.equal(nextStep(plan).id, 'internal_coping');
  });

  test('reasons to live are offered once the required steps are done', () => {
    const plan = createSafetyPlan();
    for (const step of SAFETY_PLAN_STEPS) {
      addEntries(plan, step.id, Array.from({ length: step.minItems }, (_, i) => `item ${i}`));
    }
    assert.equal(nextStep(plan), null);
    assert.equal(shouldOfferReasons(plan), true);
    plan.offeredReasons = true;
    assert.equal(shouldOfferReasons(plan), false);
  });

  test('the rendered plan carries the clinician caveat and no internal keys', () => {
    const plan = createSafetyPlan();
    addEntries(plan, 'warning_signs', ['not answering my phone']);
    const text = renderPlan(plan, 'Samaritans: 116 123');
    assert.match(text, /not answering my phone/);
    assert.match(text, /Samaritans/);
    assert.match(text, /doctor or therapist/i);
    assert.ok(!/__/.test(text), 'internal bookkeeping must not appear in an exported document');
  });

  test('completeness is reported honestly', () => {
    const plan = createSafetyPlan();
    assert.equal(completeness(plan).ratio, 0);
    for (const step of SAFETY_PLAN_STEPS) {
      addEntries(plan, step.id, Array.from({ length: step.minItems }, (_, i) => `item ${i}`));
    }
    assert.equal(completeness(plan).ratio, 1);
  });
});

describe('local memory', () => {
  test('loads an empty store when nothing is saved', () => {
    const state = load();
    assert.ok(Array.isArray(state.sessions));
    assert.ok(state.semantic);
  });

  test('a session summary supports the next session’s bridge', () => {
    const state = load();
    recordSession(state, {
      startedAt: new Date().toISOString(),
      notes: {
        focus: 'work', topics: [['work', 4]], protocolsUsed: ['thought_record'],
        homework: ['say no to one thing this week'], fidelity: { turns: 18 },
        riskHistory: [], ruptures: [],
      },
      transcript: [],
    });
    const b = bridge(state);
    assert.equal(b.lastFocus, 'work');
    assert.match(b.line, /work/);
    assert.match(b.line, /say no to one thing/);
  });

  test('no bridge is invented when there is no history', () => {
    assert.equal(bridge({ sessions: [] }).line, null);
  });

  test('protocol outcomes build a preference profile', () => {
    const state = load();
    recordProtocolOutcome(state, 'thought_record', { before: 9, after: 5 });
    recordProtocolOutcome(state, 'defusion', { before: 7, after: 7 });
    assert.ok(state.semantic.helped.includes('thought_record'));
    assert.ok(state.semantic.didNotHelp.includes('defusion'));
  });

  test('a protocol that later helps moves out of the unhelpful list', () => {
    const state = load();
    recordProtocolOutcome(state, 'defusion', { before: 7, after: 7 });
    recordProtocolOutcome(state, 'defusion', { before: 8, after: 4 });
    assert.ok(state.semantic.helped.includes('defusion'));
    assert.ok(!state.semantic.didNotHelp.includes('defusion'));
  });

  test('measures accumulate a history', () => {
    const state = load();
    recordMeasure(state, 'phq9', 14);
    recordMeasure(state, 'phq9', 9);
    assert.equal(state.semantic.measures.phq9.length, 2);
  });

  test('export contains everything and says what it is not', () => {
    const state = load();
    const payload = exportAll(state, [{ role: 'user', text: 'hello' }]);
    assert.ok(payload.exportedAt && payload.sessions && payload.semantic && payload.transcript);
    assert.match(payload.note, /not a clinical record/i);
  });
});
