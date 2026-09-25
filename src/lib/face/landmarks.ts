"use client";

import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import type { FeatureArea } from "../schema";
import { IDX, computeAnchors, computeCrops, faceMetrics, medianColor, portraitCrop, toPixels, type Pt, type Rect } from "./geometry";

export interface FaceGeometry {
  width: number;
  height: number;
  points: Pt[];
  anchors: Record<FeatureArea, Pt>;
  crops: Record<FeatureArea, Rect>;
  faceCount: number;
  /** Share of the image width the face spans (0–1). */
  faceScale: number;
  tones: { skin: string; hair: string; lips: string; eyes: string; brows: string };
  brightness: number;
}

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

function getLandmarker(): Promise<FaceLandmarker> {
  landmarkerPromise ??= (async () => {
    const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
    const opts = (delegate: "GPU" | "CPU") => ({
      baseOptions: { modelAssetPath: "/models/face_landmarker.task", delegate },
      runningMode: "IMAGE" as const,
      numFaces: 3,
    });
    try {
      return await FaceLandmarker.createFromOptions(fileset, opts("GPU"));
    } catch {
      return await FaceLandmarker.createFromOptions(fileset, opts("CPU"));
    }
  })();
  landmarkerPromise.catch(() => (landmarkerPromise = null));
  return landmarkerPromise;
}

/** Start downloading the model early (e.g. when the upload screen mounts). */
export function preloadLandmarker() {
  void getLandmarker().catch(() => {});
}

export async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  await img.decode();
  return img;
}

export async function detectFace(src: string): Promise<FaceGeometry | null> {
  const [landmarker, img] = await Promise.all([getLandmarker(), loadImage(src)]);
  const w = img.naturalWidth, h = img.naturalHeight;
  const res = landmarker.detect(img);
  if (!res.faceLandmarks.length) return null;

  // Use the largest face.
  const faces = res.faceLandmarks.map((f) => toPixels(f, w, h));
  const points = faces.reduce((best, f) => (faceMetrics(f).faceW > faceMetrics(best).faceW ? f : best));
  const { faceW } = faceMetrics(points);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);

  const sample = (p: Pt, r: number) => {
    const x = Math.round(Math.max(0, p.x - r)), y = Math.round(Math.max(0, p.y - r));
    const size = Math.max(2, Math.round(r * 2));
    return medianColor(ctx.getImageData(x, y, Math.min(size, w - x), Math.min(size, h - y)).data);
  };
  const r = faceW * 0.03;
  const mid = (a: number, b: number): Pt => ({ x: (points[a].x + points[b].x) / 2, y: (points[a].y + points[b].y) / 2 });
  const { faceH } = faceMetrics(points);
  const top = points[IDX.foreheadTop];

  const tones = {
    skin: sample(points[IDX.leftCheek], r * 1.4),
    hair: sample({ x: top.x, y: top.y - faceH * 0.16 }, r),
    // Midway between the inner and outer edge of the lower lip.
    lips: sample(mid(14, 17), r * 0.5),
    eyes: points[IDX.rightIris] ? sample(points[IDX.rightIris], faceW * 0.008) : "#5a4636",
    // Center of the brow body (between its upper and lower edge).
    brows: sample(mid(105, 52), r * 0.35),
  };

  // Mean luma of the face box for a lighting check.
  const box = { x: Math.max(0, points[IDX.faceLeft].x), y: Math.max(0, top.y), w: faceW, h: faceH };
  const data = ctx.getImageData(Math.round(box.x), Math.round(box.y), Math.max(1, Math.round(Math.min(box.w, w - box.x))), Math.max(1, Math.round(Math.min(box.h, h - box.y)))).data;
  let luma = 0;
  for (let i = 0; i < data.length; i += 16) luma += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  const brightness = luma / (data.length / 16) / 255;

  return {
    width: w,
    height: h,
    points,
    anchors: computeAnchors(points, w, h),
    crops: computeCrops(points, w, h),
    faceCount: faces.length,
    faceScale: faceW / w,
    tones,
    brightness,
  };
}

/** Human-readable photo quality hints, in priority order. */
export function qualityIssues(g: FaceGeometry | null): string[] {
  if (!g) return ["We couldn't find a face. Try a well-lit, front-facing selfie."];
  const issues: string[] = [];
  if (g.faceCount > 1) issues.push("More than one face detected — we'll focus on the largest one.");
  if (g.faceScale < 0.18) issues.push("Your face is quite small in the frame. Move closer for sharper detail.");
  if (g.brightness < 0.22) issues.push("The photo is a little dark. Face a window for best results.");
  if (g.brightness > 0.85) issues.push("The photo is very bright. Softer light will capture more detail.");
  return issues;
}

/** Crop a region of an image to a data URL (for detail tiles). */
export async function cropToDataUrl(src: string, rect: Rect, outW = 480): Promise<string> {
  const img = await loadImage(src);
  const outH = Math.round((outW * rect.h) / rect.w);
  const c = document.createElement("canvas");
  c.width = outW;
  c.height = outH;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, 0, 0, outW, outH);
  return c.toDataURL("image/jpeg", 0.9);
}

/**
 * Reframe a wide photo to a 4:5 portrait around the face so the face gets the
 * pixels — for the vision model, the retouch and the report. Geometry is
 * shifted rather than re-detected, so it stays exact.
 */
export async function reframe(src: string, geo: FaceGeometry): Promise<{ src: string; geo: FaceGeometry }> {
  const rect = portraitCrop(geo.points, geo.width, geo.height);
  if (!rect) return { src, geo };
  const out = await cropToDataUrl(src, rect, rect.w);
  const points = geo.points.map((p) => ({ x: p.x - rect.x, y: p.y - rect.y }));
  return {
    src: out,
    geo: {
      ...geo,
      width: rect.w,
      height: rect.h,
      points,
      anchors: computeAnchors(points, rect.w, rect.h),
      crops: computeCrops(points, rect.w, rect.h),
      faceScale: faceMetrics(points).faceW / rect.w,
    },
  };
}
