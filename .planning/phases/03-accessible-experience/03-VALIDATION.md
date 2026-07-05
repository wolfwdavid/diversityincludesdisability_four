---
phase: 3
slug: accessible-experience
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-04
---

# Phase 3 — Validation Strategy

> Extends the Phase 2 Playwright/axe suite to all 4 content routes + /accessibility, both modes.
> Playwright + @axe-core/playwright authoritative; grep gates for content-source + base-path + review-markers.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.61 + @axe-core/playwright (E2E/a11y); svelte-check + eslint (static); Node grep gates |
| **Quick run** | `pnpm check` |
| **Full suite** | `pnpm build && pnpm test:e2e` |
| **Runtime** | ~10s static; ~90s E2E (5 routes × 2 modes + interaction tests) |

## Sampling Rate
- After each task: `pnpm check` + the task's grep gate
- After each wave: relevant spec
- Phase gate (final): `pnpm build` + `pnpm test:e2e` all green + `node scripts/check-no-raw-hex.mjs` + review-marker grep

## Per-Requirement Verification Map

| Req | Assertion (automated) |
|-----|----------------------|
| CONT-01 | Home renders hero + mission + 4 service cards + Let's Connect CTA (Playwright text/role queries) |
| CONT-02 | /about renders "About Eman Rimawi" h1 + body paragraphs |
| CONT-03 | /services renders 4 `<h2>` service sections with descriptions |
| CONT-04 | /contact has `a[href^="mailto:emanrimawi@gmail.com"]` with accessible name |
| CONT-05 | Social links present with visible text labels (not icon-only) |
| CONT-06 | grep: pages import from `src/lib/content/site.ts`; no long hardcoded copy strings in `+page.svelte` |
| CONT-07 | Responsive: no horizontal scroll at 375px (`scrollWidth<=clientWidth`) on all routes |
| A11Y-01 | Skip links: first focusable is "Skip to main content"; activating moves focus to `#main` |
| A11Y-02 | Each route: exactly one `<h1>`, no heading-order skips (axe `heading-order`), landmarks present |
| A11Y-03 | axe zero-violations incl `wcag2aaa` on all 5 routes × both modes |
| A11Y-04 | axe `target-size`; nav/toggle boundingBox ≥44; `:focus-visible` present (from Phase 2) |
| A11Y-05 | Keyboard: Tab reaches all nav links; mobile disclosure button opens/closes via keyboard + Escape; no trap |
| A11Y-06 | All `<img>` have `alt` attr; decorative SVG `aria-hidden`; axe `image-alt` clean |
| A11Y-07 | /accessibility route exists with conformance target + feedback email + review cadence text |
| A11Y-08 | `prefers-reduced-motion` → no animation (reuse Phase 2 guard; assert no transition on reduced-motion) |
| PREM-03 | Hero poster element present in both modes (no `<canvas>` in DOM this phase); content intact |
| — | base-path grep: no hardcoded `href="/..."` internal links (use `resolve()`); review-marker grep: no `[REVIEW` in built HTML |

## Wave 0 Requirements
- [ ] Extend `tests/a11y.spec.ts` to loop all routes × both modes
- [ ] New specs: `tests/keyboard-nav.spec.ts`, `tests/content-routes.spec.ts`, `tests/skip-links.spec.ts`
- [ ] `scripts/check-review-markers.mjs` (fail if `[REVIEW` in build/ HTML) + `scripts/check-base-links.mjs` (or fold into existing gate)

## Manual-Only Verifications
| Behavior | Req | Why | Instructions |
|----------|-----|-----|--------------|
| Screen-reader read-through of all pages | A11Y-02/05 | SR nuance human-judged | Optional NVDA/VoiceOver pass; automated axe+keyboard cover the gates |

## Validation Sign-Off
- [x] Every requirement → automated assertion
- [x] Multi-route × multi-mode axe loop
- [x] Wave 0 adds specs + gates
- [x] `nyquist_compliant: true`

**Approval:** approved 2026-07-04
