#pragma once
// Zephyr - persistent settings in NVS.
//
// Everything here survives a reboot and a power cut, which matters: the whole
// point of the pairing sweep is that you only do it once.

#include <Arduino.h>

#include "ac_model.h"

static const uint8_t kMaxSchedules = 8;

struct Schedule {
  bool enabled = false;
  // Bit 0 = Sunday .. bit 6 = Saturday. 0x7F = every day.
  uint8_t days = 0x7F;
  uint8_t hour = 0;
  uint8_t minute = 0;
  AcState action;
  char label[24] = "";
};

struct Settings {
  char wifiSsid[33] = "";
  char wifiPass[65] = "";

  char protocol[24] = "";
  int16_t protocolModel = -1;

  char mqttHost[64] = "";
  uint16_t mqttPort = 1883;
  char mqttUser[33] = "";
  char mqttPass[65] = "";

  // IANA-style POSIX TZ string; default is US Eastern.
  char timezone[48] = "EST5EDT,M3.2.0,M11.1.0";

  // Cooling capacity and efficiency, used for the runtime energy estimate.
  uint16_t btu = 8000;
  float eer = 10.7f;
  // What the utility charges, in dollars per kWh.
  float costPerKwh = 0.24f;

  AcState lastState;
  Schedule schedules[kMaxSchedules];
};

class Store {
 public:
  void begin();
  void save();
  void factoryReset();

  Settings &settings() { return s_; }
  // Persist at most once every few seconds; the UI can fire a lot of writes and
  // NVS flash has a finite erase budget.
  void markDirty();
  void loop();

 private:
  Settings s_;
  bool dirty_ = false;
  uint32_t dirtySince_ = 0;
};

extern Store store;
