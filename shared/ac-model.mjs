/**
 * Zephyr - shared A/C domain model.
 *
 * This module is the single source of truth for what the unit can do. It is
 * imported by the simulator and the test suite, and mirrored (by hand, but
 * checked by tools/test/parity.test.mjs) in firmware/src/ac_model.h so that
 * the ESP32 and the browser never disagree about limits.
 *
 * Target unit: GE electronic-control room air conditioner (through-the-wall).
 * Front panel exposes: Power, Mode, Fan speed, Temp +/-, Delay Hrs On/Off,
 * Reset Filter -- and an IR receiver window, which is what makes all of this
 * possible.
 */

/** Setpoint limits, in Fahrenheit. GE room A/Cs are °F-native. */
export const TEMP_MIN_F = 60;
export const TEMP_MAX_F = 86;

/** The unit is cooling-only: there is no heat mode on this chassis. */
export const MODES = Object.freeze([
  { id: 'cool', label: 'Cool', irMode: 'cool', usesSetpoint: true },
  { id: 'eco', label: 'Energy Saver', irMode: 'cool', usesSetpoint: true, econo: true },
  { id: 'fan', label: 'Fan Only', irMode: 'fan', usesSetpoint: false },
  { id: 'dry', label: 'Dry', irMode: 'dry', usesSetpoint: true, optional: true },
]);

/** Panel LEDs show High / Med / Low. "Auto" is offered but not all OEMs honour it. */
export const FAN_SPEEDS = Object.freeze([
  { id: 'auto', label: 'Auto', irFan: 'auto', optional: true },
  { id: 'low', label: 'Low', irFan: 'low' },
  { id: 'medium', label: 'Med', irFan: 'medium' },
  { id: 'high', label: 'High', irFan: 'high' },
]);

export const MODE_IDS = MODES.map((m) => m.id);
export const FAN_IDS = FAN_SPEEDS.map((f) => f.id);

/**
 * Ranked IR protocol candidates for GE-branded room air conditioners.
 *
 * GE has never built its own room A/C electronics; the units are OEM'd, and the
 * IR protocol follows the OEM, not the badge. The ranking below is ordered by
 * how often each OEM shows up in GE room A/Cs with this exact panel layout
 * (2-digit green LED, Energy Saver mode, 3 fan speeds, Delay Hrs timer).
 *
 * `protocol` values are decode_type_t names from IRremoteESP8266, which the
 * firmware feeds straight into IRac::sendAc(). `model` is the library's
 * per-protocol variant selector (-1 = library default).
 */
export const PROTOCOL_CANDIDATES = Object.freeze([
  { protocol: 'COOLIX', model: -1, oem: 'Midea / GD Midea', note: 'Most common in GE AEM/AHM/AEW room A/Cs. Try first.' },
  { protocol: 'MIDEA', model: -1, oem: 'Midea (48-bit)', note: 'Newer Midea-built GE units.' },
  { protocol: 'LG2', model: -1, oem: 'LG', note: 'GE AG-series and some wall sleeves.' },
  { protocol: 'LG', model: -1, oem: 'LG (older)', note: 'Older LG-built GE chassis.' },
  { protocol: 'SAMSUNG_AC', model: -1, oem: 'Samsung', note: 'GE units with Samsung compressors.' },
  { protocol: 'HAIER_AC', model: -1, oem: 'Haier', note: 'Haier built GE appliances after 2016.' },
  { protocol: 'HAIER_AC_YRW02', model: -1, oem: 'Haier (YR-W02 remote)', note: 'Later Haier remote revision.' },
  { protocol: 'GREE', model: -1, oem: 'Gree', note: 'Common white-label Chinese chassis.' },
  { protocol: 'TCL112AC', model: -1, oem: 'TCL', note: 'TCL-built units.' },
  { protocol: 'ELECTRA_AC', model: -1, oem: 'Electra / Frigidaire family', note: 'Shared platform with several US brands.' },
  { protocol: 'WHIRLPOOL_AC', model: -1, oem: 'Whirlpool', note: 'Less common but present.' },
  { protocol: 'CARRIER_AC', model: -1, oem: 'Carrier', note: 'Carrier-built sleeve units.' },
  { protocol: 'CARRIER_AC128', model: -1, oem: 'Carrier (128-bit)', note: 'Newer Carrier revision.' },
  { protocol: 'GOODWEATHER', model: -1, oem: 'Generic (ZH/JT-03 remote)', note: 'Generic far-east remote, wide compatibility.' },
  { protocol: 'AIRWELL', model: -1, oem: 'Airwell', note: 'Long-shot fallback.' },
  { protocol: 'TECO', model: -1, oem: 'Teco', note: 'Long-shot fallback.' },
  { protocol: 'HITACHI_AC', model: -1, oem: 'Hitachi', note: 'Long-shot fallback.' },
  { protocol: 'DELONGHI_AC', model: -1, oem: 'DeLonghi', note: 'Long-shot fallback.' },
]);

export const DEFAULT_STATE = Object.freeze({
  power: false,
  mode: 'cool',
  /** Setpoint in °F. */
  temperature: 72,
  fan: 'auto',
  /** Hours until the delay timer fires, or 0 for off. Panel supports 1-24. */
  timerHours: 0,
  /** Sleep curve: ramps the setpoint up overnight so you don't freeze at 4am. */
  sleep: false,
});

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const clampTemp = (f) => clamp(Math.round(f), TEMP_MIN_F, TEMP_MAX_F);

export const isMode = (id) => MODE_IDS.includes(id);
export const isFan = (id) => FAN_IDS.includes(id);

export const modeById = (id) => MODES.find((m) => m.id === id);

/** Does this mode actually use the temperature setpoint? Fan Only does not. */
export const modeUsesSetpoint = (id) => Boolean(modeById(id)?.usesSetpoint);

/**
 * Fold a command onto a state, returning a new state. Pure, total, and shared
 * by the simulator and the UI's optimistic layer so both predict identically.
 * Unknown fields are ignored rather than thrown, because an older firmware
 * talking to a newer UI should degrade rather than fail.
 */
export function applyCommand(state, command = {}) {
  const next = { ...DEFAULT_STATE, ...state };

  if (typeof command.power === 'boolean') next.power = command.power;
  if (command.power === 'toggle') next.power = !next.power;

  if (isMode(command.mode)) {
    next.mode = command.mode;
    // Turning the dial to a mode implies you want the unit running.
    if (command.power === undefined) next.power = true;
  }

  if (isFan(command.fan)) next.fan = command.fan;

  if (Number.isFinite(command.temperature)) {
    next.temperature = clampTemp(command.temperature);
  }
  if (Number.isFinite(command.temperatureDelta)) {
    next.temperature = clampTemp(next.temperature + command.temperatureDelta);
  }

  if (Number.isFinite(command.timerHours)) {
    next.timerHours = clamp(Math.round(command.timerHours), 0, 24);
  }

  if (typeof command.sleep === 'boolean') next.sleep = command.sleep;

  // Fan Only has no setpoint, and sleep is a thermostat behaviour, so it can't
  // apply either. Normalise rather than leaving a contradictory state around.
  if (!modeUsesSetpoint(next.mode)) next.sleep = false;
  if (!next.power) next.sleep = false;

  return next;
}

/**
 * Translate a Zephyr state into the argument set IRac::sendAc() expects.
 * Kept here (not in the UI) so the simulator and the firmware agree on how a
 * mode like "Energy Saver" decomposes into cool + econo.
 */
export function toIrCommand(state, protocol) {
  const mode = modeById(state.mode) ?? modeById('cool');
  const fan = FAN_SPEEDS.find((f) => f.id === state.fan) ?? FAN_SPEEDS[0];
  return {
    protocol: protocol?.protocol ?? 'COOLIX',
    model: protocol?.model ?? -1,
    power: state.power,
    mode: state.power ? mode.irMode : 'off',
    degrees: state.temperature,
    celsius: false, // GE room A/Cs are °F-native; the library converts.
    fanspeed: fan.irFan,
    econo: Boolean(mode.econo),
    sleep: state.sleep ? 1 : -1,
  };
}
