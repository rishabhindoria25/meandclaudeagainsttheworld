#include "api.h"

#include <AsyncTCP.h>
#include <ArduinoJson.h>
#include <ESPAsyncWebServer.h>
#include <IRutils.h>

#include "config.h"
#include "controller.h"
#include "ir_engine.h"
#include "net.h"
#include "scheduler.h"
#include "store.h"
#include "web_asset.h"

namespace {

AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

uint32_t lastBroadcastMs = 0;
bool broadcastQueued = false;

void sendJson(AsyncWebServerRequest *req, int code, JsonDocument &doc) {
  String body;
  serializeJson(doc, body);
  AsyncWebServerResponse *res = req->beginResponse(code, "application/json", body);
  // The UI is served from the device itself, but people also open it from a
  // desktop dev server, so keep the API reachable cross-origin on the LAN.
  res->addHeader("Access-Control-Allow-Origin", "*");
  req->send(res);
}

void sendError(AsyncWebServerRequest *req, int code, const char *message) {
  JsonDocument doc;
  doc["error"] = message;
  sendJson(req, code, doc);
}

void sendStateResponse(AsyncWebServerRequest *req) {
  JsonDocument doc;
  controller.serializeState(doc.to<JsonObject>());
  sendJson(req, 200, doc);
}

// ESPAsyncWebServer delivers POST bodies in chunks, then calls the request
// handler once the last one lands. Accumulate into the request's _tempObject
// and do the work in the request handler -- responding from inside the body
// callback races the request lifecycle.
//
// _tempObject must be malloc'd, not new'd: ~AsyncWebServerRequest() releases it
// with free(), so a C++ object parked there would never run its destructor.
struct BodyHandler {
  using Fn = std::function<void(AsyncWebServerRequest *, JsonDocument &)>;
};

const size_t kMaxBodyBytes = 8192;

void attachJsonPost(const char *path, BodyHandler::Fn handler) {
  server.on(
      path, HTTP_POST,
      [handler](AsyncWebServerRequest *req) {
        const char *buf = static_cast<const char *>(req->_tempObject);
        if (!buf) {
          // No body arrived, or it was refused for size. An empty object is a
          // legitimate no-op command, so treat a missing body as one.
          JsonDocument empty;
          empty.to<JsonObject>();
          handler(req, empty);
          return;
        }
        JsonDocument doc;
        if (deserializeJson(doc, buf)) {
          sendError(req, 400, "invalid json");
          return;
        }
        handler(req, doc);
        // Left for ~AsyncWebServerRequest() to free, so an aborted upload
        // cannot leak the buffer.
      },
      nullptr,
      [](AsyncWebServerRequest *req, uint8_t *data, size_t len, size_t index,
         size_t total) {
        if (index == 0) {
          if (total == 0 || total > kMaxBodyBytes) return;
          req->_tempObject = malloc(total + 1);
          if (req->_tempObject) static_cast<char *>(req->_tempObject)[0] = '\0';
        }
        char *buf = static_cast<char *>(req->_tempObject);
        if (!buf || index + len > total) return;
        memcpy(buf + index, data, len);
        buf[index + len] = '\0';
      });
}

// ------------------------------------------------------------- schedules ---

void serializeSchedules(JsonArray arr) {
  for (uint8_t i = 0; i < kMaxSchedules; i++) {
    const Schedule &sc = store.settings().schedules[i];
    JsonObject o = arr.add<JsonObject>();
    o["id"] = i;
    o["enabled"] = sc.enabled;
    o["days"] = sc.days;
    o["hour"] = sc.hour;
    o["minute"] = sc.minute;
    o["label"] = sc.label;
    JsonObject a = o["action"].to<JsonObject>();
    a["power"] = sc.action.power;
    a["mode"] = modeToString(sc.action.mode);
    a["temperature"] = sc.action.tempF;
    a["fan"] = fanToString(sc.action.fan);
    a["sleep"] = sc.action.sleep;
  }
}

void applyScheduleJson(Schedule &sc, JsonObjectConst o) {
  sc.enabled = o["enabled"] | sc.enabled;
  sc.days = o["days"] | sc.days;
  sc.hour = o["hour"] | sc.hour;
  sc.minute = o["minute"] | sc.minute;
  if (o["label"].is<const char *>()) {
    strlcpy(sc.label, o["label"].as<const char *>(), sizeof(sc.label));
  }
  JsonObjectConst a = o["action"];
  if (!a.isNull()) {
    sc.action.power = a["power"] | sc.action.power;
    if (a["mode"].is<const char *>())
      sc.action.mode = modeFromString(a["mode"].as<const char *>(), sc.action.mode);
    if (a["fan"].is<const char *>())
      sc.action.fan = fanFromString(a["fan"].as<const char *>(), sc.action.fan);
    if (a["temperature"].is<int>())
      sc.action.tempF = clampTempF(a["temperature"].as<int>());
    sc.action.sleep = a["sleep"] | sc.action.sleep;
  }
}

// --------------------------------------------------------------- routes ---

void registerRoutes() {
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *req) {
    AsyncWebServerResponse *res = req->beginResponse(
        200, "text/html", kWebAssetGzip, kWebAssetGzipSize);
    res->addHeader("Content-Encoding", "gzip");
    res->addHeader("Cache-Control", "public, max-age=300");
    req->send(res);
  });

  // Captive-portal-ish niceties so phones land on the UI in setup mode.
  server.on("/generate_204", HTTP_GET,
            [](AsyncWebServerRequest *req) { req->redirect("/"); });
  server.on("/hotspot-detect.html", HTTP_GET,
            [](AsyncWebServerRequest *req) { req->redirect("/"); });

  server.on("/api/state", HTTP_GET, sendStateResponse);

  server.on("/api/protocols", HTTP_GET, [](AsyncWebServerRequest *req) {
    JsonDocument doc;
    JsonArray arr = doc["candidates"].to<JsonArray>();
    for (size_t i = 0; i < kCandidateCount; i++) {
      JsonObject o = arr.add<JsonObject>();
      o["protocol"] = kCandidates[i].name;
      o["model"] = kCandidates[i].model;
      o["oem"] = kCandidates[i].oem;
      o["supported"] = IRac::isProtocolSupported(strToDecodeType(kCandidates[i].name));
    }
    sendJson(req, 200, doc);
  });

  server.on("/api/schedules", HTTP_GET, [](AsyncWebServerRequest *req) {
    JsonDocument doc;
    serializeSchedules(doc["schedules"].to<JsonArray>());
    sendJson(req, 200, doc);
  });

  server.on("/api/pair", HTTP_GET, [](AsyncWebServerRequest *req) {
    JsonDocument doc;
    const PairingSession &s = irEngine.pairing();
    doc["active"] = s.active;
    doc["index"] = s.index;
    doc["total"] = kCandidateCount;
    doc["probesSent"] = s.probesSent;
    doc["probePowersOn"] = s.probePowersOn;
    doc["paired"] = irEngine.isPaired();
    doc["protocol"] = irEngine.protocolName();
    const ProtocolCandidate *c = irEngine.pairingCandidate();
    if (c) {
      doc["candidate"]["protocol"] = c->name;
      doc["candidate"]["oem"] = c->oem;
      doc["candidate"]["model"] = c->model;
    }
    sendJson(req, 200, doc);
  });

  attachJsonPost("/api/command", [](AsyncWebServerRequest *req, JsonDocument &doc) {
    if (!irEngine.isPaired()) {
      // Still apply it: the shadow stays usable and the UI can show intent,
      // but be explicit that nothing went out over the air.
      controller.applyCommand(doc.as<JsonObjectConst>());
      sendError(req, 409, "not paired - run the pairing wizard first");
      return;
    }
    controller.applyCommand(doc.as<JsonObjectConst>());
    sendStateResponse(req);
  });

  attachJsonPost("/api/sensor", [](AsyncWebServerRequest *req, JsonDocument &doc) {
    if (!doc["temperature"].is<float>()) {
      sendError(req, 400, "temperature required");
      return;
    }
    controller.setRoomTemp(doc["temperature"].as<float>(),
                           doc["humidity"].is<float>()
                               ? doc["humidity"].as<float>()
                               : NAN);
    sendStateResponse(req);
  });

  server.on("/api/resync", HTTP_POST, [](AsyncWebServerRequest *req) {
    controller.resync();
    sendStateResponse(req);
  });

  server.on("/api/energy/reset", HTTP_POST, [](AsyncWebServerRequest *req) {
    controller.resetEnergy();
    sendStateResponse(req);
  });

  // --- pairing wizard ---
  server.on("/api/pair/start", HTTP_POST, [](AsyncWebServerRequest *req) {
    irEngine.pairingStart();
    irEngine.pairingProbe(controller.state());
    sendStateResponse(req);
  });
  server.on("/api/pair/probe", HTTP_POST, [](AsyncWebServerRequest *req) {
    if (!irEngine.pairingProbe(controller.state())) {
      sendError(req, 409, "no pairing session");
      return;
    }
    sendStateResponse(req);
  });
  server.on("/api/pair/next", HTTP_POST, [](AsyncWebServerRequest *req) {
    if (!irEngine.pairingNext()) {
      sendError(req, 409, "no further candidates");
      return;
    }
    irEngine.pairingProbe(controller.state());
    sendStateResponse(req);
  });
  server.on("/api/pair/prev", HTTP_POST, [](AsyncWebServerRequest *req) {
    irEngine.pairingPrev();
    irEngine.pairingProbe(controller.state());
    sendStateResponse(req);
  });
  server.on("/api/pair/confirm", HTTP_POST, [](AsyncWebServerRequest *req) {
    if (!irEngine.pairingConfirm()) {
      sendError(req, 409, "could not lock in that protocol");
      return;
    }
    // The probe left the unit powered the opposite way round; adopt that as
    // truth so the UI matches the room.
    AcState s = controller.state();
    s.power = irEngine.pairing().probePowersOn;
    controller.setState(s, false);

    strlcpy(store.settings().protocol, irEngine.protocolName(),
            sizeof(store.settings().protocol));
    store.settings().protocolModel = irEngine.protocolModel();
    store.save();
    sendStateResponse(req);
  });
  server.on("/api/pair/stop", HTTP_POST, [](AsyncWebServerRequest *req) {
    irEngine.pairingStop();
    sendStateResponse(req);
  });

  attachJsonPost("/api/pair/manual", [](AsyncWebServerRequest *req, JsonDocument &doc) {
    const char *name = doc["protocol"] | "";
    int16_t model = doc["model"] | -1;
    if (!irEngine.setProtocol(name, model)) {
      sendError(req, 400, "unknown or unsupported protocol");
      return;
    }
    strlcpy(store.settings().protocol, irEngine.protocolName(),
            sizeof(store.settings().protocol));
    store.settings().protocolModel = model;
    store.save();
    sendStateResponse(req);
  });

  // --- configuration ---
  server.on("/api/config", HTTP_GET, [](AsyncWebServerRequest *req) {
    const Settings &s = store.settings();
    JsonDocument doc;
    doc["wifiSsid"] = s.wifiSsid;
    doc["timezone"] = s.timezone;
    doc["btu"] = s.btu;
    doc["eer"] = s.eer;
    doc["costPerKwh"] = s.costPerKwh;
    doc["mqttHost"] = s.mqttHost;
    doc["mqttPort"] = s.mqttPort;
    doc["mqttUser"] = s.mqttUser;
    // Passwords are write-only; report presence, never the value.
    doc["mqttPassSet"] = s.mqttPass[0] != 0;
    doc["protocol"] = s.protocol;
    sendJson(req, 200, doc);
  });

  attachJsonPost("/api/config", [](AsyncWebServerRequest *req, JsonDocument &doc) {
    Settings &s = store.settings();
    bool needsReboot = false;

    if (doc["wifiSsid"].is<const char *>()) {
      strlcpy(s.wifiSsid, doc["wifiSsid"], sizeof(s.wifiSsid));
      needsReboot = true;
    }
    if (doc["wifiPass"].is<const char *>()) {
      strlcpy(s.wifiPass, doc["wifiPass"], sizeof(s.wifiPass));
      needsReboot = true;
    }
    if (doc["timezone"].is<const char *>())
      strlcpy(s.timezone, doc["timezone"], sizeof(s.timezone));
    if (doc["btu"].is<int>()) s.btu = doc["btu"];
    if (doc["eer"].is<float>()) s.eer = doc["eer"];
    if (doc["costPerKwh"].is<float>()) s.costPerKwh = doc["costPerKwh"];
    if (doc["mqttHost"].is<const char *>()) {
      strlcpy(s.mqttHost, doc["mqttHost"], sizeof(s.mqttHost));
      needsReboot = true;
    }
    if (doc["mqttPort"].is<int>()) s.mqttPort = doc["mqttPort"];
    if (doc["mqttUser"].is<const char *>())
      strlcpy(s.mqttUser, doc["mqttUser"], sizeof(s.mqttUser));
    if (doc["mqttPass"].is<const char *>())
      strlcpy(s.mqttPass, doc["mqttPass"], sizeof(s.mqttPass));

    store.save();

    JsonDocument out;
    out["ok"] = true;
    out["rebootRequired"] = needsReboot;
    sendJson(req, 200, out);
  });

  attachJsonPost("/api/schedules", [](AsyncWebServerRequest *req, JsonDocument &doc) {
    JsonArrayConst arr = doc["schedules"];
    if (arr.isNull()) {
      sendError(req, 400, "schedules array required");
      return;
    }
    uint8_t i = 0;
    for (JsonObjectConst o : arr) {
      if (i >= kMaxSchedules) break;
      applyScheduleJson(store.settings().schedules[i], o);
      i++;
    }
    // Anything past the submitted list is cleared, so deletes work.
    for (; i < kMaxSchedules; i++) store.settings().schedules[i] = Schedule();
    store.save();

    JsonDocument out;
    serializeSchedules(out["schedules"].to<JsonArray>());
    sendJson(req, 200, out);
  });

  server.on("/api/reboot", HTTP_POST, [](AsyncWebServerRequest *req) {
    req->send(200, "application/json", "{\"ok\":true}");
    // Let the response actually leave before the reset.
    delay(250);
    ESP.restart();
  });

  server.on("/api/factory-reset", HTTP_POST, [](AsyncWebServerRequest *req) {
    store.factoryReset();
    req->send(200, "application/json", "{\"ok\":true}");
    delay(250);
    ESP.restart();
  });

  server.onNotFound([](AsyncWebServerRequest *req) {
    if (req->method() == HTTP_OPTIONS) {
      AsyncWebServerResponse *res = req->beginResponse(204);
      res->addHeader("Access-Control-Allow-Origin", "*");
      res->addHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      res->addHeader("Access-Control-Allow-Headers", "Content-Type");
      req->send(res);
      return;
    }
    req->redirect("/");
  });
}

void onWsEvent(AsyncWebSocket *srv, AsyncWebSocketClient *client,
               AwsEventType type, void *arg, uint8_t *data, size_t len) {
  if (type == WS_EVT_CONNECT) {
    JsonDocument doc;
    controller.serializeState(doc.to<JsonObject>());
    String body;
    serializeJson(doc, body);
    client->text(body);
  }
}

}  // namespace

namespace api {

void begin() {
  ws.onEvent(onWsEvent);
  server.addHandler(&ws);
  registerRoutes();
  server.begin();

  controller.onChange([]() { broadcastQueued = true; });
}

void broadcastState() {
  if (ws.count() == 0) return;
  JsonDocument doc;
  controller.serializeState(doc.to<JsonObject>());
  String body;
  serializeJson(doc, body);
  ws.textAll(body);
}

void loop() {
  ws.cleanupClients();

  uint32_t now = millis();
  // Coalesce pushes: a flurry of changes becomes one frame, and idle clients
  // still get a heartbeat so telemetry counters tick along.
  bool due = broadcastQueued && (now - lastBroadcastMs > 120);
  bool heartbeat = now - lastBroadcastMs > 2000;
  if (due || heartbeat) {
    broadcastQueued = false;
    lastBroadcastMs = now;
    broadcastState();
  }
}

}  // namespace api
