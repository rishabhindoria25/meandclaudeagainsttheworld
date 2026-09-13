// Zephyr - a software remote for a GE room air conditioner.
//
// The unit has an IR receiver behind the front panel but no remote to talk to
// it. This firmware turns an ESP32 into that remote: it serves a web UI on the
// LAN, holds the A/C's state, and blasts the matching IR frames.
//
// Because GE badges other manufacturers' electronics, the IR protocol is not
// known up front. On first boot the pairing wizard sweeps a ranked list of
// candidates until the unit reacts, then stores the winner for good.

#include <Arduino.h>

#include "api.h"
#include "config.h"
#include "controller.h"
#include "ha_mqtt.h"
#include "ir_engine.h"
#include "net.h"
#include "scheduler.h"
#include "store.h"

namespace {

uint32_t lastBlinkMs = 0;
bool ledOn = false;

// Blink codes, so the box can tell you what is wrong without a serial cable:
//   fast  (150ms) - no Wi-Fi / setup AP is up
//   slow  (1200ms) - connected but not paired with the A/C yet
//   solid  - paired and running
void updateStatusLed() {
  uint32_t interval = 0;
  if (net.inSetupMode()) {
    interval = 150;
  } else if (!irEngine.isPaired()) {
    interval = 1200;
  }

  if (interval == 0) {
    digitalWrite(kStatusLedPin, HIGH);
    return;
  }
  if (millis() - lastBlinkMs < interval) return;
  lastBlinkMs = millis();
  ledOn = !ledOn;
  digitalWrite(kStatusLedPin, ledOn ? HIGH : LOW);
}

// Holding BOOT through startup wipes Wi-Fi and pairing. The only recovery path
// that does not need the network to already work.
void checkFactoryReset() {
  if (digitalRead(kResetButtonPin) != LOW) return;
  Serial.println(F("Zephyr: hold for 5s to factory reset..."));
  uint32_t start = millis();
  while (digitalRead(kResetButtonPin) == LOW) {
    if (millis() - start > 5000) {
      Serial.println(F("Zephyr: factory reset"));
      for (int i = 0; i < 10; i++) {
        digitalWrite(kStatusLedPin, i % 2);
        delay(80);
      }
      store.factoryReset();
      ESP.restart();
    }
    delay(50);
  }
}

}  // namespace

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println();
  Serial.println(F("Zephyr " ZEPHYR_VERSION));

  pinMode(kStatusLedPin, OUTPUT);
  pinMode(kResetButtonPin, INPUT_PULLUP);

  store.begin();
  checkFactoryReset();

  irEngine.begin();
  // Restore the protocol found by a previous pairing run, if there was one.
  if (store.settings().protocol[0]) {
    if (irEngine.setProtocol(store.settings().protocol,
                             store.settings().protocolModel)) {
      Serial.printf("Zephyr: paired as %s\n", irEngine.protocolName());
    } else {
      Serial.printf("Zephyr: stored protocol '%s' is not available in this build\n",
                    store.settings().protocol);
    }
  } else {
    Serial.println(F("Zephyr: unpaired - open the web UI and run the wizard"));
  }

  controller.begin();
  net.begin();
  scheduler.begin();
  ha::begin();
  api::begin();

  Serial.printf("Zephyr: ready at http://%s/ (or http://%s.local/)\n",
                net.ip().c_str(), kHostname);
}

void loop() {
  net.loop();
  store.loop();
  irEngine.loop();
  controller.loop();
  api::loop();
  ha::loop();
  updateStatusLed();
}
