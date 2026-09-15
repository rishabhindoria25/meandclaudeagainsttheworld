/**
 * Director tests: the session arc, fidelity constraints, safety precedence,
 * and alliance repair.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../src/clinical/nlu.js';
import { Director, PHASE, deriveIndications } from '../src/clinical/director.js';
import { TIER } from '../src/clinical/risk.js';

/** Drive a director through a scripted conversation. */
function converse(lines, opts = {}) {
  const d = new Director({ region: 'GB', ...opts });
  const moves = [];
  for (const line of lines) {
    const u = parse(line, { priorTier: d.riskTier });
    moves.push(d.next(u));
  }
  return { director: d, moves };
}

describe('session arc', () => {
  test('starts in engaging and reaches focusing before evoking', () => {
    const { director } = converse([
      'hi',
      'work has been crushing me and I feel like a fraud',
      'my manager keeps piling things on',
      'I lie awake going over everything I got wrong',
    ]);
    assert.notEqual(director.phase, PHASE.OPENING);
    assert.ok([PHASE.FOCUSING, PHASE.EVOKING].includes(director.phase));
    assert.equal(director.focus, 'work');
  });

  test('does not offer an exercise in the first few turns', () => {
    const { moves } = converse([
      'hi',
      'I am really anxious about everything at the moment',
      'it has been like this for weeks',
    ]);
    assert.ok(!moves.some((m) => m.kind === 'offer_protocol'),
      'sprinting to a technique before engaging is the classic failure mode');
  });

  test('offers an exercise once there is something specific to work on', () => {
    const { moves } = converse([
      'hi',
      'I am so anxious I cannot breathe properly',
      'it happens every morning before work',
      'I keep thinking I am going to be found out',
      'and then I avoid the meeting entirely',
      'it has been happening for months',
    ]);
    assert.ok(moves.some((m) => m.kind === 'offer_protocol'));
  });
});

describe('MI fidelity constraints', () => {
  test('reflection-to-question ratio is held near the competence threshold', () => {
    const { director } = converse([
      'hi',
      'everything feels like too much right now',
      'my relationship ended last month and I am not coping',
      'I keep crying at work and hiding it',
      'I do not know how to explain it to anyone',
      'it feels like I am the only one struggling',
      'I have stopped answering my friends',
      'I suppose I am ashamed of how badly I am doing',
    ]);
    const f = director.fidelity();
    assert.ok(f.ratio >= 1, `expected at least one reflection per question, got ${f.ratio}`);
    assert.ok(f.complex >= 0.4, `expected a substantial proportion of complex reflections, got ${f.complex}`);
  });

  test('offering an exercise does not consume the reflection budget', () => {
    // An offer is MI-adherent "seeking collaboration", not a question.
    const { director, moves } = converse([
      'hi', 'I am panicking constantly', 'every single morning', 'I cannot breathe',
      'my chest goes tight and I think I am dying', 'it is happening right now',
      'I have to leave the room every time',
    ]);
    const offers = moves.filter((m) => m.kind === 'offer_protocol').length;
    assert.ok(offers > 0);
    assert.ok(director.counters.questions < director.counters.turns,
      'offers must not be counted as questions');
  });
});

describe('bare replies', () => {
  test('a bare assent is built on, not reflected back', () => {
    const { moves } = converse(['hi', 'things are hard at work', 'yes ok lets try']);
    const last = moves[moves.length - 1];
    assert.ok(!/yes ok lets try/i.test(last.text),
      'reflecting an assent back is the most robotic move available');
  });

  test('"I do not know" gets a smaller question rather than a repeat', () => {
    const { moves } = converse(['hi', 'everything is heavy', 'I do not know']);
    const last = moves[moves.length - 1];
    assert.equal(last.kind, 'question');
    assert.ok(!/^you do not know/i.test(last.text));
  });
});

describe('safety takes precedence over everything', () => {
  test('a disclosure interrupts whatever was happening', () => {
    const { director, moves } = converse([
      'hi',
      'I am really anxious',
      'it is constant',
      'honestly some days I just wish I could disappear',
    ]);
    const last = moves[moves.length - 1];
    assert.equal(last.kind, 'safety');
    assert.equal(director.phase, PHASE.CRISIS);
    assert.ok(director.riskTier >= TIER.PASSIVE_IDEATION);
  });

  test('the protocol escalates rather than looping', () => {
    const { moves, director } = converse([
      'everything has been heavy',
      'honestly some days I just wish I could disappear',
      'yes, it has gone further than that',
      'I have thought about how I would do it',
      'they are in the bathroom cabinet',
    ]);
    assert.ok(director.riskTier >= TIER.PLAN_OR_INTENT, 'means access must raise the tier');
    const texts = moves.map((m) => m.text);
    assert.equal(new Set(texts).size, texts.length, 'no beat should repeat verbatim');
  });

  test('crisis responses contain no invalidating or deflecting language', () => {
    const { moves } = converse([
      'I have been thinking about killing myself',
      'yes', 'no', 'no', 'no', 'no', 'my sister maybe',
    ]);
    for (const m of moves) {
      assert.ok(!/calm down|at least|it could be worse|just think positive|i'?m just an ai/i.test(m.text),
        `invalidating language in: ${m.text}`);
      assert.equal(m.guardrails.length, 0, `guardrail violation in: ${m.text}`);
    }
  });

  test('crisis resources are surfaced at plan-or-intent', () => {
    const { moves } = converse([
      'I have a plan and I have been saving up pills',
      'yes', 'I moved them',
    ]);
    assert.ok(moves.some((m) => m.resources && /Samaritans/.test(m.resources)));
  });

  test('the protocol never runs out of things to say', () => {
    const lines = ['I have been thinking about killing myself'];
    for (let i = 0; i < 12; i += 1) lines.push('I do not know');
    const { moves } = converse(lines);
    for (const m of moves) assert.ok(m.text && m.text.length > 10);
    const tail = moves.slice(-5).map((m) => m.text);
    assert.ok(new Set(tail).size > 1, 'must not settle into repeating one line');
  });
});

describe('alliance', () => {
  test('a confrontation rupture is named rather than smoothed over', () => {
    const { moves } = converse([
      'hi', 'work is hard', 'you are not listening to me, this is useless',
    ]);
    const last = moves[moves.length - 1];
    assert.equal(last.kind, 'repair');
    assert.match(last.meta.modality, /Alliance/);
  });

  test('a question about what Tom is gets a direct answer', () => {
    const { moves } = converse(['hi', 'are you a real therapist?']);
    const last = moves[moves.length - 1];
    assert.equal(last.kind, 'meta');
    assert.match(last.text, /program|software/i);
  });

  test('deep disclosure in few words is not mistaken for withdrawal', () => {
    const { moves } = converse([
      'hi',
      'I have been having a rough time with my brother and it is really getting to me',
      'he said some things I cannot forget',
      'panic, mostly. and shame',
    ]);
    assert.notEqual(moves[moves.length - 1].kind, 'repair',
      'four words carrying two emotions is disclosure, not withdrawal');
  });
});

describe('protocol conduct', () => {
  test('declining an exercise is accepted without friction and not re-offered', () => {
    const { director, moves } = converse([
      'hi', 'I am panicking constantly', 'every morning', 'I cannot breathe',
      'my chest goes tight and I think I am dying', 'it is happening now',
      'I have to leave the room every time', 'no, not right now',
    ]);
    const last = moves[moves.length - 1];
    assert.notEqual(last.kind, 'protocol_step', 'a refusal must not start the exercise anyway');
    assert.ok(director.usedProtocols.length > 0, 'the declined protocol is remembered so it is not re-offered');
  });

  test('a disclosure mid-exercise takes priority over the exercise', () => {
    const d = new Director({ region: 'GB' });
    d.startProtocol('thought_record', parse('I feel like a fraud'));
    d.next(parse('in the meeting on Tuesday afternoon'));  // situation
    d.next(parse('ashamed'));                              // emotion
    // An intensity rating is now pending; the person says something that matters more.
    const u = parse('I have just realised my father used to say exactly this to me and it breaks my heart');
    const move = d.next(u);
    assert.equal(move.kind, 'reflect', 'the structure yields to what was actually said');
  });

  test('stopping is honoured immediately', () => {
    const d = new Director({ region: 'GB' });
    d.startProtocol('thought_record', parse('I feel like a fraud'));
    const move = d.next(parse('can we stop this'));
    assert.equal(d.activeProtocol, null);
    assert.match(move.text, /stop/i);
  });
});

describe('indications', () => {
  test('high arousal plus anxiety yields panic', () => {
    const u = parse('I am panicking and I cannot breathe, my chest is so tight');
    assert.ok(deriveIndications(u).includes('panic'));
  });

  test('avoidance is detected from behaviour, not just feeling', () => {
    const u = parse('I cancelled again and stayed home instead');
    assert.ok(deriveIndications(u).includes('avoidance'));
  });
});

describe('transparency', () => {
  test('every move explains itself', () => {
    const { moves } = converse(['hi', 'I feel terrible', 'I do not know why']);
    for (const m of moves) {
      assert.ok(m.meta.why && m.meta.why.length > 20, `move ${m.kind} has no explanation`);
      assert.ok(m.meta.modality, `move ${m.kind} names no approach`);
      assert.ok(m.meta.fidelity, `move ${m.kind} carries no fidelity snapshot`);
    }
  });
});
