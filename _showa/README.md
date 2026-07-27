# Showa Hi-Fi Counter — re-skin reference

A re-skin of the WiiM Dashboard into the **Showa Hi-Fi Counter** visual language: walnut cabinet, warm taupe faceplate, rust signal accent — Rams/Loewy hi-fi object language fused with 1960s–80s jazz album-cover graphics.

All work is through Round 38. Every panel is shipped and confirmed live.

---

## Mobile optimization note

The dashboard is designed for desktop browsers. The existing codebase has legacy `sm:`/responsive Tailwind variants from before this fork — they are not actively maintained as part of the re-skin and new layout work does not add responsive hedging. Mobile optimization is a known open item (see below) and may be revisited in a future pass or by user request.

---

## Repo-config changes (permanent, not part of the copy/revert cycle)

Two small edits were applied once and should stay permanently:

- **`tsconfig.json`** — `"_showa"` added to `exclude`. TypeScript's repo-wide `**/*.tsx` include was trying to type-check staged files in place, where their relative sibling imports don't resolve. This is what caused the Round 3–4 build failures.
- **`.dockerignore`** — `_showa` added. Keeps the staging folder out of the Docker build context. Not required for correctness but keeps builds clean.

---

## Dual-write convention

All visual/component edits are written to **both** `src/components/...` and `_showa/components/...` in the same turn. Data-layer files (`src/lib/wiim/`, API routes) are `src/`-only with no mirror — `_showa/` has no `lib/` tree by design.

Handoff docs (`_showa/SESSION_HANDOFF.md`, `_showa/README.md`) are `_showa/`-only.

Orphaned files are left on disk unreferenced rather than deleted (established convention).

---

## Design tokens (locked, Round 38)

| Token | Value | Role |
|---|---|---|
| `--walnut` | `hsl(29 83% 12%)` → `#3B2306` | Cabinet body |
| `--walnut-dark` | `hsl(29 83% 8%)` → `#2A1804` | Cabinet gradient shadow end |
| `--faceplate` | `hsl(29 20% 62%)` → `#B19D8B` | Panel face, text, controls |
| `--faceplate-dim` | `hsl(29 20% 56%)` | Dim variant (slider bevels, etc.) |
| `--primary` (rust) | `hsl(17 77% 44%)` → `#C64C1A` | Active states, artist name, accents |
| `--static` | `hsl(36 10% 10%)` → `#1C1A17` | Panel face base, deep backgrounds |
| `--velvet` | `hsl(0 53% 30%)` → `#7A2424` | Mute / error only — keep rare |
| `--teal` | `hsl(178 46% 33%)` → `#2E7D7A` | Mechanism glow / "now playing" tell |
| `--brass` | `hsl(40 45% 62%)` | Preset blank-slot tile base |
| `--brass-dim` | `hsl(35 35% 52%)` | Preset blank-slot tile gradient end |

**Fonts:** Antonio (`font-display`) · IBM Plex Sans (`font-sans`) · IBM Plex Mono (`font-mono`)

Panel headings: `font-display text-base uppercase tracking-[0.15em]` — applied consistently across all panels as of Round 38.

---

## Asset inventory (`public/`)

These assets are owned by the re-skin, baked into the Docker image at `--build` time. A new or replaced asset always requires `docker compose up -d --build` — a plain restart 404s it.

| File | Size | Used by |
|---|---|---|
| `play-button.png` | 200×200 RGBA | `now-playing-card.tsx` — transport row play/pause dome |
| `cubby-with-records-plain.png` | 900×584 | `now-playing-card.tsx` — CubbyArt layer 1 (recessed box + leaning stack) |
| `now-playing-stand.png` | 777×115 | `now-playing-card.tsx` — CubbyArt layer 3 (nameplate in front of art) |
| `tonearm2.png` | 166×419 RGBA | `now-playing-card.tsx` — CubbyArt layer 4 (static photo tonearm, vinyl view only) |
| `keycap.png` | 176×68 | `keycap-button.tsx` — source/output selector keys |
| `led-on.png` | 22×22 RGBA | `keycap-button.tsx`, `eq-card.tsx`, `sub-card.tsx` — lit indicator lamp |
| `led-off.png` | 22×22 RGBA | `keycap-button.tsx`, `eq-card.tsx`, `sub-card.tsx` — unlit indicator lamp |
| `power-btn.png` | — | `eq-card.tsx`, `sub-card.tsx` — PowerKnob lit base |
| `power-off-overlay.png` | — | `eq-card.tsx` — PowerKnob dark cap overlay |
| `eq-knob.png` | — | `eq-card.tsx`, `sub-card.tsx` — EQ/sub slider cap thumb |

---

## Component inventory (shipped, Round 38)

### `src/app/globals.css` + `_showa/app/globals.css`
Palette HSL tokens, `.glass` raised-bevel panel treatment, `.control-tile` flat-faced variant (for keycap compartments and action tiles), `.cabinet` helper. All cards derive from these — a token change here repaints everything.

### `src/app/layout.tsx` + `_showa/app/layout.tsx`
Loads Antonio / IBM Plex Sans / IBM Plex Mono via `next/font/google` (self-hosted at build time, required by CSP `font-src 'self'`). Sets `--font-display/--font-sans/--font-mono` variables. Contains the fixed full-viewport inline `<svg>` cabinet woodgrain (feTurbulence `baseFrequency="0.006 0.25"` / `numOctaves=5` / `seed=3`, soft-light @ 0.72).

### `tailwind.config.ts` + `_showa/tailwind.config.ts`
Adds `font-display`/`font-mono` families, Showa material colors, the `marquee` keyframe + `animate-marquee` utility.

### `src/components/ui/card.tsx` + `_showa/components/ui/card.tsx`
`Card` switched from hardcoded `rounded-3xl` to token-driven `rounded-lg`.

### `src/components/ui/slider.tsx` + `_showa/components/ui/slider.tsx`
`seek` and `volume` variants (thin recessed groove + flat-top beveled cap thumb — rust for seek, cream for volume). `default` variant is byte-for-byte the original (EQ card and anything else using `Slider` are unaffected).

### `src/components/ui/marquee-text.tsx` + `_showa/components/ui/marquee-text.tsx`
Scrolling AVR-style readout for long track titles. Measures actual text width vs. container; static (truncated) when it fits, scrolls only on real overflow. Respects `prefers-reduced-motion`. Pauses on hover. Driven by `--marquee-distance`/`--marquee-duration` CSS vars per instance.

### `src/components/dashboard/quality-pill.tsx` + `_showa/components/dashboard/quality-pill.tsx`
`readout` tone variant (tier-agnostic cream, squared, subtle inset) for the stream-info band. Hardcoded colour references replaced with faceplate tokens so it tracks palette changes automatically.

### `src/components/dashboard/now-playing-card.tsx` + `_showa/components/dashboard/now-playing-card.tsx`
The main showpiece. Key structure:

**Layout**: flex row (`lg:items-stretch`) — left `CubbyArt` column (`lg:w-[45.5%]`) + right `.glass` Card (`flex flex-col`).

**CubbyArt layers** (back to front):
1. `cubby-with-records-plain.png` — recessed box + leaning stack
2. Content box (`h-[93%] aspect-square`, right 64% of cubby minus 6% right padding, floor-seated at `pb-[4%]`): cover art / VinylDisc / LyricsView
3. `now-playing-stand.png` — child of art box, `w-[80%]`, `translate-y-[30%]`
4. `tonearm2.png` — absolute sibling at `top:6% right:4.4% width:13%`, `zIndex:5`, visible in vinyl view only

**Toggle row**: bare glyphs on wood, `left-[66.08%] -translate-x-1/2` (derived constant from cubby geometry), `size-7` buttons / `size-5` icons, `ICON_SHADOW` drop-shadow, `min-h-8` wrapper.

**Right panel**: Antonio title (all-caps, `text-5xl/6xl`) in `MarqueeText` / rust artist / mono album / seek slider / engraved seam / transport row (`play-button.png` dome at `size-[55px]`, bare-glyph prev/next/shuffle/repeat, `variant="volume"` slider) / recessed full-bleed stream-info footer.

**Panel textures**: `panelGrain` (fractalNoise `0.022`/2 octaves, soft-light @ 0.07) + `panelGrain2` (fractalNoise `0.45`/2 octaves, soft-light @ 0.10), both inline `<svg>` siblings.

### `src/components/dashboard/source-output-panel.tsx` + `_showa/components/dashboard/source-output-panel.tsx`
One `.glass` Card with a collapsible accordion (CSS `grid-template-rows: 0fr → 1fr`, closed by default). Trigger row is a `.control-tile` strip reading `Radio Source | Speaker Output | Settings Device` + rotating chevron. Inside: SOURCE row / OUTPUT row / DEVICE column (device switcher, Add/Settings/Logout `.control-tile` action tiles, model/firmware/IP/Wi-Fi/USB-DAC info). Keycap buttons use `keycap.png` + `led-on/off.png`, fixed `KEYCAP_WIDTH`, left-aligned flex rows.

Orphaned by this panel: `source-card.tsx`, `output-card.tsx`, `option-grid.tsx`, `app-header.tsx`, `device-info-card.tsx`.

### `src/components/dashboard/keycap-button.tsx` + `_showa/components/dashboard/keycap-button.tsx`
One selector key built around `keycap.png`. Active = `led-on.png` + icon/label rust; inactive = `led-off.png` + dim faceplate. No press transform (clicks visually silent).

### `src/components/dashboard/preset-card.tsx` + `_showa/components/dashboard/preset-card.tsx`
Six-up recessed walnut cubby grid (`grid-cols-6`). Three tile states: art (warm-monotone inactive, full-colour active with rust lacquer frame + protruding bar tab) / named-no-art (brass tile with name) / empty (brass tile with tight thick-ring Antonio numeral). Client-side tap memory for active state (WiiM API has no durable "which preset is active" field). `presetsPanelGrain`/`presetsPanelGrain2` face texture (same recipe as now-playing, unique filter IDs).

### `src/components/dashboard/eq-card.tsx` + `_showa/components/dashboard/eq-card.tsx`
Always-open `.glass` panel. EQUALIZER wordmark + `SlidersVertical` icon. POWER knob (`power-btn.png`/`power-off-overlay.png`). Tan-tile source tabs + Graphic/Parametric sub-tabs with `led-on/off.png` indicators. Graphic EQ: 10-band `EqSlider` (recessed groove, tick hairlines, `eq-knob.png` cap with hard directional drop-shadow). Parametric EQ: 10 rows (a–j), `TypeDropdown` (6 filter types: Off/LS/PK/HS/LP/HP), `FreqInput` (controlled), `PeqAxis` with `PeqSlider` (log scale for Q) and below-track tick marks. L/R channel mode: Stereo/L/R dropdown, independent per-channel editing. Footer: Presets dropdown grouped with rename/delete/save. `eqPanelGrain`/`eqPanelGrain2` face texture.

### `src/components/dashboard/sub-card.tsx` + `_showa/components/dashboard/sub-card.tsx`
`CircleDot` wordmark icon. PowerKnob (no ON/OFF labels). Level + Crossover as `SubSlider` (horizontal recessed groove, `eq-knob.png` cap, live −/+ step buttons, value readout, unlabeled tick marks). Phase row with tan-tile buttons + `h-[0.7rem]` PNG LEDs. Full-width layout in dashboard grid (`px-36` body padding). "connected" pill removed.

### `src/components/dashboard/kiosk-view.tsx` + `_showa/components/dashboard/kiosk-view.tsx`
Walnut gradient background. Inline `<svg id="kioskGrain">` (same feTurbulence params as cabinet grain, unique filter ID — avoids z-index stacking context issues). Antonio title / rust artist / mono album. `play-button.png` dome at `size-[72px]`. Bare-glyph prev/next/close. `variant="volume"` slider + three-way mute icon. `tone="readout"` QualityPill. Faceplate tokens throughout.

### `src/components/dashboard/dashboard.tsx` + `_showa/components/dashboard/dashboard.tsx`
Page shell. `max-w-[78rem]`. Sub-out panel full-width in the grid. `activePresetIndex`/`activePresetName` owned here and passed down to `PresetCard` and `NowPlayingCard`.

### `src/components/ui/service-logo.tsx` + `_showa/components/ui/service-logo.tsx`
Added `"vendor"` case to the Radio-icon fallback so real vendor-reported names (Plex, etc.) get a distinct treatment from generic "network" streams.

### `src/components/dashboard/lyrics-view.tsx` + `_showa/components/dashboard/lyrics-view.tsx`
Container resized to `size-[19rem]`, border radius removed. First staged in Round 26.

---

## Key operational patterns

- **Deploy**: `docker compose up -d --build` for all source changes. `docker compose restart` does NOT trigger Next.js rebuild and does NOT pick up new `public/` assets.
- **Dry-run before apply**: `Filesystem:edit_file` with `dryRun: true` always runs first; diff reviewed before `dryRun: false`.
- **SHA256 verification**: `Get-FileHash` on both `src/` and `_showa/` trees after every dual-write, confirmed MATCH before proceeding.
- **Bracket balance check**: Python script stripping comments/template literals/quoted strings before counting delimiters; run after every component edit.
- **`Select-String` post-edit**: confirm new string present AND old string absent on disk. Use `-LiteralPath` (not `-Path`) for files under `[id]` paths — PowerShell treats brackets as glob characters with `-Path`.
- **`[id]` path gotcha**: `Select-String -Path` silently matches nothing on paths containing `[id]`. Always use `Get-Content -LiteralPath` + `-match` for verification on API route files.
- **SQLite capability cache**: capabilities are cached in `/data/wiim.db` inside the container. Survives rebuilds and reboots. Only cleared by `/api/devices/[id]/refresh` or device re-add. A fix to capability detection logic requires a cache flush to take effect.
- **WSL2 port forwarding**: `networkingMode=mirrored` in `.wslconfig` (under `[wsl2]`). Do NOT add portproxy rules — they break mirrored mode. Port forwarding to Windows can lag 30–60s after container start; false "unreachable" errors resolve on their own.
- **PWA service worker**: `sw.js` can cache stale state across container restarts. Unregister in devtools if fetch errors appear after a rebuild.
- **Debug logging**: stripped before session close, verified clean.
- **Session handoff**: `_showa/SESSION_HANDOFF.md` (detailed pass-by-pass trace, open flags) and `_showa/README.md` (this file) updated before closing every session.

---

## Known open items

These are genuinely open — not cleared bugs or deferred-then-done items.

- **Mobile optimization**: the dashboard currently targets desktop browsers only. The existing codebase has legacy `sm:`/responsive Tailwind variants that are not maintained. A future pass could audit these, restore responsive behaviour, and optimize the panel layouts for mobile/tablet viewports — either as a general effort or targeting specific panels (e.g. the now-playing card and presets). Priority: low / by request.
- **Panel texture on Source/Output panel**: `source-output-panel.tsx` does not yet carry the two-layer `feTurbulence` grain applied to the now-playing, presets, EQ, and sub-out panels. Straightforward to add; same recipe, unique filter IDs.
- **Upstream sync**: fork is ~39 commits ahead / ~20 behind upstream as of Round 38. The 20-behind is primarily upstream's July 2026 GetInfoEx release batch (v0.3.8–v0.3.11, largely already cherry-picked into this fork) and a new Home Assistant add-on. Monitor upstream for further changes worth pulling in. Next candidate cherry-picks noted in `SESSION_HANDOFF.md`.
- **Screenshot refresh in public README**: the two embedded screenshots predate the full Showa re-skin. New screenshots would better represent the current app.

---

## Changelog

**Round 1:** `.glass` translucency fix (alpha → opaque). Quality-pill lossless slate-grey → faceplate-cream. Card hardcoded `rounded-3xl` → token-driven `rounded-lg`.

**Round 2:** `.glass` box-shadow rewritten from outward elevation to genuine inset shading. Hardcoded violet tint removed from `now-playing-card.tsx`. Second slate-grey instance fixed in `StreamInfoLine`.

**Round 3:** Staging folder moved `src/_showa/` → repo-root `/_showa/`. Did not fix the build failure (wrong theory — Next's build scope wasn't the issue).

**Round 4:** `"_showa"` added to `tsconfig.json` `exclude` — the real fix. `_showa` added to `.dockerignore` for build-context size.

**Round 5:** `font-display`/`font-mono` classes applied to title, timestamps, volume readout, codec label, quality pill. Revealed a process bug: edits had only landed in `_showa/`, not `src/` — motivating the dual-write-every-turn discipline going forward.

**Round 6:** Title rescaled `text-2xl` → `text-5xl/6xl`, all-caps, bold, tight tracking (pixel-measured against Lovart mockup using album-art width as common reference). `MarqueeText` component added for long-title overflow. Artist line bold-uppercase-tracked; album line switched to `font-mono`.

**Round 7:** Engraved seam added between metadata block and transport row. Pixel-sampled from mockup (darker than panel, not lighter — `--border` token was wrong choice). Renders unconditionally.

**Round 8:** Transport buttons: CSS dome attempts abandoned; Greg supplied `play-button.png` PNG. Prev/next/shuffle/repeat became bare-glyph icons. Album-art colour wash (`extractColor`) removed from now-playing card. Transport + volume merged into one horizontal row. Page shell widened `max-w-5xl` → `max-w-[78rem]`. Spacing rhythm pass (play-button diameter as scale reference). `StreamInfoLine` left-aligned, larger, HI-RES gold → rust.

**Round 9:** Source pill + bitrate `QualityPill` removed from card top; bitrate moved into stream-info band as `tone="readout"` variant. `seek`/`volume` Slider variants (thin track + beveled cap). Volume `StepperSlider` −/+ removed. Stream-info promoted to recessed full-bleed footer band. Metadata↔transport seam centered (`mt-[44px]`/`mt-[44px]`).

**Round 10:** Cabinet woodgrain applied — fixed `<svg>` in `layout.tsx`, soft-light @ 0.72 (locked: `baseFrequency="0.006 0.25"` / `numOctaves=5` / `seed=3`). Panel face texture added to now-playing card (`panelGrain` svg, `fractalNoise 0.022`/2 octaves, soft-light @ 0.13). Dashboard `<main>` padding `py-5` → `py-20`.

**Round 11:** Second panel texture layer (`panelGrain2`, `fractalNoise 0.45`/2 octaves, soft-light @ 0.10) stacked on layer 1. Layer 1 opacity nudged `0.13` → `0.07` after seeing both layers live.

**Round 12:** `.glass` flipped from inset-recess to raised bevel (built from Greg's Photoshop layer-style values: Inner Bevel up, 7px/61°/37°; highlight white @ 19%; shadow black @ 72%; 5px black outer stroke @ 60%).

**Round 13:** `seek`/`volume` slider caps reworked from flat dots to flat-top beveled cylinders. Track upgraded from flat hairline to recessed groove.

**Round 14:** Cubby rebuild — album art moved from inside `.glass` panel to its own `CubbyArt` component (separate object on the cabinet). Three content layers: `cubby-with-records-plain.png` / live art content box / `now-playing-stand.png`. Two new binary assets in `public/`.

**Round 15:** Stand inset to `w-[80%]` centered inside cubby interior. Toggle cluster housed in `.glass` panel. `.glass` border fixed from lighter-than-panel `--border` token to `1px solid hsl(0 0% 0% / 0.5)`.

**Round 16:** Stand sizing made relative to art width (not cubby). Stand is now a child of the content box; `w-[73%]`, `translate-y-[30%]`, `z-10`.

**Round 17:** Art content box `h-[88%]` → `h-[93%]`, wrapper `pb-[7%]` → `pb-[4%]` (seats art on cubby floor). Stand `w-[73%]` → `w-[80%]`. `.glass` box-shadow replaced wholesale with Greg's exact PSD spec (brighter bevel highlight, hairline outer ring).

**Round 18:** Toggle cluster padding `p-1.5` → `p-3`, gap `gap-1` → `gap-4`. `StreamInfoLine` + `QualityPill` weights dropped to `font-normal`; sizes tightened so row fits on one line without wrapping.

**Round 19:** Toggle panel housing removed (bare glyphs on wood). Toggle row centering fixed algebraically to `left-[66.08%] -translate-x-1/2` (derived from cubby geometry). Faceplate colour shifted cream → taupe (`#a78d7a`), all five faceplate tokens moved in lockstep.

**Round 20:** Faceplate desaturated `#a78d7a` → `#a09287` (eliminates orangey cast). Icon drop-shadows added (`ICON_SHADOW` constant). Prev/next and heart `strokeWidth` fixed. Bitrate pill background token-driven. Toggle-row `min-h-8` fix. Play button `size-[72px]` → `size-[55px]`. Slider track solid. Photo tonearm (`tonearm2.png`) added to CubbyArt as layer 4 (vinyl view only). `lg:items-stretch` + `flex-1` layout alignment for icon row vs stream-info band. Artist name → `text-[hsl(var(--primary))]` (rust).

**Round 21:** Source/Output panel rebuilt as `source-output-panel.tsx` + `keycap-button.tsx`. Keycap PNG keys, PNG LED lamps, SOURCE/OUTPUT rows with full-bleed engraved seam. Lifted out of small-cards grid into `dashboard.tsx` directly under now-playing card. `SourceCard`/`OutputCard`/`option-grid.tsx` orphaned.

**Round 22:** Presets panel (`preset-card.tsx`) built from Lovart mockup across three passes: recessed trough + tile states + brass blank numerals + rust active frame + client-side tap memory. Tonearm rendering bug fixed (gated on `view === "vinyl"`). Data-layer: Plex/DLNA cast detection fixed (3 root causes across 5 files).

**Round 23:** Presets rebuilt into independent recessed walnut cubbies on `grid-cols-6`. Gap is the walnut wall. Active tile gains protruding bar tab. Warm-monotone filter on inactive tiles. Two tuning passes (gap, numeral). Greg confirmed "perfect."

**Round 24:** Source/output keycap sizing fix. DLNA/radio/Plex service-name fix in `now-playing-info.ts`: removed bad `vendor` fallback, lifted preset-name memory to `dashboard.tsx`, split `"network"` from `"vendor"` service key. `service-logo.tsx` staged.

**Round 25:** Source/Output panel gained DEVICE column (device switcher, Add/Settings/Logout, model info). `app-header.tsx` and `device-info-card.tsx` orphaned. Fixed button-size bug (shared fixed `KEYCAP_WIDTH` replaces per-row grid). Vertical label stacking. `.control-tile` CSS class added. DEVICE column widened to 600px. `source-output-panel.tsx` became full `Source/Output/Device` panel.

**Round 26:** Lyrics lookup fixed (LRCLIB `/api/search` fallback + 12s timeout). `lyrics-view.tsx` resized to `size-[19rem]`, border radius removed. First staged.

**Round 27:** Source/Output/Device panel wrapped in CSS accordion collapsible (closed by default). `.control-tile` trigger row. No new dependency.

**Round 28:** EQ panel (`eq-card.tsx`) first staged. Graphic EQ view + shared chrome: POWER knob, tan-tile tabs with PNG LEDs, 10-band `EqSlider` with `eq-knob.png` cap. `eqPanelGrain`/`eqPanelGrain2` texture. Parametric EQ deferred to Round 29.

**Round 29:** Parametric EQ view built: 10 rows (a–j), `TypeDropdown`, `FreqInput`, `PeqAxis` with `PeqSlider` (log-scale Q) and below-track tick marks. Value formatting: Gain ±dB to 1 decimal, Q to 2 decimals.

**Round 30:** Diagnosed PEQ L/R data-layer issues (device in L/R mode, 12 bands, 6 filter types). Spec written to `_showa/PEQ_LR_SPEC.md`. No code changes.

**Round 31:** PEQ L/R support implemented. Stereo/L/R mode dropdown, per-channel editing, all 6 filter types, LP/HP gain-disable, `FreqInput` converted to controlled, reset-to-defaults button. Tab font `text-sm` → `text-xs`. All confirmed working live.

**Round 32:** Sub-out panel (`sub-card.tsx`) full re-skin: `CircleDot` icon, PowerKnob, `SubSlider` for Level + Crossover, Phase row with tan-tile buttons + PNG LEDs. Full-width in dashboard grid. EQ: LED switched to `led-on/off.png` PNG assets; PowerKnob ON/OFF labels removed.

**Round 33:** `caps.subwoofer` false-positive fixed in `capabilities.ts`: rekeyed detection on `plugged` field presence (not `level`/`status`, which every LinkPlay device returns). SQLite capability cache requires `/api/devices/[id]/refresh` to pick up the fix — does not self-clear on rebuild. EQ `TabButton` padding tightened; `SlidersVertical` icon added to EQUALIZER wordmark.

**Round 34:** Kiosk view re-skinned (`kiosk-view.tsx`): walnut background, inline `kioskGrain` SVG, Antonio/rust/mono typography, `play-button.png` dome at `size-[72px]`, `tone="readout"` QualityPill. Upstream sync audited at v0.3.6.

**Round 35:** GetInfoEx now-playing integration: cherry-picked upstream `a05ba34` (new `upnp.ts` GetInfoEx client + `fetchTrackMeta`); hand-applied `7886c83` transport shape. Poll-delta heuristic replaced by honest `CurrentTransportState`. BitRate backfill preserved (fork delta — upstream GetInfoEx omits `song:bitrate`). Hardware-verified standalone + multiroom-slave. Fork now ~30 commits ahead of upstream.

**Round 36–37:** Upstream cherry-picks v0.3.8–v0.3.11 (loop-mode fix, GetInfoEx transport improvements, OEM source fallback via PlayType/PlayMedium). Multiroom fixes (role detection, group mute, group volume, slave art for Plex/Spotify). ESLint added (flat config). Preset-highlight bug fixed (per-device leak, never-highlights). PWA install fix. App footer URL fix.

**Round 38:** Palette retune locked — `--faceplate` → `hsl(29 20% 62%)` (`#B19D8B`), `--primary` (rust) → `hsl(17 77% 44%)` (`#C64C1A`), plus all derived tokens shifted proportionally. Panel heading consistency pass: `font-display text-base uppercase tracking-[0.15em]` applied uniformly across all panel headers.
