#include "ac_model.h"

#include <string.h>

const char *modeToString(Mode m) {
  switch (m) {
    case Mode::Cool: return "cool";
    case Mode::Eco: return "eco";
    case Mode::Fan: return "fan";
    case Mode::Dry: return "dry";
  }
  return "cool";
}

Mode modeFromString(const char *s, Mode fallback) {
  if (!s) return fallback;
  if (!strcmp(s, "cool")) return Mode::Cool;
  if (!strcmp(s, "eco")) return Mode::Eco;
  if (!strcmp(s, "fan")) return Mode::Fan;
  if (!strcmp(s, "dry")) return Mode::Dry;
  return fallback;
}

const char *fanToString(FanSpeed f) {
  switch (f) {
    case FanSpeed::Auto: return "auto";
    case FanSpeed::Low: return "low";
    case FanSpeed::Medium: return "medium";
    case FanSpeed::High: return "high";
  }
  return "auto";
}

FanSpeed fanFromString(const char *s, FanSpeed fallback) {
  if (!s) return fallback;
  if (!strcmp(s, "auto")) return FanSpeed::Auto;
  if (!strcmp(s, "low")) return FanSpeed::Low;
  if (!strcmp(s, "medium")) return FanSpeed::Medium;
  if (!strcmp(s, "high")) return FanSpeed::High;
  return fallback;
}
