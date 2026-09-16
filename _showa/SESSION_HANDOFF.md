# Showa Hi-Fi Counter — Session Handoff

*Updated end of session: September 16, 2026. Round 44b landed via full multi-model pipeline (Opus design → Kimi K3 spec → Qwen3.8 Max audit → Opus adjudication → kimi-k3 exec). Supersedes the Round 44a handoff (preserved below in "Previous round").*

## tl;dr for picking this back up

Round 44b — the snapshot batch + c68c950 UI-layer subset — landed via merge commit `bb94ae4` on `main` and **passed static verification 2026-09-16**. 6 files, +231/−108, all edits byte-exact against the adjudicated plan. Container Up (healthy) after `docker compose up -d --build`. **Static gates green:** typecheck exit 0, lint exit 0 (1 pre-existing warning, `PEQ_RANGE` unused in `eq-response-curve.tsx` — a 44c EQ-cluster file, not touched by 44b). Dual-write parity intact (both now-playing-card.tsx copies `3eb96f7d…`).

**Hardware smoke — PARTIAL 2026-09-16 (Greg, live UI).** Radio timeline: **CONFIRMED CORRECT** — renders while playing, hides on pause (matches shipped gate `{!isPhysicalInput && timelineActive &&}`, timelineActive = state playing|paused). USB source-card **SKIPPED** (Greg's Ultra now USB-connected to DAC, no hub — too much PITA to re-cable). DLNA `<res>` fallback / transport gating / no-regressions: **best-effort visual check, pending**. No regressions observed in normal playback so far. — the runtime smoke (USB source-card, radio timeline, DLNA `<res>` fallback) requires live devices (Ultra + Pro) and the authenticated UI; `/api/devices` is auth-gated so Hermes couldn't drive it headless. Greg to run the smoke from the UI. Revert recipe below if it fails.

**No docker runtime errors** in logs post-build. Health `{"ok":true}` on `:39446`.

## What landed (44b scope)

| Commit | Change |
|---|---|
| `6e5c6af` | `MEDIA_SOURCE_KEYS` exported from constants.ts; `isMediaSource`/`isPhysicalInput` refactor in now-playing-card.tsx (both copies) |
| `bea000f` | `deriveSource` prioritised non-wifi match — USB-drive modes 11/21 → `udisk` (decodeTimingSec portion already landed via 44a) |
| `0472b2b` | `resFormat()` DIDL-Lite `<res>` attribute fallbacks (`sampleRate`/`bitDepth`/`bitRate` → `?? res.x`) in upnp.ts; ARCHITECTURE.md upnp.ts row |
| `c68c950` (UI-layer) | transport-controls-per-source + hide-timeline-when-stopped in now-playing-card.tsx (both copies) |
| F1 adjudication | ARCHITECTURE.md commands.ts row `fetchUsbDac` → `fetchSoundCard` (pre-existing drift the design packet missed; folded in by Opus) |

`types.ts` verified as a no-op (correctly).

## Live git state to verify at session open

    git log --oneline -5 main
    # expect:
    # bb94ae4 merge: round 44b — snapshot batch + c68c950 UI-layer subset
    # 00af84d feat(wiim): port round 44b — snapshot batch + c68c950 UI-layer subset
    # e62ea53 docs: session close 2026-09-16 (Round 44a merged + smoke pass + archived)
    # 0100854 merge: round 44a — c68c950 data-layer subset (unblocks 44b)
    # ...

    git status
    # expect: On branch main; working tree clean

    git branch --list "hermes/*"
    # expect: hermes/round44b-snapshot-batch (00af84d) — preserved pending hardware smoke

    git branch --list "backup/*"
    # expect: backup/pre-44a-c68c950 AND backup/pre-44b-snapshot-batch — preserved for revert

    # Revert recipe if hardware smoke fails:
    # git revert -m 1 bb94ae4 && docker compose up -d --build

**Note:** `main` is ahead of `origin/main` by 3 commits (44a merge + 44b feat + 44b merge). Push was **not** performed — that's Greg's call, not in the spec.

## This session's arc (execution — kimi-k3 via opencode-go)

Baseline verified clean (HEAD `e62ea53`, tree clean, dual-write parity `71dc8441…`, git identity `Greg T <me@gregthibodeaux.com>` present). Branches created: `hermes/round44b-snapshot-batch` (working) + `backup/pre-44b-snapshot-batch` (rollback). Mechanical edit application delegated to a subagent (edits only); Hermes held baseline/shipping/verification and **independently verified** the subagent's self-report (full diff byte-exact, SHA parity, grep counts) before committing.

### Verification ladder (all green)

- Read-back: all six files' diffs byte-exact against the approved spec (constants / parse / upnp / ARCHITECTURE / both now-playing-card copies)
- Dual-write SHA parity: `3eb96f7d…` ×2 (match each other, differ from pre-edit baseline `71dc8441…`)
- `MEDIA_SOURCE_KEYS` count = 3 in each copy; `decodeTimingSec` untouched in parse.ts (44a regression guard held — `NO_DECODE_TIMING_CHANGE`)
- `fetchUsbDac` → 0, `fetchSoundCard` → 1 in ARCHITECTURE.md
- Commit `00af84d` to working branch (Greg's identity), merge `bb94ae4` into main (--no-ff, matching 44a convention)
- `docker compose up -d --build` — fresh build (not cached); container Up (healthy)
- Typecheck exit 0; lint exit 0 (1 pre-existing unrelated warning)
- Health `{"ok":true}`; no errors in container logs

### Environment notes / drift found

- **Docker compose service is `wiim-dashboard`, not `web`.** `docker compose exec web …` fails ("no such service"); use `docker compose exec wiim-dashboard …`. The spec's commands referenced `web` — corrected live.
- **`tsc`/`eslint` not in the runner image** (slim production stage, devDeps pruned). Ran them on the host via `./node_modules/.bin/{tsc,eslint}` (host `node_modules` present). The `next build` compile inside Docker is itself a strong gate.
- **Runtime device smoke is auth-gated.** `/api/devices` requires session auth — headless curl can't drive it. Hardware smoke must be run from the UI.
- The 44a-noted WSL-git-identity staleness did **not** recur this session — identity was present and correct. (44a action item on `HERMES_PREAMBLE_wiim-dashboard.md` remains open.)

## Remaining close work

**Hardware smoke test — PENDING (Greg, from the UI).** Verify on Ultra + Pro:
- **USB source-card fix (bea000f):** with a USB drive attached, playing a local file → source card / badge resolves to USB (`udisk`), not a fallback. Modes 11/21 → udisk.
- **Radio timeline (c68c950 UI + Qwen Audit Finding A):** internet radio (vTuner/TuneIn, modes 12/13) → `sourceKey="wifi"` → `isMediaSource=true` → `isPhysicalInput=false` → **timeline RENDERS while playing** (this is the corrected expectation — the spec's original "radio → timeline hidden" was wrong; the auditor caught it). Hide-timeline-when-stopped applies only to physical/line-in sources.
- **DLNA `<res>` fallback (0472b2b):** play DLNA/UPnP content where the server omits top-level sample-rate/bit-depth — quality fields fall back to `<res>` attributes; no crash, sane values.
- **Transport-controls-per-source (6e5c6af + c68c950):** prev/next/seek enabled only for queue/media sources (wifi/udisk), disabled appropriately for physical inputs.
- **No regressions** on normal Spotify/Amazon/Plex playback (quality badge, scrobbler).

**Post-smoke — decisions for Greg:**
- Delete `hermes/round44b-snapshot-batch` (`git branch -d`; merge commit's second-parent preserves the SHA)
- Keep or delete `backup/pre-44b-snapshot-batch` and `backup/pre-44a-c68c950`
- Whether to push `main` (3 commits ahead of origin)
- Session-close commit of `M _showa/SESSION_HANDOFF.md` (this file)
- Archive move of `tasks/round44b.{approved,done}.md` + `tasks/round44b-audit-qwen.md` → `archive/2026-09-16-round44b-*` (per 44a pattern)

## Forward scope — standing candidates

1. **Round 44c (EQ cluster) and 44d (trusted artwork hosts).** Fully independent. 44d is the higher-stakes round (security-adjacent + `isPlexArtUrl` shim retirement + DB migration + settings UI) — natural next pipeline candidate.
2. **Round 44e decision.** `6c8b37d` in-place IP edit — still deferred; low-cost, good calibration candidate.
3. **Smoke Observation A (44a, carried):** UHD/Master/Qobuz-tier service-specific badge (WiiM Home app shows one; fork normalizes hi-res to "Hi-Res Lossless"). c68c950's UI-layer landed in 44b — **re-check whether the upstream hi-res quality-tag mapping now surfaces the tag distinctly**; if not, add a fork-specific `actualQuality`/`service` → badge display.
4. **Smoke Observation B (44a, carried):** CustomRadio streams render "Network" (mode 10) not "Radio" (12/13). Design question, not urgent.
5. **`HERMES_PREAMBLE_wiim-dashboard.md` fix** (44a, carried): WSL git-identity assertion — verify/set per session.
6. **README changelog backfill** (44a, carried): `_showa/README.md` changelog still stops at "Post Round 44 — 8fe1f64 lyrics-nudge manual port." Missing: e61b4b9, b27b2f0, TRUST_PROXY doc, Round 43 scrobbler fix, Round 44a, Round 44b. Historical record, not drift.
7. **Upstream PR of `.env.example` TRUST_PROXY doc.** Standing.
8. **Companion `gthibo/wiim-universal-remote`.** Out of this repo's queue.
9. **EQ response curve deferred features.** Feature-forward.

## Canonical reference documents

Not tracked in this repo:

- `C:\Users\mrthi\Documents\WIIM\round44-upstream-recon-report.md` — authoritative recon
- `C:\Users\mrthi\Documents\WIIM\round44-regrouping.md` — 44a LANDED, 44b bea000f scope-reduction note
- `C:\Users\mrthi\Documents\WIIM\round44b-design-packet.md` — Opus design packet (44b)
- `C:\Users\mrthi\Documents\WIIM\tasks\round44b.approved.md` — Opus-adjudicated 44b plan (this session; archive after smoke)
- `C:\Users\mrthi\Documents\WIIM\tasks\round44b-audit-qwen.md` — Qwen3.8 Max 44b audit (APPROVABLE, 1 must-fix + 3 minor — all adjudicated into the plan)
- `C:\Users\mrthi\Documents\WIIM\archive\` — closed `.done`/`.approved`/`-audit` pairs (44a archived 2026-09-16)
- `C:\Users\mrthi\Documents\WIIM\workflow.md` — Hermes/Opus workflow contract
- `C:\Users\mrthi\Documents\WIIM\HERMES_PREAMBLE.md` / `HERMES_PREAMBLE_wiim-dashboard.md` — preambles (latter has the stale git-identity note, carried)
- `C:\Users\mrthi\Documents\WIIM\templates\plan-template.md` — task plan template

## Standing operational rules

Refer to project memory (`ways-of-working.md`) — unchanged this session.

---

## Previous round — Round 44a (landed 2026-09-16, merge `0100854`)

Round 44a — the c68c950 data-layer subset — landed via merge commit `0100854` and **passed hardware smoke 2026-09-16**. 6 files, +91/−14, all 24 edits byte-exact. Hi-res tier confirmed live on Amazon UHD (`actualQuality="UHD"` → `qualityHiRes=true` → `tier="hires"`); `actualQuality` null-handling graceful on Plex cast; `"LOSSLESS"` on Spotify. No regressions. Archived to `WIIM/archive/2026-09-15-round44a-c68c950-data-layer.{done,approved,audit-qwen}.md`. Full 44a session detail is in the prior handoff revision (git history of this file) and the archived `.done.md`.

44a's key carry-overs into 44b (all landed): `decodeTimingSec` (bea000f per-response form), UDisk guard, `actualQuality` thread, `"12"`/`"13"` string mode keys. 44b's `bea000f` scope was reduced to the `deriveSource` hunk only, because 44a had already landed the per-response `decodeTimingSec` form.
