---
phase: 03-accessible-experience
plan: 01
subsystem: ui
tags: [sveltekit, typescript, content-source, a11y, ci-gates, prerender, github-pages]

# Dependency graph
requires:
  - phase: 02-mode-system-design-tokens
    provides: token contract, mode store, +layout shell, prerender/base-path config
provides:
  - Single typed content source src/lib/content/site.ts (CONT-06) holding all site copy
  - check-content-source.mjs gate (pages import site.ts; no hardcoded absolute internal href)
  - check-review-markers.mjs gate ([REVIEW] must never reach built HTML)
  - package.json test chain wired: content grep before build, review grep after build
  - Placeholder route stubs for /about /services /contact /accessibility so crawler-strict build stays green
affects: [03-03-site-shell, 03-04-content-components, 03-05-home-and-services-routes, 03-06-about-contact-accessibility-routes, 03-07-integration-verify]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Typed single content source (site.ts as-const + satisfies ServiceItem[]/SocialItem[])"
    - "[REVIEW] authenticity markers live only as TS comments, never in rendered strings"
    - "Node fs-walker CI gates (Windows/pnpm-safe, no rg/bash), modeled on check-no-raw-hex.mjs"
    - "Cross-wave placeholder stubs to keep prerender.entries:['*'] + handleHttpError:'fail' green"

key-files:
  created:
    - src/lib/content/site.ts
    - scripts/check-content-source.mjs
    - scripts/check-review-markers.mjs
    - src/routes/about/+page.svelte
    - src/routes/services/+page.svelte
    - src/routes/contact/+page.svelte
    - src/routes/accessibility/+page.svelte
  modified:
    - package.json
    - src/routes/+page.svelte

key-decisions:
  - "Social hrefs are '#' placeholders (not empty string) to avoid a11y empty-href flags until real URLs confirmed"
  - "about.pullQuote typed `undefined as string | undefined` so pages omit it until Eman provides a real quote"
  - "Content grep runs before build, review grep after build, so both fail fast in the correct order"
  - "Minimally wired the existing Home page to import site.ts so the new content-source gate passes (Home fully rewritten in Wave 3 / 03-05)"

patterns-established:
  - "CONT-06 single source: every route +page.svelte must import '$lib/content/site'"
  - "Authenticity: [REVIEW] markers are code comments only; build gate blocks any leak to HTML"
  - "Base-path safety: no literal href=\"/ in .svelte source; internal links use resolve()"

requirements-completed: [CONT-06]

# Metrics
duration: 7min
completed: 2026-07-05
---

# Phase 3 Plan 01: Content Source and Gates Summary

**Typed single content source (`site.ts`, CONT-06) holding all DID copy, plus two Node CI grep gates (content-source + review-marker) and four placeholder route stubs that keep the crawler-strict static build green from Wave 2 onward.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-07-05T00:54:39Z
- **Completed:** 2026-07-05T01:01:15Z
- **Tasks:** 3
- **Files modified:** 9 (7 created, 2 modified)

## Accomplishments
- Authored `src/lib/content/site.ts` — one typed as-const module with every user-visible string (home, about, services, servicesIntro, contact/contactIntro, four social links, full accessibility statement), all copy sourced from the locked CONTEXT draft with zero invented specifics.
- Built two Windows/pnpm-safe Node fs-walker gates: `check-content-source.mjs` (pages must import site.ts; no hardcoded absolute internal `href="/`) and `check-review-markers.mjs` (fails if `[REVIEW` reaches `build/**/*.html`).
- Wired both into `package.json`: `test:content` + `test:review`, with content grep before `pnpm build` and review grep after, inside the full `test` chain.
- Laid down four placeholder route stubs (/about, /services, /contact, /accessibility), each importing site.ts and rendering a single `<h1>`, so `pnpm build` prerenders all five routes and the shell's nav/footer links resolve continuously from Wave 2.

## Task Commits

Each task was committed atomically:

1. **Task 1: Author typed content source site.ts** - `06375ba` (feat)
2. **Task 2: Content-source + review-marker gates and package.json wiring** - `719a6d8` (feat)
3. **Task 3: Placeholder route stubs for four not-yet-built routes** - `a718250` (feat)

**Plan metadata:** (see final docs commit)

## Files Created/Modified
- `src/lib/content/site.ts` - Single typed content source (CONT-06): interfaces + `site` as-const with all copy
- `scripts/check-content-source.mjs` - CONT-06 + base-path gate (pages import site.ts; no `href="/`)
- `scripts/check-review-markers.mjs` - Build gate: no `[REVIEW` in built HTML
- `src/routes/about/+page.svelte` - Wave-1 stub (imports site, one h1); overwritten 03-06
- `src/routes/services/+page.svelte` - Wave-1 stub; overwritten 03-05
- `src/routes/contact/+page.svelte` - Wave-1 stub; overwritten 03-06
- `src/routes/accessibility/+page.svelte` - Wave-1 stub; overwritten 03-06
- `package.json` - Added `test:content`/`test:review`, rewired `test` chain
- `src/routes/+page.svelte` - Home now imports site.ts (deviation, see below)

## Decisions Made
- Social hrefs use `'#'` placeholders (not empty string) so a11y rules don't flag empty href; replaced with real URLs when confirmed.
- `about.pullQuote` typed `undefined as string | undefined` so the pull-quote block is omitted until a real quote is provided (no invented quote).
- Content grep runs before build (source-only, fast fail) and review grep after build (needs HTML), preserving correct gate ordering.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Wired the existing Home page to import site.ts**
- **Found during:** Task 2 (content-source gate)
- **Issue:** `check-content-source.mjs` fails any `src/routes/**/+page.svelte` that does not import `content/site`. The pre-existing Home page (`src/routes/+page.svelte`, a Phase-2 mode-demo) had no such import, so the new gate — whose Task 2 acceptance requires it to exit 0 on the current tree — would have failed immediately.
- **Fix:** Added `import { site } from '$lib/content/site';` and rendered the `<h1>` from `site.home.heroHeadline`, keeping the page otherwise minimal.
- **Files modified:** src/routes/+page.svelte
- **Verification:** `node scripts/check-content-source.mjs` exits 0; `pnpm check` 0 errors; build prerenders home.
- **Committed in:** `719a6d8` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for the Task 2 gate to pass on the current tree. Change is minimal and directly in scope (CONT-06); Home is fully rewritten in Wave 3 (03-05). No scope creep.

## Issues Encountered
None.

## Known Stubs

The four route stubs are intentional Wave-1 placeholders, documented in the plan:
- `src/routes/services/+page.svelte` — single `<h1>Services</h1>` + servicesIntro line; overwritten with the real accessible /services page in **03-05** (Wave 3).
- `src/routes/about/+page.svelte`, `src/routes/contact/+page.svelte`, `src/routes/accessibility/+page.svelte` — single-h1 stubs; overwritten with real accessible content in **03-06** (Wave 3).

Each stub imports `site.ts` and renders real sourced copy (no invented data, no `[REVIEW]`, no hardcoded links). They exist so the crawler-strict build (`prerender.entries:['*']`, `handleHttpError:'fail'`) resolves the shell's nav/footer links from Wave 2 onward. This is an intentional cross-wave overwrite, not a same-wave collision.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Content source and gates are in place: every Wave 2/3 page can import `site` and every commit is guarded against copy drift, hardcoded base-breaking links, and leaked `[REVIEW]` markers.
- All five routes prerender, so 03-03 (site shell) can add nav + footer links to all four secondary routes without hard-failing the build.
- Runs in parallel with 03-02 (validation specs, tests/ only) — no file overlap.

## Self-Check: PASSED

All 8 created/modified files verified present on disk; all 3 task commits (`06375ba`, `719a6d8`, `a718250`) verified in git history.

---
*Phase: 03-accessible-experience*
*Completed: 2026-07-05*
