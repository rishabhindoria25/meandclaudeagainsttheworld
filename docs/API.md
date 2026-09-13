# HTTP API

The bridge serves the remote at `/` and this JSON API alongside it. Same API in
`firmware/` and `tools/simulator/`, so anything written against one works with
the other. CORS is open, because it's a LAN device with no secrets worth guarding
beyond the broker password — which is write-only.

Base URL is the bridge itself: `http://zephyr.local/`.

## State

### `GET /api/state`

```jsonc
{
  "power": true,
  "mode": "cool",            // cool | eco | fan | dry
  "temperature": 72,         // °F, 60–86
  "fan": "auto",             // auto | low | medium | high
  "timerHours": 0,           // 0 = off, else 1–24
  "sleep": false,
  "telemetry": {
    "roomTemperature": 77.4, // only when a sensor is reporting
    "humidity": 48,
    "compressorSeconds": 4210,
    "energyKwh": 0.87,
    "estimatedCost": 0.21,
    "timerRemainingSec": 0,
    "sleepOffsetF": 0
  },
  "device": {
    "version": "1.0.0", "paired": true, "protocol": "COOLIX",
    "framesSent": 143, "ip": "192.168.1.44", "rssi": -52,
    "setupMode": false, "timeValid": true, "uptimeSec": 90210
  }
}
```

### `POST /api/command`

Every field is optional; send only what changes. Returns the new state.

```bash
curl -X POST http://zephyr.local/api/command \
  -H 'Content-Type: application/json' \
  -d '{"power":true,"mode":"eco","temperature":70,"fan":"low"}'
```

| Field | Type | Notes |
| --- | --- | --- |
| `power` | `bool` or `"toggle"` | |
| `mode` | `string` | Setting a mode implies power on, unless `power` is also sent |
| `temperature` | `number` | Clamped to 60–86, never rejected |
| `temperatureDelta` | `number` | Relative change |
| `fan` | `string` | |
| `timerHours` | `0`–`24` | Fires at the opposite of the current power state |
| `sleep` | `bool` | Ignored in Fan Only, which has no setpoint |

Returns **409** with the state still applied if no protocol is paired — the
shadow updates so the UI stays usable, but nothing went over the air.

### `POST /api/resync`

Re-transmits the current state unchanged. For when someone has used the panel
buttons and the shadow has drifted.

### `POST /api/sensor`

Feed in room temperature from anything you already own — a Home Assistant
automation, a Pi, an ESPHome sensor:

```bash
curl -X POST http://zephyr.local/api/sensor \
  -H 'Content-Type: application/json' -d '{"temperature":77.4,"humidity":48}'
```

## Pairing

| Route | Effect |
| --- | --- |
| `GET /api/pair` | Session state: active, index, total, current candidate |
| `POST /api/pair/start` | Begin at candidate 0 and send the first probe |
| `POST /api/pair/probe` | Re-send the current candidate's probe |
| `POST /api/pair/next` / `prev` | Move and probe. `next` returns 409 at the end of the list |
| `POST /api/pair/confirm` | Lock in the current candidate and write it to flash |
| `POST /api/pair/stop` | Abandon the session |
| `POST /api/pair/manual` | `{"protocol":"COOLIX","model":-1}` — set directly |
| `GET /api/protocols` | The full candidate list, each flagged `supported` by this build |

## Configuration

### `GET /api/config` · `POST /api/config`

`btu`, `eer`, `costPerKwh`, `timezone` (POSIX TZ string), `wifiSsid`, `wifiPass`,
`mqttHost`, `mqttPort`, `mqttUser`, `mqttPass`.

Passwords are **write-only**: `GET` reports `mqttPassSet: true|false` and never
the value. Changing Wi-Fi or the broker returns `rebootRequired: true`.

### `GET /api/schedules` · `POST /api/schedules`

Up to eight. `POST` replaces the whole list, so omitting an entry deletes it.

```jsonc
{ "schedules": [ {
    "enabled": true,
    "days": 127,            // bitmask, bit 0 = Sunday
    "hour": 22, "minute": 30,
    "label": "bedtime",
    "action": { "power": true, "mode": "cool", "temperature": 72,
                "fan": "low", "sleep": true }
} ] }
```

Schedules run on the bridge against NTP time, so they fire whether or not a
browser is open.

### Maintenance

`POST /api/energy/reset` · `POST /api/reboot` · `POST /api/factory-reset`
(clears Wi-Fi and pairing).

## WebSocket

`ws://zephyr.local/ws` pushes the same object as `GET /api/state` on every change
and as a heartbeat every two seconds. Send nothing; it is one-way. The browser
uses it for live state and falls back to polling if the socket drops.

## Home Assistant

Set `mqttHost` and the bridge publishes a discovery payload to
`homeassistant/climate/zephyr_<mac>/config`, appearing as a climate entity with
modes, fan speeds, `eco` and `sleep` presets, and current temperature when a
sensor is reporting. From there, HomeKit / Alexa / Google follow through whatever
bridge Home Assistant is already running.
