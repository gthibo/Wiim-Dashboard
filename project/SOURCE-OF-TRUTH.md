# Source of Truth

Living record of what this fork is, why it exists, and the decisions that got it here. `ARCHITECTURE.md` (repo root) covers the codebase's technical shape; this file covers project-level decisions that aren't derivable from reading code.

## What this project is

**Showa Hi-Fi Counter** — a personal fork of [illianoaoi/Wiim-Dashboard](https://github.com/illianoaoi/Wiim-Dashboard), re-skinned as a piece of physical hi-fi hardware translated into software, now expanding with new features. Repo: [gthibo/Wiim-Dashboard](https://github.com/gthibo/Wiim-Dashboard).

Note on lineage: the original functional-scope audit (see Design origin below) referenced [cvdlinden/wiim-httpapi](https://github.com/cvdlinden/wiim-httpapi) as feature/API-documentation reference material. The actual forked codebase — Next.js App Router, matching the intended stack — is illianoaoi/Wiim-Dashboard, a different project. Don't confuse the two when tracing history.

## Fork governance (decided 2026-07-11)

Upstream (illianoaoi/Wiim-Dashboard) has been unresponsive for 3+ weeks — no tickets addressed since the first submission (~2026-06-20), and no response to attempts to discuss merging a submitted SSRF security fix (branch `fix/ssrf-album-art-presets`, still unmerged upstream). Decision: **proceed independently.**

- Keep filing upstream PRs for security issues/bugs as courtesy — don't block this fork's releases on their acceptance.
- Keep an eye on upstream for genuine core-API fixes worth manually pulling in (diverging means no automatic sync).
- Reposition the README — it currently frames this as "just a re-skin, all credit to original," which undersells real feature divergence. Goal: make this fork discoverable and credible as its own actively-maintained project.
- Intent: offer this to the broader WiiM user community, not keep it personal-use-only.
- Base project is MIT-licensed — no obligation to upstream anything to keep shipping independently.

## Publishing / deployment

- **GHCR** (primary): `ghcr.io/gthibo/wiim-dashboard` — fixed 2026-07-10 (was incorrectly still pointing at `ghcr.io/illianoaoi/wiim-dashboard`, copied verbatim from upstream and never repointed).
- **Docker Hub** (optional mirror): `docker.io/mrthibsog/wiim-dashboard`. `DOCKERHUB_USERNAME`/`DOCKERHUB_TOKEN` (Read & Write scope) added as GitHub repo secrets on gthibo/Wiim-Dashboard 2026-07-11 — active, will mirror on the next version-tag push (`./scripts/release.sh patch`).
- **Unraid**: one-click Community Applications template at `unraid/wiim-dashboard.xml`, points at the corrected GHCR image.
- **Proxmox**: `proxmox/install.sh`, same corrected image reference.

## Design origin (captured 2026-06-19, original build phase)

Full history lives in the user's Open-Brain (topic: "WiiM Dashboard") — this is a condensed pointer, not a replacement.

- **Design thesis**: Rams/Loewy hi-fi control panel aesthetic (real-feeling sliders, dark-walnut cabinet body, sharp rectilinear edges, low-contrast matte controls) combined with a 1960s–80s Japanese/jazz graphic design voice confined to the now-playing display and small iconographic marks. References: Braun RT 20, Harman/Kardon Citation series (object language); Blue Note/CTI/Atlantic jazz cover art (graphic language).
- **Color tokens (locked v2)**: Walnut `#3B2306` (bg) · Walnut Dark `#2A1804` (gradient edge/niches) · Faceplate `#E8E1D3` · Faceplate Dim `#DCD3C2` · Rust `#B3441E` (primary accent, active/play states only) · Tape Teal `#2E7D7A` (secondary accent, EQ/now-playing pulse) · Velvet `#7A2424` (mute/error only, never decorative) · Static `#1C1A17` (body text). Walnut+Faceplate ≈ 90% of every screen.
- **Control philosophy**: sliders not dials (lower build complexity, best mood-board reference used sliders); no rounded corners on hardware-style controls; squared transport keys not circular play/pause; source/output selection stays low-prominence, expands on interaction rather than an always-visible button wall.
- **Original functional scope** (from auditing wiim-httpapi's feature set): playback transport, presets grid with artwork, 10-band graphic EQ with named presets, source/output selection, sub-out controls, device diagnostics.
- **Original parking lot (explicitly out of scope in the initial PRD)**: multi-room/group playback, deep alarm configuration. **Both are now being picked up** — alarm shipped 2026-07-10 (`src/lib/alarm/`), multiroom is researched and scoped (`docs/API-CAPABILITY-RESEARCH.md`) as the next feature to build.
- **Original workflow**: feature spec + initial design language done with Gemini/NotebookLM, iterated with Claude. As of 2026-07, active development runs through Claude Code + Ringer (verified worker swarms) instead.

## Current feature-expansion tracking

See `SESSION-LOG.md` for the working log and `../docs/API-CAPABILITY-RESEARCH.md` for the multiroom/NAS/service-integration research backing the next round of feature work.
