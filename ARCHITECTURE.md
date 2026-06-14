# Architecture

This document explains how Wiim Dashboard is put together so you can extend it confidently.

## Overview

A single **Next.js 15 (App Router)** application plays two roles:

1. **UI** — React Server Components render the pages; client components handle interactivity and poll for live state.
2. **Server-side device proxy** — Route Handlers under `src/app/api` authenticate the request, then talk to the WiiM device on the LAN over HTTPS. **The browser never contacts the device directly.**

```
Browser (client components, SWR polling)
   │  fetch /api/...   (session cookie + CSRF header)
   ▼
Next.js Route Handlers (Node runtime)  ──auth/CSRF guard──> lib/wiim/* ──HTTPS──> WiiM device
   │                                                         (mTLS, SSRF guard, parsing)
   ▼
better-sqlite3 (users, sessions, devices, settings)
```

## Request lifecycle

1. **Middleware** (`src/middleware.ts`, edge): generates a per-request CSP nonce, sets security headers, and gates page navigation (redirects to `/login` when the session cookie is absent). It does **not** touch the DB.
2. **Route handler** (`src/app/api/.../route.ts`, Node): calls `guard(req, { mutation })` from `src/lib/api.ts` to require a valid session and (for mutations) verify the CSRF double-submit token + Origin.
3. **Validation**: request bodies are parsed with Zod (`src/lib/validate.ts`).
4. **Device call**: handlers resolve the device from SQLite, then call a typed function in `src/lib/wiim/commands.ts`.
5. **Transport**: `src/lib/wiim/client.ts` resolves the host to an IP, verifies it's a LAN address, pins the connection to that IP, and sends the `httpapi.asp` command over HTTPS with the LinkPlay client cert.
6. **Parsing**: `src/lib/wiim/parse.ts` normalises the raw response (hex-decoding metadata, mapping numeric enums) into the UI-friendly types in `src/lib/wiim/types.ts`.

## Modules

### `src/lib/wiim/` — device layer (server-only)

| File | Responsibility |
|---|---|
| `client.ts` | Low-level HTTPS transport: self-signed cert bypass + LinkPlay mTLS, **SSRF guard** (resolve → IP-check → pin), album/preset art fetch policy |
| `constants.ts` | Command builders + numeric enums (sources, outputs, loop modes, sub ranges) mirrored from the official API / python-linkplay |
| `commands.ts` | High-level typed functions: `fetchPlayerStatus`, `control`, `setEq`, `setSubwoofer`, `switchSource`, `setOutput`, `fetchPresets`, `playPreset`, … + the 30 s preset-list cache |
| `parse.ts` | Tolerant JSON parse, hex decode, status/source/output mappings |
| `capabilities.ts` | Probes a device once and builds its `DeviceCapabilities` (temperature, sub-out, EQ, outputs, sources, preset count) |
| `snapshot.ts` | One poll = a parallel `Promise.allSettled` of everything the dashboard needs for a device |
| `discovery.ts` | SSDP multicast + direct IP-range scan |
| `linkplay-cert.ts` | The shared public LinkPlay mTLS client cert/key |

### `src/lib/auth/` — authentication & hardening (server-only)

`password` (Argon2id), `session` (opaque tokens, HMAC-hashed in DB, cookies), `csrf` (double-submit + origin), `turnstile` (siteverify), `totp` (otplib), `rate-limit` (per-IP + global), `request` (trusted-proxy client IP).

### `src/lib/db/` — persistence

`better-sqlite3` (WAL) with tables: `users`, `sessions`, `devices`, `settings`, `login_attempts`. Schema is created idempotently in `index.ts`. The connection is cached on `globalThis` to survive dev hot-reload.

### `src/lib/client/` — browser helpers

`api.ts` (fetch wrapper that injects the CSRF header from the cookie) and `hooks.ts` (SWR hooks: `useDevices`, `useSettings`, `useSnapshot`).

### `src/components/`

`ui/` primitives, `auth/` forms + Turnstile, `dashboard/` feature cards, `devices/` manager, `settings/` view, plus a global `toast` provider.

## Data flow: live dashboard

- The dashboard selects a device and calls `useSnapshot(deviceId, intervalMs)` (default 3 s).
- `GET /api/devices/[id]/snapshot` runs `getDeviceSnapshot`, which fetches device info, player status, metadata, and — based on cached capabilities — sub-out, output, EQ and presets, all in parallel.
- Cards render conditionally from the snapshot + capabilities. Mutations (play, volume, source, …) POST to the relevant route then call SWR `mutate()` to refresh.

## Capability detection

On add/refresh, `detectCapabilities` reads `getStatusEx` (`EQ_support`, `plm_support` input bitmask, `preset_key`, temperature fields, project name) and probes `getSubLPF` / `getNewAudioOutputHardwareMode`. The result is cached on the device row so the poll loop doesn't re-probe. Snapshots also read `preset_key` live, so preset support works even on devices cached before that field existed.

## Caching

- **Preset list** (`getPresetInfo`): cached 30 s in `commands.ts`, shared between the poll and the 12 preset-art image requests (avoids an N+1 storm on the embedded device).
- **Preset/album artwork**: proxied through the server with a 1 h in-memory byte cache + `Cache-Control` for the browser.

## Security layers

See [SECURITY.md](SECURITY.md). In short: device isolation + SSRF guard, session/CSRF/Turnstile/2FA/rate-limit at the app, and a nonce-based CSP + security headers in middleware.

## Deployment

Multi-stage `Dockerfile` produces a Next.js **standalone** server. Native modules (`better-sqlite3`, `@node-rs/argon2`) are kept external and copied explicitly. Runtime data lives in the **named volume** `wiim-data` (correct ownership for the non-root container user). A reverse proxy terminates TLS in front.
