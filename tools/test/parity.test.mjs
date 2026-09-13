/**
 * The same facts live in three places -- the shared JS model, the firmware
 * header, and the inlined table in the web UI. These tests fail loudly if any
 * of them drifts, which is the only thing keeping the browser and the ESP32
 * honest with each other.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { PROTOCOL_CANDIDATES, TEMP_MIN_F, TEMP_MAX_F } from "../../shared/ac-model.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const firmware = readFileSync(join(ROOT, "firmware", "src", "ac_model.h"), "utf8");
const ui = readFileSync(join(ROOT, "web", "index.html"), "utf8");

test("firmware and shared model agree on the temperature range", () => {
  assert.match(firmware, new RegExp(`kTempMinF = ${TEMP_MIN_F}`));
  assert.match(firmware, new RegExp(`kTempMaxF = ${TEMP_MAX_F}`));
});

test("the UI agrees on the temperature range", () => {
  assert.match(ui, new RegExp(`TEMP_MIN = ${TEMP_MIN_F}`));
  assert.match(ui, new RegExp(`TEMP_MAX = ${TEMP_MAX_F}`));
});

function firmwareCandidates() {
  const table = firmware.split("kCandidates[] = {")[1].split("};")[0];
  return [...table.matchAll(/\{"([A-Z0-9_]+)",\s*(-?\d+),/g)].map((m) => m[1]);
}
function uiCandidates() {
  const table = ui.split("const CANDIDATES = [")[1].split("].map(")[0];
  return [...table.matchAll(/\["([A-Z0-9_]+)",/g)].map((m) => m[1]);
}

test("all three candidate lists match, in the same order", () => {
  const shared = PROTOCOL_CANDIDATES.map((c) => c.protocol);
  assert.deepEqual(firmwareCandidates(), shared, "firmware/src/ac_model.h has drifted");
  assert.deepEqual(uiCandidates(), shared, "web/index.html has drifted");
});

test("every mode and fan speed the UI offers exists in the firmware", () => {
  for (const mode of ["cool", "eco", "fan", "dry"]) {
    assert.ok(firmware.includes("Mode::"), "firmware defines a Mode enum");
    assert.match(ui, new RegExp(`id: "${mode}"`), `UI is missing mode ${mode}`);
  }
  const modeCpp = readFileSync(join(ROOT, "firmware", "src", "ac_model.cpp"), "utf8");
  for (const mode of ["cool", "eco", "fan", "dry"]) {
    assert.ok(modeCpp.includes(`"${mode}"`), `firmware cannot parse mode ${mode}`);
  }
  for (const fan of ["auto", "low", "medium", "high"]) {
    assert.ok(modeCpp.includes(`"${fan}"`), `firmware cannot parse fan speed ${fan}`);
  }
});
