---
phase: 02-mode-system-design-tokens
plan: 02
subsystem: ui
tags: [css-custom-properties, design-tokens, svelte5-runes, data-mode, wcag-aaa, no-flash, sveltekit-static]

# Dependency graph
requires:
  - phase: 01-foundation-deploy-proof
    provides: prerendered SvelteKit static scaffold, app.html shell, base-path Pages deploy
  - phase: 02 (plan 01)
    provides: raw-hex token gate (scripts/check-no-raw-hex.mjs), Playwright a11y/e2e harness (tests/*.spec.ts)
provides:
  - "tokens.css — verbatim UI-SPEC §4 AAA token contract for [data-mode=accessible] + [data-mode=premium], global :focus-visible ring, reduced-motion guard, companion base (.visually-hidden clip-rect, .skip-link)"
  - "app.html — static data-mode=accessible fallback + pre-paint no-flash inline script (stored → OS signal → premium) above %sveltekit.head%"
  - "mode.svelte.ts — SSR-safe Svelte 5 rune store (mode.current + mode.announcement $state, set(), toggle()) initialized from the html data-mode attribute"
affects: [02-03-toggle-layout-and-integration, phase-03-content-nav, phase-04-premium-3d]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single source of truth: html[data-mode] attribute drives all theming via [data-mode=...] CSS selectors (DS-02, one accessible DOM)"
    - "Pre-paint no-flash: synchronous inline head script above %sveltekit.head% sets data-mode before stylesheet parse; static accessible fallback for no-JS"
    - "Svelte 5 rune module store: exported const class instance with field-level $state, browser-guarded writes, initialized FROM the attribute (no hydration re-flip)"

key-files:
  created:
    - src/lib/styles/tokens.css
    - src/lib/stores/mode.svelte.ts
  modified:
    - src/app.html

key-decisions:
  - "Store initializes current FROM document.documentElement.dataset.mode — the inline script is the sole owner of priority (stored → OS → default), so the store can never disagree (no hydration re-flip)"
  - "Static data-mode=accessible on <html> guarantees a themed, gold-standard render with JS disabled; the inline script upgrades capable browsers pre-paint"

patterns-established:
  - "All raw hex confined to tokens.css (enforced by scripts/check-no-raw-hex.mjs); components consume semantic vars only"
  - "browser guard from $app/environment wraps every localStorage/matchMedia/document access for prerender safety"

requirements-completed: [DS-01, DS-02, MODE-02, MODE-03, MODE-04]

# Metrics
duration: 4min
completed: 2026-07-04
---

# Phase 2 Plan 02: Mode Engine Core (Tokens, app.html, Rune Store) Summary

**WCAG-AAA dual-mode token contract, a pre-paint no-flash `data-mode` script with a no-JS accessible fallback, and an SSR-safe Svelte 5 rune store that owns mode writes — the theming + persisted-state spine every later component reads from.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-07-04T22:25:14Z
- **Completed:** 2026-07-04T22:28:57Z
- **Tasks:** 3
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments
- `tokens.css` carries the verbatim UI-SPEC §4 AAA-verified two-mode token contract (both `[data-mode]` themes, global `:focus-visible`, reduced-motion guard) plus companion base (`.visually-hidden` clip-rect, `.skip-link`); raw-hex gate confines all hex here.
- `app.html` resolves the correct mode before first paint (stored choice → reduced-motion/contrast OS signal → premium default), with a static `data-mode="accessible"` fallback that keeps the no-JS render fully themed.
- `mode.svelte.ts` is an SSR-safe Svelte 5 rune store: reactive `current` + `announcement`, `set()` writes attribute + localStorage + announcement, `toggle()` flips modes, exported as a `const` instance (no `state_invalid_export`), all writes browser-guarded.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create tokens.css — UI-SPEC §4 verbatim + companion base** - `02da263` (feat)
2. **Task 2: Modify app.html — static fallback + verbatim inline no-flash script** - `0a36dca` (feat)
3. **Task 3: Create the Svelte 5 rune mode store** - `b6d0345` (feat)

**Plan metadata:** _(see final docs commit)_

## Files Created/Modified
- `src/lib/styles/tokens.css` - UI-SPEC §4 verbatim token contract for both modes + `:focus-visible` + reduced-motion + companion base (`.visually-hidden`, `.skip-link`, body/heading defaults).
- `src/app.html` - Static `data-mode="accessible"` on `<html>` + verbatim inline no-flash script above `%sveltekit.head%`; scaffold `text-scale` meta removed.
- `src/lib/stores/mode.svelte.ts` - Svelte 5 rune `ModeState` class instance; `current`/`announcement` `$state`, `set()`, `toggle()`, `initial()` reads the attribute, browser-guarded persistence.

## Decisions Made
- Store `current` initializes from `document.documentElement.dataset.mode` so the inline script remains the single owner of mode priority — eliminates hydration re-flip disagreements.
- Static `data-mode="accessible"` fallback chosen so a JS-disabled visitor still gets the gold-standard themed render (mission-critical for a disability-equity org).

## Deviations from Plan

None - plan executed exactly as written. All three files match the LOCKED UI-SPEC §4 / §6 and RESEARCH Example 1 sources verbatim.

## Issues Encountered

**TDD flow for the rune store (Task 3, `tdd="true"`):** The store's runtime behavior tests are the pre-existing Playwright e2e specs from Plan 01's harness (`tests/mode-toggle.spec.ts`, MODE-02/MODE-05), which the plan's own `<behavior>` block explicitly defers to green until Plan 03 wires the `ModeToggle` UI. No isolated unit harness exists (no vitest installed; Svelte runes require compilation). Per the plan, the store's verification gate for this plan is therefore `pnpm check` (svelte-check compiling the runes module), which passed with 0 errors. The deferred e2e specs turn green in Plan 03.

## User Setup Required

None - no external service configuration required.

## Verification Results
- `node scripts/check-no-raw-hex.mjs` → `OK: components use tokens, no raw hex` (all hex confined to tokens.css).
- `pnpm check` (svelte-kit sync + svelte-check) → **318 FILES, 0 ERRORS, 0 WARNINGS**.
- All task acceptance greps (data-mode selectors, hex spot-checks, focus-visible, reduced-motion, .visually-hidden clip-rect, script-before-head awk assertion, no text-scale, store export/state/$app-environment, no `export let`) passed.

## Next Phase Readiness
- Engine + tokens + persisted-state spine complete. Plan 03 wires `ModeToggle.svelte` + `+layout.svelte` (import tokens + fonts, header, persistent aria-live announcer, matchMedia listener) which exercises this store and turns the Plan 01 e2e/a11y specs green.
- No blockers.

## Self-Check: PASSED

All claimed files exist on disk (tokens.css, app.html, mode.svelte.ts, 02-02-SUMMARY.md) and all three task commits (`02da263`, `0a36dca`, `b6d0345`) are present in git history.

---
*Phase: 02-mode-system-design-tokens*
*Completed: 2026-07-04*
