# Gotchas

Environment and tooling footguns hit while working on this project, and their fixes. Add to this as new ones surface — the point is nobody (human or AI) should have to rediscover these the hard way twice.

## Ringer / WSL environment

- **Ringer requires WSL on Windows** — native Windows Python won't work for the full toolchain (worker CLIs, sandboxing). Runtime lives in WSL2 Ubuntu; the repo itself stays on the Windows filesystem (`/mnt/c/Users/mrthi/Wiim-Dashboard` from WSL's view) — that's fine, just slower for I/O-heavy operations (npm install, builds) than a native Linux path would be.
- **WSL DNS can silently break** — if `wsl` commands can't resolve hostnames, check `/etc/resolv.conf`; fix with `wsl -u root` to write a working nameserver directly (bypasses needing a sudo password), then disable `generateResolvConf` in `/etc/wsl.conf` so it doesn't revert.
- **One-shot `wsl <command>` invocations skip `.bashrc`**, so PATH additions from `.bashrc` (like nvm's node) don't apply — a binary that resolves correctly in `wsl` (interactive) can resolve to the wrong (Windows-side) binary in `wsl <command>` (one-shot). Fixed here by symlinking the WSL-native `node`/`npm`/`codex`/`opencode` into `/usr/local/bin`, which is on PATH regardless of shell type.
- **npm's `allowScripts` gate blocks native module builds by default** (e.g. `better-sqlite3`, `sharp`, `@node-rs/argon2`) — `npm install` alone won't compile them; run `npm approve-scripts <pkg>` for each, then `npm rebuild <pkg>`. Requires `build-essential` (make/gcc) installed in WSL for `better-sqlite3` specifically, since no prebuilt binary exists for this Node/platform combo.
- **This app's `node_modules` was empty** when work started — always verify `npm install` actually populated it (check for a specific `.node` binary, not just that the directory exists) before trusting any build/typecheck command.

## Ringer's check design, specifically for this project

- **`CHECK_TIMEOUT_S = 60` is hardcoded in `ringer.py`, not configurable via the manifest.** This app's real `npm run build` takes 2-3 minutes, so any check that re-runs it directly will always time out — regardless of whether the worker's code is correct. Fix used: have the worker run the build itself (within its own generous `timeout_s`) and redirect output to a log file with an explicit exit-code marker; the check then cheaply greps that log instead of re-running the build. This is a real tradeoff — it trusts worker-reported evidence rather than fully independent re-execution — worth remembering if a check passes on log content that turns out to be stale or fabricated.
- **Running multiple tasks against one shared checkout (no git worktrees) means every task's ownership check sees every OTHER task's uncommitted changes too**, since nothing gets committed mid-run. Each task's check needs `--allowed-status` (or equivalent) listing every sibling task's owned paths, or later tasks spuriously fail on the earlier tasks' legitimate, still-uncommitted work.
- **Free-tier Codex quota exhausts fast under real swarm use** — a couple of build-heavy retries can burn the whole allowance. Don't route more than a task or two to it in one batch; OpenCode+OpenRouter is the default lane for a reason (see `SOURCE-OF-TRUTH.md`).

## Windows filesystem interop

- Files inside WSL's own filesystem (not `/mnt/c/...`) aren't reachable via a normal Windows path — use the UNC path `\\wsl.localhost\<distro>\...` (e.g. `\\wsl.localhost\Ubuntu\home\mrthi\...`) from Windows-side tools.
