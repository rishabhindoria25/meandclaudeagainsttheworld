/** Character tests: lip sync timing, expression blending, rig geometry. */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { textToVisemes, sampleViseme, reanchor, VISEMES, VISEME_SHAPES } from '../src/character/visemes.js';
import { poseFor, listeningPose, speakingPose, blend, NEUTRAL, EXPRESSIONS, GESTURES, clampPose } from '../src/character/expressions.js';
import { markup, mouthGeometry, lidOffsets, EYE, LID_HEIGHT, PALETTE } from '../src/character/rig.js';

describe('viseme timing', () => {
  test('produces a plausible speaking rate', () => {
    const tl = textToVisemes('Hello. I am here with you, and I am not going anywhere.');
    const wpm = tl.words.length / (tl.duration / 60000);
    assert.ok(wpm > 110 && wpm < 190, `${wpm.toFixed(0)} wpm is outside conversational range`);
  });

  test('rate scaling shortens the timeline', () => {
    const slow = textToVisemes('the same sentence exactly', { rate: 0.7 });
    const fast = textToVisemes('the same sentence exactly', { rate: 1.4 });
    assert.ok(fast.duration < slow.duration);
  });

  test('bilabials close the mouth', () => {
    const tl = textToVisemes('mama papa bob');
    const closures = tl.frames.filter((f) => f.viseme === VISEMES.MBP);
    assert.equal(closures.length, 6, 'm, m, p, p, b, b');
    for (const c of closures) assert.equal(VISEME_SHAPES[c.viseme].open, 0);
  });

  test('open vowels open the mouth', () => {
    const tl = textToVisemes('ah car');
    assert.ok(tl.frames.some((f) => f.viseme === VISEMES.AA));
  });

  test('punctuation produces rests', () => {
    const tl = textToVisemes('Stop. Wait, listen.');
    assert.ok(tl.frames.filter((f) => f.viseme === VISEMES.REST).length >= 3);
  });

  test('frames are monotonically ordered and non-overlapping', () => {
    const tl = textToVisemes('a reasonably long sentence with several clauses, commas, and a full stop.');
    for (let i = 1; i < tl.frames.length; i += 1) {
      assert.ok(tl.frames[i].at >= tl.frames[i - 1].at, 'frames must not go backwards');
    }
  });

  test('empty text is handled', () => {
    const tl = textToVisemes('');
    assert.equal(tl.words.length, 0);
    assert.ok(tl.frames.length >= 1);
  });
});

describe('viseme sampling', () => {
  test('interpolates between shapes rather than switching', () => {
    const tl = textToVisemes('ma');
    const samples = [];
    for (let t = 0; t < tl.duration; t += 8) samples.push(sampleViseme(tl, t).open);
    const distinct = new Set(samples.map((v) => v.toFixed(2)));
    assert.ok(distinct.size > 3, 'coarticulation requires blended values, not a slide show');
  });

  test('returns rest past the end', () => {
    const tl = textToVisemes('hi');
    assert.equal(sampleViseme(tl, tl.duration + 5000).viseme, VISEMES.REST);
  });

  test('every shape is within range', () => {
    const tl = textToVisemes('the quick brown fox jumps over the lazy dog');
    for (let t = 0; t < tl.duration; t += 17) {
      const s = sampleViseme(tl, t);
      for (const key of ['open', 'width', 'round', 'teeth', 'tongue']) {
        assert.ok(s[key] >= 0 && s[key] <= 1, `${key}=${s[key]} out of range at ${t}ms`);
      }
    }
  });
});

describe('re-anchoring to real speech', () => {
  test('corrects drift without jumping', () => {
    const tl = textToVisemes('one two three four five six seven');
    const target = tl.words[3];
    const before = target.at;
    reanchor(tl, 3, before + 400);
    assert.ok(Math.abs(tl.words[3].at - (before + 400)) < 1, 'the anchored word lands on the reported time');
    assert.ok(tl.frames.every((f, i) => i === 0 || f.at >= tl.frames[i - 1].at), 'ordering survives');
  });

  test('small drift is ignored', () => {
    const tl = textToVisemes('one two three four');
    const before = tl.duration;
    reanchor(tl, 2, tl.words[2].at + 5);
    assert.equal(tl.duration, before);
  });
});

describe('expressions', () => {
  test('sadness shows the inner brow raise and lowered mouth corners', () => {
    const p = poseFor('sadness', 0.9);
    assert.ok(p.browInnerRaise > 0.4, 'AU1 is what makes sadness legible');
    assert.ok(p.mouthCurve < -0.2);
    assert.ok(p.earDroop > 0.3);
  });

  test('fear widens the eyes and dilates the pupils', () => {
    const p = poseFor('anxiety', 0.8);
    assert.ok(p.eyeOpen > NEUTRAL.eyeOpen, 'AU5');
    assert.ok(p.pupilScale > 1);
  });

  test('anger lowers the brow and flattens the ears', () => {
    const p = poseFor('anger', 0.9);
    assert.ok(p.browFurrow > 0.5, 'AU4');
    assert.ok(p.earRotate < -0.3);
  });

  test('mirroring is capped below the person’s own intensity', () => {
    const full = poseFor('sadness', 1.0);
    const target = EXPRESSIONS.sadness.mouthCurve;
    assert.ok(Math.abs(full.mouthCurve - NEUTRAL.mouthCurve) < Math.abs(target),
      'a listener more upset than the speaker makes the speaker manage the listener');
  });

  test('Tom does not perform cheerfulness at distress', () => {
    const gated = speakingPose({ family: 'joy', intensity: 0.9 }, { userValence: -0.8 });
    const ungated = speakingPose({ family: 'joy', intensity: 0.9 }, { userValence: 0.6 });
    assert.ok(gated.mouthCurve < ungated.mouthCurve * 0.6);
  });

  test('every expression stays inside its limits', () => {
    for (const family of Object.keys(EXPRESSIONS)) {
      const p = clampPose(poseFor(family, 1));
      assert.ok(p.eyeOpen >= 0 && p.eyeOpen <= 1.3, `${family} eyeOpen`);
      assert.ok(p.mouthCurve >= -1 && p.mouthCurve <= 1, `${family} mouthCurve`);
      assert.ok(p.headTilt >= -20 && p.headTilt <= 20, `${family} headTilt`);
    }
  });

  test('listening slows Tom down when the person is activated', () => {
    const calm = listeningPose({ userArousal: 0.3 });
    const hot = listeningPose({ userArousal: 0.9 });
    assert.ok(hot.breathRate < calm.breathRate,
      'downregulating alongside someone is more use than matching them');
  });

  test('blending is continuous', () => {
    const a = poseFor('sadness', 0.8);
    const b = poseFor('hope', 0.8);
    const mid = blend(a, b, 0.5);
    assert.ok(mid.mouthCurve > Math.min(a.mouthCurve, b.mouthCurve));
    assert.ok(mid.mouthCurve < Math.max(a.mouthCurve, b.mouthCurve));
  });

  test('gestures are bounded functions of normalised time', () => {
    for (const [name, gesture] of Object.entries(GESTURES)) {
      const pose = { ...NEUTRAL };
      for (let k = 0; k <= 1; k += 0.1) gesture.apply(pose, k);
      for (const [key, value] of Object.entries(pose)) {
        assert.ok(Number.isFinite(value), `${name} produced a non-finite ${key}`);
      }
    }
  });
});

describe('rig geometry', () => {
  test('the drawing is shaded rather than flat', () => {
    const svg = markup();
    const gradients = (svg.match(/<(radial|linear)Gradient/g) || []).length;
    assert.ok(gradients >= 8, `only ${gradients} gradients; flat fills read as a doodle`);
    assert.ok(svg.includes('url(#g-fur-head)'), 'the head should be shaded, not flat-filled');
    assert.ok(svg.includes('url(#g-iris)'), 'the iris should be shaded');
  });

  test('every id the rig animates exists in the drawing', () => {
    const svg = markup();
    const required = [
      'tom-svg', 'tom-root', 'tom-shadow', 'tom-body-group', 'tom-body', 'tom-tail', 'tom-tail-tip',
      'tom-head', 'tom-skull', 'tom-ear-l', 'tom-ear-r', 'tom-iris-l', 'tom-iris-r',
      'tom-pupil-l', 'tom-pupil-r', 'tom-lid-upper-l', 'tom-lid-lower-l', 'tom-lid-upper-r',
      'tom-lid-lower-r', 'tom-brow-l', 'tom-brow-r', 'tom-blush-l', 'tom-blush-r',
      'tom-mouth-interior', 'tom-mouth-line', 'tom-mouth-clip-path', 'tom-teeth', 'tom-tongue',
      'tom-whiskers-l', 'tom-whiskers-r', 'tom-nose',
    ];
    for (const id of required) {
      assert.ok(svg.includes(`id="${id}"`), `restyling dropped ${id}, which the animator writes to`);
    }
  });

  test('the eye clip paths match the drawn eye', () => {
    const svg = markup();
    // A mismatch here silently crops the iris or lets the lids escape the eye.
    assert.ok(svg.includes(`rx="${EYE.rx}" ry="${EYE.ry}"`), 'clip path must use the EYE constants');
  });

  test('markup is well-formed enough to mount and is labelled', () => {
    const svg = markup();
    assert.match(svg, /<svg[^>]+role="img"/);
    assert.match(svg, /<title id="tom-title">/);
    assert.match(svg, /<desc id="tom-desc">/);
    assert.equal((svg.match(/<g /g) || []).length, (svg.match(/<\/g>/g) || []).length, 'group tags balance');
  });

  test('the closed mouth is a line, not a shape', () => {
    const closed = mouthGeometry({ mouthOpen: 0.02, mouthWidth: 0.5, mouthRound: 0.1, mouthCurve: 0.2 });
    assert.ok(!closed.line.endsWith('Z'), 'a closed mouth should be an open path');
    const open = mouthGeometry({ mouthOpen: 1, mouthWidth: 0.7, mouthRound: 0, mouthCurve: 0 });
    assert.ok(open.line.endsWith('Z'));
    assert.ok(open.open > closed.open);
  });

  test('rounding narrows the mouth', () => {
    const wide = mouthGeometry({ mouthOpen: 0.4, mouthWidth: 0.7, mouthRound: 0, mouthCurve: 0 });
    const round = mouthGeometry({ mouthOpen: 0.4, mouthWidth: 0.7, mouthRound: 1, mouthCurve: 0 });
    assert.ok(round.halfWidth < wide.halfWidth);
  });

  test('lids rest on the eye when open and lift clear when wide', () => {
    assert.equal(lidOffsets(1, 0).upper, 0);
    assert.ok(lidOffsets(1.25, 0).upper < 0, 'a wide eye lifts the lid clear');
  });

  test('a closed eye is actually covered', () => {
    // Regression. The lids were short rectangles whose travel took them ACROSS
    // the eye rather than over it, so at eyeOpen 0 the top third stayed visible
    // and every blink in the app was wrong.
    const eyeTop = EYE.l.cy - EYE.ry;
    const eyeBottom = EYE.l.cy + EYE.ry;
    const lidRestY = eyeTop - LID_HEIGHT;   // bottom edge sits on the eye when open

    const { upper } = lidOffsets(0, 0);
    const lidTop = lidRestY + upper;
    const lidBottom = lidRestY + LID_HEIGHT + upper;

    assert.ok(lidBottom >= eyeBottom, `lid bottom ${lidBottom} must reach past eye bottom ${eyeBottom}`);
    assert.ok(lidTop <= eyeTop, `lid top ${lidTop} must still be above eye top ${eyeTop}`);
  });

  test('lid travel never exceeds the rectangle it travels in', () => {
    assert.ok(lidOffsets(0, 0).upper < LID_HEIGHT,
      'travel beyond the lid height reopens a gap above the eye');
  });

  test('closing is monotonic', () => {
    let previous = -Infinity;
    for (const open of [1, 0.8, 0.6, 0.4, 0.2, 0]) {
      const { upper } = lidOffsets(open, 0);
      assert.ok(upper >= previous, `lid moved back up between ${open} and the step before`);
      previous = upper;
    }
  });

  test('squint raises the lower lid without closing the eye', () => {
    assert.equal(lidOffsets(1, 0).lower, 0);
    const squinted = lidOffsets(1, 1).lower;
    assert.ok(squinted > 0 && squinted < EYE.ry, 'a squint narrows the eye, it does not shut it');
  });
});
