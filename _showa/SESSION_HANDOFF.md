# Showa Hi-Fi Counter — Session Handoff

*Updated end of session: September 17, 2026 (post-44c + 44e close). Round 44c landed via full multi-model pipeline (Opus design → deepseek-v4-pro spec-write → Hermes/Qwen3.8 Max audit → Opus adjudication → deepseek-v4.1-flash exec — first round on the flash tier, clean pass). 44e followed in-session as an Opus-direct correction after hardware smoke exposed a firmware quirk. Both rounds smoke-passed live. Supersedes the post-44d handoff (preserved in git history of this file; compressed 44d summary below in "Previous round").*

## Session update — 2026-09-17 (post-44c + 44e close)

**Round 44c landed and smoke-passed on Ultra.** Merge `bf8d757` on `main`; 12-file port, +183/−71, adopts the three-commit upstream EQ cluster (`3107749` acoustic-capability probe + LP/HP filter types, `9ca026e` firmware-derived PEQ band count, `e7b55f2` Off-band visual repair). Multi-model pipeline: Opus design packet → deepseek-v4-pro spec (`round44c.plan.md`, 41,630 bytes) → Hermes/Qwen3.8 Max inline audit (APPROVABLE, 2 minor issues both in Task 2.1) → Opus adjudication (folded audit's Issue A + B + Opus-added Minor C, all three verified against fork ground truth) → deepseek-v4.1-flash exec on `hermes/round44c-eq-cluster` (`dc94c28`) → Opus-executed `--no-ff` merge into main. Ultra smoke passed (12 rows a–l visible, LP/HP + Off-band repair working, curve draws correctly). Pro smoke failed as spec'd — 12 rows visible instead of expected 10, exposing a firmware quirk (see 44e below).

**Round 44e landed and smoke-passed on both devices.** Merge `eb8324a` on `main`; 3-file follow-on, +19/−5, clips the parametric EQ UI to `PEQ_LETTERS_BASELINE` (a–j) after empirical audio testing proved WiiM firmware's 12-band wire response includes 2 non-functional bands. Opus-direct exec (small scope, in-session): `src/components/dashboard/eq-card.tsx` + `_showa/` mirror + `docs/WIIM-API.md` paragraph rewrite. Static gates green, both devices show 10 rows post-rebuild, all 44c behaviors preserved.

**The 12-wire, 10-DSP discovery.** Both a WiiM Ultra (fw 5.2.8x) and a WiiM Pro (2026-09 firmware) answer `EQGetLV2SourceBandEx` with 12 letters a–l, and writes to k/l persist on re-read. But an audible A/B test on the Ultra (L @ Peak/250Hz/+9.5 dB vs D at identical params) proved L is silent, D takes — only a–j are wired to the DSP chain. `GetAcousticCapability` was probed on both devices and does NOT expose functional band count; its `PEQ` subtree carries only `Version` + `Filters` (filter type list). This inverts upstream's assertion that only "mid-2026 firmware" is 12-band. WiiM's own Home app clips to 10 rows for a reason we now have direct evidence for. The dashboard now matches vendor behavior. `peqLettersFrom` letter-derivation infra is preserved for hypothetical future firmware that wires k/l live — dropping the `PEQ_LETTERS_BASELINE` filter in `ParametricPanel` is the one edit needed to un-clip. Empirical note in `docs/WIIM-API.md` L114 records the arc.

**Consent gate discipline held.** Two docker rebuilds this session, both explicitly approved by Greg before running (44c after Hermes exec finished; 44e after Opus edits verified). Zero silent builds.

**Task-file archive move.** `WIIM/tasks/round44c.done.md` + `WIIM/tasks/round44c.plan.md` → `WIIM/archive/2026-09-17-round44c-eq-cluster.{done,plan}.md`. No `.audit-qwen.md` this round — Hermes/Qwen's audit was inline in the Opus session, not filed to disk (Opus adjudication captured the two findings verbatim in `round44c.approved.md` before Hermes renamed it `.done.md`). No `.approved.md` — Hermes renamed to `.done.md` when writing back the `## Result` and `## Deviations` sections (this is a workflow lifecycle Hermes has been consistent with across rounds; not a deviation to log). No 44e task files exist — 44e was an in-session Opus-direct round without a formal `.plan.md`; its record lives in commits `751ea1f` + `eb8324a` and this handoff.

**Branch cleanup.** `hermes/round44c-eq-cluster` and `hermes/round44e-band-count-clip` deleted (merge commits `bf8d757` and `eb8324a` second-parents preserve `dc94c28` and `751ea1f`). Preserved: `backup/pre-44d-trusted-art-hosts`, `backup/pre-radio-vendor-hotfix`, `backup/pre-44c-eq-cluster`, `backup/pre-44e-band-count-clip`. The last two stay for one-to-two rounds of defense-in-depth per project pattern.

**Pushed.** `main` pushed to `origin` at handoff-write time.

---

## tl;dr for picking this back up

Round 44c — EQ cluster (acoustic probe + LP/HP + firmware-derived band count + Off-band visual repair) — landed via merge commit `bf8d757` on 2026-09-17. Round 44e — parametric UI clip to a–j — landed via merge commit `eb8324a` immediately after, correcting a firmware-quirk regression discovered during 44c smoke. Both **passed hardware smoke** on Ultra and Pro. Container Up (healthy) after `docker compose up -d --build` for both rebuilds (44c and 44e each triggered fresh source-layer rebuilds, no cache).

**The durable finding worth remembering:** WiiM firmware (Ultra 5.2.8x + Pro 2026-09) sends 12 parametric bands over the wire but only 10 are DSP-connected. `GetAcousticCapability` doesn't expose functional band count. Dashboard clips UI to a–j via `PEQ_LETTERS_BASELINE` filter in `ParametricPanel`. If firmware ever wires k/l live, drop that one filter — everything downstream already handles them.

**Configured Plex host still valid:** `192.168.1.107:32400` (from 44d). If the container SQLite settings DB is nuked, re-add via Settings → Artwork hosts.

**No docker runtime errors** in logs post-build. Health `{"ok":true}` on `:39446`.

## What landed (44c scope)

| Task | File | Change |
|---|---|---|
| 1 | `src/lib/wiim/eq-constants.ts` | LP/HP doc comment above `PEQ_MODES` (verbatim upstream); new `PEQ_GAIN_INDEPENDENT_MODES = new Set([3, 5])`; letter-set redefinition — `PEQ_LETTERS` = a–l (was a–j), new `PEQ_LETTERS_BASELINE` = a–j, new `PEQ_PARAM_KEY` regex, new `peqLettersFrom()` helper reading letters from response keys; `PEQ_LETTERS_ALL` **retired**; `bandColor()` re-anchored on `PEQ_LETTERS_BASELINE.indexOf()` (D6); docstring corrections on `BAND_COLORS` and `bandColor()` (Opus adjudication folds) |
| 1 | `src/lib/wiim/eq.ts` | `AcousticCapability` type-import add; `RawAcoustic` interface + `getAcousticCapability(ip)` function added (upstream verbatim); `toBands` swapped `PEQ_LETTERS_ALL.map` → `peqLettersFrom(m.keys()).map`; `resetParametric` `PEQ_LETTERS_ALL` → `PEQ_LETTERS` |
| 1 | `src/lib/wiim/types.ts` | `AcousticCapability` interface added (upstream verbatim); `DeviceCapabilities.acoustic: AcousticCapability \| null` appended after `outputCoexist` (D2) |
| 1 | `src/lib/wiim/capabilities.ts` | `getAcousticCapability` import; `Promise.all` extended 5→6 (append `acoustic`); `equalizer` derivation ORed with `acoustic != null`; return object appends `acoustic` after `outputCoexist` (D2) |
| 1 | `src/app/api/devices/[id]/eq/route.ts` | `PEQ_LETTERS_ALL` → `PEQ_LETTERS` (L8 import + L80 enum); `.max(10)` → `.max(GRAPHIC_BANDS.length)` (9ca026e non-letter change) |
| 1 | `docs/WIIM-API.md` | "per-source LV2 EQ" paragraph edit (drop "10-band parametric"); new firmware-band-count paragraph inserted (rewritten in 44e — see below) |
| 1 | `ARCHITECTURE.md` | `capabilities.ts` row parenthetical extended with "acoustics"; `eq.ts`/`eq-constants.ts` row extended with letter-derivation + `PEQ_LETTERS`/`PEQ_LETTERS_BASELINE` note |
| 2 | `src/components/dashboard/eq-card.tsx` + `_showa/` mirror | `PEQ_GAIN_INDEPENDENT_MODES` import; `isPassFilter` → `gainNA` rename (4 sites); gain display "N/A" → "—"; Q2 filter removal in `ParametricPanel` (temporarily — restored in 44e) + `PEQ_LETTERS` import pruned; Task 4 Off-band visual repair — remove whole-row `opacity-45`, muted letter to `hsl(var(--faceplate)/0.5)`, add `title="Off — pick a filter type to use this band"` on `TypeDropdown` button (no bg-shift — fixed `TAB_FACE` tile), Q + gain columns get `off && "opacity-50"` selective dim, `disabled={off \|\| gainNA}`, `format` extended with `\|\| off` for "—" dB |
| 3 | `src/lib/wiim/eq-response.ts` | `PEQ_LETTERS` import removed; `parametricCurve` visible-band filter dropped; `perBandCurves` order-Map filter dropped, sort simplified to alphabetical; three docstring rewrites |
| 3 | `src/components/dashboard/eq-response-curve.tsx` + `_showa/` mirror | `PEQ_LETTERS` import removed; `bandDots` visible-Set + letter-gate dropped (keeps `mode !== -1` Off filter) |

Excluded per plan: `CHANGELOG.md` (fork doesn't sync), `SECURITY.md` (deferred by Greg during 44d), Headphone EQ tab hunks from `c68c950` (deferred to Round 44f contingent on Ultra headphone-jack use), explicit k/l entries in `BAND_COLORS` (deferred per Q4 — `bandColor()` rust fallback handles them), `docs/FAQ.md` (untouched by 9ca026e/e7b55f2).

## What landed (44e scope)

| File | Change |
|---|---|
| `src/components/dashboard/eq-card.tsx` + `_showa/` mirror | `PEQ_LETTERS_BASELINE` added to eq-constants import; new 6-line comment + `const visible = bands.filter((b) => PEQ_LETTERS_BASELINE.includes(b.letter))` inserted at top of `ParametricPanel`; render site swapped `bands.map` → `visible.map` |
| `docs/WIIM-API.md` | Firmware-band-count paragraph rewritten from Hermes's 44c version — drops the "per-firmware, not fixed" claim, states empirical truth (10 functional bands on all tested devices, 12 on the wire but k/l not DSP-connected, WiiM Home matches, `GetAcousticCapability` doesn't expose functional count, escape hatch documented) |

Data-layer preserved: `peqLettersFrom`, `PEQ_LETTERS` = a–l wire-accepted, `PEQ_LETTERS_BASELINE` = a–j always-rendered — all still valid for hypothetical future firmware that wires k/l live. Response-curve math (`eq-response.ts`, `eq-response-curve.tsx`) untouched — iterates whatever `bands` it receives, k/l handled harmlessly if ever present.

## Live git state to verify at session open

    git log --oneline -8 main
    # expect (top is this session-close commit which will land on top of eb8324a):
    # <session-close>  docs: session close 2026-09-17 (Round 44c merged + 44e clip correction — 12-band wire, 10-band DSP finding)
    # eb8324a          merge: round 44e — clip parametric EQ UI to a-j (functional bands only, 44c smoke correction)
    # 751ea1f          Round 44e: clip parametric EQ UI to a-j (functional bands only) — 44c smoke discovery
    # bf8d757          merge: round 44c — acoustic capability probe + firmware-derived PEQ band count + Off-band visual repair (upstream 3107749, 9ca026e, e7b55f2)
    # dc94c28          Round 44c: acoustic capability probe + firmware-derived PEQ band count + Off-band visual repair (upstream 3107749, 9ca026e, e7b55f2)
    # 09b7a3b          docs: session close 2026-09-16 (Round 44d merged + smoke pass — trusted artwork hosts + isPlexArtUrl retirement)
    # 2105774          merge: round 44d — trusted artwork hosts + isPlexArtUrl retirement
    # 82c0d11          Round 44d: trusted artwork hosts + isPlexArtUrl retirement (upstream 7d99a97)

    git status
    # expect: On branch main; working tree clean; up to date with origin/main

    git branch --list "hermes/*"
    # expect: (empty) — hermes/round44c-eq-cluster + hermes/round44e-band-count-clip deleted this session

    git branch --list "hotfix/*"
    # expect: (empty)

    git branch --list "backup/*"
    # expect (four):
    #   backup/pre-44d-trusted-art-hosts
    #   backup/pre-radio-vendor-hotfix
    #   backup/pre-44c-eq-cluster
    #   backup/pre-44e-band-count-clip
    # (44c + 44e backups stay one-to-two rounds for defense in depth)

    # No revert recipe needed — both rounds smoke-passed. Backups above remain
    # for defence in depth.

**Note:** `main` pushed to `origin` at session close. `origin/main` = `main`.

## This session's arc (execution — 44c: deepseek-v4.1-flash; 44e: Opus-direct)

Baseline verified clean (HEAD `09b7a3b`, tree clean, git identity `Greg T <me@gregthibodeaux.com>` present). Branches created for 44c: `hermes/round44c-eq-cluster` (working) + `backup/pre-44c-eq-cluster` (rollback). Full multi-model pipeline for 44c:

1. **Opus design packet** (pre-session, `round44c-design-packet.md`, 56,652 bytes): scope, exclusions, D-list of expected fork/upstream divergences (D1–D6), Q-list of open questions (Q1–Q7).
2. **deepseek-v4-pro spec-write** (pre-session, `round44c.plan.md`, 41,630 bytes): 4 Tasks in strict dependency order, D1–D6 resolutions embedded, Q1–Q7 answered.
3. **Hermes/Qwen3.8 Max audit** (in-session, inline): APPROVABLE — every anchor verified against working tree at HEAD `09b7a3b` and the three upstream diffs; 2 minor issues both in Task 2.1 (Issue A: stale L36 docstring not included in deletion; Issue B: `bandColor()` docstring "before" text quoted the wrong docstring).
4. **Opus adjudication** (in-session, `round44c.approved.md`, 50,711 bytes): Both audit findings verified against fork ground truth and folded; Opus-added Minor C also folded (the text bullet 1 quoted exists in the sibling `BAND_COLORS` docstring, one-word swap `PEQ_LETTERS` → `PEQ_LETTERS_BASELINE` for post-D6 coherence). Adjudication summary added at top; Task 2.1 restructured into three explicit steps.
5. **deepseek-v4.1-flash exec** (in-session, first round on flash tier) on `hermes/round44c-eq-cluster` (commit `dc94c28`): 12 files landed byte-exact first pass, all three adjudication folds present, dual-write SHA parity intact, retirement audit clean. Hermes filled `## Result` + `## Deviations` in the approved file (renamed `.approved.md` → `.done.md` per Hermes's consistent workflow convention across prior rounds). Three declared deviations — all ratified as cosmetic or plan-already-called-for.
6. **Opus merge** (`bf8d757`): `--no-ff` merge into main; ort strategy clean; running container already reflected 44c code from Hermes's build.
7. **Hardware smoke on Ultra:** PASS. 12 rows a–l visible, k/l default Off + un-dim on Peak-select, LP/HP work with "—" dB, curve draws correctly, response-curve and non-EQ regression clean.
8. **Hardware smoke on Pro:** FAIL — 12 rows visible instead of expected 10. Investigation followed.

Round 44e followed in-session as Opus-direct exec after the discovery arc:

1. **Empirical probe** — direct `EQGetLV2SourceBandEx` call on Pro (bypassing dashboard auth): 12 letters a–l returned, 4 fields each (48 param_names total), same shape as Ultra. `GetAcousticCapability` probed on both — no functional band-count field anywhere in payload (only `PEQ.Version` + `PEQ.Filters` filter-type list). Auto-detection off the table.
2. **Audible A/B test** (Greg drove): L @ Peak/250Hz/+9.5dB → silent on Ultra. D at identical params → clearly audible. Definitive: only a–j are DSP-connected.
3. **Opus-direct execution:** branches created (`hermes/round44e-band-count-clip` + `backup/pre-44e-band-count-clip` from `bf8d757`); three edits applied to `eq-card.tsx` (import + `visible` const + `bands.map`→`visible.map`) with dryRun-first discipline; dual-write to `_showa/`; docs paragraph rewrite; SHA parity verified; typecheck exit 0; lint 1 warning (baseline PEQ_RANGE only), 0 errors; commit `751ea1f`.
4. **Consent-gated rebuild** (Greg approved): `docker compose up -d --build`, container Up (healthy), health `{"ok":true}` 200, clean logs.
5. **Hardware smoke on both devices:** PASS. Ultra shows 10 rows a–j (no k/l), Pro shows 10 rows a–j (no k/l), all 44c behaviors (LP/HP, Off-band selective dim, hint title, "—" dB) preserved, response curve unchanged for a–j configurations, non-EQ regression clean.
6. **Opus merge** (`eb8324a`): `--no-ff` merge into main.

### Verification ladder (both rounds, all green)

- **44c static:** typecheck exit 0; lint exit 0 with one pre-existing PEQ_RANGE warning (baseline); dual-write SHA parity on `eq-card.tsx` (`42abaecb…`) and `eq-response-curve.tsx` (`08ce7c21…`); `PEQ_LETTERS_ALL` retirement audit = 0 hits across `src/**` + `_showa/**`; adjudication folds verified (stale L36 docstring gone, `Indexed to PEQ_LETTERS_BASELINE` present in both `BAND_COLORS` and `bandColor()` docstrings)
- **44e static:** typecheck exit 0; lint 1 warning (baseline PEQ_RANGE only), 0 errors; dual-write SHA parity on `eq-card.tsx` (`97ab18ad…` post-44e); `PEQ_LETTERS_BASELINE` count = 2 in each tree (import + filter call); `visible.map` at L534 both trees; only `bands.map` occurrences remaining are the two in `GraphicPanel` (unrelated scope)
- **Container:** Up (healthy) after both rebuilds; source layer recompiled (no `CACHED [builder …] RUN npm run build` hits either time)
- **Health:** `{"ok":true}` (200) after both rebuilds
- **Hardware smoke:** 44c Ultra PASS + Pro FAIL exposed the firmware quirk that 44e corrected; 44e both devices PASS with a–j only; 44d regressions (Plex art via allowlist, artwork hosts panel) confirmed intact through both rounds

### Environment notes / drift found

- **NEW — WiiM firmware ships 12 parametric bands on the wire but only 10 are DSP-connected.** Ultra 5.2.8x + Pro 2026-09 both. `EQGetLV2SourceBandEx` returns 12 letters a–l each with 4 param_names; writes to k/l persist on re-read; but audible A/B on Ultra proves k/l don't reach DSP. `GetAcousticCapability` doesn't expose functional band count anywhere. WiiM Home clips to 10 rows for the same reason. Dashboard now matches. Escape hatch: drop the `PEQ_LETTERS_BASELINE` filter in `ParametricPanel` if firmware ever wires k/l live. **This inverts upstream's assertion** that "10 on older firmware, 12 on mid-2026 firmware" — the wire shape is 12 on both firmwares we've tested, and neither is DSP-12-band.
- **NEW — `GetAcousticCapability`'s `PEQ` subtree is minimal.** Only `Version` + `Filters` (filter type list: `["OFF","LS","PK","HS","LP","HP"]`) on both devices. No band count, no gain range, no freq range, no per-filter constraints. Whatever we need beyond filter types has to come from a different endpoint or empirical probing.
- **NEW — deepseek-v4.1-flash performed cleanly at flash tier on 44c.** Byte-exact patch execution across 12 files, three adjudication folds landed correctly, three declared deviations all defensible (cosmetic or plan-already-called-for). Worth remembering for similarly-shaped byte-anchor-heavy rounds.
- **44d-carried:** `_showa/components/` contains only `dashboard/` and `ui/` — no `settings/` mirror. Fork `settings-view.tsx` is not Showa-re-themed. Docker compose service is `wiim-dashboard`, not `web`. `tsc`/`eslint` not in the runner image (host binaries via `./node_modules/.bin/`). Runtime device smoke is auth-gated (Greg drives from UI). Refused-host console warning is the diagnostic entry point for blank-art issues (`docker compose logs | grep "artwork host not allowed"`).
- **44c-observed:** Pre-existing PEQ_RANGE lint warning in `eq-response-curve.tsx` still present (documented at 44c plan D4 as out-of-scope). Post-44c and post-44e lint both show exactly this one warning — no drive-by fix, no new warnings introduced.
- **44c-observed:** `docker compose ps` requires a working directory with `docker-compose.yml`; running from wrong `cwd` returns empty output silently. Always `cd /mnt/c/Users/mrthi/Wiim-Dashboard` before compose commands.

## Remaining close work

**None outstanding.** Everything below was completed this session:
- ✅ `--no-ff` merges into main (`bf8d757` for 44c, `eb8324a` for 44e)
- ✅ `_showa/README.md` changelog appended (44c + 44e entries)
- ✅ `_showa/SESSION_HANDOFF.md` update (this doc)
- ✅ Task-file archive move (`round44c.done.md` + `round44c.plan.md` → `WIIM/archive/2026-09-17-round44c-eq-cluster.{done,plan}.md`)
- ✅ Branch cleanup: `hermes/round44c-eq-cluster` deleted; `hermes/round44e-band-count-clip` deleted; four backups preserved
- ✅ Push to `origin/main`
- ✅ Standing candidate "Round 44e — 6c8b37d IP-edit" reassigned (see Forward scope — 44e number now taken by band-count-clip; IP-edit stays un-numbered until claimed)

## Forward scope — standing candidates

1. **Smoke Observation A (44a, carried):** UHD/Master/Qobuz-tier service-specific badge (WiiM Home app shows one; fork normalizes hi-res to "Hi-Res Lossless"). Re-check whether the upstream hi-res quality-tag mapping surfaces the tag distinctly in `StreamInfoLine`; if not, add a fork-specific `actualQuality`/`service` → badge mapping. Small standalone check-then-decide; not a full round.
2. **Smoke Observation B (44a) — display half open.** Post-44b hotfix (`dd96540`) resolved the transport half. Display half: fork's `detectService` intentionally filters CustomRadio via `INTERNAL_VENDOR_NAMES`, so the service band labels a CustomRadio stream as "Network" rather than "Radio". Design question, low priority. Folds naturally with item 3.
3. **Hide timeline / disable scrub on non-scrubbable sources (post-44b, fork enhancement).** Radio + Amazon-via-QPlay both hit `duration: 0`. Extend the timeline gate in `now-playing-card.tsx` to include `duration > 0`. Fork enhancement, single 2-file dual-write. Could fold in item 2's label half in one round.
4. **`6c8b37d` in-place IP edit (previously earmarked Round 44e, unassigned after 44e was retasked to band-count-clip).** Low-cost, good calibration candidate if we want a lighter round between larger ones.
5. **`c68c950` Headphone-EQ tab (deferred, contingent on Ultra headphone-jack use).** `eq-card.tsx` 8-line addition, `capabilities.ts` HeadphoneEQ detection, `commands.ts` headphone EQ read/write. Would be Round 44f-or-later.
6. **`HERMES_PREAMBLE_wiim-dashboard.md` fix** (44a, carried): WSL git-identity assertion — Hermes has not re-hit the staleness in the last few rounds, but the preamble should assert it. Historical cleanup.
7. **Upstream PR of `.env.example` TRUST_PROXY doc.** Standing. Not yet drafted.
8. **Companion `gthibo/wiim-universal-remote`.** Out of this repo's queue.
9. **EQ response curve deferred features.** Draggable nodes, potential Catmull-Rom → monotone cubic swap, row-letter contrast tuning. Feature-forward; will bundle naturally when we're back in `eq-response-curve.tsx`.
10. **`SECURITY.md` from upstream `7d99a97` (deferred by Greg during 44d).** Revisit as part of a future docs-reconciliation architectural round, alongside any other diverged docs (`CHANGELOG.md`, `docs/FAQ.md`).
11. **Investigate whether other WiiM device families (Amp, Mini, older Pros, LinkPlay OEMs) also expose 12 wire / 10 DSP bands.** Not urgent — 44e's clip is correct for the general case, and evidence-of-12-DSP would just require dropping the filter. Would strengthen the empirical claim in `docs/WIIM-API.md` if pursued.

## Canonical reference documents

Not tracked in this repo:

- `C:\Users\mrthi\Documents\WIIM\round44-upstream-recon-report.md` — authoritative recon
- `C:\Users\mrthi\Documents\WIIM\round44-regrouping.md` — Round 44 sub-round scope decisions
- `C:\Users\mrthi\Documents\WIIM\round44c-design-packet.md` — Opus design packet (44c)
- `C:\Users\mrthi\Documents\WIIM\archive\` — closed `.done`/`.approved`/`.plan`/`-audit` pairs (44a, 44b, 44c, 44d archived here)
- `C:\Users\mrthi\Documents\WIIM\probe-pro-eq.sh` + `probe-acoustic-capability.sh` — 44e diagnostic scripts (kept for future firmware regressions)
- `C:\Users\mrthi\Documents\WIIM\workflow.md` — Hermes/Opus workflow contract
- `C:\Users\mrthi\Documents\WIIM\HERMES_PREAMBLE.md` / `HERMES_PREAMBLE_wiim-dashboard.md` — preambles (latter has the stale git-identity note, carried)
- `C:\Users\mrthi\Documents\WIIM\templates\plan-template.md` — task plan template

## Standing operational rules

Refer to project memory (`ways-of-working.md`). No memory updates this session — 44c and 44e extend existing patterns without changing architectural rules; the durable firmware finding is captured in `docs/WIIM-API.md` (in-repo), `PEQ_LETTERS_BASELINE` filter comment in `ParametricPanel` (in-repo), and this handoff.

---

## Previous round — Round 44d (landed 2026-09-16, merge `2105774`)

Round 44d — trusted artwork hosts + `isPlexArtUrl` retirement — landed via full multi-model pipeline (Opus design → deepseek-v4-pro spec-write → Qwen3.8 Max audit → Opus adjudication → deepseek-v4-pro exec). 7 files, +275/−33: adopted upstream `7d99a97`'s opt-in trusted-artwork-host allowlist as the fork's LAN media-server SSRF policy, retiring the fork-specific `isPlexArtUrl` URL-shape shim in the same commit. Touched `db/settings.ts` (`artHosts` key + `MAX_ART_HOSTS = 8`), `wiim/client.ts` (SSRF helpers + `wiimFetchRaw` allowlist rewrite + shim retirement + agent-selection comment rewrite), `client/hooks.ts` (`SettingsResponse.artHosts`), `settings/route.ts` (validation + wiring), `art/route.ts` + `preset-art/route.ts` (`allowHosts: getArtHosts()` with slave→master redirect and Round 39 cache preserved), `settings-view.tsx` (new `ArtworkHosts` panel — single tree; `_showa/components/settings/` doesn't exist). `readonly string[]` on `allowHosts` (D8), no client-side hard cap (D7 — server enforces via zod). Excluded: `CHANGELOG.md`, `SECURITY.md`, `docs/FAQ.md`. Runtime smoke-passed live: `192.168.1.107:32400` added as Plex host; a `192.168.1.7:32400` typo caught cleanly by the allowlist gate with the exact refused-host warning telling the operator what to add. Diagnostic (`docker compose logs | grep "artwork host not allowed"`) saved to `wiim-dashboard-verification` skill. Full detail in the prior handoff revision (git history of this file) and the archived `round44d-trusted-art-hosts.*` files.

## Previous round — Post-44b hotfix (landed 2026-09-16, merge `dd96540`)

Post-44b radio-transport hotfix: extended `isRadio` in `now-playing-card.tsx` with vendor-string branches (`vtuner`, `customradio`, `newtunein`) — Ultra 5.2.827567 lands vTuner and CustomRadio streams on `sourceMode: "10"` (not the 12/13 upstream's spec assumed) with `vendor: "vTuner"` and `vendor: "CustomRadio"` respectively. Vendor-string fallback fixes both without disturbing the fork's intentional `INTERNAL_VENDOR_NAMES` filter for "CustomRadio". Single 2-file dual-write, +28/−2, SHA `13F5F766…D951` in both trees. Smoke-passed live. Preserved via `backup/pre-radio-vendor-hotfix`. Full detail in the prior handoff revision (git history of this file).

## Previous round — Round 44b (landed 2026-09-16, merge `bb94ae4`)

Round 44b — snapshot batch + `c68c950` UI-layer subset — landed via kimi-k3 exec through the multi-model pipeline. 6 files, +231/−108: `constants.ts` (`MEDIA_SOURCE_KEYS` export), `parse.ts` (`bea000f` `deriveSource` prioritised match), `upnp.ts` (`0472b2b` DIDL-Lite `<res>` fallback), `ARCHITECTURE.md` (upnp.ts row + `fetchSoundCard` drift), `now-playing-card.tsx` (`isMediaSource`/`isPhysicalInput` refactor + hide-timeline-when-stopped, both trees). Passed static + hardware smoke. Full detail in the prior handoff revision (git history of this file) and the archived `round44b-*.md` files.
