---
phase: 03-accessible-experience
plan: 04
type: execute
wave: 2
depends_on: ["03-01"]
files_modified:
  - src/lib/components/Hero.svelte
  - src/lib/components/ServiceCard.svelte
autonomous: true
requirements: [PREM-03, A11Y-06, A11Y-08]
must_haves:
  truths:
    - "The hero shows a static token/SVG poster with the real headline/subhead/CTA in the DOM (no content in the art)"
    - "The poster is marked decorative (aria-hidden) and plays zero motion"
    - "A service card renders as h3 on Home and h2 on Services (no heading-order break)"
  artifacts:
    - path: "src/lib/components/Hero.svelte"
      provides: "PREM-03 static poster hero, decorative SVG, real content siblings"
      contains: "aria-hidden"
    - path: "src/lib/components/ServiceCard.svelte"
      provides: "Context-adaptive heading level card"
      contains: "svelte:element"
  key_links:
    - from: "src/lib/components/Hero.svelte"
      to: "src/lib/content/site (home) + resolve('/contact')"
      via: "import"
      pattern: "content/site"
    - from: "src/lib/components/ServiceCard.svelte"
      to: "ServiceItem"
      via: "typed prop"
      pattern: "ServiceItem"
---

<objective>
Build the two presentational content components the routes compose: `Hero` (PREM-03 static token/SVG
poster with the real headline/subhead/CTA as DOM siblings, decorative art `aria-hidden`, zero motion —
also the permanent Phase-4 fallback slot) and `ServiceCard` (title + copy + "Let's Connect" link, with a
`level` prop so it is `<h3>` on Home under the "Our Services" `<h2>` and `<h2>` on `/services`, avoiding
the axe heading-order failure).

Purpose: Reusable, heading-safe, decorative-correct building blocks — zero WebGL, zero motion.
Output: `Hero.svelte`, `ServiceCard.svelte`.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/03-accessible-experience/03-CONTEXT.md
@.planning/phases/03-accessible-experience/03-RESEARCH.md
@src/lib/styles/tokens.css

<interfaces>
From src/lib/content/site.ts (created in 03-01):
```typescript
export interface ServiceItem { slug: string; title: string; summary: string; body: string }
export const site: { home: { heroHeadline: string; heroSubhead: string }; contact: { ctaPhrase: string } };
```
Global tokens available: `--primary/--on-primary/--accent`, `--space-*`, `--radius-*`, `--fs-*`, `--focus-ring`.
Reduced-motion is already killed globally in tokens.css — this phase ships NO motion regardless.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Hero.svelte — static poster (PREM-03, A11Y-06, A11Y-08)</name>
  <files>src/lib/components/Hero.svelte</files>
  <read_first>
    - .planning/phases/03-accessible-experience/03-RESEARCH.md (Pattern 5 static poster Hero; §Open Questions 2 — decorative aria-hidden default)
    - src/lib/styles/tokens.css (color/space/radius tokens — no raw hex)
  </read_first>
  <action>
    Create `src/lib/components/Hero.svelte`:
    - `import { site } from '$lib/content/site'; import { resolve } from '$app/paths';`
    - `<section class="hero">` containing FIRST a decorative token-driven `<svg class="hero__poster" aria-hidden="true" focusable="false" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">` — an abstract intersecting-rings / concentric-arcs motif drawn with `currentColor` / `fill`/`stroke` set via CSS custom props (`var(--primary)`, `var(--accent)`), NO `<animate>`/no CSS animation (A11Y-08), NO raster asset (draw inline).
    - THEN a real `<div class="hero__content">` with `<h1>{site.home.heroHeadline}</h1>`, `<p class="hero__subhead">{site.home.heroSubhead}</p>`, and `<a class="hero__cta" href={resolve('/contact')}>{site.contact.ctaPhrase}</a>`.
    - The content is NEVER inside the SVG (satisfies "no content lost" + Phase-4 fallback slot). Add a source comment:
      `<!-- Decorative abstract poster (PREM-03): aria-hidden; all hero meaning lives in the DOM text below, not the art. -->`
    - Scoped `<style>` tokens-only: position the poster behind/beside content; CTA styled as a ≥44px button using `var(--primary)`/`var(--on-primary)`; subhead uses `var(--fs-lg)`/`var(--text-muted)`. No `@keyframes`, no `transition` on load.
  </action>
  <acceptance_criteria>
    - `grep -q 'aria-hidden="true"' src/lib/components/Hero.svelte` and `grep -q 'focusable="false"' src/lib/components/Hero.svelte`
    - `grep -q 'site.home.heroHeadline' src/lib/components/Hero.svelte` and `grep -q 'site.home.heroSubhead' src/lib/components/Hero.svelte`
    - `grep -q "resolve('/contact')" src/lib/components/Hero.svelte`
    - NOT `grep -q '<animate' src/lib/components/Hero.svelte` and NOT `grep -q '@keyframes' src/lib/components/Hero.svelte`
    - NOT `grep -q '<canvas' src/lib/components/Hero.svelte`
    - `node scripts/check-no-raw-hex.mjs` exits 0
  </acceptance_criteria>
  <verify>
    <automated>pnpm check && node scripts/check-no-raw-hex.mjs</automated>
  </verify>
  <done>Hero renders a decorative static SVG poster plus real h1/subhead/CTA siblings, no motion, no canvas, tokens only.</done>
</task>

<task type="auto">
  <name>Task 2: ServiceCard.svelte — context-adaptive heading level</name>
  <files>src/lib/components/ServiceCard.svelte</files>
  <read_first>
    - .planning/phases/03-accessible-experience/03-RESEARCH.md (§ServiceCard with context-adaptive heading level; Pitfall 2 heading order)
  </read_first>
  <action>
    Create `src/lib/components/ServiceCard.svelte`:
    - `import type { ServiceItem } from '$lib/content/site'; import { resolve } from '$app/paths';`
    - `let { service, level = 3, showBody = false }: { service: ServiceItem; level?: 2 | 3; showBody?: boolean } = $props();`
    - `<article class="service-card">` with `<svelte:element this={`h${level}`}>{service.title}</svelte:element>`, then
      `<p>{showBody ? service.body : service.summary}</p>`, then `<a href={resolve('/contact')}>Let's Connect</a>`.
    - Scoped `<style>` tokens-only (surface bg, `--radius-md`, `--border`, ≥44px link target).
    Home will render these with `level={3}` (under a `<h2>Our Services</h2>`); /services with `level={2} showBody`.
  </action>
  <acceptance_criteria>
    - `grep -q 'svelte:element this={`h${level}`}' src/lib/components/ServiceCard.svelte`
    - `grep -q 'level = 3' src/lib/components/ServiceCard.svelte`
    - `grep -q 'ServiceItem' src/lib/components/ServiceCard.svelte`
    - `grep -q "resolve('/contact')" src/lib/components/ServiceCard.svelte`
    - `node scripts/check-no-raw-hex.mjs` exits 0
  </acceptance_criteria>
  <verify>
    <automated>pnpm check && node scripts/check-no-raw-hex.mjs</automated>
  </verify>
  <done>ServiceCard type-checks, renders its title at the requested heading level, shows summary or body, links to contact via resolve().</done>
</task>

</tasks>

<verification>
- `pnpm check` + `node scripts/check-no-raw-hex.mjs` clean.
- Hero contains no `<canvas>`, no `<animate>`, no `@keyframes` (PREM-03 / A11Y-08).
</verification>

<success_criteria>
Two reusable components: a static decorative poster hero with real content siblings, and a heading-level-adaptive
service card — both token-styled, zero motion, zero WebGL, base-path-safe links.
</success_criteria>

<output>
After completion, create `.planning/phases/03-accessible-experience/03-04-SUMMARY.md`.
</output>
