#include "store.h"

#include <Preferences.h>

Store store;

namespace {
Preferences prefs;
const char *kNamespace = "zephyr";
const uint32_t kWriteDelayMs = 4000;
}  // namespace

void Store::begin() {
  prefs.begin(kNamespace, false);
  size_t n = prefs.getBytesLength("settings");
  if (n == sizeof(Settings)) {
    prefs.getBytes("settings", &s_, sizeof(Settings));
  } else {
    // Either a first boot or a struct layout change after a firmware update.
    // Defaults are already in the member initialisers; just write them back.
    s_ = Settings();
    prefs.putBytes("settings", &s_, sizeof(Settings));
  }
}

void Store::save() {
  prefs.putBytes("settings", &s_, sizeof(Settings));
  dirty_ = false;
}

void Store::markDirty() {
  if (!dirty_) dirtySince_ = millis();
  dirty_ = true;
}

void Store::loop() {
  if (!dirty_) return;
  if (millis() - dirtySince_ < kWriteDelayMs) return;
  save();
}

void Store::factoryReset() {
  prefs.clear();
  s_ = Settings();
  prefs.putBytes("settings", &s_, sizeof(Settings));
}
