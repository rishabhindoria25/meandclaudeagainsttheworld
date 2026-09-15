/**
 * The animation loop.
 *
 * Three layers composite every frame:
 *
 *   1. **Pose** — the emotional target, reached through a critically damped
 *      spring rather than a linear tween, so expressions arrive with weight and
 *      never overshoot into a wobble.
 *   2. **Idle life** — breathing, blinking, micro-saccades, ear twitches, weight
 *      shifts. This layer is the whole reason a drawing reads as alive. A
 *      character that holds perfectly still between utterances looks switched
 *      off, and an assistant that looks switched off is one people stop talking to.
 *   3. **Speech** — viseme-driven mouth shapes, which override the pose's mouth
 *      parameters while Tom is talking.
 *
 * Blink timing is drawn from an exponential distribution around a base interval
 * rather than a fixed period, because regular blinking is one of the strongest
 * "this is a machine" cues there is. Real blinks also cluster, so the scheduler
 * occasionally fires a double.
 *
 * The whole loop degrades to a static, legible character under
 * `prefers-reduced-motion`, and pauses entirely when the tab is hidden.
 */

import { applyPose } from './rig.js';
import { NEUTRAL, clampPose, blend, GESTURES } from './expressions.js';
import { sampleViseme } from './visemes.js';

/** Per-parameter spring stiffness. Faster for the eyes, slower for posture. */
const STIFFNESS = {
  default: 9,
  eyeOpen: 26, squint: 16, pupilScale: 7,
  gazeX: 20, gazeY: 20,
  mouthOpen: 30, mouthWidth: 26, mouthRound: 26, mouthCurve: 11, teeth: 22, tongue: 22,
  browInnerRaise: 12, browOuterRaise: 12, browFurrow: 13,
  earRotate: 13, earDroop: 8,
  headTilt: 7, headNod: 8, headTurn: 7, bodyLean: 5,
  breathDepth: 3, breathRate: 3, tailSway: 3, blush: 4, whiskerDroop: 6,
};

const MOUTH_KEYS = ['mouthOpen', 'mouthWidth', 'mouthRound', 'teeth', 'tongue'];

export class Animator {
  /**
   * @param {Record<string, SVGElement>} parts
   * @param {{reducedMotion?: boolean}} [opts]
   */
  constructor(parts, opts = {}) {
    this.parts = parts;
    this.current = { ...NEUTRAL };
    this.target = { ...NEUTRAL };
    this.velocity = {};

    this.breathPhase = 0;
    this.swayPhase = 0;
    this.time = 0;
    this.running = false;
    this.lastFrame = 0;

    this.reducedMotion = opts.reducedMotion ?? prefersReducedMotion();

    // Blinking
    this.nextBlink = 1200;
    this.blinkT = -1;
    this.blinkDuration = 135;
    this.pendingDoubleBlink = false;

    // Gaze
    this.nextSaccade = 900;
    this.saccade = { x: 0, y: 0 };

    // Ear twitch
    this.nextTwitch = 5000;
    this.twitchT = -1;
    this.twitchSide = 'l';

    /** @type {{timeline:object, startedAt:number, rate:number}|null} */
    this.speech = null;
    /** @type {Array<{name:string, startedAt:number}>} */
    this.gestures = [];

    this._frame = this._frame.bind(this);
    this._onVisibility = () => { if (document.hidden) this.pause(); else this.start(); };
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastFrame = now();
    document.addEventListener('visibilitychange', this._onVisibility);
    requestAnimationFrame(this._frame);
  }

  pause() {
    this.running = false;
  }

  destroy() {
    this.pause();
    document.removeEventListener('visibilitychange', this._onVisibility);
  }

  /**
   * Set the emotional target. Springs carry the character there.
   * @param {Record<string, number>} pose
   */
  setPose(pose) {
    this.target = clampPose({ ...NEUTRAL, ...pose });
  }

  /** Play a one-shot postural gesture over the top of the current pose. */
  gesture(name) {
    if (!GESTURES[name]) return;
    this.gestures.push({ name, startedAt: this.time });
  }

  /**
   * Begin lip sync against a viseme timeline.
   * @param {object} timeline from textToVisemes
   */
  speak(timeline) {
    this.speech = { timeline, startedAt: this.time, rate: 1 };
  }

  /** Stop lip sync and close the mouth. */
  stopSpeaking() {
    this.speech = null;
  }

  get isSpeaking() {
    return Boolean(this.speech);
  }

  /** Re-anchor speech timing when the synthesiser reports a real word boundary. */
  syncWord(elapsedMs) {
    if (!this.speech) return;
    const drift = (this.time - this.speech.startedAt) - elapsedMs;
    if (Math.abs(drift) > 90) this.speech.startedAt = this.time - elapsedMs;
  }

  _frame(timestamp) {
    if (!this.running) return;
    const t = timestamp ?? now();
    // Clamp dt so a backgrounded tab does not resume with one enormous step.
    const dt = Math.min(0.05, Math.max(0.001, (t - this.lastFrame) / 1000));
    this.lastFrame = t;
    this.time += dt * 1000;

    this._integrate(dt);
    const pose = this._composite(dt);
    applyPose(this.parts, pose, { breathPhase: this.breathPhase, swayPhase: this.swayPhase, time: this.time });

    requestAnimationFrame(this._frame);
  }

  /** Critically damped spring integration toward the target pose. */
  _integrate(dt) {
    for (const key of Object.keys(this.target)) {
      const target = this.target[key];
      const current = this.current[key] ?? target;
      if (typeof target !== 'number') continue;

      if (this.reducedMotion) { this.current[key] = target; continue; }

      const k = STIFFNESS[key] ?? STIFFNESS.default;
      const damping = 2 * Math.sqrt(k); // critical damping: arrives without overshoot
      const v = this.velocity[key] ?? 0;
      const accel = (target - current) * k - v * damping;
      const nv = v + accel * dt;
      this.velocity[key] = nv;
      this.current[key] = current + nv * dt;
    }
  }

  /** Layer idle life, gestures and speech over the sprung pose. */
  _composite(dt) {
    const pose = { ...this.current };

    if (this.reducedMotion) {
      // Still, legible, and correct: expression without motion.
      this.breathPhase = 0;
      this.swayPhase = 0;
      if (this.speech) Object.assign(pose, this._speechMouth());
      return clampPose(pose);
    }

    // --- breathing ---
    const rate = pose.breathRate ?? 1;
    this.breathPhase += dt * 1.55 * rate;
    this.swayPhase += dt * 0.85 * Math.max(0.2, pose.tailSway ?? 1);

    // --- blinking ---
    this.nextBlink -= dt * 1000;
    if (this.blinkT >= 0) {
      this.blinkT += dt * 1000;
      const k = this.blinkT / this.blinkDuration;
      if (k >= 1) {
        this.blinkT = -1;
        if (this.pendingDoubleBlink) { this.pendingDoubleBlink = false; this.nextBlink = 90; }
      } else {
        // Down fast, up slower, as a real lid moves.
        const shape = k < 0.38 ? k / 0.38 : 1 - (k - 0.38) / 0.62;
        pose.eyeOpen = (pose.eyeOpen ?? 1) * (1 - shape * 0.97);
      }
    } else if (this.nextBlink <= 0) {
      this.blinkT = 0;
      // Arousal raises blink rate; low, flat states slow it right down.
      const arousalFactor = 1 + ((pose.breathRate ?? 1) - 1) * 0.5;
      this.blinkDuration = 110 + Math.random() * 70;
      this.nextBlink = exponential(3600 / arousalFactor) + 900;
      this.pendingDoubleBlink = Math.random() < 0.22;
    }

    // --- micro-saccades ---
    this.nextSaccade -= dt * 1000;
    if (this.nextSaccade <= 0) {
      // Small, frequent shifts; larger ones occasionally, as if a thought moved.
      const big = Math.random() < 0.18;
      this.saccade = {
        x: (Math.random() * 2 - 1) * (big ? 0.42 : 0.14),
        y: (Math.random() * 2 - 1) * (big ? 0.26 : 0.09),
      };
      this.nextSaccade = exponential(big ? 2600 : 1100) + 320;
    }
    pose.gazeX = (pose.gazeX ?? 0) + this.saccade.x;
    pose.gazeY = (pose.gazeY ?? 0) + this.saccade.y;

    // --- ear twitch: a small involuntary flick, rare enough to stay charming ---
    this.nextTwitch -= dt * 1000;
    if (this.twitchT >= 0) {
      this.twitchT += dt * 1000;
      const k = this.twitchT / 260;
      if (k >= 1) this.twitchT = -1;
      else {
        const amount = Math.sin(k * Math.PI) * 0.35;
        if (this.twitchSide === 'l') pose.earRotate = (pose.earRotate ?? 0) + amount;
        else pose.earRotate = (pose.earRotate ?? 0) - amount;
      }
    } else if (this.nextTwitch <= 0) {
      this.twitchT = 0;
      this.twitchSide = Math.random() < 0.5 ? 'l' : 'r';
      this.nextTwitch = exponential(9000) + 4000;
    }

    // --- gestures ---
    this.gestures = this.gestures.filter((g) => {
      const def = GESTURES[g.name];
      const k = (this.time - g.startedAt) / def.duration;
      if (k >= 1) return false;
      def.apply(pose, k);
      return true;
    });

    // --- speech overrides the mouth ---
    if (this.speech) Object.assign(pose, this._speechMouth());

    return clampPose(pose);
  }

  _speechMouth() {
    const elapsed = this.time - this.speech.startedAt;
    if (elapsed > this.speech.timeline.duration + 160) {
      this.speech = null;
      return {};
    }
    const shape = sampleViseme(this.speech.timeline, elapsed);
    const out = {};
    for (const key of MOUTH_KEYS) {
      const src = key.replace('mouth', '').toLowerCase();
      out[key] = key.startsWith('mouth') ? shape[src] : shape[key];
    }
    // Speech shouldn't erase the emotional curve of the mouth, only the opening.
    out.mouthCurve = (this.current.mouthCurve ?? 0) * 0.65;
    return out;
  }
}

function prefersReducedMotion() {
  try {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function now() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/** Exponentially distributed interval with the given mean, in milliseconds. */
function exponential(mean) {
  return -Math.log(1 - Math.random()) * mean;
}

export { exponential };
