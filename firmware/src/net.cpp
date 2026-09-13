#include "net.h"

#include <ArduinoOTA.h>
#include <ESPmDNS.h>
#include <WiFi.h>

#include "config.h"
#include "store.h"

Net net;

namespace {
const uint32_t kRetryMs = 15000;
}

void Net::begin() {
  WiFi.persistent(false);
  WiFi.setSleep(false);  // IR timing suffers when the radio naps mid-frame.
  WiFi.setHostname(kHostname);

  if (store.settings().wifiSsid[0]) {
    startStation();
  } else {
    startSetupAp();
  }

  ArduinoOTA.setHostname(kHostname);
  ArduinoOTA.begin();

  if (MDNS.begin(kHostname)) {
    MDNS.addService("http", "tcp", 80);
    // Lets the web UI find the bridge without anyone typing an IP address.
    MDNS.addServiceTxt("http", "tcp", "device", "zephyr");
    MDNS.addServiceTxt("http", "tcp", "version", ZEPHYR_VERSION);
  }
}

void Net::startStation() {
  apMode_ = false;
  WiFi.mode(WIFI_STA);
  WiFi.begin(store.settings().wifiSsid, store.settings().wifiPass);
  lastAttemptMs_ = millis();
}

void Net::startSetupAp() {
  // No credentials yet: put up an open-ish AP so the phone can reach the UI and
  // hand us a network to join.
  apMode_ = true;
  WiFi.mode(WIFI_AP);
  WiFi.softAP(kSetupApSsid, kSetupApPass);
}

void Net::loop() {
  ArduinoOTA.handle();
  if (apMode_) return;

  if (WiFi.status() != WL_CONNECTED && millis() - lastAttemptMs_ > kRetryMs) {
    attempts_++;
    // Credentials that never work shouldn't strand the device: fall back to the
    // setup AP so it can always be re-provisioned.
    if (attempts_ >= 8) {
      startSetupAp();
      return;
    }
    WiFi.disconnect();
    WiFi.begin(store.settings().wifiSsid, store.settings().wifiPass);
    lastAttemptMs_ = millis();
  }
}

bool Net::online() const {
  return apMode_ ? true : WiFi.status() == WL_CONNECTED;
}

String Net::ip() const {
  return apMode_ ? WiFi.softAPIP().toString() : WiFi.localIP().toString();
}

int Net::rssi() const { return apMode_ ? 0 : WiFi.RSSI(); }
