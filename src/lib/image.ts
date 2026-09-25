"use client";

const MAX_SIDE = 1536;

/**
 * Normalize any user photo: honor EXIF orientation, downscale to a size the
 * vision model can use fully, and re-encode as JPEG — which also strips
 * EXIF metadata such as GPS location before anything leaves the device.
 */
export async function normalizePhoto(file: Blob): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("That file isn't an image.");
  if (file.size > 25 * 1024 * 1024) throw new Error("That image is over 25 MB. Try a smaller one.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("We couldn't read that image. HEIC? Try exporting it as JPEG.");
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.9);
}

/** Capture the current frame of a <video>, mirrored like a selfie preview. */
export function captureVideoFrame(video: HTMLVideoElement, mirror = true): string {
  const scale = Math.min(1, MAX_SIDE / Math.max(video.videoWidth, video.videoHeight));
  const w = Math.round(video.videoWidth * scale), h = Math.round(video.videoHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  if (mirror) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.9);
}

/** Make an "after" image match the "before" dimensions so they compare 1:1. */
export async function fitTo(src: string, w: number, h: number): Promise<string> {
  const img = new Image();
  img.src = src;
  await img.decode();
  if (img.naturalWidth === w && img.naturalHeight === h) return src;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  // Cover-fit, centered.
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  return canvas.toDataURL("image/jpeg", 0.92);
}
