---
phase: 05-launch-hardening
plan: 04
subsystem: infra
tags: [ci, github-actions, github-pages, lighthouse, lhci, playwright, axe, deploy-retry, smoke-test, nick-fields-retry]

# Dependency graph
requires:
  - phase: 05-01
    provides: seo.spec added to test:e2e so the verify job's axe run also covers per-route SEO meta
  - phase: 05-02
    provides: no-flash deterministic mode + CI worker cap so the verify job's Playwright run is stable
  - phase: 05-03
    provides: lighthouserc.json + scripts/live-smoke.mjs + lhci/smoke scripts (the two instruments this plan wires into CI)
  - phase: 01-foundation
    provides: existing build+deploy workflow, BASE_PATH-from-repo-name build, live Pages deploy
provides:
  - .github/workflows/deploy.yml rewritten as a gated pipeline verify(axe both modes + Lighthouse) -> build(BASE_PATH) -> deploy(guarded deploy1/deploy2 retry) -> smoke(live-smoke with CDN-propagation retry)
  - scripts/check-ci-gate.mjs static assertion that deploy.yml retains the QA-01 gate + Follow-up-1 retry + DEPLOY-04 smoke wiring
  - package.json script test:ci-gate
affects: [05-05-regression-and-launch-verify]

# Tech tracking
tech-stack:
  added:
    - "nick-fields/retry@v4 (GitHub Action) for the shell-command live-smoke step"
  patterns:
    - "CI a11y/perf gate: a verify job runs Playwright axe (both modes, all routes) + lhci autorun BEFORE build; build needs verify, deploy needs build (fail-closed release gate)"
    - "Guarded deploy retry (Follow-up 1, Option B): deploy1 continue-on-error + 30s sleep + conditional deploy2; page_url resolves from whichever succeeded via job outputs — self-heals transient deploy-pages failures using only the official action"
    - "Post-deploy live verification: smoke job runs node scripts/live-smoke.mjs on needs.deploy.outputs.page_url wrapped in nick-fields/retry for CDN propagation"
    - "Static workflow-content assertion (check-ci-gate.mjs) so a future edit cannot silently drop the gate — CI-only wiring is testable locally without running Actions"
    - "lhci --no-sandbox passed via workflow CLI arg (--collect.chromeFlags), keeping lighthouserc.json flag-free for portability"

key-files:
  created:
    - scripts/check-ci-gate.mjs
  modified:
    - .github/workflows/deploy.yml
    - package.json

key-decisions:
  - "Applied --no-sandbox for the CI lhci step via the workflow CLI arg (pnpm exec lhci autorun --collect.chromeFlags=\"--no-sandbox\") rather than in lighthouserc.json, so the committed config stays flag-free and portable (per 05-03's handoff note + environment guidance)"
  - "Kept the guarded deploy1/deploy2 pair (Follow-up 1 Option B) using only actions/deploy-pages@v4 — no third-party dependency for the deploy retry; nick-fields/retry is used only for the shell-based smoke step where it is the right tool"
  - "deploy-pages@v4 timeout: 600000 (ms) confirmed a valid input against 05-RESEARCH's reconfirmed input names"

patterns-established:
  - "Release gate is fail-closed: any axe violation (either mode, any route) or any Lighthouse budget miss fails verify and blocks build+deploy"
  - "Workflow wiring is asserted by a committed static check (test:ci-gate) so the gate survives future edits"

requirements-completed: [QA-01, DEPLOY-04]

# Metrics
duration: 12min
completed: 2026-07-05
---

# Phase 5 Plan 4: CI Workflow Gate and Retry Summary

**deploy.yml rewritten as a fail-closed pipeline — verify(Playwright axe both modes + Lighthouse budgets) gates build->deploy, a guarded deploy1/deploy2 pair self-heals transient Pages failures, and a post-deploy live-smoke job (nick-fields/retry for CDN propagation) verifies the deployed URL — plus a static check-ci-gate.mjs that asserts the wiring stays intact.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-05T11:25:00Z
- **Completed:** 2026-07-05T11:37:06Z
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments
- `.github/workflows/deploy.yml` is now a four-job gated pipeline: `verify` (pnpm install → `playwright install --with-deps chromium` → `pnpm test:e2e` axe/e2e → `pnpm exec lhci autorun --collect.chromeFlags="--no-sandbox"`) → `build` (`needs: verify`, BASE_PATH artifact) → `deploy` (`needs: build`, guarded deploy1/deploy2 retry) → `smoke` (`needs: deploy`, live-smoke via nick-fields/retry@v4). Valid YAML (Python `yaml.safe_load` parses all four jobs).
- `scripts/check-ci-gate.mjs` statically asserts all 11 gate/retry/smoke wiring points are present in deploy.yml; wired as `pnpm test:ci-gate`, prints `CI GATE OK`, exits 0.
- Local proofs of the exact commands CI runs are green: base-less `pnpm build` succeeds; Lighthouse budgets pass (`lhci assert` → `All results processed!`, exit 0); `pnpm smoke` against the live site → `SMOKE OK`, exit 0; `pnpm check` → 0 errors/0 warnings.

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite deploy.yml as verify -> build -> deploy(retry) -> smoke** - `0b72bbf` (feat)
2. **Task 2: Author scripts/check-ci-gate.mjs + test:ci-gate script** - `fae66e7` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `.github/workflows/deploy.yml` - Rewritten from a bare build+deploy into a gated verify → build → deploy(guarded retry) → smoke pipeline. verify runs axe (both modes, all routes) + lhci with `--no-sandbox`; build/deploy are `needs`-chained to it; deploy uses the deploy1(continue-on-error)+sleep+deploy2 guarded pair with page_url as a job output; smoke runs live-smoke on `needs.deploy.outputs.page_url` under nick-fields/retry@v4.
- `scripts/check-ci-gate.mjs` - Reads deploy.yml and asserts 11 wiring points (verify job, playwright browser install, test:e2e gate, lhci autorun, needs: verify, needs: build, guarded retry, deploy1 outcome guard, smoke needs deploy, nick-fields/retry@v4, live-smoke.mjs); exits 1 with a labeled list on any miss.
- `package.json` - Added `"test:ci-gate": "node scripts/check-ci-gate.mjs"`.

## Decisions Made
- **`--no-sandbox` via workflow CLI arg, not config.** The CI `verify` job invokes `pnpm exec lhci autorun --collect.chromeFlags="--no-sandbox"` so ubuntu-latest headless Chrome launches, while `lighthouserc.json` stays deliberately flag-free and portable. This honors 05-03's explicit handoff note and the environment guidance to keep the flag out of the committed config.
- **Guarded deploy pair uses only the official action.** The deploy retry is the `deploy1`/`deploy2` guarded pair (Follow-up 1, Option B) — no third-party dependency, transparent, and `page_url` resolves from whichever attempt succeeds. `nick-fields/retry@v4` is reserved for the shell-based smoke step, where a CLI retry wrapper is the correct tool.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added `--no-sandbox` to the CI lhci step**
- **Found during:** Task 1 (deploy.yml authoring)
- **Issue:** The plan's verbatim YAML ran `pnpm exec lhci autorun` with no chrome flags. On ubuntu-latest, headless Chrome commonly refuses to launch without `--no-sandbox`, which would break the verify gate at runtime. 05-03's SUMMARY and the plan's environment guidance both flagged this, and the success criteria explicitly require the lhci step to use `--no-sandbox`.
- **Fix:** Changed the lhci step to `pnpm exec lhci autorun --collect.chromeFlags="--no-sandbox"` — passing the flag at invocation time so `lighthouserc.json` stays flag-free.
- **Files modified:** .github/workflows/deploy.yml
- **Verification:** `rg 'no-sandbox' .github/workflows/deploy.yml` matches; `rg 'lhci autorun'` still matches (grep/check-ci-gate unaffected); YAML still parses.
- **Committed in:** `0b72bbf` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing-critical). Confined to the lhci invocation in this plan's own artifact (deploy.yml); no change to lighthouserc.json or any test.
**Impact on plan:** Necessary for the verify gate to actually run on ubuntu CI. No scope creep.

## Issues Encountered
- **Windows-only lhci teardown crash (local proof only).** `pnpm exec lhci autorun` aborts on Windows during `chrome-launcher.destroyTmp` with `EPERM` removing its temp profile dir (and `taskkill` is absent from the Git-Bash PATH), so `autorun` exits 1 *after* the audits complete. This is the same local-Windows artifact documented in 05-03 and does not reflect any assertion outcome. Verified the budgets actually pass by splitting into `lhci collect` (which stores results) + `lhci assert` → `All results processed!`, exit 0. The CI target is `ubuntu-latest`, which never hits this teardown race. Per the environment guidance, CI-only behavior cannot be fully run locally; acceptance is YAML-valid + gate-wiring grep + `test:ci-gate` exit 0, all of which pass.

## User Setup Required
None - no external service configuration required. (`nick-fields/retry@v4` is a public GitHub Action resolved at workflow runtime; the smoke step needs no secrets.)

## Next Phase Readiness
- Ready for **05-05** (regression-and-launch-verify): this is the plan that pushes to `main`, watches the Actions run, and confirms the gate fires green end-to-end on GitHub's runners. No push was performed here, per plan scope.
- The `verify` job assumes GitHub repo **Settings → Pages → Source = "GitHub Actions"** (already the case from Phase 1). If a real axe/Lighthouse regression exists at push time, `verify` will (correctly) block the deploy — that is the intended fail-closed behavior for 05-05 to observe.

---
*Phase: 05-launch-hardening*
*Completed: 2026-07-05*

## Self-Check: PASSED
- FOUND: .github/workflows/deploy.yml
- FOUND: scripts/check-ci-gate.mjs
- FOUND: .planning/phases/05-launch-hardening/05-04-SUMMARY.md
- FOUND commit 0b72bbf (Task 1), FOUND commit fae66e7 (Task 2)
- package.json `test:ci-gate` script present
- YAML valid (Python yaml.safe_load → jobs=verify,build,deploy,smoke); `pnpm test:ci-gate` → CI GATE OK (exit 0)
