---
phase: 06-engagement-surfaces
plan: 01
subsystem: testing
tags: [vitest, testing-library-svelte, jsdom, playwright, sveltekit-env, css-tokens, wcag-contrast, web3forms]

# Dependency graph
requires:
  - phase: 05-launch-hardening
    provides: shipped v1.0 static site with axe/SEO/3D-boundary/token/CI gates green
provides:
  - vitest + @testing-library/svelte + jsdom component-test harness (tests/unit/, pnpm test:unit)
  - playwright.enabled.config.ts — second Playwright config that builds WITH a dummy key on an isolated port
  - default playwright.config.ts testIgnore array excluding both unit specs and enabled-only specs
  - committed inert PUBLIC_WEB3FORMS_KEY="" default (.env tracked) so $env/static/public export always exists
  - AAA-safe --danger/--success/--field-border tokens in both mode themes
  - scripts/check-token-contrast.mjs computed WCAG contrast gate
affects: [06-02-contact-form, 06-03-media-section, 06-04-integration]

# Tech tracking
tech-stack:
  added: [vitest@4.1.10, "@testing-library/svelte@5.4.2", jsdom@29.1.1]
  patterns:
    - "Inert-until-configured: $env/static/public + committed empty .env default (prerender-safe, env-overridable)"
    - "Dual Playwright configs: default (no-key, hides enabled specs) vs enabled (dummy-key build, isolated port)"
    - "Computed token-contrast gate: parse tokens.css per mode, assert >=7:1 text / >=3:1 border before axe"

key-files:
  created:
    - vitest.config.ts
    - playwright.enabled.config.ts
    - scripts/check-token-contrast.mjs
    - .env
    - .env.example
    - tests/unit/harness.spec.ts
    - tests/unit/HarnessProbe.svelte
  modified:
    - package.json
    - playwright.config.ts
    - .gitignore
    - src/lib/styles/tokens.css

key-decisions:
  - "Scaffolded a tests/unit harness smoke spec (jsdom + runes render) so pnpm test:unit runs green in Wave 0 before the real MediaSection branch spec lands in Wave 2 — proves the toolchain, not just its presence."
  - "Did NOT mark ENGAGE-01/02/03 requirements complete: this Wave-0 plan builds the harness/tokens/inert-env foundation only; the contact form and media section ship in 06-02/06-03 and the phase gate closes in 06-04."

patterns-established:
  - "Inert-until-configured contact endpoint via $env/static/public + committed empty .env default"
  - "Enabled vs default Playwright split keyed on *.enabled.spec.ts and a dummy-key webServer.env"
  - "Pre-axe computed contrast gate for new tokens"

requirements-completed: []

# Metrics
duration: 18min
completed: 2026-07-06
---

# Phase 6 Plan 01: Test Harness, Inert Env & Engagement Tokens Summary

**Wave-0 engagement foundation: vitest+@testing-library/svelte harness, a dummy-key enabled-Playwright config split cleanly from the default no-key suite, a committed inert PUBLIC_WEB3FORMS_KEY default, and AAA-safe --danger/--success/--field-border tokens gated by a computed WCAG contrast script.**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-07-06T09:02:50Z
- **Completed:** 2026-07-06T09:20:00Z
- **Tasks:** 3
- **Files modified:** 13 (7 created, 4 modified, + lockfile/workspace)

## Accomplishments
- Installed and pinned the component-test toolchain (vitest 4.1.10, @testing-library/svelte 5.4.2, jsdom 29.1.1) with `test:unit`, `test:e2e:enabled`, `test:contrast` scripts; `pnpm test:unit` runs green against a scaffolded jsdom+runes harness spec (2/2 passing).
- Authored `playwright.enabled.config.ts` (builds WITH `PUBLIC_WEB3FORMS_KEY=test-key-web3forms-dummy` on isolated port 4271, `testMatch: **/*.enabled.spec.ts`) and hardened the default `playwright.config.ts` with the mandatory array `testIgnore: ['**/unit/**', '**/*.enabled.spec.ts']`.
- Committed the inert `PUBLIC_WEB3FORMS_KEY=""` default (`.env` now tracked via `!.env`); build verified green with the shell env var unset (CI/fresh-clone parity).
- Added `--danger`/`--success`/`--field-border` to both mode blocks and a computed WCAG gate — all six pairs pass (danger/success ≥7:1, field-border ≥3:1) in both modes; raw-hex gate unchanged.

## Task Commits

Each task was committed atomically:

1. **Task 1: Install component-test toolchain + author vitest and enabled-Playwright configs** - `0d2e286` (chore)
2. **Task 2: Commit the inert PUBLIC_WEB3FORMS_KEY default** - `454fe09` (feat)
3. **Task 3: Add AAA-safe engagement tokens + computed contrast gate** - `b5ec05c` (feat)

**Plan metadata:** _(final docs commit)_

## Files Created/Modified
- `vitest.config.ts` - jsdom runner, browser condition, `$lib` alias, `tests/unit/**/*.spec.ts` include only
- `playwright.enabled.config.ts` - enabled-only Playwright config; dummy-key build; port 4271
- `playwright.config.ts` - added array-form `testIgnore` excluding unit + enabled specs
- `package.json` - `test:unit`, `test:e2e:enabled`, `test:contrast` scripts; new devDeps
- `.env` - committed empty `PUBLIC_WEB3FORMS_KEY` default (inert form)
- `.env.example` - human docs for provisioning the public key
- `.gitignore` - `!.env` un-ignore so the empty default is tracked
- `src/lib/styles/tokens.css` - `--danger`/`--success`/`--field-border` in accessible + premium blocks
- `scripts/check-token-contrast.mjs` - computed WCAG contrast gate (≥7:1 text, ≥3:1 border)
- `tests/unit/harness.spec.ts` + `tests/unit/HarnessProbe.svelte` - Wave-0 harness smoke test

## Contrast Results (computed WCAG gate)

| Mode | Token | Value | On --bg | Ratio | Threshold |
|------|-------|-------|---------|-------|-----------|
| accessible | --danger | #9a3412 | #ffffff | 7.31:1 | ≥7 ✅ |
| accessible | --success | #1b5e20 | #ffffff | 7.87:1 | ≥7 ✅ |
| accessible | --field-border | #565f6b | #ffffff | 6.47:1 | ≥3 ✅ |
| premium | --danger | #ff9d8a | #0a0e14 | 9.62:1 | ≥7 ✅ |
| premium | --success | #7ee0a0 | #0a0e14 | 12.02:1 | ≥7 ✅ |
| premium | --field-border | #8a97a8 | #0a0e14 | 6.51:1 | ≥3 ✅ |

## Default vs Enabled Test-List Separation (proof)

- Default `playwright.config.ts` `--list`: 68 existing e2e specs; **`tests/unit/harness.spec.ts` (present on disk, matches the default `**/*.spec.ts` glob) is NOT collected** — the `testIgnore` array actively excludes it. `grep -E "unit/|enabled\.spec"` against the default list → **CLEAN** (no leaks).
- Enabled `playwright.enabled.config.ts` `--list`: `testMatch: **/*.enabled.spec.ts` → 0 tests today (enabled specs are authored in 06-02); the config is ready and will build with the dummy key on port 4271.

## Decisions Made
- Added a scaffolded `tests/unit` harness smoke spec (jsdom DOM env + a minimal Svelte 5 runes component) so `pnpm test:unit` exits 0 in Wave 0 — `vitest run` fails with "No test files found" against an empty include, and the success criterion requires the harness to *run*, not merely exist. Wave 2 augments this with the real MediaSection empty-vs-populated branch spec.
- Left ENGAGE-01/02/03 unmarked in REQUIREMENTS.md — this plan is infrastructure; the surfaces those requirements describe (accessible form, inert-hidden behavior end-to-end, media section) are delivered by 06-02/06-03 and the phase gate closes in 06-04.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Scaffolded a tests/unit harness spec so `pnpm test:unit` runs**
- **Found during:** Task 1 (toolchain install)
- **Issue:** The plan's `vitest.config.ts` includes `tests/unit/**/*.spec.ts`, but no spec existed; `vitest run` exits non-zero on "No test files found", so `pnpm test:unit` could not be demonstrated as *running* (a stated success criterion).
- **Fix:** Added `tests/unit/harness.spec.ts` + `tests/unit/HarnessProbe.svelte` — a minimal jsdom+runes render smoke test proving the harness itself is wired. Non-shipping test-only files; replaced/augmented by the real branch spec in Wave 2.
- **Files modified:** tests/unit/harness.spec.ts, tests/unit/HarnessProbe.svelte
- **Verification:** `pnpm test:unit` → 2 passed (2). Default Playwright `--list` confirms these are excluded from the e2e suite.
- **Committed in:** 0d2e286 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to satisfy the "pnpm test:unit runs" criterion; scoped strictly to test-only scaffold files. No scope creep.

## Issues Encountered
- `pnpm add` and `svelte-kit sync` rewrote `package.json` mid-edit and generated `pnpm-workspace.yaml` (pnpm supply-chain policy); re-read before editing and committed the workspace file with Task 1. No functional impact.

## User Setup Required
None for this plan. The live contact form (future) requires provisioning a public Web3Forms key against emanrimawi@gmail.com and setting the `PUBLIC_WEB3FORMS_KEY` repo Actions Variable — documented in `.env.example`, non-blocking, and covered when 06-02 ships the form.

## Next Phase Readiness
- Harness, inert env default, and tokens are all green and committed — 06-02 (ContactForm + success page) and 06-03 (MediaSection) can author RED default/enabled/unit specs against real runners immediately.
- 06-04 will wire `test:unit`/`test:e2e:enabled`/`test:contrast` into the `test`/`test:launch` aggregates and the CI verify job, and mark ENGAGE-01/02/03 complete once the surfaces and full phase gate are green.

## Regression Evidence

- `pnpm check` (svelte-check): 0 errors, 0 warnings.
- `pnpm test:unit`: 2 passed (2) — jsdom + Svelte 5 runes harness.
- `node scripts/check-token-contrast.mjs`: CONTRAST OK (6/6 pairs).
- `pnpm test:tokens` (raw-hex gate): OK — hex only in tokens.css.
- Default e2e regression: `tests/a11y.spec.ts` (axe zero-violations incl. `wcag2aaa`) **10/10 passed** in both modes across all 5 routes against the build with the new tokens; the full default `pnpm test:e2e` run showed all captured specs passing with zero test failures (the trailing ELIFECYCLE was an artifact of manually terminating the lingering preview server post-run, not a test failure).
- Default vs enabled separation proven via `playwright test --list`: default config collects the 68 e2e specs and **excludes** the on-disk `tests/unit/harness.spec.ts`; `grep unit/|enabled.spec` → CLEAN.

## Self-Check: PASSED

- Files verified present: vitest.config.ts, playwright.enabled.config.ts, scripts/check-token-contrast.mjs, .env, .env.example, tests/unit/harness.spec.ts, 06-01-SUMMARY.md.
- Commits verified in git log: 0d2e286 (Task 1), 454fe09 (Task 2), b5ec05c (Task 3).

---
*Phase: 06-engagement-surfaces*
*Completed: 2026-07-06*
