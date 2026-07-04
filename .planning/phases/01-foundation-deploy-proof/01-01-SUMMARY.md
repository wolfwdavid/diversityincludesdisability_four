---
phase: 01-foundation-deploy-proof
plan: 01
subsystem: infra
tags: [sveltekit, adapter-static, github-pages, pnpm, github-actions, base-path, prerender]

# Dependency graph
requires: []
provides:
  - Minimal static SvelteKit app (Svelte 5 runes, TypeScript, pnpm) scaffolded in place
  - adapter-static config with base-path, .nojekyll, 404 SPA fallback, fail-loud prerender
  - Locally-proven prod-base build (BASE_PATH=/diversityincludesdisability_four) emitting build/ with base-prefixed _app assets
  - pnpm GitHub Pages deploy workflow (upload-pages-artifact@v3 + deploy-pages@v4), BASE_PATH from repo name
  - Pinned toolchain (.nvmrc=24, packageManager pnpm@11.10.0, engines node>=24) + committed pnpm-lock.yaml
affects: [01-02-remote-deploy-live-proof, content-pages, mode-toggle, premium-3d, a11y-toolchain]

# Tech tracking
tech-stack:
  added:
    - svelte@5.56.4
    - "@sveltejs/kit@2.69.1"
    - "@sveltejs/adapter-static@3.0.10"
    - vite@8.1.3
    - "@sveltejs/vite-plugin-svelte@7.1.2"
    - svelte-check@4.7.1
    - typescript@6.0.3
  patterns:
    - "BASE_PATH env drives paths.base (empty in dev, repo-subpath in CI); never hardcode the base twice"
    - "paths.relative=false → absolute base-prefixed _app URLs in every prerendered page, consistent with the SPA 404.html fallback"
    - "trailingSlash='always' + full prerender → each route emits <route>/index.html, served deterministically by Pages"
    - "kit config lives in canonical svelte.config.js; vite.config.ts is a plain sveltekit() plugin"
    - "static/.nojekyll committed manually (adapter-static does not emit it)"

key-files:
  created:
    - svelte.config.js
    - src/routes/+layout.ts
    - static/.nojekyll
    - .github/workflows/deploy.yml
    - .nvmrc
    - pnpm-lock.yaml
  modified:
    - package.json
    - vite.config.ts
    - src/routes/+page.svelte

key-decisions:
  - "Set paths.relative=false so index.html (and all future routes) use absolute base-prefixed _app URLs, matching the already-absolute 404.html fallback — the plan's verbatim config left relative default-on, which produced relative ./_app URLs that fail the plan's own base-prefixed index.html assertion and break the SPA fallback at deep paths"
  - "Newer sv (v0.16.1) scaffold puts the adapter in vite.config.ts and ships no svelte.config.js; restored the canonical svelte.config.js (plan/research/STACK contract) and simplified vite.config.ts to a plain sveltekit() plugin"
  - "Kept scaffold minimal (TS, no add-ons); deferred prettier/eslint/playwright/axe/lighthouse to their later phases per scope guard"

patterns-established:
  - "Prod-base build proof: MSYS_NO_PATHCONV=1 BASE_PATH=/... pnpm build on Git Bash to avoid MSYS mangling the leading-slash base path"
  - "adapter-static + paths.relative=false + trailingSlash=always is the base-path-correct GitHub Pages recipe for this repo"

requirements-completed: [DEPLOY-01, DEPLOY-02, DEPLOY-03]

# Metrics
duration: 12min
completed: 2026-07-04
---

# Phase 1 Plan 01: Scaffold, Static Config & CI Summary

**Minimal static SvelteKit app (svelte 5.56.4 / kit 2.69.1 / adapter-static 3.0.10) configured for GitHub Pages under `/diversityincludesdisability_four`, with a prod-base build locally proven to emit base-prefixed assets + 404 fallback + .nojekyll, plus a pnpm upload-pages-artifact@v3 / deploy-pages@v4 workflow.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-04T21:06:49Z
- **Completed:** 2026-07-04T21:18:57Z
- **Tasks:** 3
- **Files modified:** 20 (across 3 atomic commits)

## Accomplishments
- Scaffolded a minimal TypeScript SvelteKit app in place without disturbing `.git/`, `.planning/`, or `CLAUDE.md`; swapped adapter-auto → adapter-static@3.0.10; pinned the toolchain and committed `pnpm-lock.yaml` for CI `--frozen-lockfile`.
- Wired base-path-correct static config (`svelte.config.js`, `+layout.ts`, `+page.svelte`, `static/.nojekyll`) and **proved it locally**: `BASE_PATH=/diversityincludesdisability_four pnpm build` emits `build/index.html`, `build/404.html`, `build/.nojekyll`, with all `_app` asset URLs prefixed by the base path and zero root-absolute `_app` refs.
- Authored the pnpm GitHub Pages deploy workflow (v3+v4 action pair, Node 24, BASE_PATH from repo name, uploads `build/`, triggers on `main`).

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold minimal SvelteKit app, swap to adapter-static, pin toolchain** - `52494a0` (chore)
2. **Task 2: Wire static Pages config and prove base-path build** - `779ee08` (feat)
3. **Task 3: Author the pnpm GitHub Pages deploy workflow** - `7b34041` (chore)

**Plan metadata:** _(final docs commit — see below)_

## Files Created/Modified
- `svelte.config.js` - adapter-static, `fallback: '404.html'`, `paths.base` from `BASE_PATH`, `paths.relative=false`, fail-loud prerender (created)
- `src/routes/+layout.ts` - `prerender = true`, `trailingSlash = 'always'` (created)
- `src/routes/+page.svelte` - hello-world proof page using base-aware `$app/paths` link (modified from scaffold)
- `static/.nojekyll` - empty, git-tracked; stops Jekyll dropping `_app/` on Pages (created)
- `.github/workflows/deploy.yml` - pnpm build + Pages artifact deploy, BASE_PATH from repo name (created)
- `.nvmrc` - `24`, so CI matches local (created)
- `package.json` - name, `packageManager: pnpm@11.10.0`, `engines.node >=24`, adapter-static dep (modified)
- `vite.config.ts` - simplified to canonical plain `sveltekit()` plugin (modified)
- `pnpm-lock.yaml` - committed for CI `--frozen-lockfile` (created)

## Decisions Made
- **`paths.relative=false`** — see Deviation 2. Yields absolute base-prefixed `_app` URLs everywhere, consistent with SvelteKit's already-absolute `404.html`, and satisfies the plan's base-prefixed-index.html acceptance gate.
- **Restored canonical `svelte.config.js`** — the newer scaffold's vite-inlined config was replaced with the documented `svelte.config.js` the plan/research/STACK all assume.
- **Minimal scaffold, add-ons deferred** — no prettier/eslint/playwright/axe/lighthouse here; those belong to the a11y/quality phases (scope guard held).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Newer `sv` scaffold layout — no `svelte.config.js`, adapter inlined in `vite.config.ts`**
- **Found during:** Task 1 (Scaffold)
- **Issue:** `sv@0.16.1` scaffolds the adapter into `vite.config.ts` (`sveltekit({ adapter, compilerOptions })`) and ships **no** `svelte.config.js`. The plan's Task-1 file list and Task-2 contract (and the artifacts/key_links must_haves) all assume a `svelte.config.js` holding `kit` config. Also, `--template minimal --types ts` alone still prompted interactively; `--no-add-ons` was required to run non-interactively, and the non-empty target dir required the temp-dir scaffold fallback.
- **Fix:** Scaffolded into `.svktmp`, moved contents (incl. dotfiles) up, removed temp dir. Simplified `vite.config.ts` to the canonical plain `sveltekit()` plugin and moved all `kit` config into a new `svelte.config.js` (Task 2), which is what the plan/research/STACK specify and what the vite plugin + svelte-check canonically read.
- **Files modified:** vite.config.ts, svelte.config.js (created)
- **Verification:** `pnpm install` resolved exact verified pins (kit 2.69.1, adapter-static 3.0.10, svelte 5.56.4, vite 8.1.3); prod-base build succeeds and passes all output assertions.
- **Committed in:** 52494a0 (Task 1) + 779ee08 (Task 2)

**2. [Rule 1 - Bug] Verbatim config produced relative `_app` URLs that fail the plan's own base-prefixed assertion and break the SPA fallback at depth**
- **Found during:** Task 2 (prove build)
- **Issue:** The plan's verbatim `svelte.config.js` left `paths.relative` at its SvelteKit default (`true`), which emits relative `./_app/...` URLs in `index.html`. That (a) fails the plan's own acceptance/must_have that `index.html` reference `_app` URLs prefixed with `/diversityincludesdisability_four/`, and (b) is a correctness risk: SvelteKit forces absolute base-prefixed URLs in `404.html` (served at arbitrary depth on Pages), so `index.html` and the fallback were inconsistent — relative `./_app` in a deep-served fallback would 404.
- **Fix:** Added `paths.relative: false` so every prerendered page uses absolute base-prefixed `_app` URLs, matching `404.html`. Documented rationale inline in `svelte.config.js`.
- **Files modified:** svelte.config.js
- **Verification:** `grep -Rq "/diversityincludesdisability_four/_app" build/index.html` matches; `grep -REn 'src="/_app|href="/_app' build/` returns nothing (URLs are base-prefixed, not root-absolute).
- **Committed in:** 779ee08 (Task 2)

**3. [Rule 3 - Blocking] Git Bash (MSYS) mangled the leading-slash `BASE_PATH`**
- **Found during:** Task 2 (prove build)
- **Issue:** `BASE_PATH=/diversityincludesdisability_four pnpm build` failed with "base ... must start but doesn't end with '/'" because MSYS path-conversion rewrote the value to a Windows path.
- **Fix:** Prefixed the build with `MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*'`. (CI on ubuntu-latest is unaffected; the workflow sets `BASE_PATH` natively.)
- **Files modified:** none (invocation-only)
- **Verification:** Build exits 0 with correct base path.
- **Committed in:** n/a (environment workaround, no file change)

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 bug). No architectural changes; no user decision required.
**Impact on plan:** All fixes necessary to make the plan's own acceptance gate pass and to keep the build correct on Pages. No scope creep — no content, mode toggle, 3D, or a11y toolchain added.

## Issues Encountered
None beyond the deviations above; all resolved inline.

## User Setup Required
None - no external service configuration required in this plan. (Remote creation, `master`→`main` rename, Pages enable, and the live-URL proof are owned by plan 01-02.)

## Known Stubs
None. The hello-world `+page.svelte` is an intentional deploy-proof placeholder (not a data stub); real content arrives in later phases.

## Next Phase Readiness
- Buildable, base-path-correct static app + committed deploy workflow are ready for **plan 01-02** (Wave 2): rename `master`→`main`, `gh repo create wolfwdavid/diversityincludesdisability_four`, enable Pages (`build_type=workflow`), push to trigger `deploy.yml`, and verify the live URL.
- Reminder for 01-02: the workflow triggers on `main` while the current default branch is `master` — the rename must happen before first push or the workflow never runs.
- DEPLOY-01 and DEPLOY-02 are proven locally; DEPLOY-03 workflow is authored (its green CI run is proven in 01-02).

---
*Phase: 01-foundation-deploy-proof*
*Completed: 2026-07-04*

## Self-Check: PASSED

- All 10 claimed files verified present on disk.
- All 3 task commits verified in git history (52494a0, 779ee08, 7b34041).
