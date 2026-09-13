# ESPHome alternative

If you already run Home Assistant and you **already know** which protocol your
unit speaks, you can skip Zephyr's firmware entirely and use ESPHome's built-in
climate components instead.

The trade-off is real: ESPHome has no protocol sweep, so it cannot help you find
the protocol in the first place. Pair with Zephyr first (or borrow a remote),
then move over if you prefer an ESPHome-native device.

`ge-ac.yaml` in this directory is a working starting point. Swap the `coolix:`
platform for whichever the wizard found — ESPHome ships `coolix`, `midea`,
`climate_ir_lg`, `samsung`, `whirlpool`, `tcl112`, `gree`, `hitachi_ac` and
others; the names differ slightly from IRremoteESP8266's.

What you lose: the pairing wizard, the front-panel mirror, the usage estimates,
the sleep curve, and the web remote — ESPHome has no UI of its own, so
everything goes through Home Assistant.

What you gain: native HA and HomeKit integration with no MQTT broker.
