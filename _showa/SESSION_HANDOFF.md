# Showa Hi-Fi Counter — Session Handoff

*Updated end of session: September 16, 2026 (post-44d close). Round 44d landed via full multi-model pipeline (Opus design → deepseek-v4-pro spec-write → Qwen3.8 Max audit → Opus adjudication → deepseek-v4-pro exec) and passed hardware smoke live. This session also folded in the accumulated `_showa/README.md` changelog backfill through 44d. Supersedes the post-44b-hotfix handoff (preserved in git history of this file; compressed 44b summary below in "Previous round").*

## Session update — 2026-09-16 (post-44d close)

**Round 44d landed and smoke-passed.** Merge `2105774` on `main`; 7-file port, +275/−33, adopts upstream `7d99a97`'s opt-in trusted-artwork-host allowlist as the fork's LAN media-server SSRF policy, retiring the fork-specific `isPlexArtUrl` URL-shape shim in the same commit. Multi-model pipeline: Opus design packet → deepseek-v4-pro spec (`round44d.plan.md`) → Qwen3.8 Max audit (APPROVABLE, 3 minor findings all folded in by Opus adjudication) → deepseek-v4-pro exec on `hermes/round44d-trusted-art-hosts` (`82c0d11`) → Opus-executed `--no-ff` merge into main. Container rebuilt fresh (source layer re-compiled, not cached), health green.

**Smoke — CLOSED live from the UI (Greg).** Static gates all green (typecheck exit 0, lint exit 0 with one pre-existing unrelated PEQ_RANGE warning, retirement grep = 0 `isPlexArtUrl` hits across `src/**` and `_showa/**` source — the only remaining hit is a prose reference in this doc's prior revision, which is expected and non-code). Runtime smoke: allowlist entry `192.168.1.107:32400` added via Settings → Artwork hosts, Plex-cast art fetches and renders. **A `192.168.1.7:32400` typo caught the design cleanly** — validation accepted the syntactically valid entry, then at fetch time the real host `192.168.1.107:32400` was refused with the exact console-log warning `[wiim] artwork host not allowed: 192.168.1.107:32400 — add it under Settings → Artwork hosts to show this cover art`, telling the operator exactly what to add. Diagnostic saved to the `wiim-dashboard-verification` skill so future blank-art follow-ups go straight to `docker compose logs | grep "artwork host not allowed"`.

**`_showa/README.md` changelog backfill folded into this close.** Six missing entries appended in chronological landing order: USB output cap (`61e3a43`), USB chain follow-on (`30198ef`), Round 44a (`0100854`), Round 44b (`bb94ae4`), post-44b radio-transport hotfix (`dd96540`), and Round 44d (`2105774`). Historical record now complete through today.

**44d task-file archive move done.** `WIIM/tasks/round44d.approved.md` + `WIIM/tasks/round44d-audit-qwen.md` → `WIIM/archive/2026-09-16-round44d-trusted-art-hosts.{approved,audit-qwen}.md` (per 44a/44b pattern: dot for `.approved.md`, hyphen for `-audit-qwen.md`). No `.done.md` — Hermes wrote the `## Result`/`## Deviations` sections into the approved file directly; exec detail lives in git commit `82c0d11`, the 44d tl;dr below, and the archived approved file.

**Branch cleanup done.** `hermes/round44d-trusted-art-hosts` deleted (merge commit `2105774`'s second-parent preserves `82c0d11`). `backup/pre-44b-snapshot-batch` deleted (44d smoke-passed on top of it, aged out per plan's post-round hygiene note). Preserved: `backup/pre-radio-vendor-hotfix` and `backup/pre-44d-trusted-art-hosts` for defense-in-depth.

**Memory updates done** (in project memory, not the repo — see D5 in the plan). `ways-of-working.md` `isPlexArtUrl` shim line superseded to reflect its retirement; `overview.md` shim reference reframed as "was."

**Pushed.** `main` pushed to `origin` at handoff-write time.

---

## tl;dr for picking this back up

Round 44d — trusted artwork hosts + `isPlexArtUrl` retirement — landed via merge commit `2105774` and **passed hardware smoke 2026-09-16**. 7 files, +275/−33, all 4 Opus-adjudicated code blocks byte-exact against upstream `7d99a97`. Container Up (healthy) after `docker compose up -d --build` with a fresh (uncached) `next build`. Static gates green. Retirement audit clean.

**Round 44d confirmed working live:** Plex-cast art (`https://192.168.1.107:32400/photo/:/transcode?...&X-Plex-Token=…`) fetches correctly through the new allowlist gate (allowlisted `192.168.1.107:32400` + self-signed-tolerant `getInsecureAgent`); refused-host warning surfaces the exact `host:port` to add when the operator mistypes the entry.

**Configured Plex host for the record:** `192.168.1.107:32400`. If the container SQLite settings DB is nuked (e.g., volume wiped), re-add this via Settings → Artwork hosts.

**No docker runtime errors** in logs post-build. Health `{"ok":true}` on `:39446`.

## What landed (44d scope)

| Task | File | Change |
|---|---|---|
| 1 | `src/lib/db/settings.ts` | `artHosts` key + `getArtHosts`/`setArtHosts`/`MAX_ART_HOSTS = 8` (typed-settings pattern extension) |
| 2 | `src/lib/wiim/client.ts` | SSRF helpers (`isSensitiveIp`, `normaliseArtHost`, `artHostKey`, `getInsecureAgent`, `warnRefusedArtHost`) + `wiimFetchRaw` allowlist rewrite + `isPlexArtUrl` **retirement** (3 touchpoints) + comment rewrite at agent-selection site |
| 3 | `src/lib/client/hooks.ts` | `artHosts: string[]` in `SettingsResponse` |
| 4 | `src/app/api/settings/route.ts` | imports, `PatchSchema.artHosts`, `validateArtHosts()` with DNS-rebinding guard, GET + PATCH wiring, `BAD_ART_HOST` |
| 5 | `src/app/api/devices/[id]/art/route.ts` | `allowHosts: getArtHosts()` (slave→master redirect FORK DELTA preserved) |
| 6 | `src/app/api/devices/[id]/preset-art/route.ts` | `allowHosts: getArtHosts()` (Round 39 URL-keyed cache FORK DELTA preserved) |
| 7 | `src/components/settings/settings-view.tsx` | new `ArtworkHosts` panel + `Image`/`Plus`/`X` icons (**single tree** — `_showa/components/settings/` does not exist; D1) |

`readonly string[]` on `allowHosts` (D8), no client-side hard cap at 8 entries (D7 Opus-ratified — server enforces via zod). Excluded per plan: `CHANGELOG.md` (fork doesn't sync), `SECURITY.md` (Greg deferred), `docs/FAQ.md` (Opus-adjudicated skip — inconsistent-docs revisit for a later architectural round).

## Live git state to verify at session open

    git log --oneline -6 main
    # expect (top is this session-close commit which will land on top of 2105774):
    # <session-close>  docs: session close 2026-09-16 (Round 44d merged + smoke pass — trusted artwork hosts + isPlexArtUrl retirement)
    # 2105774          merge: round 44d — trusted artwork hosts + isPlexArtUrl retirement
    # 82c0d11          Round 44d: trusted artwork hosts + isPlexArtUrl retirement (upstream 7d99a97)
    # b21499a          docs: session close 2026-09-16 (post-44b hotfix + smoke pass)
    # dd96540          merge: post-44b radio-transport hotfix (vendor-string isRadio extension)
    # 09214c3          fix(now-playing): gate transport on vendor string for firmware without mode 12/13

    git status
    # expect: On branch main; working tree clean; up to date with origin/main

    git branch --list "hermes/*"
    # expect: (empty) — hermes/round44d-trusted-art-hosts deleted this session

    git branch --list "hotfix/*"
    # expect: (empty)

    git branch --list "backup/*"
    # expect (two):
    #   backup/pre-radio-vendor-hotfix
    #   backup/pre-44d-trusted-art-hosts
    # (backup/pre-44b-snapshot-batch deleted this session — aged out after 44d smoke-pass)

    # No revert recipe needed — 44d smoke-passed. Backups above remain for
    # defence in depth.

**Note:** `main` pushed to `origin` at session close. `origin/main` = `main`.

## This session's arc (execution — deepseek-v4-pro via opencode-zen)

Baseline verified clean (HEAD `b21499a`, tree clean, git identity `Greg T <me@gregthibodeaux.com>` present). Branches created: `hermes/round44d-trusted-art-hosts` (working) + `backup/pre-44d-trusted-art-hosts` (rollback). Full multi-model pipeline this round:

1. **Opus design packet** (`round44d-design-packet.md`, 31,658 bytes): scope, exclusions, 8 flagged ambiguities.
2. **deepseek-v4-pro spec-write** (`round44d.plan.md`, 40,150 bytes): 7 Tasks, 8 pre-flight discrepancies flagged (D1–D8 — dual-write target doesn't exist, fork isn't Showa-themed, FAQ.md does exist, `MAX_ART_HOSTS` behind `server-only`, `readonly string[]`, etc.).
3. **Qwen3.8 Max audit** (`round44d-audit-qwen.md`, 11,584 bytes): APPROVABLE — no must-fix code issues, 3 minor findings.
4. **Opus adjudication** (`round44d.approved.md`, 48,717 bytes): Minor A folded in (upstream's 3-line comment rewrite at agent-selection site), Minor B folded in (verify block hit-counts reworded from exact tallies to "at least N, all within the inserted region"), Minor C ratified (client-side cap drop is the right call — `server-only` constraint is real). FAQ.md ambiguity adjudicated skip. Design-packet errors caught by the audit (dual-write assumption, theming characterization, FAQ.md existence, console string paraphrase) documented for future packets.
5. **Hermes exec** on `hermes/round44d-trusted-art-hosts` (commit `82c0d11`): 7 files landed byte-exact first pass; Hermes filled `## Result` + `## Deviations` sections in the approved file.
6. **Opus merge + close** (this session): `2105774` merge, docs written, memory updated, task files archived, branches cleaned, push.

### Verification ladder (all green)

- Read-back: all seven files' diffs byte-exact against the approved spec
- Retirement audit: `isPlexArtUrl` = 0 hits in `src/**` and `_showa/**` code (the one pre-existing prose hit in `_showa/SESSION_HANDOFF.md` from the pre-close revision doesn't count; this session's rewrite retires it)
- Commit `82c0d11` to working branch (Greg's identity), merge `2105774` into main (`--no-ff`, matching 44a/44b convention)
- `docker compose up -d --build` — fresh build (source layer re-compiled, not cached); container Up (healthy)
- Typecheck exit 0; lint exit 0 (1 pre-existing unrelated `PEQ_RANGE` warning in `eq-response-curve.tsx`, a 44c EQ-cluster file — not touched by 44d)
- Health `GET :39446/api/health` → `{"ok":true}` (200), "Ready in 677ms"; no errors in container logs
- **Runtime smoke** live from UI: allowlist accepts syntactically valid entries (`192.168.1.7:32400` and `192.168.1.107:32400` both stored); wrong-but-valid entry (the `.1.7` typo) refused correctly at fetch time with exact `host:port` to add named in the log; corrected entry (`.1.107:32400`) fetches Plex art successfully

### Environment notes / drift found

- **44d verified the packet's characterization of `_showa/` was wrong for the settings tree.** `_showa/components/` contains only `dashboard/` and `ui/` — no `settings/` mirror. Confirmed at recon and during exec. Any future round touching a settings component is single-tree until we decide to promote a `_showa` settings skin.
- **44d also verified fork `settings-view.tsx` is NOT Showa-re-themed** — 0 hits for `font-display`/`tracking-[0.15em]`/faceplate/walnut/rust tokens. Upstream primitives (`Card`, `CardHeader`, `Field`, `Input`, `Button`, `Spinner`, `useToast`) land verbatim. The Showa styling has not touched Settings yet.
- **Docker compose service is `wiim-dashboard`, not `web`** (carried from 44b — the spec explicitly called this out; no re-drift).
- **`tsc`/`eslint` not in the runner image** (carried from 44b — host binaries via `./node_modules/.bin/`).
- **Runtime device smoke is auth-gated** (carried; Greg drives from the UI).
- **Refused-host console warning is the diagnostic entry point for blank-art issues.** Saved to `wiim-dashboard-verification` skill; future blank-art complaints go to `docker compose logs | grep "artwork host not allowed"` before any deeper investigation.

## Remaining close work

**None outstanding.** Everything below was completed this session:
- ✅ `--no-ff` merge into main (`2105774`)
- ✅ `_showa/README.md` changelog backfill through 44d (6 accumulated entries)
- ✅ `_showa/SESSION_HANDOFF.md` update (this doc)
- ✅ Memory updates: `ways-of-working.md` isPlexArtUrl line superseded, `overview.md` shim reference reframed
- ✅ Task-file archive move (`round44d.approved.md` + `round44d-audit-qwen.md` → `WIIM/archive/2026-09-16-round44d-trusted-art-hosts.*`)
- ✅ Configured Plex host recorded: `192.168.1.107:32400`
- ✅ Branch cleanup: `hermes/round44d-trusted-art-hosts` deleted; `backup/pre-44b-snapshot-batch` deleted; two backups preserved
- ✅ Push to `origin/main`

## Forward scope — standing candidates

1. **Round 44c (EQ cluster).** Now the primary next pipeline candidate. 12-band EQ, Off-band type picker, LP/HP filter types, `GetAcousticCapability`. High visual conflict risk with the fork's re-themed `eq-card.tsx` (Rounds 28/29/31) — will need a design packet that ground-truths the target file's Showa state before claiming re-theming scope (learned this from 44d's D2).
2. **Round 44e decision.** `6c8b37d` in-place IP edit — still deferred; low-cost, good calibration candidate if we want a lighter round between larger ones.
3. **Smoke Observation A (44a, carried):** UHD/Master/Qobuz-tier service-specific badge (WiiM Home app shows one; fork normalizes hi-res to "Hi-Res Lossless"). Re-check post-44b whether the upstream hi-res quality-tag mapping surfaces the tag distinctly in `StreamInfoLine`; if not, add a fork-specific `actualQuality`/`service` → badge mapping. Small standalone check-then-decide; not a full round.
4. **Smoke Observation B (44a) — display half open.** Post-44b hotfix (`dd96540`) resolved the transport half. Display half: fork's `detectService` intentionally filters CustomRadio via `INTERNAL_VENDOR_NAMES`, so the service band labels a CustomRadio stream as "Network" rather than "Radio". Design question, low priority — any label change should preserve the intentional-filter intent (inject "Radio" when vendor is `"CustomRadio"`, not surface "CustomRadio" itself). Folds naturally with item 5.
5. **Hide timeline / disable scrub on non-scrubbable sources (post-44b, fork enhancement).** Radio + Amazon-via-QPlay both hit `duration: 0`. Extend the timeline gate in `now-playing-card.tsx` to include `duration > 0`. Fork enhancement, single 2-file dual-write. Could fold in item 4's label half in one round.
6. **`HERMES_PREAMBLE_wiim-dashboard.md` fix** (44a, carried): WSL git-identity assertion — Hermes has not re-hit the staleness in the last few rounds, but the preamble should assert it. Historical cleanup.
7. **README changelog backfill — DONE this session.** ~~Missing entries...~~ Resolved through 44d.
8. **Upstream PR of `.env.example` TRUST_PROXY doc.** Standing. Not yet drafted.
9. **Companion `gthibo/wiim-universal-remote`.** Out of this repo's queue.
10. **EQ response curve deferred features.** Draggable nodes, potential Catmull-Rom → monotone cubic swap, row-letter contrast tuning. Feature-forward; will bundle naturally when we're back in `eq-response-curve.tsx`.
11. **`SECURITY.md` from upstream `7d99a97` (deferred by Greg during 44d).** Revisit as part of a future docs-reconciliation architectural round, alongside any other diverged docs (`CHANGELOG.md`, `docs/FAQ.md`).

## Canonical reference documents

Not tracked in this repo:

- `C:\Users\mrthi\Documents\WIIM\round44-upstream-recon-report.md` — authoritative recon
- `C:\Users\mrthi\Documents\WIIM\round44-regrouping.md` — Round 44 sub-round scope decisions
- `C:\Users\mrthi\Documents\WIIM\round44d-design-packet.md` — Opus design packet (44d)
- `C:\Users\mrthi\Documents\WIIM\archive\` — closed `.done`/`.approved`/`-audit` pairs (44a, 44b, 44d archived here)
- `C:\Users\mrthi\Documents\WIIM\workflow.md` — Hermes/Opus workflow contract
- `C:\Users\mrthi\Documents\WIIM\HERMES_PREAMBLE.md` / `HERMES_PREAMBLE_wiim-dashboard.md` — preambles (latter has the stale git-identity note, carried)
- `C:\Users\mrthi\Documents\WIIM\templates\plan-template.md` — task plan template

## Standing operational rules

Refer to project memory (`ways-of-working.md`). Updated this session: the `isPlexArtUrl` shim line was superseded to note its retirement in Round 44d; the `overview.md` shim reference was reframed as "was" language pointing at 44d.

---

## Previous round — Post-44b hotfix (landed 2026-09-16, merge `dd96540`)

Post-44b radio-transport hotfix: extended `isRadio` in `now-playing-card.tsx` with vendor-string branches (`vtuner`, `customradio`, `newtunein`) — Ultra 5.2.827567 lands vTuner and CustomRadio streams on `sourceMode: "10"` (not the 12/13 upstream's spec assumed) with `vendor: "vTuner"` and `vendor: "CustomRadio"` respectively. Vendor-string fallback fixes both without disturbing the fork's intentional `INTERNAL_VENDOR_NAMES` filter for "CustomRadio". Single 2-file dual-write, +28/−2, SHA `13F5F766…D951` in both trees. Smoke-passed live. Preserved via `backup/pre-radio-vendor-hotfix`. Full detail in the prior handoff revision (git history of this file).

## Previous round — Round 44b (landed 2026-09-16, merge `bb94ae4`)

Round 44b — snapshot batch + `c68c950` UI-layer subset — landed via kimi-k3 exec through the multi-model pipeline. 6 files, +231/−108: `constants.ts` (`MEDIA_SOURCE_KEYS` export), `parse.ts` (`bea000f` `deriveSource` prioritised match), `upnp.ts` (`0472b2b` DIDL-Lite `<res>` fallback), `ARCHITECTURE.md` (upnp.ts row + `fetchSoundCard` drift), `now-playing-card.tsx` (`isMediaSource`/`isPhysicalInput` refactor + hide-timeline-when-stopped, both trees). Passed static + hardware smoke. Full detail in the prior handoff revision (git history of this file) and the archived `round44b-*.md` files.
