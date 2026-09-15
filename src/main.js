/**
 * Application wiring.
 *
 * The turn loop is deliberately simple and entirely local:
 *
 *   input (typed or spoken)
 *     -> NLU parse, fused with acoustic prosody when the microphone was used
 *     -> clinical director decides the next move
 *     -> guardrails screen the move (inside the director)
 *     -> render the caption, drive the character, speak
 *
 * No step of that touches the network. The only exception is speech recognition,
 * which in Chromium browsers is performed by the browser vendor's service — the
 * interface says so plainly, and typing is always available instead.
 */

import { mount } from './character/rig.js';
import { Animator } from './character/animator.js';
import { listeningPose, speakingPose, poseFor } from './character/expressions.js';
import { textToVisemes } from './character/visemes.js';

import { Listener, isSupported as sttSupported } from './voice/recognition.js';
import { Speaker, isSupported as ttsSupported } from './voice/synthesis.js';
import { ProsodyAnalyser, attachToStream } from './voice/prosody.js';
import { EchoToy, echoAllowed } from './voice/voicefx.js';

import { parse } from './clinical/nlu.js';
import { Director, PHASE } from './clinical/director.js';
import { TIER } from './clinical/risk.js';
import { CRISIS_RESOURCES, guessRegion, resourcesFor, renderResources } from './clinical/crisis.js';
import { DISCLOSURE } from './clinical/guardrails.js';
import { renderPlan } from './clinical/safety-plan.js';
import { PHQ9, GAD7, WHO5, SESSION_FEEDBACK, describe as describeScore } from './clinical/measures.js';
import * as memory from './clinical/memory.js';

import { createTranscript } from './ui/transcript.js';
import { renderWhy, renderFidelity, buildMeasureForm, renderMeasureHistory } from './ui/panels.js';

const $ = (id) => document.getElementById(id);

const state = {
  store: memory.load(),
  region: 'INTL',
  director: null,
  transcript: null,
  animator: null,
  speaker: null,
  listener: null,
  prosody: new ProsodyAnalyser(),
  echo: new EchoToy(),
  micStream: null,
  detachProsody: null,
  lastMove: null,
  lastProsody: null,
  voiceOn: true,
  micOn: false,
  everAtRisk: false,
  startedAt: new Date().toISOString(),
  busy: false,
  /** Incremented on every user turn, so a superseded turn can abandon its work. */
  turnEpoch: 0,
};

/* ------------------------------------------------------------------ *
 * Boot
 * ------------------------------------------------------------------ */

async function boot() {
  const settings = state.store.settings ?? {};
  state.region = settings.region ?? guessRegion();

  applySettings(settings);

  const parts = mount($('tom-mount'));
  state.animator = new Animator(parts, { reducedMotion: settings.reducedMotion });
  state.animator.setPose(listeningPose({ engagement: 0.6 }));
  state.animator.start();

  state.transcript = createTranscript($('transcript'));

  if (ttsSupported()) {
    state.speaker = new Speaker();
    await state.speaker.init(navigator.language);
  } else {
    state.voiceOn = false;
    $('toggle-voice').setAttribute('aria-pressed', 'false');
    $('toggle-voice').disabled = true;
  }

  const bridgeInfo = memory.bridge(state.store);
  state.director = new Director({
    region: state.region,
    memory: bridgeInfo.lastFocus ? { lastFocus: bridgeInfo.lastFocus.replace(/_/g, ' ') } : null,
  });

  wireUI();
  populateRegions();
  renderCrisisLines($('settings-crisis-lines'));
  renderMeasureHistory($('measure-history'), state.store.semantic.measures);

  if (settings.acceptedDisclosure) {
    $('app').dataset.state = 'ready';
    openingTurn(bridgeInfo);
  } else {
    showDisclosure();
  }
}

function showDisclosure() {
  const list = $('disclosure-points');
  list.replaceChildren();
  for (const point of DISCLOSURE.points) {
    const li = document.createElement('li');
    li.textContent = point;
    list.append(li);
  }
  const dialog = $('disclosure');
  dialog.showModal();

  $('disclosure-accept').addEventListener('click', () => {
    state.region = $('region-select').value || state.region;
    persistSettings({ acceptedDisclosure: true, region: state.region });
    state.director.region = state.region;
    dialog.close();
    $('app').dataset.state = 'ready';
    renderCrisisLines($('settings-crisis-lines'));
    openingTurn(memory.bridge(state.store));
    $('say').focus();
  }, { once: true });
}

function openingTurn(bridgeInfo) {
  const greeting = bridgeInfo?.line
    ? `Hello again. ${bridgeInfo.line} Where would you like to start today?`
    : 'Hello. I am Tom. I am a program, not a person, and everything you say here stays on this device. Where would you like to start?';

  const move = {
    kind: 'question',
    text: greeting,
    emotion: { family: 'calm', intensity: 0.35 },
    gesture: 'nod',
    meta: { why: 'Opening with an invitation, and a bridge from the last session where there is one.', phase: PHASE.ENGAGING, modality: 'Session structure', fidelity: state.director.fidelity() },
  };
  present(move);
}

/* ------------------------------------------------------------------ *
 * The turn loop
 * ------------------------------------------------------------------ */

async function handleUserTurn(rawText) {
  const text = String(rawText ?? '').trim();
  if (!text) return;

  // Barge-in. If Tom is still talking when the person says something, he stops
  // and listens. The alternative — dropping the input because a turn is already
  // in flight — silently loses what someone just typed, which is unforgivable
  // when the thing they typed might be the hardest sentence of their week.
  if (state.busy) {
    state.speaker?.cancel();
    state.animator?.stopSpeaking();
    state.turnEpoch += 1;
  }
  const epoch = ++state.turnEpoch;
  const superseded = () => epoch !== state.turnEpoch;
  state.busy = true;

  state.transcript.add('user', text);
  $('interim').hidden = true;
  $('interim').textContent = '';
  $('say').value = '';
  autosize($('say'));

  // Acoustic evidence, when the turn was spoken rather than typed.
  const prosody = state.lastProsody && Date.now() - state.lastProsody.at < 12000
    ? state.lastProsody.summary
    : null;
  state.lastProsody = null;

  const understanding = parse(text, {
    priorTier: state.director.riskTier,
    prosody: prosody ? { arousal: prosody.arousal, confidence: prosody.confidence } : undefined,
  });

  setStatus('thinking');
  // Match the character to the person while they are still the last one to speak.
  state.animator.setPose(listeningPose({
    userArousal: understanding.affect.arousal,
    userValence: understanding.affect.valence,
    engagement: 0.75,
  }));

  // A beat before replying. Instant answers read as processing rather than listening.
  await pause(340 + Math.min(700, text.length * 4));

  if (superseded()) return;

  const move = state.director.next(understanding);
  state.lastUnderstanding = understanding;

  if (state.director.riskTier >= TIER.PASSIVE_IDEATION) {
    state.everAtRisk = true;
    showCrisisBanner();
  }

  await present(move, understanding, superseded);
  if (superseded()) return;

  if (prosody && prosody.confidence > 0.45 && prosody.flat && understanding.affect.intensity < 0.3) {
    // The voice said something the words did not. Worth one gentle, tentative check.
    await pause(500);
    if (superseded()) return;
    await present({
      kind: 'question',
      text: 'One thing, and tell me if I am reading too much into it — your voice sounds flatter than it usually does. Is that just tiredness, or is something else going on?',
      emotion: { family: 'calm', intensity: 0.3 },
      gesture: 'tilt',
      meta: {
        why: `Acoustic observation: ${prosody.note} Prosody carries affect the words often do not, so it is raised as a question and never as a conclusion.`,
        phase: state.director.phase, modality: 'Prosodic observation', fidelity: state.director.fidelity(),
      },
    });
  }

  if (superseded()) return;
  updateQuickReplies(move);
  setStatus('listening');
  state.busy = false;
}

/**
 * Render, animate and speak one of Tom's moves.
 * @param {object} move
 * @param {object} [understanding]
 */
async function present(move, understanding, superseded = () => false) {
  state.lastMove = move;

  state.transcript.add('tom', move.text, {
    kind: move.kind,
    resources: move.resources,
    why: $('toggle-why').getAttribute('aria-pressed') === 'true' ? move.meta?.why : null,
  });

  renderWhy($('why-content'), move);
  renderFidelity($('fidelity-content'), move.meta?.fidelity ?? state.director.fidelity(), state.director.alliance);

  const pose = speakingPose(move.emotion ?? { family: 'calm', intensity: 0.35 }, {
    userValence: understanding?.affect?.valence ?? 0,
  });
  state.animator.setPose(pose);
  if (move.gesture) state.animator.gesture(move.gesture);

  if (state.voiceOn && state.speaker) {
    setStatus('speaking');
    const rateScale = Number($('opt-rate').value) || 1;
    const timeline = textToVisemes(move.text, { rate: rateScale });
    state.animator.speak(timeline);

    await state.speaker.speak(move.text, {
      emotion: move.emotion,
      riskTier: state.director.riskTier,
      userArousal: understanding?.affect?.arousal,
      rateScale,
      onBoundary: ({ elapsedMs }) => state.animator.syncWord(elapsedMs),
    });

    state.animator.stopSpeaking();
    if (superseded()) return;
  }

  // Settle back into listening.
  state.animator.setPose(listeningPose({
    userArousal: understanding?.affect?.arousal ?? 0.4,
    userValence: understanding?.affect?.valence ?? 0,
    engagement: 0.65,
  }));
  setStatus('listening');
}

function setStatus(value) {
  const el = $('tom-status');
  el.dataset.state = value;
  el.textContent = { listening: 'Listening', speaking: 'Speaking', thinking: 'Thinking' }[value] ?? value;
}

/* ------------------------------------------------------------------ *
 * Microphone
 * ------------------------------------------------------------------ */

async function startMic() {
  if (!sttSupported()) {
    state.transcript.add('system', 'This browser cannot do speech recognition, so the microphone button is off. Typing works exactly the same — Tom does not treat it differently.');
    $('mic').disabled = true;
    return;
  }

  try {
    state.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    state.transcript.add('system', 'The microphone was not available. You can type instead.');
    return;
  }

  state.prosody.reset();
  state.detachProsody = attachToStream(state.micStream, state.prosody);

  state.listener = new Listener({
    lang: navigator.language,
    onInterim: (text) => {
      const el = $('interim');
      el.hidden = false;
      el.textContent = text;
    },
    onFinal: (text) => {
      const summary = state.prosody.summarise({ wordCount: text.split(/\s+/).length });
      state.lastProsody = { summary, at: Date.now() };
      state.prosody.reset();
      handleUserTurn(text);
    },
    onError: (err) => {
      state.transcript.add('system', err.message);
      if (err.fatal) stopMic();
    },
  });

  if (state.listener.start()) {
    state.micOn = true;
    $('mic').setAttribute('aria-pressed', 'true');
    $('mic').setAttribute('aria-label', 'Stop talking');
  }
}

function stopMic() {
  state.micOn = false;
  $('mic').setAttribute('aria-pressed', 'false');
  $('mic').setAttribute('aria-label', 'Talk to Tom');
  $('interim').hidden = true;

  state.listener?.stop();
  state.listener = null;
  state.detachProsody?.();
  state.detachProsody = null;
  state.micStream?.getTracks().forEach((t) => t.stop());
  state.micStream = null;
}

/* ------------------------------------------------------------------ *
 * Crisis surface
 * ------------------------------------------------------------------ */

function showCrisisBanner() {
  const banner = $('crisis-banner');
  if (!banner.hidden) return;
  renderCrisisLines($('crisis-lines'));
  banner.hidden = false;
  $('app').dataset.crisis = 'true';
}

function renderCrisisLines(root) {
  const res = resourcesFor(state.region);
  root.replaceChildren();

  const emergency = document.createElement('li');
  const strong = document.createElement('strong');
  strong.textContent = 'Emergency services';
  const span = document.createElement('span');
  span.textContent = res.emergency;
  emergency.append(strong, span);
  root.append(emergency);

  for (const line of res.lines) {
    const li = document.createElement('li');
    const name = document.createElement('strong');
    name.textContent = line.name;
    const detail = document.createElement('span');
    detail.textContent = line.note ? `${line.contact} — ${line.note}` : line.contact;
    li.append(name, detail);
    root.append(li);
  }
}

function populateRegions() {
  const options = Object.entries(CRISIS_RESOURCES)
    .map(([key, value]) => ({ key, label: value.label }))
    .sort((a, b) => (a.key === 'INTL' ? 1 : b.key === 'INTL' ? -1 : a.label.localeCompare(b.label)));

  for (const id of ['region-select', 'region-setting']) {
    const select = $(id);
    select.replaceChildren();
    for (const { key, label } of options) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = label;
      if (key === state.region) opt.selected = true;
      select.append(opt);
    }
  }
}

/* ------------------------------------------------------------------ *
 * Quick replies
 * ------------------------------------------------------------------ */

function updateQuickReplies(move) {
  const root = $('quick');
  root.replaceChildren();

  /** @type {Array<{label:string, send?:string, action?:()=>void}>} */
  let options = [];

  if (move.expects === 'yesno') {
    options = [
      { label: 'Yes, go on', send: 'yes' },
      { label: 'Not right now', send: 'not right now' },
    ];
  } else if (move.expects === 'rating') {
    options = [0, 2, 4, 6, 8, 10].map((n) => ({ label: String(n), send: String(n) }));
  } else if (state.director.activeProtocol) {
    options = [{ label: 'Can we stop this?', send: 'can we stop' }];
  } else if (state.director.counters.turns >= 6) {
    options = [
      { label: 'Say more about that', send: 'can you say more about that' },
      { label: 'That is not quite it', send: 'that is not quite it' },
    ];
    if (echoAllowed({
      riskTier: state.director.riskTier,
      valence: state.lastUnderstanding?.affect?.valence ?? 0,
      intensity: state.lastUnderstanding?.affect?.intensity ?? 0,
      everAtRisk: state.everAtRisk,
    }) && state.micOn) {
      options.push({ label: '🐱 Make Tom repeat me', action: runEcho });
    }
  }

  root.hidden = options.length === 0;
  for (const option of options) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = option.label;
    btn.addEventListener('click', () => {
      if (option.action) option.action();
      else handleUserTurn(option.send);
    });
    root.append(btn);
  }
}

/**
 * The playful echo. Gated hard: never while there is any risk signal, and never
 * while the person is in distress.
 */
async function runEcho() {
  if (!state.micStream) return;
  const wasListening = state.micOn;
  if (wasListening) state.listener?.abort();

  state.transcript.add('system', 'Go on then — say something. Tom is listening for about four seconds.');
  setStatus('listening');

  try {
    const buffer = await state.echo.record(state.micStream);
    state.animator.setPose(poseFor('joy', 0.6));
    state.animator.gesture('emphasis');
    setStatus('speaking');
    // Drive the mouth from the clip's own length; there are no words to time against.
    state.animator.speak(textToVisemes('a'.repeat(Math.round(buffer.duration * 11))));
    await state.echo.play(buffer);
    state.animator.stopSpeaking();
  } catch {
    state.transcript.add('system', 'That did not record properly. Never mind.');
  }

  state.animator.setPose(listeningPose({ engagement: 0.6 }));
  setStatus('listening');
  if (wasListening) state.listener?.start();
}

/* ------------------------------------------------------------------ *
 * Settings and data
 * ------------------------------------------------------------------ */

function applySettings(settings) {
  const root = document.documentElement;
  if (settings.reducedMotion) root.dataset.motion = 'reduced';
  if (settings.highContrast) root.dataset.contrast = 'high';
  $('opt-reduced-motion').checked = Boolean(settings.reducedMotion);
  $('opt-contrast').checked = Boolean(settings.highContrast);
  $('opt-voice-in').checked = settings.voiceIn !== false;
  if (Number.isFinite(settings.rate)) $('opt-rate').value = String(settings.rate);
  state.voiceOn = settings.voiceOut !== false;
  $('toggle-voice').setAttribute('aria-pressed', String(state.voiceOn));
}

function persistSettings(patch) {
  state.store.settings = { ...state.store.settings, ...patch };
  memory.save(state.store);
}

function download(filename, content, type = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ------------------------------------------------------------------ *
 * Questionnaires
 * ------------------------------------------------------------------ */

function offerMeasure(instrument) {
  const host = document.createElement('div');
  host.className = 'setting-group';
  const heading = document.createElement('h3');
  heading.textContent = instrument.fullName;
  const attribution = document.createElement('p');
  attribution.className = 'hint';
  attribution.textContent = `${instrument.attribution} This is a screening questionnaire, not a diagnosis.`;
  host.append(heading, attribution);

  const form = buildMeasureForm(instrument, ({ scored }) => {
    memory.recordMeasure(state.store, instrument.id, scored.scaled);
    memory.save(state.store);
    renderMeasureHistory($('measure-history'), state.store.semantic.measures);
    host.remove();

    state.transcript.add('system', describeScore(instrument, scored));

    // PHQ-9 item 9 asks about thoughts of being better off dead. A non-zero answer
    // goes to the safety layer immediately, rather than sitting in a total.
    if (scored.riskItem > 0) {
      handleUserTurn('I answered yes to the question about being better off dead.');
    }
    closePanel('settings-panel');
  });

  host.append(form);
  $('measure-history').before(host);
  form.querySelector('input')?.focus();
}

/* ------------------------------------------------------------------ *
 * Panels
 * ------------------------------------------------------------------ */

function openPanel(id) {
  for (const other of ['why-panel', 'settings-panel']) {
    if (other !== id) closePanel(other);
  }
  $(id).hidden = false;
  $('scrim').hidden = false;
  const toggle = document.querySelector(`[aria-controls="${id}"]`);
  toggle?.setAttribute('aria-pressed', 'true');
  $(id).querySelector('button, select, input')?.focus();
}

function closePanel(id) {
  $(id).hidden = true;
  const anyOpen = ['why-panel', 'settings-panel'].some((p) => !$(p).hidden);
  $('scrim').hidden = anyOpen ? false : true;
  document.querySelector(`[aria-controls="${id}"]`)?.setAttribute('aria-pressed', 'false');
}

function togglePanel(id) {
  if ($(id).hidden) openPanel(id); else closePanel(id);
}

/* ------------------------------------------------------------------ *
 * Event wiring
 * ------------------------------------------------------------------ */

function wireUI() {
  const say = $('say');

  $('composer').addEventListener('submit', (event) => {
    event.preventDefault();
    handleUserTurn(say.value);
  });

  say.addEventListener('input', () => autosize(say));
  say.addEventListener('keydown', (event) => {
    // Enter sends; Shift+Enter is a new line. Familiar, and one less thing to learn.
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleUserTurn(say.value);
    }
  });

  $('mic').addEventListener('click', () => {
    if (state.micOn) stopMic(); else startMic();
  });

  $('toggle-voice').addEventListener('click', () => {
    state.voiceOn = !state.voiceOn;
    $('toggle-voice').setAttribute('aria-pressed', String(state.voiceOn));
    if (!state.voiceOn) { state.speaker?.cancel(); state.animator.stopSpeaking(); }
    persistSettings({ voiceOut: state.voiceOn });
  });

  $('toggle-why').addEventListener('click', () => togglePanel('why-panel'));
  $('toggle-settings').addEventListener('click', () => togglePanel('settings-panel'));

  for (const btn of document.querySelectorAll('[data-close]')) {
    btn.addEventListener('click', () => closePanel(btn.dataset.close));
  }
  $('scrim').addEventListener('click', () => {
    closePanel('why-panel');
    closePanel('settings-panel');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closePanel('why-panel');
      closePanel('settings-panel');
    }
  });

  $('crisis-close').addEventListener('click', () => {
    $('crisis-banner').hidden = true;
    delete $('app').dataset.crisis;
    state.transcript.add('system', 'The numbers are still in Settings, under "Help right now", whenever you want them.');
  });

  // Comfort settings
  $('opt-reduced-motion').addEventListener('change', (e) => {
    document.documentElement.dataset.motion = e.target.checked ? 'reduced' : '';
    state.animator.reducedMotion = e.target.checked;
    persistSettings({ reducedMotion: e.target.checked });
  });
  $('opt-contrast').addEventListener('change', (e) => {
    document.documentElement.dataset.contrast = e.target.checked ? 'high' : '';
    persistSettings({ highContrast: e.target.checked });
  });
  $('opt-voice-in').addEventListener('change', (e) => {
    $('mic').disabled = !e.target.checked;
    if (!e.target.checked && state.micOn) stopMic();
    persistSettings({ voiceIn: e.target.checked });
  });
  $('opt-rate').addEventListener('change', (e) => persistSettings({ rate: Number(e.target.value) }));

  $('region-setting').addEventListener('change', (e) => {
    state.region = e.target.value;
    state.director.region = state.region;
    persistSettings({ region: state.region });
    renderCrisisLines($('settings-crisis-lines'));
    if (!$('crisis-banner').hidden) renderCrisisLines($('crisis-lines'));
  });

  // Measures
  const measureRoot = $('measure-buttons');
  for (const instrument of [PHQ9, GAD7, WHO5, SESSION_FEEDBACK]) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--quiet';
    btn.textContent = instrument.name;
    btn.title = instrument.fullName;
    btn.addEventListener('click', () => offerMeasure(instrument));
    measureRoot.append(btn);
  }

  // Safety plan
  $('start-safety-plan').addEventListener('click', async () => {
    closePanel('settings-panel');
    await present(state.director.beginSafetyPlan());
  });
  $('export-safety-plan').addEventListener('click', () => {
    const plan = state.director.safetyPlan ?? state.store.semantic.safetyPlan;
    if (!plan) {
      $('safety-plan-view').hidden = false;
      $('safety-plan-view').textContent = 'No safety plan yet. "Make one with Tom" starts it — it takes about ten minutes.';
      return;
    }
    const text = renderPlan(plan, renderResources(state.region, { emergency: true }));
    $('safety-plan-view').hidden = false;
    $('safety-plan-view').textContent = text;
    download('my-safety-plan.txt', text, 'text/plain');
  });

  // Data
  $('export-data').addEventListener('click', () => {
    const payload = memory.exportAll(state.store, state.transcript.entries);
    payload.sessionNotes = state.director.transcriptNotes();
    download(`tom-export-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2));
  });

  $('erase-data').addEventListener('click', () => {
    const sure = confirm('Delete everything — every session, every note, your safety plan, all of it? This cannot be undone.');
    if (!sure) return;
    memory.erase();
    state.store = memory.load();
    state.transcript.clear();
    renderMeasureHistory($('measure-history'), state.store.semantic.measures);
    state.transcript.add('system', 'All gone. Nothing is stored any more.');
  });

  // Persist the session on the way out, so the next one can bridge to it.
  window.addEventListener('pagehide', saveSession);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveSession(); });
}

let saved = false;
function saveSession() {
  if (saved || !state.director || state.director.counters.turns < 2) return;
  saved = true;
  const notes = state.director.transcriptNotes();
  memory.recordSession(state.store, { notes, transcript: [], startedAt: state.startedAt });
  if (state.director.safetyPlan) state.store.semantic.safetyPlan = state.director.safetyPlan;
  memory.save(state.store);
}

function autosize(el) {
  el.style.height = 'auto';
  el.style.height = `${Math.min(148, el.scrollHeight)}px`;
}

function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

boot().catch((err) => {
  console.error(err);
  const t = document.getElementById('transcript');
  if (t) t.textContent = 'Something went wrong starting up. Reloading the page usually fixes it.';
});
