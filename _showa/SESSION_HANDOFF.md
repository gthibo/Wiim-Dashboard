# Showa Hi-Fi Counter — Session Handoff

*Updated end of session: September 15, 2026. Round 44a landed via full multi-model pipeline (Opus design → Kimi K3 spec → Qwen3.8 Max audit → Opus adjudication → deepseek-v4-pro exec). Supersedes all prior handoff content.*

## tl;dr for picking this back up

Round 44a — the c68c950 data-layer subset — landed via merge commit `0100854` on `main` and **passed hardware smoke 2026-09-16**. 6 files, +91/−14, all 24 edits byte-exact against the adjudicated plan. Container Up (healthy); scrobbler live post-build (Elsiane — Morphing scrobbled ✓). Hi-res tier confirmed live on Amazon UHD "Reckoner" (Radiohead, *In Rainbows*): `actualQuality="UHD"` → `qualityHiRes=true` → `tier="hires"`. `actualQuality` null-handling on Plex cast graceful (CD-tier fallback); `"LOSSLESS"` on Spotify; `"UHD"` on Amazon UHD. No regressions on either device. **Round archived** to `WIIM/archive/2026-09-15-round44a-c68c950-data-layer.{done,approved,audit-qwen}.md`.

**Multi-model pipeline validated.** Qwen's audit caught 5 real must-fix issues (including a dead `actualQuality` thread and misdiagnosed trailing-space fix); Opus adjudicated and rewrote the plan; deepseek-v4-pro executed it clean. Keep the pipeline for future high-stakes rounds (44d next candidate).

**Adjudication call worth remembering for 44b:** `bea000f`'s per-response `decodeTimingSec` form landed early with 44a, so 44b's `bea000f` scope shrinks to just the `deriveSource` prioritised-match hunk.

**Two smoke observations flagged for 44b/UX** (neither a regression): (A) UHD badge normalizes to "Hi-Res Lossless" in the UI regardless of service — Greg wants service-specific badge like the WiiM Home phone app; candidate for 44b UI-layer work (which includes upstream's hi-res quality-tag mapping in `now-playing-card.tsx`) or a separate fork enhancement. (B) CustomRadio streams render as "Network" (`mode 10`) not "Radio" (`mode 12/13` reserved for built-in vTuner/TuneIn) — design question, not urgent.

Real next work: (1) branch cleanup at Greg's discretion, (2) session-close commit of this handoff, (3) `HERMES_PREAMBLE_wiim-dashboard.md` — WSL git identity was empty when Hermes went to commit; preamble said it was set. Preamble needs a fix or a note that identity must be re-verified per session.

## Live git state to verify at session open

    git log --oneline -5 main
    # expect (pre-close-commit):
    # 0100854 Merge branch 'hermes/round44a-c68c950-extraction' (--no-ff)
    # 55fcaf5 (hermes/round44a-c68c950-extraction) round 44a exec
    # b34f9c4 session close 2026-09-15 (Round 44+ regrouping — Q1/Q2/Q4 banked)
    # 3b7f1fa docs: session close 2026-09-14 (recon addendum + TRUST_PROXY doc improvement)
    # 7c5de53 docs(env.example): clarify TRUST_PROXY behavior for direct-LAN deployments

    git status
    # expect: On branch main; working tree clean

    git branch --list "hermes/*"
    # expect: hermes/round44a-c68c950-extraction (55fcaf5) — preserved pending hardware smoke test

    git branch --list "backup/*"
    # expect: backup/pre-44a-c68c950 — preserved for revert path

    # Revert recipe if hardware smoke fails:
    # git revert -m 1 0100854 && docker compose up -d --build

## This session's arc

Started from the 2026-09-15 planning-session close (`b34f9c4`), where three decisions were banked (Q1 c68c950 hand-extract data/UI split; Q2 isPlexArtUrl retirement via 7d99a97; Q4 9ca026e naming Path A) and Round 44a was queued for the multi-model pipeline. Session executed the full pipeline end-to-end.

### 1. Adjudication (Opus)

Kimi K3's `.plan.md` (produced 09:34) and Qwen3.8 Max's audit (produced 10:07) were both on disk when the session opened. Read all three (design packet, plan, audit). Spot-verified Qwen's four highest-leverage claims against fork files:

- `INTERNAL_VENDOR_NAMES = new Set(["customradio"])` at now-playing-info.ts L45 ✓
- `pickPic` key list at commands.ts L468 has no trailing-space variant ✓
- `outputNames` genuinely absent from fork (contra Kimi K3's "already landed" claim) ✓
- Fork symbol names: `GetInfoExResult` / `fetchTrackMeta` / `getDeviceSnapshot` (Kimi K3 used upstream's `GetInfoExParse` / `getTrackMeta` / `getSnapshot`) ✓

Audit deemed trustworthy. Adjudicated all 10 findings, all accepted with specific corrections. Fetched upstream `c68c950` hunks for `capabilities.ts`, `now-playing-info.ts`, and `commands.ts` so the rewrite could use verbatim after-hunks rather than paraphrase. **Rewrote `tasks/round44a.plan.md`** in place (36.7 KB) with all fixes folded in, model recommendation (`deepseek-v4-pro`) stated in handoff section.

**Key adjudication calls:**
- Land `bea000f`'s per-response `decodeTimingSec` form now (not c68c950's per-field form) — hand-porting has no cherry-pick fidelity to preserve; per-field form has a documented 36-second dead-timeline bug. 44b's `bea000f` scope reduces to `deriveSource` hunk only.
- Include `capabilities.ts` plm_support pruning (Qwen Issue E) — fits round's "device-quirk fixes" charter; ports cleanly since fork has `fetchAudioInputEnable` at L223.
- Full `inferAudioFormat` port including `HIRES_QUALITY` set + `qualityHiRes` folding — this is data-layer, not UI; without it `actualQuality` is dead code.

### 2. Execution (deepseek-v4-pro via Hermes)

All 24 edits byte-exact against the plan. 6 files:

| File | Change |
|---|---|
| `parse.ts` | `decodeTimingSec` (bea000f fixed per-response form) + hoisted `timing` call + UDisk `udisklocal` guard as early return |
| `upnp.ts` | `actualQuality` on `GetInfoExResult` + mode-key fixes (STATION→12, RADIO→13) |
| `commands.ts` | `actualQuality` on `MetaInfo`/`EMPTY_META`/`fetchMetaInfo` return/`fetchTrackMeta` wire + trailing-space `m["albumArtURI "]` key fallback via `artStr` pattern + `un_known` art token + `"albumArtURI "` (trailing space) added to `pickPic` key list |
| `now-playing-info.ts` | `INTERNAL_VENDOR_NAMES += "udisklocal"` + 5-arg `inferAudioFormat` with `HIRES_QUALITY = new Set(["HI_RES", "HI_RES_LOSSLESS", "UHD", "7", "27"])` folded into `hiRes` computation |
| `capabilities.ts` | `INPUT_KEEP_REGARDLESS` set + `deriveSources` 3rd `inputEnable` arg + prune body + `fetchAudioInputEnable` added to `Promise.all` (now 5 or 6 entries depending on fork's Headphone-EQ-exclusion state) |
| `snapshot.ts` | `actualQuality: null` in `emptyMeta` + `meta.actualQuality` as 5th arg to `inferAudioFormat`, threaded around FORK DELTA bitRate backfill and multiroom mirror |

`types.ts` verified as no-op (correctly — every c68c950 types.ts hunk lands elsewhere or is excluded).

### 3. Verification ladder (all green)

- `npm run typecheck` — clean
- `npm run lint` — 0 errors (1 pre-existing warning, unrelated)
- `docker compose up -d --build` — fresh build, not cached; container Up (healthy)
- `GET :39446/api/health` → `{"ok":true}`
- Exclusion audit: `acoustic`, `outputs.push(7)`, `outputNames`, `outputCoexist` (as an introduction — it appears only as a pre-existing identifier on a line that was extended) all correctly absent from added lines. All 7 fold-ins present.
- **Runtime evidence:** scrobbler live immediately post-build; Elsiane — Morphing scrobbled ✓. That single track exercises `parsePlayerStatus` (with new `decodeTimingSec`), `parseGetInfoEx` (with new `actualQuality`), `fetchTrackMeta` (with new `actualQuality` wire), `inferAudioFormat` (with new 5-arg signature and `HIRES_QUALITY` fold), and `getDeviceSnapshot` (with `meta.actualQuality` pass-through) all in one code path.

### 4. Environment drift found and fixed

WSL repo-local git identity was empty when Hermes went to commit. The Hermes preamble said it was set during calibration; that turned out to be stale (or reset). Hermes re-established `Greg T <me@gregthibodeaux.com>` before committing. **Action item:** `HERMES_PREAMBLE_wiim-dashboard.md` should either (a) drop the assertion that identity is pre-set and instead direct Hermes to verify/set it each session, or (b) add a per-session identity-check gate. Not addressed this session; carry forward.

## Remaining close work

**Hardware smoke test — PASSED 2026-09-16.** Full details in the archived `.done.md`; short version above in tl;dr. Two observations captured for forward scope; no regressions; no revert needed.

**Post-smoke — decisions for Greg:**
- Delete `hermes/round44a-c68c950-extraction` (`git branch -d`; the merge commit's second-parent tip preserves the SHA)
- Keep or delete `backup/pre-44a-c68c950` (probably keep for a session or two)
- Session-close commit of `M _showa/SESSION_HANDOFF.md` (this file)

**Pending Opus/Hermes:**
- Hermes: `_showa/README.md` no-drift verify — **DONE** (2026-09-15). Three mechanical checks: merged diff = 6 files all under `src/lib/wiim/*`; `_showa/` has no `lib/` tree by design; zero mirror-bearing paths touched. **No drift edit needed**; the historical changelog-backfill gap (Round 43 + Round 44a entries) is a separate open item, tracked below.
- Hermes: `tasks/round44a.done.md` — **DONE** (2026-09-15, 6,328 bytes after smoke append). Contains full SHA table, per-file diff, exclusion audit, verification ladder, runtime evidence, WSL git-identity drift note, smoke-test findings incl. Observations A/B.
- Opus: archive move — **DONE 2026-09-16**. Three files moved to `WIIM/archive/2026-09-15-round44a-c68c950-data-layer.{done,approved,audit-qwen}.md`. `tasks/` directory now empty. Approved plan kept for provenance since the multi-model pipeline artifact is new to this archive.

## Forward scope — standing candidates

Ordered by priority for next session:

1. **Round 44b spec-write.** Snapshot batch (`bea000f` deriveSource-only + `0472b2b` DIDL-Lite res attrs + `6e5c6af` MEDIA_SOURCE_KEYS + c68c950 UI-layer). Dual-write on `now-playing-card.tsx`. Blocking dep on 44a is now resolved. **Include in scope:** smoke Observation A — the UHD/Master/Qobuz-tier service-specific badge Greg wants (WiiM Home phone app shows one; fork currently normalizes every hi-res tier to "Hi-Res Lossless" in `StreamInfoLine`). c68c950's UI-layer already includes "hi-res quality-tag mapping in now-playing-card.tsx" so this may fold in naturally; spec-write should verify and, if the upstream mapping doesn't surface the tag distinctly, explicitly add a fork-specific `actualQuality`/`service` → badge display. Sonnet-spec-in-chat per regrouping doc unless pipeline expansion is elected (44a run was clean; expansion is defensible).
2. **Rounds 44c (EQ cluster) and 44d (trusted artwork hosts).** Fully independent of 44a/44b. 44d is the second highest-stakes round after 44a and the second natural pipeline candidate (security-adjacent architectural work + `isPlexArtUrl` shim retirement + DB migration + settings UI).
3. **Round 44e decision.** `6c8b37d` in-place IP edit — Greg still deferred; low-cost win if adopted, good Hermes-spec calibration candidate.
4. **`HERMES_PREAMBLE_wiim-dashboard.md` fix.** WSL git identity assertion needs updating per section above.
5. **Smoke Observation B (CustomRadio → "Radio" badge).** If desired: prefer `vendor=="CustomRadio"` to override `mode=10` → "Radio" label. Small fork-specific enhancement, not urgent. Design question worth thinking about — stricter accuracy (Network) vs. friendlier UX (Radio) for custom URL streams.
6. **Upstream PR of `.env.example` TRUST_PROXY doc improvement.** Still standing; not urgent.
7. **Companion project `gthibo/wiim-universal-remote`.** Out of this repo's queue.
8. **EQ response curve deferred features.** Feature-forward not sync-forward.

### README changelog gaps — carried forward, still not backfilled

`_showa/README.md` changelog still stops at "Post Round 44 — 8fe1f64 lyrics-nudge manual port." Missing entries: post-Round-44 `e61b4b9` USB output, USB chain follow-on `b27b2f0`, `.env.example` TRUST_PROXY doc, Round 43 scrobbler fix (`70b77de`), Round 44a (this session). This gap is **separate from drift** — Hermes's 2026-09-15 no-drift verify confirmed no `src/`/`_showa/` divergence, but the changelog backfill is historical record, not drift detection. Remains a next-session call.

## Canonical reference documents

Not tracked in this repo:

- `C:\Users\mrthi\Documents\WIIM\round44-upstream-recon-report.md` — authoritative recon
- `C:\Users\mrthi\Documents\WIIM\round44-regrouping.md` — **updated this session** — 44a marked LANDED, 44b bea000f scope-reduction note added
- `C:\Users\mrthi\Documents\WIIM\round44a-design-packet.md` — Opus design packet (stays in root pending regrouping-doc-style promotion when 44 series closes)
- `C:\Users\mrthi\Documents\WIIM\archive\2026-09-15-round44a-c68c950-data-layer.approved.md` — **archived 2026-09-16** — Opus-adjudicated plan (supersedes Kimi K3's initial draft, folds all 10 Qwen findings)
- `C:\Users\mrthi\Documents\WIIM\archive\2026-09-15-round44a-c68c950-data-layer.done.md` — **archived 2026-09-16** — exec + smoke record (Hermes deepseek-v4-pro)
- `C:\Users\mrthi\Documents\WIIM\archive\2026-09-15-round44a-c68c950-data-layer-audit-qwen.md` — **archived 2026-09-16** — audit evidence (Qwen3.8 Max)
- `C:\Users\mrthi\Documents\WIIM\tasks\` — empty after archive move; next round's `.plan.md` lands here
- `C:\Users\mrthi\Documents\WIIM\workflow.md` — Hermes/Opus workflow contract
- `C:\Users\mrthi\Documents\WIIM\HERMES_PREAMBLE.md` — root preamble
- `C:\Users\mrthi\Documents\WIIM\HERMES_PREAMBLE_wiim-dashboard.md` — project preamble; **carries a stale WSL git identity assertion** — see remaining close work
- `C:\Users\mrthi\Documents\WIIM\templates\plan-template.md` — Hermes task plan template
- `C:\Users\mrthi\Documents\WIIM\archive\` — closed `.done.md` + audit pairs

## Standing operational rules

Refer to project memory (`ways-of-working.md`) — unchanged this session.
