---
phase: 04-premium-3d-needs-research
verified: 2026-07-05T06:02:01Z
status: passed
score: 5/5 must-haves verified
---

# Phase 4: Premium 3D (Needs Research) Verification Report

**Phase Goal:** Premium mode adds one tasteful, restrained Threlte/Three.js hero loaded ONLY in
Premium mode via dynamic import, keeping the Accessible bundle at zero WebGL; graceful fallback to
the static poster on every other path (accessible/reduced-motion/no-webgl/import-fail/context-lost);
no WebGL context leaks.

**Verified:** 2026-07-05T06:02:01Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | three@0.185.1 + @threlte/core@8.5.16 pinned exactly, @threlte/extras absent | ✓ VERIFIED | `node -e` version check: `three:0.185.1 threlte/core:8.5.16 types/three:0.185.0 extras:undefined` |
| 2 | Zero three/@threlte imports outside `src/lib/components/premium/**` (quarantine intact) | ✓ VERIFIED | `grep -rEn "from '(three|@threlte)" src/lib \| grep -v "src/lib/components/premium/"` returns nothing |
| 3 | Build-grep gate proves ≥1 premium chunk exists and Home critical bundle is WebGL-free (PREM-02) | ✓ VERIFIED | `node scripts/check-3d-boundary.mjs` → `OK: 1 premium chunk(s) split out; home bundle is WebGL-free`, exit 0 |
| 4 | Premium+motion+WebGL mounts one decorative aria-hidden canvas; every other path (accessible/reduced-motion/no-webgl/import-fail/context-lost) shows the poster with no content loss (PREM-01/04) | ✓ VERIFIED | `tests/premium-3d.spec.ts` 7/7 pass (gating, aria-hidden decorative canvas + axe clean, PREM-02 network split both directions, dispose x15 no-leak, forced context-loss → poster + h1 intact) |
| 5 | Renderer disposal + context-loss teardown prevents WebGL context accumulation (PREM-04) | ✓ VERIFIED | `Scene.svelte` `onDestroy` calls `renderer.dispose()` + `renderer.forceContextLoss()`, removes `webglcontextlost`/`visibilitychange` listeners, disconnects IntersectionObserver; nav×15 e2e test shows zero "too many active WebGL contexts" console errors |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `scripts/check-3d-boundary.mjs` | PREM-02 build-grep bundle boundary proof | ✓ VERIFIED | Exists, runs, exit 0 against real build output (`build/_app/immutable` + `build/index.html`) |
| `src/lib/a11y/prefers.svelte.ts` | reactive `prefersReducedMotion` + `webglSupported()` | ✓ VERIFIED | Both exported, browser-guarded (`if (!browser) return`), zero three/@threlte imports, `pnpm check` clean |
| `tests/premium-3d.spec.ts` | PREM-01/02/04 runtime e2e assertions | ✓ VERIFIED | 7 tests (`grep -c "^test("` = 7), all pass against production preview build |
| `src/lib/components/premium/PremiumHero.svelte` | three-free boundary gate + dynamic import + fallback matrix | ✓ VERIFIED | No three/@threlte import; `{#await import('./HeroScene.svelte')}` with pending/then/catch all falling through to nothing (poster shows through) |
| `src/lib/components/premium/HeroScene.svelte` | only three/@threlte importer; Canvas host | ✓ VERIFIED | `import { Canvas } from '@threlte/core'`, `aria-hidden="true"`, `renderMode="on-demand"`, `pointer-events: none` |
| `src/lib/components/premium/scene/Scene.svelte` | camera + drift loop + teardown | ✓ VERIFIED | `useTask`, `forceContextLoss`, `webglcontextlost`, `IntersectionObserver`, `visibilitychange` all present |
| `src/lib/components/premium/scene/ParticleField.svelte`, `EchoRings.svelte`, `Lights.svelte` | procedural scene content | ✓ VERIFIED | InstancedMesh (300), wireframe tori, blue/orange point lights; belt-and-suspenders `geo.dispose()`/`mat.dispose()` |
| `src/lib/components/Hero.svelte` | three-free import + `<PremiumHero/>` overlay, poster/content untouched | ✓ VERIFIED | Only imports `PremiumHero.svelte` (comment mentions "three/@threlte" as a warning, not an import); `hero__poster` and `site.home.heroHeadline` still present |
| `package.json` | pinned 3D deps + `test:split` wired after build | ✓ VERIFIED | `test:split` script present; `test` chain runs `pnpm build && pnpm test:split` |
| `scripts/check-no-raw-hex.mjs` | exempts `src/lib/components/premium/` | ✓ VERIFIED | `ALLOW_DIRS` includes the quarantine path; `pnpm test:tokens` exits 0 |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `Hero.svelte` | `premium/PremiumHero.svelte` | static import (three-free boundary) | ✓ WIRED | `import PremiumHero from '$lib/components/premium/PremiumHero.svelte'` |
| `premium/PremiumHero.svelte` | `premium/HeroScene.svelte` | dynamic `import()` code-split point | ✓ WIRED | `import('./HeroScene.svelte')`; build produces a separate chunk (confirmed by boundary gate) |
| `premium/HeroScene.svelte` | WebGLRenderer teardown | `onDestroy` dispose + `forceContextLoss` (in `Scene.svelte`, reached via `useThrelte()`) | ✓ WIRED | `renderer.dispose()` + `renderer.forceContextLoss()` inside `onDestroy`, guarded by try/catch |
| `package.json` test script | `scripts/check-3d-boundary.mjs` | `test:split` invoked after `build` | ✓ WIRED | `"test": "... && pnpm build && pnpm test:split && ..."` |
| `build/index.html` (Accessible entry) | premium chunk | must NOT reference it | ✓ WIRED | Boundary gate confirms zero premium-chunk references in Home's script/modulepreload tags |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| PREM-01 | 04-01, 04-02, 04-03 | Premium mode renders a tasteful Threlte/Three.js hero with restrained motion | ✓ SATISFIED | Scene mounts one decorative canvas (instanced particles + wireframe rings + 2 point lights), gated on mode+motion+WebGL; e2e + axe clean |
| PREM-02 | 04-01, 04-03 | three/@threlte loaded only via dynamic import gated on Premium; verified absent from Accessible entry bundle | ✓ SATISFIED | `check-3d-boundary.mjs` exit 0 (build-time proof); `grep` quarantine check empty; e2e network-split tests pass both directions |
| PREM-04 | 04-02, 04-03 | Scene disposes WebGL resources on navigation/unmount, handles context loss gracefully | ✓ SATISFIED | `Scene.svelte` explicit `dispose()`/`forceContextLoss()`/listener cleanup; e2e nav×15 leak-free + forced context-loss → poster fallback both pass |

No orphaned requirements — PREM-03 (poster fallback in Accessible mode) is correctly attributed to Phase 3 in REQUIREMENTS.md, not Phase 4, and is not orphaned relative to this phase's plans.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| `tests/no-flash.spec.ts` | 3-7 | Pre-existing timing-fragile test (`waitUntil: 'commit'` then immediately reads `document.documentElement`) races under full 8-worker parallel load | ℹ️ Info (non-blocking, out of Phase-4 scope) | See "Full E2E Suite Stability" below — not a PREM-01/02/04 defect |

No blocker or warning-level anti-patterns found in any Phase-4-authored file (`premium/**`, `prefers.svelte.ts`, `check-3d-boundary.mjs`, `premium-3d.spec.ts`). No TODO/FIXME/placeholder/stub patterns, no empty handlers, no hardcoded-empty render paths.

### Full E2E Suite Stability (transparency note)

Running `pnpm exec playwright test` (the full 64-spec suite, default parallelism/workers) twice in
this verification session reproduced a single, consistent failure: `tests/no-flash.spec.ts` — "mode
applied before hydration (no flash) — MODE-03" — with `TypeError: Cannot read properties of null
(reading 'dataset')` (i.e. `document.documentElement` was null at the moment `page.evaluate` ran,
immediately after `waitUntil: 'commit'`).

Root-caused, not assumed:
- Isolated re-run of only that test: **5/5 passes** (`pnpm exec playwright test tests/no-flash.spec.ts -g "MODE-03"`, run 5×).
- Full suite with `--workers=1` (no parallel CPU contention): **64/64 passes**, 0 failures.
- Full suite with default parallel workers (8, matching CPU count): **63/64**, same single failure both times, always the same test.

This is a pre-existing test-design fragility (Phase 2/3, `MODE-03`, not a Phase-4 file) — it races
`page.goto({ waitUntil: 'commit' })` against `document.documentElement` existing at all, which is
timing-sensitive and becomes more likely to lose the race when 8 workers (several running CPU-heavy
WebGL/axe scans from the new Phase-4 suite) contend for CPU simultaneously. It is not a WebGL context
leak, not a boundary leak, and not one of PREM-01/02/04 — all 7 `premium-3d.spec.ts` specs and the
axe both-modes regression passed in every configuration tested (default-parallel ×2, workers=1 ×1).
Flagged here for visibility/follow-up (recommend tightening `no-flash.spec.ts` to wait for
`domcontentloaded` or poll instead of a bare post-commit `evaluate`), but it does not block Phase 4
sign-off since the phase's own three requirement IDs are fully and repeatably green.

### Human Verification Required

None required to close the phase. Per the phase's own Task 3 (04-03-drive-green-and-gates-PLAN.md),
the human aesthetic/vestibular-comfort pass is explicitly optional — all automated gates that can
judge PREM-01/02/04 (axe both-modes incl. wcag2aaa, canvas gating matrix, dispose×15, context-loss
fallback, bundle-boundary proof) are green, so this optional step does not gate phase completion.

### Gaps Summary

No gaps against PREM-01, PREM-02, or PREM-04. All must-haves from all three plans (04-01, 04-02,
04-03) are verified directly against the live codebase and a real build:

- Dependency pins exact, `@threlte/extras` absent.
- Quarantine is airtight: `grep -rEn "from '(three|@threlte)" src/lib | grep -v "src/lib/components/premium/"` returns nothing.
- `pnpm check` exits 0 (0 errors/warnings).
- `BASE_PATH=/diversityincludesdisability_four pnpm build` exits 0 (prerender clean).
- `node scripts/check-3d-boundary.mjs` exits 0: 1 premium chunk split out, Home bundle WebGL-free.
- All 7 `tests/premium-3d.spec.ts` specs pass.
- `tests/a11y.spec.ts` (axe, both modes, wcag2aaa, all 5 routes) passes — 10/10.
- Hero.svelte and PremiumHero.svelte are three-free by grep; HeroScene/Scene own the only
  three/@threlte imports and implement full disposal + context-loss teardown.

The one reproducible full-suite flake (`no-flash.spec.ts` MODE-03 under 8-way parallelism) is
documented above for transparency and follow-up, but is unrelated to the Phase-4 requirement IDs and
is deterministically green in isolation and under serial execution.

---

_Verified: 2026-07-05T06:02:01Z_
_Verifier: Claude (gsd-verifier)_
