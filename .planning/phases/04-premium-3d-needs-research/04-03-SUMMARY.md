---
phase: 04-premium-3d-needs-research
plan: 03
subsystem: testing
tags: [prem-01, prem-02, prem-04, playwright, axe, code-split-boundary, phase-gate, webgl-teardown]

requires:
  - phase: 04-premium-3d-needs-research (plan 01)
    provides: content-based boundary gate (scripts/check-3d-boundary.mjs / test:split), RED premium-3d.spec.ts, gating helpers
  - phase: 04-premium-3d-needs-research (plan 02)
    provides: premium/** Threlte island (lazy-import boundary, on-demand Canvas, explicit dispose/context-loss teardown)
provides:
  - GREEN scripts/check-3d-boundary.mjs (PREM-02 build proof: 1 premium chunk, home bundle WebGL-free)
  - GREEN tests/premium-3d.spec.ts (7/7: gating, decorative aria-hidden canvas, reduced-motion poster, network split, dispose x15 leak-free, context-loss fallback)
  - GREEN full e2e regression (64/64 incl axe wcag2aaa both modes with canvas present)
  - corrected content-routes PREM-03 assertion (scoped to Accessible mode)
affects: []

tech-stack:
  added: []
  patterns:
    - "Teardown-safe Playwright on Windows: start `pnpm preview --strictPort` once, run tests with reuseExistingServer (no CI flag) so Playwright never hangs killing a child process tree it didn't spawn"
    - "Default-mode semantics: unseeded pages resolve to Premium (app.html inline script: stored → OS reduce/contrast → premium), so mode-specific DOM assertions MUST seed the mode they name"

key-files:
  created:
    - .planning/phases/04-premium-3d-needs-research/04-03-SUMMARY.md
  modified:
    - tests/content-routes.spec.ts

key-decisions:
  - "content-routes PREM-03 zero-canvas assertion was stale (Phase-3 era, when zero 3D existed): seeded 'accessible' so it tests the contract it names; Premium's canvas is proven in premium-3d.spec.ts and the boundary by check-3d-boundary.mjs — no boundary proof weakened"
  - "No implementation changes needed: the 04-02 island (lazy boundary, on-demand render, explicit dispose+forceContextLoss, context-loss→poster) passed all 7 runtime specs and dispose x15 leak-free on first drive-green run"

patterns-established:
  - "Phase-gate drive-green: build → boundary gate → premium runtime suite → axe both-modes → full regression → static token/content/review gates → BASE_PATH build"

requirements-completed: [PREM-01, PREM-02, PREM-04]

duration: 40min
completed: 2026-07-05
---

# Phase 4 Plan 03: Drive Green and Gates Summary

**The phase gate closed green with zero implementation changes: the Phase-4 Threlte island passes all 7 premium-3d runtime specs (gating, decorative aria-hidden canvas, reduced-motion poster, PREM-02 network split, dispose x15 leak-free, forced-context-loss→poster), the build-time PREM-02 boundary proves one premium chunk with a WebGL-free Home bundle, axe stays zero-violation (incl wcag2aaa) in both modes with the canvas present, and the full 64-test e2e suite is green — after correcting one stale Phase-3 test assertion.**

## What Was Built / Verified

This is the phase gate (Wave 3). It drove the RED harness from 04-01 to GREEN against the scene from 04-02 and proved every Phase-4 requirement gate. The scene implementation from 04-02 needed no changes — all fixes were confined to test infrastructure and one stale assertion.

### Task 1 — PREM-02 bundle boundary (GREEN, no changes)
- `pnpm build && node scripts/check-3d-boundary.mjs` → exit 0: `OK: 1 premium chunk(s) split out; home bundle is WebGL-free`.
- Verified green under BOTH the plain build and the `BASE_PATH=/diversityincludesdisability_four` gh-pages build.
- `grep -rEn "from '(three|@threlte)" src/lib` returns hits ONLY under `src/lib/components/premium/**` — zero WebGL imports leak into the Accessible/shared graph.
- `pnpm test:split` exits 0.

### Task 2 — premium runtime suite + axe regression (GREEN)
- `tests/premium-3d.spec.ts` → **7/7 passed**: accessible no-canvas+poster; premium+reduced-motion poster/no-canvas; premium+motion visible aria-hidden canvas + axe clean; PREM-02 accessible downloads zero three chunks; PREM-02 premium downloads a three chunk + mounts canvas; PREM-04 nav×15 dispose leak-free (no "too many active WebGL contexts"); PREM-04 forced context-loss → poster + h1 intact.
- axe zero-violations (`wcag2a/aa/aaa/21aa/22aa`) in both modes with the canvas present — no Phase-2/3 regression (decorative canvas is `aria-hidden`, `pointer-events:none`, never in tab order).
- **Full `pnpm test:e2e` → 64/64 passed** (57 prior Phase-1..3 specs + 7 premium-3d). Confirmed exit 0.

### Task 3 — Human taste/comfort checkpoint (AUTO-APPROVED)
- Auto-approved under autonomous execution. All automated gates that can judge the requirement (axe both-modes, canvas gating matrix, dispose x15, context-loss fallback) are green.
- **Optional human review still available:** an aesthetic + vestibular-comfort pass of the live Premium hero (`pnpm build && pnpm preview`, toggle to Premium) — confirm the drift reads as "the poster brought to life," not fast/flashy; toggle back to Accessible removes the canvas with no flash/shift. No script can judge this; it does not gate the phase.

### Static + build gates (all GREEN)
- `pnpm check` (svelte-check): 0 errors / 0 warnings.
- `node scripts/check-no-raw-hex.mjs`, `check-content-source.mjs`, `check-review-markers.mjs`: all `OK`.
- `BASE_PATH=/diversityincludesdisability_four pnpm build`: exit 0.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug/stale test assertion] `content-routes.spec.ts` home test asserted zero canvas in the unseeded default mode**
- **Found during:** Task 2 (full e2e regression sweep).
- **Issue:** The Phase-3 home content test (`content-routes.spec.ts:6`) asserted `canvas` count 0 without seeding a mode. It was authored when zero 3D existed anywhere. The `app.html` inline script resolves the unseeded default to **Premium** (no stored pref + no `prefers-reduced-motion`/`prefers-contrast` signal → `premium`), so the Phase-4 island now correctly mounts a decorative canvas in that default — the assertion conflated "default mode" with "Accessible mode."
- **Why it is a wrong assertion, not a bug:** PREM-03 ("the Accessible-first site ships zero WebGL") is an Accessible-mode guarantee, already proven specifically by the seeded-`accessible` case in `premium-3d.spec.ts` and by the build-time `check-3d-boundary.mjs`. The premium canvas is correct, intended behavior.
- **Fix:** Seed `did-mode='accessible'` via `addInitScript` before the zero-canvas assertion, and updated the inline comment to name the Accessible-mode contract. No boundary/dispose proof weakened.
- **Files modified:** `tests/content-routes.spec.ts`
- **Commit:** b541993

## Notes / Environment

- **Windows Playwright webServer teardown hang (root cause of two 5-min timeouts):** `pnpm preview` spawns a process tree that Playwright's `CI=true` webServer teardown cannot cleanly kill on Windows, so the runner never exits after tests pass and orphaned preview servers accumulate on the strict port. Resolved by the teardown-safe pattern: start one `pnpm preview --port <free> --strictPort` server manually, then run Playwright WITHOUT `CI` (so `reuseExistingServer` is true) — Playwright reuses the server, runs, and exits cleanly without trying to kill a tree it didn't own. Orphans from the earlier runs were killed by port owner (PowerShell `Get-NetTCPConnection`), and a stale sibling server on 4173 was cleared per the environment note.
- Ports probed for freeness before use (`net.createServer` bind test) to avoid sibling-project collisions on shared 4173.

## Task Commits

| Task | Name | Commit | Notes |
| ---- | ---- | ------ | ----- |
| 1 | Prove bundle boundary green | (no commit) | Gate already green from 04-01/04-02 — no code change |
| 2 | Drive runtime + axe regression green | b541993 | One stale test assertion corrected; scene needed no changes |
| 3 | Human taste/comfort checkpoint | (auto-approved) | Optional human review noted; not gating |

## Verification Results

- `node scripts/check-3d-boundary.mjs` → exit 0: `OK: 1 premium chunk(s) split out; home bundle is WebGL-free` (plain + BASE_PATH build)
- `tests/premium-3d.spec.ts` → 7 passed / 0 failed
- `pnpm test:e2e` → **64 passed / 0 failed** (exit 0)
- axe wcag2aaa zero-violations in Accessible AND Premium (canvas present)
- `pnpm check` clean; token/content/review gates `OK`; `BASE_PATH` build exit 0

## Self-Check: PASSED

- 04-03-SUMMARY.md exists
- tests/content-routes.spec.ts exists
- commit b541993 exists in history
