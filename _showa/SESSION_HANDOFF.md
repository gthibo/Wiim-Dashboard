# Showa Hi-Fi Counter — Session Handoff

*Updated end of session: September 15, 2026 (planning-only session, no code changes).
Round 44+ regrouping (step 3 of upstream sync pipeline) completed. Supersedes all prior handoff content.*

## tl;dr for picking this back up

Round 44+ regrouping is done. Two out-of-repo docs produced:

- `C:\Users\mrthi\Documents\WIIM\round44-regrouping.md` — aggregate plan for sub-rounds 44a–44f, banks Q1/Q2/Q4 decisions
- `C:\Users\mrthi\Documents\WIIM\round44a-design-packet.md` — tight standalone design packet for the multi-model spec pipeline handoff (Opus design packet → Kimi K3 spec-write → Qwen3.8 Max audit → Opus adjudicate → Hermes exec)

Live git state UNCHANGED from this session's open: HEAD `3b7f1fa` on `main`, working tree clean, `hermes/*` empty. No fork commits this session — all work is documentation, out-of-repo (except this handoff update, if committed).

Real next work: courier `round44a-design-packet.md` to Hermes, kick off Kimi K3 (or deepseek-v4-pro) spec-write producing `C:\Users\mrthi\Documents\WIIM\tasks\round44a.plan.md`. Then adjudicate the returned plan when Hermes hands back.

## Live git state to verify at session open

    git log --oneline -3 main
    # expect (pre-close-commit):
    # 3b7f1fa docs: session close 2026-09-14 (recon addendum + TRUST_PROXY doc improvement)
    # 7c5de53 docs(env.example): clarify TRUST_PROXY behavior for direct-LAN deployments
    # 1bb0563 docs: handoff addendum - Hermes model/tier/evidence populated post-hoc

    git status
    # expect: On branch main; working tree clean; up to date with origin/main
    # (unless this session's own close doc has landed on top)

    git branch --list "hermes/*"
    # expect: empty

## Recent activity (this session)

### 1. Round 44+ regrouping — three decisions banked

Walked through the three still-open Open Questions from the recon report + Sept 14 corrections addendum:

**Q1 — c68c950 extraction strategy:** hand-extract wanted pieces file-by-file (recon's recommendation), rejecting cherry-pick-plus-revert (mixes conflict resolution with hunk selection) and skip-entirely (blocks the snapshot batch). Refinement: split extraction into **data-layer (Round 44a)** and **UI-layer (folded into Round 44b with 6e5c6af)**. Data-layer is src/-only, no dual-write; UI-layer bundles with 6e5c6af because both touch now-playing-card.tsx for the same conceptual reason.

**Q2 — isPlexArtUrl retirement via 7d99a97:** retire the FORK DELTA shim in the same round we adopt 7d99a97 (Round 44d). One mechanism. Migration path: manual add via Settings UI on first launch. No env-var bootstrap. No empty-allowlist banner. `ways-of-working.md` must be updated post-merge to supersede the shim's "load-bearing" note.

**Q4 — 9ca026e naming split:** Path A — adopt upstream naming faithfully. `PEQ_LETTERS` = a–l post-merge, `PEQ_LETTERS_BASELINE` = a–j, retire `PEQ_LETTERS_ALL`. Use `peqLettersFrom(caps.eqBandCount)` dynamically in `eq-response.ts`. `BAND_COLORS` rust fallback for k/l bands accepted; explicit colors deferred as visual polish.

### 2. Sub-round shape — 44a through 44f

Documented in `round44-regrouping.md`:

- **44a:** c68c950 data-layer extraction (parse.ts, commands.ts, upnp.ts, snapshot.ts, types.ts); src/-only, no dual-write; explicit exclusions Headphone EQ (→44f) and amp Speaker (hard skip). Unblocks 44b.
- **44b:** snapshot batch (bea000f + 0472b2b + 6e5c6af) + c68c950 UI-layer folded in; dual-write on now-playing-card.tsx.
- **44c:** EQ cluster (3107749 → 9ca026e → e7b55f2); dual-write on eq-card.tsx; e7b55f2 re-implemented, not cherry-picked. Independent of 44a/44b.
- **44d:** 7d99a97 trusted artwork hosts + isPlexArtUrl retirement in one commit; dual-write on settings-view.tsx. Fully standalone.
- **44e (deferred):** 6c8b37d in-place IP edit — Greg deferred this session, revisit later if desired.
- **44f (contingent):** Headphone EQ tab pickup, contingent on Greg deciding to use Ultra's headphone jack (not currently used — Ultra placement across the room).

Sequencing: 44a → 44b linear (blocking dep); 44c and 44d fully independent. Suggested order 44a → 44b → 44c → 44d.

### 3. Spec workflow — multi-model pipeline adopted for 44a and 44d

Per Perplexity's pipeline recommendation, adapted to fork's workflow contract:

    Opus design packet → Kimi K3 (or deepseek-v4-pro) spec-write
    → Qwen3.8 Max audit → Opus adjudicate → Hermes exec

Adopted for 44a and 44d specifically (highest-stakes rounds — 44a has genuine ambiguity around c68c950 extraction scope with FORK DELTA reasoning; 44d has security-adjacent architectural work with shim retirement + DB migration + settings UI).

44b and 44c stay Sonnet-spec-in-chat as calibration signal on the pipeline. 44e is a Hermes-spec candidate if adopted later.

**Calibration rule:** if 44a's pipeline run exposes friction (spec-writer misses, auditor false-positives, adjudication burden), roll back to Sonnet-spec-in-chat for 44b/c/d. If clean, expand.

### 4. Corrections to the Perplexity pipeline framing

Two Greg-supplied corrections shaped the pipeline decision:

- Hermes has access to pro-tier models (deepseek-v4-pro executed the last round flawlessly), not just flash-tier. Kimi K3 and Kimi K2.7-coding also available. This voided the initial "flash-tier ceiling" objection to Hermes-spec.
- Ultra has a headphone jack (contra my initial assumption). Headphone EQ moved from "hard skip" to "deferred to Round 44f, contingent on Greg using it" — Greg doesn't currently use it (Ultra placement across the room), so 44f remains unscheduled but documented as a pickup path.

## Forward scope — standing candidates

Ordered by priority for next session:

1. **44a spec-write pipeline run.** Courier `round44a-design-packet.md` to Hermes, kick off Kimi K3 (or deepseek-v4-pro) spec-write producing `C:\Users\mrthi\Documents\WIIM\tasks\round44a.plan.md`. Qwen3.8 Max audit. Opus adjudicates. Hermes executes. This is the main line.

2. **Round 44e decision revisit.** Greg deferred 6c8b37d (in-place IP edit) this session. Small clean 75-line cherry-pick against an unforked file, good Hermes-spec calibration candidate if adopted. Revisit before or after 44a is done.

3. **Upstream PR of `.env.example` TRUST_PROXY doc improvement.** Still standing from prior session. Same change as `7c5de53`, filed against `illianoaoi/Wiim-Dashboard`. Community-friendly, low-risk, not urgent.

4. **Hardware verification of USB port work on Ultra.** Still pending DAC reconnect (was deferred prior session, no update this session).

5. **Companion project `gthibo/wiim-universal-remote`.** Open work per overview.md. Not part of this repo's queue.

6. **EQ response curve deferred features.** Draggable nodes (coordinate inverses already in eq-response.ts), potential Catmull-Rom to monotone cubic swap, row-letter contrast tuning on tan panel background. Feature-forward not sync-forward.

### README changelog gaps — still flagged, still not backfilled

`_showa/README.md` changelog still stops at "Post Round 44 — 8fe1f64 lyrics-nudge manual port." Missing entries carried from prior session (post-Round-44 `e61b4b9` USB output, USB chain follow-on `b27b2f0`, `.env.example` TRUST_PROXY doc). This session did not touch code, so no new gaps to add. Backfill remains a next-session call.

## Canonical reference documents

Not tracked in this repo:

- `C:\Users\mrthi\Documents\WIIM\round44-upstream-recon-report.md` — authoritative recon of v0.3.11..v0.3.17 with Sept 14 corrections addendum
- `C:\Users\mrthi\Documents\WIIM\round44-regrouping.md` — **NEW this session** — aggregate Round 44 sub-round plan with Q1/Q2/Q4 decisions
- `C:\Users\mrthi\Documents\WIIM\round44a-design-packet.md` — **NEW this session** — tight standalone for pipeline handoff, targets `tasks\round44a.plan.md` as spec-write output
- `C:\Users\mrthi\Documents\WIIM\workflow.md` — Hermes/Opus workflow contract
- `C:\Users\mrthi\Documents\WIIM\HERMES_PREAMBLE.md` — root preamble
- `C:\Users\mrthi\Documents\WIIM\HERMES_PREAMBLE_wiim-dashboard.md` — project preamble
- `C:\Users\mrthi\Documents\WIIM\templates\plan-template.md` — Hermes task plan template
- `C:\Users\mrthi\Documents\WIIM\tasks\` — target for round44a.plan.md when Kimi K3 produces it (empty at session close)
- `C:\Users\mrthi\Documents\WIIM\archive\` — closed `.done.md` + `-review.md` pairs

## Standing operational rules

Refer to project memory (`ways-of-working.md`) — unchanged this session.
