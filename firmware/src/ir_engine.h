#pragma once
// Zephyr - IR transmission engine.
//
// Wraps IRremoteESP8266's IRac universal sender. Two jobs:
//   1. Turn an AcState into a protocol frame and get it onto the LED.
//   2. Drive the pairing sweep that works out which protocol this unit speaks.
//
// Sends are coalesced rather than issued inline: the web handlers ask for a
// state, and loop() transmits at most one frame per coalesce window. Holding
// "+" from 72 to 78 therefore sends one frame, not seven -- which is both
// faster in practice and far more reliable, since A/C receivers drop frames
// that arrive back-to-back.

#include <Arduino.h>
#include <IRac.h>
#include <IRremoteESP8266.h>

#include "ac_model.h"

// Rapid input settles for this long before a frame goes out.
static const uint32_t kCoalesceMs = 350;

struct PairingSession {
  bool active = false;
  size_t index = 0;        // position in kCandidates
  uint32_t probesSent = 0;
  bool probePowersOn = true;  // which direction the probe is testing
};

class IrEngine {
 public:
  IrEngine();

  void begin();
  void loop();

  // --- protocol selection -------------------------------------------------
  bool setProtocol(const char *name, int16_t model);
  const char *protocolName() const { return protoName_.c_str(); }
  int16_t protocolModel() const { return protoModel_; }
  bool isPaired() const { return protocol_ != decode_type_t::UNKNOWN; }

  // --- transmission -------------------------------------------------------
  // Queue `s` for transmission. Returns false only if no protocol is paired.
  bool request(const AcState &s);
  // Send immediately, bypassing coalescing. Used by the pairing probe and by
  // the "resync" button, which deliberately re-asserts the current state.
  bool sendNow(const AcState &s, decode_type_t proto, int16_t model);

  uint32_t framesSent() const { return framesSent_; }
  uint32_t lastSendMs() const { return lastSendMs_; }
  bool hasPending() const { return pendingDirty_; }

  // --- pairing sweep ------------------------------------------------------
  void pairingStart();
  void pairingStop();
  // Blast the probe for the candidate we are currently sitting on.
  bool pairingProbe(const AcState &current);
  // User said "nothing happened" -> move to the next candidate.
  bool pairingNext();
  bool pairingPrev();
  // User said "it reacted" -> lock this candidate in.
  bool pairingConfirm();
  const PairingSession &pairing() const { return session_; }
  const ProtocolCandidate *pairingCandidate() const;

 private:
  stdAc::state_t toStdAc(const AcState &s, decode_type_t proto, int16_t model) const;

  IRac ac_;
  decode_type_t protocol_ = decode_type_t::UNKNOWN;
  int16_t protoModel_ = -1;
  String protoName_ = "";

  AcState pending_;
  bool pendingDirty_ = false;
  uint32_t pendingSince_ = 0;

  uint32_t lastSendMs_ = 0;
  uint32_t framesSent_ = 0;

  PairingSession session_;
};

extern IrEngine irEngine;
