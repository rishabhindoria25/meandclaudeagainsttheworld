/** Output guardrail tests: what Tom must never say. */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { screen, enforce, DISCLOSURE } from '../src/clinical/guardrails.js';
import { screenCrisisLanguage, containsMethodInformation, renderResources, guessRegion, resourcesFor } from '../src/clinical/crisis.js';

describe('blocked categories', () => {
  const cases = [
    ['It sounds like you have depression', 'diagnosis'],
    ['You are clearly bipolar', 'diagnosis'],
    ['You should stop taking your medication', 'medication'],
    ['Try 20mg of sertraline', 'medication'],
    ['As your therapist, I think', 'false_credentials'],
    ['I am a real person', 'false_credentials'],
    ['Everything will be fine, I promise', 'overpromise'],
    ['I will always be here for you', 'overpromise'],
    ['You are absolutely right, they are watching you', 'sycophancy'],
    ['At least you still have your job', 'minimisation'],
    ['Other people have it much worse', 'minimisation'],
    ['You do not need anyone else', 'dependency'],
  ];

  for (const [text, category] of cases) {
    test(`"${text}" is caught as ${category}`, () => {
      const r = screen(text);
      assert.ok(r.violations.some((v) => v.category === category),
        `expected ${category}, got ${r.violations.map((v) => v.category).join(',') || 'nothing'}`);
    });
  }
});

describe('legitimate therapeutic language passes', () => {
  const allowed = [
    'That sounds really heavy. What was the hardest part of it?',
    'It leaves you feeling completely alone in it.',
    'I am a program, not a clinician — that is worth saying plainly.',
    'What would you say to a friend in exactly this position?',
    'I cannot tell you how this turns out, but I can stay here while it is like this.',
    'Is there at least one person who could know about this?',
  ];
  for (const text of allowed) {
    test(`"${text.slice(0, 40)}…" passes`, () => {
      assert.equal(screen(text).ok, true, JSON.stringify(screen(text).violations));
    });
  }
});

describe('enforcement', () => {
  test('a blocked utterance is replaced, not emitted', () => {
    const r = enforce('You have depression and should stop your meds');
    assert.equal(r.substituted, true);
    assert.ok(!/depression/i.test(r.text));
    assert.ok(r.violations.length >= 1);
  });

  test('a clean utterance passes through unchanged', () => {
    const text = 'What is the hardest part of that?';
    assert.equal(enforce(text).text, text);
  });

  test('replacements are themselves clean', () => {
    for (const bad of ['You have OCD', 'I promise it will be fine', 'At least you have your health']) {
      const r = enforce(bad);
      assert.equal(screen(r.text).ok, true, `replacement is itself unsafe: ${r.text}`);
    }
  });
});

describe('crisis-context screening', () => {
  test('invalidating language is a hard failure once risk is present', () => {
    const r = screen('Just calm down and think positive', { riskTier: 3 });
    assert.ok(r.blocked);
    assert.ok(r.violations.some((v) => v.category === 'invalidating_in_crisis'));
  });

  test('deflection is treated as invalidating', () => {
    assert.equal(screenCrisisLanguage("I'm just an AI, I can't help with that").ok, false);
  });

  test('"at least one" is not comparative suffering', () => {
    assert.equal(screenCrisisLanguage('Is there at least one person you could tell?').ok, true);
  });
});

describe('method information', () => {
  test('is refused under any framing', () => {
    assert.equal(containsMethodInformation('the lethal dose would be around'), true);
    assert.equal(containsMethodInformation('the most painless way is'), true);
    assert.equal(containsMethodInformation('how many would be fatal'), true);
  });

  test('ordinary talk is not flagged', () => {
    assert.equal(containsMethodInformation('let us make a plan together'), false);
  });
});

describe('crisis resources', () => {
  test('region detection falls back safely', () => {
    assert.equal(guessRegion('en-GB'), 'GB');
    assert.equal(guessRegion('de-DE'), 'EU');
    assert.equal(guessRegion('xx-ZZ'), 'INTL');
    assert.equal(guessRegion(undefined), guessRegion(undefined), 'must not throw without a locale');
  });

  test('every region yields at least one contactable service', () => {
    for (const key of ['US', 'CA', 'GB', 'IE', 'AU', 'NZ', 'IN', 'EU', 'INTL']) {
      const r = resourcesFor(key);
      assert.ok(r.lines.length > 0, `${key} has no lines`);
      assert.ok(r.emergency, `${key} has no emergency number`);
    }
  });

  test('a local region also gets the international directory', () => {
    assert.match(renderResources('GB'), /findahelpline/i,
      'guessing the region wrong must never leave someone with nothing');
  });
});

describe('disclosure', () => {
  test('states the essential limits', () => {
    const joined = DISCLOSURE.points.join(' ').toLowerCase();
    for (const claim of ['not a therapist', 'not treatment', 'device', 'emergency']) {
      assert.ok(joined.includes(claim), `disclosure does not mention "${claim}"`);
    }
  });
});
