# Hardware

About $8 of parts. The only fiddly bit is that an IR LED needs more current than
a GPIO pin will give you, so it goes behind a transistor.

## Bill of materials

| Qty | Part | Why |
| --- | --- | --- |
| 1 | ESP32 dev board (ESP32-WROOM-32, C3 or S3) | Wi-Fi, and an RMT peripheral that produces clean 38 kHz carriers |
| 1–2 | 940 nm IR LED, wide angle | 940 nm is what A/C receivers are tuned for. 850 nm works but is weaker through the panel's filter |
| 1 | 2N2222 / BC337 / 2N3904 NPN transistor | Switches the LED at full current |
| 1 | 100 Ω resistor, ¼ W | LED current limit |
| 1 | 1 kΩ resistor | Transistor base drive |
| 1 | TSOP38238 IR receiver *(optional)* | Confirms the bridge is actually emitting, and can learn codes from a remote if you ever borrow one |
| — | USB power supply | 500 mA is plenty |

## Wiring

```
                      ┌──────── 5V (or 3V3) ────────┐
                      │                             │
                     ┌┴┐ 100Ω                       │
                     └┬┘                            │
                      │                             │
                    ──┴── IR LED (anode up)         │
                     ─┬─                            │
                      │                             │
  GPIO4 ──[1kΩ]──── base ┐                          │
                         ├─ 2N2222                  │
                       collector ── (LED cathode)   │
                        emitter ── GND              │
                                                    │
  TSOP38238  ── OUT ── GPIO14                       │
             ── VCC ─────────────────────────────── 3V3 only
             ── GND ── GND
```

Pins live in `firmware/src/config.h`:

```cpp
static const uint16_t kIrLedPin  = 4;    // through the transistor
static const uint16_t kIrRecvPin = 14;   // 255 to disable
static const uint8_t  kStatusLedPin  = 2;
static const uint8_t  kResetButtonPin = 0;  // BOOT on most boards
```

**The receiver is 3.3 V only.** The LED side can run from 5 V because the
transistor isolates it from the ESP32; the TSOP cannot.

## Two LEDs for more reach

Series, not parallel — parallel LEDs never share current evenly:

```
5V ──[47Ω]── LED ── LED ── collector
```

Drop the resistor to 47 Ω to keep the current up across the extra forward
voltage. One LED is fine at a couple of metres with line of sight; two will
bounce off a ceiling.

## Where to put it

Aim it at the **dark rectangle at the top-left of the control panel** — that is
the receiver window, left of the digits.

- **Line of sight is best**, but not required. IR bounces well off white ceilings
  and walls; pointing at the ceiling above the unit often works fine.
- **Keep it out of direct sunlight.** Sun swamps the receiver and is the single
  most common reason a command is missed in the afternoon.
- **60 cm to 3 m** with one LED. Closer is not better — at a few centimetres you
  can saturate the receiver and it will ignore you.

A bridge sitting on the windowsill below the unit, pointed up, works well and
keeps the cable tidy.

## Blink codes

The onboard LED tells you where it is without a serial cable:

| Pattern | Meaning |
| --- | --- |
| Fast blink (150 ms) | No Wi-Fi — the `Zephyr-Setup` network is up |
| Slow blink (1.2 s) | On the network, but not yet paired with the A/C |
| Solid | Paired and running |

## Recovery

Hold **BOOT** while powering up, keep holding for five seconds: Wi-Fi credentials
and the stored protocol are erased and the setup network comes back. This is the
only recovery path that doesn't need the network to already work.

## A note on the power cord

The panel's **Safety Plug / Delay Hrs On-Off** buttons relate to the LCDI plug on
the unit's own cord — the bulky moulded block with TEST and RESET. Zephyr does
not touch it and cannot reset it. If the unit is dead and the plug's light is
off, press RESET on the plug itself.
