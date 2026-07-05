---
phase: 05-launch-hardening
plan: 03
subsystem: testing
tags: [lighthouse, lhci, ci, smoke-test, github-pages, seo, accessibility, adapter-static, node-fetch]

# Dependency graph
requires:
  - phase: 05-01
    provides: per-route <Seo> meta + site.url/seo map (so Lighthouse SEO scores real per-route meta)
  - phase: 01-foundation
    provides: paths.relative=false (absolute base-prefixed _app/immutable URLs the smoke script greps), 404.html SPA fallback, live Pages deploy
provides:
  - Lighthouse budget (lighthouserc.json) gating a11y>=0.95 + best-practices>=0.9 on all pages and seo>=0.9 on content routes, against the base-less build/
  - Live-URL smoke check (scripts/live-smoke.mjs) proving 5 routes + an _app chunk + SPA-404 shell + no-google-fonts on the deployed base-path site
  - package.json scripts: lhci, smoke
affects: [05-04-ci-workflow-gate-and-retry, 05-05-regression-and-launch-verify]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Lighthouse budget via lhci staticDistDir against the BASE-LESS build/ (assets resolve at root); assertMatrix scopes SEO to content routes only"
    - "Dependency-free live smoke using Node 24 global fetch with retry-backoff for CDN propagation"

key-files:
  created:
    - lighthouserc.json
    - scripts/live-smoke.mjs
  modified:
    - package.json

key-decisions:
  - "SEO budget uses assertMatrix to exclude the 404.html SPA fallback shell (client-routed, served with HTTP 404, no per-route meta by design); a11y>=0.95 + best-practices>=0.9 still gate every page including the shell"
  - "maxAutodiscoverUrls: 0 lifts lhci's default 5-URL cap so all 6 prerendered pages are audited (the default silently dropped services/index.html)"
  - "Live smoke wraps its checks in a 5-attempt backoff loop to absorb GitHub Pages CDN propagation lag after a fresh deploy"

patterns-established:
  - "Utility/non-content pages (SPA 404 shell) are excluded from SEO scoring via lhci assertMatrix matchingUrlPattern, not by lowering thresholds"

requirements-completed: [QA-01, DEPLOY-04]

# Metrics
duration: 31min
completed: 2026-07-05
---

# Phase 5 Plan 3: Lighthouse Budget and Live Smoke Summary

**Lighthouse budget (a11y>=0.95, best-practices>=0.9 on all pages; seo>=0.9 on content routes) against the base-less build, plus a dependency-free live-URL smoke check proving the deployed base-path site — both authored and proven locally, ready for CI to run.**

## Performance

- **Duration:** 31 min
- **Started:** 2026-07-05T10:53:45Z
- **Completed:** 2026-07-05T11:25:17Z
- **Tasks:** 2
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments
- `lighthouserc.json` gates the base-less `build/`: `pnpm exec lhci autorun` exits 0 with all 6 prerendered pages audited. Content routes score 1.0 on a11y/best-practices/SEO; the 404 SPA shell passes a11y 0.96 and best-practices 0.96.
- `scripts/live-smoke.mjs` proves the CURRENTLY LIVE site: 5 routes → 200, an `_app/immutable` chunk → 200 (JS content-type), the SPA-404 shell body is served for unknown deep links, and no Google Fonts references — prints `SMOKE OK`, exits 0. Verified via both `pnpm smoke` and the explicit-URL CI form.
- Wired `lhci` and `smoke` package scripts; `pnpm check` passes (0 errors/0 warnings).

## Task Commits

Each task was committed atomically:

1. **Task 1: lighthouserc.json + lhci script, proven locally** - `a15a595` (feat)
2. **Task 2: scripts/live-smoke.mjs + smoke script, run against live site** - `5068e5e` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `lighthouserc.json` - Lighthouse budget: `staticDistDir: build`, `numberOfRuns: 1`, `maxAutodiscoverUrls: 0`; `assertMatrix` gating a11y>=0.95 + best-practices>=0.9 on all pages and seo>=0.9 on content routes only.
- `scripts/live-smoke.mjs` - Node 24 global-fetch live smoke: 5 routes 200 + `_app/immutable` asset 200 + SPA-404 shell body + no google-fonts, base URL from argv/env with retry-backoff.
- `package.json` - Added `"lhci": "lhci autorun"` and `"smoke": "node scripts/live-smoke.mjs"`.

## Decisions Made
- **Exclude the 404 SPA shell from SEO scoring (assertMatrix).** The `build/404.html` is the client-routed SvelteKit SPA fallback, served by GitHub Pages with an HTTP 404 status and carrying no per-route `<Seo>` meta by design. It scores SEO 0.82 (fails `document-title` + `meta-description`), while all 5 content routes score 1.0. Rather than lower thresholds or add meta that would duplicate on content routes, the SEO assertion is scoped to non-404 URLs via `matchingUrlPattern`. a11y>=0.95 and best-practices>=0.9 still gate the shell.
- **`maxAutodiscoverUrls: 0`.** lhci's default cap is 5 autodiscovered URLs; with 6 prerendered HTML files it silently dropped `services/index.html` from the audit set. Setting `0` audits all pages so the gate actually covers every route.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] SEO budget failed on the 404 SPA fallback shell**
- **Found during:** Task 1 (lighthouserc.json local proof)
- **Issue:** The verbatim `assertions` block from the plan applied `categories:seo >= 0.9` to every discovered page, including `build/404.html`. The SPA fallback shell is a meta-less client-routing shell (SEO 0.82: `document-title` + `meta-description` score 0), so `lhci autorun` exited 1. Attempts to give the shell meta via the layout were dead code (the layout `<svelte:head>` is not rendered into the fallback — it is a bare app-shell whose head comes only from `app.html`), and adding meta via the shared `app.html` would create duplicate `<meta name="description">` on content routes, breaking 05-01's `tests/seo.spec.ts` `toHaveCount(1)`.
- **Fix:** Restructured `assert` into an `assertMatrix`: a11y>=0.95 + best-practices>=0.9 + performance(warn)>=0.85 apply to all pages (`.*`); `categories:seo >= 0.9` applies only to non-404 URLs (`^(?!.*/404\.html).*$`). All 5 content routes remain hard-gated at SEO 1.0; the shell is still gated on accessibility and best-practices.
- **Files modified:** lighthouserc.json
- **Verification:** `pnpm exec lhci autorun` exits 0; 404 shell a11y 0.96 / bp 0.96 pass, content routes seo 1.0.
- **Committed in:** `a15a595` (Task 1 commit)

**2. [Rule 2 - Missing Critical] lhci silently dropped services/index.html from the audit set**
- **Found during:** Task 1 (noticed only 5 of 6 pages were audited)
- **Issue:** lhci's `maxAutodiscoverUrls` defaults to 5. With 6 prerendered HTML files (404 + 5 routes), the last-discovered page (`services/index.html`) was never audited — a coverage gap that would let a services-route a11y/SEO regression slip the gate.
- **Fix:** Added `"maxAutodiscoverUrls": 0` to `collect` (0 disables the limit). All 6 pages are now audited.
- **Files modified:** lighthouserc.json
- **Verification:** `Checking assertions against 6 URL(s), 6 total run(s)`; services/index.html present with a11y/bp/seo 1.0.
- **Committed in:** `a15a595` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing-critical). Both confined to `lighthouserc.json` (this plan's own artifact); no changes to 05-01's SEO architecture or tests.
**Impact on plan:** Both fixes are necessary for the gate to exit 0 and to actually cover every route. No scope creep — thresholds were not lowered for any content page.

## Issues Encountered
- **Windows-only `chrome-launcher` cleanup race (local proof only).** On Windows, lhci's headless Chrome cleanup intermittently throws `EPERM` on `rmSync` of its temp profile dir (and `taskkill` is not on the Git-Bash PATH by default), aborting `autorun` mid-collect. This is purely a local-Windows artifact of `chrome-launcher.destroyTmp` racing Chrome's file-handle release — it does NOT reflect any assertion outcome, and the CI target (`ubuntu-latest`, per 05-RESEARCH) never hits it. Worked around locally by prepending `C:\Windows\System32` to PATH and passing subprocess-reducing chrome flags (`--headless=new --disable-gpu --no-sandbox --disable-crash-reporter --disable-crashpad --disable-dev-shm-usage`) at invocation time (NOT in the committed config, which stays clean for CI), retrying the transient race. The committed `lighthouserc.json` requires no such flags on Linux CI.

## User Setup Required
None - no external service configuration required. (The live smoke runs against the already-deployed public Pages URL.)

## Next Phase Readiness
- Ready for **05-04** to wire both instruments into `.github/workflows/deploy.yml`: `lhci autorun` in the `verify` job (against the base-less build the Playwright `webServer` already produces) and `node scripts/live-smoke.mjs "$page_url"` in the post-deploy `smoke` job (wrap in `nick-fields/retry` for CDN propagation, per research).
- Note for 05-04: on Linux CI runners, `--no-sandbox` is commonly required for headless Chrome in containers — add it via the workflow's lhci invocation if the runner's Chrome refuses to launch (the committed config is deliberately flag-free).

---
*Phase: 05-launch-hardening*
*Completed: 2026-07-05*

## Self-Check: PASSED
- FOUND: lighthouserc.json
- FOUND: scripts/live-smoke.mjs
- FOUND: .planning/phases/05-launch-hardening/05-03-SUMMARY.md
- FOUND commit a15a595 (Task 1), FOUND commit 5068e5e (Task 2)
- package.json scripts `lhci` and `smoke` present
