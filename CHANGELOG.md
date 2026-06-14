# Changelog

All notable changes to this project are documented here. The format loosely
follows [Keep a Changelog](https://keepachangelog.com/).

## [0.1.0] — 2026-06-13

Initial public release.

### Added
- Dark, mobile-first dashboard for WiiM / LinkPlay devices.
- **Now playing**: metadata (hex-decoded), proxied album art, live progress, seek, transport, shuffle/repeat.
- **Quality readout**: bit rate · sample rate · bit depth.
- **Volume / Sub-out / Crossover** sliders with touch-friendly −/+ buttons.
- **Sub-out** control (level, crossover, phase, enable) for supported models.
- **EQ** enable/disable + named presets.
- **Source** and **Output** switching, auto-detected per model; per-device custom source names.
- **Presets**: square artwork tiles (count per model), play via `MCUKeyShortClick`, names + art from `getPresetInfo`, horizontal-scroll on phones.
- **Temperature** gauge for amp models.
- **Multi-device** support with capability detection; add by IP or LAN scan.
- **Auth**: Argon2id login, HMAC-peppered server sessions, optional TOTP 2FA, Cloudflare Turnstile, per-IP + global rate-limiting.
- **Security**: SSRF-guarded device proxy (DNS-resolve + IP-pin), double-submit CSRF, nonce-based CSP + security headers.
- **Docker** single-image deploy with named-volume persistence.
- Docs: README, ARCHITECTURE, CONTRIBUTING, SECURITY, WiiM API reference.
