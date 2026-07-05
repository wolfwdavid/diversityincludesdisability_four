---
phase: 05-launch-hardening
plan: 02
subsystem: infra
tags: [og-image, playwright, svelte, vite, css-code-split, threlte, seo]

# Dependency graph
requires:
  - phase: 04-premium-3d
    provides: PremiumHero → import('./HeroScene.svelte') WebGL code-split boundary + premium-3d.spec.ts
  - phase: 02-mode-system-design-tokens
    provides: accessible-mode brand tokens (--bg/--text/--primary/--accent) reused verbatim in the OG card
provides:
  - 1200×630 branded OG social card (static/og-image.png) + reproducible SVG source and generator
  - deterministic no-flash MODE-03 assertion (expect.poll) that holds under parallel workers
  - accessible home critical path that emits NO premium scene CSS <link> (HeroScene CSS hoisted; Canvas CSS pushed past the eager-hoist depth window)
  - CI worker cap for Playwright runner stability
affects: [05-04-ci-workflow-gate, 05-05-launch-verify, seo-social-validators]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "OG card generated once from a token-colored SVG via Playwright chromium (no runtime/build dependency)"
    - "Two-hop dynamic import to keep a dependency's scoped CSS off a prerendered critical path while preserving the JS code-split"
    - "expect.poll for early-DOM/async-capture assertions under parallel-worker contention"

key-files:
  created:
    - static/og-image.svg
    - static/og-image.png
    - scripts/gen-og-image.mjs
    - src/lib/components/premium/SceneCanvas.svelte
  modified:
    - tests/no-flash.spec.ts
    - src/lib/components/premium/HeroScene.svelte
    - src/lib/styles/tokens.css
    - playwright.config.ts
    - tests/premium-3d.spec.ts

key-decisions:
  - "OG card uses the accessible-mode tokens (white #ffffff ground, #0a4e8b primary, #111111 text, #9a3412 accent) per the plan's acceptance grep — not the dark premium palette — for a light, legible, on-brand social card"
  - "The real HeroScene eager-CSS leak was @threlte/core's <Canvas> scoped CSS (not HeroScene's own <style>, which the research assumed); eliminated by isolating <Canvas> in SceneCanvas.svelte behind a second dynamic import so its CSS sits at SvelteKit find_deps dynamic_import_depth 2, past the depth<=1 eager-hoist window"
  - "Kept class=\"hero-scene\" on HeroScene's wrapper (satisfies the plan key_link) while the CSS-bearing Canvas lives one hop deeper"

patterns-established:
  - "Nested dynamic import (depth 2) to keep a third-party component's scoped CSS off a prerendered accessible critical path without touching the proven JS boundary"
  - "Poll async response-body captures instead of reading once, so an added load-latency hop can't flake the assertion"

requirements-completed: [SEO-01]

# Metrics
duration: 61min
completed: 2026-07-05
---

# Phase 5 Plan 02: OG Image and Local Fixes Summary

**Shipped a 1200×630 token-branded OG card, made the no-flash MODE-03 test deterministic under parallel workers, and removed the premium scene's eager CSS `<link>` from the accessible home by pushing @threlte/core's Canvas CSS past SvelteKit's dynamic-import eager-hoist depth — JS code-split boundary intact.**

## Performance

- **Duration:** 61 min (wall-clock; much of it spent hardening the local Playwright verification against an orphaning background-process environment)
- **Started:** 2026-07-05T09:45:57Z
- **Completed:** 2026-07-05T10:47:06Z
- **Tasks:** 3
- **Files created:** 4  **Files modified:** 5

## Accomplishments
- `static/og-image.png` (1200×630, 40 KB, valid PNG) + `static/og-image.svg` source + `scripts/gen-og-image.mjs` reproducible rasterizer; ships to `build/og-image.png`.
- no-flash MODE-03 now uses `expect.poll` + optional chaining; deterministic across 5 runs at `--workers=4` while preserving the pre-paint `data-mode` guarantee (`waitUntil:'commit'` kept).
- Accessible home `build/index.html` emits NO HeroScene/SceneCanvas CSS `<link>`; `check-3d-boundary` green (1 premium chunk, home WebGL-free); premium hero still renders (premium-3d 9/9).
- Playwright `workers: process.env.CI ? 2 : undefined` added for CI runner stability.

## Task Commits

1. **Task 1: OG image (svg + png + generator)** — `474391a` (feat)
2. **Task 2: no-flash MODE-03 deterministic** — `2a80cbe` (test)
3. **Task 3: HeroScene CSS hoist + SceneCanvas + CI workers (+ PREM-02 poll fix)** — `5328f10` (refactor)

## Files Created/Modified
- `static/og-image.svg` — 1200×630 token-colored branded card (wordmark + verified tagline; no invented claims)
- `static/og-image.png` — rasterized 40 KB card referenced by `Seo.svelte` og:image
- `scripts/gen-og-image.mjs` — one-off Playwright-chromium SVG→PNG rasterizer (no new dependency)
- `src/lib/components/premium/SceneCanvas.svelte` — isolates @threlte `<Canvas>` behind a 2nd dynamic import (depth-2 CSS)
- `src/lib/components/premium/HeroScene.svelte` — style-free `.hero-scene` wrapper that dynamically imports SceneCanvas
- `src/lib/styles/tokens.css` — `.hero-scene` positioning rules (hoisted to the always-loaded layer)
- `tests/no-flash.spec.ts` — `expect.poll` + `?.` MODE-03 assertion
- `tests/premium-3d.spec.ts` — poll the PREM-02 three-chunk assertion (async-capture race fix)
- `playwright.config.ts` — CI worker cap

## Decisions Made
- OG card uses accessible-mode tokens (light ground) per the plan's acceptance grep, not the dark premium palette suggested in the orchestrator's environment note; the plan is authoritative and its `rg '#0a4e8b|#111111'` check is met.
- Discovered the eager-CSS source was @threlte/core's `<Canvas>`, not HeroScene's own `<style>`; fixed structurally rather than accepting the link (the plan's acceptance requires zero link).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Root cause of the HeroScene eager CSS was Threlte's Canvas, requiring a nested dynamic import**
- **Found during:** Task 3
- **Issue:** The plan/research assumed deleting HeroScene's scoped `<style>` would remove the `HeroScene*.css` chunk. It did not — the chunk's content is `@threlte/core`'s `<Canvas>` scoped CSS (class `svelte-a00hhg`: wrapper `div` + `canvas` sizing), which SvelteKit eagerly links on the prerendered home to prevent FOUC (`find_deps` groups dynamic-import CSS when `dynamic_import_depth <= 1`).
- **Fix:** Isolated `<Canvas>`+`<Scene>` in a new `SceneCanvas.svelte` and made `HeroScene` reach it via a second `import()`. That extra hop places the Canvas CSS at `dynamic_import_depth` 2, outside the eager-hoist window, so no premium scene CSS `<link>` is emitted on `build/index.html`. Verified against SvelteKit's `find_deps` source. Kept `class="hero-scene"` on HeroScene (plan key_link) and its positioning in `tokens.css`.
- **Files modified:** `HeroScene.svelte`, new `SceneCanvas.svelte`, `tokens.css`
- **Verification:** `build/index.html` grep for `HeroScene*.css|SceneCanvas*.css` → none; `check-3d-boundary` green (1 premium chunk, home WebGL-free); premium-3d canvas mounts (isolated diag: `data-hydrated=true`, `canvas count=1`, no console errors).
- **Committed in:** `5328f10`

**2. [Rule 1 - Bug] Pre-existing async-capture race in premium-3d PREM-02, exposed by the extra import hop**
- **Found during:** Task 3 (regression verification)
- **Issue:** PREM-02 (line 63) captures `.js` response bodies via async `await r.text()` then asserts `bodies.some(...)` synchronously right after the canvas is visible. The three chunk now downloads one module-resolution tick later, widening the window where its body hasn't been pushed yet → intermittent false failure (seen once at `--workers=4`).
- **Fix:** Wrapped the body assertion in `expect.poll(..., { timeout: 5_000 })`. Guarantee unchanged (a downloaded `.js` chunk carries the three/WebGL signature); hydration + canvas-visible still asserted first.
- **Files modified:** `tests/premium-3d.spec.ts`
- **Verification:** no-flash + premium-3d 9/9 across 5 runs at `--workers=4`, deterministic.
- **Committed in:** `5328f10`

---

**Total deviations:** 2 auto-fixed (both Rule 1 — bug/root-cause). **Impact:** No scope creep; both were required to actually meet the plan's stated acceptance (zero premium CSS link) and its regression requirement (premium-3d stays green). `premium-3d.spec.ts` is a Phase-04 test not owned by the parallel plan 05-01.

## Issues Encountered
- The local environment orphaned long-running background Playwright processes mid-run, producing false "no output" states. Resolved by building once and running the suite against a single persistent `pnpm preview` server (reused via `reuseExistingServer`), which made runs fast (~10s) and observable; confirmed 9/9 across 5 runs at 4 workers.

## Known Stubs
None. (`static/og-image.svg` text is the org name + the verified `heroSubhead` tagline only — no placeholder/invented content.)

## Observations (out of scope — not fixed)
- `pnpm check` reports 3 `state_referenced_locally` warnings in `src/lib/components/Seo.svelte` (plan 05-01's file). 0 errors; warnings only. Left for 05-01/verify — not owned by this plan.

## Next Phase Readiness
- SEO-01 asset half complete: the OG card is live at `${site.url}${base}/og-image.png` and copies into `build/`. Plan 05-04's CI `verify` job can rely on a deterministic no-flash test under CI worker contention; Plan 05-05 live smoke (DEPLOY-04) will confirm the OG image returns 200 at the public base-path URL.

---
*Phase: 05-launch-hardening*
*Completed: 2026-07-05*

## Self-Check: PASSED

All 10 created/modified files present on disk; all 3 task commits (474391a, 2a80cbe, 5328f10) in history.
