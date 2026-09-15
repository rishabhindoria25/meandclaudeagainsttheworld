/**
 * Touch: the thing that made the original famous.
 *
 * The talking-cat toys of the 2010s were not popular because they talked. They
 * were popular because you could *poke* them. Tapping an ear and watching it
 * flick, stroking a head and hearing a purr start — that loop of touch and
 * instant reaction is what made a drawing feel like a creature, and it is the
 * reason people opened the app again.
 *
 * It also turns out to be the most clinically defensible thing in this project.
 * Repetitive, rhythmic self-soothing touch is a recognised distress-tolerance
 * behaviour; contact with an animal lowers physiological arousal; and having
 * something to do with your hands while saying a difficult thing out loud is a
 * technique therapists use deliberately, from fidget objects to walking
 * sessions. Somebody who cannot yet say the sentence can often stroke the cat
 * while they work up to it.
 *
 * So: reactions are instant and playful, stroking is wired to a real paced
 * breathing exercise, and none of it is ever required for anything.
 */

/**
 * Hit regions in the rig's own coordinate space (viewBox 0 0 420 470).
 *
 * Ordered by priority: the first match wins, so small features sit above the
 * large areas that contain them.
 */
export const HIT_REGIONS = [
  { id: 'nose', shape: 'circle', x: 210, y: 231, r: 20 },
  { id: 'eye_l', shape: 'ellipse', x: 163, y: 176, rx: 33, ry: 36 },
  { id: 'eye_r', shape: 'ellipse', x: 257, y: 176, rx: 33, ry: 36 },
  { id: 'ear_l', shape: 'circle', x: 141, y: 74, r: 46 },
  { id: 'ear_r', shape: 'circle', x: 279, y: 74, r: 46 },
  { id: 'muzzle', shape: 'ellipse', x: 210, y: 252, rx: 62, ry: 34 },
  { id: 'cheek_l', shape: 'circle', x: 136, y: 214, r: 36 },
  { id: 'cheek_r', shape: 'circle', x: 284, y: 214, r: 36 },
  // The crown is the petting zone, and is deliberately generous.
  { id: 'head', shape: 'ellipse', x: 210, y: 140, rx: 112, ry: 74 },
  { id: 'tail', shape: 'circle', x: 362, y: 360, r: 46 },
  { id: 'paw_l', shape: 'circle', x: 176, y: 422, r: 30 },
  { id: 'paw_r', shape: 'circle', x: 244, y: 422, r: 30 },
  { id: 'belly', shape: 'ellipse', x: 210, y: 368, rx: 74, ry: 68 },
  { id: 'body', shape: 'ellipse', x: 210, y: 350, rx: 112, ry: 100 },
];

/**
 * Which region contains a point, or null.
 * @param {number} x @param {number} y
 * @returns {string|null}
 */
export function hitTest(x, y) {
  for (const region of HIT_REGIONS) {
    if (region.shape === 'circle') {
      const dx = x - region.x;
      const dy = y - region.y;
      if (dx * dx + dy * dy <= region.r * region.r) return region.id;
    } else {
      const dx = (x - region.x) / region.rx;
      const dy = (y - region.y) / region.ry;
      if (dx * dx + dy * dy <= 1) return region.id;
    }
  }
  return null;
}

/** Regions that count as strokeable. Stroking a nose is a poke; stroking a back is a stroke. */
export const STROKEABLE = new Set(['head', 'body', 'belly', 'cheek_l', 'cheek_r']);

export const GESTURE = Object.freeze({
  TAP: 'tap',
  POKE: 'poke',       // a fast, hard tap
  STROKE: 'stroke',   // sustained movement across a strokeable region
  HOLD: 'hold',       // resting a hand on him
  DRAG: 'drag',       // movement that is not a stroke (tail pull, paw tug)
});

const TAP_MAX_MS = 260;
const TAP_MAX_TRAVEL = 12;
const HOLD_MIN_MS = 460;
const STROKE_MIN_TRAVEL = 46;
/** SVG units of travel that count as one stroke. */
export const STROKE_UNIT = 70;

/**
 * Classifies pointer activity into the small vocabulary above.
 *
 * Deliberately forgiving. This is a toy being operated by someone who may be
 * upset, on a phone, one-handed. A gesture recogniser that demands precision
 * here would be its own small cruelty.
 */
export class GestureRecogniser {
  /**
   * @param {{onStroke?:(info:object)=>void, onGesture?:(info:object)=>void, onMove?:(info:object)=>void}} handlers
   */
  constructor(handlers = {}) {
    this.handlers = handlers;
    this.active = null;
    /** Rolling count of strokes, decayed by the caller over time. */
    this.strokeCredit = 0;
    this.holdTimer = null;
  }

  /** @param {{x:number, y:number, t:number, pressure?:number}} point */
  begin(point) {
    const region = hitTest(point.x, point.y);
    this.active = {
      region,
      startX: point.x, startY: point.y,
      lastX: point.x, lastY: point.y,
      startT: point.t,
      travel: 0,
      sinceStroke: 0,
      reversals: 0,
      lastDx: 0,
      strokes: 0,
      heldFired: false,
      pressure: point.pressure ?? 0.5,
    };

    // A hand simply resting on him is its own gesture, and needs no movement.
    this.holdTimer = setTimeout(() => {
      if (!this.active || this.active.heldFired || this.active.travel > TAP_MAX_TRAVEL) return;
      this.active.heldFired = true;
      this.handlers.onGesture?.({ type: GESTURE.HOLD, region: this.active.region, strokes: 0 });
    }, HOLD_MIN_MS);

    return region;
  }

  /** @param {{x:number, y:number, t:number}} point */
  move(point) {
    // Track the pointer for gaze-following even when nothing is pressed.
    this.handlers.onMove?.({ x: point.x, y: point.y, pressed: Boolean(this.active) });
    if (!this.active) return;

    const a = this.active;
    const dx = point.x - a.lastX;
    const dy = point.y - a.lastY;
    const step = Math.hypot(dx, dy);
    a.travel += step;
    a.sinceStroke += step;
    a.lastX = point.x;
    a.lastY = point.y;

    // Direction reversals are what separate stroking from dragging: a stroke
    // goes back and forth, a tail pull goes one way.
    if (dx !== 0 && a.lastDx !== 0 && Math.sign(dx) !== Math.sign(a.lastDx) && Math.abs(dx) > 2) {
      a.reversals += 1;
    }
    if (Math.abs(dx) > 2) a.lastDx = dx;

    // Re-home the region as the hand travels, so a stroke across the head stays a stroke.
    const region = hitTest(point.x, point.y);
    if (region && STROKEABLE.has(region)) a.region = region;

    if (a.sinceStroke >= STROKE_UNIT && a.region && STROKEABLE.has(a.region)) {
      a.sinceStroke = 0;
      a.strokes += 1;
      this.strokeCredit = Math.min(12, this.strokeCredit + 1);
      this.handlers.onStroke?.({
        region: a.region,
        strokes: a.strokes,
        credit: this.strokeCredit,
        x: point.x, y: point.y,
      });
    }
  }

  /** @param {{t:number}} point */
  end(point) {
    if (this.holdTimer) { clearTimeout(this.holdTimer); this.holdTimer = null; }
    const a = this.active;
    this.active = null;
    if (!a) return null;

    const duration = point.t - a.startT;
    let type;

    if (a.strokes > 0) {
      type = GESTURE.STROKE;
    } else if (a.travel >= STROKE_MIN_TRAVEL) {
      type = a.reversals >= 2 && STROKEABLE.has(a.region) ? GESTURE.STROKE : GESTURE.DRAG;
    } else if (duration >= HOLD_MIN_MS) {
      // Already reported on the timer; do not double-fire.
      return a.heldFired ? null : { type: GESTURE.HOLD, region: a.region, strokes: 0 };
    } else if (duration <= TAP_MAX_MS && a.travel <= TAP_MAX_TRAVEL) {
      // A quick, decisive tap is a poke; a slower one is a tap.
      type = duration < 130 ? GESTURE.POKE : GESTURE.TAP;
    } else {
      type = GESTURE.TAP;
    }

    const info = { type, region: a.region, strokes: a.strokes, duration, travel: Math.round(a.travel) };
    this.handlers.onGesture?.(info);
    return info;
  }

  cancel() {
    if (this.holdTimer) { clearTimeout(this.holdTimer); this.holdTimer = null; }
    this.active = null;
  }

  /** Stroke credit decays, so the purr fades when hands come off. */
  decay(dt = 1) {
    this.strokeCredit = Math.max(0, this.strokeCredit - 0.55 * dt);
    return this.strokeCredit;
  }
}

/**
 * Convert a DOM pointer event into the rig's coordinate space.
 * @param {SVGSVGElement} svg
 * @param {{clientX:number, clientY:number}} event
 */
export function toRigSpace(svg, event) {
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox?.baseVal ?? { width: 420, height: 470, x: 0, y: 0 };
  // preserveAspectRatio is xMidYMax meet, so work out the letterboxing.
  const scale = Math.min(rect.width / viewBox.width, rect.height / viewBox.height);
  const drawnWidth = viewBox.width * scale;
  const drawnHeight = viewBox.height * scale;
  const offsetX = rect.left + (rect.width - drawnWidth) / 2;
  const offsetY = rect.top + (rect.height - drawnHeight);     // yMax: bottom-aligned
  return {
    x: (event.clientX - offsetX) / scale + viewBox.x,
    y: (event.clientY - offsetY) / scale + viewBox.y,
  };
}

/**
 * Agitation: how hard and how fast he is being handled.
 *
 * Not used to scold anybody. Somebody jabbing at a screen forty times is usually
 * either playing or wound up, and the second case is worth noticing gently —
 * the same way a therapist notices a leg that will not stop moving.
 */
export class AgitationMeter {
  constructor() {
    this.events = [];
    this.noticed = false;
  }

  /** @param {{type:string}} gesture */
  record(gesture, now = Date.now()) {
    const weight = gesture.type === GESTURE.POKE ? 1
      : gesture.type === GESTURE.DRAG ? 0.7
        : gesture.type === GESTURE.TAP ? 0.35
          : 0; // strokes and holds are soothing, not agitating
    if (weight === 0) {
      // Soothing contact actively discharges the meter.
      this.events = this.events.slice(Math.ceil(this.events.length / 2));
      return this.level(now);
    }
    this.events.push({ at: now, weight });
    return this.level(now);
  }

  /** Weighted rate over the last 20 seconds, 0..1. */
  level(now = Date.now()) {
    const window = 20000;
    this.events = this.events.filter((e) => now - e.at < window);
    const load = this.events.reduce((s, e) => s + e.weight, 0);
    return Math.min(1, load / 14);
  }

  /** True once, when handling first becomes notably rough. */
  shouldNotice(now = Date.now()) {
    if (this.noticed) return false;
    if (this.level(now) < 0.75) return false;
    this.noticed = true;
    return true;
  }
}
