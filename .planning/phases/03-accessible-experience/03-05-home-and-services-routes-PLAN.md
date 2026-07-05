---
phase: 03-accessible-experience
plan: 05
type: execute
wave: 3
depends_on: ["03-03", "03-04"]
files_modified:
  - src/routes/+page.svelte
  - src/routes/services/+page.svelte
autonomous: true
requirements: [CONT-01, CONT-03]
must_haves:
  truths:
    - "Home shows hero + mission + 4-service overview + founder credibility + Let's Connect CTA"
    - "Services shows 4 h2 sections, each with a clear description"
    - "Each page has exactly one h1 and monotonic heading order"
  artifacts:
    - path: "src/routes/+page.svelte"
      provides: "CONT-01 Home"
      contains: "Hero"
      min_lines: 25
    - path: "src/routes/services/+page.svelte"
      provides: "CONT-03 Services (4 h2 sections)"
      min_lines: 20
  key_links:
    - from: "src/routes/+page.svelte"
      to: "Hero / ServiceCard / site"
      via: "import + compose"
      pattern: "ServiceCard"
    - from: "src/routes/services/+page.svelte"
      to: "site.services"
      via: "each loop"
      pattern: "site.services"
---

<objective>
Build the two service-centric routes that compose the Wave-2 components: Home (`/`, CONT-01 — Hero,
mission section, 4-service overview via ServiceCard level=3, founder credibility strip, "Let's Connect"
CTA band) and Services (`/services`, CONT-03 — intro line + one `<h2>` section per service with its
fuller description). All copy from `site.ts`; single `<h1>` per page; all links via `resolve()`.

Purpose: The two highest-traffic content pages, heading-safe and axe-clean.
Output: rewritten `+page.svelte`, new `services/+page.svelte`.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/03-accessible-experience/03-CONTEXT.md
@.planning/phases/03-accessible-experience/03-RESEARCH.md
@src/routes/+page.svelte

<interfaces>
From 03-01 `site.ts`: `site.home.{heroHeadline,heroSubhead,mission,founderRole,founderPositioning}`,
`site.services: ServiceItem[]`, `site.servicesIntro`, `site.founder`, `site.contact.ctaPhrase`.
From 03-04: `Hero.svelte` (renders its own h1 + CTA), `ServiceCard.svelte` (props `{ service, level, showBody }`).
`resolve` from `$app/paths` for every internal link. Heading rule: exactly one `<h1>` per route inside `<main>`.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Home route (CONT-01)</name>
  <files>src/routes/+page.svelte</files>
  <read_first>
    - .planning/phases/03-accessible-experience/03-CONTEXT.md (`<content>` §Home — hero/mission/services overview/founder strip/CTA band)
    - .planning/phases/03-accessible-experience/03-RESEARCH.md (CONT-01 row; heading-order Pitfall 2)
    - src/lib/components/Hero.svelte, src/lib/components/ServiceCard.svelte (props)
  </read_first>
  <action>
    Replace `src/routes/+page.svelte` entirely. `import Hero from '$lib/components/Hero.svelte'; import ServiceCard from '$lib/components/ServiceCard.svelte'; import { site } from '$lib/content/site'; import { resolve } from '$app/paths';`
    Structure (the ONLY `<h1>` comes from `<Hero />`):
    - `<Hero />` (provides the h1 + hero CTA).
    - Mission `<section aria-labelledby="mission-h">` with `<h2 id="mission-h">Our mission</h2>` + `<p>{site.home.mission}</p>`.
    - Services overview `<section aria-labelledby="services-h">` with `<h2 id="services-h">Our services</h2>` + a card grid
      `{#each site.services as service}<ServiceCard {service} level={3} />{/each}` (cards render `<h3>` — heading order h1→h2→h3, no skip),
      plus a `<a href={resolve('/services')}>` "See all services" link.
    - Founder strip `<section aria-labelledby="founder-h">` with `<h2 id="founder-h">{site.founder}</h2>` + `<p>{site.home.founderRole}</p>` + `<p>{site.home.founderPositioning}</p>` + `<a href={resolve('/about')}>About {site.founder}</a>`.
    - CTA band `<section>` with a `<a href={resolve('/contact')}>{site.contact.ctaPhrase}</a>`.
    Scoped `<style>` tokens-only (grid: 1 col mobile, ~2 col ≥48rem; spacing via `--space-*`). NO copy hardcoded — every string from `site`.
  </action>
  <acceptance_criteria>
    - `grep -q '<Hero' src/routes/+page.svelte` and `grep -q 'ServiceCard' src/routes/+page.svelte`
    - `grep -q 'site.home.mission' src/routes/+page.svelte`
    - `grep -c 'level={3}' src/routes/+page.svelte` ≥ 1 (cards on Home are h3)
    - `grep -q "resolve('/services')" src/routes/+page.svelte` and `grep -q "resolve('/contact')" src/routes/+page.svelte`
    - NOT `grep -q 'href="/' src/routes/+page.svelte`
    - `node scripts/check-content-source.mjs` exits 0
  </acceptance_criteria>
  <verify>
    <automated>pnpm build && npx playwright test tests/headings.spec.ts --grep "/" && npx playwright test tests/a11y.spec.ts --grep "in accessible"</automated>
  </verify>
  <done>Home renders hero + mission + 4 cards + founder strip + CTA, single h1, all copy from site.ts, axe-clean.</done>
</task>

<task type="auto">
  <name>Task 2: Services route (CONT-03)</name>
  <files>src/routes/services/+page.svelte</files>
  <read_first>
    - .planning/phases/03-accessible-experience/03-CONTEXT.md (`<content>` §Services — intro + 4 sections, each h2)
    - src/lib/components/ServiceCard.svelte (level=2 showBody usage)
  </read_first>
  <action>
    Create `src/routes/services/+page.svelte`. `import ServiceCard from '$lib/components/ServiceCard.svelte'; import { site } from '$lib/content/site';`
    - Single `<h1>Services</h1>` inside main.
    - Intro `<p>{site.servicesIntro}</p>` (the field ships from `site.ts` in 03-01 — do NOT edit site.ts here).
    - `{#each site.services as service}<ServiceCard {service} level={2} showBody />{/each}` → four `<h2>` sections each with the fuller `body` description and a "Let's Connect" link.
    Scoped `<style>` tokens-only. No hardcoded copy.
  </action>
  <acceptance_criteria>
    - `grep -q 'site.services' src/routes/services/+page.svelte`
    - `grep -q 'site.servicesIntro' src/routes/services/+page.svelte`
    - `grep -q 'level={2}' src/routes/services/+page.svelte` and `grep -q 'showBody' src/routes/services/+page.svelte`
    - `grep -q '<h1' src/routes/services/+page.svelte`
    - NOT `grep -q 'href="/' src/routes/services/+page.svelte`
    - `node scripts/check-content-source.mjs` exits 0
  </acceptance_criteria>
  <verify>
    <automated>pnpm build && npx playwright test tests/headings.spec.ts --grep "services" tests/content-routes.spec.ts --grep "services"</automated>
  </verify>
  <done>/services renders one h1 + 4 h2 service sections with descriptions, all from site.services, axe- and heading-clean.</done>
</task>

</tasks>

<verification>
- `pnpm build` succeeds; `/` and `/services/` prerender.
- `npx playwright test tests/headings.spec.ts tests/content-routes.spec.ts --grep "(/|services)"` green.
- `node scripts/check-content-source.mjs` exits 0 (both pages import site.ts; no hardcoded internal links).
</verification>

<success_criteria>
Home and Services are complete, single-h1, heading-order-clean pages sourced entirely from `site.ts`, composing the Wave-2 components with base-path-safe links.
</success_criteria>

<output>
After completion, create `.planning/phases/03-accessible-experience/03-05-SUMMARY.md`.
</output>
