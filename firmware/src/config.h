#pragma once
// Zephyr - build-time configuration.

#define ZEPHYR_VERSION "1.0.0"

// ---------------------------------------------------------------- pins ----
// IR emitter. Drive the LED through a transistor, not straight off the GPIO --
// see docs/HARDWARE.md. Any output-capable pin works.
static const uint16_t kIrLedPin = 4;

// Optional TSOP38238 demodulator. Used to verify transmissions and to learn
// codes from an original remote if you ever get hold of one. Set to 255 to
// disable and save the RMT channel.
static const uint16_t kIrRecvPin = 14;

// Optional DHT22 on this pin reports room temperature. 255 disables it; you can
// also push readings from any sensor via POST /api/sensor.
static const uint8_t kDhtPin = 255;

// Onboard LED, used for status blink codes.
static const uint8_t kStatusLedPin = 2;

// Held at boot for 5s -> clears stored Wi-Fi and pairing. BOOT button on most
// ESP32 dev boards.
static const uint8_t kResetButtonPin = 0;

// -------------------------------------------------------------- network ----
static const char kHostname[] = "zephyr";
// SoftAP shown when no Wi-Fi is configured yet.
static const char kSetupApSsid[] = "Zephyr-Setup";
static const char kSetupApPass[] = "coldroom";

// ------------------------------------------------------------------ ir ----
// A/C remotes send long frames; blasting them back-to-back makes receivers drop
// them. Minimum spacing between two transmissions.
static const uint32_t kMinIrGapMs = 250;
// The unit only latches a frame it sees cleanly. Repeating a few times costs
// milliseconds and removes almost all missed commands.
static const uint8_t kIrRepeats = 2;
