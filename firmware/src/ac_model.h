#pragma once
// Zephyr - A/C domain model.
//
// Mirrors shared/ac-model.mjs. tools/test/parity.test.mjs parses this file and
// fails the test suite if the two ever disagree, so edit them together.

#include <Arduino.h>
#include <IRremoteESP8266.h>

static const int kTempMinF = 60;
static const int kTempMaxF = 86;

enum class Mode : uint8_t { Cool = 0, Eco = 1, Fan = 2, Dry = 3 };
enum class FanSpeed : uint8_t { Auto = 0, Low = 1, Medium = 2, High = 3 };

struct AcState {
  bool power = false;
  Mode mode = Mode::Cool;
  int tempF = 72;
  FanSpeed fan = FanSpeed::Auto;
  uint8_t timerHours = 0;  // 0 = off, 1..24
  bool sleep = false;

  bool operator==(const AcState &o) const {
    return power == o.power && mode == o.mode && tempF == o.tempF &&
           fan == o.fan && timerHours == o.timerHours && sleep == o.sleep;
  }
  bool operator!=(const AcState &o) const { return !(*this == o); }
};

// A protocol the wizard can try. `name` is an IRremoteESP8266 decode_type_t
// name; `model` is that protocol's variant selector (-1 = library default).
struct ProtocolCandidate {
  const char *name;
  int16_t model;
  const char *oem;
};

// Ranked by how often each OEM turns up in GE room A/Cs with this panel layout.
// GE badges other people's electronics, so the protocol follows the OEM.
static const ProtocolCandidate kCandidates[] = {
    {"COOLIX", -1, "Midea / GD Midea"},
    {"MIDEA", -1, "Midea (48-bit)"},
    {"LG2", -1, "LG"},
    {"LG", -1, "LG (older)"},
    {"SAMSUNG_AC", -1, "Samsung"},
    {"HAIER_AC", -1, "Haier"},
    {"HAIER_AC_YRW02", -1, "Haier (YR-W02)"},
    {"GREE", -1, "Gree"},
    {"TCL112AC", -1, "TCL"},
    {"ELECTRA_AC", -1, "Electra / Frigidaire family"},
    {"WHIRLPOOL_AC", -1, "Whirlpool"},
    {"CARRIER_AC", -1, "Carrier"},
    {"CARRIER_AC128", -1, "Carrier (128-bit)"},
    {"GOODWEATHER", -1, "Generic (ZH/JT-03)"},
    {"AIRWELL", -1, "Airwell"},
    {"TECO", -1, "Teco"},
    {"HITACHI_AC", -1, "Hitachi"},
    {"DELONGHI_AC", -1, "DeLonghi"},
};
static const size_t kCandidateCount = sizeof(kCandidates) / sizeof(kCandidates[0]);

const char *modeToString(Mode m);
Mode modeFromString(const char *s, Mode fallback = Mode::Cool);
const char *fanToString(FanSpeed f);
FanSpeed fanFromString(const char *s, FanSpeed fallback = FanSpeed::Auto);

// Fan Only has no setpoint, so the thermostat-shaped features switch off with it.
inline bool modeUsesSetpoint(Mode m) { return m != Mode::Fan; }

inline int clampTempF(int f) {
  if (f < kTempMinF) return kTempMinF;
  if (f > kTempMaxF) return kTempMaxF;
  return f;
}
