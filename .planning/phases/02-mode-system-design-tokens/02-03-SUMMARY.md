---
phase: 02-mode-system-design-tokens
plan: 03
subsystem: ui
tags: [svelte5, runes, aria-pressed, aria-live, fontsource, playwright, axe, adapter-static]

# Dependency graph
requires:
  - phase: 02-mode-system-design-tokens (Plan 02)
    provides: mode.svelte.ts rune store, tokens.css contract, app.html no-flash inline script
  - phase: 02-mode-system-design-tokens (Plan 01)
    provides: Playwright + axe toolchain, RED specs, raw-hex token gate
provides:
  - Native keyboard-operable ModeToggle (<button aria-pressed> >=44px, label+icon) in a header on every route
  - Layout shell: global token + self-hosted-font imports, crossorigin preloads, persistent aria-live announcer, live OS-signal matchMedia listener
  - Token-styled home page demonstrating both modes on one accessible DOM
  - Full Phase-2 validation green: 10/10 Playwright tests, axe zero-violations in both modes, all static gates
affects: [phase-03-content, phase-04-premium-3d, any-route-adding-shell]

# Tech tracking
tech-stack:
  added: [prettier config (.prettierrc/.prettierignore)]
  patterns:
    - "e2e runs against the adapter-static preview build (real shipped artifact), not the dev server"
    - "data-hydrated marker on <html> lets tests await real interactivity before interacting"
    - "attribute-flip mode switch via mode.toggle() (no navigation) preserves scroll + focus"

key-files:
  created:
    - src/lib/components/shell/ModeToggle.svelte
    - .prettierrc
    - .prettierignore
  modified:
    - src/routes/+layout.svelte
    - src/routes/+page.svelte
    - src/app.html
    - playwright.config.ts
    - tests/mode-toggle.spec.ts
    - src/lib/styles/tokens.css
    - eslint.config.js

key-decisions:
  - "Run e2e against `pnpm build && pnpm preview` (adapter-static output) instead of the dev server — dev-mode on-demand hydration is unreliable for interaction tests; preview exercises the shipped bundle"
  - "Expose data-hydrated on <html> in the layout so e2e can wait for the SPA to be interactive (removes harness-only click-before-hydration races)"
  - "Use resolve('/') from $app/paths for the brand link (satisfies svelte/no-navigation-without-resolve; base-path-correct)"
  - "Added missing prettier config (scaffold shipped none) so the lint gate can format .svelte files and pass"

patterns-established:
  - "Shell components live in src/lib/components/shell/ and consume the mode store via mode.current / mode.toggle() (never destructured)"
  - "No-flash inline comment must not contain %sveltekit.* placeholders (SvelteKit substitutes them everywhere, incl. comments)"

requirements-completed: [MODE-01, MODE-05, MODE-04, DS-02]

# Metrics
duration: 68min
completed: 2026-07-04
---

# Phase 2 Plan 03: Toggle, Layout & Integration Verify Summary

**Native aria-pressed ModeToggle wired into a per-route header with self-hosted fonts, a persistent aria-live announcer, and a live OS-signal listener — driving the full Phase-2 Playwright/axe suite from RED to 10/10 GREEN on one token-driven accessible DOM.**

## Performance

- **Duration:** 68 min
- **Started:** 2026-07-04T22:32:51Z
- **Completed:** 2026-07-04T23:40:47Z
- **Tasks:** 3
- **Files modified:** 10 (3 created, 7 modified)

## Accomplishments
- `ModeToggle.svelte`: native `<button type="button" aria-pressed>` (>=44px, label+icon, `stroke="currentColor"`) calling `mode.toggle()` — an attribute flip, not a navigation, so scroll + focus survive (MODE-01, MODE-05).
- `+layout.svelte`: global `tokens.css` + eight `@fontsource` latin-weight imports, two Vite-resolved `crossorigin` woff2 preloads, header with brand + toggle, a single `<main id="main">`, a persistent `role="status" aria-live="polite"` announcer bound to `mode.announcement`, and a browser-guarded `matchMedia` listener that auto-flips only absent an explicit stored choice (MODE-04 live half, DS-02).
- `+page.svelte`: token-styled hello-world content, no nested `<main>`, zero raw hex — both modes visibly demonstrable.
- Full integration gate green: `pnpm check` (0 errors), `pnpm lint`, `pnpm test:tokens`, `pnpm test:e2e` (10/10), and `pnpm build` under `BASE_PATH=/diversityincludesdisability_four` all pass. Both axe scans (incl. `wcag2aaa`) report zero violations.

## Task Commits

1. **Task 1: Create ModeToggle.svelte** - `51f7e77` (feat)
2. **Task 2: Wire +layout.svelte + restyle +page.svelte** - `21b0dde` (feat)
3. **Task 3: Integration gate — drive full suite green** - `32c61e7` (test)

_Task 3 absorbed the deviation fixes below (all committed in `32c61e7`)._

## Files Created/Modified
- `src/lib/components/shell/ModeToggle.svelte` - Native aria-pressed toggle button (created)
- `.prettierrc` / `.prettierignore` - Missing scaffold config; enables .svelte formatting + excludes .planning/lockfile (created)
- `src/routes/+layout.svelte` - Header + toggle + fonts + announcer + OS listener + `<title>` + `data-hydrated` marker
- `src/routes/+page.svelte` - Token-styled demo content, no nested `<main>`
- `src/app.html` - Reworded no-flash comment so it no longer contains `%sveltekit.head%`
- `playwright.config.ts` - webServer switched to `pnpm build && pnpm preview` (port 4173)
- `tests/mode-toggle.spec.ts` - Idempotent localStorage seeding + hydration wait (assertions unchanged)
- `src/lib/styles/tokens.css`, `eslint.config.js` - Prettier formatting only

## Decisions Made
- e2e targets the production preview build, not dev — reliable hydration + tests the real static artifact.
- `data-hydrated` marker added so tests await interactivity deterministically.
- `resolve('/')` used for base-path-correct, lint-clean internal linking.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] No-flash comment corrupted head injection & broke hydration**
- **Found during:** Task 3 (integration gate)
- **Issue:** The `app.html` no-flash comment literally contained `%sveltekit.head%`. SvelteKit substitutes that placeholder in *every* occurrence — including inside the comment — injecting `<link>`/`<style>`/`<!--…-->` markers that closed the comment early, spilled markup as visible text, and left the page unhydrated (the toggle click did nothing).
- **Fix:** Reworded the comment to not contain the placeholder. Confirmed via served HTML that head injection is clean and hydration works.
- **Files modified:** src/app.html
- **Verification:** `curl` of the served page shows an intact comment + working `%sveltekit.head%`; toggle flips `data-mode` post-hydration.
- **Committed in:** 32c61e7

**2. [Rule 2 - Missing Critical] Missing document `<title>` (axe violation)**
- **Found during:** Task 3
- **Issue:** axe `document-title` (serious) fired in both modes — no `<title>` anywhere.
- **Fix:** Added `<title>Diversity Includes Disability</title>` to the layout `<svelte:head>`.
- **Files modified:** src/routes/+layout.svelte
- **Verification:** axe zero-violations in both modes.
- **Committed in:** 32c61e7

**3. [Rule 3 - Blocking] Lint gate unusable (no prettier config; navigation rule)**
- **Found during:** Task 3
- **Issue:** The scaffold shipped no `.prettierrc`, so `prettier --check .` used defaults (couldn't parse `.svelte`, flagged 45 files against wrong style) and choked on `.planning`/lockfile; eslint also flagged `href="{base}/"` via `svelte/no-navigation-without-resolve`.
- **Fix:** Added `.prettierrc` (repo conventions) + `.prettierignore`; formatted the handful of real source files; switched the brand link to `resolve('/')`.
- **Files modified:** .prettierrc, .prettierignore, CLAUDE.md, eslint.config.js, tokens.css, +page.svelte, +layout.svelte
- **Verification:** `pnpm lint` exits 0.
- **Committed in:** 32c61e7

**4. [Rule 3 - Blocking] Dev-server hydration too slow for interaction e2e**
- **Found during:** Task 3
- **Issue:** Against `pnpm dev`, on-demand module compilation left the toggle handler unattached when Playwright clicked → lost interaction.
- **Fix:** Pointed the Playwright webServer at the adapter-static preview build (`pnpm build && pnpm preview`), added a `data-hydrated` marker the tests await. Also aligns e2e with the shipped artifact.
- **Files modified:** playwright.config.ts, src/routes/+layout.svelte, tests/mode-toggle.spec.ts
- **Verification:** 10/10 e2e green.
- **Committed in:** 32c61e7

**5. [Rule 1 - Bug] Two genuinely-wrong test setups (assertions preserved)**
- **Found during:** Task 3
- **Issue:** (a) `page.addInitScript` re-runs on `page.reload()`, clobbering the persisted `premium` back to `accessible` and failing the persistence assertion; (b) the announce test relied on the runner's ambient `prefers-*` defaults (premium here), so clicking produced "Accessible mode on" instead of the expected `/premium/i`. A step-by-step trace proved the implementation is correct (click → premium, localStorage → premium; only the reload's re-seed reverted it).
- **Fix:** Guarded the init-script seed so it only sets when unset (survives reload); seeded a deterministic `accessible` start for the announce test. No assertion weakened — every original expectation remains.
- **Files modified:** tests/mode-toggle.spec.ts
- **Verification:** Both toggle tests pass; standalone traces confirm real persistence + announce behavior.
- **Committed in:** 32c61e7

---

**Total deviations:** 5 auto-fixed (2 bugs, 1 missing-critical, 2 blocking)
**Impact on plan:** All fixes were on the critical path to the integration gate. Deviations 1-3 fixed pre-existing/scaffold defects surfaced by this wave; 4-5 made the e2e harness exercise real interactivity without weakening any assertion. No scope creep — no DID content or 3D added (Phases 3-4).

## Issues Encountered
- Playwright `list` reporter piped through `tail` buffers until exit; switched to file redirection + until-loop monitoring to read incremental results.
- Extended debugging isolated the toggle failure to three distinct causes (head corruption, reload re-seed, ambient-media default) rather than the initially-suspected hydration race — confirmed each with targeted standalone Playwright traces before touching code.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 2 engine fully proven by command: mode toggle, persistence, no-flash, OS auto-select, announce, AAA contrast, self-hosted fonts. Ready for `/gsd:verify-work`.
- Phase 3 can build real DID content on the existing single `<main>` shell; the header/toggle/announcer are route-global.
- Note for Phase 3+: keep the e2e webServer on the preview build for any new interaction tests; add per-route `<title>`s as content lands.

---
*Phase: 02-mode-system-design-tokens*
*Completed: 2026-07-04*

## Self-Check: PASSED
- All created/modified files verified present (ModeToggle.svelte, +layout.svelte, +page.svelte, .prettierrc, .prettierignore, SUMMARY.md).
- All task commits verified in git history (51f7e77, 21b0dde, 32c61e7).
- No stubs: home content is minimal-by-design (Phase-2 engine proof); documented for Phase 3 in the plan, not a data stub.
