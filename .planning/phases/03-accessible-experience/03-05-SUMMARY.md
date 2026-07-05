---
phase: 03-accessible-experience
plan: 05
subsystem: ui
tags: [sveltekit, svelte5, routes, a11y, content-source, resolve, base-path]

# Dependency graph
requires:
  - phase: 03-04-content-components
    provides: Hero.svelte and ServiceCard.svelte (level/showBody props)
  - phase: 03-01-content-source-and-gates
    provides: src/lib/content/site.ts single content source + content-source gate
  - phase: 03-03-site-shell
    provides: layout shell (main landmark), resolve()-based nav
provides:
  - Home route (/) real content — hero + mission + 4-service overview + founder strip + Let's Connect CTA (CONT-01)
  - Services route (/services) real content — intro + 4 h2 service sections with descriptions (CONT-03)
affects: [03-06-about-contact-accessibility-routes, 03-07-integration-verify]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Route pages compose Wave-2 components and source ALL copy from site.ts (CONT-06)"
    - "ServiceCard heading level chosen per page (level=3 on Home under an h2, level=2 on Services under the h1) to keep heading order monotonic"
    - "Multi-CTA content asserted with .first() in e2e (a page may legitimately repeat a labelled CTA)"

key-files:
  created: []
  modified:
    - src/routes/+page.svelte
    - src/routes/services/+page.svelte
    - tests/content-routes.spec.ts

key-decisions:
  - "Service overviews rendered as a <ul>/<li> grid of ServiceCards for list semantics + responsive 1-col→2-col via --space tokens"
  - "Home CTA band uses aria-label=ctaPhrase (no extra heading) so the services section stays the only h2 group before the founder h2 — heading order clean"

patterns-established:
  - "Pattern: page markup holds zero literal copy — every string flows from the typed site.ts object"
  - "Pattern: internal links exclusively via resolve() for GitHub Pages base-path safety"

requirements-completed: [CONT-01, CONT-03]

# Metrics
duration: 20min
completed: 2026-07-05
---

# Phase 3 Plan 05: Home and Services Routes Summary

**Home (/) and Services (/services) rebuilt from Wave-1 stubs into real, single-h1, heading-clean pages that compose Hero + ServiceCard entirely from site.ts, with base-path-safe resolve() links.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-07-05T01:42:00Z
- **Completed:** 2026-07-05T02:01:41Z
- **Tasks:** 2
- **Files modified:** 3 (2 routes + 1 test locator fix)

## Accomplishments
- Home (CONT-01): Hero (single h1 + hero CTA), "Our mission" section, 4-service overview grid (ServiceCard level=3), founder credibility strip linking to /about, and a "Let's Connect" CTA band linking to /contact.
- Services (CONT-03): single `<h1>Services</h1>` + intro line + exactly four `<h2>` service sections (ServiceCard level=2, showBody) each with its fuller description and a "Let's Connect" link.
- All copy sourced from `site.ts`; every internal link via `resolve()`; zero hardcoded strings and zero base-breaking absolute links.
- Full content-routes + headings + a11y (axe wcag2a/aa/aaa) suites green across all 5 routes in both modes (20/20).

## Task Commits

Each task was committed atomically (`--no-verify`, parallel with 03-06):

1. **Task 1: Home route (CONT-01)** - `c51450c` (feat) — includes the deviation test-locator fix
2. **Task 2: Services route (CONT-03)** - `7c7a348` (feat)

**Plan metadata:** see final docs commit.

## Files Created/Modified
- `src/routes/+page.svelte` - Home page: Hero + mission + services overview (4× ServiceCard level=3) + founder strip + CTA band; tokens-only scoped styles.
- `src/routes/services/+page.svelte` - Services page: h1 + intro + 4× ServiceCard level=2 showBody in a responsive `<ul>` grid.
- `tests/content-routes.spec.ts` - Home "Let's Connect" assertion changed to `.first()` (deviation, see below).

## Decisions Made
- Service overviews use `<ul>/<li>` list semantics wrapping ServiceCards; responsive 1→2 column grid driven by `--space-*` tokens (mobile-first, ≥48rem breakpoint).
- Home CTA band carries `aria-label={site.contact.ctaPhrase}` and no heading, keeping the heading outline h1→h2(mission)→h2(services)→h3×4→h2(founder) with no skipped levels.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Home content test used a strict single-element locator against a multi-CTA page**
- **Found during:** Task 1 (Home route)
- **Issue:** The pre-existing `tests/content-routes.spec.ts` home test asserted `expect(getByRole('link', { name: /let'?s connect/i })).toBeVisible()`. This plan's designed Home (Hero CTA + 4 ServiceCard links + closing CTA band) legitimately renders 6 "Let's Connect" links, so the strict locator threw a Playwright strict-mode violation — a test-locator bug surfaced by the correct implementation, not a page defect.
- **Fix:** Appended `.first()` to the locator (the assertion's stated intent is "a Let's Connect CTA link is visible") and clarified the comment.
- **Files modified:** tests/content-routes.spec.ts
- **Verification:** `home (/) …` content test now passes; full suite 20/20 green.
- **Committed in:** c51450c (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minimal — a one-line e2e locator correction directly caused by the plan's own multi-CTA Home design. No scope creep; page markup unchanged by the fix.

## Issues Encountered
- None beyond the deviation above. `pnpm check` (0 errors), `pnpm build` (prerendered / and /services), and the content-source + raw-hex + review-marker gates all passed.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Home and Services are complete and machine-verified; ready for 03-07 cross-cutting e2e finalize.
- Runs cleanly alongside 03-06 (about/contact/accessibility) — those routes' content/heading/a11y tests were also green in this run.

## Self-Check: PASSED

- FOUND: src/routes/+page.svelte
- FOUND: src/routes/services/+page.svelte
- FOUND: tests/content-routes.spec.ts
- FOUND: .planning/phases/03-accessible-experience/03-05-SUMMARY.md
- FOUND commit: c51450c (Task 1 Home)
- FOUND commit: 7c7a348 (Task 2 Services)

---
*Phase: 03-accessible-experience*
*Completed: 2026-07-05*
