# Session Log

Dated entries, newest first. Purpose: let a fresh session (or a fresh person) pick up cleanly without re-deriving context or re-discovering the same problems. Keep entries factual and scoped to what happened + what's pending — design rationale belongs in `SOURCE-OF-TRUTH.md`, environment footguns belong in `GOTCHAS.md`.

---

## 2026-07-11 — Ringer setup + first real feature batch

**Environment set up.** Ringer (verified-swarm orchestrator) installed and running from WSL2 Ubuntu (native Windows isn't supported — see `GOTCHAS.md`). Two worker lanes proven: Codex (free ChatGPT tier — thin quota, treat as occasional not default) and OpenCode+OpenRouter (primary lane going forward — cheap, reliable, not tied to any subscription already at capacity).

**Shipped, all verified against the real repo:**
- Installable desktop PWA shell — `src/app/manifest.ts`, `public/sw.js`, `src/components/pwa-register.tsx`, wired into `src/app/layout.tsx`. Desktop-installable via Chrome/Edge; no mobile-responsive work (out of scope this round, not a hard rule).
- Wake-alarm timer — `src/lib/alarm/timer.ts`, `src/app/api/devices/[id]/alarm/route.ts`, `src/components/dashboard/alarm-button.tsx`, wired into `now-playing-card.tsx`. Mirrors the existing sleep-timer pattern. **Known follow-up**: `AlarmButton` gets `firesAt` from its own separate fetch on mount rather than the shared 3s snapshot poll `SleepButton` uses — works, but won't live-update the same way. In-memory only, does not survive a server restart (documented limitation, same as sleep timer).
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
- Multiroom feature build (research is done, ready to scope into a manifest).
- Next session should start fresh — this one has served its purpose.
