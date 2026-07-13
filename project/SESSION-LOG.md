# Session Log

Dated entries, newest first. Purpose: let a fresh session (or a fresh person) pick up cleanly without re-deriving context or re-discovering the same problems. Keep entries factual and scoped to what happened + what's pending — design rationale belongs in `SOURCE-OF-TRUTH.md`, environment footguns belong in `GOTCHAS.md`.

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
