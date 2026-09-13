#include "controller.h"

#include "config.h"
#include "ir_engine.h"
#include "net.h"
#include "scheduler.h"
#include "store.h"

Controller controller;

void Controller::begin() {
  state_ = store.settings().lastState;
  lastAccrualMs_ = millis();
}

void Controller::setState(const AcState &s, bool transmit) {
  AcState next = s;
  next.tempF = clampTempF(next.tempF);
  if (!modeUsesSetpoint(next.mode)) next.sleep = false;
  if (!next.power) next.sleep = false;

  bool sleepTurnedOn = next.sleep && !state_.sleep;
  bool sleepTurnedOff = !next.sleep && state_.sleep;
  bool changed = next != state_;
  state_ = next;

  if (sleepTurnedOn) scheduler.startSleep(state_.tempF);
  if (sleepTurnedOff) scheduler.cancelSleep();

  if (changed) {
    store.settings().lastState = state_;
    store.markDirty();
  }
  if (transmit) irEngine.request(state_);
  if (changed) notify();
}

bool Controller::applyCommand(JsonObjectConst cmd) {
  AcState next = state_;

  if (cmd["power"].is<bool>()) {
    next.power = cmd["power"].as<bool>();
  } else if (cmd["power"].is<const char *>() &&
             !strcmp(cmd["power"].as<const char *>(), "toggle")) {
    next.power = !next.power;
  }

  if (cmd["mode"].is<const char *>()) {
    next.mode = modeFromString(cmd["mode"].as<const char *>(), next.mode);
    // Picking a mode means you want it running.
    if (!cmd["power"].is<bool>()) next.power = true;
  }

  if (cmd["fan"].is<const char *>()) {
    next.fan = fanFromString(cmd["fan"].as<const char *>(), next.fan);
  }

  if (cmd["temperature"].is<float>()) {
    next.tempF = clampTempF(static_cast<int>(roundf(cmd["temperature"].as<float>())));
  }
  if (cmd["temperatureDelta"].is<float>()) {
    next.tempF = clampTempF(next.tempF +
                            static_cast<int>(roundf(cmd["temperatureDelta"].as<float>())));
  }

  if (cmd["sleep"].is<bool>()) next.sleep = cmd["sleep"].as<bool>();

  if (cmd["timerHours"].is<int>()) {
    int h = cmd["timerHours"].as<int>();
    if (h < 0) h = 0;
    if (h > 24) h = 24;
    next.timerHours = static_cast<uint8_t>(h);
    if (h == 0) {
      scheduler.cancelTimer();
    } else {
      // The delay timer always aims at the opposite of the current power state:
      // running -> turn off in N hours, idle -> turn on in N hours. That is how
      // the panel's own "Delay Hrs" control behaves.
      scheduler.startTimer(static_cast<uint8_t>(h), !next.power);
    }
  }

  bool changed = next != state_;
  setState(next, true);
  return changed;
}

void Controller::resync() { irEngine.request(state_); }

void Controller::setRoomTemp(float f, float humidity) {
  roomTempF_ = f;
  if (!isnan(humidity)) humidity_ = humidity;
  roomTempAgeMs_ = millis();
  notify();
}

void Controller::accrueEnergy() {
  uint32_t now = millis();
  uint32_t elapsed = now - lastAccrualMs_;
  if (elapsed < 1000) return;
  lastAccrualMs_ = now;

  // Fan-only draws a rounding error next to the compressor, so only count modes
  // that can actually run it. This is an estimate from the nameplate rating,
  // not a measurement -- there is no current sensor in this build.
  if (!state_.power || !modeUsesSetpoint(state_.mode)) return;

  float seconds = elapsed / 1000.0f;
  compressorSec_ += static_cast<uint32_t>(seconds);

  const Settings &s = store.settings();
  float watts = (s.eer > 0.1f) ? (s.btu / s.eer) : 800.0f;
  energyKwh_ += (watts * seconds) / 3600000.0f;
}

float Controller::estimatedCost() const {
  return energyKwh_ * store.settings().costPerKwh;
}

void Controller::resetEnergy() {
  energyKwh_ = 0.0f;
  compressorSec_ = 0;
  notify();
}

void Controller::loop() {
  accrueEnergy();

  AcState next = state_;
  if (scheduler.loop(next) && next != state_) {
    setState(next, true);
  }
}

void Controller::serializeState(JsonObject out) const {
  out["power"] = state_.power;
  out["mode"] = modeToString(state_.mode);
  out["temperature"] = state_.tempF;
  out["fan"] = fanToString(state_.fan);
  out["timerHours"] = state_.timerHours;
  out["sleep"] = state_.sleep;

  JsonObject t = out["telemetry"].to<JsonObject>();
  if (hasRoomTemp()) t["roomTemperature"] = roomTempF_;
  if (!isnan(humidity_)) t["humidity"] = humidity_;
  t["compressorSeconds"] = compressorSec_;
  t["energyKwh"] = energyKwh_;
  t["estimatedCost"] = estimatedCost();
  t["timerRemainingSec"] = scheduler.timerRemainingSec();
  t["sleepOffsetF"] = scheduler.sleepOffset();

  JsonObject d = out["device"].to<JsonObject>();
  d["version"] = ZEPHYR_VERSION;
  d["paired"] = irEngine.isPaired();
  d["protocol"] = irEngine.protocolName();
  d["protocolModel"] = irEngine.protocolModel();
  d["framesSent"] = irEngine.framesSent();
  d["pendingSend"] = irEngine.hasPending();
  d["ip"] = net.ip();
  d["rssi"] = net.rssi();
  d["setupMode"] = net.inSetupMode();
  d["timeValid"] = scheduler.timeValid();
  d["uptimeSec"] = millis() / 1000;
  d["freeHeap"] = ESP.getFreeHeap();
}

void Controller::notify() {
  if (onChange_) onChange_();
}
