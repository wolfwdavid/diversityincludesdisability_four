---
phase: 02-mode-system-design-tokens
plan: 01
subsystem: testing
tags: [playwright, axe-core, eslint, fontsource, wcag, svelte, tdd, harness]

# Dependency graph
requires:
  - phase: 01-foundation-deploy-proof
    provides: SvelteKit adapter-static scaffold, base-path config, live Pages deploy
provides:
  - Pinned font + Playwright/axe + ESLint toolchain installed (pnpm)
  - playwright.config.ts (chromium, pnpm dev webServer, baseURL)
  - eslint.config.js (flat config, svelte a11y + prettier)
  - scripts/check-no-raw-hex.mjs (token-discipline gate, DS-02)
  - Four Playwright specs encoding MODE-01..05 + DS-01/DS-02 (RED by design)
  - package.json scripts lint/test:a11y/test:e2e/test:tokens/test
affects: [02-02-engine-core, 02-03-toggle-integration, phase-03-content]

# Tech tracking
tech-stack:
  added:
    - "@fontsource/lexend@5.2.11, @fontsource/source-sans-3@5.2.9 (self-hosted fonts)"
    - "@playwright/test@1.61.1, @axe-core/playwright@4.12.1, axe-core@4.12.1"
    - "eslint@10.6.0, eslint-plugin-svelte@3.20.0, svelte-eslint-parser@1.8.0, typescript-eslint@8.62.1"
    - "eslint-config-prettier@10.1.8, prettier@3.9.4, prettier-plugin-svelte@4.1.1, @lhci/cli@0.15.1"
  patterns:
    - "Tests-first validation harness: specs authored RED before engine exists (Wave-1 acceptance = collectable, not green)"
    - "Node-based token gate instead of bash/rg for Windows/pnpm-shell robustness"
    - "axe wcag2aaa tag runs color-contrast-enhanced so AAA claim is machine-verified"

key-files:
  created:
    - playwright.config.ts
    - eslint.config.js
    - scripts/check-no-raw-hex.mjs
    - tests/a11y.spec.ts
    - tests/mode-toggle.spec.ts
    - tests/os-signal.spec.ts
    - tests/no-flash.spec.ts
  modified:
    - package.json
    - pnpm-lock.yaml
    - .gitignore

key-decisions:
  - "Node raw-hex gate (scripts/check-no-raw-hex.mjs) replaces the RESEARCH bash/rg gate for cross-platform robustness"
  - "Added wcag2aaa to the axe tag set so the automated suite re-verifies the DS-01 AAA (>=7:1) contrast claim"
  - "MODE-05 spec proves focus + scroll preservation via element-identity of the sole [aria-pressed] button (stable across aria-label flip)"

patterns-established:
  - "Validation-first (RED) harness: Playwright can collect all specs before Plans 02-03 implement the engine"
  - "Runtime WCAG 2.5.8 target-size gate (boundingBox >= 44x44) rather than eyeballing CSS"

requirements-completed: []

# Metrics
duration: 8min
completed: 2026-07-04
---

# Phase 2 Plan 1: Test Toolchain & Validation Harness Summary

**Installed the pinned font + Playwright/axe + ESLint toolchain and authored the config, the Node raw-hex token gate, and four RED-by-design Playwright specs that encode MODE-01..05 / DS-01 / DS-02 — Playwright collects all 10 tests across 4 files with zero errors.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-04T22:13:51Z
- **Completed:** 2026-07-04T22:21:23Z
- **Tasks:** 3
- **Files modified:** 10 (7 created, 3 modified)

## Accomplishments
- Pinned toolchain installed via pnpm: @fontsource/*, @playwright/test, @axe-core/playwright, axe-core, full eslint flat-config stack, prettier, @lhci/cli; chromium browser installed.
- playwright.config.ts (chromium project, `pnpm dev` webServer on :5173, baseURL), eslint.config.js (svelte a11y + prettier), and the Node raw-hex token gate — the gate runs green (exit 0) on the current token-free src tree.
- Four Playwright spec files encode the full VALIDATION map; `pnpm exec playwright test --list` enumerates 10 tests across all 4 files with no collection/parse error (RED-on-run is expected until Plans 02-03 land).
- All three plan-checker amendments incorporated (focus+scroll preservation, 44px target-size gate, wcag2aaa axe tag).

## Task Commits

Each task was committed atomically:

1. **Task 1: Install font + test + lint toolchain and wire package.json scripts** - `2fbdf10` (chore)
2. **Task 2: Author playwright.config.ts, eslint.config.js, raw-hex token gate** - `41b08a0` (feat)
3. **Task 3: Write the four Playwright spec files (RED expected)** - `4007304` (test)

Deviation commit:
- **Ignore Playwright/Lighthouse CI output artifacts** - `4ed45f4` (chore, Rule 3)

## Files Created/Modified
- `playwright.config.ts` - Playwright runner: chromium, `pnpm dev --port 5173 --strictPort` webServer, baseURL http://localhost:5173.
- `eslint.config.js` - Flat ESLint config: js + typescript-eslint + eslint-plugin-svelte recommended + prettier; svelte parser wiring; ignores build/.svelte-kit/tests.
- `scripts/check-no-raw-hex.mjs` - Walks src/, fails (exit 1) on any raw 3/6/8-digit hex in .svelte/.css outside src/lib/styles/tokens.css.
- `tests/a11y.spec.ts` - axe zero-violations in both modes; tags include wcag2aaa (DS-01, DS-02).
- `tests/mode-toggle.spec.ts` - flip/persist/aria-pressed + 44px target-size + announce with focus/scroll preservation (MODE-01, MODE-02, MODE-05).
- `tests/os-signal.spec.ts` - reduced-motion/contrast auto-select + explicit override (MODE-04).
- `tests/no-flash.spec.ts` - pre-paint data-mode + no-google-fonts network assertion (MODE-03).
- `package.json` / `pnpm-lock.yaml` - deps + 5 new scripts (lint, test:a11y, test:e2e, test:tokens, test).
- `.gitignore` - ignore test-results/, playwright-report/, playwright/.cache, .lighthouseci.

## Decisions Made
- Node raw-hex gate instead of the RESEARCH bash/rg one-liner — no dependency on bash/rg on PATH under Windows/pnpm shell.
- Added `wcag2aaa` to the axe `.withTags([...])` so `color-contrast-enhanced` (AAA >=7:1) runs and machine-verifies the DS-01 AAA claim.
- MODE-05 focus preservation asserted via `document.activeElement === document.querySelector('button[aria-pressed]')` — element identity is stable even though the toggle's aria-label text changes when the mode flips.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking/Hygiene] Added Playwright + Lighthouse output dirs to .gitignore**
- **Found during:** Post-Task-3 untracked-file check
- **Issue:** The harness will emit `test-results/`, `playwright-report/`, and `.lighthouseci/` on future runs; without ignores these generated artifacts would be left untracked or accidentally committed.
- **Fix:** Added the four artifact paths to `.gitignore`.
- **Files modified:** .gitignore
- **Verification:** `git status --short` clean of build artifacts; only planning docs remain.
- **Committed in:** `4ed45f4`

Note: the plan's install list left `@eslint/js` and `globals` unpinned; they resolved to `@eslint/js@10.0.1` and `globals@17.7.0` (latest, compatible) — consistent with the plan authoring them without a pin.

---

**Total deviations:** 1 auto-fixed (1 blocking/hygiene)
**Impact on plan:** Repo-hygiene only. No scope creep; all planned artifacts delivered verbatim plus the 3 requested amendments.

## Issues Encountered
None. Toolchain installed cleanly; the raw-hex gate passed first run; Playwright collected all 10 tests without a parse error.

## Known Stubs
None. This plan is the validation harness only — no application/engine code was written (that is Plans 02-03). The four specs are intentionally RED-on-run until the engine and UI wiring exist; Wave-1 acceptance is collectability (`playwright test --list`), which passes.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Executable, automatable gate is in place for Plans 02 (engine/tokens/app.html/store) and 03 (toggle/layout/integration).
- Requirements MODE-01..05 / DS-01 / DS-02 are NOT yet complete — they become GREEN when Plans 02-03 build the store, tokens, inline no-flash script, toggle, and announcer. Left unchecked in REQUIREMENTS.md by design.
- Run `pnpm test:e2e` after Plan 03 to turn the suite green; both axe scans (incl. wcag2aaa) must show zero violations for the phase gate.

## Self-Check: PASSED

All 8 created files exist on disk; all 4 task/deviation commits (2fbdf10, 41b08a0, 4007304, 4ed45f4) present in git history.

---
*Phase: 02-mode-system-design-tokens*
*Completed: 2026-07-04*
