---
phase: 06-engagement-surfaces
plan: 03
subsystem: ui
tags: [media-section, podcasts, accessibility, svelte5-runes, self-omitting, vitest, single-content-source]

# Dependency graph
requires:
  - phase: 06-01
    provides: "vitest + jsdom + @testing-library/svelte harness; vitest.config includes tests/unit/**; default playwright config testIgnore excludes tests/unit/**"
provides:
  - "PodcastItem interface + empty typed podcasts list + mediaHeading copy in site.ts (single content source)"
  - "Self-omitting MediaSection.svelte (renders nothing on empty list; accessible-named links + descriptions when populated)"
  - "About page renders MediaSection below the pull-quote (inert while podcasts empty)"
  - "Default-build e2e proving no media section on /about; vitest spec proving both data branches"
affects: [06-04-integration-drive-green, phase-07-content]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Self-omitting data-driven section: {#if items.length} guards the entire landmark so an empty list yields no heading/section/shell (no empty state)"
    - "Fixture-injectable component: items prop defaults to site.podcasts for live render, overridable by vitest to prove the populated branch without page data"
    - "Single content source: media heading text lives in site.mediaHeading, never hardcoded in the component"
    - "External off-site URLs use literal href={item.url} + eslint-disable svelte/no-navigation-without-resolve (SocialLinks precedent) — never base-resolved"

key-files:
  created:
    - src/lib/components/MediaSection.svelte
    - tests/media-section.spec.ts
    - tests/unit/media-section.spec.ts
  modified:
    - src/lib/content/site.ts
    - src/routes/about/+page.svelte

key-decisions:
  - "podcasts ships as an empty typed list ([] satisfies PodcastItem[] as PodcastItem[]) so the section self-omits now; real appearances are a Phase-7-adjacent content edit — invent none"
  - "site.ts co-edited this wave in disjoint keys: 06-03 owns PodcastItem/podcasts/mediaHeading; contactForm/contactSuccess (06-02) left untouched"
  - "mediaHeading text ('Media & Podcasts') satisfies the specs' /media/i heading match and keeps heading copy in the single content source"

patterns-established:
  - "Section-on-About over a new /media route (RESEARCH Pattern 4) — no route churn, keeps the 5-route SEO/axe arrays untouched"
  - "TDD RED→GREEN across a vitest data-branch spec (populated + empty) plus a default-build e2e (omitted-while-empty)"

requirements-completed: [ENGAGE-03]

# Metrics
duration: 12min
completed: 2026-07-06
---

# Phase 6 Plan 03: Media Section and About Summary

**A typed, single-sourced podcast/media list plus a self-omitting `MediaSection` on the About page — renders nothing while the list is empty (no shell) and accessible-named links with descriptions when populated, proven on both branches (default-build e2e + vitest fixture).**

## Performance

- **Duration:** 12 min
- **Tasks:** 2
- **Files:** 5 (3 created, 2 modified)

## What Was Built

- **`site.ts` (content model):** Added the `PodcastItem` interface (title, description, url, optional platform) beside `SocialItem`, an empty typed `podcasts: []` list, and `mediaHeading: 'Media & Podcasts'`. Only the media keys were touched — 06-02's `contactForm`/`contactSuccess` blocks were left intact (disjoint-key co-edit).
- **`MediaSection.svelte`:** Svelte 5 runes component. `items` prop defaults to `site.podcasts` so the page renders live data while vitest injects a fixture. `{#if items.length}` guards the whole `<section class="media" aria-labelledby="media-h">`, so an empty list produces no heading, no landmark, no shell. Heading text reads from `site.mediaHeading` (no hardcoded copy). Each item is an accessible-named external link (`href={item.url}`, unresolved, eslint-disable precedent) with an optional platform span and a description paragraph. Token-only styling, 44px min link target.
- **About page wiring:** `<MediaSection />` rendered inside `<article class="about">` below the pull-quote block and above the CTA. Inert now (empty list → nothing renders).
- **Specs:** `tests/media-section.spec.ts` (default build e2e) asserts `/about/` has no `#media-h`, no `section.media`, and no `/media/i` heading while the list is empty. `tests/unit/media-section.spec.ts` (vitest) proves both branches: empty props → nothing; fixture props → heading + link with correct `href` + description text.

## Verification Results

- `pnpm test:unit`: 4 passed (2 media-section branches + 2 pre-existing harness) — populated→accessible links and empty→nothing both GREEN.
- `pnpm exec playwright test tests/media-section.spec.ts`: 1 passed — no media section on /about while empty.
- `pnpm exec playwright test tests/a11y.spec.ts`: 12 passed — /about (and all routes) axe-clean in both accessible and premium modes; no new violations.
- `pnpm check`: 0 errors / 0 warnings. `eslint .`: clean.
- `pnpm test:content`, `pnpm test:tokens`, `pnpm test:review`: all OK.
- `grep site.mediaHeading src/lib/components/MediaSection.svelte`: present — heading is not hardcoded.
- No new route added → SEO/axe 5-route arrays untouched.

## Deviations from Plan

None — plan executed exactly as written. All 06-03-authored files are prettier-clean and eslint-clean.

## Deferred Issues

- **`scripts/check-token-contrast.mjs` fails `prettier --check`** — pre-existing formatting debt introduced by 06-01 (commit `b5ec05c`), unrelated to the media task (06-03 did not touch `scripts/`). It blocks the aggregate `pnpm lint` gate but not `eslint` or any 06-03 file. Logged in `deferred-items.md` (also flagged by 06-02); recommend fixing in 06-04 (integration-drive-green) via `pnpm exec prettier --write scripts/check-token-contrast.mjs`.

## Known Stubs

- `site.podcasts` ships as an intentional empty list. This is NOT a broken stub: `MediaSection` self-omits entirely on an empty list (no shell), so the About page renders correctly with nothing. Real appearances are a Phase-7-adjacent content edit (per LOCKED content-authenticity rule — invent no content while awaiting Eman). ENGAGE-03 is satisfied: both data branches are proven automatically.

## Self-Check: PASSED

- All created files present: MediaSection.svelte, tests/media-section.spec.ts, tests/unit/media-section.spec.ts, 06-03-SUMMARY.md
- All task commits present: d9ea052 (test), 0a8c2bc (feat)
