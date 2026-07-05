---
phase: 03-accessible-experience
plan: 03
subsystem: ui
tags: [svelte5, sveltekit, accessibility, apg-disclosure, aria-current, skip-links, landmarks, resolve]

# Dependency graph
requires:
  - phase: 03-01 (content-source-and-gates)
    provides: src/lib/content/site.ts (nav-free but org/founder/contact/social), check-content-source + check-no-raw-hex gates, placeholder route stubs
  - phase: 02 (mode-system-design-tokens)
    provides: tokens.css (.skip-link, .visually-hidden, :focus-visible, reduced-motion), mode store, ModeToggle.svelte, app.html no-flash script
provides:
  - SkipLinks (A11Y-01 two visible-on-focus bypass links)
  - SiteHeader (persistent labeled nav, resolve() base-safe links, aria-current via page.route.id, APG mobile disclosure with aria-expanded + Escape, ModeToggle)
  - SocialLinks (CONT-05 named icon+text links from site.ts)
  - SiteFooter (mailto contact, SocialLinks, accessibility-statement link, dynamic copyright)
  - Extended +layout.svelte composing the one-per-route header/nav/main#main/footer landmark set (A11Y-02)
affects: [03-04 content-components, 03-05 home-and-services-routes, 03-06 about-contact-accessibility-routes, 03-07 integration-verify]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "APG Disclosure mobile nav: single native <button aria-expanded>/aria-controls, Escape closes + refocuses, auto-close on route change, no focus trap"
    - "aria-current='page' via page.route.id from $app/state (base- and trailing-slash-independent), omitted (undefined) on inactive links"
    - "resolve() from $app/paths for every internal link; external mailto/social used as-is"
    - "Landmarks composed in +layout.svelte; shell components own their scoped token-only styles"

key-files:
  created:
    - src/lib/components/shell/SkipLinks.svelte
    - src/lib/components/shell/SiteHeader.svelte
    - src/lib/components/SocialLinks.svelte
    - src/lib/components/shell/SiteFooter.svelte
  modified:
    - src/routes/+layout.svelte

key-decisions:
  - "Escape handler lives on the wrapper enclosing BOTH the toggle button and <nav> (not on <nav> alone) so Escape closes the menu when focus is on the button after opening it"
  - "Instagram glyph drawn with stroke primitives (rect+circle+dot); Facebook/X/LinkedIn as filled currentColor paths — inline SVG only, no icon library"
  - "Footer <footer> labeled aria-label='Site'; footer meta links wrapped in an aria-label='Footer' nav"

patterns-established:
  - "Pattern: mobile-first disclosure nav — list display:none until .open on mobile, flex bar + hidden toggle at min-width:48rem"
  - "Pattern: >=44px interactive targets enforced in each shell component's scoped styles (A11Y-04)"

requirements-completed: [A11Y-01, A11Y-02, A11Y-04, A11Y-05, CONT-05, CONT-07]

# Metrics
duration: 29min
completed: 2026-07-05
---

# Phase 3 Plan 3: Site Shell Summary

**Accessible semantic shell — SkipLinks + APG-disclosure SiteHeader (resolve() nav, aria-current via page.route.id, ModeToggle) + named SocialLinks + landmark SiteFooter, composed into one header/nav/main#main/footer set per route.**

## Performance

- **Duration:** 29 min
- **Started:** 2026-07-05T01:05:27Z
- **Completed:** 2026-07-05T01:34:53Z
- **Tasks:** 3
- **Files modified:** 5 (4 created, 1 extended)

## Accomplishments
- `SkipLinks` — two visible-on-focus bypass links (`#main`, `#nav`), first in DOM (A11Y-01).
- `SiteHeader` — labeled primary `<nav>`, base-path-safe `resolve()` links, `aria-current="page"` via `page.route.id`, APG mobile disclosure (`aria-expanded`/`aria-controls`, Escape closes + refocuses, auto-close on route change, no trap), embedded `ModeToggle`, ≥44px targets — token-only styles.
- `SocialLinks` — four named icon+text links from `site.ts` (`rel="me noopener"`, `aria-label` accessible name + visible `{s.name}`), inline SVG glyphs, ≥44px targets (CONT-05).
- `SiteFooter` — labeled landmark with visible `mailto:` contact, `SocialLinks`, accessibility-statement link via `resolve('/accessibility')`, and copyright with year computed at render.
- `+layout.svelte` composes `SkipLinks → SiteHeader → main#main(tabindex=-1) → SiteFooter → persistent mode announcer` (A11Y-02); brand/header/toggle markup migrated out of the layout into `SiteHeader`.

## Task Commits

Each task was committed atomically (`--no-verify`, per parallel-execution instruction):

1. **Task 1: SkipLinks + SiteHeader** - `ce22098` (feat)
2. **Task 2: SocialLinks + SiteFooter** - `579a2a7` (feat)
3. **Task 3: +layout.svelte shell composition (+ Escape auto-fix)** - `a5e33d4` (feat)

**Plan metadata:** _(this SUMMARY + STATE/ROADMAP)_

## Files Created/Modified
- `src/lib/components/shell/SkipLinks.svelte` - two `.skip-link` bypass anchors (A11Y-01).
- `src/lib/components/shell/SiteHeader.svelte` - header landmark: brand link, disclosure nav, aria-current, ModeToggle.
- `src/lib/components/SocialLinks.svelte` - named icon+text social links from `site.ts` (CONT-05).
- `src/lib/components/shell/SiteFooter.svelte` - footer landmark: mailto, social, a11y-statement link, dynamic ©.
- `src/routes/+layout.svelte` - extended into the shell composition; kept fonts/head/OS-change $effect/announcer.

## Decisions Made
- **Escape handler placement:** moved from `<nav>` to the wrapper containing both the toggle button and the nav. After opening the menu, focus sits on the button (a sibling *outside* `<nav>`), so a nav-scoped listener never saw the keydown. This was an auto-fix (see Deviations).
- **Icon strategy:** inline SVG only (matches `ModeToggle`); Instagram uses stroke primitives, others filled `currentColor` paths — no icon dependency.
- **Footer labeling:** `<footer aria-label="Site">` plus an inner `<nav aria-label="Footer">` for the meta link, keeping repeated landmarks distinguishable.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Escape did not close the mobile menu when focus was on the toggle button**
- **Found during:** Task 3 (verifying against `tests/keyboard-nav.spec.ts`)
- **Issue:** The plan (and RESEARCH Pattern 4) put `onkeydown` on `<nav>`. But opening the menu leaves focus on the toggle `<button>`, which is a sibling *outside* `<nav>`, so the keydown never reached the handler and `aria-expanded` stayed `true` on Escape — violating A11Y-05 (Escape closes).
- **Fix:** Moved the `onkeydown={onKeydown}` listener to the `.header-actions` wrapper that encloses both the button and the nav (with an `a11y_no_static_element_interactions` svelte-ignore, since the div is a passive event container); removed the redundant nav-scoped listener.
- **Files modified:** `src/lib/components/shell/SiteHeader.svelte`
- **Verification:** `tests/keyboard-nav.spec.ts` "Escape closes the menu and restores focus to the button" now passes; `pnpm check` stays at 0 warnings.
- **Committed in:** `a5e33d4` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The fix is required for A11Y-05 correctness; no scope creep.

## Deferred Issues

**keyboard-nav.spec.ts — `aria-current` after mobile navigation (1 of 3 assertions red).** At 375px, the spec navigates to `/about` then re-queries the `About` link and asserts `aria-current="page"`; but the APG-mandated auto-close-on-route-change (RESEARCH Pattern 4) hides the mobile menu, so the (correctly flagged) link is `display:none` and excluded from `getByRole`. `aria-current` IS applied correctly — the assertion just reads it through a closed menu. The spec is owned by plan 03-02 (Wave 0) and must not be edited by this parallel plan. Logged to `.planning/phases/03-accessible-experience/deferred-items.md` with reconciliation options for the integration plan (03-07). The three A11Y-05 behaviors that matter — `aria-expanded` toggling, Escape closes + refocus, no keyboard trap — all pass.

## Known Stubs
None introduced by this plan. `site.social[*].href` are `#` placeholders and social/bio URLs remain `[REVIEW]` — these predate 03-03 (owned by 03-01/content) and are intentional pending Eman's confirmation, honestly surfaced in the Accessibility Statement's known-issues.

## Issues Encountered
- **Playwright port-4173 collision:** the first spec run reported foreign markup (`theme-toggle`/`data-theme`/"Theme: Premium") — a stale `pnpm preview` server from a *different* project was squatting on port 4173, and `reuseExistingServer: !CI` made Playwright connect to it instead of building this site. Resolved by killing the stale listener (PID via `netstat.exe`/`taskkill.exe`), then building + serving this project's own preview and re-running — all 6 required specs (skip-links ×3, targets ×3) then passed. Also fixed a Git-Bash MSYS path-mangling issue: `BASE_PATH=/diversityincludesdisability_four` was rewritten to a Windows path; prefix with `MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*'` for base-path builds.

## Verification
- `pnpm check` — 341 files, 0 errors, 0 warnings.
- `node scripts/check-no-raw-hex.mjs` — OK (tokens only).
- `node scripts/check-content-source.mjs` — OK (no hardcoded base-breaking links).
- `pnpm build` (BASE_PATH set) — all 5 routes prerendered, `Wrote site to "build"`.
- `tests/skip-links.spec.ts` (3/3) + `tests/targets.spec.ts` (3/3) — green (the plan's Task 3 gate).
- `tests/keyboard-nav.spec.ts` — 2/3 green (Escape + no-trap pass); 1 deferred (see above).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The semantic shell is ready for all route content: 03-04 (Hero/ServiceCard — touched in parallel), 03-05/06 (route pages) compose into `main#main`.
- Social/bio/founder-title/pull-quote URLs remain `[REVIEW]` pending Eman's confirmation.
- Integration plan (03-07) should reconcile the one deferred keyboard-nav assertion with the auto-close behavior.

## Self-Check: PASSED

All 4 created components + extended layout + this SUMMARY exist on disk; all three task commits (`ce22098`, `579a2a7`, `a5e33d4`) present in git history.

---
*Phase: 03-accessible-experience*
*Completed: 2026-07-05*
