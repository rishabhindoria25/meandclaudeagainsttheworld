#pragma once
// Zephyr - Wi-Fi, mDNS and OTA.

#include <Arduino.h>

class Net {
 public:
  void begin();
  void loop();
  bool online() const;
  bool inSetupMode() const { return apMode_; }
  String ip() const;
  int rssi() const;

 private:
  void startStation();
  void startSetupAp();

  bool apMode_ = false;
  uint32_t lastAttemptMs_ = 0;
  uint8_t attempts_ = 0;
};

extern Net net;
