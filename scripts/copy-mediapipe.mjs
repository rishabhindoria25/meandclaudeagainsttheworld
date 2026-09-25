// Self-host the MediaPipe WASM runtime so face landmarking works offline and
// without a third-party CDN. Runs on postinstall.
import { cpSync, existsSync, mkdirSync } from "node:fs";

const src = "node_modules/@mediapipe/tasks-vision/wasm";
const dest = "public/mediapipe/wasm";
if (!existsSync(src)) {
  console.warn("[glow] @mediapipe/tasks-vision not installed; skipping wasm copy");
} else {
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log(`[glow] copied MediaPipe wasm -> ${dest}`);
}
