---
phase: 03-accessible-experience
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - tests/a11y.spec.ts
  - tests/skip-links.spec.ts
  - tests/headings.spec.ts
  - tests/targets.spec.ts
  - tests/alt-text.spec.ts
  - tests/keyboard-nav.spec.ts
  - tests/content-routes.spec.ts
  - tests/responsive.spec.ts
autonomous: true
requirements: [A11Y-03]
must_haves:
  truths:
    - "The axe suite scans all 5 routes in both modes (incl wcag2aaa)"
    - "Every Phase-3 requirement has a named automated assertion authored before the code"
  artifacts:
    - path: "tests/a11y.spec.ts"
      provides: "Multi-route × multi-mode axe loop (A11Y-03/A11Y-02)"
      contains: "const ROUTES"
    - path: "tests/keyboard-nav.spec.ts"
      provides: "A11Y-05 disclosure + aria-current keyboard walk"
    - path: "tests/content-routes.spec.ts"
      provides: "CONT-01..05 + A11Y-07 + PREM-03 content presence, no <canvas>"
  key_links:
    - from: "tests/a11y.spec.ts"
      to: "all 5 routes"
      via: "ROUTES loop"
      pattern: "accessibility"
---

<objective>
Author the Wave 0 validation suite (Nyquist-first): extend the single-route axe spec to loop all five
routes × both modes, and add the targeted specs for skip links, heading order, target size, alt text,
keyboard nav / mobile disclosure, content presence, and 320–375px reflow. These specs are written NOW
against the LOCKED contract; they go RED until the components (Wave 2) and routes (Wave 3) land, then
drive those waves green.

Purpose: Every requirement becomes a named, automated assertion before any implementation.
Output: 1 extended + 7 new Playwright specs.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/03-accessible-experience/03-RESEARCH.md
@.planning/phases/03-accessible-experience/03-VALIDATION.md
@tests/a11y.spec.ts
@tests/mode-toggle.spec.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Multi-route axe loop + structural specs (skip-links, headings, targets, alt-text)</name>
  <files>tests/a11y.spec.ts, tests/skip-links.spec.ts, tests/headings.spec.ts, tests/targets.spec.ts, tests/alt-text.spec.ts</files>
  <read_first>
    - .planning/phases/03-accessible-experience/03-RESEARCH.md (§Validation Architecture — every spec skeleton is provided verbatim)
    - tests/a11y.spec.ts (current single-route form to extend)
    - tests/mode-toggle.spec.ts (boundingBox ≥44 + data-hydrated wait precedent)
  </read_first>
  <action>
    Define once (top of a11y.spec): `const ROUTES = ['/', '/about/', '/services/', '/contact/', '/accessibility/'] as const;`
    (trailingSlash is 'always') and `const MODES = ['accessible','premium'] as const;`

    - `tests/a11y.spec.ts` — REPLACE the single-`/` test with a nested `for (route of ROUTES) for (m of MODES)` loop.
      Seed `localStorage.setItem('did-mode', m)` via `addInitScript`, `goto(route)`, assert `html[data-mode=m]`, then
      `new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag2aaa','wcag21aa','wcag22aa']).analyze()` and
      `expect(violations).toEqual([])`. (Keep the wcag2aaa tag — it is the AAA gate.)
    - `tests/skip-links.spec.ts` — first `Tab` focuses a link with text /skip to main content/i and `href="#main"`;
      clicking it moves focus to `#main` (`await expect(page.locator('#main')).toBeFocused()`). Add a second assertion
      that a "Skip to navigation" link targeting `#nav` exists.
    - `tests/headings.spec.ts` — for each route: `expect(page.locator('h1')).toHaveCount(1)`, and the ordered list of
      heading levels never jumps more than +1 deeper (the RESEARCH skeleton).
    - `tests/targets.spec.ts` — for the nav toggle, mobile menu button, and each social link at viewport 375px,
      `boundingBox()` width & height ≥ 44 (extends the mode-toggle precedent).
    - `tests/alt-text.spec.ts` — for each route: `img:not([alt])` count is 0; every `a[rel~="me"]` (social link) has a
      non-empty accessible name (`aria-label` or visible text).
  </action>
  <acceptance_criteria>
    - `grep -q "const ROUTES" tests/a11y.spec.ts` and `grep -q "accessibility" tests/a11y.spec.ts`
    - `grep -q "wcag2aaa" tests/a11y.spec.ts`
    - `grep -q "#main" tests/skip-links.spec.ts` and `grep -q "#nav" tests/skip-links.spec.ts`
    - `grep -q "toHaveCount(1)" tests/headings.spec.ts`
    - `grep -q "boundingBox" tests/targets.spec.ts`
    - `grep -q "img:not(\[alt\])" tests/alt-text.spec.ts`
    - `npx playwright test --list` lists tests from all five files (syntax valid)
  </acceptance_criteria>
  <verify>
    <automated>npx playwright test --list tests/a11y.spec.ts tests/skip-links.spec.ts tests/headings.spec.ts tests/targets.spec.ts tests/alt-text.spec.ts</automated>
  </verify>
  <done>Five structural specs compile and are listable by Playwright; axe loop covers 5 routes × 2 modes incl wcag2aaa. (RED until Wave 2/3 — expected.)</done>
</task>

<task type="auto">
  <name>Task 2: Interaction + content specs (keyboard-nav, content-routes, responsive)</name>
  <files>tests/keyboard-nav.spec.ts, tests/content-routes.spec.ts, tests/responsive.spec.ts</files>
  <read_first>
    - .planning/phases/03-accessible-experience/03-RESEARCH.md (§Validation Architecture — keyboard/content/responsive skeletons + Pattern 3/4 for aria-current & disclosure)
    - tests/mode-toggle.spec.ts (data-hydrated wait pattern before interaction)
  </read_first>
  <action>
    - `tests/keyboard-nav.spec.ts` — viewport 375×800, `goto('/')`, wait `html[data-hydrated=true]`. The mobile menu
      button (`getByRole('button', { name: /menu/i })`) starts `aria-expanded="false"`; click → `"true"`; click an
      About link → URL matches `/\/about\/$/` and the About nav link then has `aria-current="page"`; reopen menu,
      press `Escape` → button returns to `aria-expanded="false"` and receives focus. No keyboard trap (Tab cycles through nav then out).
    - `tests/content-routes.spec.ts` — per-route content presence:
      • `/` — `.hero h1` visible, mission text present, exactly 4 service cards, a "Let's Connect" link; and `page.locator('canvas')` count is 0 (PREM-03: zero WebGL).
      • `/services/` — 4 `<h2>` service sections each with body text.
      • `/contact/` — `a[href^="mailto:emanrimawi@gmail.com"]` with a non-empty accessible name; 4 social links.
      • `/accessibility/` — text for conformance target, a feedback `mailto:`, and review cadence present.
      • `/about/` — the "About Eman Rimawi" h1 and body paragraphs present.
    - `tests/responsive.spec.ts` — for each route at viewport 320×720 and 375×800: `scrollWidth <= clientWidth`
      (no horizontal overflow), and at 375 the mobile menu button is visible.
  </action>
  <acceptance_criteria>
    - `grep -q "aria-expanded" tests/keyboard-nav.spec.ts` and `grep -q "Escape" tests/keyboard-nav.spec.ts`
    - `grep -q "aria-current" tests/keyboard-nav.spec.ts`
    - `grep -q "mailto:emanrimawi@gmail.com" tests/content-routes.spec.ts`
    - `grep -q "canvas" tests/content-routes.spec.ts`
    - `grep -q "scrollWidth" tests/responsive.spec.ts`
    - `npx playwright test --list` lists all three new files
  </acceptance_criteria>
  <verify>
    <automated>npx playwright test --list tests/keyboard-nav.spec.ts tests/content-routes.spec.ts tests/responsive.spec.ts</automated>
  </verify>
  <done>Three interaction/content specs compile and encode the CONT-01..05, A11Y-05/07, PREM-03, CONT-07 assertions. (RED until Wave 3.)</done>
</task>

</tasks>

<verification>
- `npx playwright test --list` enumerates all 8 spec files with no syntax errors.
- The axe loop references all 5 routes and both modes incl `wcag2aaa`.
</verification>

<success_criteria>
Every Phase-3 requirement maps to a named, listable automated assertion authored before the implementation waves.
</success_criteria>

<output>
After completion, create `.planning/phases/03-accessible-experience/03-02-SUMMARY.md`.
</output>
