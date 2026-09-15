/**
 * The character rig.
 *
 * Tom is drawn as a single inline SVG with named parts, animated by writing
 * transforms and path data on every frame. SVG rather than canvas because the
 * drawing stays crisp at any size, respects the user's zoom, and can carry real
 * accessibility semantics; a rig rather than a sprite sheet because the
 * expressions need to blend continuously with speech and with each other.
 *
 * The character is original artwork. It is a cat because a cat can hold a
 * listening posture — ears forward, still, unhurried — more legibly than almost
 * anything else, and because a slightly silly animal lowers the stakes of saying
 * something difficult out loud.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

export const PALETTE = {
  furLight: '#f4a259',
  fur: '#e8823b',
  furDark: '#c9662a',
  belly: '#fde3c4',
  muzzle: '#fdf0de',
  innerEar: '#f3b8a5',
  nose: '#e0736b',
  mouth: '#7d2f36',
  tongue: '#f08a8a',
  eyeWhite: '#fffdf8',
  iris: '#57a05f',
  irisDark: '#2f6b40',
  pupil: '#20201f',
  stripe: '#c9662a',
  outline: '#5b3218',
  blush: '#f2867e',
};

/** The static drawing. Parts that move carry ids and are looked up once. */
export function markup() {
  return `
<svg id="tom-svg" viewBox="0 0 420 470" xmlns="${SVG_NS}" role="img"
     aria-labelledby="tom-title tom-desc" preserveAspectRatio="xMidYMax meet">
  <title id="tom-title">Tom</title>
  <desc id="tom-desc">An animated cartoon cat who listens and responds. His expression reflects the conversation. All information is also available as text.</desc>

  <defs>
    <radialGradient id="tom-fur-grad" cx="42%" cy="32%" r="78%">
      <stop offset="0%" stop-color="${PALETTE.furLight}"/>
      <stop offset="100%" stop-color="${PALETTE.fur}"/>
    </radialGradient>
    <radialGradient id="tom-iris-grad" cx="45%" cy="38%" r="65%">
      <stop offset="0%" stop-color="#8fd18f"/>
      <stop offset="60%" stop-color="${PALETTE.iris}"/>
      <stop offset="100%" stop-color="${PALETTE.irisDark}"/>
    </radialGradient>
    <clipPath id="tom-clip-eye-l"><ellipse cx="163" cy="176" rx="31" ry="34"/></clipPath>
    <clipPath id="tom-clip-eye-r"><ellipse cx="257" cy="176" rx="31" ry="34"/></clipPath>
    <clipPath id="tom-clip-mouth"><path id="tom-mouth-clip-path" d="M 190 262 L 230 262 L 230 262 L 190 262 Z"/></clipPath>
    <filter id="tom-soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4"/>
    </filter>
  </defs>

  <g id="tom-root">
    <!-- shadow anchors the character to the ground so movement reads as weight -->
    <ellipse id="tom-shadow" cx="210" cy="452" rx="104" ry="15" fill="#000" opacity="0.14" filter="url(#tom-soft)"/>

    <g id="tom-body-group">
      <path id="tom-tail" d="M 306 416 C 372 410 386 352 358 318"
            fill="none" stroke="${PALETTE.fur}" stroke-width="27" stroke-linecap="round"/>
      <path id="tom-tail-tip" d="M 356 322 C 352 314 352 306 356 300"
            fill="none" stroke="${PALETTE.belly}" stroke-width="25" stroke-linecap="round"/>

      <path id="tom-body" d="M 210 250 C 288 250 320 320 320 380 C 320 428 278 448 210 448 C 142 448 100 428 100 380 C 100 320 132 250 210 250 Z"
            fill="url(#tom-fur-grad)" stroke="${PALETTE.outline}" stroke-width="3.5" stroke-linejoin="round"/>
      <path id="tom-belly" d="M 210 300 C 258 300 276 344 276 382 C 276 416 246 430 210 430 C 174 430 144 416 144 382 C 144 344 162 300 210 300 Z"
            fill="${PALETTE.belly}" opacity="0.92"/>
      <path id="tom-paw-l" d="M 150 424 C 150 410 164 402 178 402 C 192 402 202 410 202 424 C 202 436 190 442 176 442 C 162 442 150 436 150 424 Z"
            fill="${PALETTE.muzzle}" stroke="${PALETTE.outline}" stroke-width="3"/>
      <path id="tom-paw-r" d="M 218 424 C 218 410 232 402 246 402 C 260 402 270 410 270 424 C 270 436 258 442 244 442 C 230 442 218 436 218 424 Z"
            fill="${PALETTE.muzzle}" stroke="${PALETTE.outline}" stroke-width="3"/>
    </g>

    <g id="tom-head">
      <!-- ears sit behind the skull so rotation tucks correctly -->
      <g id="tom-ear-l">
        <path d="M 128 112 L 106 34 L 176 76 Z" fill="${PALETTE.fur}" stroke="${PALETTE.outline}" stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M 132 104 L 118 56 L 162 82 Z" fill="${PALETTE.innerEar}"/>
      </g>
      <g id="tom-ear-r">
        <path d="M 292 112 L 314 34 L 244 76 Z" fill="${PALETTE.fur}" stroke="${PALETTE.outline}" stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M 288 104 L 302 56 L 258 82 Z" fill="${PALETTE.innerEar}"/>
      </g>

      <ellipse id="tom-skull" cx="210" cy="176" rx="118" ry="106"
               fill="url(#tom-fur-grad)" stroke="${PALETTE.outline}" stroke-width="3.5"/>

      <path id="tom-stripe-1" d="M 176 76 C 190 92 196 104 198 118" fill="none" stroke="${PALETTE.stripe}" stroke-width="9" stroke-linecap="round" opacity="0.65"/>
      <path id="tom-stripe-2" d="M 210 70 C 212 88 212 102 211 116" fill="none" stroke="${PALETTE.stripe}" stroke-width="9" stroke-linecap="round" opacity="0.65"/>
      <path id="tom-stripe-3" d="M 244 76 C 230 92 224 104 222 118" fill="none" stroke="${PALETTE.stripe}" stroke-width="9" stroke-linecap="round" opacity="0.65"/>

      <ellipse id="tom-blush-l" cx="132" cy="218" rx="26" ry="15" fill="${PALETTE.blush}" opacity="0"/>
      <ellipse id="tom-blush-r" cx="288" cy="218" rx="26" ry="15" fill="${PALETTE.blush}" opacity="0"/>

      <g id="tom-eye-l">
        <ellipse cx="163" cy="176" rx="31" ry="34" fill="${PALETTE.eyeWhite}" stroke="${PALETTE.outline}" stroke-width="3"/>
        <g clip-path="url(#tom-clip-eye-l)">
          <g id="tom-iris-l">
            <circle cx="163" cy="176" r="21" fill="url(#tom-iris-grad)"/>
            <ellipse id="tom-pupil-l" cx="163" cy="176" rx="10" ry="13" fill="${PALETTE.pupil}"/>
            <circle cx="156" cy="168" r="6" fill="#fff" opacity="0.95"/>
            <circle cx="170" cy="184" r="3" fill="#fff" opacity="0.6"/>
          </g>
          <path id="tom-lid-upper-l" d="M 126 142 L 200 142 L 200 108 L 126 108 Z" fill="${PALETTE.fur}" stroke="${PALETTE.outline}" stroke-width="3"/>
          <path id="tom-lid-lower-l" d="M 126 210 L 200 210 L 200 246 L 126 246 Z" fill="${PALETTE.fur}" stroke="${PALETTE.outline}" stroke-width="3"/>
        </g>
      </g>

      <g id="tom-eye-r">
        <ellipse cx="257" cy="176" rx="31" ry="34" fill="${PALETTE.eyeWhite}" stroke="${PALETTE.outline}" stroke-width="3"/>
        <g clip-path="url(#tom-clip-eye-r)">
          <g id="tom-iris-r">
            <circle cx="257" cy="176" r="21" fill="url(#tom-iris-grad)"/>
            <ellipse id="tom-pupil-r" cx="257" cy="176" rx="10" ry="13" fill="${PALETTE.pupil}"/>
            <circle cx="250" cy="168" r="6" fill="#fff" opacity="0.95"/>
            <circle cx="264" cy="184" r="3" fill="#fff" opacity="0.6"/>
          </g>
          <path id="tom-lid-upper-r" d="M 220 142 L 294 142 L 294 108 L 220 108 Z" fill="${PALETTE.fur}" stroke="${PALETTE.outline}" stroke-width="3"/>
          <path id="tom-lid-lower-r" d="M 220 210 L 294 210 L 294 246 L 220 246 Z" fill="${PALETTE.fur}" stroke="${PALETTE.outline}" stroke-width="3"/>
        </g>
      </g>

      <path id="tom-brow-l" d="M 140 132 C 154 122 178 122 192 130" fill="none" stroke="${PALETTE.outline}" stroke-width="7" stroke-linecap="round"/>
      <path id="tom-brow-r" d="M 280 132 C 266 122 242 122 228 130" fill="none" stroke="${PALETTE.outline}" stroke-width="7" stroke-linecap="round"/>

      <g id="tom-muzzle-group">
        <ellipse cx="185" cy="248" rx="38" ry="30" fill="${PALETTE.muzzle}"/>
        <ellipse cx="235" cy="248" rx="38" ry="30" fill="${PALETTE.muzzle}"/>
        <path id="tom-nose" d="M 196 226 L 224 226 L 210 242 Z" fill="${PALETTE.nose}" stroke="${PALETTE.outline}" stroke-width="2.5" stroke-linejoin="round"/>
        <path id="tom-philtrum" d="M 210 242 L 210 252" stroke="${PALETTE.outline}" stroke-width="3" stroke-linecap="round"/>

        <!-- mouth interior, teeth and tongue are clipped to the opening -->
        <path id="tom-mouth-interior" d="" fill="${PALETTE.mouth}"/>
        <g clip-path="url(#tom-clip-mouth)">
          <rect id="tom-teeth" x="180" y="250" width="60" height="9" rx="3" fill="#fffdf5" opacity="0"/>
          <ellipse id="tom-tongue" cx="210" cy="278" rx="20" ry="12" fill="${PALETTE.tongue}" opacity="0"/>
        </g>
        <path id="tom-mouth-line" d="" fill="none" stroke="${PALETTE.outline}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>

        <g id="tom-whiskers-l" stroke="${PALETTE.outline}" stroke-width="2.6" stroke-linecap="round" opacity="0.8">
          <path d="M 152 240 L 96 230"/><path d="M 150 252 L 92 252"/><path d="M 152 264 L 98 276"/>
        </g>
        <g id="tom-whiskers-r" stroke="${PALETTE.outline}" stroke-width="2.6" stroke-linecap="round" opacity="0.8">
          <path d="M 268 240 L 324 230"/><path d="M 270 252 L 328 252"/><path d="M 268 264 L 322 276"/>
        </g>
      </g>
    </g>
  </g>
</svg>`.trim();
}

const PART_IDS = [
  'tom-svg', 'tom-root', 'tom-shadow', 'tom-body-group', 'tom-body', 'tom-tail', 'tom-tail-tip',
  'tom-head', 'tom-skull', 'tom-ear-l', 'tom-ear-r',
  'tom-eye-l', 'tom-eye-r', 'tom-iris-l', 'tom-iris-r', 'tom-pupil-l', 'tom-pupil-r',
  'tom-lid-upper-l', 'tom-lid-lower-l', 'tom-lid-upper-r', 'tom-lid-lower-r',
  'tom-brow-l', 'tom-brow-r', 'tom-blush-l', 'tom-blush-r',
  'tom-mouth-interior', 'tom-mouth-line', 'tom-mouth-clip-path', 'tom-teeth', 'tom-tongue',
  'tom-whiskers-l', 'tom-whiskers-r', 'tom-muzzle-group', 'tom-nose',
];

/**
 * Mount the character into a container and return handles to its parts.
 * @param {HTMLElement} container
 */
export function mount(container) {
  container.innerHTML = markup();
  /** @type {Record<string, SVGElement>} */
  const parts = {};
  for (const id of PART_IDS) {
    const el = container.querySelector(`#${id}`);
    if (el) parts[id.replace('tom-', '').replace(/-/g, '_')] = el;
  }
  return parts;
}

/* ------------------------------------------------------------------ *
 * Geometry
 * ------------------------------------------------------------------ */

const EYE = { l: { cx: 163, cy: 176 }, r: { cx: 257, cy: 176 }, rx: 31, ry: 34 };
const MOUTH = { cx: 210, cy: 256 };

/**
 * Build the mouth opening and lip line from the current shape parameters.
 *
 * The lip line is always drawn — a closed mouth is a line, not an absence — and
 * the opening fades in as the jaw drops, which avoids the rubbery look of
 * scaling a filled shape from zero.
 *
 * @param {{mouthOpen:number, mouthWidth:number, mouthRound:number, mouthCurve:number}} p
 */
export function mouthGeometry(p) {
  const round = p.mouthRound ?? 0;
  const halfWidth = (20 + (p.mouthWidth ?? 0.5) * 26) * (1 - round * 0.52);
  const open = Math.max(0, p.mouthOpen ?? 0) * 36;
  const curve = p.mouthCurve ?? 0;

  const { cx, cy } = MOUTH;
  const lx = cx - halfWidth;
  const rx = cx + halfWidth;
  // Corners rise on a smile and fall on a frown.
  const cornerY = cy - curve * 9;
  const upperCtrlY = cy - 5 - curve * 11;
  const lowerCtrlY = cy + open + 6 - curve * 3;

  const interior = `M ${lx} ${cornerY} Q ${cx} ${upperCtrlY} ${rx} ${cornerY} Q ${cx} ${lowerCtrlY} ${lx} ${cornerY} Z`;

  // Cat mouths read as a shallow "w" beneath the nose when closed.
  const line = open < 3
    ? `M ${cx - halfWidth * 0.85} ${cornerY - 2} Q ${cx - halfWidth * 0.42} ${cy + 7 - curve * 8} ${cx} ${cy - 1} Q ${cx + halfWidth * 0.42} ${cy + 7 - curve * 8} ${cx + halfWidth * 0.85} ${cornerY - 2}`
    : interior;

  return { interior, line, halfWidth, open, cornerY };
}

/**
 * Eyelid offsets. `eyeOpen` of 1 sits the lids just outside the eye; 0 closes them.
 * @param {number} eyeOpen
 * @param {number} squint
 */
export function lidOffsets(eyeOpen, squint = 0) {
  const openness = Math.max(0, Math.min(1.3, eyeOpen));
  // The upper lid travels further than the lower, as a real eyelid does.
  const upper = (1 - Math.min(1, openness)) * (EYE.ry * 2.05) + Math.max(0, openness - 1) * -8;
  const lower = squint * EYE.ry * 0.62;
  return { upper, lower };
}

/**
 * Write a pose onto the mounted parts.
 * @param {Record<string, SVGElement>} parts
 * @param {Record<string, number>} pose
 * @param {{breathPhase?:number, swayPhase?:number, time?:number}} [motion]
 */
export function applyPose(parts, pose, motion = {}) {
  const p = pose;
  const breath = motion.breathPhase ?? 0;
  const sway = motion.swayPhase ?? 0;

  // --- body: breathing, lean, squash and stretch ---
  const breathScale = 1 + Math.sin(breath) * 0.018 * (p.breathDepth ?? 1);
  const squash = 1 + (p.squashY ?? 0);
  const leanX = (p.bodyLean ?? 0) * 6;
  set(parts.root, 'transform', `translate(${leanX.toFixed(2)} 0)`);
  set(parts.body_group, 'transform',
    `translate(210 448) scale(${(2 - breathScale).toFixed(4)} ${(breathScale * squash).toFixed(4)}) translate(-210 -448)`);

  // --- head: tilt, nod, turn, and a little counter-motion from breathing ---
  const headY = (p.headNod ?? 0) * 13 + Math.sin(breath) * 2.4;
  const headX = (p.headTurn ?? 0) * 12;
  set(parts.head, 'transform',
    `translate(${headX.toFixed(2)} ${headY.toFixed(2)}) rotate(${(p.headTilt ?? 0).toFixed(2)} 210 250)`);

  // --- ears ---
  const earRot = (p.earRotate ?? 0) * 16;
  const earDroop = (p.earDroop ?? 0);
  set(parts.ear_l, 'transform', `rotate(${(-earRot + earDroop * 34).toFixed(2)} 150 110) translate(0 ${(earDroop * 12).toFixed(2)})`);
  set(parts.ear_r, 'transform', `rotate(${(earRot - earDroop * 34).toFixed(2)} 270 110) translate(0 ${(earDroop * 12).toFixed(2)})`);

  // --- eyes ---
  const lids = lidOffsets(p.eyeOpen ?? 1, p.squint ?? 0);
  set(parts.lid_upper_l, 'transform', `translate(0 ${lids.upper.toFixed(2)})`);
  set(parts.lid_upper_r, 'transform', `translate(0 ${lids.upper.toFixed(2)})`);
  set(parts.lid_lower_l, 'transform', `translate(0 ${(-lids.lower).toFixed(2)})`);
  set(parts.lid_lower_r, 'transform', `translate(0 ${(-lids.lower).toFixed(2)})`);

  const gx = (p.gazeX ?? 0) * 11;
  const gy = (p.gazeY ?? 0) * 9;
  set(parts.iris_l, 'transform', `translate(${gx.toFixed(2)} ${gy.toFixed(2)})`);
  set(parts.iris_r, 'transform', `translate(${gx.toFixed(2)} ${gy.toFixed(2)})`);

  const pupil = Math.max(0.5, p.pupilScale ?? 1);
  for (const side of ['l', 'r']) {
    const el = parts[`pupil_${side}`];
    if (!el) continue;
    el.setAttribute('rx', (10 * pupil).toFixed(2));
    el.setAttribute('ry', (13 * pupil).toFixed(2));
  }

  // --- brows ---
  const inner = (p.browInnerRaise ?? 0);
  const outer = (p.browOuterRaise ?? 0);
  const furrow = (p.browFurrow ?? 0);
  // Inner raise rotates each brow toward the midline: the sadness signature.
  set(parts.brow_l, 'transform',
    `translate(${(furrow * 7).toFixed(2)} ${(-outer * 8 + furrow * 7).toFixed(2)}) rotate(${(inner * 17 - outer * 5).toFixed(2)} 192 130)`);
  set(parts.brow_r, 'transform',
    `translate(${(-furrow * 7).toFixed(2)} ${(-outer * 8 + furrow * 7).toFixed(2)}) rotate(${(-inner * 17 + outer * 5).toFixed(2)} 228 130)`);

  // --- mouth ---
  const geo = mouthGeometry(p);
  set(parts.mouth_interior, 'd', geo.interior);
  set(parts.mouth_interior, 'opacity', String(Math.min(1, geo.open / 7)));
  set(parts.mouth_line, 'd', geo.line);
  set(parts.mouth_clip_path, 'd', geo.interior);
  set(parts.teeth, 'opacity', String(Math.min(1, (p.teeth ?? 0) * (geo.open > 2 ? 1 : 0))));
  set(parts.teeth, 'x', (MOUTH.cx - geo.halfWidth * 0.86).toFixed(2));
  set(parts.teeth, 'width', (geo.halfWidth * 1.72).toFixed(2));
  set(parts.teeth, 'y', (geo.cornerY - 3).toFixed(2));
  set(parts.tongue, 'opacity', String(Math.min(1, (p.tongue ?? 0) * (geo.open > 6 ? 1 : 0))));
  set(parts.tongue, 'cy', (MOUTH.cy + geo.open * 0.72).toFixed(2));

  // --- whiskers, blush, tail ---
  const droop = (p.whiskerDroop ?? 0);
  set(parts.whiskers_l, 'transform', `rotate(${(droop * 11).toFixed(2)} 152 252)`);
  set(parts.whiskers_r, 'transform', `rotate(${(-droop * 11).toFixed(2)} 268 252)`);
  set(parts.blush_l, 'opacity', String((p.blush ?? 0) * 0.55));
  set(parts.blush_r, 'opacity', String((p.blush ?? 0) * 0.55));

  const swayAmount = (p.tailSway ?? 1);
  const tailX = Math.sin(sway) * 22 * swayAmount;
  const tailY = Math.cos(sway * 1.3) * 9 * swayAmount;
  set(parts.tail, 'd', `M 306 416 C ${(372 + tailX * 0.4).toFixed(1)} ${(410 + tailY * 0.3).toFixed(1)} ${(386 + tailX).toFixed(1)} ${(352 + tailY).toFixed(1)} ${(358 + tailX * 1.3).toFixed(1)} ${(318 + tailY * 1.2).toFixed(1)}`);
  set(parts.tail_tip, 'd', `M ${(356 + tailX * 1.3).toFixed(1)} ${(322 + tailY * 1.2).toFixed(1)} C ${(352 + tailX * 1.4).toFixed(1)} ${(314 + tailY * 1.3).toFixed(1)} ${(352 + tailX * 1.5).toFixed(1)} ${(306 + tailY * 1.4).toFixed(1)} ${(356 + tailX * 1.6).toFixed(1)} ${(300 + tailY * 1.5).toFixed(1)}`);

  // Shadow narrows as the body rises, which sells the weight of the breath.
  set(parts.shadow, 'rx', (104 * (2 - breathScale)).toFixed(2));
}

function set(el, attr, value) {
  if (el) el.setAttribute(attr, value);
}

export { EYE, MOUTH };
