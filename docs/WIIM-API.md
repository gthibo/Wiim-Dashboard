# WiiM / LinkPlay HTTP API reference

The commands this project uses, as implemented in `src/lib/wiim/`. Sources: the official *HTTP API for WiiM Products v1.2* PDF, [`python-linkplay`](https://github.com/Velleman/python-linkplay), and [`pywiim`](https://github.com/mjcumming/pywiim). Where a command is **not** in the official PDF it's marked _community-verified_.

## Transport

```
GET https://<device-ip>/httpapi.asp?command=<COMMAND>
```

- **HTTPS on port 443**, self-signed cert (CN `www.linkplay.com`) — TLS verification must be disabled.
- Some firmware (e.g. WiiM Ultra fw 5.x) requires a **mutual-TLS client certificate** — the shared LinkPlay cert is embedded in `src/lib/wiim/linkplay-cert.ts`.
- Most queries return JSON (string-typed values); setters return `OK`. `unknown command` indicates the model doesn't support it.

## Device info — `getStatusEx`

Returns identity + capabilities. Fields this app reads:

| Field | Meaning |
|---|---|
| `DeviceName` / `ssid` | device name |
| `project` / `priv_prj` | model code (→ friendly name) |
| `firmware` / `Release` | firmware version |
| `MAC` / `STA_MAC` / `ETH_MAC` | MAC |
| `apcli0` / `eth0` / `ra0` | IP (active interface) |
| `uuid` | device UUID |
| `RSSI` / `internet` | wifi signal / internet flag |
| `EQ_support` | EQ capability flag |
| `plm_support` | **bitmask** of supported inputs (see below) |
| `preset_key` | number of preset slots |
| `temperature_cpu` / `temperature_tmp102` | °C — **amp models only** |

## Playback

| Purpose | Command |
|---|---|
| Status (extended) | `getPlayerStatusEx` |
| Metadata (art, rate) | `getMetaInfo` → `metaData.{albumArtURI,sampleRate,bitDepth,bitRate,title,artist,album}` |
| Resume / Pause / Toggle | `setPlayerCmd:resume` / `:pause` / `:onepause` |
| Next / Prev / Stop | `setPlayerCmd:next` / `:prev` / `:stop` |
| Seek (seconds) | `setPlayerCmd:seek:<s>` |
| Volume (0–100) | `setPlayerCmd:vol:<n>` |
| Mute | `setPlayerCmd:mute:<0\|1>` |
| Loop/shuffle | `setPlayerCmd:loopmode:<n>` |

`getPlayerStatusEx` notes: `status` = `play|pause|stop|load`; `Title`/`Artist`/`Album` are **hex-encoded UTF-8**; `curpos`/`totlen` are ms; `mode` = numeric source; `vol`, `mute`, `eq`, `loop`.

### Playing-mode (`mode`) → source

`10/20…` network/streaming · `1` AirPlay · `2` DLNA · `31` Spotify · `32` TIDAL · `40` line-in · `41` Bluetooth · `43` optical · `45` coaxial · `49` HDMI · `51` USB-DAC · `54` phono · `58` HDMI ARC … (full map in `constants.ts`). Streaming modes are treated as the "Network/WiFi" source.

## EQ

| Purpose | Command |
|---|---|
| On / Off | `EQOn` / `EQOff` |
| State | `EQGetStat` |
| List presets | `EQGetList` |
| Load preset | `EQLoad:<name>` (e.g. `Bass Booster`) |

Per-band graphic/parametric EQ exists on newer firmware but is **community-only** and not implemented here.

## Sub-out _(community-verified; WiiM Ultra fw5.2+, Pro fw4.8+)_

| Purpose | Command |
|---|---|
| Get all sub settings | `getSubLPF` |
| Level (−15…+15 dB) | `setSubLPF:level:<n>` |
| Crossover (30–250 Hz) | `setSubLPF:cross:<n>` |
| Phase (0/180) | `setSubLPF:phase:<0\|180>` |
| Delay (−200…200 ms) | `setSubLPF:sub_delay:<n>` |
| Enable | `setSubLPF:status:<0\|1>` |

`getSubLPF` also reports `plugged` (subwoofer connected).

## Input source switching

```
setPlayerCmd:switchmode:<mode>   # case-sensitive
```

Official: `wifi`, `line-in`, `bluetooth`, `optical`, `udisk`. Community/extended: `co-axial`, `HDMI`, `ARC`, `phono`, `RCA`, `XLR`, `PCUSB`, `line-in2`, `optical2`, `co-axial2`, `cd`. The app shows only inputs present in the `plm_support` bitmask.

### `plm_support` bitmask
`2` line-in · `4` bluetooth · `8` usb · `16` optical · `32` rca · `64` coaxial · `256` line-in2 · `512` xlr · `1024` hdmi · `2048` cd · `32768` usb-dac · `65536` phono · `262144` optical2 · `524288` coaxial2 · `4194304` arc.

## Audio output

| Purpose | Command |
|---|---|
| Read | `getNewAudioOutputHardwareMode` → `{hardware,source,audiocast}` |
| Set | `setAudioOutputHardwareMode:<n>` |

`n`: `1`=optical, `2`=line-out, `3`=coax _(documented)_; `4`=headphones (Ultra) _(community)_.

## Presets (favourites)

| Purpose | Command |
|---|---|
| Count | `getStatusEx.preset_key` |
| List (names + artwork) | `getPresetInfo` → `preset_list[{number,name,url,source,picurl}]` |
| Play slot N | `MCUKeyShortClick:<n>` |

## Discovery

- **SSDP** `M-SEARCH` for `urn:schemas-upnp-org:device:MediaRenderer:1` (+ `urn:schemas-wiimu-com:service:PlayQueue:1`), then confirm via `getStatusEx`. Needs UDP multicast (host networking).
- **IP-range scan** — probe `getStatusEx` on each host in a `/24` (works in Docker bridge mode).

## Not implemented (by choice)

Destructive/administrative commands — `reboot`, `setShutdown`, factory reset, network config — are intentionally **not** proxied for safety.
