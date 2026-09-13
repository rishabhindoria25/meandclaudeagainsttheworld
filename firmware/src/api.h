#pragma once
// Zephyr - HTTP + WebSocket API, and the embedded web UI.

#include <Arduino.h>

namespace api {
void begin();
void loop();
// Push the current state to every connected browser.
void broadcastState();
}  // namespace api
