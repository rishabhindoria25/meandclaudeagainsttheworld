#include "scheduler.h"

#include <time.h>

#include "store.h"

Scheduler scheduler;

namespace {
// Sleep ramp: +1 °F per hour, capped at +4 °F. This is what the "sleep" button
// on a factory remote does, and it is the single most useful comfort feature on
// a unit whose own thermostat has ±3 °F of hysteresis.
const int kSleepStepF = 1;
const int kSleepMaxOffsetF = 4;
const uint32_t kSleepStepSec = 3600;
}  // namespace

void Scheduler::begin() {
  configTzTime(store.settings().timezone, "pool.ntp.org", "time.nist.gov");
}

time_t Scheduler::now() const {
  time_t t = time(nullptr);
  // Anything before 2021 means NTP has not answered yet.
  return (t > 1600000000) ? t : 0;
}

uint32_t Scheduler::timerRemainingSec() const {
  if (!timerDeadline_) return 0;
  time_t t = time(nullptr);
  if (t <= 0 || timerDeadline_ <= t) return 0;
  return static_cast<uint32_t>(timerDeadline_ - t);
}

void Scheduler::startTimer(uint8_t hours, bool targetPower) {
  time_t t = time(nullptr);
  if (hours == 0 || t <= 0) {
    cancelTimer();
    return;
  }
  timerDeadline_ = t + static_cast<time_t>(hours) * 3600;
  timerTargetPower_ = targetPower;
}

void Scheduler::cancelTimer() {
  timerDeadline_ = 0;
}

void Scheduler::startSleep(int baseTempF) {
  sleepStarted_ = time(nullptr);
  sleepBaseTempF_ = baseTempF;
  sleepOffset_ = 0;
}

void Scheduler::cancelSleep() {
  sleepStarted_ = 0;
  sleepOffset_ = 0;
}

bool Scheduler::loop(AcState &state) {
  // Time-of-day logic only needs to run once a second.
  uint32_t nowMs = millis();
  if (nowMs - lastTickMs_ < 1000) return false;
  lastTickMs_ = nowMs;

  timeValid_ = now() != 0;

  bool changed = false;
  changed |= checkTimer(state);
  if (timeValid_) {
    changed |= checkSchedules(state);
    changed |= checkSleep(state);
  }
  return changed;
}

bool Scheduler::checkTimer(AcState &state) {
  if (!timerDeadline_) return false;
  if (timerRemainingSec() > 0) return false;
  timerDeadline_ = 0;
  state.power = timerTargetPower_;
  state.timerHours = 0;
  if (!state.power) state.sleep = false;
  return true;
}

bool Scheduler::checkSchedules(AcState &state) {
  struct tm tm;
  if (!getLocalTime(&tm, 0)) return false;

  int minuteOfDay = tm.tm_hour * 60 + tm.tm_min;
  if (minuteOfDay == lastFiredMinuteOfDay_) return false;

  for (uint8_t i = 0; i < kMaxSchedules; i++) {
    const Schedule &sc = store.settings().schedules[i];
    if (!sc.enabled) continue;
    if (!(sc.days & (1 << tm.tm_wday))) continue;
    if (sc.hour != tm.tm_hour || sc.minute != tm.tm_min) continue;

    state = sc.action;
    lastFiredMinuteOfDay_ = minuteOfDay;
    return true;
  }
  return false;
}

bool Scheduler::checkSleep(AcState &state) {
  if (!state.sleep || !modeUsesSetpoint(state.mode) || !state.power) {
    if (sleepStarted_) cancelSleep();
    return false;
  }
  if (!sleepStarted_) {
    startSleep(state.tempF);
    return false;
  }

  time_t t = time(nullptr);
  if (t <= sleepStarted_) return false;
  uint32_t elapsed = static_cast<uint32_t>(t - sleepStarted_);
  int steps = static_cast<int>(elapsed / kSleepStepSec);
  int target = steps * kSleepStepF;
  if (target > kSleepMaxOffsetF) target = kSleepMaxOffsetF;
  if (target == sleepOffset_) return false;

  sleepOffset_ = target;
  state.tempF = clampTempF(sleepBaseTempF_ + sleepOffset_);
  return true;
}
