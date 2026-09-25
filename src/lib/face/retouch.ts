"use client";

import type { FeatureArea } from "../schema";
import { IDX, faceMetrics, type Pt } from "./geometry";
import { loadImage, type FaceGeometry } from "./landmarks";

/**
 * On-device, landmark-guided retouch. Used as the "after" image when no
 * generative image model is configured, and runs entirely in the browser.
 * It never changes face shape — only tone, texture and definition inside
 * feathered masks built from the face mesh.
 */
export async function retouch(
  src: string,
  geo: FaceGeometry,
  areas: FeatureArea[],
  intensity = 0.7,
): Promise<string> {
  const img = await loadImage(src);
  const { width: w, height: h, points } = geo;
  const { faceW } = faceMetrics(points);
  const on = new Set(areas);

  const base = drawToCanvas(img, w, h);
  const orig = base.ctx.getImageData(0, 0, w, h);
  const blurred = blurCanvas(base.canvas, faceW * 0.012).getContext("2d")!.getImageData(0, 0, w, h);
  const feather = faceW * 0.02;

  const skinMask = mask(w, h, feather, (ctx) => {
    fillPoly(ctx, pick(points, IDX.faceOval));
    ctx.globalCompositeOperation = "destination-out";
    fillPoly(ctx, grow(pick(points, IDX.rightEye), 1.6));
    fillPoly(ctx, grow(pick(points, IDX.leftEye), 1.6));
    fillPoly(ctx, grow(pick(points, IDX.rightBrow), 1.3));
    fillPoly(ctx, grow(pick(points, IDX.leftBrow), 1.3));
    fillPoly(ctx, grow(pick(points, IDX.lipsOuter), 1.15));
  });
  const underEyeMask = mask(w, h, feather * 1.2, (ctx) => {
    for (const [eye, lid] of [[IDX.rightEye, IDX.rightUnderEye], [IDX.leftEye, IDX.leftUnderEye]] as const) {
      const e = pick(points, eye);
      const ew = Math.max(...e.map((p) => p.x)) - Math.min(...e.map((p) => p.x));
      const c = points[lid];
      ctx.beginPath();
      ctx.ellipse(c.x, c.y + ew * 0.28, ew * 0.55, ew * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  const lipMask = mask(w, h, feather * 0.35, (ctx) => {
    fillPoly(ctx, pick(points, IDX.lipsOuter));
    ctx.globalCompositeOperation = "destination-out";
    fillPoly(ctx, pick(points, IDX.lipsInner));
  });
  const browMask = mask(w, h, feather * 0.3, (ctx) => {
    fillPoly(ctx, grow(pick(points, IDX.rightBrow), 1.1));
    fillPoly(ctx, grow(pick(points, IDX.leftBrow), 1.1));
  });

  const o = orig.data, b = blurred.data;
  const out = new ImageData(new Uint8ClampedArray(o), w, h);
  const d = out.data;
  const k = Math.max(0, Math.min(1, intensity));

  for (let i = 0, px = 0; i < d.length; i += 4, px++) {
    let r = o[i], g = o[i + 1], bl = o[i + 2];

    const ms = on.has("skin") ? skinMask[px] * k : 0;
    if (ms > 0) {
      // Frequency-separation-lite: smooth low frequencies, keep 40% of fine texture.
      const sr = b[i] + (r - b[i]) * 0.4, sg = b[i + 1] + (g - b[i + 1]) * 0.4, sb = b[i + 2] + (bl - b[i + 2]) * 0.4;
      r += (sr - r) * ms * 0.8; g += (sg - g) * ms * 0.8; bl += (sb - bl) * ms * 0.8;
      // Calm redness.
      const red = Math.max(0, r - (g + bl) / 2 - 30);
      r -= red * 0.25 * ms;
    }
    const me = (on.has("eyes") || on.has("skin")) ? underEyeMask[px] * k : 0;
    if (me > 0) {
      const lift = 1 + 0.12 * me;
      r *= lift; g *= lift; bl *= lift * 0.99;
    }
    const ml = on.has("lips") ? lipMask[px] * k : 0;
    if (ml > 0) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * bl;
      const sat = 1 + 0.28 * ml;
      r = gray + (r - gray) * sat; g = gray + (g - gray) * sat; bl = gray + (bl - gray) * sat;
      const shine = 1 + 0.03 * ml;
      r *= shine; g *= shine; bl *= shine;
    }
    const mb = on.has("brows") ? browMask[px] * k : 0;
    if (mb > 0) {
      const deepen = 1 - 0.14 * mb;
      r *= deepen; g *= deepen; bl *= deepen;
    }
    // Global polish: gentle contrast + warmth.
    r = 128 + (r - 128) * (1 + 0.035 * k) + 2 * k;
    g = 128 + (g - 128) * (1 + 0.035 * k);
    bl = 128 + (bl - 128) * (1 + 0.035 * k) - 1.5 * k;

    d[i] = r; d[i + 1] = g; d[i + 2] = bl;
  }

  base.ctx.putImageData(out, 0, 0);
  return base.canvas.toDataURL("image/jpeg", 0.92);
}

function drawToCanvas(img: CanvasImageSource, w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  return { canvas, ctx };
}

/**
 * Portable blur: downscale then upscale with high-quality smoothing, twice.
 * Works in every browser (unlike ctx.filter) and is fast on large images.
 */
function blurCanvas(src: HTMLCanvasElement, radius: number): HTMLCanvasElement {
  const factor = Math.max(2, Math.round(radius));
  let cur: HTMLCanvasElement = src;
  for (let pass = 0; pass < 2; pass++) {
    const sw = Math.max(1, Math.round(src.width / factor)), sh = Math.max(1, Math.round(src.height / factor));
    const small = document.createElement("canvas");
    small.width = sw; small.height = sh;
    const sctx = small.getContext("2d")!;
    sctx.imageSmoothingQuality = "high";
    sctx.drawImage(cur, 0, 0, sw, sh);
    const big = document.createElement("canvas");
    big.width = src.width; big.height = src.height;
    const bctx = big.getContext("2d", { willReadFrequently: true })!;
    bctx.imageSmoothingQuality = "high";
    bctx.drawImage(small, 0, 0, src.width, src.height);
    cur = big;
  }
  return cur;
}

/** Render a white-on-transparent mask, feather it, and return per-pixel alpha 0–1. */
function mask(w: number, h: number, feather: number, draw: (ctx: CanvasRenderingContext2D) => void): Float32Array {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  draw(ctx);
  const soft = blurCanvas(c, feather);
  const a = soft.getContext("2d")!.getImageData(0, 0, w, h).data;
  const m = new Float32Array(w * h);
  for (let i = 0; i < m.length; i++) m[i] = a[i * 4 + 3] / 255;
  return m;
}

function pick(points: Pt[], idx: readonly number[]): Pt[] {
  return idx.map((i) => points[i]);
}

function grow(poly: Pt[], s: number): Pt[] {
  const c = poly.reduce((a, p) => ({ x: a.x + p.x / poly.length, y: a.y + p.y / poly.length }), { x: 0, y: 0 });
  return poly.map((p) => ({ x: c.x + (p.x - c.x) * s, y: c.y + (p.y - c.y) * s }));
}

function fillPoly(ctx: CanvasRenderingContext2D, poly: Pt[]) {
  ctx.beginPath();
  poly.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.fill();
}
