#pragma once
// Zephyr - time-driven behaviour: schedules, the delay timer, and sleep ramp.

#include <Arduino.h>

#include "ac_model.h"

class Scheduler {
 public:
  void begin();
  // Returns true when it wants the state changed, writing the new state to
  // `state`. Callers own actually transmitting it.
  bool loop(AcState &state);

  bool timeValid() const { return timeValid_; }
  // Unix seconds, or 0 before NTP has landed.
  time_t now() const;

  // Countdown started by the "Delay Hrs" control. 0 when idle.
  uint32_t timerRemainingSec() const;
  void startTimer(uint8_t hours, bool targetPower);
  void cancelTimer();
  bool timerActive() const { return timerDeadline_ != 0; }
  bool timerTargetPower() const { return timerTargetPower_; }

  // Sleep ramp: the setpoint drifts up overnight so 4am isn't arctic.
  void startSleep(int baseTempF);
  void cancelSleep();
  int sleepOffset() const { return sleepOffset_; }

 private:
  bool checkSchedules(AcState &state);
  bool checkTimer(AcState &state);
  bool checkSleep(AcState &state);

  bool timeValid_ = false;
  uint32_t lastTickMs_ = 0;

  time_t timerDeadline_ = 0;
  bool timerTargetPower_ = false;

  time_t sleepStarted_ = 0;
  int sleepBaseTempF_ = 72;
  int sleepOffset_ = 0;

  // Guards against a schedule firing twice inside its minute.
  int lastFiredMinuteOfDay_ = -1;
};

extern Scheduler scheduler;
