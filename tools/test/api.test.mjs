/**
 * Drives the simulator over its real HTTP surface -- the same surface the
 * firmware exposes and the browser talks to. If these pass, the contract the
 * UI depends on is intact.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";

import { start, stop, sim, snapshot } from "../simulator/server.mjs";
import { stepThermal } from "../simulator/server.mjs";

const PORT = 8199;
const base = `http://127.0.0.1:${PORT}`;

const get = (p) => fetch(base + p).then(async (r) => [r.status, await r.json()]);
const post = (p, body) =>
  fetch(base + p, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (r) => [r.status, await r.json()]);

before(() => start(PORT));
after(() => stop());

test("serves the remote at the root", async () => {
  const res = await fetch(base + "/");
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /<title>Zephyr Bedroom A\/C<\/title>/);
  assert.match(html, /id="dial"/);
});

test("an unpaired bridge refuses to pretend it transmitted", async () => {
  const [status, body] = await post("/api/command", { power: true });
  assert.equal(status, 409);
  assert.match(body.error, /not paired/);
});

test("the pairing wizard walks candidates and locks one in", async () => {
  await post("/api/pair/start");
  let [, pair] = await get("/api/pair");
  assert.equal(pair.active, true);
  assert.equal(pair.index, 0);
  assert.equal(pair.candidate.protocol, "COOLIX");

  await post("/api/pair/next");
  await post("/api/pair/next");
  [, pair] = await get("/api/pair");
  assert.equal(pair.index, 2);
  assert.equal(pair.candidate.protocol, "LG2");

  const [status, state] = await post("/api/pair/confirm");
  assert.equal(status, 200);
  assert.equal(state.device.paired, true);
  assert.equal(state.device.protocol, "LG2");
  // Confirming adopts the probe's result: the unit is now running.
  assert.equal(state.power, true);
});

test("commands apply and are reflected in the snapshot", async () => {
  const [status, state] = await post("/api/command", {
    mode: "eco", temperature: 68, fan: "high",
  });
  assert.equal(status, 200);
  assert.equal(state.mode, "eco");
  assert.equal(state.temperature, 68);
  assert.equal(state.fan, "high");
});

test("a command out of range is clamped, not rejected", async () => {
  const [, state] = await post("/api/command", { temperature: 200 });
  assert.equal(state.temperature, 86);
});

test("each accepted command transmits exactly one frame", async () => {
  const before = sim.framesSent;
  await post("/api/command", { temperature: 70 });
  assert.equal(sim.framesSent, before + 1);
  assert.equal(sim.lastFrame.ir.degrees, 70);
  assert.equal(sim.lastFrame.ir.celsius, false);
  assert.equal(sim.lastFrame.ir.protocol, "LG2");
});

test("resync re-transmits without changing anything", async () => {
  const before = snapshot();
  const framesBefore = sim.framesSent;
  await post("/api/resync");
  const after = snapshot();
  assert.equal(sim.framesSent, framesBefore + 1);
  assert.equal(after.temperature, before.temperature);
  assert.equal(after.mode, before.mode);
});

test("an external sensor reading becomes the room temperature", async () => {
  const [status, state] = await post("/api/sensor", { temperature: 81.5, humidity: 55 });
  assert.equal(status, 200);
  assert.equal(state.telemetry.roomTemperature, 81.5);
  assert.equal(state.telemetry.humidity, 55);

  const [bad] = await post("/api/sensor", { humidity: 55 });
  assert.equal(bad, 400);
});

test("schedules round-trip and are capped at eight", async () => {
  const many = Array.from({ length: 12 }, (_, i) => ({
    enabled: true, days: 0x7f, hour: i, minute: 0,
    action: { power: true, mode: "cool", temperature: 70, fan: "auto", sleep: false },
  }));
  const [status, body] = await post("/api/schedules", { schedules: many });
  assert.equal(status, 200);
  assert.equal(body.schedules.length, 8);

  const [, fetched] = await get("/api/schedules");
  assert.equal(fetched.schedules.length, 8);
  assert.equal(fetched.schedules[3].hour, 3);

  const [bad] = await post("/api/schedules", { nope: true });
  assert.equal(bad, 400);
});

test("config round-trips and never echoes the broker password", async () => {
  await post("/api/config", { btu: 12000, eer: 11.2, mqttHost: "hass.local", mqttPass: "hunter2" });
  const [, cfg] = await get("/api/config");
  assert.equal(cfg.btu, 12000);
  assert.equal(cfg.eer, 11.2);
  assert.equal(cfg.mqttHost, "hass.local");
  assert.equal(cfg.mqttPassSet, true);
  assert.equal(cfg.mqttPass, undefined);
});

test("malformed JSON is a 400, not a crash", async () => {
  const res = await fetch(base + "/api/command", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{not json",
  });
  assert.equal(res.status, 400);
});

test("the websocket handshake completes and pushes state", async () => {
  const ws = new WebSocket(`ws://127.0.0.1:${PORT}/ws`);
  const first = await new Promise((resolve, reject) => {
    ws.onmessage = (e) => resolve(JSON.parse(e.data));
    ws.onerror = reject;
    setTimeout(() => reject(new Error("no frame within 4s")), 4000);
  });
  assert.ok(Object.hasOwn(first, "power"));
  assert.ok(Object.hasOwn(first, "telemetry"));
  assert.equal(first.device.paired, true);
  ws.close();
});

test("the thermal model cools toward the setpoint with hysteresis", () => {
  const s = {
    state: { power: true, mode: "cool", temperature: 70, fan: "high" },
    roomF: 80, outdoorF: 84, compressor: false,
    compressorSec: 0, energyKwh: 0,
    config: { btu: 8000, eer: 10.7 },
  };
  stepThermal(s, 1);
  assert.equal(s.compressor, true, "room well above setpoint should call for cooling");

  for (let i = 0; i < 2000; i++) stepThermal(s, 1);
  assert.ok(s.roomF < 72, `room should have come down, got ${s.roomF.toFixed(1)}`);
  assert.ok(s.energyKwh > 0, "running the compressor should consume energy");

  // Fan-only cannot run the compressor no matter how warm it is.
  s.state = { power: true, mode: "fan", temperature: 60, fan: "high" };
  s.roomF = 90;
  stepThermal(s, 1);
  assert.equal(s.compressor, false);
});
