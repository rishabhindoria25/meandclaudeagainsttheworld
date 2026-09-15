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
import { GestureRecogniser, AgitationMeter, toRigSpace } from './character/touch.js';
import { resolveReaction, pickLine, strokeMilestone, AGITATION_LINES } from './character/reactions.js';
import { Purr, playReaction, playSneeze } from './voice/catsounds.js';
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
  touch: null,
  purr: null,
  agitation: null,
  strokeMilestones: new Set(),
  reactionCooldowns: {},
  soundsOn: true,
  touchOn: true,
  captionsOn: true,
  holdToTalk: true,
  status: 'listening',
  defaultHint: '',
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
  wireTouch(parts);
  state.defaultHint = (typeof matchMedia === 'function' && matchMedia('(hover: none)').matches)
    ? 'Stroke him, or poke him. He does not mind either.'
    : 'Stroke him, or poke him — he does not mind either. Keys: P to pet, N for his nose.';
  $('hint').textContent = state.defaultHint;

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
    $('talk').focus();
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
  showYouSaid(text);
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

  showCaption(move);
  state.transcript.add('tom', move.text, {
    kind: move.kind,
    resources: move.resources,
    why: move.meta?.why,
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

/** Whether the person has asked to see Tom's reasoning inline. */
function whyInline() {
  return $('toggle-why').getAttribute('aria-pressed') === 'true';
}

function setStatus(value) {
  state.status = value;
  const label = $('talk-label');
  if (state.micOn) { label.textContent = 'Listening…'; return; }
  label.textContent = {
    listening: state.holdToTalk ? 'Hold to talk' : 'Tap to talk',
    speaking: 'Tom is talking',
    thinking: 'Thinking…',
  }[value] ?? value;
}

/**
 * Show what Tom just said, as a subtitle over the scene.
 *
 * Deliberately not a chat log. The character is the interface, and a scrolling
 * transcript beside him turns him into decoration. It stays up until he says
 * something else rather than fading on a timer, because a caption you can miss
 * is not doing its job.
 */
function showCaption(move) {
  const caption = $('caption');
  const resources = $('caption-resources');
  const why = $('caption-why');

  if (!state.captionsOn) {
    caption.textContent = '';
    resources.hidden = true;
    why.hidden = true;
    return;
  }

  caption.textContent = move.text;
  caption.classList.toggle('caption--safety', move.kind === 'safety' || move.kind === 'safety_plan');
  // Re-trigger the entrance animation.
  caption.style.animation = 'none';
  void caption.offsetWidth;
  caption.style.animation = '';

  resources.replaceChildren();
  if (move.resources) {
    for (const line of move.resources.split('\n').filter(Boolean)) {
      const li = document.createElement('li');
      const [name, ...rest] = line.split(':');
      const detail = rest.join(':').trim();
      if (detail) {
        const strong = document.createElement('strong');
        strong.textContent = name.trim();
        const span = document.createElement('span');
        span.textContent = detail;
        li.append(strong, span);
      } else li.textContent = line;
      resources.append(li);
    }
  }
  resources.hidden = !move.resources;
  // Always start at the top of the block, so his sentence is what you read first.
  $('caption').closest('.scene__captions')?.scrollTo({ top: 0, behavior: 'auto' });

  const wantWhy = whyInline() && move.meta?.why;
  why.textContent = wantWhy ? move.meta.why : '';
  why.hidden = !wantWhy;
}

/** Briefly echo what the person said, the way the old toys showed your words. */
function showYouSaid(text) {
  const el = $('you-said');
  el.textContent = text;
  el.hidden = !text;
  clearTimeout(state.youSaidTimer);
  if (text) state.youSaidTimer = setTimeout(() => { el.hidden = true; }, 6000);
}

/* ------------------------------------------------------------------ *
 * Touch
 * ------------------------------------------------------------------ */

/**
 * Make Tom touchable.
 *
 * Reactions are fired synchronously from the pointer handler so they land on the
 * same frame as the touch. Anything that waits — even by a tick — reads as a
 * button being pressed rather than an animal being prodded, and that difference
 * is the entire feature.
 */
function wireTouch(parts) {
  const svg = parts.svg;
  if (!svg) return;

  state.purr = new Purr();
  state.agitation = new AgitationMeter();

  state.touch = new GestureRecogniser({
    onMove: ({ x, y, pressed }) => {
      // Eyes follow the pointer. Cheap, and it does more for aliveness than any
      // single expression.
      state.animator.lookAt({
        x: Math.max(-1, Math.min(1, (x - 210) / 190)),
        y: Math.max(-1, Math.min(1, (y - 176) / 210)),
      });
      state.gazePressed = pressed;
    },
    onStroke: (info) => {
      if (!state.touchOn) return;
      const params = state.soundsOn ? state.purr.setCredit(info.credit) : { active: info.credit > 0.15 };
      if (params.active) state.animator.gesture('purr_shiver');
      const milestone = strokeMilestone(info.credit, state.strokeMilestones);
      if (milestone) {
        state.strokeMilestones.add(milestone.id);
        if (milestone.gesture) state.animator.gesture(milestone.gesture);
        if (milestone.text && !state.busy) {
          const why = 'Stroking is a self-soothing behaviour in its own right. Pairing it with a longer out-breath turns it into paced breathing, which is the fastest non-pharmacological way to bring arousal down — offered here as stroking a cat rather than as an exercise.';
          state.transcript.add('tom', milestone.text, { why: whyInline() ? why : null });
          renderWhy($('why-content'), {
            kind: 'reflect', text: milestone.text,
            meta: { why, modality: 'DBT self-soothe / paced breathing', phase: state.director.phase, fidelity: state.director.fidelity() },
          });
        }
      }
    },
    onGesture: (gesture) => handleTouch(gesture),
  });

  const pointer = (event) => toRigSpace(svg, event);

  svg.addEventListener('pointerdown', (event) => {
    svg.setPointerCapture?.(event.pointerId);
    const { x, y } = pointer(event);
    state.touch.begin({ x, y, t: performance.now(), pressure: event.pressure });
  });

  svg.addEventListener('pointermove', (event) => {
    const { x, y } = pointer(event);
    state.touch.move({ x, y, t: performance.now() });
  });

  const release = (event) => {
    try { svg.releasePointerCapture?.(event.pointerId); } catch { /* not captured */ }
    state.touch.end({ t: performance.now() });
  };
  svg.addEventListener('pointerup', release);
  svg.addEventListener('pointercancel', () => state.touch.cancel());
  svg.addEventListener('pointerleave', (event) => {
    if (state.touch.active) release(event);
    state.animator.lookAt(null);
  });

  // Keyboard equivalents, so the whole feature is not mouse-only.
  svg.setAttribute('tabindex', '0');
  svg.addEventListener('keydown', (event) => {
    const map = {
      p: { type: 'stroke', region: 'head' },
      s: { type: 'stroke', region: 'head' },
      t: { type: 'tap', region: 'head' },
      n: { type: 'tap', region: 'nose' },
      e: { type: 'tap', region: 'ear_l' },
      b: { type: 'tap', region: 'belly' },
    };
    const gesture = map[event.key.toLowerCase()];
    if (!gesture) return;
    event.preventDefault();
    if (gesture.type === 'stroke') {
      state.touch.strokeCredit = Math.min(12, state.touch.strokeCredit + 1.5);
      state.purr.setCredit(state.touch.strokeCredit);
      state.animator.gesture('purr_shiver');
    }
    handleTouch(gesture);
  });

  // Stroke credit decays, so the purr trails off when hands come away.
  setInterval(() => {
    if (!state.touch) return;
    const credit = state.touch.decay(0.4);
    if (credit > 0 || state.purr.credit > 0) state.purr.setCredit(credit);
  }, 400);
}

/** @param {{type:string, region:string|null}} gesture */
function handleTouch(gesture) {
  if (!state.touchOn) return;
  markTouched();
  const reaction = resolveReaction(gesture, {
    riskTier: state.director?.riskTier ?? 0,
    lastFired: state.reactionCooldowns,
    now: Date.now(),
  });

  const level = state.agitation.record(gesture);
  if (state.agitation.shouldNotice() && !state.busy && (state.director?.riskTier ?? 0) === 0) {
    const line = AGITATION_LINES[Math.floor(Math.random() * AGITATION_LINES.length)];
    const why = `Handling has become rough and fast (agitation ${level.toFixed(2)}). Noticed with curiosity rather than correction — the way a therapist notices a leg that will not stop moving.`;
    state.transcript.add('tom', line, { why: whyInline() ? why : null });
    renderWhy($('why-content'), {
      kind: 'reflect', text: line,
      meta: { why, modality: 'Behavioural observation', phase: state.director.phase, fidelity: state.director.fidelity() },
    });
    state.animator.gesture('tilt');
  }

  if (!reaction) return;
  state.reactionCooldowns[reaction.id] = Date.now();

  state.animator.gesture(reaction.gesture);
  if (reaction.emotion && !state.animator.isSpeaking) {
    state.animator.setPose(speakingPose(reaction.emotion, {
      userValence: state.lastUnderstanding?.affect?.valence ?? 0,
    }));
    // Settle back into listening once the reaction has played.
    clearTimeout(state.reactionSettle);
    state.reactionSettle = setTimeout(() => {
      if (!state.animator.isSpeaking) {
        state.animator.setPose(listeningPose({
          userArousal: state.lastUnderstanding?.affect?.arousal ?? 0.4,
          engagement: 0.65,
        }));
      }
    }, 2200);
  }

  if (state.soundsOn) {
    if (reaction.sound === 'sneeze') playSneeze(state.purr.ctx ?? undefined);
    else if (reaction.sound) playReaction(reaction.sound, state.purr.ctx ?? undefined);
  }

  const line = pickLine(reaction);
  if (line && !state.busy) {
    state.transcript.add('tom', line, {
      why: whyInline() ? `Reaction to being touched (${reaction.id}).` : null,
    });
  }
}

/* ------------------------------------------------------------------ *
 * Microphone
 * ------------------------------------------------------------------ */

async function startMic() {
  if (!sttSupported()) {
    // Firefox and others. Fail toward typing rather than toward nothing.
    $('talk').disabled = true;
    $('talk-label').textContent = 'Type instead';
    $('hint').textContent = 'This browser cannot listen. Tap the keyboard to type — Tom does not treat it any differently.';
    openTyping();
    return;
  }

  try {
    state.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    $('hint').textContent = 'The microphone was not available. You can type instead.';
    openTyping();
    return;
  }

  state.prosody.reset();
  state.detachProsody = attachToStream(state.micStream, state.prosody);

  state.listener = new Listener({
    lang: navigator.language,
    onInterim: (text) => showYouSaid(text),
    onFinal: (text) => {
      const summary = state.prosody.summarise({ wordCount: text.split(/\s+/).length });
      state.lastProsody = { summary, at: Date.now() };
      state.prosody.reset();
      handleUserTurn(text);
    },
    onError: (err) => {
      $('hint').textContent = err.message;
      state.transcript.add('system', err.message);
      if (err.fatal) { stopMic(); openTyping(); }
    },
  });

  if (state.listener.start()) {
    state.micOn = true;
    $('talk').setAttribute('aria-pressed', 'true');
    $('talk-label').textContent = 'Listening…';
    $('hint').textContent = state.holdToTalk ? 'Let go when you have finished.' : 'Tap again when you have finished.';
  }
}

function stopMic() {
  state.micOn = false;
  $('talk').setAttribute('aria-pressed', 'false');
  $('hint').textContent = state.defaultHint;
  setStatus(state.status ?? 'listening');

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

/** Mark that he has been touched, so the how-to-use hint can recede. */
function markTouched() {
  $('app').dataset.touched = 'true';
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

  // During a risk conversation the shortcuts have to fit the conversation.
  // "Say more about that" is a fine prompt on a Tuesday and an absurd one when
  // somebody has just told you they have been thinking about ending their life.
  if ((state.director?.riskTier ?? 0) >= TIER.PASSIVE_IDEATION) {
    options = move.expects === 'yesno' || /\?\s*$/.test(move.text)
      ? [{ label: 'Yes', send: 'yes' }, { label: 'No', send: 'no' },
         { label: 'I am not sure', send: 'I am not sure' }]
      : [{ label: 'Show me the numbers', action: () => openPanel('crisis-panel') }];
  } else if (move.expects === 'yesno') {
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
  $('opt-hold').checked = Boolean(settings.tapToTalk);
  $('opt-captions').checked = settings.captions !== false;
  state.holdToTalk = !settings.tapToTalk;
  state.captionsOn = settings.captions !== false;
  $('opt-sounds').checked = settings.sounds !== false;
  $('opt-touch').checked = settings.touch !== false;
  state.soundsOn = settings.sounds !== false;
  state.touchOn = settings.touch !== false;
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

/** Slide the typing sheet up and put the caret in it. */
function openTyping() {
  $('typing-sheet').hidden = false;
  $('toggle-typing').setAttribute('aria-expanded', 'true');
  $('say').focus();
}

function closeTyping() {
  $('typing-sheet').hidden = true;
  $('toggle-typing').setAttribute('aria-expanded', 'false');
}

function openPanel(id) {
  for (const other of ['why-panel', 'settings-panel', 'log-panel', 'crisis-panel']) {
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
  const anyOpen = ['why-panel', 'settings-panel', 'log-panel', 'crisis-panel'].some((p) => !$(p).hidden);
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

  // ---- the talk button ----
  //
  // Hold-to-talk by default, because it makes "the microphone is on" a physical
  // fact you can feel rather than a state you have to remember. Tap-to-toggle is
  // a setting, for anyone who cannot hold a button down.
  const talk = $('talk');
  let holdStarted = 0;

  const beginTalk = (event) => {
    if (talk.disabled) return;
    event?.preventDefault();
    if (!state.holdToTalk) {
      if (state.micOn) stopMic(); else startMic();
      return;
    }
    holdStarted = Date.now();
    startMic();
  };

  const endTalk = (event) => {
    if (!state.holdToTalk || !state.micOn) return;
    event?.preventDefault();
    // A stray click should not immediately cut a recording that just started.
    const held = Date.now() - holdStarted;
    if (held < 320) { setTimeout(() => { if (state.micOn) stopMic(); }, 320 - held); return; }
    stopMic();
  };

  talk.addEventListener('pointerdown', beginTalk);
  talk.addEventListener('pointerup', endTalk);
  talk.addEventListener('pointercancel', endTalk);
  talk.addEventListener('pointerleave', endTalk);
  // Keyboard: space or enter holds while pressed.
  talk.addEventListener('keydown', (event) => {
    if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) beginTalk(event);
  });
  talk.addEventListener('keyup', (event) => {
    if (event.key === ' ' || event.key === 'Enter') endTalk(event);
  });

  // ---- typing, one button away ----
  $('toggle-typing').addEventListener('click', () => {
    if ($('typing-sheet').hidden) openTyping(); else closeTyping();
  });
  $('close-typing').addEventListener('click', closeTyping);

  // ---- the record of what was said ----
  $('toggle-log').addEventListener('click', () => togglePanel('log-panel'));
  $('export-transcript').addEventListener('click', () => {
    download(`tom-conversation-${new Date().toISOString().slice(0, 10)}.txt`,
      state.transcript.toText(), 'text/plain');
  });

  $('toggle-voice').addEventListener('click', () => {
    state.voiceOn = !state.voiceOn;
    $('toggle-voice').setAttribute('aria-pressed', String(state.voiceOn));
    if (!state.voiceOn) { state.speaker?.cancel(); state.animator.stopSpeaking(); }
    persistSettings({ voiceOut: state.voiceOn });
  });

  $('toggle-why').addEventListener('click', () => {
    togglePanel('why-panel');
    if (state.lastMove) showCaption(state.lastMove);
  });
  $('toggle-settings').addEventListener('click', () => togglePanel('settings-panel'));

  for (const btn of document.querySelectorAll('[data-close]')) {
    btn.addEventListener('click', () => closePanel(btn.dataset.close));
  }
  $('scrim').addEventListener('click', () => {
    for (const id of ['why-panel', 'settings-panel', 'log-panel', 'crisis-panel']) closePanel(id);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    for (const id of ['why-panel', 'settings-panel', 'log-panel', 'crisis-panel']) closePanel(id);
    closeTyping();
  });

  $('crisis-banner').addEventListener('click', () => openPanel('crisis-panel'));

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
    $('talk').disabled = !e.target.checked;
    if (!e.target.checked && state.micOn) stopMic();
    persistSettings({ voiceIn: e.target.checked });
  });
  $('opt-rate').addEventListener('change', (e) => persistSettings({ rate: Number(e.target.value) }));

  $('opt-hold').addEventListener('change', (e) => {
    state.holdToTalk = !e.target.checked;
    if (state.micOn) stopMic();
    setStatus('listening');
    persistSettings({ tapToTalk: e.target.checked });
  });
  $('opt-captions').addEventListener('change', (e) => {
    state.captionsOn = e.target.checked;
    if (!e.target.checked) { $('caption').textContent = ''; $('caption-why').hidden = true; $('caption-resources').hidden = true; }
    else if (state.lastMove) showCaption(state.lastMove);
    persistSettings({ captions: e.target.checked });
  });

  $('opt-sounds').addEventListener('change', (e) => {
    state.soundsOn = e.target.checked;
    if (!e.target.checked) state.purr?.stop();
    persistSettings({ sounds: e.target.checked });
  });
  $('opt-touch').addEventListener('change', (e) => {
    state.touchOn = e.target.checked;
    const svg = document.querySelector('#tom-mount svg');
    if (svg) svg.style.pointerEvents = e.target.checked ? '' : 'none';
    $('hint').hidden = !e.target.checked;
    if (!e.target.checked) { state.purr?.stop(); state.animator.lookAt(null); }
    persistSettings({ touch: e.target.checked });
  });

  $('region-setting').addEventListener('change', (e) => {
    state.region = e.target.value;
    state.director.region = state.region;
    persistSettings({ region: state.region });
    renderCrisisLines($('settings-crisis-lines'));
    renderCrisisLines($('crisis-lines'));
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
