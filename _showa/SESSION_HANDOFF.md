# Showa Hi-Fi Counter — Session Handoff

*Updated end of session: September 18, 2026 (post-44g close). Round 44g — Devices relabel + Server icon + IP pencil-edit in dashboard Device column — landed Opus-direct. Also: branch housekeeping (6 stale backup branches pruned). Supersedes the post-44f handoff (preserved in git history).*

## Session update — 2026-09-18 (post-44g close)

**Round 44g landed and smoke-passed on Ultra.** Merge `debe25a` on `main`; 1 file + mirror, +158/−14 across both trees (byte-identical SHA256). Two items bundled in one round: Devices relabel and IP pencil-edit in the Device column.

**What this fixes.**
1. The Device column action tile labeled "Add Device" (Plus icon) was misleading — `/devices` is the full list-and-manage page, not just an add flow. Relabeled "Devices" with the Server icon. Five comment references updated. `app-header.tsx` and `device-info-card.tsx` both confirmed orphaned during ground-truth checks — neither was touched.
2. The IP row in the Device column now has an inline pencil-edit, adapting the 44f pattern from `device-manager.tsx` to the dashboard. Pencil opens a mono `Input` pre-filled with the current address; ✓/Enter PATCHes `/api/devices/${deviceId}` + best-effort `/refresh` re-probe; ✗/Escape cancels; toast on validation errors (LAN check + duplicate check from the existing route — no API surface changes).

**Branch housekeeping this session.** Pruned 6 stale local backup branches:
- `backup/pre-44c-eq-cluster`, `backup/pre-44d-trusted-art-hosts`, `backup/pre-radio-vendor-hotfix` — all local-only (never on origin)
- `backup-main-pre-getinfoex`, `backup-main-pre-round43`, `backup-main-pre-v03811-picks` — older legacy naming convention, also local-only

**Ground-truth findings that shaped scope.**
- `device-info-card.tsx` is orphaned dead code (the dashboard IP row lives in `DeviceSection` inside `source-output-panel.tsx`, as noted in that file's L44 comment). Handoff had incorrectly called this out as the target file for the pencil.
- `app-header.tsx` is also orphaned — absorbed into `source-output-panel.tsx` in Round 25.
- Both `app-header.tsx` and `device-info-card.tsx` are left on disk per the fork's established orphan-files convention.
- `InfoRow` inside `DeviceSection` already accepted `ReactNode` for `value` and `DeviceSection` already had `deviceId` + `onChanged` props — pencil integration was clean.

**Pushed.** `main` pushed to `origin` at handoff-write time.

---

## tl;dr for picking this back up

Round 44g — Devices relabel + IP pencil-edit in Device column — landed via merge commit `debe25a` on 2026-09-18. **Passed hardware smoke** on Ultra. Container Up (healthy) after rebuild. Nothing outstanding on 44g itself.

**Next up is Round 44h** — three items, same two files (`now-playing-card.tsx` + `_showa/` mirror) plus one data-layer file (`now-playing-info.ts`, src/-only):
1. Hide timeline/scrub on non-scrubbable sources: add `&& hasDuration` to the `!isPhysicalInput && timelineActive` gate at L787 of `now-playing-card.tsx`. Covers radio and Amazon QPlay (both `duration: 0`). `hasDuration` already defined at L481.
2. CustomRadio label "Network" → "Radio": in `now-playing-info.ts`, add a radio-vendor check (for `customradio`, `newtunein`, `vtuner`) before the generic `{ key: "network", name: "Network" }` fallback; return `{ key: "radio", name: "Radio", logo: null }` instead. Also update `displayService` in `now-playing-card.tsx` to extend the preset-name substitution to `service.key === "radio"` (currently only fires for `"network"`).
3. UHD/Qobuz/TIDAL service-specific tier badges: current code normalizes all hi-res to "Hi-Res Lossless" in `StreamInfoLine`. The raw `quality` string (`"HI_RES"`, `"HI_RES_LOSSLESS"`, `"UHD"`, `"7"`, `"27"`) is available as a prop but only used for the numeric readout chip. Fork-specific enhancement: map `(service.key, quality)` → service-specific label in `StreamInfoLine` (e.g. Amazon UHD → "Ultra HD", Qobuz 7/27 → "Studio"/"Studio Master"). Upstream doesn't have this — fork add.

**Configured Plex host still valid:** `192.168.1.107:32400` (from 44d). If the container SQLite settings DB is nuked, re-add via Settings → Artwork hosts.

**No docker runtime errors** in logs post-44g build. Health `{"ok":true}` on `:39446`. Scrobbler polling every 15s.

## What landed (44g scope)

| File | Change |
|---|---|
| `src/components/dashboard/source-output-panel.tsx` | +79/−7: Server/Pencil/X added to lucide imports, Plus removed; Input import added; DeviceAction tile icon Plus→Server, label "Add Device"→"Devices"; five comment references updated; DeviceSection gains useToast + editIp/editIpVal state + saveIp async; IP InfoRow replaced with pencil-edit ternary |
| `_showa/components/dashboard/source-output-panel.tsx` | Byte-identical mirror of above (SHA256 verified) |

## Live git state to verify at session open

    git log --oneline -6 main
    # expect (top is this session-close commit):
    # <session-close>  docs: session close 2026-09-18 (Round 44g merged + smoke pass — Devices relabel + IP pencil-edit)
    # debe25a          merge: round 44g — Devices relabel, Server icon, IP pencil-edit in Device column
    # 19f1a4e          Round 44g: Devices relabel + Server icon + IP pencil-edit in Device column
    # df6d6cd          docs: session close 2026-09-18 (Round 44f merged + smoke pass — in-place IP edit)
    # 06ca97c          merge: round 44f — in-place IP edit on Devices page (upstream 6c8b37d)
    # b723fc4          Round 44f: in-place IP edit on Devices page (upstream 6c8b37d)

    git status
    # expect: On branch main; working tree clean; up to date with origin/main

    git branch --list "backup/*"
    # expect (two — all others pruned this session):
    #   backup/pre-44e-band-count-clip   (age: 2 rounds — prune candidate next session)
    #   backup/pre-44g-devices-relabel-ip-pencil  (age: 0 rounds — this session's)

    git branch --list "hermes/*"
    # expect: (empty) — hermes/round44g-devices-relabel-ip-pencil deleted after merge

## This session's arc (execution — Opus-direct)

Baseline verified clean (HEAD `df6d6cd` post-44f session close, tree clean). Started with branch housekeeping: pruned `backup/pre-44c-eq-cluster`, `backup/pre-44d-trusted-art-hosts`, `backup/pre-radio-vendor-hotfix` (all local-only, never on origin — confirmed via Windows PowerShell `git push origin --delete` returning "remote ref does not exist") and `backup-main-pre-getinfoex`, `backup-main-pre-round43`, `backup-main-pre-v03811-picks` (older legacy naming, also local-only — stale remote-tracking refs cleared with `git remote prune origin`).

1. **Ground-truth checks:** Confirmed `device-info-card.tsx` and `app-header.tsx` are both orphaned. Confirmed `InfoRow` accepts `ReactNode` for value. Confirmed `DeviceSection` already has `deviceId` + `onChanged`. Confirmed lucide-react 0.474.0 has `MonitorSmartphone` and `Server` (paths extracted from node_modules). Greg chose `Server` icon after visual comparison.
2. **Icon preview:** Rendered Tabler vs Lucide comparison widget for `MonitorSmartphone` and `Server` icons at faceplate palette scale. Greg selected `Server`.
3. **edits to `src/`:** Imports (Plus→removed, Server/Pencil/X added, Input import), tile icon/label, five comments, DeviceSection state + saveIp + IP row ternary. Each batch dryRun:True → reviewed → dryRun:False.
4. **SHA256 parity:** `f79bdeeb...` matched across src/ and _showa/ trees after mirroring all edits.
5. **Static gates:** typecheck exit 0; lint exit 0 (baseline PEQ_RANGE warning only, zero new).
6. **Consent-gated rebuild:** `docker compose up -d --build`, `[builder 5/5] RUN npm run build` not cached, compiled 8.8s. Container Up (healthy).
7. **Bundle check:** `docker exec wiim-dashboard grep -rl "Save IP address\|Edit IP address" /app/.next` hit server and client bundles — new code confirmed shipped.
8. **Hardware smoke on Ultra:** Tile reads "Devices" with Server icon. IP row shows pencil. Pencil opens mono Input with current address. ✓ saves, ✗ cancels.
9. **Opus merge** (`debe25a`): `--no-ff` into main; ort strategy clean.

### Verification ladder (all green)

- **Imports:** `Plus` absent, `Server`/`Pencil`/`X`/`Input` present in src/ (grep confirmed)
- **"Add Device" absent:** grep returned exit 1 (zero hits) on both src/ and _showa/
- **Dual-write:** SHA256 `f79bdeeb...` identical across both trees
- **Static:** typecheck exit 0; lint exit 0 with only baseline PEQ_RANGE warning
- **Container:** Up (healthy) after rebuild; source layer recompiled (not cached)
- **Bundle:** "Save IP address" + "Edit IP address" strings in both server and client bundles
- **Health:** `{"ok":true}` (200)
- **Hardware smoke on Ultra:** tile label/icon correct; pencil visible; edit flow functional

### Environment notes / drift found

- **NEW — `device-info-card.tsx` and `app-header.tsx` confirmed orphaned.** Both are dead code, left on disk per fork convention. The handoff's prior claim that `device-info-card.tsx` had a `_showa/` mirror was incorrect — the mirror was never created because the component was orphaned in Round 25 before it received Showa tokens.
- **NEW — All six pruned backup branches were local-only.** The `git push origin --delete` for the first three returned "remote ref does not exist" immediately via Windows PowerShell git (which has GitHub credentials; WSL git times out on push due to missing credential helper). For the three legacy-naming branches, `git remote prune origin` returned empty (they weren't remote-tracking refs — just local branches), and `git branch -d` deleted them directly.
- **NEW — Windows PowerShell git vs WSL git for pushes.** WSL git blocks indefinitely on HTTPS pushes (no credential helper configured in WSL, no `~/.gitconfig`). Windows PowerShell `git` (which uses Windows Credential Manager) succeeds immediately. Pattern for future pushes that time out in WSL: retry via `cd C:\Users\mrthi\Wiim-Dashboard; git push ...` in PowerShell.
- **44f-carried:** PowerShell `$?` inside `wsl bash -lc "..."` returns the shell boolean, not the numeric exit code — use single-quoted `wsl bash -lc '... ; echo TSC_EXIT:$?'` to preserve `$?` for the bash interpreter.
- **44e-carried:** WiiM firmware (Ultra 5.2.8x + Pro 2026-09) ships 12 parametric bands on the wire but only 10 are DSP-connected. Dashboard clips UI to a–j via `PEQ_LETTERS_BASELINE` filter in `ParametricPanel`.
- **44d-carried:** `_showa/components/` contains only `dashboard/` and `ui/` — no `settings/` mirror, no `devices/` mirror. Docker compose service is `wiim-dashboard`, not `web`.

## Remaining close work

**None outstanding.** Everything below was completed this session:
- ✅ `--no-ff` merge into main (`debe25a`)
- ✅ `_showa/README.md` changelog appended (Round 44g entry)
- ✅ `_showa/SESSION_HANDOFF.md` update (this doc)
- ✅ Branch cleanup: `hermes/round44g-devices-relabel-ip-pencil` deleted; backup branches pruned (6 total this session); `backup/pre-44g-devices-relabel-ip-pencil` preserved
- ✅ Push to `origin/main`

No task-file archive move: 44g was Opus-direct with no `.plan.md` (same pattern as 44e, 44f).

## Forward scope — standing candidates

1. **Round 44h (ready to run — same two files):** Three items in `now-playing-card.tsx` + `_showa/` mirror + `now-playing-info.ts` (src/-only):
   - Hide timeline/scrub on non-scrubbable sources (`&& hasDuration` gate at L787)
   - CustomRadio "Network" → "Radio" label (`now-playing-info.ts` radio-vendor detection + `displayService` condition update in `now-playing-card.tsx`)
   - UHD/Qobuz/TIDAL service-specific tier badges in `StreamInfoLine` (fork enhancement — map `service.key + quality` → specific label)
2. **Smoke Observation A (44a, carried):** UHD/Master/Qobuz-tier service-specific badge. Partially addressed by 44h item 3 above.
3. **Smoke Observation B (44a) — display half open.** Fork's `detectService` intentionally filters CustomRadio via `INTERNAL_VENDOR_NAMES`, so the service band labels a CustomRadio stream as "Network" rather than "Radio". Addressed by 44h item 2 above.
4. **Hide timeline / disable scrub on non-scrubbable sources (post-44b).** Addressed by 44h item 1 above.
5. **`c68c950` Headphone-EQ tab (deferred, contingent on Ultra headphone-jack use).** `eq-card.tsx` 8-line addition, `capabilities.ts` HeadphoneEQ detection, `commands.ts` headphone EQ read/write. Would be Round 44i-or-later.
6. **`HERMES_PREAMBLE_wiim-dashboard.md` fix** (44a, carried): WSL git-identity assertion. Historical cleanup.
7. **Upstream PR of `.env.example` TRUST_PROXY doc.** Standing. Not yet drafted.
8. **Companion `gthibo/wiim-universal-remote`.** Out of this repo's queue.
9. **EQ response curve deferred features.** Draggable nodes, potential Catmull-Rom → monotone cubic swap, row-letter contrast tuning.
10. **`SECURITY.md` from upstream `7d99a97` (deferred by Greg during 44d).** Revisit as part of a future docs-reconciliation round.
11. **Investigate whether other WiiM device families also expose 12 wire / 10 DSP bands.** Not urgent — 44e's clip is correct for the general case.

## Canonical reference documents

Not tracked in this repo:

- `C:\Users\mrthi\Documents\WIIM\round44-upstream-recon-report.md` — authoritative recon
- `C:\Users\mrthi\Documents\WIIM\round44-regrouping.md` — Round 44 sub-round scope decisions
- `C:\Users\mrthi\Documents\WIIM\archive\` — closed `.done`/`.approved`/`.plan`/`-audit` pairs (44a, 44b, 44c, 44d archived here; 44e, 44f, 44g are Opus-direct with no task files)
- `C:\Users\mrthi\Documents\WIIM\probe-pro-eq.sh` + `probe-acoustic-capability.sh` — 44e diagnostic scripts
- `C:\Users\mrthi\Documents\WIIM\workflow.md` — Hermes/Opus workflow contract
- `C:\Users\mrthi\Documents\WIIM\HERMES_PREAMBLE.md` / `HERMES_PREAMBLE_wiim-dashboard.md` — preambles
- `C:\Users\mrthi\Documents\WIIM\templates\plan-template.md` — task plan template

## Standing operational rules

Refer to project memory (`ways-of-working.md`). New lessons this session:

- **Windows PowerShell git for pushes.** WSL git blocks on HTTPS pushes (no credential helper in WSL). Use `cd C:\Users\mrthi\Wiim-Dashboard; git push ...` in PowerShell for any push that times out in WSL.
- **Orphan-file audit before touching "small" components.** Ground-truth check that a component is actually referenced before planning edits to it — `device-info-card.tsx` and `app-header.tsx` would have been wasted work without the import grep confirming they were dead code.

---

## Previous rounds — Round 44f (landed 2026-09-18, merge `06ca97c`)

Round 44f — upstream `6c8b37d` in-place IP edit on the `/devices` settings page — landed via clean cherry-pick, byte-identical port. 1 file, +74/−3. Smoke-passed on Ultra across all six steps. Opus-direct, no multi-model pipeline. Key finding: `device-manager.tsx` had zero Showa tokens and zero prior fork divergence from upstream baseline, making it a pure adoption. Sidebar link at `source-output-panel.tsx` L512 reads "Add Device" but navigates to the full list-and-manage `/devices` page — queued as 44g (landed this session).

## Previous rounds — Round 44c + 44e (landed 2026-09-17, merges `bf8d757` + `eb8324a`)

Round 44c — EQ cluster — landed via full multi-model pipeline. 12 files, +183/−71: upstream three-commit EQ cluster (`3107749` acoustic-capability probe + LP/HP filter types, `9ca026e` firmware-derived PEQ band count, `e7b55f2` Off-band visual repair). Ultra smoke passed; Pro smoke exposed a firmware quirk — 12 rows visible instead of expected 10 — corrected in 44e. Round 44e — clip parametric EQ UI to a–j — landed Opus-direct. 3 files, +19/−5. The durable finding: WiiM firmware sends 12 parametric bands on the wire but only 10 are DSP-connected.

## Previous round — Round 44d (landed 2026-09-16, merge `2105774`)

Round 44d — trusted artwork hosts + `isPlexArtUrl` retirement — landed via full multi-model pipeline. 7 files, +275/−33. Configured Plex host `192.168.1.107:32400` still valid.
