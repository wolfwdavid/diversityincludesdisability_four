---
phase: 05-launch-hardening
plan: 01
subsystem: seo
tags: [sveltekit, seo, open-graph, twitter-card, canonical, adapter-static, playwright]

# Dependency graph
requires:
  - phase: 01-foundation-deploy-proof
    provides: adapter-static + base path + paths.relative=false (absolute base-prefixed prerendered URLs)
  - phase: 03
    provides: site.ts single content source (CONT-06) + 5 routes with verified copy
provides:
  - Reusable <Seo> component composing absolute canonical/OG/Twitter head from ${site.url}${base}${path}
  - site.url origin constant + 5-entry seo{title,description} map in site.ts
  - Per-route <Seo> on all 5 pages; layout no longer owns the title
  - tests/seo.spec.ts (per-route head e2e) + scripts/check-seo-meta.mjs (BASE_PATH build-grep gate)
affects: [05-02-og-image, 05-03-lighthouse-smoke, 05-04-ci-gate, 05-05-launch-verify]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Absolute SEO URLs composed from constants (site.url + base + explicit path), never from runtime page.url — immune to static-adapter prerender pathname quirks"
    - "Split SEO validation: e2e asserts tag presence + origin+path in base-less preview; BASE_PATH build-grep asserts the repo segment in the actual artifact"

key-files:
  created:
    - src/lib/components/Seo.svelte
    - tests/seo.spec.ts
    - scripts/check-seo-meta.mjs
  modified:
    - src/lib/content/site.ts
    - src/routes/+layout.svelte
    - src/routes/+page.svelte
    - src/routes/about/+page.svelte
    - src/routes/services/+page.svelte
    - src/routes/contact/+page.svelte
    - src/routes/accessibility/+page.svelte
    - package.json

key-decisions:
  - "SEO descriptions are paraphrases of existing verified site.ts copy (heroSubhead/about.para1/servicesIntro/contactIntro/a11yStatement) — no invented facts, content-authenticity rule honored"
  - "Home <title> is the bare org name; inner pages get 'Page | Org' — Seo owns the title, layout title removed"
  - "og:image references /og-image.png by absolute URL; the asset itself is delivered by parallel plan 05-02"

patterns-established:
  - "Constant-based absolute-URL SEO: ${site.url}${base}${path} for canonical/og:url, ${site.url}${base}/og-image.png for the image"
  - "PREVIEW_PORT isolation required for local e2e: reuseExistingServer can otherwise reuse a sibling diversityincludesdisability_* preview on 4173"

requirements-completed: [SEO-01]

# Metrics
duration: 22min
completed: 2026-07-05
---

# Phase 5 Plan 1: SEO Meta Component and Routes Summary

**Reusable `<Seo>` component bakes absolute-URL canonical/Open Graph/Twitter tags into every prerendered route from `${site.url}${base}${path}` constants, with a per-route head e2e and a BASE_PATH build-grep gate.**

## Performance

- **Duration:** ~22 min
- **Started:** 2026-07-05T09:45Z (approx)
- **Completed:** 2026-07-05T10:07Z (approx)
- **Tasks:** 3
- **Files modified:** 11 (3 created, 8 modified)

## Accomplishments
- `Seo.svelte`: a single reusable `<svelte:head>` component emitting title, meta description, canonical, full Open Graph set (type/site_name/title/description/url/image + width/height/alt) and Twitter `summary_large_image` card — all absolute, base-path-aware, composed from constants (never runtime page.url).
- `site.ts`: added `url` origin constant + a 5-entry `seo{title,description}` map paraphrased from existing verified copy.
- Wired `<Seo>` as the first element on all 5 routes with each route's unique trailingSlash-`always` path; removed the hardcoded `<title>` from `+layout.svelte`.
- Validation: `tests/seo.spec.ts` (5/5 route head assertions green in preview) + `scripts/check-seo-meta.mjs` (BASE_PATH build-grep proving `https://wolfwdavid.github.io/diversityincludesdisability_four/...` canonical/OG/Twitter on all 5 routes), both wired into `package.json`.

## Task Commits

Each task was committed atomically:

1. **Task 1: url + seo map in site.ts and Seo.svelte** - `459cf31` (feat)
2. **Task 2: wire Seo into all 5 routes, remove layout title** - `6cf09d3` (feat)
3. **Task 3: seo.spec.ts + check-seo-meta.mjs + package.json scripts** - `e3742dd` (test)

## Files Created/Modified
- `src/lib/components/Seo.svelte` - Reusable per-route head: title/description/canonical/OG/Twitter from constants
- `src/lib/content/site.ts` - Added `url` origin constant + 5-entry `seo` map
- `src/routes/+layout.svelte` - Removed hardcoded `<title>` (Seo now owns it)
- `src/routes/+page.svelte`, `about/`, `services/`, `contact/`, `accessibility/+page.svelte` - Added `<Seo>` with unique path
- `tests/seo.spec.ts` - Per-route head presence/correctness e2e (5 routes)
- `scripts/check-seo-meta.mjs` - BASE_PATH build-artifact grep for absolute base-path canonical/OG/Twitter
- `package.json` - Added `test:seo` + `test:seo:build` scripts

## Decisions Made
- SEO descriptions paraphrase existing verified copy only (no invented claims); content-source, raw-hex, and review-marker gates all stay green.
- Home title is the bare org name; inner pages use `Page | Org`.
- Kept `Seo.svelte` verbatim to the research/plan contract (matches the e2e assertions); the 3 svelte-check `state_referenced_locally` warnings are benign here — SEO props are static per prerendered page and never mutate, so capturing the initial value is exactly correct. Zero type errors.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- **Empty-title e2e failure on first run:** `pnpm test:seo` initially returned empty titles because `reuseExistingServer` (local) reused a sibling `diversityincludesdisability_*` project's leftover preview on the shared default port 4173 (a documented hazard in STATE). Resolved by running with an isolated `PREVIEW_PORT=4191` serving this project's own build — 5/5 then passed. This is an environment/coordination issue, not a code defect; no source change needed.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- SEO head is complete and gated. `og:image` points at `/og-image.png`; the asset is delivered by parallel plan **05-02** (which owns `static/`). Once 05-02 lands, the OG image resolves under the base path; the smoke check in 05-03 will confirm it returns 200 live.
- `test:seo` (preview) and `test:seo:build` (BASE_PATH grep) are ready to fold into the CI `verify` gate (05-04).

## Known Stubs
None. `og:image` intentionally references `/og-image.png`, whose asset file is delivered by parallel plan 05-02 (per this plan's scope split); the meta tag and absolute-URL composition are fully implemented and tested here.

## Self-Check: PASSED

All created files exist (Seo.svelte, tests/seo.spec.ts, scripts/check-seo-meta.mjs, 05-01-SUMMARY.md) and all task commits (459cf31, 6cf09d3, e3742dd) are present in git history.

---
*Phase: 05-launch-hardening*
*Completed: 2026-07-05*
