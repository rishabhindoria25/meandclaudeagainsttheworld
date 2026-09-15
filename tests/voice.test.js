/** Voice tests: pitch estimation, prosody summarisation, synthesis shaping, DSP. */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { estimateF0, rms, ProsodyAnalyser } from '../src/voice/prosody.js';
import { chunk, prosodyFor, pickVoice, BASE } from '../src/voice/synthesis.js';
import { pitchShift, echoAllowed } from '../src/voice/voicefx.js';

const SR = 48000;
const N = 2048;

/** A harmonically rich periodic signal, which is what voiced speech looks like. */
function voiced(f0, amplitude = 0.3, harmonics = 6, noise = 0) {
  const b = new Float32Array(N);
  for (let i = 0; i < N; i += 1) {
    let s = 0;
    for (let h = 1; h <= harmonics; h += 1) s += Math.sin((2 * Math.PI * f0 * h * i) / SR + h) / h;
    b[i] = amplitude * (s / 2) + (Math.random() - 0.5) * noise;
  }
  return b;
}

describe('fundamental frequency estimation', () => {
  test('is accurate across the human range', () => {
    for (const f of [85, 100, 120, 145, 165, 200, 220, 280, 330]) {
      const { f0 } = estimateF0(voiced(f), SR);
      const error = Math.abs(f0 - f) / f;
      assert.ok(error < 0.05, `${f}Hz estimated as ${f0.toFixed(1)}Hz (${(error * 100).toFixed(1)}% error)`);
    }
  });

  test('does not make octave errors on clean periodic signals', () => {
    // Global-max autocorrelation famously reports half the frequency here.
    const { f0 } = estimateF0(voiced(150, 0.4, 10), SR);
    assert.ok(f0 > 140 && f0 < 160, `got ${f0.toFixed(1)}Hz, likely an octave error`);
  });

  test('survives additive noise', () => {
    const { f0 } = estimateF0(voiced(200, 0.3, 6, 0.08), SR);
    assert.ok(Math.abs(f0 - 200) / 200 < 0.05);
  });

  test('reports unvoiced for silence and noise', () => {
    assert.equal(estimateF0(new Float32Array(N), SR).f0, 0);
    const noise = Float32Array.from({ length: N }, () => (Math.random() - 0.5) * 0.6);
    assert.equal(estimateF0(noise, SR).f0, 0);
  });

  test('is fast enough for realtime', () => {
    const buffer = voiced(160);
    const started = process.hrtime.bigint();
    for (let i = 0; i < 60; i += 1) estimateF0(buffer, SR);
    const msPerFrame = Number(process.hrtime.bigint() - started) / 1e6 / 60;
    assert.ok(msPerFrame < 8, `${msPerFrame.toFixed(2)}ms per frame is too slow for a 60fps loop`);
  });

  test('rms is correct', () => {
    const constant = new Float32Array(100).fill(0.5);
    assert.ok(Math.abs(rms(constant) - 0.5) < 1e-6);
  });
});

describe('prosody summarisation', () => {
  function utterance(analyser, f0, amplitude, words, seconds) {
    analyser.reset();
    for (let i = 0; i < 30; i += 1) analyser.push(voiced(f0, amplitude));
    analyser.startedAt = Date.now() - seconds * 1000;
    return analyser.summarise({ wordCount: words });
  }

  test('reports no confidence before a baseline exists', () => {
    const a = new ProsodyAnalyser({ sampleRate: SR });
    const first = utterance(a, 140, 0.25, 12, 3);
    assert.ok(first.confidence < 0.5, 'a single utterance cannot establish a speaker baseline');
  });

  test('detects activation relative to the speaker’s own baseline', () => {
    const a = new ProsodyAnalyser({ sampleRate: SR });
    for (let i = 0; i < 4; i += 1) utterance(a, 140, 0.25, 12, 3);
    const hot = utterance(a, 210, 0.55, 26, 2.5);
    assert.ok(hot.arousal > 0.75, `expected high arousal, got ${hot.arousal}`);
    assert.ok(hot.confidence > 0.5);
  });

  test('detects a flatter, slower voice', () => {
    const a = new ProsodyAnalyser({ sampleRate: SR });
    let baseline;
    for (let i = 0; i < 4; i += 1) baseline = utterance(a, 140, 0.25, 12, 3);
    const low = utterance(a, 118, 0.12, 8, 4);
    // Relative to this speaker, not to an absolute number: the whole point is
    // that arousal is only meaningful against the person’s own usual voice.
    assert.ok(low.arousal < baseline.arousal - 0.2,
      `expected clearly below baseline ${baseline.arousal}, got ${low.arousal}`);
    assert.equal(low.flat, true);
  });

  test('refuses to guess from too little audio', () => {
    const a = new ProsodyAnalyser({ sampleRate: SR });
    a.reset();
    a.push(voiced(140));
    const s = a.summarise({ wordCount: 1 });
    assert.equal(s.confidence, 0);
    assert.equal(s.arousal, 0.5, 'an unknown value must be neutral, not a guess');
  });
});

describe('synthesis shaping', () => {
  test('chunks long text at sentence boundaries', () => {
    const c = chunk('First sentence. Second one here. And a third.');
    assert.equal(c.length, 3);
    assert.ok(c.every((x) => x.pauseAfter > 0));
  });

  test('splits very long sentences at clause boundaries', () => {
    const long = `I want to say something ${'quite long and rambling, '.repeat(12)}and then finish.`;
    for (const piece of chunk(long)) {
      assert.ok(piece.text.length <= 220, `chunk of ${piece.text.length} chars risks truncation`);
    }
  });

  test('empty input yields no chunks', () => {
    assert.deepEqual(chunk('   '), []);
  });

  test('risk slows and lowers the voice', () => {
    const calm = prosodyFor({ family: 'calm', intensity: 0.4 });
    const crisis = prosodyFor({ family: 'calm', intensity: 0.4 }, { riskTier: 4 });
    assert.ok(crisis.rate < calm.rate, 'a voice to settle against, not one that matches the panic');
    assert.ok(crisis.pitch < calm.pitch);
  });

  test('an activated listener also slows Tom down', () => {
    const normal = prosodyFor({ family: 'calm', intensity: 0.4 });
    const matched = prosodyFor({ family: 'calm', intensity: 0.4 }, { userArousal: 0.9 });
    assert.ok(matched.rate < normal.rate);
  });

  test('positive intent lifts pitch and pace, sadness lowers them', () => {
    assert.ok(prosodyFor({ family: 'joy', intensity: 0.9 }).pitch > BASE.pitch);
    assert.ok(prosodyFor({ family: 'grief', intensity: 0.9 }).rate < BASE.rate);
  });

  test('settings stay inside the API’s valid range', () => {
    for (const family of ['calm', 'joy', 'grief', 'anger', 'anxiety']) {
      for (const tier of [0, 2, 5]) {
        const p = prosodyFor({ family, intensity: 1 }, { riskTier: tier, rateScale: 1.25 });
        assert.ok(p.rate >= 0.1 && p.rate <= 10, `rate ${p.rate}`);
        assert.ok(p.pitch >= 0 && p.pitch <= 2, `pitch ${p.pitch}`);
      }
    }
  });

  test('prefers a warm local voice in the right language', () => {
    const voices = [
      { name: 'Daniel', lang: 'en-GB', localService: true },
      { name: 'Google UK English Female', lang: 'en-GB', localService: false },
      { name: 'Anna', lang: 'de-DE', localService: true },
    ];
    assert.equal(pickVoice(voices, 'en-GB').name, 'Google UK English Female');
    assert.equal(pickVoice(voices, 'de-DE').name, 'Anna');
    assert.equal(pickVoice([], 'en'), null);
  });
});

describe('voice effect', () => {
  /** Minimal AudioBuffer stand-in so the DSP can be exercised outside a browser. */
  function fakeContext() {
    return {
      createBuffer(channels, length, sampleRate) {
        const data = Array.from({ length: channels }, () => new Float32Array(length));
        return {
          numberOfChannels: channels, length, sampleRate, duration: length / sampleRate,
          getChannelData: (i) => data[i],
        };
      },
    };
  }

  test('pitch shifting preserves duration', () => {
    const ctx = fakeContext();
    const src = ctx.createBuffer(1, 44100, 44100);
    const d = src.getChannelData(0);
    for (let i = 0; i < d.length; i += 1) d[i] = 0.5 * Math.sin((2 * Math.PI * 160 * i) / 44100);
    const out = pitchShift(src, 6, ctx);
    assert.equal(out.length, src.length);
  });

  test('pitch shifting raises the frequency', () => {
    const ctx = fakeContext();
    const src = ctx.createBuffer(1, 44100, 44100);
    const d = src.getChannelData(0);
    for (let i = 0; i < d.length; i += 1) d[i] = 0.5 * Math.sin((2 * Math.PI * 160 * i) / 44100);
    const out = pitchShift(src, 6, ctx).getChannelData(0);
    const crossings = (a) => {
      let c = 0;
      for (let i = 2001; i < 42000; i += 1) if ((a[i - 1] < 0) !== (a[i] < 0)) c += 1;
      return (c / ((42000 - 2000) / 44100)) / 2;
    };
    const shifted = crossings(out);
    assert.ok(shifted > 190 && shifted < 260, `expected ~226Hz, got ${shifted.toFixed(0)}Hz`);
  });

  test('overlap-add does not boost amplitude', () => {
    const ctx = fakeContext();
    const src = ctx.createBuffer(1, 44100, 44100);
    const d = src.getChannelData(0);
    for (let i = 0; i < d.length; i += 1) d[i] = 0.5 * Math.sin((2 * Math.PI * 160 * i) / 44100);
    const out = pitchShift(src, 6, ctx).getChannelData(0);
    let peak = 0;
    for (let i = 2000; i < 42000; i += 1) peak = Math.max(peak, Math.abs(out[i]));
    assert.ok(peak < 0.62, `peak ${peak.toFixed(3)} indicates windowing is not normalised`);
  });
});

describe('the playful echo is hard-gated', () => {
  test('allowed only when nothing is wrong', () => {
    assert.equal(echoAllowed({ riskTier: 0, valence: 0.1, intensity: 0.2 }), true);
  });

  test('never during distress', () => {
    assert.equal(echoAllowed({ riskTier: 0, valence: -0.7, intensity: 0.6 }), false);
  });

  test('never at any risk tier', () => {
    assert.equal(echoAllowed({ riskTier: 2 }), false);
  });

  test('never again in a session where risk appeared', () => {
    assert.equal(echoAllowed({ riskTier: 0, valence: 0.3, intensity: 0.1, everAtRisk: true }), false,
      'a cartoon voice after a disclosure would be grotesque');
  });
});

describe('synthesis that never actually speaks', () => {
  /**
   * Several environments report speechSynthesis support and then stay silent:
   * a headless browser, a muted device policy, an autoplay block, a platform
   * voice that failed to load. The app must not freeze waiting on silence.
   */
  function withFakeSpeech({ speaks }, run) {
    const utterances = [];
    class FakeUtterance {
      constructor(text) { this.text = text; utterances.push(this); }
    }
    const synth = {
      speak(u) {
        if (!speaks) return;                       // silently does nothing
        setTimeout(() => { u.onstart?.(); u.onend?.(); }, 5);
      },
      cancel() {},
      getVoices: () => [],
    };
    const priorWindow = globalThis.window;
    const priorUtterance = globalThis.SpeechSynthesisUtterance;
    const priorPerf = globalThis.performance;
    globalThis.window = { speechSynthesis: synth, SpeechSynthesisUtterance: FakeUtterance };
    globalThis.speechSynthesis = synth;
    globalThis.SpeechSynthesisUtterance = FakeUtterance;
    globalThis.performance = priorPerf ?? { now: () => Date.now() };
    return run(utterances).finally(() => {
      globalThis.window = priorWindow;
      globalThis.SpeechSynthesisUtterance = priorUtterance;
      delete globalThis.speechSynthesis;
    });
  }

  test('a silent platform is detected and not waited on again', async () => {
    const { Speaker } = await import('../src/voice/synthesis.js');
    await withFakeSpeech({ speaks: false }, async () => {
      const speaker = new Speaker();
      const long = 'One sentence here. Another sentence here. A third one as well. And a fourth.';

      const firstStart = Date.now();
      await speaker.speak(long);
      const firstMs = Date.now() - firstStart;

      assert.equal(speaker.functional, false, 'must notice that nothing was spoken');
      assert.ok(firstMs < 2500, `first turn took ${firstMs}ms; it must abandon after the first silent chunk`);

      const secondStart = Date.now();
      await speaker.speak(long);
      assert.ok(Date.now() - secondStart < 60, 'later turns must not pay the watchdog at all');
    });
  });

  test('a working platform is marked functional and speaks every chunk', async () => {
    const { Speaker } = await import('../src/voice/synthesis.js');
    await withFakeSpeech({ speaks: true }, async (utterances) => {
      const speaker = new Speaker();
      await speaker.speak('First sentence. Second sentence. Third sentence.');
      assert.equal(speaker.functional, true);
      assert.equal(utterances.length, 3, 'every chunk should be spoken');
    });
  });

  test('availability can be re-tested', async () => {
    const { Speaker } = await import('../src/voice/synthesis.js');
    const speaker = new Speaker();
    speaker.functional = false;
    speaker.resetAvailability();
    assert.equal(speaker.functional, null);
  });
});
