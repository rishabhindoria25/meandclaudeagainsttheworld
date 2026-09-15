/** Reflective listening tests. */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../src/clinical/nlu.js';
import {
  toSecondPerson, reflect, doubleSidedReflection, feelingReflection,
  affirmation, summary, FrameMemory,
} from '../src/clinical/reflections.js';

describe('person transformation', () => {
  test('rewrites first person into second', () => {
    assert.equal(toSecondPerson("I'm exhausted and my boss keeps ignoring me"),
      'you are exhausted and your boss keeps ignoring you');
  });

  test('handles past tense agreement', () => {
    assert.equal(toSecondPerson('I was scared'), 'you were scared');
  });

  test('refuses clauses addressed to the listener', () => {
    assert.equal(toSecondPerson('do you even understand'), null);
  });

  test('strips discourse filler', () => {
    assert.equal(toSecondPerson('so basically I gave up, you know'), 'you gave up');
  });
});

describe('reflection selection', () => {
  test('ambivalence produces a double-sided reflection joined by "and"', () => {
    const u = parse('I want to leave my job but I can not afford to lose the salary');
    const r = doubleSidedReflection(u, new FrameMemory());
    assert.ok(r, 'ambivalence should produce a double-sided reflection');
    assert.match(r.text, /want to leave/);
    assert.match(r.text, /afford/);
    assert.ok(!/\bbut\b/.test(r.text), '"but" deletes everything before it and quietly takes a side');
  });

  test('a feeling reflection goes deeper when the feeling is already named', () => {
    // The person says "tired"; a competent reflection reaches past it.
    const u = parse('I am so tired. I have nothing left.');
    const r = feelingReflection(u, new FrameMemory());
    assert.ok(r.complex);
    assert.ok(!/\btired\b/.test(r.text), 'handing back their own word is a simple reflection in disguise');
  });

  test('reflections read as grammatical English', () => {
    const memory = new FrameMemory();
    const inputs = [
      'There is no way out of this',
      'My dad died in March and I still have not cleared his flat',
      'I am furious with her and I cannot say it',
      'I feel completely numb',
    ];
    for (const text of inputs) {
      const r = reflect(parse(text), memory);
      assert.ok(r && r.text.length > 0);
      assert.match(r.text, /^[A-Z]/, `"${r.text}" should start with a capital`);
      assert.match(r.text, /[.?!]$/, `"${r.text}" should end with punctuation`);
      assert.ok(!/\byou you\b/i.test(r.text), `"${r.text}" duplicates a pronoun`);
      assert.ok(!/\bI am having\b/.test(r.text), `"${r.text}" leaked first person`);
    }
  });

  test('frames do not repeat within the memory window', () => {
    const memory = new FrameMemory(6);
    const seen = new Set();
    for (let i = 0; i < 4; i += 1) {
      const r = reflect(parse('everything feels heavy and I cannot explain why'), memory);
      seen.add(r.text);
    }
    assert.ok(seen.size > 1, 'repeating the same stem is the fastest way to stop sounding like listening');
  });
});

describe('affirmation', () => {
  test('names what the person did rather than praising them', () => {
    const a = affirmation(parse('I finally called the doctor this morning'), new FrameMemory());
    assert.ok(a);
    assert.ok(!/proud of you|well done|good job/i.test(a.text),
      'praise positions the listener as an evaluator');
  });
});

describe('summary', () => {
  test('collects threads and invites correction', () => {
    const s = summary(['you are running on empty at work', 'you have not told anyone how bad it is']);
    assert.match(s.text, /running on empty/);
    assert.match(s.text, /What have I missed/);
  });

  test('returns null with nothing to summarise', () => {
    assert.equal(summary([]), null);
  });
});
