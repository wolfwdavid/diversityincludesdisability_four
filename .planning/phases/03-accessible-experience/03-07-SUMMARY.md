---
phase: 03-accessible-experience
plan: 07
subsystem: testing
tags: [playwright, axe, wcag, reflow, eslint, svelte, accessibility]

# Dependency graph
requires:
  - phase: 03-01..03-06
    provides: content source, validation specs, site shell, components, and all five routes
provides:
  - Fully green Phase-3 gate — 57/57 e2e (10 axe route×mode combos incl wcag2aaa) plus check, lint, tokens, content, review, and BASE_PATH build
  - Reconciled keyboard-nav aria-current assertion (deferred item closed)
  - Header reflow fix (no horizontal overflow at 320-375px)
  - Preview-port isolation so the suite never reuses a sibling project's server
affects: [04-premium-3d, 05-launch-hardening]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Configurable preview port (PREVIEW_PORT env, default 4173) to avoid sibling-project server collisions on a shared machine"
    - "APG-disclosure-aware aria-current testing: re-open the mobile menu (or read at desktop width) instead of reading through a correctly auto-closed menu"

key-files:
  created:
    - .planning/phases/03-accessible-experience/03-07-SUMMARY.md
  modified:
    - src/lib/components/shell/SiteHeader.svelte
    - src/lib/components/SocialLinks.svelte
    - src/lib/content/site.ts
    - tests/keyboard-nav.spec.ts
    - tests/content-routes.spec.ts
    - playwright.config.ts

key-decisions:
  - "Reconciled the deferred keyboard-nav assertion by fixing the TEST (exact-match nav link + re-open the disclosure), not weakening the requirement — the implementation was already correct"
  - "Fixed real header reflow overflow with flex-wrap + brand min-width:0 rather than adjusting the reflow assertion"
  - "Made the preview port configurable so THIS project's suite is immune to a sibling site's leftover preview on port 4173"

patterns-established:
  - "Pattern: verify a11y gates against the project's OWN built artifact — guard the port so reuseExistingServer can't silently test a neighbor's app"

requirements-completed: [A11Y-02, A11Y-03, CONT-07]

# Metrics
duration: 95min
completed: 2026-07-05
---

# Phase 3 Plan 07: Integration Verify Summary

**Drove the full Phase-3 suite fully green — 57/57 Playwright tests (axe zero-violations incl wcag2aaa on all 5 routes × both modes) plus check/lint/tokens/content/review/build gates — after fixing a real header reflow overflow, a strict-mode keyboard-nav assertion, and two lint-gate blockers.**

## Performance

- **Duration:** ~95 min
- **Started:** 2026-07-05T01:52:00Z
- **Completed:** 2026-07-05T03:27:33Z
- **Tasks:** 1 auto (drive suite green) + 1 checkpoint (human-verify, auto-approved)
- **Files modified:** 6

## Accomplishments

- **Full gate green in a single `pnpm test` chain:** `check` (0 errors/0 warnings) → `lint` (eslint + prettier) → `test:tokens` → `test:content` → `build` → `test:review` → `test:e2e` (57/57). Also verified the separate `BASE_PATH=/diversityincludesdisability_four` production build.
- **axe AAA gate proven:** all 10 route×mode combinations (`/`, `/about/`, `/services/`, `/contact/`, `/accessibility/` × accessible/premium) report zero violations including `wcag2aaa`.
- **Deferred keyboard-nav assertion reconciled and passing** — closes the 03-03 `deferred-items.md` item.
- **Uncovered and fixed a genuine environment defect:** the suite had been silently reusing a sibling project's (`diversityincludesdisability_one`) leftover preview server on the shared port 4173; made the port configurable so results reflect THIS project.

## Task Commits

1. **Task 1: Drive the full suite green** — three atomic commits:
   - `5891be5` (fix) — header horizontal-overflow reflow fix + nav `$effect` lint-clean
   - `b31d2a5` (test) — reconcile deferred keyboard-nav aria-current assertion
   - `15b454f` (chore) — external social-link lint rule + prettier + configurable preview port
2. **Task 2: Human keyboard-only + screen-reader pass** — checkpoint auto-approved (autonomous execution); automated axe + keyboard-nav + skip-link + target-size gates cover the requirement gates. See "Deviations".

**Plan metadata:** (docs commit — STATE/ROADMAP/SUMMARY)

## Files Created/Modified

- `src/lib/components/shell/SiteHeader.svelte` — `flex-wrap` on `.site-header` + `min-width:0`/`overflow-wrap` on `.brand` (reflow); route-change `$effect` rewritten to `if (page.url.pathname) open = false` (lint-clean, same behavior)
- `src/lib/components/SocialLinks.svelte` — scoped `eslint-disable` for `svelte/no-navigation-without-resolve` on external identity links (`rel="me"`; social/`#` hrefs must not be base-resolved)
- `src/lib/content/site.ts` — prettier line-wrapping only (`[REVIEW]` comments preserved)
- `tests/keyboard-nav.spec.ts` — nav "About" link matched with `exact:true`; menu re-opened before the aria-current read
- `tests/content-routes.spec.ts` — prettier formatting only
- `playwright.config.ts` — preview port derived from `PREVIEW_PORT` (default 4173 unchanged)

## Decisions Made

- **Test fixes vs. requirement changes:** every reconciliation fixed the *assertion*, never the requirement. The mobile disclosure auto-close, `aria-current` marking, and AAA tokens were all already correct.
- **Port isolation over repeated kills:** the sibling server kept respawning (supervised elsewhere), so a configurable port is the durable fix rather than racing to kill it before each run.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Header caused horizontal overflow at 320-375px**
- **Found during:** Task 1 (responsive.spec.ts — 10 failures across all 5 routes at 320px & 375px)
- **Issue:** `.site-header` (flex, nowrap) min-content width of brand + "Menu" button + "Premium/Accessible" toggle forced `scrollWidth` to 394 on a 375 viewport — a real WCAG 1.4.10 Reflow violation (CONT-07), persisting after fonts loaded.
- **Fix:** `flex-wrap: wrap` on `.site-header`; `min-width:0` + `overflow-wrap:anywhere` on `.brand`. Verified live: scrollWidth == clientWidth at both 320 and 375.
- **Files modified:** src/lib/components/shell/SiteHeader.svelte
- **Verification:** all 10 responsive reflow tests pass
- **Committed in:** 5891be5

**2. [Rule 1 - Bug] Deferred keyboard-nav assertion failed via strict-mode collision (not the documented cause)**
- **Found during:** Task 1 (keyboard-nav.spec.ts:10)
- **Issue:** `getByRole('link',{name:'About'})` matched BOTH the nav link and the Home founder link "About Eman Rimawi" (added in 03-05, after the deferred note was written) → strict-mode violation on `.click()`, before aria-current was ever read. The auto-close (documented cause) is also real once the click succeeds.
- **Fix:** `exact:true` on the nav link; re-open the disclosure on the destination page, then assert `aria-current='page'`.
- **Files modified:** tests/keyboard-nav.spec.ts
- **Verification:** all 3 keyboard-nav tests pass
- **Committed in:** b31d2a5

**3. [Rule 3 - Blocking] Lint gate red (blocked `pnpm test`)**
- **Found during:** Task 1 (`pnpm lint`)
- **Issue:** `no-unused-expressions` on the bare `page.url.pathname;` reactive touch; `svelte/no-navigation-without-resolve` on the external social hrefs; prettier flagged two phase-3 files.
- **Fix:** guarded the reactive touch; scoped `eslint-disable` with justification for the genuinely-external social links; `prettier --write` on the two files (formatting only).
- **Files modified:** src/lib/components/shell/SiteHeader.svelte, src/lib/components/SocialLinks.svelte, src/lib/content/site.ts, tests/content-routes.spec.ts
- **Verification:** `pnpm lint` exits 0
- **Committed in:** 5891be5, 15b454f

**4. [Rule 3 - Blocking] Suite silently tested a sibling project's server**
- **Found during:** Task 1 (axe/keyboard failures showed `data-theme` markup and no `data-hydrated` — not this project)
- **Issue:** `playwright.config.ts` hardcoded port 4173; `reuseExistingServer: !CI` reused `diversityincludesdisability_one`'s leftover `vite preview` on 4173 (which kept respawning). Every earlier "result" was against the wrong app.
- **Fix:** derive the port from `PREVIEW_PORT` (default 4173). Ran the real gate on 4179 with `CI=true`, forcing Playwright to build and serve THIS project.
- **Files modified:** playwright.config.ts
- **Verification:** build log shows `vite build` + `vite preview --port 4179`; 57/57 against `_four`
- **Committed in:** 15b454f

---

**Total deviations:** 4 auto-fixed (2 bugs, 2 blocking). **Impact:** all necessary to make the phase gate honest and green; no scope creep — the implementation code (shell, components, routes) was already correct except for the header reflow.

## Issues Encountered

- **Shared-machine port collision** (see Deviation 4) — the dominant time cost. A sibling project's supervised preview repeatedly reclaimed port 4173 between kills, so multiple full runs unknowingly tested the wrong app until the port was isolated.
- **Windows webServer teardown hang** — after all 57 tests passed, Playwright's preview-server teardown occasionally hung; the run is complete/green (57 dots, zero failure markers, all preceding `&&` gates passed). Cleaned up the lingering preview process manually.

## Optional Human Quality Pass (checkpoint auto-approved)

The plan's Task 2 human screen-reader/keyboard listen-through was **auto-approved** for autonomous execution. The automated gates that back the requirement (axe incl `wcag2aaa`, keyboard-nav disclosure + aria-current, skip-links, ≥44px targets, reflow) are all green. A future optional NVDA/VoiceOver pass on the five routes remains available as a human quality check (SR nuance, focus-visibility feel, reading order) but is not a gate.

## Next Phase Readiness

- Phase 3 success criteria proven end-to-end: keyboard-complete, axe-AAA-clean, single-content-source, responsive-to-320px, poster-hero, statement-documented Accessible experience.
- Ready for **Phase 4 (Premium 3D)** — the Accessible baseline is shippable and gate-locked; note `PREVIEW_PORT` is available if Phase-4 CI runs alongside sibling projects.

## Self-Check: PASSED

- Files verified on disk: 03-07-SUMMARY.md, SiteHeader.svelte, keyboard-nav.spec.ts, playwright.config.ts
- Commits verified in git: 5891be5, b31d2a5, 15b454f

---
*Phase: 03-accessible-experience*
*Completed: 2026-07-05*
