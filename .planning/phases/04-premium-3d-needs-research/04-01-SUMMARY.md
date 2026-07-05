---
phase: 04-premium-3d-needs-research
plan: 01
subsystem: premium-3d-boundary-harness
tags: [threlte, three, code-split, prem-02, a11y, reduced-motion, webgl, tdd-red]
requires:
  - Phase 3 static poster fallback (Hero.svelte .hero__poster) — permanent non-render slot
  - Existing Playwright + axe harness + mode store (src/lib/stores/mode.svelte.ts)
provides:
  - PREM-02 content-based bundle-boundary gate (scripts/check-3d-boundary.mjs) wired as test:split
  - prefersReducedMotion rune + webglSupported() detect (src/lib/a11y/prefers.svelte.ts)
  - RED premium-3d.spec.ts (7 runtime assertions) — the drive-green target for 04-02/04-03
  - pinned 3D deps (three@0.185.1, @threlte/core@8.5.16, @types/three@0.185.0)
affects:
  - package.json (deps + test chain), scripts/check-no-raw-hex.mjs (premium/ exemption)
tech-stack:
  added: [three@0.185.1, "@threlte/core@8.5.16", "@types/three@0.185.0"]
  patterns:
    - "Content-based build-grep boundary gate (regex over built .js, not filename heuristics)"
    - "Browser-guarded Svelte 5 $state rune for live prefers-reduced-motion"
    - "Synchronous memoized WebGL feature-detect BEFORE any three import"
    - "RED-first e2e spec authored before the scene exists (TDD drive-green target)"
key-files:
  created:
    - scripts/check-3d-boundary.mjs
    - src/lib/a11y/prefers.svelte.ts
    - tests/premium-3d.spec.ts
  modified:
    - package.json
    - scripts/check-no-raw-hex.mjs
decisions:
  - "Content-based (not name-based) chunk matching: regex @threlte|WebGLRenderer|three.module over built .js referenced by build/index.html — robust to hash-only chunk names"
  - "@threlte/extras intentionally NOT installed (avoids OrbitControls focus-trap + chunk bloat; ambient drift is trivial via useTask)"
  - "premium/ exemption on the raw-hex gate kept narrow (single ALLOW_DIRS entry) so token-derived three.Color hex constants pass without weakening the Accessible contract"
metrics:
  duration_min: 8
  tasks: 3
  files_changed: 5
  completed: 2026-07-05
---

# Phase 4 Plan 01: Boundary Harness & RED Specs Summary

Stood up the Phase-4 code-split boundary harness before any WebGL exists: pinned the 3D stack, authored the machine-verifiable content-based bundle-boundary gate (the primary PREM-02 proof), added the reactive reduced-motion / WebGL-support gating helper, and committed the RED Playwright spec that later tasks drive green.

## What Was Built

**Task 1 — deps + gate wiring (commit cc2172d)**
- Installed `three@0.185.1` + `@threlte/core@8.5.16` (runtime) and `@types/three@0.185.0` (dev) at exact pins; `@threlte/extras` deliberately absent.
- Added `"test:split": "node scripts/check-3d-boundary.mjs"` and wired it into the aggregate `test` script immediately after `pnpm build` (the gate greps built output).
- Exempted `src/lib/components/premium/` from the raw-hex gate via a narrow `ALLOW_DIRS` entry, leaving the existing `tokens.css` allow behavior untouched.

**Task 2 — a11y gating helper (commit cdce273)**
- `src/lib/a11y/prefers.svelte.ts`: browser-guarded `prefersReducedMotion` `$state` rune (respects live OS toggle via `matchMedia` change listener) + memoized synchronous `webglSupported()` that probes a throwaway canvas before any three import. Zero three/@threlte imports — stays in the Accessible three-free graph.

**Task 3 — boundary gate + RED spec (commit 1e6b7fe)**
- `scripts/check-3d-boundary.mjs`: two-part PREM-02 proof — (1) content-matches `@threlte|WebGLRenderer|three.module` across every built `.js` and asserts ≥1 premium chunk exists; (2) parses `build/index.html` and asserts none of the chunks it references is a premium chunk. Exits non-zero on either failure.
- `tests/premium-3d.spec.ts`: 7 runtime assertions (accessible no-canvas+poster, premium+reduce poster, premium+motion decorative canvas + axe-clean, PREM-02 network in both modes, dispose ×15 leak check, forced `WEBGL_lose_context` → poster fallback).

## Verification

- `pnpm test:tokens` — green (raw-hex gate passes with premium/ now exempt).
- `pnpm check` — 342 files, 0 errors, 0 warnings.
- `pnpm lint` — eslint clean + prettier all-formatted.
- Base-path production build (`BASE_PATH=/diversityincludesdisability_four`) — built in 4.28s.
- `node scripts/check-3d-boundary.mjs` — **EXITS 1 (RED, correct)** with `FAIL: no three/@threlte chunk found — split missing or scene not built`. This is the expected pre-scene state; the gate goes GREEN in 04-03 once the scene ships.
- `playwright test tests/premium-3d.spec.ts --list` — 7 tests listed (authored + listable; RED until scene exists).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] eslint `no-unused-expressions` on the walk() ternary**
- **Found during:** Task 3 (`pnpm lint`)
- **Issue:** The research blueprint's `e.isDirectory() ? walk(p) : e.name.endsWith('.js') && js.push(p);` expression statement tripped `@typescript-eslint/no-unused-expressions`, failing the lint gate.
- **Fix:** Rewrote the directory walk as an equivalent `if / else if` block (same behavior, lint-clean). Mirrors the existing `check-no-raw-hex.mjs` walk style.
- **Files modified:** scripts/check-3d-boundary.mjs
- **Commit:** 1e6b7fe

## Notes for Next Plans (04-02 / 04-03)

- The boundary gate is RED by design. It turns GREEN only once a dynamic `import()` of a three-importing module produces a separate premium chunk (Plan 04-03). Do not "fix" the RED here.
- The 7 spec assertions encode the exact runtime contract the scene must satisfy: canvas gated on `mode==='premium' && !reduced-motion && webglSupported()`, `aria-hidden` decorative canvas, poster fallback on every non-render path, and explicit dispose/context-loss handling (PREM-04).
- Gate matches content, not chunk filenames — the scene chunk can be hash-named freely.

## Self-Check: PASSED

All created files verified present; all 3 task commits (cc2172d, cdce273, 1e6b7fe) verified in history.
