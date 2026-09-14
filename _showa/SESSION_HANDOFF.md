# Showa Hi-Fi Counter — Session Handoff

*Updated end of session: September 14, 2026 (second session that day), after merging the e61b4b9 USB-output manual port, pushing main, and confirming live UX on the Ultra. Supersedes all prior handoff content.*

## tl;dr for picking this back up

The e61b4b9 USB-output manual port is merged, pushed, and live. HEAD on
`main` is `61e3a43` (merge commit; parents `10f69a5` + `3ec1233`).
Working tree clean. `origin/main` caught up (no unpushed commits).
Container running fresh image built with `--no-cache`, healthy. Greg
confirmed the USB entry visible in the Output card against a real Ultra
with a USB DAC connected.

Second Hermes calibration loop closed on `deepseek-v4-flash` at Med
reasoning — "adequate" verdict for the second time, on strictly-easier
work than the lyrics-nudge port. Consistent signal that V4 Flash Med has
headroom on mechanical ports of this size class.

Next: pick from the forward-scope list below. The natural next port
target is the follow-on USB output work upstream — `available` /
`usbDac` / `outputNames` / `coexist` — that layered on after `e61b4b9`.

## Live git state to verify at session open

    git log --oneline -5 main
    # expect:
    # 61e3a43 Merge hermes/e61b4b9-usb-output into main
    # 3ec1233 feat(output): show & select USB output in the Output card (manual port of upstream e61b4b9)
    # 10f69a5 git add _showa/SESSION_HANDOFF.md _showa/README.md && git commit -m "docs: session close 2026-09-14"
    # 660f929 Merge hermes/8fe1f64-lyrics-nudge into main
    # bcc6d23 feat(lyrics): per-track timing nudge (manual port of upstream 8fe1f64)

    git status
    # expect: On branch main; working tree clean; up to date with origin/main

Confirm the merge commit `61e3a43` exists and the tree is clean before
starting anything.

## Recent activity (this session)

### Backup gap closed — push `main` to `origin/main`

12 unpushed commits (accumulated since Round 43) pushed cleanly.
`10f69a5..61e3a43` now on `origin/main` at session end.

Learned: `git push` from within WSL hangs on the username prompt
(no credential helper configured in the WSL git); run from Windows
PowerShell where Git Credential Manager (`credential.helper = manager`)
is set up and cached. Worth codifying in the preamble if this recurs.

### e61b4b9 USB-output manual port (this session's main work)

Recon → plan → Hermes → runtime-confirm → merge → push, one session.
Manual port of upstream `e61b4b9` ("show & select USB output in the
Output card", GitHub issue #11).

- Plan / done: `C:\Users\mrthi\Documents\WIIM\archive\2026-09-14-e61b4b9-usb-output.done.md`
- Port commit: `3ec1233`, merged as `61e3a43`.
- Three src/ files, +10/−1: `src/lib/wiim/constants.ts` (OUTPUTS gains
  id 8 = USB), `src/lib/wiim/capabilities.ts` (4-line `curHw` fallback
  inside `outputSwitch` block), `src/components/dashboard/output-card.tsx`
  (`const ids` binding folds live current output into render list).
- No `_showa/` mirror needed — `output-card.tsx` is shared UI without a
  Showa fork; the other two are data-layer (src/-only by policy).

**Deviation of note:** Hermes flagged a planning-side bug in the task-4
verification guard. The plan called for
`git diff -U0 <file> | grep -c "^+"` to equal 5 and `"^-"` to equal 1
(net +5/−1 on the file). Those grep patterns also match `git diff`'s
`+++ b/…` / `--- a/…` file-header lines, so the actual counts came back
6/2. Hermes correctly re-ran with `grep -c '^+[^+]'` / `'^-[^-]'` to
exclude headers, got the intended 5/1, and reported the mis-specified
guard as a deviation. `git show --stat` also confirmed 10 insertions,
1 deletion, which was the plan's real intent. Fold this into planning
discipline: for line-count guards, use content-only grep patterns, or
better, use `git show --stat` / `git diff --numstat` on the specific
file. Filed under forward-scope preamble amendments.

**Build note:** `docker compose up -d --build` from Hermes ran cleanly
without CACHED builder layers this time — no `--no-cache` needed. The
"CACHED = didn't compile" trap remains a known hazard but did not
trigger here.

### Second Hermes calibration loop

Model: `deepseek-v4-flash` (Med reasoning) via opencode-zen. Same model
as the first (lyrics-nudge) loop; second data point at "adequate."

Verdict: adequate with visible headroom. All 3 anchor greps landed
1/1/1; guard counts 1/2 / 1/1/3 / 1/1/0 as specified; typecheck +
lint exit 0 (one pre-existing unrelated warning); single commit
byte-for-byte per the plan's heredoc; no step-up triggers fired.

Calibration state: "V4 Flash Med, adequate on mechanical ports of
≤~300 lines / ≤6 files" is a stable read. Any future calibration
downward should be on a genuinely trivial job (comment-only edit,
single typo fix) — not another mechanical port, or you can't tell
whether success proves capability or task-easiness.

Naming note discovered mid-session: plan template's
`tier: flash | med | pro` ladder is *not* the same as opencode-zen
model family names. `tier: med` maps to `deepseek-v4-flash` at Med
reasoning; `tier: flash` presumably maps to a lighter tier below
that. If a fresh planner instance mixes these up, the confusion is
predictable.

## Forward scope — standing candidates

In roughly ascending order of "real work":

1. **Preamble amendments** in `C:\Users\mrthi\Documents\WIIM\workflow.md`
   (and/or per-project preamble). Batchable session-close hygiene:
   - Docker Compose v5 quirk: `--no-cache` not accepted on
     `up --build`; use `build --no-cache && up -d`.
   - WSL git identity note (`Greg T <me@gregthibodeaux.com>` is the
     standing committer via repo-local WSL config).
   - `git push` runs from Windows PowerShell (GCM cached), not WSL
     (no credential helper) — codify if it bites again.
   - Line-count verification guards: use `grep -c '^+[^+]'` /
     `'^-[^-]'` or `git show --stat`, not raw `^+` / `^-` which
     match diff headers.
   - Plan-template `tier` ladder ≠ opencode-zen model family names;
     clarify what `tier: flash` maps to in your Hermes config.
   - Convention: draft plans live in `WIIM\tasks\`, archived
     `.done.md` in `WIIM\archive\`.
2. **`hermes/*` branch retention policy.** Four merged Hermes branches
   now exist locally (`hermes/cookie-secure-cherry-pick`,
   `hermes/reconcile-now-playing-card-mirror`,
   `hermes/8fe1f64-lyrics-nudge`, `hermes/e61b4b9-usb-output`).
   Decide: delete on merge, keep N, or archive elsewhere. One-line
   addition to the preamble.
3. **Orphan `_showa/components/now-playing-card.tsx`** — stale
   duplicate at `_showa/components/` (no `/dashboard/` subdir).
   Verify orphan status and delete if confirmed unreferenced.
4. **e61b4b9 follow-on USB work** — natural next port target now
   that `#11` is landed. Upstream layered onto the same three files
   after `e61b4b9`:
   - `available` roster from `getSoundCardModeSupportList`
   - `usbDac` name label (shows the connected DAC's name in place of
     "USB")
   - `outputNames` amp-speaker relabelling
   - `coexist` sub-line ("Also playing through X + Y")
   Needs its own recon pass to unpack which upstream commits carry
   which change, and decide whether to port as one round or split.
5. **Round 44 report's 4-item corrections list** — noted at the end
   of the recon report; small factual fixes.
6. **Port `39446 → 0.0.0.0` binding question** — deferred item from
   the 20260913-end handoff about container network exposure.

## Canonical reference documents

Not tracked in this repo, don't get overwritten by round work:

- `C:\Users\mrthi\Documents\WIIM\round44-upstream-recon-report.md` —
  the authoritative recon of v0.3.11..v0.3.17. Input for all
  Round 44+ planning. Includes the "4 corrections" list.
- `C:\Users\mrthi\Documents\WIIM\workflow.md` — Hermes/Opus workflow
  contract, file-status transitions, preamble carrier.
- `C:\Users\mrthi\Documents\WIIM\templates\plan-template.md` — Hermes
  task plan template.
- `C:\Users\mrthi\Documents\WIIM\tasks\` — drafts + approved plans
  in flight.
- `C:\Users\mrthi\Documents\WIIM\archive\` — closed `.done.md` +
  `-review.md` pairs, most recent at top.

## Standing operational rules

Refer to project memory for these (they are current and load-bearing):

- Session discipline, dual-write convention, edit-verification
  workflow, git hygiene, merge strategy, AI agent roles, build/shell
  patterns, known pitfalls, Hermes task lifecycle archiving, planning
  discipline (insertion-point maps), and tools/paths — all live in
  `ways-of-working.md` under this project's memory.
- Purpose, design tokens, environment, and horizon items live in
  `overview.md`.

Do not restate these here — check memory each session so drift is
caught in one place.
