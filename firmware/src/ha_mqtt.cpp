#include "ha_mqtt.h"

#include <ArduinoJson.h>
#include <PubSubClient.h>
#include <WiFi.h>

#include "config.h"
#include "controller.h"
#include "store.h"

namespace {

WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);
String baseTopic;
String deviceId;
uint32_t lastAttemptMs = 0;
uint32_t lastStateMs = 0;
bool discoveryPublished = false;

String topic(const char *leaf) { return baseTopic + "/" + leaf; }

const char *haModeFor(const AcState &s) {
  if (!s.power) return "off";
  switch (s.mode) {
    case Mode::Cool: return "cool";
    // HA has no "energy saver"; eco maps onto cool with the preset flag below.
    case Mode::Eco: return "cool";
    case Mode::Fan: return "fan_only";
    case Mode::Dry: return "dry";
  }
  return "off";
}

void publishDiscovery() {
  JsonDocument doc;
  doc["name"] = "Bedroom Air Conditioner";
  doc["unique_id"] = deviceId;
  doc["object_id"] = "zephyr_ac";

  JsonArray modes = doc["modes"].to<JsonArray>();
  modes.add("off");
  modes.add("cool");
  modes.add("fan_only");
  modes.add("dry");

  JsonArray fans = doc["fan_modes"].to<JsonArray>();
  fans.add("auto");
  fans.add("low");
  fans.add("medium");
  fans.add("high");

  JsonArray presets = doc["preset_modes"].to<JsonArray>();
  presets.add("none");
  presets.add("eco");
  presets.add("sleep");

  doc["mode_command_topic"] = topic("mode/set");
  doc["mode_state_topic"] = topic("mode/state");
  doc["temperature_command_topic"] = topic("temperature/set");
  doc["temperature_state_topic"] = topic("temperature/state");
  doc["fan_mode_command_topic"] = topic("fan/set");
  doc["fan_mode_state_topic"] = topic("fan/state");
  doc["preset_mode_command_topic"] = topic("preset/set");
  doc["preset_mode_state_topic"] = topic("preset/state");
  doc["current_temperature_topic"] = topic("current_temperature");
  doc["availability_topic"] = topic("availability");

  doc["min_temp"] = kTempMinF;
  doc["max_temp"] = kTempMaxF;
  doc["temp_step"] = 1;
  doc["temperature_unit"] = "F";
  doc["precision"] = 1.0;

  JsonObject dev = doc["device"].to<JsonObject>();
  JsonArray ids = dev["identifiers"].to<JsonArray>();
  ids.add(deviceId);
  dev["name"] = "Zephyr A/C Bridge";
  dev["manufacturer"] = "Zephyr";
  dev["model"] = "ESP32 IR Bridge";
  dev["sw_version"] = ZEPHYR_VERSION;

  String payload;
  serializeJson(doc, payload);
  String cfgTopic = "homeassistant/climate/" + deviceId + "/config";
  mqtt.publish(cfgTopic.c_str(), payload.c_str(), true);
  discoveryPublished = true;
}

void handleMessage(char *rawTopic, uint8_t *payload, unsigned int length) {
  String t(rawTopic);
  String value;
  value.reserve(length + 1);
  for (unsigned int i = 0; i < length; i++) value += static_cast<char>(payload[i]);

  JsonDocument cmd;
  if (t.endsWith("/mode/set")) {
    if (value == "off") {
      cmd["power"] = false;
    } else {
      cmd["power"] = true;
      if (value == "cool") cmd["mode"] = "cool";
      else if (value == "fan_only") cmd["mode"] = "fan";
      else if (value == "dry") cmd["mode"] = "dry";
    }
  } else if (t.endsWith("/temperature/set")) {
    cmd["temperature"] = value.toFloat();
  } else if (t.endsWith("/fan/set")) {
    cmd["fan"] = value;
  } else if (t.endsWith("/preset/set")) {
    if (value == "eco") { cmd["mode"] = "eco"; cmd["sleep"] = false; }
    else if (value == "sleep") { cmd["sleep"] = true; }
    else { cmd["mode"] = "cool"; cmd["sleep"] = false; }
  } else {
    return;
  }
  controller.applyCommand(cmd.as<JsonObjectConst>());
  ha::publishState();
}

void connect() {
  const Settings &s = store.settings();
  if (!s.mqttHost[0]) return;
  if (millis() - lastAttemptMs < 5000) return;
  lastAttemptMs = millis();

  mqtt.setServer(s.mqttHost, s.mqttPort);
  mqtt.setBufferSize(1536);  // discovery payload is larger than the 256 default
  mqtt.setCallback(handleMessage);

  String willTopic = topic("availability");
  bool ok = s.mqttUser[0]
                ? mqtt.connect(deviceId.c_str(), s.mqttUser, s.mqttPass,
                               willTopic.c_str(), 0, true, "offline")
                : mqtt.connect(deviceId.c_str(), willTopic.c_str(), 0, true,
                               "offline");
  if (!ok) return;

  mqtt.publish(willTopic.c_str(), "online", true);
  mqtt.subscribe(topic("mode/set").c_str());
  mqtt.subscribe(topic("temperature/set").c_str());
  mqtt.subscribe(topic("fan/set").c_str());
  mqtt.subscribe(topic("preset/set").c_str());
  publishDiscovery();
  ha::publishState();
}

}  // namespace

namespace ha {

void begin() {
  uint64_t mac = ESP.getEfuseMac();
  char buf[24];
  snprintf(buf, sizeof(buf), "zephyr_%04x%08x", static_cast<uint16_t>(mac >> 32),
           static_cast<uint32_t>(mac));
  deviceId = buf;
  baseTopic = "zephyr/" + deviceId;
}

bool connected() { return mqtt.connected(); }

void publishState() {
  if (!mqtt.connected()) return;
  const AcState &s = controller.state();

  mqtt.publish(topic("mode/state").c_str(), haModeFor(s), true);
  mqtt.publish(topic("temperature/state").c_str(), String(s.tempF).c_str(), true);
  mqtt.publish(topic("fan/state").c_str(), fanToString(s.fan), true);
  mqtt.publish(topic("preset/state").c_str(),
               s.sleep ? "sleep" : (s.mode == Mode::Eco ? "eco" : "none"), true);
  if (controller.hasRoomTemp()) {
    mqtt.publish(topic("current_temperature").c_str(),
                 String(controller.roomTempF(), 1).c_str(), true);
  }
}

void loop() {
  if (!store.settings().mqttHost[0]) return;
  if (WiFi.status() != WL_CONNECTED) return;

  if (!mqtt.connected()) {
    discoveryPublished = false;
    connect();
    return;
  }
  mqtt.loop();

  if (millis() - lastStateMs > 10000) {
    lastStateMs = millis();
    publishState();
  }
}

}  // namespace ha
