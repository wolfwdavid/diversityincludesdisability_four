# Phase 03 — Deferred Items

Out-of-scope discoveries logged during execution (not fixed in the originating plan).

## From 03-03 (site-shell)

### keyboard-nav.spec.ts — `aria-current` after mobile navigation (1 assertion)
- **File:** `tests/keyboard-nav.spec.ts:10` ("button toggles aria-expanded and navigation sets aria-current")
- **Symptom:** At 375px viewport, after clicking `About` and navigating, the spec re-queries
  `getByRole('link', { name: 'About' })` and asserts `aria-current="page"` — but the query returns
  no element.
- **Root cause (not a defect):** The mobile nav is an APG Disclosure that auto-closes on route
  change (RESEARCH Pattern 4 mandates `$effect(() => { page.url.pathname; open = false; })`). Once
  closed, the nav list is `display:none`, so the (correctly `aria-current`-flagged) `About` link is
  hidden and excluded from `getByRole`. `aria-current` IS applied correctly — the test simply reads
  it through a closed menu.
- **Why deferred:** The spec is owned by plan 03-02 (Wave 0); 03-03 runs in parallel and must not
  edit test files. The three A11Y-05 behaviors that matter — `aria-expanded` toggling, Escape closes
  + refocuses the button, and no keyboard trap — all pass. The plan's own gate (skip-links + targets)
  is fully green.
- **Suggested reconciliation (integration plan 03-07 or test owner):** assert `aria-current` at
  desktop width (where the nav is always visible), or re-open the menu before asserting, or assert on
  the hidden link with `{ includeHidden: true }` / an attribute selector rather than `getByRole`.
