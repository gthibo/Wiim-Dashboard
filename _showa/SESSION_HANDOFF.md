# Showa Hi-Fi Counter — Session Handoff

*Updated end of session: September 14, 2026 (fourth session that day),
closing the two forward-scope items from the prior close: (1) Round 44 recon
report corrections addendum, and (2) TRUST_PROXY doc improvement in
`.env.example`. Supersedes all prior handoff content.*

## tl;dr for picking this back up

Two forward-scope items closed. HEAD on `main` is `7c5de53` (docs commit for
the `.env.example` TRUST_PROXY comment tightening), pushed to `origin/main`.
Working tree clean. `hermes/*` empty.

Recon report `C:\Users\mrthi\Documents\WIIM\round44-upstream-recon-report.md`
now carries a `## Corrections (2026-09-14)` addendum at the end, resolving the
four factual drifts that had accumulated since Sept 11 (Open Q #3 answered as
`5deb24e`; `8fe1f64`, `e61b4b9`, and the USB chain trio all landed and no
longer skip-list).

`.env.example` TRUST_PROXY comment expanded from 2 lines to 6 — names the
direct-LAN case, cites the global rate-limit cap as the XFF-rotation defense,
and warns that flipping to false collapses per-IP rate limiting into a shared
bucket. Filed as `7c5de53`. Investigation before the edit traced TRUST_PROXY
through `middleware.ts`, `lib/auth/request.ts`, `lib/auth/rate-limit.ts`, and
`lib/db/login-attempts.ts` — the shipping default is defensible (upstream's
global 40/15min cap defeats XFF rotation).

Real next work is the Round 44+ **regrouping session** — step 3 of the
upstream sync pipeline from `overview.md`. Working-session-sized; not started
this session.

## Live git state to verify at session open

    git log --oneline -6 main
    # expect:
    # 7c5de53 docs(env.example): clarify TRUST_PROXY behavior for direct-LAN deployments
    # 1bb0563 docs: handoff addendum - Hermes model/tier/evidence populated post-hoc
    # 952a319 docs: session close 2026-09-14 (USB chain follow-on merged; forward-scope 1-4 closed)
    # 30198ef Merge hermes/usb-chain-followon into main
    # b27b2f0 Port USB output/coexist support...
    # 7844cd0 chore(_showa): remove orphan now-playing-card.tsx duplicate

    git status
    # expect: On branch main; working tree clean; up to date with origin/main
    # (unless this session's own close doc has landed on top)

    git branch --list "hermes/*"
    # expect: empty

## Recent activity (this session)

### 1. Round 44 recon report — Corrections addendum

Reviewed the recon report; confirmed no literal "corrections list" existed in
the file. Reconstructed four factual drifts from git log + archive since Sept
11:

1. Open Q #3 (`COOKIE_SECURE` fix location) — answered: `5deb24e`. The recon's
   grep of commit subjects for `COOKIE_SECURE` missed it because upstream
   folded the fix into the broader security-headers commit.
2. `8fe1f64` (lyrics timing nudge) — landed (fork commit `bcc6d23`, merged
   `660f929`, 2026-09-13).
3. `e61b4b9` (USB output capability) — landed (fork commit `3ec1233`, merged
   `61e3a43`, 2026-09-14).
4. USB chain (`e0db2ee` + `2b78de1` + `c272376`) — landed as one port (fork
   commit `b27b2f0`, merged `30198ef`, 2026-09-14). No longer skip-list.

Format chosen: addendum, not in-place edits. Recon body preserved as a Sept 11
snapshot; corrections auditable at the end under `## Corrections (2026-09-14)`,
with an Opus signature footer.

The addendum is out-of-repo (`C:\Users\mrthi\Documents\WIIM\`), so no git
commit. Verified via grep: heading at L477, four subheadings at L484/502/515/527,
original Sonnet sign-off preserved at L472, Opus footer at L550.

Not sent through Hermes — pure Opus/Sonnet doc-critique work, no code changes,
no verification against hardware. Correct routing.

### 2. `.env.example` TRUST_PROXY doc improvement

Investigated the 20260913-end handoff's "port `39446 → 0.0.0.0` binding
question." Initial framing was as a security issue (LAN-exposed port +
`TRUST_PROXY=true` = X-Forwarded-For spoofable). Corrected by Greg on the
public-repo lens: don't base decisions on his personal setup; keep mobile
access unblocked for users who want it.

Traced actual TRUST_PROXY usage in `src/`:
- `middleware.ts` — decides HSTS + upgrade-insecure-requests from
  X-Forwarded-Proto. Spoofing = self-damage only (attacker's own browser
  breaks on HSTS-over-http).
- `lib/auth/request.ts` — `getClientIp()` reads X-Forwarded-For when trusted;
  falls back to `"0.0.0.0"` when not.
- `lib/auth/rate-limit.ts` — has a hardcoded `MAX_FAILURES_GLOBAL = 40` cap
  across all IPs, comment explicitly names it as the XFF-rotation defense.
- `lib/db/login-attempts.ts` — `countRecentFailuresGlobal` implements it.

Concluded upstream defaults are defensible: the XFF-rotation attack is bounded
at 40 attempts / 15 min by design. Flipping `TRUST_PROXY=false` has its own
downside — per-IP rate limiting collapses into a shared `"0.0.0.0"` bucket
because Next.js's Headers interface doesn't expose the socket-level remote IP.

Decision: no default flip, no upstream issue, just a doc improvement. Expanded
the `.env.example` comment on TRUST_PROXY from 2 lines to 6. Committed as
`7c5de53` and pushed. Docker-compose port binding left unchanged (LAN-exposed
default is correct for a self-hosted dashboard).

Deferred: filing the same doc improvement as an upstream PR to
`illianoaoi/Wiim-Dashboard`. Community-friendly and low-risk; carry into next
session's forward scope.

## Forward scope — standing candidates

1. **Round 44+ regrouping session** — biggest thing on the stack. Step 3 of
   the upstream sync pipeline from `overview.md`: Opus takes the corrected
   recon report and lays out sub-round shape. Needs decisions on the Open
   Questions still standing after the addendum:
   - Q1: `c68c950` extraction strategy (dedicated sub-round hand-extracting
     wanted pieces? Alternative?)
   - Q2: `isPlexArtUrl` retirement via `7d99a97` (architectural — whether the
     opt-in trusted-hosts allowlist replaces the shim)
   - Q4: `9ca026e` naming split (`PEQ_LETTERS` a–j vs upstream's a–l +
     `PEQ_LETTERS_BASELINE` helper — pick reconciliation approach)
   - Q6 already answered by the corrections (micro-batch pattern confirmed,
     all three items landed clean)
2. **Upstream PR of `.env.example` TRUST_PROXY doc improvement.** Same change
   as `7c5de53`, filed against `illianoaoi/Wiim-Dashboard`. Not urgent.
3. **Hardware verification of USB port work** on the Ultra. Deferred from
   prior close pending DAC reconnection tomorrow.
4. **Companion project `gthibo/wiim-universal-remote`.** Open work per
   `overview.md`: strip to headless service, `led/on|off`, `media/seek`,
   `input/next-input`, `output/dlna` (third output axis, no confirmed
   command), X1S round-trip confirmation. Not part of this repo's queue but
   on the broader horizon.
5. **EQ response curve deferred features** (per `overview.md`). Draggable
   nodes (coordinate inverses already in `eq-response.ts`), potential
   Catmull-Rom to monotone cubic swap, row-letter contrast tuning on tan
   panel background.

### README changelog gaps — flagged, not backfilled

`_showa/README.md`'s changelog runs through "Post Round 44 — 8fe1f64
lyrics-nudge manual port" and stops. Missing entries for:

- Post Round 44 — `e61b4b9` USB output manual port (fork `3ec1233`, merged
  `61e3a43`)
- Post Round 44 — USB chain follow-on `e0db2ee`+`2b78de1`+`c272376` port
  (fork `b27b2f0`, merged `30198ef`)
- Component-inventory note for `source-output-panel.tsx` doesn't reflect the
  `usbLabel()` helper, live-roster logic on `outputOptions`, coexist sub-line,
  or the USB DAC label passed from `dashboard.tsx`.
- No entry for this session's `.env.example` doc improvement — small, might
  not warrant one, but flagged.

This session's close deliberately did not reach back into prior sessions'
scope. Backfill or leave as-is is a next-session call.

## Canonical reference documents

Not tracked in this repo. Unchanged from prior handoff except the recon report
now includes its corrections addendum:

- `C:\Users\mrthi\Documents\WIIM\round44-upstream-recon-report.md` —
  authoritative recon of v0.3.11..v0.3.17. Now with `## Corrections
  (2026-09-14)` addendum at the end. Input for all Round 44+ planning.
- `C:\Users\mrthi\Documents\WIIM\workflow.md` — Hermes/Opus workflow contract.
- `C:\Users\mrthi\Documents\WIIM\HERMES_PREAMBLE.md` — root preamble.
- `C:\Users\mrthi\Documents\WIIM\HERMES_PREAMBLE_wiim-dashboard.md` — project
  preamble.
- `C:\Users\mrthi\Documents\WIIM\templates\plan-template.md` — Hermes task
  plan template.
- `C:\Users\mrthi\Documents\WIIM\tasks\` — empty at session close.
- `C:\Users\mrthi\Documents\WIIM\archive\` — closed `.done.md` + `-review.md`
  pairs.

## Standing operational rules

Refer to project memory (`ways-of-working.md`) — unchanged.
