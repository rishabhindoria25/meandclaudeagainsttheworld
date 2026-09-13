#pragma once
// Zephyr - Home Assistant integration over MQTT.
//
// Publishing a discovery payload gets the unit into HA as a first-class climate
// entity, which in turn means Siri / Alexa / Google and every HA automation get
// it for free. Entirely optional: leave mqttHost empty and none of this runs.

#include <Arduino.h>

namespace ha {
void begin();
void loop();
void publishState();
bool connected();
}  // namespace ha
