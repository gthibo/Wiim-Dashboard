# Showa Hi-Fi Counter — Session Handoff

*Updated end of session: September 18, 2026 (post-44f close). Round 44f — upstream `6c8b37d` in-place IP edit — landed Opus-direct as a small calibration round between larger cluster rounds. Clean cherry-pick, byte-identical port, full hardware smoke on Ultra. Supersedes the post-44c+44e handoff (preserved in git history of this file; compressed 44c+44e summary below in "Previous rounds").*

## Session update — 2026-09-18 (post-44f close)

**Round 44f landed and smoke-passed on Ultra.** Merge `06ca97c` on `main`; 1-file port, +74/−3, adopts upstream `6c8b37d` (illiano, 2026-09-09) byte-for-byte via clean cherry-pick. The staged file's git blob is `ac05cef1907b659f1ecb6a8af2721e42c05ad2e2`, identical to upstream's blob for the same path — verified via `git ls-files -s` vs `git rev-parse 6c8b37d:src/components/devices/device-manager.tsx`. Cherry-pick's only conflict was `CHANGELOG.md`, resolved as "keep ours" per fork policy. Opus-direct exec (small scope), no multi-model pipeline. Full six-step smoke on Ultra: pencil visible, toggle opens input, cancel discards, valid save persists + re-probes capability chips, `8.8.8.8` rejected with "Host must be a private/LAN address." toast (via fork's `isPrivateHost` at `client.ts` L161 → 400 `FORBIDDEN_HOST`), duplicate IP rejected with "Another device already uses this address." toast (409 `DUPLICATE`).

**What this fixes.** Router DHCP hands WiiM devices new leases often enough that a stale address is a common way for the whole dashboard to look broken — the scrobbler just logs EHOSTUNREACH every 15 s. Prior to 44f the only fix was to remove the device and re-add it, which threw away custom source names. Now: pencil beside `model · address` on `/devices` opens an input; save PATCHes `host` and best-effort re-probes the box at the new address so capability chips reflect what's actually there.

**Ground-truth checks pre-scope were the whole story.** Four checks locked scope in under two minutes and made this a clean Opus-direct round:
1. `device-manager.tsx` had 0 hits across 9 Showa design tokens — not re-themed, byte-copyable
2. `_showa/components/devices/` doesn't exist — `src/`-only, no dual-write (same `settings/` pattern as 44d)
3. Fork's `PATCH /api/devices/[id]` route already accepted `host` with LAN + duplicate validation — zero API/data-layer surface
4. Fork's file was byte-identical to upstream's `6c8b37d^` baseline — `git diff --stat 6c8b37d^` returned empty, meaning the fork had never diverged from upstream on this file

Fourth check meant the cherry-pick was pure adoption, not adaptation. When ground-truth turns up numbers this clean, the multi-model pipeline is overkill.

**Consent gate held.** One docker rebuild this session, explicitly approved before running. Zero silent builds.

**Smoke-flow disambiguation observation.** Initial smoke reported "pencil not visible" — turned out to be a page mixup. The upstream commit + Round 44f target the Devices *settings* page at `/devices` (a `SubPage` titled "Devices" rendering `<DeviceManager>`), but Greg was looking at the main dashboard where `device-info-card.tsx` renders an `IP: <address>` row with a globe icon. Two useful surface findings out of this:
- **The sidebar link to `/devices` reads "Add Device"**, which is misleading — the page also lists and manages devices, not just adds them. Queued as Round 44g candidate below.
- **The main dashboard's `device-info-card.tsx` IP row is a natural place to also expose an edit affordance** — upstream doesn't have it because upstream doesn't surface the IP prominently on the dashboard the way the fork does. Would be a fork-specific enhancement, small single-file dual-write (`_showa/components/dashboard/` mirror exists). Queued as forward scope candidate below.

**Branch cleanup.** `hermes/round44f-inplace-ip-edit` deleted (merge commit `06ca97c` second-parent preserves `b723fc4`). Preserved: `backup/pre-44c-eq-cluster`, `backup/pre-44d-trusted-art-hosts`, `backup/pre-44e-band-count-clip`, `backup/pre-44f-inplace-ip-edit`, `backup/pre-radio-vendor-hotfix`. The 44c + 44e backups are now two rounds old and can be pruned next session per the defense-in-depth-then-prune pattern.

**Pushed.** `main` pushed to `origin` at handoff-write time.

---

## tl;dr for picking this back up

Round 44f — upstream `6c8b37d` in-place IP edit on the `/devices` settings page — landed via merge commit `06ca97c` on 2026-09-18. **Passed hardware smoke** on Ultra across all six steps. Container Up (healthy) after `docker compose up -d --build`. Nothing outstanding on 44f itself.

**Two follow-on candidates surfaced this session, both queued below:**
1. Sidebar/action-tile relabel of "Add Device" → "Devices" (or preferred label) — misleading since `/devices` is list-and-manage AND add
2. Add pencil-edit affordance to the main-dashboard `device-info-card.tsx` IP row (fork-specific enhancement; upstream doesn't have this because upstream doesn't surface IP on the dashboard)

**Configured Plex host still valid:** `192.168.1.107:32400` (from 44d). If the container SQLite settings DB is nuked, re-add via Settings → Artwork hosts.

**No docker runtime errors** in logs post-build. Health `{"ok":true}` on `:39446`. Scrobbler polling every 15s.

## What landed (44f scope)

| File | Change |
|---|---|
| `src/components/devices/device-manager.tsx` | +74/−3 byte-for-byte from upstream `6c8b37d`. New `editHostId` + `editHost` state (L79–80); new `saveHost(id)` async that PATCHes `host`, then best-effort POSTs `/refresh` to re-probe, then `mutate()` + toast (L170–194); render swap around L358–405: the plain `<p>` for `model · address` becomes a ternary — when `editHostId === d.id`, renders an `<Input>` with save (Check) / cancel (X) buttons and Enter/Escape key handlers; else renders a `<p>` with the `model · address` span plus a `<button aria-label="Change IP address">` containing a `<Pencil className="size-3"/>`. |

Excluded: `CHANGELOG.md` (fork policy — fork doesn't sync CHANGELOG, resolved "keep ours" during cherry-pick).

## Live git state to verify at session open

    git log --oneline -6 main
    # expect (top is this session-close commit which will land on top of 06ca97c):
    # <session-close>  docs: session close 2026-09-18 (Round 44f merged + smoke pass — in-place IP edit)
    # 06ca97c          merge: round 44f — in-place IP edit on Devices page (upstream 6c8b37d)
    # b723fc4          Round 44f: in-place IP edit on Devices page (upstream 6c8b37d)
    # e1de689          docs: session close 2026-09-17 (Round 44c merged + 44e clip correction — 12-band wire, 10-band DSP finding)
    # eb8324a          merge: round 44e — clip parametric EQ UI to a-j (functional bands only, 44c smoke correction)
    # 751ea1f          Round 44e: clip parametric EQ UI to a-j (functional bands only) — 44c smoke discovery

    git status
    # expect: On branch main; working tree clean; up to date with origin/main

    git branch --list "hermes/*"
    # expect: (empty) — hermes/round44f-inplace-ip-edit deleted this session

    git branch --list "hotfix/*"
    # expect: (empty)

    git branch --list "backup/*"
    # expect (five):
    #   backup/pre-44c-eq-cluster        (age: 2 rounds — prune candidate)
    #   backup/pre-44d-trusted-art-hosts (age: 2 rounds — prune candidate)
    #   backup/pre-44e-band-count-clip   (age: 1 round)
    #   backup/pre-44f-inplace-ip-edit   (age: 0 rounds — this session's)
    #   backup/pre-radio-vendor-hotfix   (age: several rounds — prune candidate)

    # No revert recipe needed — smoke-passed. Backups above remain for defense in depth.

**Note:** `main` pushed to `origin` at session close. `origin/main` = `main`.

## This session's arc (execution — Opus-direct)

Baseline verified clean (HEAD `e1de689`, tree clean). Branches created: `hermes/round44f-inplace-ip-edit` (working) + `backup/pre-44f-inplace-ip-edit` (rollback), both off `e1de689`.

1. **Ground-truth checks** (4 items above) locked scope: 1-file, `src/`-only, no API surface, byte-identical to upstream baseline.
2. **Cherry-pick `6c8b37d --no-commit`:** `CHANGELOG.md` UU + `device-manager.tsx` M staged clean. Resolved CHANGELOG as "keep ours" (`git checkout --ours` + reset + checkout). Only `device-manager.tsx` remained staged.
3. **Byte-identity verification:** `git ls-files -s` staged blob = `ac05cef1907b659f1ecb6a8af2721e42c05ad2e2` = upstream's blob for the same path (via `git rev-parse 6c8b37d:src/components/devices/device-manager.tsx`). Byte-exact port.
4. **Static gates:** typecheck exit 0, lint exit 0 with only the pre-existing baseline PEQ_RANGE warning (zero new — same baseline as 44c/44e closes).
5. **Commit** `b723fc4` on hermes branch with fork-standard message referencing upstream hash and blob SHA.
6. **Consent-gated rebuild** (Greg approved): `docker compose up -d --build`, container Up (healthy), health `{"ok":true}` 200, clean startup logs (scrobbler polling 15s, no errors).
7. **Verified compiled bundle contains new string:** `docker exec wiim-dashboard grep -rl "Change IP address" /app/.next` hit both `/app/.next/server/app/devices/page.js` and `/app/.next/static/chunks/app/devices/page-9e086a3fe567d550.js` — confirmed the fresh code shipped, not cached.
8. **Hardware smoke on Ultra:** 6-step plan, initial 5-pass 1-fail turned into 6-pass after the fail was disambiguated as a LAN-scan-vs-pencil UI mixup (LAN scan on same page toasts "No devices found on that range" for public IPs; the pencil→save→400 flow correctly toasts "Host must be a private/LAN address" via `isPrivateHost`).
9. **Opus merge** (`06ca97c`): `--no-ff` merge into main; ort strategy clean.

### Verification ladder (all green)

- **Cherry-pick:** clean apply of `device-manager.tsx` (only CHANGELOG conflict, resolved as ours per fork policy)
- **Byte-identity:** git blob SHA staged = upstream blob SHA (`ac05cef1…`)
- **Diff stat:** +74/−3 matches upstream's +75/−3 total minus the +1 CHANGELOG line
- **`_showa/` tree:** untouched (correct — no `devices/` mirror exists)
- **Static:** typecheck exit 0; lint exit 0 with only baseline PEQ_RANGE warning
- **Container:** Up (healthy) after rebuild; source layer recompiled (no `CACHED [builder …] RUN npm run build`)
- **Bundle contains new code:** `Change IP address` string present in both server and client bundles inside running container
- **Health:** `{"ok":true}` (200)
- **Hardware smoke on Ultra:** 6/6 pass after mixup disambiguation

### Environment notes / drift found

- **NEW — Sidebar action tile at `source-output-panel.tsx` L512 reads "Add Device" but its `href="/devices"` navigates to the full list-and-manage page.** Misleading enough that it caused smoke confusion this session. See Round 44g candidate below.
- **NEW — Main dashboard's `device-info-card.tsx` L52 renders an `IP: <address>` row via a Showa-themed `<Row icon={<Globe/>} label="IP" value={info.ip}/>`** — different component from `device-manager.tsx`, different page. Any future device-listing work needs to distinguish these two surfaces. The `hsl(var(--faceplate)/...)` styling isn't inline in `device-info-card.tsx` — it comes from the `Row` component's default style tokens, which is why the earlier "grep for Showa tokens in device-manager.tsx" ground-truth check correctly returned zero. Lesson for future rounds: when a smoke report includes DOM markup, distinguish which component rendered it before assuming the patched component is at fault.
- **44e-carried:** WiiM firmware (Ultra 5.2.8x + Pro 2026-09) ships 12 parametric bands on the wire but only 10 are DSP-connected. Dashboard clips UI to a–j via `PEQ_LETTERS_BASELINE` filter in `ParametricPanel`. Escape hatch documented in `docs/WIIM-API.md` L114.
- **44d-carried:** `_showa/components/` contains only `dashboard/` and `ui/` — no `settings/` mirror, no `devices/` mirror. Docker compose service is `wiim-dashboard`, not `web`. `tsc`/`eslint` not in the runner image (host binaries via `./node_modules/.bin/` from WSL).
- **44f-observed:** PowerShell `$?` inside `wsl bash -lc "..."` returns the shell boolean, not the numeric exit code — use single-quoted `wsl bash -lc '... ; echo TSC_EXIT:$?'` to preserve `$?` for the bash interpreter. Cost this session: one confusing "EXIT:True" printout before the fix.
- **44f-observed:** `git show <commit>:<path> | Out-File -Encoding utf8 <tmpfile>` adds a UTF-8 BOM that breaks SHA256 file-hash comparisons even when the content is identical. The authoritative byte-identity check is `git ls-files -s <path>` vs `git rev-parse <commit>:<path>` — both return the raw git blob SHA, no encoding involved. Save the temp-file dance for cases where you actually need textual diff output.

## Remaining close work

**None outstanding.** Everything below was completed this session:
- ✅ `--no-ff` merge into main (`06ca97c`)
- ✅ `_showa/README.md` changelog appended (Round 44f entry at L274)
- ✅ `_showa/SESSION_HANDOFF.md` update (this doc)
- ✅ Branch cleanup: `hermes/round44f-inplace-ip-edit` deleted; five backups preserved (44c + 44e are prune candidates next session)
- ✅ Push to `origin/main`
- ✅ New forward-scope candidates recorded (see below)

No task-file archive move: 44f was Opus-direct with no `.plan.md` (same pattern as 44e — small in-session round, record lives in this handoff plus commits `b723fc4` + `06ca97c`).

## Forward scope — standing candidates

1. **Smoke Observation A (44a, carried):** UHD/Master/Qobuz-tier service-specific badge (WiiM Home app shows one; fork normalizes hi-res to "Hi-Res Lossless"). Re-check whether the upstream hi-res quality-tag mapping surfaces the tag distinctly in `StreamInfoLine`; if not, add a fork-specific `actualQuality`/`service` → badge mapping. Small standalone check-then-decide; not a full round.
2. **Smoke Observation B (44a) — display half open.** Post-44b hotfix (`dd96540`) resolved the transport half. Display half: fork's `detectService` intentionally filters CustomRadio via `INTERNAL_VENDOR_NAMES`, so the service band labels a CustomRadio stream as "Network" rather than "Radio". Design question, low priority. Folds naturally with item 3.
3. **Hide timeline / disable scrub on non-scrubbable sources (post-44b, fork enhancement).** Radio + Amazon-via-QPlay both hit `duration: 0`. Extend the timeline gate in `now-playing-card.tsx` to include `duration > 0`. Fork enhancement, single 2-file dual-write. Could fold in item 2's label half in one round.
4. **NEW — Round 44g candidate: "Add Device" sidebar/tile relabel.** The dashboard column action tile at `src/components/dashboard/source-output-panel.tsx` L512 (and `_showa/` mirror at same L512) reads `label="Add Device"` but its `href="/devices"` navigates to the full list-and-manage page. Also `app-header.tsx` L84/L95 has "Add device" (lowercase-d) with matching `aria-label` at L95. Rename candidates: "Devices" (shortest), "Manage devices" (most descriptive), "Devices & setup". Touches 3 files + 1 mirror + docstring comments at `source-output-panel.tsx` L38/L412/L508/L564. Small dual-write round; Opus-direct viable.
5. **NEW — Fork-specific enhancement candidate: add pencil-edit to dashboard IP row.** Upstream `6c8b37d` (landed as 44f) added the pencil to `/devices` only, because upstream doesn't surface IP prominently on the main dashboard. The fork's `src/components/dashboard/device-info-card.tsx` L52 renders `<Row icon={<Globe/>} label="IP" value={info.ip}/>` — a natural place to also expose the edit affordance, arguably where a stale IP would be noticed first. Would require adapting the pencil pattern from `device-manager.tsx` into the `Row` value slot (need to check whether `Row` accepts JSX children/actions or needs a variant). Single-file dual-write to `device-info-card.tsx` + `_showa/` mirror (mirror exists). Fork-specific — no upstream to sync.
6. **`c68c950` Headphone-EQ tab (deferred, contingent on Ultra headphone-jack use).** `eq-card.tsx` 8-line addition, `capabilities.ts` HeadphoneEQ detection, `commands.ts` headphone EQ read/write. Would be Round 44h-or-later.
7. **`HERMES_PREAMBLE_wiim-dashboard.md` fix** (44a, carried): WSL git-identity assertion. Historical cleanup.
8. **Upstream PR of `.env.example` TRUST_PROXY doc.** Standing. Not yet drafted.
9. **Companion `gthibo/wiim-universal-remote`.** Out of this repo's queue.
10. **EQ response curve deferred features.** Draggable nodes, potential Catmull-Rom → monotone cubic swap, row-letter contrast tuning. Will bundle naturally when we're back in `eq-response-curve.tsx`.
11. **`SECURITY.md` from upstream `7d99a97` (deferred by Greg during 44d).** Revisit as part of a future docs-reconciliation architectural round.
12. **Investigate whether other WiiM device families (Amp, Mini, older Pros, LinkPlay OEMs) also expose 12 wire / 10 DSP bands.** Not urgent — 44e's clip is correct for the general case.

## Canonical reference documents

Not tracked in this repo:

- `C:\Users\mrthi\Documents\WIIM\round44-upstream-recon-report.md` — authoritative recon
- `C:\Users\mrthi\Documents\WIIM\round44-regrouping.md` — Round 44 sub-round scope decisions
- `C:\Users\mrthi\Documents\WIIM\archive\` — closed `.done`/`.approved`/`.plan`/`-audit` pairs (44a, 44b, 44c, 44d archived here; 44e and 44f are Opus-direct with no task files)
- `C:\Users\mrthi\Documents\WIIM\probe-pro-eq.sh` + `probe-acoustic-capability.sh` — 44e diagnostic scripts (kept for future firmware regressions)
- `C:\Users\mrthi\Documents\WIIM\workflow.md` — Hermes/Opus workflow contract
- `C:\Users\mrthi\Documents\WIIM\HERMES_PREAMBLE.md` / `HERMES_PREAMBLE_wiim-dashboard.md` — preambles (latter has the stale git-identity note, carried)
- `C:\Users\mrthi\Documents\WIIM\templates\plan-template.md` — task plan template

## Standing operational rules

Refer to project memory (`ways-of-working.md`). No memory updates this session — 44f is a clean example of the ground-truth-first / Opus-direct pattern that memory already captures. Two new lessons worth carrying (already in Environment notes above): the PowerShell `$?` quoting fix for WSL exit codes, and using git blob SHAs (not file SHA256) as the authoritative byte-identity check for cherry-pick verification.

---

## Previous rounds — Round 44c + 44e (landed 2026-09-17, merges `bf8d757` + `eb8324a`)

Round 44c — EQ cluster — landed via full multi-model pipeline: Opus design packet → deepseek-v4-pro spec-write → Hermes/Qwen3.8 Max audit → Opus adjudication → deepseek-v4.1-flash exec (first round on flash tier, clean pass). 12 files, +183/−71: adopts upstream three-commit EQ cluster (`3107749` acoustic-capability probe + LP/HP filter types, `9ca026e` firmware-derived PEQ band count, `e7b55f2` Off-band visual repair). Ultra smoke passed; Pro smoke exposed a firmware quirk — 12 rows visible instead of expected 10 — corrected in 44e. Round 44e — clip parametric EQ UI to a–j after empirical audio testing proved WiiM firmware's 12-band wire response includes 2 non-functional bands — landed Opus-direct as in-session follow-on. 3 files, +19/−5. Both smoke-passed on both devices post-44e. The durable finding: WiiM firmware (Ultra 5.2.8x + Pro 2026-09) sends 12 parametric bands on the wire but only 10 are DSP-connected; `GetAcousticCapability` doesn't expose functional band count. Dashboard clips UI to a–j via `PEQ_LETTERS_BASELINE` filter in `ParametricPanel`. Escape hatch: drop that filter if firmware ever wires k/l live. Full detail in the prior handoff revision (git history of this file) and archived `round44c-*.md` files.

## Previous round — Round 44d (landed 2026-09-16, merge `2105774`)

Round 44d — trusted artwork hosts + `isPlexArtUrl` retirement — landed via full multi-model pipeline. 7 files, +275/−33: adopted upstream `7d99a97`'s opt-in trusted-artwork-host allowlist as the fork's LAN media-server SSRF policy, retiring the fork-specific `isPlexArtUrl` URL-shape shim in the same commit. Touched `db/settings.ts` (`artHosts` key + `MAX_ART_HOSTS = 8`), `wiim/client.ts` (SSRF helpers + `wiimFetchRaw` allowlist rewrite + shim retirement), `client/hooks.ts`, `settings/route.ts`, `art/route.ts` + `preset-art/route.ts` (`allowHosts: getArtHosts()` with slave→master redirect and Round 39 cache preserved), `settings-view.tsx` (new `ArtworkHosts` panel — single tree; `_showa/components/settings/` doesn't exist). Runtime smoke-passed live: `192.168.1.107:32400` added as Plex host; a `192.168.1.7:32400` typo caught cleanly by the allowlist gate with the exact refused-host warning telling the operator what to add. Full detail in the prior handoff revision (git history of this file) and archived `round44d-trusted-art-hosts.*` files.
