---
phase: 05-launch-hardening
plan: 05
subsystem: testing
tags: [playwright, axe, lighthouse, lhci, github-actions, github-pages, seo, smoke, svelte-kit]

# Dependency graph
requires:
  - phase: 05-01-seo-meta-component-and-routes
    provides: per-route <Seo> head meta + BASE_PATH build-grep gate (check-seo-meta.mjs)
  - phase: 05-02-og-image-and-local-fixes
    provides: 1200x630 OG card + deterministic no-flash fix
  - phase: 05-03-lighthouse-budget-and-live-smoke
    provides: lighthouserc.json budgets + live-smoke.mjs
  - phase: 05-04-ci-workflow-gate-and-retry
    provides: deploy.yml verify->build->deploy(retry)->smoke + check-ci-gate.mjs
provides:
  - Aggregate `test:launch` script chaining every Phase-5 gate on top of the full suite
  - Cross-platform `build:base` wrapper (BASE_PATH build without shell/OS env fragility)
  - Full local regression green (69 e2e + all static gates + lighthouse assertions + SEO grep)
  - First live run of the new CI gate GREEN end-to-end (verify -> build -> deploy -> smoke)
  - Live-verified GitHub Pages deploy (5 routes 200, OG/canonical meta, deep-link 404 fallback, OG image)
affects: [launch, post-launch-maintenance, future-content-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Aggregate launch gate: one command sequences base-less (lhci/e2e) then base-path (SEO grep) artifacts in the correct order"
    - "Node-set BASE_PATH build wrapper avoids Git Bash leading-slash path mangling and cmd.exe env-syntax breakage"

key-files:
  created:
    - scripts/build-base.mjs
  modified:
    - package.json
    - lighthouserc.json
    - scripts/gen-og-image.mjs
    - src/lib/components/premium/PremiumHero.svelte
    - src/routes/services/+page.svelte
    - tests/seo.spec.ts

key-decisions:
  - "test:launch sequences lhci (base-less) BEFORE the base-path rebuild + SEO grep, so each gate runs against the artifact it needs"
  - "Introduced build:base wrapper instead of inline BASE_PATH= in package.json — the inline form breaks on cmd.exe and is mangled by Git Bash MSYS path conversion"
  - "Did not weaken any a11y/lighthouse assertion; the only local blocker was a shell PATH gap (taskkill), fixed at the environment level, not the gate"

patterns-established:
  - "Launch regression is a single reproducible command (pnpm test:launch) plus a live smoke, not a checklist"

requirements-completed: [SEO-01, QA-01, DEPLOY-04]

# Metrics
duration: 44min
completed: 2026-07-05
---

# Phase 5 Plan 05: Regression and Launch Verify Summary

**Aggregate `test:launch` gate proven green (69 e2e + axe + lighthouse + SEO grep) and the new CI pipeline (verify -> build -> deploy -> smoke) went green on its first live run, deploying a live-verified GitHub Pages site.**

## Performance

- **Duration:** 44 min
- **Started:** 2026-07-05T11:41:06Z
- **Completed:** 2026-07-05T12:25:29Z
- **Tasks:** 2 auto + 1 checkpoint (auto-approved)
- **Files modified:** 6 (+1 created)

## Accomplishments
- Added an aggregate `test:launch` script chaining the full suite (check, lint, tokens, content, build, split, review, 69 e2e) with the Phase-5 gates (ci-gate static check, Lighthouse budgets, base-path SEO build-grep).
- Added a cross-platform `build:base` wrapper so the SEO build-grep reliably runs against the real Pages (BASE_PATH) artifact on Windows, Git Bash, and Linux CI alike.
- Ran the full local regression green: `pnpm test:launch` exits 0, `no-flash --workers=4` passed 3/3 with no flake, base-path build prints `SEO META OK`, and `pnpm smoke` prints `SMOKE OK`.
- Pushed to `main` and watched the **first live run of the new CI gate go green end-to-end** — verify (axe both modes + Lighthouse), build, deploy (deploy1 succeeded, retry skipped), smoke — with **no workflow fixes required**.
- Hand-verified the live site: all 5 routes 200, absolute base-path canonical + OG + `summary_large_image` Twitter meta in the served HTML, `/services/` tab title correct, deep-link 404 fallback serves the SPA shell (404 status + `data-mode`), and `og-image.png` resolves (200, image/png, 40 KB).

## Task Commits

1. **Task 1 (regression fix): format Phase-5 files for the prettier gate** - `6f7f7e0` (style)
2. **Task 1 (feature): aggregate test:launch + cross-platform base-path build** - `dc0b15f` (feat)
3. **Task 2: push + watch live CI green + live verify** - no code change required (workflow already correct; pushed `dc0b15f`, CI run `28740559916` all four jobs success)

## Files Created/Modified
- `scripts/build-base.mjs` - Cross-platform BASE_PATH build (sets env in Node, spawns `vite build`); default base = package name, matching CI's `/${repository.name}`.
- `package.json` - Added `build:base` and the aggregate `test:launch` scripts.
- `lighthouserc.json`, `scripts/gen-og-image.mjs`, `src/lib/components/premium/PremiumHero.svelte`, `src/routes/services/+page.svelte`, `tests/seo.spec.ts` - Line-wrap-only prettier reformat (no logic change) to pass the lint gate.

## Decisions Made
- **Aggregate ordering:** `pnpm test` (base-less build + e2e) -> `check-ci-gate` -> `lhci` (against the base-less `build/`) -> `build:base` (base-path rebuild) -> `check-seo-meta` (against the base-path artifact). Each gate runs against the artifact it actually needs; the two build variants never collide.
- **`build:base` over inline env:** `BASE_PATH=/… pnpm build` inline in a package.json script breaks on cmd.exe (rejects `VAR=val cmd`) and is corrupted by Git Bash MSYS path conversion (`/diversityincludesdisability_four` becomes a Windows path). A tiny Node wrapper sets `process.env.BASE_PATH` identically everywhere.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Prettier gate failing on 5 unformatted Phase-5 files**
- **Found during:** Task 1 (first `pnpm test:launch` run)
- **Issue:** Files added across 05-01..05-04 (lighthouserc.json, gen-og-image.mjs, PremiumHero.svelte, services/+page.svelte, seo.spec.ts) were never prettier-formatted, so `pnpm lint`'s `prettier --check` failed and blocked the whole aggregate.
- **Fix:** Ran `prettier --write` on those files (line-wrapping only; verified with `git diff --ignore-all-space` that no tokens changed).
- **Files modified:** the 5 files above
- **Verification:** `prettier --check .` -> "All matched files use Prettier code style"; full `test:launch` then passed.
- **Committed in:** `6f7f7e0`

**2. [Rule 3 - Blocking] Aggregate's literal script would run the SEO grep against a base-less build**
- **Found during:** Task 1 (designing test:launch)
- **Issue:** The plan's suggested `test:launch` string ends `pnpm test` (which leaves a BASE-LESS build) then runs `check-seo-meta.mjs`, which requires a BASE_PATH build — it would always fail. Inline `BASE_PATH=` is also not shell/OS-portable.
- **Fix:** Added `scripts/build-base.mjs` and reordered the aggregate to rebuild base-path immediately before the SEO grep (and to keep the base-less build for lhci).
- **Files modified:** package.json, scripts/build-base.mjs
- **Verification:** `pnpm test:launch` exits 0 end-to-end; `SEO META OK` printed against the base-path artifact.
- **Committed in:** `dc0b15f`

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking). No scope creep; no assertion or threshold weakened.
**Impact on plan:** Both were required to make the launch gate actually green and reproducible.

## Issues Encountered
- **Windows chrome-launcher / Playwright teardown crash (environment, not the code):** On this Git Bash shell, `System32` was not on `PATH`, so `taskkill` was unavailable. That made Lighthouse's chrome-launcher crash on cleanup with `EPERM` (locked temp dir) and made Playwright's webServer teardown hang after "69 passed". **Root-caused and fixed at the environment level** by adding `/c/Windows/System32` to `PATH` for local runs — `lhci autorun` then exited 0 and the full `test:launch` ran to a clean exit. This is a local-shell artifact only; CI (ubuntu) is unaffected and ran the same gates green. No source or gate change was needed. A normal Windows terminal/PowerShell already has System32 on PATH, so `pnpm test:launch` works out of the box there.
- **Lighthouse performance is a `warn`, not an `error`:** home page performance scored 0.74 vs the 0.85 warn threshold locally; all error-level assertions (accessibility >= 0.95, best-practices >= 0.9, seo >= 0.9) passed, so the gate is green. Performance remains a non-blocking warning by design.

## Optional Human Review (checkpoint auto-approved)
Task 3 was a `checkpoint:human-verify` for the real social-card render. Per the autonomous-execution directive it was **auto-approved** — the automated gates (axe both modes, Lighthouse, live smoke, 69 e2e, live OG/canonical meta grep) cover the requirement. An optional human spot-check remains available: paste `https://wolfwdavid.github.io/diversityincludesdisability_four/` into opengraph.xyz or the LinkedIn Post Inspector to eyeball the rendered OG card.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 5 (Launch Hardening) is complete: SEO-01, QA-01, DEPLOY-04 all proven on a real, live-verified GitHub Pages deploy with a blocking accessibility+Lighthouse CI gate and self-healing deploy retry.
- The site is launched and green. No blockers.

---
*Phase: 05-launch-hardening*
*Completed: 2026-07-05*

## Self-Check: PASSED
- FOUND: scripts/build-base.mjs
- FOUND: .planning/phases/05-launch-hardening/05-05-SUMMARY.md
- FOUND: commit 6f7f7e0 (style), dc0b15f (feat)
- FOUND: test:launch in package.json
- CI run 28740559916: verify/build/deploy/smoke all success; live site verified
