# Protocol notes

## How the candidate list is ordered

`shared/ac-model.mjs`, `firmware/src/ac_model.h` and `codesets/ge-candidates.json`
all carry the same ranked list. The order reflects which OEMs most often turn up
in GE room air conditioners with this specific panel layout: a two-digit green
seven-segment display, an **Energy Saver** mode between Cool and Fan Only, three
fan speeds, and a **Delay Hrs** timer with separate On and Off buttons.

| Rank | Protocol | OEM | Reasoning |
| --- | --- | --- | --- |
| 1 | `COOLIX` | Midea / GD Midea | The most common by a wide margin. Midea built a large share of GE's AEM/AHM/AEW room units, and `COOLIX` is the classic 24-bit Midea frame |
| 2 | `MIDEA` | Midea (48-bit) | Newer Midea revision |
| 3–4 | `LG2`, `LG` | LG | LG built GE's AG series and several wall sleeves. `LG2` is the newer framing |
| 5 | `SAMSUNG_AC` | Samsung | Samsung-compressor units |
| 6–7 | `HAIER_AC`, `HAIER_AC_YRW02` | Haier | Haier acquired GE Appliances in 2016; later stock is plausible |
| 8–13 | `GREE`, `TCL112AC`, `ELECTRA_AC`, `WHIRLPOOL_AC`, `CARRIER_AC`, `CARRIER_AC128` | various | White-label chassis shared across US brands |
| 14–18 | `GOODWEATHER`, `AIRWELL`, `TECO`, `HITACHI_AC`, `DELONGHI_AC` | various | Long shots, kept because they cost nothing to try |

These are `decode_type_t` names from
[IRremoteESP8266](https://github.com/crankyoldgit/IRremoteESP8266). The firmware
passes them straight to `IRac::sendAc()`, which is that library's universal A/C
sender: one state struct, a hundred-odd wire protocols behind it. Switching
candidates is a one-field change, which is what makes the sweep cheap.

Note that the library's own documentation lists "General Electric" under `LG`,
for the `AG1BH09AW101` mini-split with the `6711AR2853M` remote. That is a
GE-badged *LG mini-split*, not a window or wall unit, so it is evidence for LG
being in the list — not for LG being the answer here.

## Mapping Zephyr's model onto the wire

`stdAc::state_t` is the library's common representation. Zephyr fills it like
this:

| Zephyr | `stdAc::state_t` | Note |
| --- | --- | --- |
| `cool` | `mode = kCool`, `econo = false` | |
| `eco` | `mode = kCool`, `econo = true` | "Energy Saver" is cool plus the econo bit: the compressor cycles and the fan stops between cycles instead of running continuously |
| `fan` | `mode = kFan` | No setpoint, so sleep is forced off |
| `dry` | `mode = kDry` | Offered, but not every GE chassis exposes it |
| `temperature` | `degrees`, `celsius = false` | GE room A/Cs are °F-native, 60–86. The library converts to whatever the wire protocol uses |
| `fan: auto/low/medium/high` | `fanspeed = kAuto/kLow/kMedium/kHigh` | Matches the panel's High/Med/Low LEDs |
| — | `swingv`, `swingh = kOff` | This chassis has no louver motor |
| — | `beep = true` | The only acknowledgement a one-way link gets |

## Why frames are coalesced and repeated

Two constants in `firmware/src/config.h` do most of the reliability work:

```cpp
static const uint32_t kCoalesceMs = 350;   // settle before transmitting
static const uint32_t kMinIrGapMs = 250;   // spacing between frames
static const uint8_t  kIrRepeats  = 2;     // extra copies of each frame
```

A/C remotes send the **entire state** in every frame — not "temperature up" but
"cool, 68 °F, high fan, econo off". That has two consequences:

- **Coalescing is free.** Holding `+` from 72 to 78 only needs the final state
  transmitted. Sending all seven would be slower and less reliable, because
  receivers drop frames that arrive back to back.
- **Repeats are cheap insurance.** Re-sending the same complete state two extra
  times costs a few hundred milliseconds and is idempotent, so a frame lost to
  sunlight or a passing hand doesn't matter.

It also means **Resync** is trivially correct: re-transmitting the current state
is the same operation as any other command.

## The shadow, and where it drifts

There is no return path. The bridge cannot read the unit's state, only assert it.
It therefore keeps a shadow in NVS and re-asserts on demand.

The shadow drifts when:

- someone presses the buttons on the unit itself;
- the unit loses power and returns to its own defaults;
- a frame is lost and you didn't notice.

None of these are detectable from the bridge. The mitigations are the front-panel
mirror in the UI (so a mismatch is visible at a glance from across the room) and
the Resync button (so correcting it is one keystroke).

Adding a TSOP38238 receiver does *not* solve this — it can only hear remotes, not
interrogate the unit. Nothing short of a current clamp on the supply cord can
tell you whether the compressor is actually running, which is also why the usage
figures are labelled *estimated*.
