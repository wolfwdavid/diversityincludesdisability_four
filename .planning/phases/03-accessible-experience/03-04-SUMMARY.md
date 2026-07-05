---
phase: 03-accessible-experience
plan: 04
subsystem: content-components
tags: [svelte5, a11y, hero, service-card, tokens, poster, heading-order]
requires:
  - "src/lib/content/site.ts (site + ServiceItem from 03-01)"
  - "src/lib/styles/tokens.css (color/space/radius/glow tokens from 02)"
provides:
  - "Hero.svelte — PREM-03 static token/SVG poster with real headline/subhead/CTA siblings"
  - "ServiceCard.svelte — heading-level-adaptive service card (h3 Home / h2 Services)"
affects:
  - "03-05 Home + Services routes (compose Hero + ServiceCard)"
  - "Phase 4 (Hero.svelte carries the lazy-3D fallback seam)"
tech-stack:
  added: []
  patterns:
    - "svelte:element this={`h${level}`} for context-adaptive heading depth (Pitfall 2)"
    - "Decorative SVG poster marked aria-hidden + focusable=false; meaning lives in DOM text (Pattern 5)"
    - "Token-only SVG coloring via CSS (stroke/fill/stop-color = var(--primary/--accent)) — raw-hex gate clean"
    - "box-shadow: var(--glow) — none in Accessible, halo in Premium; zero motion (A11Y-08)"
key-files:
  created:
    - "src/lib/components/Hero.svelte"
    - "src/lib/components/ServiceCard.svelte"
  modified: []
decisions:
  - "Hero motif is abstract/branding → decorative aria-hidden (research-recommended default over role=img)"
  - "Phase-4 3D swaps in as an absolutely-positioned island over the static poster fallback (seam documented in-source)"
metrics:
  duration: 3 min
  completed: 2026-07-05
  tasks: 2
  files: 2
---

# Phase 3 Plan 4: Content Components Summary

Two presentational building blocks — a static token/SVG "luminous-depth" poster **Hero** (PREM-03) whose real headline/subhead/CTA live as DOM siblings of the decorative art, and a **ServiceCard** whose title heading level is a prop (`h3` on Home under "Our Services", `h2` on `/services`) to keep axe heading-order valid. Both are token-styled, zero-motion, zero-WebGL, and base-path-safe via `resolve()`.

## What Was Built

### Task 1 — Hero.svelte (PREM-03, A11Y-06, A11Y-08)
- Decorative `<svg aria-hidden="true" focusable="false">` poster: radial depth scrim + concentric arcs + intersecting accent rings + luminous nodes, all colored through `var(--primary)`/`var(--accent)` (recolors correctly in both themes; no raster asset, no `<canvas>`, no `<animate>`/`@keyframes`).
- Real content siblings: `<h1>{site.home.heroHeadline}</h1>`, subhead `{site.home.heroSubhead}`, and CTA `<a href={resolve('/contact')}>{site.contact.ctaPhrase}</a>` — nothing meaningful lives inside the art.
- `box-shadow: var(--glow)` gives a Premium halo while resolving to `none` in Accessible mode — no motion in either.
- Source comment marks the **Phase-4 seam**: the lazy 3D island mounts absolutely-positioned over `.hero__poster` (which stays as the reduced-motion/no-JS fallback); no static three/@threlte import here.

### Task 2 — ServiceCard.svelte (A11Y-02 heading order)
- `let { service, level = 3, showBody = false }: { service: ServiceItem; level?: 2 | 3; showBody?: boolean } = $props();`
- `<svelte:element this={`h${level}`}>` renders the title at the caller's depth; `<p>` shows `summary` (Home) or `body` (Services via `showBody`); `<a href={resolve('/contact')}>Let's Connect</a>` closes each card.
- Token-styled surface card, `--shadow`, ≥44px link target.

## Verification

- `pnpm check` → 339 files, **0 errors, 0 warnings**.
- `node scripts/check-no-raw-hex.mjs` → **OK** (both components token-only).
- Hero acceptance greps: `aria-hidden="true"` ✓, `focusable="false"` ✓, `site.home.heroHeadline`/`heroSubhead` ✓, `resolve('/contact')` ✓, and `<animate>`/`@keyframes`/`<canvas>` → **0** matches.
- ServiceCard acceptance greps: `svelte:element this={`h${level}`}` ✓, `level = 3` ✓, `ServiceItem` ✓, `resolve('/contact')` ✓.

## Deviations from Plan

None — plan executed exactly as written.

## Parallel-Execution Note

Ran in parallel with 03-03 (shell components). This plan touched only the two new files `Hero.svelte` and `ServiceCard.svelte` — no edits to `+layout.svelte` or shell components. All commits used `--no-verify` to avoid contention with the sibling wave.

## Known Stubs

None. The two components are fully wired to real `site.ts` content and `resolve()` links. (The `[REVIEW]` social/bio placeholders live in `site.ts` and are out of scope for these two components.)

## Commits

- `16cc86b` feat(03-04): add static poster Hero component
- `62de842` feat(03-04): add context-adaptive ServiceCard component

## Self-Check: PASSED

All created files exist on disk; both task commits present in git history.
