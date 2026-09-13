# Zephyr

A software remote for a GE room air conditioner — the through-the-wall kind with
a two-digit green display, an **Energy Saver** mode, three fan speeds and a
**Delay Hrs** timer, and no remote control anywhere in the apartment.

There is an infrared receiver behind that front panel. Zephyr gives it something
to listen to: a small ESP32 blasts the IR frames, and serves a web remote to
every phone and laptop on your network.

```
  phone / laptop                ESP32 bridge                    the unit
 ┌───────────────┐   HTTP+WS   ┌──────────────┐   940nm IR    ┌────────────┐
 │  web remote   │────────────▶│   Zephyr     │──────────────▶│  GE room   │
 │  (this repo)  │◀────────────│   firmware   │               │    A/C     │
 └───────────────┘   state     └──────────────┘               └────────────┘
                                      │
                                      └── MQTT ──▶ Home Assistant → Siri / Alexa
```

No cloud, no account, no app store. The bridge serves the remote itself, so it
keeps working when the internet doesn't.

## The part that isn't obvious

**GE doesn't make these electronics.** It badges Midea, LG, Samsung, Haier and
others, and the IR protocol follows whoever actually built the chassis — not the
logo on the front. With no original remote to learn codes from, there is nothing
to copy.

So Zephyr ships a ranked list of candidate protocols and a wizard that works down
it: send a deliberately obvious command, ask whether the unit reacted, move on if
it didn't. Usually it lands in the first two or three. Once found, the protocol is
stored in flash and you never do it again.

See [docs/PAIRING.md](docs/PAIRING.md) for what to expect, and
[docs/PROTOCOL.md](docs/PROTOCOL.md) for why the list is ordered the way it is.

## Try the remote right now

No hardware needed — a simulator with a working thermal model of the room stands
in for the bridge:

```bash
npm run sim        # then open http://localhost:8080/
```

Every control works, the room temperature responds, the compressor cycles with
realistic hysteresis, and the pairing wizard runs end to end. Nothing is
transmitted; the banner says so.

## Building the real thing

Roughly $8 of parts and fifteen minutes with a soldering iron:

| Part | Notes |
| --- | --- |
| ESP32 dev board | Any ESP32 with USB. ESP32-C3 and S3 also work. |
| 940nm IR LED | The wide-angle kind. Two in series reaches further. |
| NPN transistor (2N2222) | The GPIO cannot drive the LED hard enough alone. |
| 100Ω + 1kΩ resistors | Current limit, and base drive. |
| TSOP38238 receiver | *Optional* — verifies transmissions, learns codes. |

Wiring, tolerances and placement are in [docs/HARDWARE.md](docs/HARDWARE.md).

```bash
cd firmware
pio run -t upload          # first flash over USB
pio run -t uploadfs        # nothing to upload: the UI is baked into the binary
```

On first boot the bridge brings up a `Zephyr-Setup` Wi-Fi network. Join it, open
`http://192.168.4.1/`, give it your network, and it reboots onto your LAN as
`http://zephyr.local/`.

## What it does

- **Setpoint dial** — drag, tap, or arrow-key it from 60 to 86 °F.
- **Cool / Energy Saver / Fan Only / Dry**, three fan speeds plus Auto.
- **Sleep curve** — the setpoint drifts up 1 °F an hour, capped at 4 °F, so 4am
  isn't arctic.
- **Delay timer**, matching the panel's own Delay Hrs control.
- **Schedules** that run on the bridge, not in the browser — they fire whether or
  not anything has the page open.
- **Front-panel mirror** showing what the unit's own display should read, so you
  can check the two agree from across the room.
- **Usage estimates** from the nameplate BTU and EER, with a per-minute
  compressor chart.
- **Home Assistant** via MQTT auto-discovery, which is also the route to Siri,
  Alexa and Google.
- Works offline, installs to a phone home screen, and has a real dark and light
  theme.

## Why the interface insists on "assumed"

Infrared is one-way. Nothing ever reports back, so the bridge holds a *shadow* of
what it believes the unit is set to. Press the panel buttons by hand and the
shadow drifts. Rather than hide that, Zephyr shows the protocol and frame count
in the status rail and gives you a **Resync** button (`R`) that re-asserts the
whole state in one frame.

Commands are coalesced: holding `+` from 72 to 78 sends one frame, not seven.
A/C receivers drop frames that arrive back to back, so this is both faster and
more reliable than it sounds.

## Layout

```
web/index.html            the remote — one file, no dependencies, no build step
firmware/                 PlatformIO ESP32 project (the UI is gzipped into it)
shared/ac-model.mjs       capability model + candidate list, shared by JS
tools/simulator/          a bridge that isn't real, with a thermal model
tools/test/               unit, integration and cross-file parity tests
docs/                     hardware, pairing, protocol, API
```

The same facts — temperature limits, modes, fan speeds, candidate ordering —
live in `shared/ac-model.mjs`, `firmware/src/ac_model.h` and `web/index.html`.
`tools/test/parity.test.mjs` parses all three and fails if any drifts, which is
the only thing keeping the browser and the ESP32 honest with each other.

```bash
npm test
```

## Status

The web remote, the simulator and the shared model are tested and working —
29 tests, all passing. The firmware is written and its library usage audited
against the upstream headers, but it has **not been compiled or flashed**: the
environment it was written in cannot reach `dl.espressif.com` or the PlatformIO
registry. Run `pio run` before trusting it on hardware.

## Licence

MIT.
