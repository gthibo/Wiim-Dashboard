# Showa Hi-Fi Counter — Session Handoff

*Updated end of session: September 14, 2026, after merging the 8fe1f64 lyrics-nudge manual port and confirming live UX. Supersedes all prior handoff content.*

## tl;dr for picking this back up

The 8fe1f64 lyrics-nudge manual port is merged and live. HEAD on `main` is
`660f929` (merge commit; parents `b364dc6` + `bcc6d23`). Container is
running fresh image `sha256:0e270e45…`, healthy, per-track `−`/`+` timing
nudge confirmed working in-browser by Greg. Working tree clean.

**Main is 11 commits ahead of `origin/main`** — not yet pushed. Push is
in the forward-scope list, but wasn't executed this session.

Next: pick from the forward-scope list below. `e61b4b9` (USB output) is
the next upstream-pick candidate on the Round 44 shortlist.

## Live git state to verify at session open

    git log --oneline -5 main
    # expect:
    # 660f929 Merge hermes/8fe1f64-lyrics-nudge into main
    # bcc6d23 feat(lyrics): per-track timing nudge (manual port of upstream 8fe1f64)
    # b364dc6 Merge hermes/reconcile-now-playing-card-mirror into main
    # 02c5772 chore(_showa): reconcile now-playing-card.tsx mirror with src/
    # d77cb86 Merge cherry-pick of upstream 5deb24e (COOKIE_SECURE/HSTS…) via first Hermes calibration loop

    git status
    # expect: On branch main; working tree clean; ahead of origin/main by 11 commits

Confirm the merge commit `660f929` exists and the tree is clean before
starting anything.

## Recent activity (post Round 44 recon)

### First Hermes calibration loop — upstream `5deb24e` cherry-pick

Commit: `9b98b9f` (`fix(security-headers): follow the request scheme for
HSTS + CSP upgrade (#12)`), merged as `d77cb86`. First live use of
Hermes as executor after Round 44 recon designated it. Small,
well-scoped security-headers fix. Loop closed with a `-review.md` and
archive move.

### Reconcile-now-playing-card-mirror pass

`_showa/components/dashboard/now-playing-card.tsx` had drifted from
`src/` — Hermes reconciled the mirror byte-for-byte. Commits `02c5772`
(reconcile) + merge `b364dc6`. Cleared the way for the lyrics-nudge
port's dual-write.

### 8fe1f64 lyrics-nudge manual port (this session's close)

Manual port of upstream `8fe1f64` (per-track lyrics timing nudge:
`−`/`+` buttons, localStorage per-track offset, ±10s clamp, reset). See:

- Plan / approved: `C:\Users\mrthi\Documents\WIIM\archive\2026-09-11-8fe1f64-lyrics-nudge-manual-port.done.md`
- Review: `C:\Users\mrthi\Documents\WIIM\archive\2026-09-11-8fe1f64-lyrics-nudge-manual-port-review.md`

Commit `bcc6d23`, merged as `660f929` this session. Six files touched
(3 src/ + 3 _showa/ under `components/dashboard/`), SHA256 mirror parity
verified on all three pairs.

**Deviation of note:** Hermes hit `TS2552` on `lyricsKey` at
`now-playing-card.tsx:133:27` — `<LyricsView>` at that line sits inside
module-level `CubbyArt`, not `NowPlayingCard`'s body, so the fork's
`lyricsKey` didn't reach it. Resolution mirrored the `KioskView`
triple-thread pattern the plan already prescribed. This is the same
scope-vs-line-number lesson filed in `ways-of-working.md` under
"Planning discipline — insertion-point maps." Typecheck caught it
cleanly; the plan → hand-back → mechanical-fix path worked as designed.

**Build note:** first `docker compose up -d --build` showed
`#19 [builder 5/5] RUN npm run build` **CACHED** — did not recompile.
Reran with the Compose v5 split form:

    docker compose build --no-cache && docker compose up -d

Fresh image `sha256:0e270e45…` confirmed. This is the same
"CACHED = didn't compile" trap called out in `ways-of-working.md`; the
split form is worth codifying in the preamble (see forward scope).

## Forward scope — standing candidates

In roughly ascending order of "real work":

1. **Push `main` to `origin/main`.** 11 commits ahead is a natural
   boundary; every closed round since Round 43 is unpushed.
2. **Preamble amendments** in `C:\Users\mrthi\Documents\WIIM\workflow.md`
   (and/or per-project preamble):
   - Docker Compose v5 quirk: `--no-cache` not accepted on
     `up --build`; use `build --no-cache && up -d`.
   - WSL git identity note (`Greg T <me@gregthibodeaux.com>` is the
     standing committer via repo-local WSL config).
3. **`hermes/*` branch retention policy.** Three merged Hermes
   branches now exist locally (`hermes/cookie-secure-cherry-pick`,
   `hermes/reconcile-now-playing-card-mirror`,
   `hermes/8fe1f64-lyrics-nudge`). Decide: delete on merge, keep N,
   or archive elsewhere. One-line addition to the preamble.
4. **Orphan `_showa/components/now-playing-card.tsx`** — stale
   duplicate at `_showa/components/` (no `/dashboard/` subdir).
   Verify orphan status and delete if confirmed unreferenced.
5. **`e61b4b9` (USB output)** — next upstream-pick candidate on the
   Round 44 shortlist. Needs its own recon pass before spec.
6. **Round 44 report's 4-item corrections list** — noted at the end
   of the recon report; small factual fixes.
7. **Port `39446 → 0.0.0.0` binding question** — deferred item from
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
