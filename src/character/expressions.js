/**
 * Facial expression and posture for the character.
 *
 * Poses are described as a vector of independent muscle-like parameters rather
 * than as a set of fixed faces, so expressions can be blended, scaled by
 * intensity, and layered with speech and idle motion. The parameter choices
 * follow the Facial Action Coding System where it maps sensibly onto a cat:
 * the inner brow raiser (AU1) that makes sadness legible, the brow lowerer (AU4)
 * of anger, the upper lid raiser (AU5) of fear, the cheek raiser (AU6) that
 * separates a real smile from a polite one.
 *
 * Two deliberate restraints:
 *
 *  - **Tom mirrors at reduced amplitude.** Affective mirroring builds rapport,
 *    but matching someone's distress at full intensity reads as performance, and
 *    a listener visibly more upset than the speaker makes the speaker manage the
 *    listener. Mirroring is capped well below the user's own intensity.
 *  - **Tom never performs happiness at someone's pain.** A cheerful character
 *    receiving a disclosure is the uncanny failure mode of animated assistants,
 *    so positive expressions are gated on positive context.
 */

/** The neutral pose. Every expression is expressed as a delta from this. */
export const NEUTRAL = Object.freeze({
  browInnerRaise: 0,   // AU1 — the sadness brow
  browOuterRaise: 0,   // AU2
  browFurrow: 0,       // AU4
  eyeOpen: 0.92,       // 0 closed .. 1.25 wide (AU5 / AU43)
  squint: 0,           // AU6 / AU7
  pupilScale: 1,
  gazeX: 0,
  gazeY: 0,
  mouthOpen: 0.05,
  mouthWidth: 0.5,
  mouthRound: 0.1,
  mouthCurve: 0.12,    // AU12 smile .. AU15 frown
  teeth: 0,
  tongue: 0,
  earRotate: 0,        // negative = back/flattened, positive = forward/alert
  earDroop: 0,
  headTilt: 0,         // degrees, roll
  headNod: 0,          // positive = chin down
  headTurn: 0,
  bodyLean: 0,         // positive = toward the viewer
  breathDepth: 1,
  breathRate: 1,
  tailSway: 1,
  blush: 0,
  whiskerDroop: 0,
});

/**
 * Expression targets per emotion family, as deltas from neutral at full
 * intensity. The engine scales these down before applying them.
 */
export const EXPRESSIONS = {
  sadness: {
    browInnerRaise: 0.85, browFurrow: 0.2, eyeOpen: -0.2, mouthCurve: -0.7,
    earDroop: 0.75, headNod: 0.28, gazeY: 0.22, tailSway: -0.6, whiskerDroop: 0.6, breathRate: -0.2,
  },
  grief: {
    browInnerRaise: 0.95, browFurrow: 0.25, eyeOpen: -0.28, mouthCurve: -0.75,
    earDroop: 0.9, headNod: 0.36, gazeY: 0.3, tailSway: -0.75, whiskerDroop: 0.75, breathRate: -0.3, breathDepth: 0.25,
  },
  anxiety: {
    browInnerRaise: 0.7, browOuterRaise: 0.6, browFurrow: 0.35, eyeOpen: 0.3, pupilScale: 0.28,
    mouthOpen: 0.16, mouthWidth: 0.3, mouthCurve: -0.25, earRotate: 0.5,
    breathRate: 0.65, breathDepth: -0.25, tailSway: 1.1, bodyLean: -0.15,
  },
  overwhelm: {
    browInnerRaise: 0.75, browOuterRaise: 0.35, browFurrow: 0.5, eyeOpen: 0.15,
    mouthOpen: 0.2, mouthCurve: -0.5, earDroop: 0.45, earRotate: -0.2,
    breathRate: 0.5, breathDepth: -0.2, headNod: 0.15,
  },
  anger: {
    browFurrow: 0.95, browOuterRaise: -0.35, squint: 0.55, eyeOpen: -0.1, pupilScale: -0.15,
    mouthOpen: 0.12, mouthWidth: -0.18, mouthCurve: -0.5, earRotate: -0.85,
    breathRate: 0.45, bodyLean: 0.2, tailSway: 1.4,
  },
  shame: {
    browInnerRaise: 0.55, eyeOpen: -0.3, gazeX: -0.55, gazeY: 0.45, mouthCurve: -0.35,
    earDroop: 0.7, earRotate: -0.4, headNod: 0.4, headTurn: -0.25, blush: 0.55, bodyLean: -0.25,
  },
  loneliness: {
    browInnerRaise: 0.6, eyeOpen: -0.15, gazeX: 0.4, gazeY: 0.15, mouthCurve: -0.45,
    earDroop: 0.55, tailSway: -0.5, bodyLean: -0.2,
  },
  hopelessness: {
    browInnerRaise: 0.7, eyeOpen: -0.35, gazeY: 0.35, mouthCurve: -0.6,
    earDroop: 0.95, headNod: 0.45, breathRate: -0.35, breathDepth: -0.3, tailSway: -0.85, whiskerDroop: 0.8,
  },
  numbness: {
    browInnerRaise: 0.15, eyeOpen: -0.18, pupilScale: -0.12, mouthCurve: -0.12,
    earDroop: 0.35, gazeY: 0.1, breathDepth: -0.35, tailSway: -0.9, whiskerDroop: 0.3,
  },
  exhaustion: {
    browInnerRaise: 0.35, eyeOpen: -0.42, squint: 0.2, mouthCurve: -0.25,
    earDroop: 0.8, headNod: 0.3, breathRate: -0.3, breathDepth: 0.2, tailSway: -0.8,
  },
  confusion: {
    browInnerRaise: 0.3, browOuterRaise: 0.35, browFurrow: 0.4, headTilt: 9,
    mouthWidth: -0.1, mouthCurve: -0.1, earRotate: 0.25, gazeX: 0.2,
  },
  jealousy: {
    browFurrow: 0.5, squint: 0.3, mouthCurve: -0.35, gazeX: 0.35, earRotate: -0.3,
  },
  disgust: {
    browFurrow: 0.6, squint: 0.45, mouthWidth: -0.2, mouthCurve: -0.5, headTurn: -0.2,
  },
  hope: {
    browInnerRaise: 0.2, browOuterRaise: 0.3, eyeOpen: 0.1, mouthCurve: 0.45,
    earRotate: 0.55, headTilt: -3, tailSway: 0.6, bodyLean: 0.15,
  },
  joy: {
    browOuterRaise: 0.4, squint: 0.5, mouthOpen: 0.25, mouthWidth: 0.35, mouthCurve: 0.95,
    earRotate: 0.8, tailSway: 1.3, bodyLean: 0.25, teeth: 0.3,
  },
  pride: {
    browOuterRaise: 0.25, mouthCurve: 0.55, earRotate: 0.6, headNod: -0.15, bodyLean: 0.1, tailSway: 0.5,
  },
  gratitude: {
    browInnerRaise: 0.25, squint: 0.3, mouthCurve: 0.55, earRotate: 0.35, headTilt: 4,
  },
  connection: {
    browInnerRaise: 0.3, squint: 0.35, mouthCurve: 0.5, earRotate: 0.3, headTilt: 5, bodyLean: 0.2,
  },
  calm: {
    eyeOpen: -0.06, mouthCurve: 0.25, breathRate: -0.25, breathDepth: 0.15, tailSway: -0.3,
  },
};

/**
 * Postural gestures the director can call for, layered over the expression.
 * `duration` is in milliseconds; `curve` is evaluated on 0..1.
 */
export const GESTURES = {
  nod: {
    duration: 900,
    apply: (p, k) => { p.headNod += Math.sin(k * Math.PI * 2) * 0.32; },
  },
  tilt: {
    duration: 1400,
    apply: (p, k) => { p.headTilt += Math.sin(k * Math.PI) * 11; p.earRotate += Math.sin(k * Math.PI) * 0.3; },
  },
  lean_in: {
    duration: 1600,
    apply: (p, k) => {
      const e = Math.sin(k * Math.PI);
      p.bodyLean += e * 0.35; p.earRotate += e * 0.45; p.eyeOpen += e * 0.06;
    },
  },
  settle: {
    duration: 2000,
    apply: (p, k) => {
      const e = Math.sin(k * Math.PI);
      p.bodyLean -= e * 0.12; p.breathDepth += e * 0.3; p.breathRate -= e * 0.25; p.eyeOpen -= e * 0.08;
    },
  },
  alert: {
    duration: 1200,
    apply: (p, k) => {
      const e = Math.sin(k * Math.PI);
      p.earRotate += e * 0.9; p.eyeOpen += e * 0.2; p.pupilScale += e * 0.15; p.bodyLean += e * 0.2;
    },
  },
  /** Eyes close, head tips into the hand. The stroking pose. */
  lean_into: {
    duration: 2400,
    apply: (p, k) => {
      const e = Math.sin(k * Math.PI);
      p.eyeOpen -= e * 0.55;
      p.squint += e * 0.35;
      p.headTilt += e * 7;
      p.mouthCurve += e * 0.3;
      p.earRotate -= e * 0.25;   // ears relax back, the contented position
      p.bodyLean += e * 0.18;
    },
  },

  /**
   * The slow blink. Cats use it to signal that they are not a threat and do not
   * feel threatened, and it is the single most legible gesture of trust a cat
   * has. Worth more here than any amount of smiling.
   */
  slow_blink: {
    duration: 1900,
    apply: (p, k) => {
      // Close slowly, hold, open slowly.
      const shape = k < 0.4 ? k / 0.4 : k < 0.62 ? 1 : 1 - (k - 0.62) / 0.38;
      p.eyeOpen -= shape * 0.92;
      p.mouthCurve += shape * 0.18;
    },
  },

  /** A small involuntary flick, for an ear that has just been touched. */
  ear_flick: {
    duration: 420,
    apply: (p, k) => {
      const e = Math.sin(k * Math.PI * 2.5) * (1 - k);
      p.earRotate += e * 0.7;
      p.headTilt += e * 3;
    },
  },

  /** Jumped at. Fast in, slow out, as a startle actually behaves. */
  startle: {
    duration: 620,
    apply: (p, k) => {
      const e = k < 0.12 ? k / 0.12 : Math.max(0, 1 - (k - 0.12) / 0.88);
      p.eyeOpen += e * 0.3;
      p.pupilScale += e * 0.3;
      p.earRotate += e * 0.6;
      p.bodyLean -= e * 0.25;
      p.squashY = (p.squashY ?? 0) - e * 0.035;
    },
  },

  /** Wriggling away from a poked belly. */
  squirm: {
    duration: 900,
    apply: (p, k) => {
      const wobble = Math.sin(k * Math.PI * 4) * (1 - k);
      p.headTilt += wobble * 9;
      p.bodyLean += wobble * 0.22;
      p.squint += Math.sin(k * Math.PI) * 0.4;
      p.mouthCurve += Math.sin(k * Math.PI) * 0.45;
    },
  },

  /** Nose scrunch into a sneeze. */
  sneeze: {
    duration: 800,
    apply: (p, k) => {
      if (k < 0.55) {
        const build = k / 0.55;
        p.eyeOpen -= build * 0.6;
        p.browFurrow += build * 0.5;
        p.headNod -= build * 0.25;      // head tips back
      } else {
        const burst = 1 - (k - 0.55) / 0.45;
        p.headNod += burst * 0.5;       // and snaps forward
        p.mouthOpen += burst * 0.4;
        p.eyeOpen -= burst * 0.8;
        p.squashY = (p.squashY ?? 0) + burst * 0.045;
      }
    },
  },

  /** Unimpressed, after a tail pull. Looks round at you. */
  grumble: {
    duration: 1400,
    apply: (p, k) => {
      const e = Math.sin(k * Math.PI);
      p.browFurrow += e * 0.55;
      p.squint += e * 0.4;
      p.headTurn -= e * 0.3;
      p.earRotate -= e * 0.7;
      p.tailSway += e * 1.2;
      p.mouthCurve -= e * 0.25;
    },
  },

  /** A body-wide vibration, driven by the purr. */
  purr_shiver: {
    duration: 700,
    apply: (p, k) => {
      const v = Math.sin(k * Math.PI * 12) * (1 - k) * 0.012;
      p.squashY = (p.squashY ?? 0) + v;
    },
  },

  /** Pulls a paw back out of reach. */
  paw_tuck: {
    duration: 700,
    apply: (p, k) => {
      const e = Math.sin(k * Math.PI);
      p.bodyLean -= e * 0.2;
      p.headNod += e * 0.18;
      p.squint += e * 0.25;
    },
  },

  // Squash and stretch on an emphasised word: the oldest trick in animation and
  // still the one that most reliably makes a drawing feel alive.
  emphasis: {
    duration: 320,
    apply: (p, k) => {
      const e = Math.sin(k * Math.PI);
      p.squashY = (p.squashY ?? 0) + e * 0.05;
      p.headNod += e * 0.1;
    },
  },
};

/**
 * Build a pose for an emotional state.
 *
 * @param {string} family Emotion family name
 * @param {number} intensity 0..1
 * @param {{mirrorCap?: number}} [opts]
 * @returns {Record<string, number>}
 */
export function poseFor(family, intensity = 0.5, opts = {}) {
  const pose = { ...NEUTRAL };
  const target = EXPRESSIONS[family];
  if (!target) return pose;

  // Tom does not out-feel the person he is listening to.
  const cap = opts.mirrorCap ?? 0.72;
  const k = Math.max(0, Math.min(cap, intensity));

  for (const [key, delta] of Object.entries(target)) {
    pose[key] = (pose[key] ?? 0) + delta * k;
  }
  return clampPose(pose);
}

/**
 * Blend two poses.
 * @param {Record<string, number>} a
 * @param {Record<string, number>} b
 * @param {number} t 0 = a, 1 = b
 */
export function blend(a, b, t) {
  const out = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const av = a[key] ?? NEUTRAL[key] ?? 0;
    const bv = b[key] ?? NEUTRAL[key] ?? 0;
    out[key] = av + (bv - av) * t;
  }
  return out;
}

const LIMITS = {
  eyeOpen: [0, 1.3], pupilScale: [0.6, 1.5], mouthOpen: [0, 1], mouthWidth: [0.1, 1],
  mouthRound: [0, 1], mouthCurve: [-1, 1], squint: [0, 1], teeth: [0, 1], tongue: [0, 1],
  earRotate: [-1, 1], earDroop: [0, 1], gazeX: [-1, 1], gazeY: [-1, 1],
  headTilt: [-20, 20], headNod: [-0.6, 0.8], headTurn: [-0.6, 0.6], bodyLean: [-0.6, 0.6],
  breathDepth: [0.3, 2], breathRate: [0.35, 2.2], tailSway: [0, 2.5], blush: [0, 1],
  browInnerRaise: [-0.5, 1], browOuterRaise: [-0.6, 1], browFurrow: [0, 1], whiskerDroop: [0, 1],
};

/** @param {Record<string, number>} pose */
export function clampPose(pose) {
  const out = { ...pose };
  for (const [key, [lo, hi]] of Object.entries(LIMITS)) {
    if (typeof out[key] === 'number') out[key] = Math.max(lo, Math.min(hi, out[key]));
  }
  return out;
}

/**
 * The listening pose: attentive, still, and unhurried.
 *
 * This is the pose the character holds for most of a session, so it matters more
 * than any expression. It is deliberately not neutral — a face that does nothing
 * while someone speaks reads as absence, not attention.
 *
 * @param {{userArousal?: number, userValence?: number, engagement?: number}} [state]
 */
export function listeningPose(state = {}) {
  const arousal = state.userArousal ?? 0.4;
  const valence = state.userValence ?? 0;
  const engagement = state.engagement ?? 0.6;

  const pose = { ...NEUTRAL };
  pose.earRotate = 0.35 + engagement * 0.3;
  pose.headTilt = 3 + engagement * 4;
  pose.eyeOpen = 0.94 + engagement * 0.08;
  pose.bodyLean = 0.12 + engagement * 0.22;
  pose.mouthCurve = valence < -0.25 ? -0.1 : 0.16;
  pose.mouthOpen = 0.03;
  // When the person is highly activated, Tom becomes slightly stiller and slower.
  // Downregulating alongside someone is more use than matching them.
  pose.breathRate = arousal > 0.7 ? 0.7 : 1;
  pose.breathDepth = arousal > 0.7 ? 1.25 : 1;
  pose.tailSway = arousal > 0.7 ? 0.4 : 0.8;
  return clampPose(pose);
}

/**
 * Map an emotion family to a target pose, refusing to smile at distress.
 * @param {{family:string, intensity:number}} emotion
 * @param {{userValence?: number}} [context]
 */
export function speakingPose(emotion, context = {}) {
  const family = emotion?.family ?? 'calm';
  const positive = ['joy', 'hope', 'pride', 'gratitude', 'connection', 'calm'].includes(family);
  const userIsDistressed = (context.userValence ?? 0) < -0.35;

  if (positive && userIsDistressed && family !== 'calm' && family !== 'connection') {
    // Warmth is fine; cheerfulness is not.
    return poseFor('connection', Math.min(0.35, emotion?.intensity ?? 0.3));
  }
  return poseFor(family, emotion?.intensity ?? 0.4);
}
