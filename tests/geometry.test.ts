import { test } from "node:test";
import assert from "node:assert/strict";
import { layoutBadges, medianColor, rgbToHex, hexToRgb, luminance } from "../src/lib/face/geometry.ts";

test("layoutBadges keeps order and enforces minimum gap", () => {
  const ys = layoutBadges([100, 105, 300, 110], 30, 0, 1000);
  const sorted = [...ys].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) assert.ok(sorted[i] - sorted[i - 1] >= 30 - 1e-9);
  assert.equal(ys[0], 100); // first anchor stays put
  assert.equal(ys[2], 300); // far anchor unaffected
});

test("layoutBadges shifts the stack up when it overflows the bottom", () => {
  const ys = layoutBadges([480, 490, 495], 40, 0, 500);
  assert.ok(Math.max(...ys) <= 500);
  const s = [...ys].sort((a, b) => a - b);
  assert.ok(s[1] - s[0] >= 40 && s[2] - s[1] >= 40);
});

test("layoutBadges respects top bound", () => {
  const ys = layoutBadges([2, 5], 20, 50, 500);
  assert.ok(Math.min(...ys) >= 50);
});

test("medianColor ignores outliers and transparent pixels", () => {
  const px = new Uint8ClampedArray([
    200, 150, 120, 255,
    200, 150, 120, 255,
    255, 255, 255, 255, // specular highlight
    200, 150, 120, 255,
    0, 0, 0, 0, // transparent
  ]);
  assert.equal(medianColor(px), "#c89678");
});

test("hex helpers round-trip", () => {
  assert.equal(rgbToHex(255, 0, 128), "#ff0080");
  assert.deepEqual(hexToRgb("#ff0080"), [255, 0, 128]);
  assert.equal(hexToRgb("nope"), null);
  assert.ok(luminance("#ffffff") > 0.99 && luminance("#000000") < 0.01);
});

test("portraitCrop frames a small face in 4:5 inside the image", async () => {
  const { portraitCrop, IDX } = await import("../src/lib/face/geometry.ts");
  const pts = Array.from({ length: 478 }, () => ({ x: 500, y: 300 }));
  pts[IDX.foreheadTop] = { x: 500, y: 200 };
  pts[IDX.chin] = { x: 500, y: 400 };
  pts[IDX.faceLeft] = { x: 420, y: 300 };
  pts[IDX.faceRight] = { x: 580, y: 300 };
  const r = portraitCrop(pts, 1600, 1200)!;
  assert.ok(r);
  assert.ok(Math.abs(r.w / r.h - 0.8) < 0.01);
  assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= 1600 && r.y + r.h <= 1200);
  assert.ok(r.x < 420 && r.x + r.w > 580 && r.y < 200 && r.y + r.h > 400);
  // A face that already fills the frame isn't cropped.
  assert.equal(portraitCrop(pts, 300, 400), null);
});
