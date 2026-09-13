#!/usr/bin/env node
/**
 * Zephyr simulator - a stand-in for the ESP32 bridge.
 *
 * Speaks the same HTTP + WebSocket API as firmware/, serves the real
 * web/index.html, and runs a thermal model of the room. Lets you develop and
 * test the whole remote before the hardware exists -- and lets CI exercise the
 * UI against something that behaves like the real thing.
 *
 *   node tools/simulator/server.mjs [--port 8080]
 *
 * No dependencies: the WebSocket handshake and framing are implemented inline
 * (text frames only, which is all the protocol here needs).
 */
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  DEFAULT_STATE, PROTOCOL_CANDIDATES, TEMP_MIN_F, TEMP_MAX_F,
  applyCommand, modeUsesSetpoint, toIrCommand,
} from "../../shared/ac-model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");

const argPort = process.argv.indexOf("--port");
const PORT = argPort > -1 ? Number(process.argv[argPort + 1]) : 8080;

// ------------------------------------------------------------------ model --

const sim = {
  state: { ...DEFAULT_STATE },
  outdoorF: 84,
  roomF: 78.4,
  humidity: 48,
  compressor: false,
  compressorSec: 0,
  energyKwh: 0,
  framesSent: 0,
  lastFrame: null,
  paired: false,
  protocol: "",
  protocolModel: -1,
  pairing: { active: false, index: 0 },
  config: {
    btu: 8000, eer: 10.7, costPerKwh: 0.24,
    timezone: "EST5EDT,M3.2.0,M11.1.0",
    mqttHost: "", mqttPort: 1883, mqttUser: "", mqttPassSet: false,
  },
  schedules: [],
  startedAt: Date.now(),
};

/** One step of the room's thermal behaviour. dt is in seconds. */
export function stepThermal(s, dt) {
  s.roomF += (s.outdoorF - s.roomF) * 0.0009 * dt;

  const cooling = s.state.power && modeUsesSetpoint(s.state.mode);
  if (cooling) {
    // Real units run several degrees of hysteresis; ±0.7 °F is representative.
    if (s.roomF > s.state.temperature + 0.7) s.compressor = true;
    else if (s.roomF < s.state.temperature - 0.7) s.compressor = false;
  } else {
    s.compressor = false;
  }

  if (s.compressor) {
    const rate = { auto: 0.011, low: 0.007, medium: 0.010, high: 0.014 }[s.state.fan] ?? 0.010;
    s.roomF -= rate * dt * (s.state.mode === "eco" ? 0.85 : 1);
    s.compressorSec += dt;
    s.energyKwh += (s.config.btu / s.config.eer) * dt / 3_600_000;
  }
  return s;
}

function snapshot() {
  return {
    ...sim.state,
    telemetry: {
      roomTemperature: Math.round(sim.roomF * 10) / 10,
      humidity: sim.humidity,
      compressorSeconds: Math.round(sim.compressorSec),
      energyKwh: sim.energyKwh,
      estimatedCost: sim.energyKwh * sim.config.costPerKwh,
      timerRemainingSec: 0,
      sleepOffsetF: 0,
      compressorOn: sim.compressor,
    },
    device: {
      version: "sim-1.0.0",
      paired: sim.paired,
      protocol: sim.protocol,
      protocolModel: sim.protocolModel,
      framesSent: sim.framesSent,
      pendingSend: false,
      ip: `127.0.0.1:${PORT}`,
      rssi: -48,
      setupMode: false,
      timeValid: true,
      uptimeSec: Math.round((Date.now() - sim.startedAt) / 1000),
      freeHeap: 214000,
    },
  };
}

/** Stand-in for actually blasting IR: record what would have gone out. */
function transmit(label = "state") {
  if (!sim.paired && label === "state") return false;
  sim.framesSent++;
  sim.lastFrame = {
    at: new Date().toISOString(),
    label,
    ir: toIrCommand(sim.state, { protocol: sim.protocol || "COOLIX", model: sim.protocolModel }),
  };
  return true;
}

// -------------------------------------------------------------- websocket --

const sockets = new Set();
const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

function wsAccept(key) {
  return createHash("sha1").update(key + WS_GUID).digest("base64");
}

/** Encode a text frame. Server-to-client frames are never masked. */
function wsFrame(text) {
  const payload = Buffer.from(text, "utf8");
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.from([0x81, len]);
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81; header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81; header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payload]);
}

function broadcast() {
  if (!sockets.size) return;
  const frame = wsFrame(JSON.stringify(snapshot()));
  for (const s of sockets) {
    if (s.writable) s.write(frame);
    else sockets.delete(s);
  }
}

// ------------------------------------------------------------------ routes --

const json = (res, code, body) => {
  const text = JSON.stringify(body);
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  });
  res.end(text);
};

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { return null; }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  if (path === "/" || path === "/index.html") {
    const html = await readFile(join(ROOT, "web", "index.html"));
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    return res.end(html);
  }

  if (path === "/api/state") return json(res, 200, snapshot());

  if (path === "/api/protocols") {
    return json(res, 200, {
      candidates: PROTOCOL_CANDIDATES.map((c) => ({ ...c, supported: true })),
    });
  }

  if (path === "/api/schedules" && req.method === "GET") {
    return json(res, 200, { schedules: sim.schedules });
  }

  if (path === "/api/pair" && req.method === "GET") {
    const c = PROTOCOL_CANDIDATES[sim.pairing.index];
    return json(res, 200, {
      active: sim.pairing.active,
      index: sim.pairing.index,
      total: PROTOCOL_CANDIDATES.length,
      paired: sim.paired,
      protocol: sim.protocol,
      candidate: c ? { protocol: c.protocol, oem: c.oem, model: c.model } : null,
    });
  }

  if (path === "/api/config" && req.method === "GET") {
    return json(res, 200, { ...sim.config, protocol: sim.protocol });
  }

  if (req.method !== "POST") {
    res.writeHead(302, { Location: "/" });
    return res.end();
  }

  const body = await readBody(req);
  if (body === null) return json(res, 400, { error: "invalid json" });

  switch (path) {
    case "/api/command": {
      sim.state = applyCommand(sim.state, body);
      const sent = transmit();
      broadcast();
      if (!sent) return json(res, 409, { error: "not paired - run the pairing wizard first" });
      return json(res, 200, snapshot());
    }
    case "/api/sensor": {
      if (typeof body.temperature !== "number") {
        return json(res, 400, { error: "temperature required" });
      }
      sim.roomF = body.temperature;
      if (typeof body.humidity === "number") sim.humidity = body.humidity;
      broadcast();
      return json(res, 200, snapshot());
    }
    case "/api/resync":
      transmit("resync");
      broadcast();
      return json(res, 200, snapshot());

    case "/api/energy/reset":
      sim.energyKwh = 0;
      sim.compressorSec = 0;
      broadcast();
      return json(res, 200, snapshot());

    case "/api/pair/start":
      sim.pairing = { active: true, index: 0 };
      transmit("probe");
      broadcast();
      return json(res, 200, snapshot());

    case "/api/pair/probe":
      if (!sim.pairing.active) return json(res, 409, { error: "no pairing session" });
      transmit("probe");
      return json(res, 200, snapshot());

    case "/api/pair/next":
      if (sim.pairing.index + 1 >= PROTOCOL_CANDIDATES.length) {
        return json(res, 409, { error: "no further candidates" });
      }
      sim.pairing.index++;
      transmit("probe");
      broadcast();
      return json(res, 200, snapshot());

    case "/api/pair/prev":
      sim.pairing.index = Math.max(0, sim.pairing.index - 1);
      transmit("probe");
      broadcast();
      return json(res, 200, snapshot());

    case "/api/pair/confirm": {
      const c = PROTOCOL_CANDIDATES[sim.pairing.index];
      sim.paired = true;
      sim.protocol = c.protocol;
      sim.protocolModel = c.model;
      sim.pairing.active = false;
      // The probe powered the unit on, so adopt that.
      sim.state = applyCommand(sim.state, { power: true });
      broadcast();
      return json(res, 200, snapshot());
    }
    case "/api/pair/stop":
      sim.pairing.active = false;
      broadcast();
      return json(res, 200, snapshot());

    case "/api/pair/manual": {
      const found = PROTOCOL_CANDIDATES.find((c) => c.protocol === body.protocol);
      if (!found) return json(res, 400, { error: "unknown or unsupported protocol" });
      sim.paired = true;
      sim.protocol = found.protocol;
      sim.protocolModel = body.model ?? -1;
      broadcast();
      return json(res, 200, snapshot());
    }
    case "/api/config":
      Object.assign(sim.config, body);
      if (body.mqttPass) sim.config.mqttPassSet = true;
      delete sim.config.mqttPass;
      return json(res, 200, { ok: true, rebootRequired: false });

    case "/api/schedules":
      if (!Array.isArray(body.schedules)) {
        return json(res, 400, { error: "schedules array required" });
      }
      sim.schedules = body.schedules.slice(0, 8);
      return json(res, 200, { schedules: sim.schedules });

    default:
      return json(res, 404, { error: "not found" });
  }
});

server.on("upgrade", (req, socket) => {
  const key = req.headers["sec-websocket-key"];
  if (!key || req.headers.upgrade?.toLowerCase() !== "websocket") {
    socket.destroy();
    return;
  }
  socket.write(
    "HTTP/1.1 101 Switching Protocols\r\n" +
    "Upgrade: websocket\r\n" +
    "Connection: Upgrade\r\n" +
    `Sec-WebSocket-Accept: ${wsAccept(key)}\r\n\r\n`
  );
  socket.setNoDelay(true);
  sockets.add(socket);
  socket.write(wsFrame(JSON.stringify(snapshot())));
  socket.on("close", () => sockets.delete(socket));
  socket.on("error", () => sockets.delete(socket));
  // Incoming frames are ignored: the browser only ever listens on this socket.
  socket.on("data", () => {});
});

let last = Date.now();
const ticker = setInterval(() => {
  const now = Date.now();
  stepThermal(sim, (now - last) / 1000);
  last = now;
  broadcast();
}, 1000);

export function start(port = PORT) {
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}
export function stop() {
  clearInterval(ticker);
  for (const s of sockets) s.destroy();
  return new Promise((resolve) => server.close(resolve));
}
export { sim, snapshot };

// Only listen when run directly, so tests can import and control the lifecycle.
if (process.argv[1] && process.argv[1].endsWith("server.mjs")) {
  await start();
  console.log(`Zephyr simulator listening on http://localhost:${PORT}/`);
  console.log("The remote is served at that address. Ctrl-C to stop.");
}
