# Showa Hi-Fi Counter — Session Handoff

*Updated end of session: September 14, 2026 (third session that day), after landing forward-scope items #1–4 in a single sitting: preamble amendments, `hermes/*` branch retention policy, orphan `_showa` cleanup, and the full e61b4b9 follow-on USB port (upstream e0db2ee + 2b78de1 + c272376). Supersedes all prior handoff content.*

## tl;dr for picking this back up

Four items closed. HEAD on `main` is `30198ef` (merge commit; parents
`7844cd0` + `b27b2f0`). Working tree clean. `origin/main` is 2 commits
behind (`30198ef` + `b27b2f0`) — push pending, Greg's action from
Windows PS (GCM cached). Container built with a fresh (non-cached)
image, healthy on port `39446`, `/api/health` returning `{"ok":true}`.
Live UX not yet Ultra-verified this session — build passed and greps
matched, but the DAC-name label, `available` roster, and coexist
sub-line have not been eyeballed against real hardware. Do that after
push.

`hermes/*` namespace is now empty by policy: this session codified
"delete on merge" in the root preamble and retroactively deleted all
four merged branches from prior sessions. Merge commits preserve tips
via second-parent, so anything a branch carried is still reachable via
`git log <merge-sha>^2`.

Third Hermes calibration data point at `tier: pro` on
`deepseek-v4-pro` (opencode-zen), verdict adequate. The USB follow-on
port required real fork-adaptation judgment (upstream targets
`<OutputCard>`; we render `<SourceOutputPanel>`), and Hermes caught a
plan omission (fork's `caps` is nullable → `caps?.outputCoexist`)
during typecheck. First Pro-tier data point on this fork; a second
Pro loop would consolidate.

Next: forward-scope items #1 (Round 44 recon report's 4-item
corrections list) and #2 (`39446 → 0.0.0.0` binding question) remain.
Nothing blocking in the tree.

## Live git state to verify at session open

    git log --oneline -6 main
    # expect:
    # 30198ef Merge hermes/usb-chain-followon into main
    # b27b2f0 Port USB output/coexist support: live sound-card roster, output-coexist mode, USB DAC label (upstream e0db2ee, 2b78de1, c272376)
    # 7844cd0 chore(_showa): remove orphan now-playing-card.tsx duplicate
    # 92d6e52 docs: session close 2026-09-14 (e61b4b9 USB output merged)
    # 61e3a43 Merge hermes/e61b4b9-usb-output into main
    # 3ec1233 feat(output): show & select USB output in the Output card (manual port of upstream e61b4b9)

    git status
    # expect: On branch main; working tree clean;
    #         Your branch is ahead of 'origin/main' by 2 commits.
    #         (unless Greg has pushed since — then: up to date with origin/main)

    git branch --list "hermes/*"
    # expect: empty (policy: delete on merge)

Confirm both merge commits (`30198ef`, `61e3a43`) exist and the tree is
clean before starting anything.

## Recent activity (this session)

### 1. Preamble amendments — applied

Four amendments across the two preambles + one to project memory:

- **`HERMES_PREAMBLE.md` § 2 (Git discipline):** added branch-retention
  bullet — `hermes/*` deleted post-merge; second-parent preserves the
  tip.
- **`HERMES_PREAMBLE.md` § 3 (Verification discipline):** added
  content-only line-count guard paragraph — `grep -c '^+[^+]'` /
  `'^-[^-]'` or `git show --stat`, not raw `^+` / `^-`. Referenced the
  e61b4b9 USB-output guard as the concrete triggering case.
- **`HERMES_PREAMBLE.md` § 5 (Tier signal):** added naming note —
  `tier:` is a ladder abstraction; confirmed mapping `tier: med` →
  `deepseek-v4-flash` at Med reasoning.
- **`HERMES_PREAMBLE_wiim-dashboard.md` Rule 2 (Docker):** replaced the
  "rerun with `--no-cache` immediately" bullet with the Compose v5
  quirk correction — `--no-cache` not accepted on `up --build`, use
  `docker compose build --no-cache && docker compose up -d`.
- **Project memory (`ways-of-working.md` § Git hygiene):** added the
  push-from-Windows-PS-not-WSL note + the branch-retention rule in a
  single bullet. Committed to memory only.

### 2. `hermes/*` branch retention policy — codified

"Delete on merge" chosen (simplest, no ref accumulation, merge commits
already preserve tips via second-parent). Codified in
`HERMES_PREAMBLE.md` § 2 alongside the naming convention. Retroactive
cleanup deleted four merged branches:
`hermes/5deb24e-cookie-secure`, `hermes/reconcile-now-playing-card-mirror`,
`hermes/8fe1f64-lyrics-nudge`, `hermes/e61b4b9-usb-output`. Handoff-noted:
the prior handoff had the cookie-secure branch name wrong
(`cookie-secure-cherry-pick` vs actual `5deb24e-cookie-secure`); silent
no-op on the first `git branch -d` attempt caught it.

### 3. Orphan `_showa/components/now-playing-card.tsx` — removed

Verified genuinely stale: single old commit (`88f4e7d "Small tweaks"`),
no imports reference the path (only self-reference was in the prior
handoff). Live copy at `_showa/components/dashboard/now-playing-card.tsx`
unaffected. Removed as commit `7844cd0` (1126 deletions, tracked file).

### 4. e61b4b9 follow-on USB port — full port, this session's main work

Recon → plan → Hermes → review → merge, one session.

- Plan / done: `C:\Users\mrthi\Documents\WIIM\archive\2026-09-14-usb-chain-followon.done.md`
- Port commit: `b27b2f0`, merged as `30198ef`.
- 9 files, +170/−22:
  - Data layer (src only): `constants.ts` (adds
    `OUTPUT_MODE_NAME_TO_HW` map), `commands.ts` (`fetchUsbDac` →
    `fetchSoundCard`; adds `fetchOutputCoexist`), `snapshot.ts` (rename
    + adds `availableOutputs` field), `capabilities.ts` (Promise.all
    3→4, adds `outputCoexist`), `types.ts` (adds `outputCoexist` on
    caps, `availableOutputs?` on snapshot).
  - UI (dual-write): `dashboard.tsx` × 2 (passes
    `available`/`coexist`), `source-output-panel.tsx` × 2 (adds
    `usbLabel()` helper, live-roster logic on `outputOptions`, coexist
    sub-line render).

**Fork adaptation:** upstream targeted `<OutputCard>` in `dashboard.tsx`;
our fork renders `<SourceOutputPanel>` (SHOWA re-skin, Rounds 21/25)
and `output-card.tsx` is orphaned. The port translated upstream's
OutputCard changes into SourceOutputPanel's structure. Explicitly out
of scope: `output-card.tsx` (kept stale), the `acoustic` field
(belongs to upstream `3107749`, not this port). Both flagged in the
plan and observed correctly by Hermes.

**Deviation of note:** Hermes caught a plan omission — this fork's
`caps` is `DeviceCapabilities | null` with an optional-chaining
convention, but the plan showed `coexist={caps.outputCoexist}`.
Typecheck flagged it; Hermes fixed to `caps?.outputCoexist` in both
trees. Real improvement over the plan text. Fold into planning
discipline: for prop-passing from a nullable object, check the fork's
existing convention before writing the exact prop expression.

**Plan-authoring bugs I caught (not Hermes's):** spec said `grep -c
'outputCoexist' capabilities.ts` = 3; substring grep actually gives 4
(import, destructure, Promise.all call, return field). Spec said "8
file paths" but named 9 unique files across 10 edits. Two spec-side
slips; neither affected the code. Next-time discipline: mentally
run each grep guard against a hypothetical fresh checkout before
committing the plan.

### Third Hermes calibration data point

Model: `deepseek-v4-pro` (opencode-zen). Tier `pro` in the plan;
Hermes's own adequacy call: `adequate`. Strain named by Hermes: one
null-safety line a subagent missed (`caps?.outputCoexist`), caught by
typecheck and fixed; plus three plan-authoring ambiguities (grep-guard
count, file-count 8-vs-9, `_showa` path handling), all resolved
without rework. First Pro-tier data point on this fork — treat as an
early signal, not a stable calibration; a second Pro loop would
consolidate.

The `.done.md`'s templated `model:` / `tier adequacy:` / `evidence:`
fields were not filled in at execution time — Hermes wrote a narrative
Result section instead. Supplied post-hoc via chat; the archived
`.done.md` was patched to include them. Hermes has committed to
populating those fields at execution time going forward.

### Push-from-Windows note — confirmed once more

Not exercised this session (nothing pushed), but the earlier finding
holds and is now codified in the wiim-dashboard preamble amendment +
project memory: `git push` from Windows PS with GCM, not from WSL.

## Forward scope — standing candidates

Trimmed to what's actually left after this session:

1. **Round 44 recon report's 4-item corrections list.** Noted at the
   end of `round44-upstream-recon-report.md`. Small factual fixes.
2. **Port `39446 → 0.0.0.0` binding question.** Deferred container
   network-exposure item from the 20260913-end handoff.
3. **Plan-authoring discipline.** Dry-run grep guards against a
   hypothetical fresh checkout before finalizing a plan; audit "N file
   paths" prose against the actual named files. Both bit this session.

## Canonical reference documents

Not tracked in this repo, don't get overwritten by round work:

- `C:\Users\mrthi\Documents\WIIM\round44-upstream-recon-report.md` —
  authoritative recon of v0.3.11..v0.3.17. Input for all Round 44+
  planning. Includes the "4 corrections" list.
- `C:\Users\mrthi\Documents\WIIM\workflow.md` — Hermes/Opus workflow
  contract, file-status transitions, preamble carrier.
- `C:\Users\mrthi\Documents\WIIM\HERMES_PREAMBLE.md` — root preamble
  (git discipline, verification, tier signal). Amended this session.
- `C:\Users\mrthi\Documents\WIIM\HERMES_PREAMBLE_wiim-dashboard.md` —
  project preamble (dual-write, Docker, line endings, identity,
  untracked files, tests). Amended this session.
- `C:\Users\mrthi\Documents\WIIM\templates\plan-template.md` — Hermes
  task plan template.
- `C:\Users\mrthi\Documents\WIIM\tasks\` — drafts + approved plans in
  flight. Empty at session close.
- `C:\Users\mrthi\Documents\WIIM\archive\` — closed `.done.md` +
  `-review.md` pairs, most recent at top. Now includes
  `2026-09-14-usb-chain-followon.done.md`.

## Standing operational rules

Refer to project memory for these (they are current and load-bearing):

- Session discipline, dual-write convention, edit-verification workflow,
  git hygiene (including push-from-Windows note and `hermes/*` deletion
  policy — added this session), merge strategy, AI agent roles, build /
  shell patterns, known pitfalls, Hermes task lifecycle archiving,
  planning discipline (insertion-point maps), and tools / paths — all
  live in `ways-of-working.md` under this project's memory.
- Purpose, design tokens, environment, and horizon items live in
  `overview.md`.

Do not restate these here — check memory each session so drift is
caught in one place.
