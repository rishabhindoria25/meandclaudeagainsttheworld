#include "ir_engine.h"

#include <IRutils.h>

#include "config.h"

IrEngine irEngine;

IrEngine::IrEngine() : ac_(kIrLedPin) {}

void IrEngine::begin() { ac_.next.protocol = decode_type_t::UNKNOWN; }

bool IrEngine::setProtocol(const char *name, int16_t model) {
  if (!name || !*name) return false;
  decode_type_t t = strToDecodeType(name);
  if (t == decode_type_t::UNKNOWN) return false;
  // Only A/C-capable protocols carry a full state; the rest are single-button
  // remotes and cannot express a setpoint.
  if (!IRac::isProtocolSupported(t)) return false;
  protocol_ = t;
  protoModel_ = model;
  protoName_ = typeToString(t);
  return true;
}

stdAc::state_t IrEngine::toStdAc(const AcState &s, decode_type_t proto,
                                 int16_t model) const {
  stdAc::state_t o;
  o.protocol = proto;
  o.model = model;
  o.power = s.power;

  switch (s.mode) {
    // "Energy Saver" is cool plus the econo bit: the compressor cycles and the
    // fan stops between cycles rather than running continuously.
    case Mode::Cool:
    case Mode::Eco: o.mode = stdAc::opmode_t::kCool; break;
    case Mode::Fan: o.mode = stdAc::opmode_t::kFan; break;
    case Mode::Dry: o.mode = stdAc::opmode_t::kDry; break;
  }
  o.econo = (s.mode == Mode::Eco);

  // GE room A/Cs are °F-native and so is our whole UI. The library converts to
  // whatever unit the wire protocol actually uses.
  o.degrees = static_cast<float>(clampTempF(s.tempF));
  o.celsius = false;

  switch (s.fan) {
    case FanSpeed::Auto: o.fanspeed = stdAc::fanspeed_t::kAuto; break;
    case FanSpeed::Low: o.fanspeed = stdAc::fanspeed_t::kLow; break;
    case FanSpeed::Medium: o.fanspeed = stdAc::fanspeed_t::kMedium; break;
    case FanSpeed::High: o.fanspeed = stdAc::fanspeed_t::kHigh; break;
  }

  // This chassis has no louver motor, so swing stays parked.
  o.swingv = stdAc::swingv_t::kOff;
  o.swingh = stdAc::swingh_t::kOff;

  o.sleep = s.sleep ? 1 : -1;
  o.turbo = false;
  o.quiet = false;
  o.light = true;
  o.filter = false;
  o.clean = false;
  // A beep is the only acknowledgement a one-way link gets, so keep it on.
  o.beep = true;
  return o;
}

bool IrEngine::sendNow(const AcState &s, decode_type_t proto, int16_t model) {
  if (proto == decode_type_t::UNKNOWN) return false;
  stdAc::state_t desired = toStdAc(s, proto, model);

  for (uint8_t i = 0; i <= kIrRepeats; i++) {
    if (i) delay(kMinIrGapMs);
    ac_.sendAc(desired, nullptr);
  }
  lastSendMs_ = millis();
  framesSent_++;
  return true;
}

bool IrEngine::request(const AcState &s) {
  if (!isPaired()) return false;
  pending_ = s;
  pendingDirty_ = true;
  pendingSince_ = millis();
  return true;
}

void IrEngine::loop() {
  if (!pendingDirty_) return;
  uint32_t now = millis();
  if (now - pendingSince_ < kCoalesceMs) return;
  if (now - lastSendMs_ < kMinIrGapMs) return;
  pendingDirty_ = false;
  sendNow(pending_, protocol_, protoModel_);
}

// --------------------------------------------------------------- pairing ---

const ProtocolCandidate *IrEngine::pairingCandidate() const {
  if (session_.index >= kCandidateCount) return nullptr;
  return &kCandidates[session_.index];
}

void IrEngine::pairingStart() {
  session_ = PairingSession();
  session_.active = true;
}

void IrEngine::pairingStop() { session_.active = false; }

bool IrEngine::pairingProbe(const AcState &current) {
  const ProtocolCandidate *c = pairingCandidate();
  if (!session_.active || !c) return false;
  decode_type_t t = strToDecodeType(c->name);
  if (t == decode_type_t::UNKNOWN || !IRac::isProtocolSupported(t)) {
    // Candidate isn't compiled into this build; skip rather than stall.
    return pairingNext();
  }

  // The probe is whatever produces the most obvious reaction. If the unit is
  // off, turn it on hard: compressor and fan at full, coldest setpoint. If it
  // is already running, turn it off. Either way you can hear the answer from
  // across the room, which is what the user is being asked to judge.
  AcState probe = current;
  session_.probePowersOn = !current.power;
  probe.power = session_.probePowersOn;
  if (probe.power) {
    probe.mode = Mode::Cool;
    probe.fan = FanSpeed::High;
    probe.tempF = kTempMinF;
  }

  bool ok = sendNow(probe, t, c->model);
  if (ok) session_.probesSent++;
  return ok;
}

bool IrEngine::pairingNext() {
  if (!session_.active) return false;
  if (session_.index + 1 >= kCandidateCount) return false;
  session_.index++;
  return true;
}

bool IrEngine::pairingPrev() {
  if (!session_.active || session_.index == 0) return false;
  session_.index--;
  return true;
}

bool IrEngine::pairingConfirm() {
  const ProtocolCandidate *c = pairingCandidate();
  if (!c) return false;
  if (!setProtocol(c->name, c->model)) return false;
  session_.active = false;
  return true;
}
