---
phase: 03-accessible-experience
plan: 02
subsystem: validation
tags: [testing, playwright, axe, a11y, wave-0, nyquist]
requires: [tests/a11y.spec.ts, tests/mode-toggle.spec.ts]
provides:
  - "Multi-route x multi-mode axe loop (A11Y-03/A11Y-02)"
  - "Skip-link operation spec (A11Y-01)"
  - "Single-h1 + heading-order spec (A11Y-02)"
  - "Target-size spec (A11Y-04)"
  - "Alt-text / accessible-name spec (A11Y-06)"
  - "Keyboard-nav disclosure + aria-current spec (A11Y-05)"
  - "Per-route content-presence + zero-canvas spec (CONT-01..05, A11Y-07, PREM-03)"
  - "Reflow / no-horizontal-scroll spec (CONT-07)"
affects: [tests/]
tech-stack:
  added: []
  patterns:
    - "for (route of ROUTES) for (m of MODES) axe loop"
    - "data-hydrated wait before interaction (from mode-toggle precedent)"
    - "boundingBox >= 44 target-size assertion"
key-files:
  created:
    - tests/skip-links.spec.ts
    - tests/headings.spec.ts
    - tests/targets.spec.ts
    - tests/alt-text.spec.ts
    - tests/keyboard-nav.spec.ts
    - tests/content-routes.spec.ts
    - tests/responsive.spec.ts
  modified:
    - tests/a11y.spec.ts
decisions:
  - "Specs authored RED-first (Nyquist): they will fail until Waves 2-3 build the UI, then drive those waves green. Wave-1 acceptance is authored + listable, not green."
metrics:
  duration: 4.5
  completed: 2026-07-05
---

# Phase 3 Plan 02: Validation Specs Summary

Authored the Wave-0 Playwright/axe validation suite: extended the single-route axe spec into a
5-route x 2-mode loop (incl the `wcag2aaa` AAA gate) and added seven targeted specs so every
Phase-3 requirement is a named, listable automated assertion before any implementation lands.

## What Was Built

- **`tests/a11y.spec.ts`** (extended) — replaced the single-`/` axe test with a nested
  `for (route of ROUTES) for (m of MODES)` loop over `['/', '/about/', '/services/', '/contact/', '/accessibility/']`
  x `['accessible', 'premium']`, seeding `did-mode` via `addInitScript`, asserting `html[data-mode]`,
  then `AxeBuilder.withTags(['wcag2a','wcag2aa','wcag2aaa','wcag21aa','wcag22aa']).analyze()` → zero violations. (10 tests)
- **`tests/skip-links.spec.ts`** (A11Y-01) — first `Tab` focuses "Skip to main content" targeting `#main`;
  activating it focuses `#main`; a "Skip to navigation" link targets `#nav`.
- **`tests/headings.spec.ts`** (A11Y-02) — per route: exactly one `<h1>`; heading levels never jump more than +1 deeper.
- **`tests/targets.spec.ts`** (A11Y-04) — at 375px, mode toggle / mobile menu button / each social link have `boundingBox` ≥ 44×44.
- **`tests/alt-text.spec.ts`** (A11Y-06) — per route: zero `img:not([alt])`; every `a[rel~="me"]` has a non-empty accessible name.
- **`tests/keyboard-nav.spec.ts`** (A11Y-05) — mobile disclosure `aria-expanded` false→true, navigation sets `aria-current="page"`,
  `Escape` closes and restores focus to the button, and Tab escapes the nav (no keyboard trap).
- **`tests/content-routes.spec.ts`** (CONT-01..05, A11Y-07, PREM-03) — per-route content presence
  (hero/mission/4 cards/Connect CTA; About h1+paragraphs; 4 services h2+body; named `mailto:emanrimawi@gmail.com` + 4 socials;
  accessibility conformance target + feedback mailto + review cadence) and `canvas` count 0 on home.
- **`tests/responsive.spec.ts`** (CONT-07) — every route at 320px and 375px: `scrollWidth <= clientWidth`; menu button visible @375.

## Verification

- `pnpm exec playwright test --list` enumerates **57 tests in 11 files** with **no collection errors**.
- Task 1 files list: 26 tests across a11y/skip-links/headings/targets/alt-text.
- Task 2 files list: 23 tests across keyboard-nav/content-routes/responsive.
- All 14 acceptance grep gates from the plan pass (ROUTES, wcag2aaa, #main/#nav, toHaveCount(1),
  boundingBox, img:not([alt]), aria-expanded/Escape/aria-current, mailto:emanrimawi@gmail.com, canvas, scrollWidth).

These specs are **expected RED** — the routes (`/about/`, `/services/`, `/contact/`, `/accessibility/`),
mobile disclosure, skip links, and content components do not exist yet. Wave-1 acceptance is that they are
authored and collectable, not green; they drive Waves 2-3 to green.

## Parallel-Execution Notes

Ran in parallel with plan 03-01. Touched only `tests/` (8 spec files) — no edits to `src/lib/content`,
`scripts/`, or route files. All commits used `git commit --no-verify` to avoid pre-commit hooks racing 03-01.

## Deviations from Plan

None — plan executed exactly as written. Both tasks' actions, acceptance criteria, and verification
commands were followed verbatim against the RESEARCH §Validation Architecture skeletons.

## Commits

- `4d05021` test(03-02): multi-route axe loop + structural a11y specs (Task 1)
- `3d424c7` test(03-02): keyboard-nav, content-routes, and responsive specs (Task 2)

## Self-Check: PASSED

All 8 spec files + SUMMARY.md exist on disk; both task commits (4d05021, 3d424c7) present in git log.
