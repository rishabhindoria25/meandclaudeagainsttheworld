/** Touch: hit regions, gesture recognition, reactions, purr curve. */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  hitTest, HIT_REGIONS, GestureRecogniser, GESTURE, AgitationMeter, STROKEABLE, STROKE_UNIT,
} from '../src/character/touch.js';
import {
  resolveReaction, pickLine, strokeMilestone, REACTIONS, STROKE_MILESTONES,
} from '../src/character/reactions.js';
import { purrParams, PURR_HZ, REACTION_SOUNDS } from '../src/voice/catsounds.js';
import { GESTURES } from '../src/character/expressions.js';

describe('hit regions', () => {
  const points = [
    [210, 231, 'nose'], [163, 176, 'eye_l'], [257, 176, 'eye_r'],
    [141, 74, 'ear_l'], [279, 74, 'ear_r'], [210, 120, 'head'],
    [210, 370, 'belly'], [362, 360, 'tail'], [176, 422, 'paw_l'], [244, 422, 'paw_r'],
  ];
  for (const [x, y, expected] of points) {
    test(`(${x},${y}) is ${expected}`, () => assert.equal(hitTest(x, y), expected));
  }

  test('points outside the character hit nothing', () => {
    assert.equal(hitTest(5, 5), null);
    assert.equal(hitTest(415, 12), null);
  });

  test('small features take priority over the areas containing them', () => {
    const order = HIT_REGIONS.map((r) => r.id);
    assert.ok(order.indexOf('nose') < order.indexOf('muzzle'));
    assert.ok(order.indexOf('ear_l') < order.indexOf('head'));
    assert.ok(order.indexOf('belly') < order.indexOf('body'));
  });

  test('every strokeable region actually exists', () => {
    for (const id of STROKEABLE) {
      assert.ok(HIT_REGIONS.some((r) => r.id === id), `${id} is strokeable but has no region`);
    }
  });
});

describe('gesture recognition', () => {
  function recogniser() {
    const events = [];
    const g = new GestureRecogniser({
      onGesture: (i) => events.push(i),
      onStroke: (i) => events.push({ type: 'stroke-unit', ...i }),
    });
    return { g, events };
  }

  test('a fast tap is a poke, a slower one is a tap', () => {
    const { g, events } = recogniser();
    g.begin({ x: 210, y: 231, t: 0 }); g.end({ t: 80 });
    g.begin({ x: 210, y: 231, t: 500 }); g.end({ t: 700 });
    assert.equal(events[0].type, GESTURE.POKE);
    assert.equal(events[1].type, GESTURE.TAP);
  });

  test('back-and-forth movement across a strokeable region is a stroke', () => {
    const { g, events } = recogniser();
    g.begin({ x: 150, y: 130, t: 0 });
    let t = 0;
    for (let i = 1; i <= 6; i += 1) { t += 40; g.move({ x: 150 + i * 40, y: 130, t }); }
    for (let i = 6; i >= 1; i -= 1) { t += 40; g.move({ x: 150 + i * 40, y: 130, t }); }
    g.end({ t });
    assert.equal(events[events.length - 1].type, GESTURE.STROKE);
    assert.ok(events.filter((e) => e.type === 'stroke-unit').length >= 3);
  });

  test('one-way movement off a strokeable region is a drag', () => {
    const { g, events } = recogniser();
    g.begin({ x: 362, y: 360, t: 0 });
    g.move({ x: 395, y: 395, t: 60 });
    g.move({ x: 418, y: 430, t: 120 });
    g.end({ t: 160 });
    const last = events[events.length - 1];
    assert.equal(last.type, GESTURE.DRAG);
    assert.equal(last.region, 'tail');
  });

  test('stroke credit accumulates and then decays', () => {
    const { g } = recogniser();
    g.begin({ x: 150, y: 130, t: 0 });
    let t = 0;
    for (let i = 1; i <= 10; i += 1) { t += 30; g.move({ x: 150 + i * STROKE_UNIT * 0.5, y: 130, t }); }
    g.end({ t });
    assert.ok(g.strokeCredit >= 3, `expected credit to build, got ${g.strokeCredit}`);
    const peak = g.strokeCredit;
    for (let i = 0; i < 10; i += 1) g.decay(1);
    assert.equal(g.strokeCredit, 0, `credit should fall to zero from ${peak}`);
  });

  test('the region follows the hand across a stroke', () => {
    const { g, events } = recogniser();
    g.begin({ x: 150, y: 200, t: 0 });   // starts on a cheek
    let t = 0;
    for (let i = 1; i <= 8; i += 1) { t += 30; g.move({ x: 150 + i * 20, y: 150, t }); }
    g.end({ t });
    assert.ok(events.some((e) => e.type === 'stroke-unit'));
  });

  test('a cancelled gesture emits nothing', () => {
    const { g, events } = recogniser();
    g.begin({ x: 210, y: 231, t: 0 });
    g.cancel();
    assert.equal(events.length, 0);
    assert.equal(g.end({ t: 100 }), null);
  });

  test('pointer movement is reported even with nothing pressed, for gaze', () => {
    const moves = [];
    const g = new GestureRecogniser({ onMove: (i) => moves.push(i) });
    g.move({ x: 100, y: 100, t: 0 });
    assert.equal(moves.length, 1);
    assert.equal(moves[0].pressed, false);
  });
});

describe('reactions', () => {
  test('every region does something distinct', () => {
    const ids = new Set();
    for (const [x, y] of [[210, 231], [141, 74], [210, 370], [362, 360], [176, 422]]) {
      const region = hitTest(x, y);
      const r = resolveReaction({ type: GESTURE.TAP, region });
      assert.ok(r, `no reaction for ${region}`);
      ids.add(r.id);
    }
    assert.ok(ids.size >= 4, 'generic reactions everywhere would make him feel like a button');
  });

  test('every reaction names a gesture that exists', () => {
    for (const [key, reaction] of Object.entries(REACTIONS)) {
      assert.ok(GESTURES[reaction.gesture], `${key} uses unknown gesture "${reaction.gesture}"`);
    }
  });

  test('every reaction sound exists', () => {
    for (const [key, reaction] of Object.entries(REACTIONS)) {
      if (!reaction.sound || reaction.sound === 'sneeze') continue;
      assert.ok(REACTION_SOUNDS[reaction.sound], `${key} uses unknown sound "${reaction.sound}"`);
    }
  });

  test('cooldowns suppress repeats', () => {
    const lastFired = { boop: 1000 };
    assert.equal(resolveReaction({ type: 'tap', region: 'nose' }, { now: 1100, lastFired }), null);
    assert.ok(resolveReaction({ type: 'tap', region: 'nose' }, { now: 4000, lastFired }));
  });

  test('stroking has no cooldown, because stroking is continuous', () => {
    const r = resolveReaction({ type: GESTURE.STROKE, region: 'head' });
    assert.equal(r.cooldownMs, 0);
  });

  test('unknown regions fall back rather than doing nothing', () => {
    assert.ok(resolveReaction({ type: GESTURE.TAP, region: null }));
    assert.ok(resolveReaction({ type: GESTURE.POKE, region: 'somewhere_else' }));
  });
});

describe('reactions during risk', () => {
  test('comedy stops once there is any risk signal', () => {
    for (const [type, region] of [['tap', 'nose'], ['poke', 'belly'], ['drag', 'tail'], ['tap', 'eye_l']]) {
      assert.equal(resolveReaction({ type, region }, { riskTier: 2 }), null,
        `${type} on ${region} should not play for laughs during a disclosure`);
    }
  });

  test('soothing contact stays available the whole way through', () => {
    for (const tier of [2, 3, 4, 5]) {
      assert.ok(resolveReaction({ type: GESTURE.STROKE, region: 'head' }, { riskTier: tier }),
        `stroking must still work at tier ${tier}`);
      assert.ok(resolveReaction({ type: GESTURE.HOLD, region: 'body' }, { riskTier: tier }),
        `a resting hand must still work at tier ${tier}`);
    }
  });

  test('no reaction can hurt him or make him sulk', () => {
    const text = JSON.stringify(REACTIONS).toLowerCase();
    for (const word of ['hurt', 'injur', 'knocked out', 'unconscious', 'bleeding', 'crying', 'do not do that', 'stop it']) {
      assert.ok(!text.includes(word),
        `"${word}" appears in the reaction table; a companion that can be damaged puts the burden of care on the wrong person`);
    }
  });
});

describe('stroke milestones', () => {
  test('fire in order and only once each', () => {
    const seen = new Set();
    const first = strokeMilestone(3, seen);
    assert.equal(first.id, 'purring');
    seen.add(first.id);
    assert.equal(strokeMilestone(3, seen), null);
    seen.add(strokeMilestone(6, seen).id);
    assert.equal(strokeMilestone(10, seen).id, 'still_here');
  });

  test('sustained stroking becomes a paced breathing offer', () => {
    const breathing = STROKE_MILESTONES.find((m) => m.id === 'breathe_with');
    assert.match(breathing.text, /breathing out/i);
    assert.match(breathing.text, /if you want/i, 'it must be an offer, not an instruction');
  });

  test('nothing fires before a few strokes have landed', () => {
    assert.equal(strokeMilestone(1, new Set()), null);
  });
});

describe('agitation', () => {
  test('rough handling accumulates', () => {
    const m = new AgitationMeter();
    let level = 0;
    for (let i = 0; i < 16; i += 1) level = m.record({ type: GESTURE.POKE }, 1000 + i * 300);
    assert.ok(level > 0.8);
    assert.equal(m.shouldNotice(1000 + 16 * 300), true);
  });

  test('it is only ever noticed once', () => {
    const m = new AgitationMeter();
    for (let i = 0; i < 16; i += 1) m.record({ type: GESTURE.POKE }, 1000 + i * 300);
    assert.equal(m.shouldNotice(5800), true);
    assert.equal(m.shouldNotice(5900), false, 'repeating it would be nagging');
  });

  test('stroking discharges it', () => {
    const m = new AgitationMeter();
    for (let i = 0; i < 8; i += 1) m.record({ type: GESTURE.POKE }, 1000 + i * 200);
    const before = m.level(3000);
    m.record({ type: GESTURE.STROKE }, 3000);
    assert.ok(m.level(3000) < before);
  });

  test('gentle play never triggers it', () => {
    const m = new AgitationMeter();
    for (let i = 0; i < 10; i += 1) m.record({ type: GESTURE.TAP }, 1000 + i * 1800);
    assert.equal(m.shouldNotice(20000), false);
  });
});

describe('purr', () => {
  test('starts quickly and deepens slowly', () => {
    assert.equal(purrParams(0).active, false);
    assert.equal(purrParams(1).active, true);
    // Half the final loudness should arrive well before half the strokes.
    assert.ok(purrParams(3).gain > purrParams(12).gain * 0.45);
  });

  test('gain rises monotonically', () => {
    let previous = -1;
    for (let c = 0; c <= 12; c += 0.5) {
      const g = purrParams(c).gain;
      assert.ok(g >= previous, `gain fell at credit ${c}`);
      previous = g;
    }
  });

  test('settles toward a real cat purr frequency', () => {
    assert.equal(purrParams(12).rate, PURR_HZ);
    assert.ok(PURR_HZ >= 20 && PURR_HZ <= 30, 'domestic cats purr at roughly 20-30 Hz');
  });

  test('never gets loud enough to startle', () => {
    assert.ok(purrParams(12).gain < 0.4);
  });
});
