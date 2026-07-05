---
phase: 4
slug: premium-3d-needs-research
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-05
---

# Phase 4 — Validation Strategy

> The load-bearing gate is the BUNDLE test: prove zero `three`/`@threlte` in the Accessible graph.
> Plus runtime canvas-gating, disposal, and axe-still-clean-in-premium.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright + @axe-core/playwright (runtime); Node build-grep script (bundle boundary); svelte-check/eslint (static) |
| **Quick run** | `pnpm check` |
| **Bundle gate** | `node scripts/check-3d-boundary.mjs` (after build) |
| **Full suite** | `pnpm build && pnpm test:e2e` |
| **Runtime** | ~10s static; ~90–120s E2E (adds WebGL scene + dispose loop) |

## Sampling Rate
- After each task: `pnpm check`
- After the boundary task: `pnpm build && node scripts/check-3d-boundary.mjs`
- Phase gate: full `pnpm test:e2e` green + bundle gate + axe clean premium

## Per-Requirement Verification Map

| Req | Assertion (automated) |
|-----|----------------------|
| PREM-02 | `scripts/check-3d-boundary.mjs`: after build, the Accessible entry + shared chunks (referenced by build/index.html and non-premium routes) contain NO `@threlte`/`three`/`WebGLRenderer`; AND ≥1 separate premium chunk exists that DOES. Exit non-zero on leak. |
| PREM-02 | Playwright: Accessible mode → `page.locator('canvas')` count 0; no network request for the premium/three chunk. Premium mode (motion allowed) → premium chunk requested, `<canvas>` present. |
| PREM-01 | Playwright: Premium mode (no reduced-motion) renders exactly one `<canvas>` in the hero; it is `aria-hidden="true"` and not in tab order (keyboard tab never lands on it). |
| PREM-01/PREM-03 | Premium + `emulateMedia({reducedMotion:'reduce'})` → NO `<canvas>`, static poster shown instead (no autoplay motion). |
| PREM-04 | Playwright: navigate Home→about→Home ×15 in Premium mode; assert zero console errors matching `/context|WebGL|Too many/i`; canvas count returns to 1, no accumulation. |
| PREM-04 | WebGL-unsupported / import-failure path falls back to poster with content intact (simulate by blocking the chunk or stubbing WebGL) — no thrown error, hero text present. |
| A11Y (regression) | axe zero-violations incl `wcag2aaa` in BOTH modes STILL passes with the canvas present (decorative canvas doesn't introduce violations). |
| — | reduced-motion regression: existing Phase 2/3 reduced-motion + no-flash + all-routes e2e still green (no regression). |

## Wave 0 Requirements
- [ ] `scripts/check-3d-boundary.mjs` (build-grep bundle gate) + wire into package.json `test` chain
- [ ] `tests/premium-3d.spec.ts` (canvas gating, aria-hidden, reduced-motion poster, dispose loop, fallback)
- [ ] Pin + install `three@0.185.1`, `@threlte/core@8.5.16` (extras omitted per research)

## Manual-Only Verifications
| Behavior | Req | Why | Instructions |
|----------|-----|-----|--------------|
| Scene looks tasteful / on-brand | PREM-01 | Aesthetic is human-judged | Optional: view Premium Home, confirm restrained luminous-depth motion, no vestibular discomfort |
| 60fps on low-end | PREM-01 | Hardware-dependent | Optional: throttled CPU check; DPR cap + on-demand render + visibility-pause are the structural guarantees |

## Validation Sign-Off
- [x] Bundle boundary is the primary automated gate (PREM-02)
- [x] Canvas gating, disposal, fallback all automated
- [x] axe regression in premium mode kept green
- [x] `nyquist_compliant: true`

**Approval:** approved 2026-07-05
