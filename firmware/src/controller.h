#pragma once
// Zephyr - the thing that actually owns "what the A/C is set to".
//
// IR is a one-way link: nothing ever reports back. So this holds a shadow of
// the unit's state, applies commands to it, and asks the IR engine to make
// reality match. Everything else (web, MQTT, schedules) goes through here so
// there is exactly one writer.

#include <Arduino.h>
#include <ArduinoJson.h>

#include <functional>

#include "ac_model.h"

class Controller {
 public:
  void begin();
  void loop();

  const AcState &state() const { return state_; }

  // Apply a partial command object. Returns true if anything changed.
  bool applyCommand(JsonObjectConst cmd);
  void setState(const AcState &s, bool transmit = true);
  // Re-transmit the current state without changing it. The escape hatch for
  // when someone bumps the panel buttons and the shadow drifts.
  void resync();

  void setRoomTemp(float f, float humidity = NAN);
  float roomTempF() const { return roomTempF_; }
  float humidity() const { return humidity_; }
  bool hasRoomTemp() const { return !isnan(roomTempF_); }

  uint32_t compressorSeconds() const { return compressorSec_; }
  float energyKwh() const { return energyKwh_; }
  float estimatedCost() const;
  void resetEnergy();

  void serializeState(JsonObject out) const;

  void onChange(std::function<void()> cb) { onChange_ = cb; }

 private:
  void notify();
  void accrueEnergy();

  AcState state_;
  float roomTempF_ = NAN;
  float humidity_ = NAN;
  uint32_t roomTempAgeMs_ = 0;

  uint32_t compressorSec_ = 0;
  float energyKwh_ = 0.0f;
  uint32_t lastAccrualMs_ = 0;

  std::function<void()> onChange_;
};

extern Controller controller;
