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
  furLight: '#c3ced6',
  fur: '#a2b0bb',
  furMid: '#8e9daa',
  furDark: '#71808d',
  furShade: '#5f6e7b',
  belly: '#f2f6f8',
  muzzle: '#fbfdfe',
  innerEar: '#f0b4b4',
  innerEarDeep: '#d98e94',
  nose: '#e58a8a',
  noseShine: '#f5b9b9',
  mouth: '#6d2b36',
  tongue: '#ef8d94',
  eyeWhite: '#ffffff',
  eyeShade: '#dfe7ee',
  iris: '#7cc36b',
  irisMid: '#4f9c4f',
  irisDark: '#2c6b38',
  pupil: '#141a1f',
  stripe: '#7b8a97',
  outline: '#4b5760',
  blush: '#f08a8a',
};

/**
 * The static drawing.
 *
 * Built for the soft, rounded, slightly three-dimensional look that the
 * talking-pet apps use, which comes almost entirely from three things:
 * gradients rather than flat fills, a consistent light source at the upper
 * left, and contact shadows where forms overlap. A flat cartoon with an
 * outline reads as a doodle no matter how good the proportions are.
 *
 * Proportions follow baby schema, which is what makes a drawn animal appealing
 * rather than merely accurate: an oversized head, eyes that are very large and
 * sit low on the face, a short muzzle, and small rounded limbs.
 *
 * This is original artwork. It is not, and is not meant to be, any existing
 * commercial character.
 *
 * Landmarks are fixed, because everything else is built on them: eye centres at
 * (163,176) and (257,176), nose at (210,228), mouth at (210,258), and the hit
 * regions in touch.js. Restyle freely; move these and the rig comes apart.
 */
export function markup() {
  return `
<svg id="tom-svg" viewBox="0 0 420 470" xmlns="${SVG_NS}" role="img"
     aria-labelledby="tom-title tom-desc" preserveAspectRatio="xMidYMax meet">
  <title id="tom-title">Tom</title>
  <desc id="tom-desc">An animated cartoon cat who listens and responds. His expression reflects the conversation. All information is also available as text.</desc>

  <defs>
    <!-- Light from the upper left, consistently, on every form. -->
    <radialGradient id="g-fur-head" cx="36%" cy="26%" r="82%">
      <stop offset="0%" stop-color="${PALETTE.furLight}"/>
      <stop offset="52%" stop-color="${PALETTE.fur}"/>
      <stop offset="100%" stop-color="${PALETTE.furDark}"/>
    </radialGradient>
    <radialGradient id="g-fur-body" cx="38%" cy="20%" r="88%">
      <stop offset="0%" stop-color="${PALETTE.furLight}"/>
      <stop offset="55%" stop-color="${PALETTE.fur}"/>
      <stop offset="100%" stop-color="${PALETTE.furShade}"/>
    </radialGradient>
    <linearGradient id="g-belly" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${PALETTE.muzzle}"/>
      <stop offset="100%" stop-color="#dfe8ed"/>
    </linearGradient>
    <linearGradient id="g-muzzle" x1="0.2" y1="0" x2="0.6" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#e4edf2"/>
    </linearGradient>
    <radialGradient id="g-ear" cx="50%" cy="72%" r="72%">
      <stop offset="0%" stop-color="${PALETTE.innerEarDeep}"/>
      <stop offset="100%" stop-color="${PALETTE.innerEar}"/>
    </radialGradient>
    <radialGradient id="g-iris" cx="42%" cy="34%" r="72%">
      <stop offset="0%" stop-color="${PALETTE.iris}"/>
      <stop offset="58%" stop-color="${PALETTE.irisMid}"/>
      <stop offset="100%" stop-color="${PALETTE.irisDark}"/>
    </radialGradient>
    <linearGradient id="g-sclera" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${PALETTE.eyeShade}"/>
      <stop offset="38%" stop-color="${PALETTE.eyeWhite}"/>
      <stop offset="100%" stop-color="${PALETTE.eyeWhite}"/>
    </linearGradient>
    <radialGradient id="g-nose" cx="38%" cy="28%" r="78%">
      <stop offset="0%" stop-color="${PALETTE.noseShine}"/>
      <stop offset="100%" stop-color="${PALETTE.nose}"/>
    </radialGradient>
    <radialGradient id="g-ground" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#2d3942" stop-opacity="0.26"/>
      <stop offset="70%" stop-color="#2d3942" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#2d3942" stop-opacity="0"/>
    </radialGradient>
    <!-- Contact shadow where the head sits on the body. -->
    <linearGradient id="g-neck" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4b5760" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#4b5760" stop-opacity="0"/>
    </linearGradient>

    <clipPath id="tom-clip-eye-l"><ellipse cx="163" cy="176" rx="36" ry="39"/></clipPath>
    <clipPath id="tom-clip-eye-r"><ellipse cx="257" cy="176" rx="36" ry="39"/></clipPath>
    <clipPath id="tom-clip-mouth"><path id="tom-mouth-clip-path" d="M 190 264 L 230 264 Z"/></clipPath>
    <clipPath id="clip-head"><ellipse cx="210" cy="176" rx="120" ry="108"/></clipPath>
    <clipPath id="clip-body"><path d="M 210 248 C 292 248 326 322 326 384 C 326 432 282 452 210 452 C 138 452 94 432 94 384 C 94 322 128 248 210 248 Z"/></clipPath>
  </defs>

  <g id="tom-root">
    <ellipse id="tom-shadow" cx="210" cy="452" rx="112" ry="17" fill="url(#g-ground)"/>

    <g id="tom-body-group">
      <path id="tom-tail" d="M 302 420 C 368 416 394 356 362 314"
            fill="none" stroke="${PALETTE.furMid}" stroke-width="29" stroke-linecap="round"/>
      <path id="tom-tail-tip" d="M 362 314 C 356 302 355 293 360 284"
            fill="none" stroke="${PALETTE.belly}" stroke-width="25" stroke-linecap="round"/>

      <path id="tom-body" d="M 210 248 C 292 248 326 322 326 384 C 326 432 282 452 210 452 C 138 452 94 432 94 384 C 94 322 128 248 210 248 Z"
            fill="url(#g-fur-body)" stroke="${PALETTE.outline}" stroke-width="3" stroke-linejoin="round"/>
      <path id="tom-belly" d="M 210 300 C 258 300 278 344 278 386 C 278 420 248 434 210 434 C 172 434 142 420 142 386 C 142 344 162 300 210 300 Z"
            fill="url(#g-belly)"/>
      <!-- the head casts onto the chest -->
      <rect x="94" y="248" width="232" height="58" fill="url(#g-neck)" clip-path="url(#clip-body)"/>

      <ellipse id="tom-paw-l" cx="176" cy="424" rx="28" ry="21"
               fill="url(#g-muzzle)" stroke="${PALETTE.outline}" stroke-width="2.6"/>
      <ellipse id="tom-paw-r" cx="244" cy="424" rx="28" ry="21"
               fill="url(#g-muzzle)" stroke="${PALETTE.outline}" stroke-width="2.6"/>
      <path d="M 168 417 v7 M 176 415 v9 M 184 417 v7" stroke="#c4d0d8" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      <path d="M 236 417 v7 M 244 415 v9 M 252 417 v7" stroke="#c4d0d8" stroke-width="2.2" stroke-linecap="round" fill="none"/>
    </g>

    <g id="tom-head">
      <g id="tom-ear-l">
        <path d="M 126 118 C 116 72 112 44 118 30 C 132 34 160 56 180 84 Z"
              fill="url(#g-fur-head)" stroke="${PALETTE.outline}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M 133 108 C 126 76 124 58 128 48 C 138 52 156 68 168 88 Z" fill="url(#g-ear)"/>
      </g>
      <g id="tom-ear-r">
        <path d="M 294 118 C 304 72 308 44 302 30 C 288 34 260 56 240 84 Z"
              fill="url(#g-fur-head)" stroke="${PALETTE.outline}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M 287 108 C 294 76 296 58 292 48 C 282 52 264 68 252 88 Z" fill="url(#g-ear)"/>
      </g>

      <ellipse id="tom-skull" cx="210" cy="176" rx="120" ry="108"
               fill="url(#g-fur-head)" stroke="${PALETTE.outline}" stroke-width="3"/>

      <g clip-path="url(#clip-head)">
        <!-- forehead tabby markings -->
        <path id="tom-stripe-1" d="M 172 74 C 186 94 192 110 194 126" fill="none" stroke="${PALETTE.stripe}" stroke-width="10" stroke-linecap="round" opacity="0.5"/>
        <path id="tom-stripe-2" d="M 210 66 C 212 88 212 108 211 124" fill="none" stroke="${PALETTE.stripe}" stroke-width="10" stroke-linecap="round" opacity="0.5"/>
        <path id="tom-stripe-3" d="M 248 74 C 234 94 228 110 226 126" fill="none" stroke="${PALETTE.stripe}" stroke-width="10" stroke-linecap="round" opacity="0.5"/>
        <!-- soft occlusion under the jaw -->
        <ellipse cx="210" cy="300" rx="130" ry="42" fill="#4b5760" opacity="0.16"/>
      </g>

      <ellipse id="tom-blush-l" cx="118" cy="214" rx="28" ry="16" fill="${PALETTE.blush}" opacity="0"/>
      <ellipse id="tom-blush-r" cx="302" cy="214" rx="28" ry="16" fill="${PALETTE.blush}" opacity="0"/>

      <g id="tom-eye-l">
        <ellipse cx="163" cy="176" rx="36" ry="39" fill="url(#g-sclera)" stroke="${PALETTE.outline}" stroke-width="2.8"/>
        <g clip-path="url(#tom-clip-eye-l)">
          <g id="tom-iris-l">
            <circle cx="163" cy="180" r="26" fill="url(#g-iris)"/>
            <ellipse id="tom-pupil-l" cx="163" cy="180" rx="13" ry="17" fill="${PALETTE.pupil}"/>
            <circle cx="153" cy="168" r="8.5" fill="#fff" opacity="0.96"/>
            <circle cx="172" cy="192" r="4.2" fill="#fff" opacity="0.55"/>
          </g>
          <!-- shadow cast by the upper lid; this is most of what sells a round eye -->
          <ellipse cx="163" cy="128" rx="40" ry="26" fill="#2d3942" opacity="0.16"/>
          <path id="tom-lid-upper-l" d="M 121 17 L 205 17 L 205 137 Q 163 154 121 137 Z" fill="${PALETTE.fur}" stroke="${PALETTE.outline}" stroke-width="2.8" stroke-linejoin="round"/>
          <path id="tom-lid-lower-l" d="M 121 215 Q 163 200 205 215 L 205 335 L 121 335 Z" fill="${PALETTE.fur}" stroke="${PALETTE.outline}" stroke-width="2.8" stroke-linejoin="round"/>
        </g>
      </g>

      <g id="tom-eye-r">
        <ellipse cx="257" cy="176" rx="36" ry="39" fill="url(#g-sclera)" stroke="${PALETTE.outline}" stroke-width="2.8"/>
        <g clip-path="url(#tom-clip-eye-r)">
          <g id="tom-iris-r">
            <circle cx="257" cy="180" r="26" fill="url(#g-iris)"/>
            <ellipse id="tom-pupil-r" cx="257" cy="180" rx="13" ry="17" fill="${PALETTE.pupil}"/>
            <circle cx="247" cy="168" r="8.5" fill="#fff" opacity="0.96"/>
            <circle cx="266" cy="192" r="4.2" fill="#fff" opacity="0.55"/>
          </g>
          <ellipse cx="257" cy="128" rx="40" ry="26" fill="#2d3942" opacity="0.16"/>
          <path id="tom-lid-upper-r" d="M 215 17 L 299 17 L 299 137 Q 257 154 215 137 Z" fill="${PALETTE.fur}" stroke="${PALETTE.outline}" stroke-width="2.8" stroke-linejoin="round"/>
          <path id="tom-lid-lower-r" d="M 215 215 Q 257 200 299 215 L 299 335 L 215 335 Z" fill="${PALETTE.fur}" stroke="${PALETTE.outline}" stroke-width="2.8" stroke-linejoin="round"/>
        </g>
      </g>

      <path id="tom-brow-l" d="M 130 126 C 146 114 180 114 196 124" fill="none" stroke="${PALETTE.furShade}" stroke-width="7.5" stroke-linecap="round"/>
      <path id="tom-brow-r" d="M 290 126 C 274 114 240 114 224 124" fill="none" stroke="${PALETTE.furShade}" stroke-width="7.5" stroke-linecap="round"/>

      <g id="tom-muzzle-group">
        <ellipse cx="184" cy="252" rx="42" ry="33" fill="url(#g-muzzle)"/>
        <ellipse cx="236" cy="252" rx="42" ry="33" fill="url(#g-muzzle)"/>
        <!-- whisker-pad dimples -->
        <circle cx="170" cy="246" r="2" fill="#c8d4dc"/><circle cx="182" cy="240" r="2" fill="#c8d4dc"/><circle cx="178" cy="254" r="2" fill="#c8d4dc"/>
        <circle cx="250" cy="246" r="2" fill="#c8d4dc"/><circle cx="238" cy="240" r="2" fill="#c8d4dc"/><circle cx="242" cy="254" r="2" fill="#c8d4dc"/>

        <path id="tom-nose" d="M 194 220 C 194 216 198 214 210 214 C 222 214 226 216 226 220 C 226 228 218 238 210 238 C 202 238 194 228 194 220 Z"
              fill="url(#g-nose)" stroke="${PALETTE.outline}" stroke-width="2.2" stroke-linejoin="round"/>
        <path id="tom-philtrum" d="M 210 238 L 210 252" stroke="${PALETTE.furShade}" stroke-width="3" stroke-linecap="round" opacity="0.8"/>

        <path id="tom-mouth-interior" d="" fill="${PALETTE.mouth}"/>
        <g clip-path="url(#tom-clip-mouth)">
          <rect id="tom-teeth" x="184" y="252" width="52" height="9" rx="3.5" fill="#fffdf8" opacity="0"/>
          <ellipse id="tom-tongue" cx="210" cy="280" rx="20" ry="12" fill="${PALETTE.tongue}" opacity="0"/>
        </g>
        <path id="tom-mouth-line" d="" fill="none" stroke="${PALETTE.outline}" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/>

        <g id="tom-whiskers-l" stroke="#8d9ba7" stroke-width="2.4" stroke-linecap="round" fill="none" opacity="0.8">
          <path d="M 150 240 C 130 234 116 230 102 228"/>
          <path d="M 148 252 C 126 252 112 252 98 253"/>
          <path d="M 150 264 C 130 269 116 274 104 277"/>
        </g>
        <g id="tom-whiskers-r" stroke="#8d9ba7" stroke-width="2.4" stroke-linecap="round" fill="none" opacity="0.8">
          <path d="M 270 240 C 290 234 304 230 318 228"/>
          <path d="M 272 252 C 294 252 308 252 322 253"/>
          <path d="M 270 264 C 290 269 304 274 316 277"/>
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

const EYE = { l: { cx: 163, cy: 176 }, r: { cx: 257, cy: 176 }, rx: 36, ry: 39 };
const MOUTH = { cx: 210, cy: 258 };

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
 * Eyelid offsets.
 *
 * The lids are tall rectangles whose inner edges rest exactly on the top and
 * bottom of the eye when it is open, extending far enough away that they always
 * cover it when they travel. The earlier version used short rectangles, which
 * meant that at `eyeOpen: 0` the lid slid across the middle of the eye and left
 * the top third showing — every blink in the app was wrong, and the "contented
 * half-closed" look was a lid sitting in the wrong place rather than a lid.
 *
 * `LID_HEIGHT` must exceed the full travel, or the same bug returns.
 *
 * @param {number} eyeOpen 0 = shut, 1 = normal, >1 = wide
 * @param {number} squint 0..1, raises the lower lid
 */
export function lidOffsets(eyeOpen, squint = 0) {
  const openness = Math.max(0, Math.min(1.3, eyeOpen));
  // Full travel takes the upper lid's bottom edge from the top of the eye to
  // past the bottom of it: slightly more than the eye's full height.
  const upper = (1 - Math.min(1, openness)) * (EYE.ry * 2.06) + Math.max(0, openness - 1) * -9;
  const lower = squint * EYE.ry * 0.6;
  return { upper, lower };
}

/**
 * Height of the lid shapes in the markup; the travel must stay under it.
 *
 * The lid's straight bottom edge rests on the top of the eye, and a shallow
 * curve bulges ~17 units below that — so a lid at rest already covers a sliver
 * of the eye, which is what stops a drawn eye reading as permanently startled.
 */
export const LID_HEIGHT = 120;
export const LID_CURVE = 17;

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

  // Larger eyes give the gaze more room to travel before the iris clips.
  const gx = (p.gazeX ?? 0) * 13;
  const gy = (p.gazeY ?? 0) * 11;
  set(parts.iris_l, 'transform', `translate(${gx.toFixed(2)} ${gy.toFixed(2)})`);
  set(parts.iris_r, 'transform', `translate(${gx.toFixed(2)} ${gy.toFixed(2)})`);

  const pupil = Math.max(0.5, p.pupilScale ?? 1);
  for (const side of ['l', 'r']) {
    const el = parts[`pupil_${side}`];
    if (!el) continue;
    el.setAttribute('rx', (13 * pupil).toFixed(2));
    el.setAttribute('ry', (17 * pupil).toFixed(2));
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

  // The tip starts at exactly the tail's end point and continues its direction.
  // Computing the join once, rather than writing two sets of literals that drift
  // apart, is what stops the white tip detaching as the tail swings.
  const tipX = 362 + tailX * 1.3;
  const tipY = 314 + tailY * 1.2;
  set(parts.tail, 'd',
    `M 302 420 C ${(368 + tailX * 0.35).toFixed(1)} ${(416 + tailY * 0.3).toFixed(1)} `
    + `${(394 + tailX).toFixed(1)} ${(356 + tailY).toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)}`);
  set(parts.tail_tip, 'd',
    `M ${tipX.toFixed(1)} ${tipY.toFixed(1)} `
    + `C ${(tipX - 6 + tailX * 0.1).toFixed(1)} ${(tipY - 12).toFixed(1)} `
    + `${(tipX - 7 + tailX * 0.2).toFixed(1)} ${(tipY - 21).toFixed(1)} `
    + `${(tipX - 2 + tailX * 0.3).toFixed(1)} ${(tipY - 30).toFixed(1)}`);

  // Shadow narrows as the body rises, which sells the weight of the breath.
  set(parts.shadow, 'rx', (104 * (2 - breathScale)).toFixed(2));
}

function set(el, attr, value) {
  if (el) el.setAttribute(attr, value);
}

export { EYE, MOUTH };
