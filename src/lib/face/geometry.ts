/**
 * Pure face-geometry helpers over MediaPipe's 478-point face mesh.
 * No DOM access here so it can be unit tested in Node.
 */
import type { FeatureArea } from "../schema";

export type Pt = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };

// MediaPipe face-mesh landmark indices.
export const IDX = {
  foreheadTop: 10,
  chin: 152,
  noseTip: 1,
  faceLeft: 234, // image-left edge of face
  faceRight: 454,
  rightBrow: [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
  leftBrow: [300, 293, 334, 296, 336, 285, 295, 282, 283, 276],
  rightEye: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
  leftEye: [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466],
  lipsOuter: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185],
  lipsInner: [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191],
  faceOval: [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150,
    136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
  ],
  rightCheek: 50,
  leftCheek: 280,
  rightUnderEye: 145,
  leftUnderEye: 374,
  rightIris: 468,
  leftIris: 473,
  jawRight: 172,
  jawLeft: 397,
} as const;

export function toPixels(norm: { x: number; y: number }[], w: number, h: number): Pt[] {
  return norm.map((p) => ({ x: p.x * w, y: p.y * h }));
}

export function bbox(points: Pt[]): Rect {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export function centroid(points: Pt[]): Pt {
  const s = points.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), { x: 0, y: 0 });
  return { x: s.x / points.length, y: s.y / points.length };
}

const pick = (pts: Pt[], idx: readonly number[]) => idx.map((i) => pts[i]);

export function faceMetrics(pts: Pt[]) {
  const oval = bbox(pick(pts, IDX.faceOval));
  const faceH = Math.hypot(pts[IDX.chin].x - pts[IDX.foreheadTop].x, pts[IDX.chin].y - pts[IDX.foreheadTop].y);
  const faceW = Math.hypot(pts[IDX.faceRight].x - pts[IDX.faceLeft].x, pts[IDX.faceRight].y - pts[IDX.faceLeft].y);
  return { oval, faceH, faceW };
}

function clampPt(p: Pt, w: number, h: number, margin = 4): Pt {
  return { x: Math.min(w - margin, Math.max(margin, p.x)), y: Math.min(h - margin, Math.max(margin, p.y)) };
}

function clampRect(r: Rect, w: number, h: number): Rect {
  const x = Math.max(0, r.x), y = Math.max(0, r.y);
  return { x, y, w: Math.max(1, Math.min(w - x, r.w - (x - r.x))), h: Math.max(1, Math.min(h - y, r.h - (y - r.y))) };
}

/** Where each numbered callout points on the face. */
export function computeAnchors(pts: Pt[], w: number, h: number): Record<FeatureArea, Pt> {
  const { faceH } = faceMetrics(pts);
  const top = pts[IDX.foreheadTop];
  const rightEye = centroid(pick(pts, IDX.rightEye));
  const lipsC = centroid(pick(pts, IDX.lipsOuter));
  return {
    hair: clampPt({ x: top.x + (pts[IDX.faceRight].x - top.x) * 0.25, y: top.y - faceH * 0.14 }, w, h),
    brows: clampPt(pts[105], w, h),
    eyes: clampPt({ x: rightEye.x, y: rightEye.y }, w, h),
    skin: clampPt(pts[IDX.leftCheek], w, h),
    lips: clampPt({ x: pts[291].x, y: lipsC.y }, w, h),
    facial_hair: clampPt({ x: (pts[IDX.chin].x + pts[IDX.jawLeft].x) / 2, y: pts[IDX.chin].y - faceH * 0.06 }, w, h),
  };
}

/** Close-up crop rectangles for the detail strip, 3:2 aspect. */
export function computeCrops(pts: Pt[], w: number, h: number): Record<FeatureArea, Rect> {
  const { oval, faceH, faceW } = faceMetrics(pts);
  const around = (c: Pt, cw: number): Rect => {
    const ch = (cw * 2) / 3;
    return clampRect({ x: c.x - cw / 2, y: c.y - ch / 2, w: cw, h: ch }, w, h);
  };
  const brows = centroid(pick(pts, [...IDX.rightBrow, ...IDX.leftBrow]));
  const rightEye = centroid(pick(pts, IDX.rightEye));
  const lips = centroid(pick(pts, IDX.lipsOuter));
  const cheek = pts[IDX.leftCheek];
  const top = pts[IDX.foreheadTop];
  return {
    hair: around({ x: oval.x + oval.w / 2, y: top.y - faceH * 0.12 }, faceW * 1.25),
    brows: around({ x: brows.x, y: brows.y + faceH * 0.03 }, faceW * 0.95),
    eyes: around({ x: rightEye.x, y: rightEye.y }, faceW * 0.5),
    skin: around({ x: cheek.x - faceW * 0.05, y: cheek.y }, faceW * 0.5),
    lips: around({ x: lips.x, y: lips.y }, faceW * 0.55),
    facial_hair: around({ x: pts[IDX.chin].x, y: pts[IDX.chin].y - faceH * 0.1 }, faceW * 0.8),
  };
}

/**
 * Vertical positions for callout badges in a side gutter: keep each badge as
 * close to its anchor's y as possible while enforcing a minimum gap.
 */
export function layoutBadges(ys: number[], minGap: number, top: number, bottom: number): number[] {
  const order = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  const placed: number[] = [];
  for (let k = 0; k < order.length; k++) {
    const want = Math.max(order[k].y, top);
    placed.push(k === 0 ? want : Math.max(want, placed[k - 1] + minGap));
  }
  // If we overflowed the bottom, shift the stack up (never above `top`).
  const overflow = placed.length ? placed[placed.length - 1] - bottom : 0;
  if (overflow > 0) {
    for (let k = placed.length - 1; k >= 0; k--) {
      const limit = k === placed.length - 1 ? bottom : placed[k + 1] - minGap;
      placed[k] = Math.max(top, Math.min(placed[k], limit));
    }
  }
  const out = new Array<number>(ys.length);
  order.forEach((o, k) => (out[o.i] = placed[k]));
  return out;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
}

export function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Relative luminance (WCAG) for picking legible text on a swatch. */
export function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Median of each channel — robust to specular highlights and stray hairs. */
export function medianColor(pixels: Uint8ClampedArray): string {
  const r: number[] = [], g: number[] = [], b: number[] = [];
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 200) continue;
    r.push(pixels[i]); g.push(pixels[i + 1]); b.push(pixels[i + 2]);
  }
  if (!r.length) return "#808080";
  const med = (a: number[]) => a.sort((x, y) => x - y)[Math.floor(a.length / 2)];
  return rgbToHex(med(r), med(g), med(b));
}

/**
 * A 4:5 portrait frame around the face (head, hair and shoulders), like a
 * selfie. Returns null when the face already fills the frame.
 */
export function portraitCrop(pts: Pt[], w: number, h: number): Rect | null {
  const { faceW, faceH } = faceMetrics(pts);
  if (faceW / w > 0.42) return null;
  let cw = Math.min(w, faceW * 2.7);
  let ch = Math.min(h, (cw * 5) / 4);
  cw = Math.min(cw, (ch * 4) / 5);
  const cx = (pts[IDX.faceLeft].x + pts[IDX.faceRight].x) / 2;
  // Put the face slightly above center, leaving room for hair.
  const cy = pts[IDX.foreheadTop].y + faceH * 0.55;
  const x = Math.min(Math.max(0, cx - cw / 2), w - cw);
  const y = Math.min(Math.max(0, cy - ch * 0.45), h - ch);
  return { x: Math.round(x), y: Math.round(y), w: Math.round(cw), h: Math.round(ch) };
}
