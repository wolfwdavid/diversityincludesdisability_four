---
phase: 06-engagement-surfaces
plan: 04
subsystem: testing
tags: [playwright, vitest, lhci, github-actions, ci-ordering, wcag]

# Dependency graph
requires:
  - phase: 06-engagement-surfaces plan 01
    provides: test:unit / test:e2e:enabled / test:contrast script definitions + enabled Playwright config
  - phase: 06-engagement-surfaces plan 02
    provides: inert-key contact form + noindex /contact/success/ + enabled specs
  - phase: 06-engagement-surfaces plan 03
    provides: self-omitting MediaSection + default specs (media omitted)
provides:
  - Load-bearing Phase-6 coverage — unit + enabled + contrast wired into `pnpm test` / `test:launch` and the CI verify job (no silent no-op false greens)
  - CI ordering invariant enforced twice — enabled suite runs AFTER lhci in deploy.yml AND check-ci-gate asserts the index order fail-closed
  - Proven-green full phase gate — 74 default e2e + 10 enabled e2e + 4 unit + all grep gates + contrast + lhci 7 URLs + BASE_PATH/SEO build, live CI verify->build->deploy->smoke all green
affects: [07-real-content, 08-domain-cutover, any future CI/workflow edits]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dummy-key rebuild ordering: any suite that overwrites build/ runs strictly AFTER every consumer of the default build (lhci, SEO gate) — enforced by a static index-order assertion in check-ci-gate.mjs"
    - "Intentionally-noindex pages are excluded from lhci SEO minScore (like 404.html) but keep full accessibility/best-practices assertions"

key-files:
  created: []
  modified:
    - package.json
    - .github/workflows/deploy.yml
    - scripts/check-ci-gate.mjs
    - scripts/check-token-contrast.mjs
    - lighthouserc.json

key-decisions:
  - "Enabled suite ordered LAST in both test:launch and the CI verify job so its dummy-key rebuild of build/ can never be the artifact Lighthouse audits"
  - "check-ci-gate.mjs now statically asserts the enabled-after-lhci index order in deploy.yml, making the ordering invariant fail-closed against future workflow edits"
  - "/contact/success/ excluded from the lhci SEO minScore assertion (mirrors 404.html) because its noindex is a recorded design decision, not a defect; a11y/best-practices still asserted on it"

patterns-established:
  - "Stale-preview hygiene: reuseExistingServer:true locally means leftover sibling/killed preview servers on 4173/4199/4271 can serve wrong builds — kill listeners before gate runs"
  - "Windows lhci: chrome-launcher needs System32 (taskkill) on PATH; EPERM tmp-dir race worked around via collect-retry + separate assert (CI on ubuntu unaffected)"

requirements-completed: [ENGAGE-01, ENGAGE-02, ENGAGE-03]

# Metrics
duration: 91min
completed: 2026-07-06
---

# Phase 6 Plan 04: Integration Drive-Green Summary

**Phase-6 coverage made load-bearing (unit+enabled+contrast in aggregates and CI, enabled ordered after lhci with a fail-closed index-order gate) and the entire phase driven green locally and on live CI through deploy + smoke.**

## Performance

- **Duration:** ~91 min (includes two ~15-min Playwright teardown hangs on Windows)
- **Started:** 2026-07-06T11:12:58Z
- **Completed:** 2026-07-06T12:44:19Z
- **Tasks:** 2/2
- **Files modified:** 5

## Accomplishments

- `pnpm test` now runs `test:contrast` + `test:unit`; `test:launch` appends `test:e2e:enabled` as its final step — after `lhci autorun` and the SEO gate, so the dummy-key rebuild never pollutes the audited default build.
- CI `verify` job runs `pnpm test:unit` and `pnpm test:e2e:enabled` immediately after the Lighthouse step; `check-ci-gate.mjs` asserts both presence AND index order (enabled strictly after lhci), so a future reorder fails the gate.
- Full local gate green: svelte-check 0 errors / eslint+prettier clean / tokens / contrast (5 pairs, both modes) / content / review / build / 3D boundary / **74 default e2e** / **4 unit** / lhci **7 URLs all assertions pass** / BASE_PATH build + 5-route SEO gate / **10 enabled e2e** (axe wcag2aaa both modes, bound-honeypot payload).
- Live CI run 28792069563 green end-to-end: verify → build → deploy → smoke all success.
- Live sanity on Pages: all 6 routes 200 (incl. /contact/success/), /contact has 0 `<form>` elements + mailto present (key empty in prod), /about has no media markup, deep-link 404 fallback intact, home HTML free of three/threlte references (premium canvas still lazy).

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire unit + enabled + contrast into aggregates and CI (enabled AFTER lhci)** - `1fb494c` (feat)
2. **Task 1 (deferred-item fix): format check-token-contrast.mjs** - `9b46c87` (style)
3. **Task 2 (deviation fix): exclude noindex /contact/success/ from lhci SEO minScore** - `553bd35` (fix)

**Plan metadata:** docs commit (SUMMARY + STATE + ROADMAP + config)

## Files Created/Modified

- `package.json` - `test` adds contrast+unit; `test:launch` appends `test:e2e:enabled` last
- `.github/workflows/deploy.yml` - verify job runs unit + enabled suites after the lhci step, with ordering comment
- `scripts/check-ci-gate.mjs` - new fail-closed assertions: unit+enabled present, enabled index strictly after lhci
- `scripts/check-token-contrast.mjs` - prettier-formatted (clears the deferred 06-01 lint debt)
- `lighthouserc.json` - assertMatrix SEO pattern now also excludes `/contact/success/` (intentional noindex)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Stale preview servers caused 13 false e2e failures**

- **Found during:** Task 2 (first default e2e run: 61 passed / 13 failed, all on the `data-hydrated` wait)
- **Issue:** Leftover preview servers were listening on 4173/4199/4271 (from a killed earlier run + a sibling project). `reuseExistingServer: !process.env.CI` made Playwright reuse the stale 4199 server, so hydration-dependent specs timed out. A direct probe of the current build showed `data-hydrated=true` with zero console errors — the code was never broken.
- **Fix:** Killed the stale listeners (taskkill), re-ran on a clean port → 74/74 passed. No code change.
- **Files modified:** none

**2. [Rule 1 - Config bug] lhci SEO assertion applied to the intentionally-noindex success page**

- **Found during:** Task 2 (lhci assert: `/contact/success/index.html` SEO 0.63 < 0.9)
- **Issue:** The success page ships `noindex` by recorded 06-02 design (excluded from the 5-route SEO gate), and Lighthouse's is-crawlable audit caps any noindex page's SEO score. The assertMatrix predated the route.
- **Fix:** Excluded `/contact/success/` from the SEO minScore row (exactly like the existing 404.html exclusion). Accessibility (0.95), best-practices (0.9) and performance assertions still apply to the page. Not a gate weakening — an alignment with the intentional design.
- **Files modified:** lighthouserc.json
- **Commit:** 553bd35

**3. [Rule 3 - Blocking, environment-only] Windows lhci EPERM teardown**

- **Found during:** Task 2 (lhci autorun crashed: `taskkill` not on PATH in the bash env, then chrome-launcher EPERM removing its temp profile dir)
- **Issue:** Local-machine-only chrome-launcher teardown race; CI runs on ubuntu-latest and is unaffected.
- **Fix:** Added System32 to PATH for the run, then split into `lhci collect` (retry loop, succeeded attempt 3) + `lhci assert` (all 7 URLs pass). No repo change.
- **Files modified:** none

### Planned deferred-item fix

- `scripts/check-token-contrast.mjs` prettier debt (deferred from 06-01 via deferred-items.md) fixed with `prettier --write`; aggregate `pnpm lint` gate now green. Commit 9b46c87.

## Verification Results

| Gate | Result |
| --- | --- |
| svelte-check | 981 files, 0 errors, 0 warnings |
| eslint + prettier | clean |
| test:tokens / test:content / test:review | OK |
| test:contrast | 5 token pairs OK, both modes |
| test:split (3D boundary) | 1 premium chunk split, home WebGL-free |
| test:unit (vitest) | 4 passed (2 files) |
| test:e2e (default) | 74 passed |
| check-ci-gate | OK incl. new enabled-after-lhci index-order assertion |
| lhci | 7 URLs, all assertions processed, 0 failures |
| build:base + check-seo-meta | 5 routes, absolute base-path meta OK |
| test:e2e:enabled | 10 passed (axe wcag2aaa both modes, honeypot payload) |
| Live CI run 28792069563 | verify / build / deploy / smoke all success |
| Live sanity | 6 routes 200; /contact 0 forms + mailto; /about no media; 404 fallback; home HTML three-free |

## Known Stubs

None introduced by this plan (config/scripts only). Pre-existing intentional placeholders remain tracked for Phase 7: social hrefs `#`, `[REVIEW]` content markers, form hidden behind empty `PUBLIC_WEB3FORMS_KEY` (by design, ENGAGE-02), empty `site.podcasts` list (by design, ENGAGE-03).

## Next Phase Readiness

- Phase 6 (engagement-surfaces) is complete: all four plans executed, ENGAGE-01/02/03 verified by named passing assertions, zero v1.0 regression (74-test default suite unchanged-plus-additions).
- Phase 7 (real content) remains blocked on Eman's answers; enabling the live form is a single Actions Variable (`PUBLIC_WEB3FORMS_KEY`) with no code change.

## Self-Check: PASSED

All 6 claimed files exist; all 3 task commits (1fb494c, 9b46c87, 553bd35) present in git history; live CI run 28792069563 concluded success.
