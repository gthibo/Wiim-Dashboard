# Session Log

Dated entries, newest first. Purpose: let a fresh session (or a fresh person) pick up cleanly without re-deriving context or re-discovering the same problems. Keep entries factual and scoped to what happened + what's pending — design rationale belongs in `SOURCE-OF-TRUTH.md`, environment footguns belong in `GOTCHAS.md`.

---

## 2026-07-13 — Multiroom bug fixes + relocate into Device panel (implemented)

**Context:** live-tested multiroom on real hardware (WiiM Pro fw 4.8, WiiM Ultra fw 5.2, wmrm 4.3). Found and fixed three real bugs (see `GOTCHAS.md` for the field-shape details): role/master-IP detection relied on a `multiroom` object `getStatusEx` never sends on this firmware (fixed via top-level `master_ip`/`master_uuid` + a new `multiroom:getSlaveList` call); group mute and group volume's broadcast commands (`setPlayerCmd:slave_mute`/`slave_vol`) are accepted but no-op on this hardware — switched both to the confirmed-working per-slave targeted commands (`multiroom:SlaveMute:<ip>:<0|1>`, `multiroom:SlaveVolume:<ip>:<n>`). All of join/leave/kick/group-mute/group-volume now verified working live. One reported bug (leaving a group once stopped the master's playback) did not reproduce across two independent retests and is not fixed — documented as unreproducible, not silently dropped.

**Now planned:** relocate all three multiroom states (solo/slave/master) from the standalone `multiroom-card.tsx` into the DEVICE column of `source-output-panel.tsx` (`DeviceSection`), between the Add/Settings/Logout action tiles and the existing Model/Firmware/IP info rows (own leading/trailing divider, same recipe as the existing one). Visibility gate unchanged: only renders when `devices.length >= 2`.

- **Solo:** one line, "Standalone" + compact "Join group…" dropdown (unchanged interaction, restyled to the column's faceplate/glass palette).
- **Slave:** one line, "Following **Name**" + a small "Leave" button.
- **Master:** one compact row per slave (name + "Kick"), then one combined row mirroring the now-playing card's transport-row layout (icon-button | slider | numeric value): a new 1.5rem power-graphic mute button (`power-btn.png`/`power-off-overlay.png`, muted = off-look per confirmed mapping) + the shared `Slider` component (`variant="volume"`, same styling as now-playing's volume slider) + numeric readout.
- No dedicated "Multiroom" header row (kept compact per user request — it's a Device subsection, not a new top-level section like Source/Output).
- `deviceId` and `onChanged` get threaded one level down into `DeviceSection` (both already exist in `SourceOutputPanel`); `role`/`masterIp`/`slaves` read directly off the already-passed `info` prop (`DeviceInfo` already carries all three) — no other new props needed.
- `multiroom-card.tsx` is left on disk, unreferenced (its standalone usage removed from `dashboard.tsx`) — same convention already used for `device-info-card.tsx`/`source-card.tsx`/`output-card.tsx`; the "absorbed" note goes in `source-output-panel.tsx`'s existing top-of-file comment, not in the orphaned file itself (matching how those three are documented).

**Status:** implemented, live-verified against real devices (correct role/master display, Kick, group mute, group volume all confirmed working), and polished per follow-up feedback: Kick/Leave recolored to `--primary` (rust), the mute+volume row given `mt-8` spacing (was inheriting `space-y-3`'s 0.75rem), a "Group Volume" label added below the slider, "Following:" given a colon + spacing, slave rows prefixed "Connected:". Also fixed a real bug found during polish: the volume slider always initialized to a hardcoded 50 (not synced to the actual device), now initialized and kept synced from `multiroom:getSlaveList`'s per-slave `volume`/`mute` fields (with a drag-guard, same pattern as the now-playing card's own volume sync). Committed across three commits (protocol fixes, UI relocation, docs) and pushed to `origin main`.

---

## 2026-07-13 — ESLint setup

**Context:** this repo has never had an ESLint config (see `GOTCHAS.md`'s 2026-07-11/12 entries) — `next lint` hit an interactive "how do you want to configure ESLint?" wizard that couldn't run non-interactively, so `npm run lint` was effectively dead. User asked to close this gap after wrapping up multiroom.

**Done:** installed `eslint` + `eslint-config-next@15.5.4`, added `eslint.config.mjs` (flat config, `next/core-web-vitals` + `next/typescript` via `FlatCompat`), excluding `_showa/` (already excluded from TypeScript itself, per `tsconfig.json`) and the auto-generated `next-env.d.ts`. Ran it against the whole real codebase for the first time ever: only 4 warnings, 0 errors — genuinely clean given the codebase's history. Fixed all four: an anonymous default export in `postcss.config.mjs`, an unused `PEQ_LETTERS` import in the EQ route, a truly-dead `hasDuration` prop threaded through `CubbyArt` in `now-playing-card.tsx` (removed from the prop type/destructure/call site, not just the lint warning), and a stale `eslint-disable-next-line react-hooks/exhaustive-deps` comment in `marquee-text.tsx` that no longer suppressed anything.

Also switched `package.json`'s `lint` script from `next lint` (deprecated, removed in Next.js 16 — it printed the deprecation notice itself) to plain `eslint .`, and added `npm run lint` to the documented pre-PR check in both `CONTRIBUTING.md` and `README.md` (was `typecheck && build` only).

**Verified:** `npm run lint` (well, direct `eslint .` — see Windows/npm-shim gotcha in `GOTCHAS.md`) passes with zero warnings; a full Docker build also passes, confirming ESLint running for the first time inside `next build` doesn't break anything.

**Status:** implemented, verified via typecheck + real Docker build. Not yet committed.

**Context:** the 2026-07-11 fork-governance premise ("upstream unresponsive 3+ weeks") was found to be wrong when checked against GitHub directly — illianoaoi landed the SSRF fix same-day back on 2026-06-19 (credited user as co-author), and fixed three more user-reported issues on 2026-07-13 (lyrics lookup, subwoofer false-positive, parametric EQ L/R), each with a thank-you comment. Upstream is actively maintained. `SOURCE-OF-TRUTH.md`'s fork-governance section and the corresponding memory were corrected same day. This changes the README's framing from "independent fork because upstream went quiet" to "active fork of an active project."

**Plan (approved by user 2026-07-13, section by section):**
1. **Opening/identity:** keep "Showa Hi-Fi Counter" and the hi-fi visual hook as the header. Replace "Same functionality... all credit goes to illianoaoi" with framing as a hi-fi-styled fork of the actively-maintained WiiM Dashboard, adding multiroom, wake-alarm, and an installable PWA on top of upstream's core. One-line "forked from illianoaoi/Wiim-Dashboard (MIT)" near the top, not the dominant message.
2. **Feature list:** merge the fork's short "what's different" bullets and upstream's full feature table into one unified table. Fork's real additions (Multiroom, Wake-alarm timer, Installable PWA) become regular rows, not a separate "extras" section. Drop the subwoofer false-positive bug-fix claim — upstream fixed that themselves (issue #6), no longer this fork's differentiator.
3. **Install instructions + CONTRIBUTING.md:** fix `git clone` / `docker run` examples to point at `gthibo/Wiim-Dashboard` / `ghcr.io/gthibo/wiim-dashboard` (matches the corrected registry in `SOURCE-OF-TRUTH.md`). Same fix in `CONTRIBUTING.md`'s clone URL; remove the leftover `git config user.name "illiano"` instruction (copy-paste artifact from upstream's CONTRIBUTING.md).
4. **Credits/License/footer:** License & Credits section credits illianoaoi warmly and specifically (original architecture, device integration, active ongoing maintenance) alongside the MIT license. Drop the "Vibe coding by illiano" footer and the GitHub Sponsors link (currently points only to illianoaoi) — no replacement support link for now since the user doesn't have one set up yet; can add later.

**Status:** implemented. `README.md` restructured into one unified doc (merged feature table, corrected clone URL/GHCR image/CI badge to `gthibo/Wiim-Dashboard`, rewritten opening + License & credits, dropped the Sponsors/footer section, added Multiroom/Wake-alarm/Installable-app rows and a Multiroom troubleshooting entry). `CONTRIBUTING.md` clone URL fixed and the leftover `git config user.name "illiano"` instruction removed. Old unskinned upstream screenshots (embedded from the previously-quoted original README) were dropped as part of the merge — the walnut re-skin screenshots at the top now represent the app's actual current look, and keeping both was inconsistent. Not yet committed — pending user review.

---

## 2026-07-11 — Ringer setup + first real feature batch

**Environment set up.** Ringer (verified-swarm orchestrator) installed and running from WSL2 Ubuntu (native Windows isn't supported — see `GOTCHAS.md`). Two worker lanes proven: Codex (free ChatGPT tier — thin quota, treat as occasional not default) and OpenCode+OpenRouter (primary lane going forward — cheap, reliable, not tied to any subscription already at capacity).

**Shipped, all verified against the real repo:**
- Installable desktop PWA shell — `src/app/manifest.ts`, `public/sw.js`, `src/components/pwa-register.tsx`, wired into `src/app/layout.tsx`. Desktop-installable via Chrome/Edge; no mobile-responsive work (out of scope this round, not a hard rule).
- Wake-alarm timer — `src/lib/alarm/timer.ts`, `src/app/api/devices/[id]/alarm/route.ts`, `src/components/dashboard/alarm-button.tsx`, wired into `now-playing-card.tsx`. Mirrors the existing sleep-timer pattern. **Known follow-up**: `AlarmButton` gets `firesAt` from its own separate fetch on mount rather than the shared 3s snapshot poll `SleepButton` uses — works, but won't live-update the same way. In-memory only, does not survive a server restart (documented limitation, same as sleep timer). **Verification caveat**: this task's Codex attempts both failed instantly on the quota wall (see GOTCHAS.md), so this code was never actually run through Ringer's automated check. It was recovered from `git stash` (an earlier interrupted attempt) and verified with a manual, independently-run `npm run build` instead — same code, but not swarm-verified the way pwa-shell/release-fix-and-unraid were.
- Release pipeline fix — `.github/workflows/release.yml`, `proxmox/install.sh`, `docs/EASY-INSTALL.md` all corrected from the stale `illianoaoi/wiim-dashboard` image path to `gthibo/wiim-dashboard` (GHCR) / `mrthibsog/wiim-dashboard` (Docker Hub, dormant until secrets are added).
- Unraid Community Applications template — new `unraid/wiim-dashboard.xml`.
- `docs/API-CAPABILITY-RESEARCH.md` — deep research into LinkPlay/WiiM API capabilities not yet implemented (multiroom/group sync, NAS/local-media, third-party service control), sourced from python-linkplay and pywiim. **Recommendation: multiroom next** — strongest evidence, highest user value.

**All four tasks' changes currently sit uncommitted in the working tree** — not committed yet, pending your review/testing.

**Decisions made this session:**
- Fork governance: proceeding independently of unresponsive upstream. Full detail in `SOURCE-OF-TRUTH.md`.
- Docker Hub username confirmed as `mrthibsog` (separate from GitHub username `gthibo`).
- This `project/` doc set created; historical design-phase context (color tokens, control philosophy, original scope) lives in the user's Open-Brain (topic: "WiiM Dashboard", captured 2026-06-19) — condensed into `SOURCE-OF-TRUTH.md`, full detail stays in Open-Brain. Bridging update captured back to Open-Brain this session connecting the original build phase to this feature-expansion phase.

**Also done this session:** `DOCKERHUB_USERNAME`/`DOCKERHUB_TOKEN` GitHub repo secrets added (Read & Write scope) — Docker Hub publishing is now active, will mirror on the next version-tag push.

**Also done:** all four tasks' diffs reviewed and committed as 5 separate commits (PWA shell, alarm timer, release-path fix + Unraid template, research doc, project docs). `./ringer.py install-agent` run — but note it installs into WSL's own Claude Code config (`~/.claude` on the Linux side), not Windows-side Claude Code (`C:\Users\mrthi\.claude`), which is what this orchestrator session actually runs as. Manually replicated the skill file and hooks to the Windows-side config. Hit and fixed a real gotcha doing this — see GOTCHAS.md ("Windows-side Ringer hooks need MSYS_NO_PATHCONV=1").

**Pending / next up:**
- README repositioning for community-facing framing (good candidate for a future Ringer swarm round).
- Next session should start fresh — this one has served its purpose.

---

## 2026-07-11/12 — Multiroom feature build

**Shipped, swarm-verified, currently uncommitted pending your review/live-device test:**
- Multiroom / group-sync support — `src/lib/wiim/constants.ts` (command strings), `src/lib/wiim/types.ts` + `parse.ts` (role/master/slaves derived from the existing `getStatusEx` poll, zero extra HTTP calls), `src/lib/wiim/multiroom.ts` (new: joinGroup/leaveGroup/kickSlave/setGroupVolume/setGroupMute), `src/app/api/devices/[id]/multiroom/route.ts` (new POST route), `src/components/dashboard/multiroom-card.tsx` (new UI card), wired additively into `dashboard.tsx`. Passed real `npm run typecheck` + `npm run build` (not just the worker's self-report — independently re-verified).
- **Every multiroom command is flagged `needs testing`** in code — no test hardware was available for the underlying research (`docs/API-CAPABILITY-RESEARCH.md`). You have 2+ real WiiM devices; testing join/leave/kick/group-volume/group-mute live is the natural next step before this ships to end users.
- Known open question worth testing first: `leaveGroup` tries `multiroom:Ungroup` (capital U) then falls back to lowercase `multiroom:ungroup` if rejected — the two source libraries disagree on casing.

**Rocky path to get here (all now documented in GOTCHAS.md so it doesn't repeat):** Codex free-tier quota was fully exhausted (hit twice, same "try again Aug 9" wall — see GOTCHAS.md), so this ran on OpenCode+GLM 5.2 instead. Along the way: a stuck-process kill left two workers briefly racing on the same files (no corruption, but caught late), a laptop sleep interrupted a background run, an `npm run lint` gate turned out to be unwinnable (repo has no ESLint config, ever — pre-existing gap, not addressed this round), and a worker `git restore`'d two unrelated project-doc files mid-task (recovered, and specs now hard-forbid any git write command outside owned paths). Final clean pass: first-try pass, ~13 minutes, GLM 5.2.

**Pending / next up:**
- Live-test the multiroom feature against your 2 real WiiM devices (join/leave/kick/group-volume/group-mute) — everything is `needs testing`.
- Set up a working ESLint config for this repo at some point (out of scope this round; `npm run lint` currently can't run non-interactively at all).
- Decide whether/when to commit the multiroom changes.
