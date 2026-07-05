---
phase: 05-launch-hardening
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/content/site.ts
  - src/lib/components/Seo.svelte
  - src/routes/+layout.svelte
  - src/routes/+page.svelte
  - src/routes/about/+page.svelte
  - src/routes/services/+page.svelte
  - src/routes/contact/+page.svelte
  - src/routes/accessibility/+page.svelte
  - tests/seo.spec.ts
  - scripts/check-seo-meta.mjs
  - package.json
autonomous: true
requirements: [SEO-01]

must_haves:
  truths:
    - "Every one of the 5 routes renders a unique <title> and meta description in its prerendered HTML"
    - "Every route carries canonical + og:url + og:image as ABSOLUTE URLs; under BASE_PATH they include /diversityincludesdisability_four/"
    - "A social scraper reading the built HTML (no JS) sees og:* and twitter:* card tags"
  artifacts:
    - path: "src/lib/components/Seo.svelte"
      provides: "Reusable per-route head: title/description/canonical/OG/Twitter composed from ${site.url}${base}${path}"
      min_lines: 30
    - path: "src/lib/content/site.ts"
      provides: "url origin constant + per-page seo{title,description} map"
      contains: "url:"
    - path: "tests/seo.spec.ts"
      provides: "Per-route head presence/correctness e2e (5 routes)"
    - path: "scripts/check-seo-meta.mjs"
      provides: "BASE_PATH build-artifact grep proving absolute base-path canonical/OG"
  key_links:
    - from: "src/routes/*/+page.svelte"
      to: "src/lib/components/Seo.svelte"
      via: "<Seo title=… description=… path=… />"
      pattern: "<Seo"
    - from: "src/lib/components/Seo.svelte"
      to: "$app/paths base"
      via: "${site.url}${base}${path}"
      pattern: "site\\.url.*base"
---

<objective>
Give every route correct, absolute-URL SEO + Open Graph + Twitter metadata baked into the
prerendered HTML (SEO-01, part 1 of 2 — the OG image asset itself is Plan 05-02).

Purpose: social scrapers and search crawlers read a static host with no JS execution; the tags
must be in the baked HTML with crawler-ready absolute URLs under the `/diversityincludesdisability_four`
base path. The deterministic fix (research §"SEO Meta Architecture", Pitfall 2) is to NEVER read the
runtime page URL during prerender — compose from `${site.url}${base}${path}` constants.

Output: `Seo.svelte`, a `url`+`seo` map in `site.ts`, `<Seo>` on all 5 routes, a per-route head e2e
spec, and a BASE_PATH build-artifact grep gate.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/05-launch-hardening/05-RESEARCH.md
@.planning/phases/05-launch-hardening/05-CONTEXT.md
@src/lib/content/site.ts
@src/routes/+layout.svelte
@src/routes/+page.svelte

<facts>
- 5 routes, trailingSlash `'always'`: `/`, `/about/`, `/services/`, `/contact/`, `/accessibility/`.
- `base` from `$app/paths` is `''` locally / in Playwright preview, `/diversityincludesdisability_four` only in the BASE_PATH gh-pages build. THIS is why the e2e asserts origin+path and the build-grep asserts the repo segment (research Pitfall 3).
- `site` is `as const`; adding `url` + `seo` fields is safe. `check-review-markers.mjs` still applies — no `[REVIEW]` strings in rendered copy.
- Content authenticity is LOCKED: SEO descriptions must be PARAPHRASES of existing verified copy in site.ts (mission / heroSubhead / servicesIntro / contactIntro / a11yStatement) — invent no new facts.
- `+layout.svelte` currently hardcodes `<title>Diversity Includes Disability</title>` — remove it; `<Seo>` owns the title (research Pitfall 4).
</facts>

<interfaces>
Seo.svelte contract (verbatim from research §"The Seo component"):
```svelte
<!-- src/lib/components/Seo.svelte -->
<script lang="ts">
	import { base } from '$app/paths';
	import { site } from '$lib/content/site';

	let {
		title,
		description,
		path,
		image = `${site.url}${base}/og-image.png`
	}: { title: string; description: string; path: string; image?: string } = $props();

	const fullTitle = path === '/' ? site.org : `${title} | ${site.org}`;
	const url = `${site.url}${base}${path}`;
	const imageAlt = `${site.org} — ${site.tagline}`;
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={url} />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={site.org} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:image" content={image} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={imageAlt} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
	<meta name="twitter:image:alt" content={imageAlt} />
</svelte:head>
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add url + seo map to site.ts and create Seo.svelte</name>
  <read_first>
    - .planning/phases/05-launch-hardening/05-RESEARCH.md §"SEO Meta Architecture" and §"site.ts additions"
    - src/lib/content/site.ts (the `site` object — you are extending it)
  </read_first>
  <action>
    1. In `src/lib/content/site.ts`, inside the `site = { … } as const` object, add (after `founder`):
       ```ts
       url: 'https://wolfwdavid.github.io', // origin only, NO trailing slash — used for absolute SEO/OG URLs
       seo: {
         home:          { title: 'Diversity Includes Disability', description: 'Intersectional disability equity, inclusion, and representation — training, consulting, and speaking that move organizations from awareness to action.' },
         about:         { title: 'About Eman Rimawi',            description: 'Diversity Includes Disability makes disability central to every diversity, equity, and inclusion conversation — from awareness to durable, accessible practice.' },
         services:      { title: 'Services',                     description: 'Trainings and facilitation, disability consulting, modeling for representation, and speaking and panels — partnership toward durable, accessible practice.' },
         contact:       { title: 'Contact',                      description: 'Reach out about trainings, consulting, modeling, or speaking — or to start a conversation about building disability equity into your work.' },
         accessibility: { title: 'Accessibility Statement',      description: 'Our WCAG 2.2 AA (targeting AAA) accessibility commitment, known issues, feedback path, and review cadence.' }
       },
       ```
       Every description is a PARAPHRASE of existing verified copy (heroSubhead / about.para1 / servicesIntro / contactIntro / a11yStatement.conformanceTarget). Keep each ≤ ~160 chars. Invent no new facts. Use NO `[REVIEW]` text in these strings (they render into HTML).
    2. Create `src/lib/components/Seo.svelte` EXACTLY as the `<interfaces>` snippet above (verbatim).
  </action>
  <acceptance_criteria>
    - `pnpm check` passes (no TS errors; `site.url` and `site.seo.*` typed via `as const`).
    - `rg "url: 'https://wolfwdavid.github.io'" src/lib/content/site.ts` matches.
    - `rg 'site\.url.*base.*path|\$\{site\.url\}\$\{base\}\$\{path\}' src/lib/components/Seo.svelte` matches the URL composition.
    - `rg 'twitter:card' src/lib/components/Seo.svelte` and `rg 'og:image' src/lib/components/Seo.svelte` both match.
    - `node scripts/check-review-markers.mjs` still passes (run after a build in Task 3).
  </acceptance_criteria>
  <verify>
    <automated>pnpm check</automated>
  </verify>
  <done>site.ts exposes `url` + a 5-entry `seo` map; Seo.svelte composes absolute canonical/OG/Twitter tags from constants; type-check green.</done>
</task>

<task type="auto">
  <name>Task 2: Wire <Seo> into all 5 routes and remove the layout title</name>
  <read_first>
    - src/routes/+layout.svelte (remove hardcoded <title>)
    - src/routes/+page.svelte, about/+page.svelte, services/+page.svelte, contact/+page.svelte, accessibility/+page.svelte
    - .planning/phases/05-launch-hardening/05-RESEARCH.md §"Per-page usage"
  </read_first>
  <action>
    1. In `src/routes/+layout.svelte` `<svelte:head>`, DELETE the line `<title>Diversity Includes Disability</title>`. Keep favicon + the two font preloads untouched. (Research Pitfall 4: `<Seo>` now owns the title.)
    2. In each `+page.svelte`, add to the `<script>` imports:
       ```svelte
       import Seo from '$lib/components/Seo.svelte';
       import { site } from '$lib/content/site';   // already imported on most routes — do not duplicate
       ```
       and render `<Seo>` as the FIRST element of the markup, with the matching path (trailingSlash='always'):
       - `+page.svelte`:            `<Seo title={site.seo.home.title} description={site.seo.home.description} path="/" />`
       - `about/+page.svelte`:      `<Seo title={site.seo.about.title} description={site.seo.about.description} path="/about/" />`
       - `services/+page.svelte`:   `<Seo title={site.seo.services.title} description={site.seo.services.description} path="/services/" />`
       - `contact/+page.svelte`:    `<Seo title={site.seo.contact.title} description={site.seo.contact.description} path="/contact/" />`
       - `accessibility/+page.svelte`: `<Seo title={site.seo.accessibility.title} description={site.seo.accessibility.description} path="/accessibility/" />`
    Do not otherwise change page markup (headings/landmarks unchanged — a11y regression must stay green).
  </action>
  <acceptance_criteria>
    - `rg -c '<Seo' src/routes/**/+page.svelte src/routes/+page.svelte` reports a `<Seo` on all 5 route files.
    - `rg '<title>' src/routes/+layout.svelte` returns NOTHING (layout title removed).
    - `rg 'path="/"|path="/about/"|path="/services/"|path="/contact/"|path="/accessibility/"' src/routes` shows all 5 distinct paths.
    - `pnpm check` passes (no duplicate-import or type errors).
  </acceptance_criteria>
  <verify>
    <automated>pnpm check</automated>
  </verify>
  <done>All 5 routes render `<Seo>` with their unique path; the layout no longer hardcodes a title.</done>
</task>

<task type="auto">
  <name>Task 3: Author tests/seo.spec.ts + scripts/check-seo-meta.mjs + package.json scripts</name>
  <read_first>
    - .planning/phases/05-launch-hardening/05-RESEARCH.md §"Validation Architecture" + Pitfall 3
    - playwright.config.ts (webServer runs base-less preview; baseURL = localhost preview)
    - package.json (scripts block)
    - scripts/check-3d-boundary.mjs (Node-ESM build-grep style to mirror)
  </read_first>
  <action>
    1. Create `tests/seo.spec.ts` (asserts tag PRESENCE + origin+path in the base-less preview; the repo segment is grepped in the build gate below):
       ```ts
       import { test, expect } from '@playwright/test';

       const SITE_URL = 'https://wolfwdavid.github.io';
       const ORG = 'Diversity Includes Disability';
       const ROUTES = [
         { path: '/', title: ORG, home: true },
         { path: '/about/', title: 'About Eman Rimawi', home: false },
         { path: '/services/', title: 'Services', home: false },
         { path: '/contact/', title: 'Contact', home: false },
         { path: '/accessibility/', title: 'Accessibility Statement', home: false }
       ];

       for (const r of ROUTES) {
         test(`SEO meta present and correct — ${r.path}`, async ({ page }) => {
           await page.goto(r.path);
           const fullTitle = r.home ? ORG : `${r.title} | ${ORG}`;
           await expect(page).toHaveTitle(fullTitle);

           const desc = page.locator('head meta[name="description"]');
           await expect(desc).toHaveCount(1);
           expect(((await desc.getAttribute('content')) ?? '').length).toBeGreaterThan(20);

           // base='' in preview → canonical/og:url are origin+path (repo segment is asserted by the build-grep gate)
           const url = `${SITE_URL}${r.path}`;
           await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', url);
           await expect(page.locator('head meta[property="og:type"]')).toHaveAttribute('content', 'website');
           await expect(page.locator('head meta[property="og:site_name"]')).toHaveAttribute('content', ORG);
           await expect(page.locator('head meta[property="og:title"]')).toHaveAttribute('content', fullTitle);
           await expect(page.locator('head meta[property="og:url"]')).toHaveAttribute('content', url);
           await expect(page.locator('head meta[property="og:image"]')).toHaveAttribute('content', `${SITE_URL}/og-image.png`);
           await expect(page.locator('head meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
           await expect(page.locator('head meta[name="twitter:image"]')).toHaveAttribute('content', `${SITE_URL}/og-image.png`);
         });
       }
       ```
    2. Create `scripts/check-seo-meta.mjs` — run AFTER a BASE_PATH build; substring checks (robust to head attribute-ordering):
       ```js
       import { readFileSync } from 'node:fs';

       const ORIGIN = 'https://wolfwdavid.github.io';
       const BASE = '/diversityincludesdisability_four';
       const ROUTES = ['/', '/about/', '/services/', '/contact/', '/accessibility/'];
       const IMG = `${ORIGIN}${BASE}/og-image.png`;
       const fails = [];

       for (const r of ROUTES) {
         const file = `build${r}index.html`;
         let html;
         try { html = readFileSync(file, 'utf8'); }
         catch { fails.push(`missing ${file} — build with BASE_PATH=${BASE}`); continue; }

         const canonical = `${ORIGIN}${BASE}${r}`;
         const need = [
           canonical,                 // absolute base-path URL (canonical + og:url share it)
           IMG,                       // og:image absolute under base
           'rel="canonical"', 'name="description"', '<title>',
           'og:type', 'og:site_name', 'og:title', 'og:description', 'og:url', 'og:image',
           'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'
         ];
         for (const n of need) if (!html.includes(n)) fails.push(`${file}: missing ${n}`);
         if (!html.includes('content="summary_large_image"')) fails.push(`${file}: twitter card not summary_large_image`);
       }
       if (fails.length) { console.error('SEO META FAIL:\n' + fails.join('\n')); process.exit(1); }
       console.log('SEO META OK: all 5 routes carry absolute base-path canonical/OG/Twitter meta');
       ```
    3. In `package.json` `scripts`, add:
       ```json
       "test:seo": "playwright test tests/seo.spec.ts",
       "test:seo:build": "node scripts/check-seo-meta.mjs"
       ```
    4. Verify locally:
       - `pnpm test:seo` (base-less preview) → all 5 pass.
       - `BASE_PATH=/diversityincludesdisability_four pnpm build && pnpm test:seo:build` → prints `SEO META OK`.
       - `node scripts/check-review-markers.mjs` on the build → no `[REVIEW]` leaked.
  </action>
  <acceptance_criteria>
    - `pnpm test:seo` exits 0 (5/5 route head assertions green).
    - `BASE_PATH=/diversityincludesdisability_four pnpm build && pnpm test:seo:build` prints `SEO META OK: all 5 routes…` and exits 0.
    - `rg 'https://wolfwdavid.github.io/diversityincludesdisability_four/' build/index.html` matches (absolute base-path canonical baked into HTML).
    - `rg 'test:seo|test:seo:build' package.json` shows both scripts.
    - `node scripts/check-review-markers.mjs` exits 0.
  </acceptance_criteria>
  <verify>
    <automated>pnpm test:seo</automated>
  </verify>
  <done>Per-route head e2e green in preview; the BASE_PATH build-grep proves absolute base-path canonical/OG/Twitter on all 5 routes; both scripts wired into package.json.</done>
</task>

</tasks>

<verification>
- `pnpm check` green.
- `pnpm test:seo` → 5/5.
- `BASE_PATH=/diversityincludesdisability_four pnpm build && pnpm test:seo:build` → `SEO META OK`.
- `rg 'https://wolfwdavid.github.io/diversityincludesdisability_four/' build/index.html` matches.
- Prior gates unaffected: `pnpm test:review`, `pnpm test:content`, `pnpm test:tokens` still pass.
</verification>

<success_criteria>
All 5 routes ship unique title/description and absolute-URL canonical/OG/Twitter tags in their
prerendered HTML; e2e proves tag presence/correctness; a BASE_PATH build-grep proves the repo
segment is present. og:image points at `/og-image.png` (asset delivered by Plan 05-02).
</success_criteria>

<output>
After completion, create `.planning/phases/05-launch-hardening/05-01-SUMMARY.md`.
</output>
