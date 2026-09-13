import { test } from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_STATE, PROTOCOL_CANDIDATES, TEMP_MIN_F, TEMP_MAX_F,
  applyCommand, clampTemp, modeUsesSetpoint, toIrCommand,
} from "../../shared/ac-model.mjs";

test("setpoint is clamped to what the unit accepts", () => {
  assert.equal(clampTemp(40), TEMP_MIN_F);
  assert.equal(clampTemp(120), TEMP_MAX_F);
  assert.equal(clampTemp(72.4), 72);
  assert.equal(applyCommand(DEFAULT_STATE, { temperature: 200 }).temperature, TEMP_MAX_F);
  assert.equal(applyCommand(DEFAULT_STATE, { temperatureDelta: -50 }).temperature, TEMP_MIN_F);
});

test("choosing a mode implies the unit should run", () => {
  const off = { ...DEFAULT_STATE, power: false };
  assert.equal(applyCommand(off, { mode: "cool" }).power, true);
});

test("an explicit power flag beats the implied one", () => {
  const off = { ...DEFAULT_STATE, power: false };
  assert.equal(applyCommand(off, { mode: "cool", power: false }).power, false);
});

test("power toggles", () => {
  const on = applyCommand(DEFAULT_STATE, { power: "toggle" });
  assert.equal(on.power, true);
  assert.equal(applyCommand(on, { power: "toggle" }).power, false);
});

test("fan-only has no setpoint, so it cannot hold a sleep curve", () => {
  const sleeping = applyCommand(DEFAULT_STATE, { mode: "cool", sleep: true });
  assert.equal(sleeping.sleep, true);
  assert.equal(applyCommand(sleeping, { mode: "fan" }).sleep, false);
  assert.equal(modeUsesSetpoint("fan"), false);
  assert.equal(modeUsesSetpoint("eco"), true);
});

test("powering off clears the sleep curve", () => {
  const sleeping = applyCommand(DEFAULT_STATE, { mode: "cool", sleep: true });
  assert.equal(applyCommand(sleeping, { power: false }).sleep, false);
});

test("unknown fields are ignored rather than thrown", () => {
  const next = applyCommand(DEFAULT_STATE, { mode: "nonsense", fan: "turbo", bogus: 1 });
  assert.equal(next.mode, DEFAULT_STATE.mode);
  assert.equal(next.fan, DEFAULT_STATE.fan);
});

test("timer hours are bounded to the panel's range", () => {
  assert.equal(applyCommand(DEFAULT_STATE, { timerHours: 99 }).timerHours, 24);
  assert.equal(applyCommand(DEFAULT_STATE, { timerHours: -3 }).timerHours, 0);
});

test("energy saver decomposes into cool plus the econo bit", () => {
  const eco = applyCommand(DEFAULT_STATE, { mode: "eco" });
  const ir = toIrCommand(eco, PROTOCOL_CANDIDATES[0]);
  assert.equal(ir.mode, "cool");
  assert.equal(ir.econo, true);

  const plain = toIrCommand(applyCommand(DEFAULT_STATE, { mode: "cool" }), PROTOCOL_CANDIDATES[0]);
  assert.equal(plain.econo, false);
});

test("IR frames are sent in Fahrenheit, as the unit expects", () => {
  const ir = toIrCommand(applyCommand(DEFAULT_STATE, { temperature: 68 }), PROTOCOL_CANDIDATES[0]);
  assert.equal(ir.celsius, false);
  assert.equal(ir.degrees, 68);
});

test("powering off produces an off frame, not a cool frame", () => {
  const ir = toIrCommand({ ...DEFAULT_STATE, power: false }, PROTOCOL_CANDIDATES[0]);
  assert.equal(ir.power, false);
  assert.equal(ir.mode, "off");
});

test("Midea leads the candidate list and every entry is well formed", () => {
  assert.equal(PROTOCOL_CANDIDATES[0].protocol, "COOLIX");
  assert.ok(PROTOCOL_CANDIDATES.length >= 15);
  const seen = new Set();
  for (const c of PROTOCOL_CANDIDATES) {
    assert.match(c.protocol, /^[A-Z0-9_]+$/, `${c.protocol} is not a decode_type_t name`);
    assert.ok(c.oem && c.note, `${c.protocol} is missing provenance`);
    assert.ok(!seen.has(c.protocol), `${c.protocol} is listed twice`);
    seen.add(c.protocol);
  }
});
