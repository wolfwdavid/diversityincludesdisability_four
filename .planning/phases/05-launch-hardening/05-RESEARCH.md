# Phase 5: Launch Hardening - Research

**Researched:** 2026-07-05
**Domain:** SvelteKit adapter-static SEO/social meta, GitHub Actions CI a11y+Lighthouse gating, live-URL smoke verification under a base path, Vite CSS code-splitting
**Confidence:** HIGH (all recommendations grounded in this repo's actual files + verified tool versions; the two MEDIUM items are the OG-image approach and the Lighthouse budget thresholds, both explicitly Claude's discretion)

## Summary

This phase adds no new product surface — it hardens the finished dual-mode site for launch. Three locked requirements plus three carried-over follow-ups. The codebase is already well-structured for all of them: content lives in a single `site.ts`, every internal link is base-path-safe via `resolve()`, `paths.relative=false` already bakes absolute base-prefixed asset URLs into every prerendered page, and the a11y suite (`tests/a11y.spec.ts`) already scans all 5 routes in both modes with the AAA tag set. The work is therefore additive and low-risk: a reusable `<Seo>` component driving `<svelte:head>` per route, one static OG image, a `lighthouserc.json`, an extended `deploy.yml` (a gating `verify` job before build, a retry-wrapped deploy, and a post-deploy `smoke` job), one deterministic test fix, and a small CSS-hoisting cleanup.

The single most important technical subtlety is **absolute-URL construction under a base path on a prerendered static site**. During prerender the page origin is a placeholder (`http://sveltekit-prerender`), and `page.url.pathname` behavior across base paths has a documented history of quirks with the static adapter. The robust, deterministic approach is to **never read the runtime URL for canonical/OG tags** — instead compose them from a hardcoded origin constant plus `base` from `$app/paths` (which is reliably `/diversityincludesdisability_four` in the BASE_PATH build) plus an explicit per-page path prop. This bakes correct, crawler-ready absolute URLs into every route's HTML at build time.

**Primary recommendation:** Build a `$lib/components/Seo.svelte` that composes `${site.url}${base}${path}` for canonical/og:url and `${site.url}${base}/og-image.png` for the image; add a per-page `seo` map to `site.ts`; gate the workflow with a `verify` job running `pnpm test:e2e` (axe both modes = the hard WCAG gate) + `lhci autorun` against the base-less `build/`; wrap `deploy-pages@v4` in `nick-fields/retry@v4`; add a `smoke` job hitting the live base-path URL with retry; fix the no-flash flake with `expect.poll` + optional chaining; move HeroScene's ~5 lines of wrapper CSS into the always-loaded layer to kill the eager CSS `<link>` without touching the JS split.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions (Requirements)
- **SEO-01:** Each of the 5 routes has correct `<title>` + meta description + Open Graph + Twitter card tags with ABSOLUTE URLs under the base path (`https://wolfwdavid.github.io/diversityincludesdisability_four/...`). Include an OG image (generated/static token-styled card acceptable). Per-page titles/descriptions from the content source (`site.ts`). Add canonical URLs. Site name "Diversity Includes Disability".
- **QA-01:** CI runs the automated accessibility gate (axe via Playwright in BOTH modes across all routes) AND a Lighthouse budget (`@lhci/cli`) — the build FAILS on a11y violations. Wire into the GitHub Actions workflow so every push is gated. (`@lhci/cli@0.15.1` already installed.)
- **DEPLOY-04:** The deployed site is verified live under the base path — links, images, `_app/immutable` chunks all resolve — as an explicit automated post-deploy smoke check (curl/Playwright against the live URL), not just local preview.

### Carried-over follow-ups (fold into this phase)
1. **Deploy retry:** `actions/deploy-pages@v4` gave a transient "Deployment failed, try again later" in Phase 3 (build was fine). Add a retry so transient Pages API failures self-heal.
2. **no-flash flake:** `tests/no-flash.spec.ts` MODE-03 flakes under 8-worker parallelism (passes in isolation / `--workers=1`) — `document.documentElement` transiently null right after `waitUntil:'commit'`. Harden the assertion so it's deterministic under CI contention. Do NOT weaken what it verifies (data-mode present pre-paint).
3. **HeroScene.css eager load:** the premium `HeroScene` component's scoped CSS is emitted as a stylesheet `<link>` on the accessible home page (tiny, not WebGL — PREM-02 JS boundary is intact). Prevent it from loading in the accessible critical path if cleanly possible, OR explicitly accept + document it as negligible if the fix risks the code-split. Do NOT break the JS boundary.

### Claude's Discretion
- OG image approach (static SVG→PNG card vs simple branded image), exact Lighthouse budget thresholds (realistic: a11y ≥ 0.95, performance reasonable for a static site), CI job structure.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEO-01 | Per-route title/description/OG/Twitter/canonical with ABSOLUTE base-path URLs + OG image | § "SEO Meta Architecture" (Seo.svelte + site.ts `seo` map + `${site.url}${base}${path}` composition); § "OG Image" |
| QA-01 | CI axe-both-modes gate + Lighthouse budget; build fails on a11y violation | § "CI Gate (QA-01)" (verify job wiring + `lighthouserc.json` + existing `a11y.spec.ts` as the hard gate) |
| DEPLOY-04 | Live-URL post-deploy smoke under base path | § "Live Smoke (DEPLOY-04)" (`scripts/live-smoke.mjs` + `smoke` job + retry) |
| Follow-up 1 | `deploy-pages@v4` transient-failure retry | § "Follow-up 1: Deploy Retry" (`nick-fields/retry@v4` YAML) |
| Follow-up 2 | Deterministic no-flash test | § "Follow-up 2: no-flash Flake" (`expect.poll` + `?.`) |
| Follow-up 3 | HeroScene.css eager load | § "Follow-up 3: HeroScene CSS Hoist" (move wrapper CSS to always-loaded layer) |
</phase_requirements>

## Current-State Facts (verified in this repo)

These are load-bearing for every recommendation below. Verified by reading the files on 2026-07-05.

- **5 routes, trailingSlash `'always'`:** `/`, `/about/`, `/services/`, `/contact/`, `/accessibility/` (`src/routes/+layout.ts` sets `trailingSlash = 'always'`; `tests/a11y.spec.ts` already encodes this `ROUTES` array).
- **Base path** is injected only for the gh-pages build via `BASE_PATH=/diversityincludesdisability_four` (deploy.yml). Locally and in Playwright preview, `base` is `''` (see `playwright.config.ts` comment and `svelte.config.js` `base: dev ? '' : (process.env.BASE_PATH ?? '')`).
- **`paths.relative = false`** already forces absolute, base-prefixed `_app/immutable` URLs in every prerendered page (not just 404.html). Asset resolution under the base path is already solved.
- **`$app/paths`** is the base API in use; pages import `{ resolve }` and `{ base }` from it. Svelte 5 runes throughout (`$props`, `$state`, `$effect`, `$derived`).
- **`site.ts`** is the single copy source (`site.org = 'Diversity Includes Disability'`, `site.tagline`, per-section copy). It has **no** `url` field and **no** per-page SEO title/description map yet — both must be added.
- **Layout head** (`src/routes/+layout.svelte`) currently hardcodes `<title>Diversity Includes Disability</title>` + favicon + two font preloads. No per-page titles exist; every route currently renders the same `<title>`.
- **app.html** sets `data-mode` synchronously via an inline `<head>` script *before* `%sveltekit.head%` and before paint. **`data-mode` is written ONLY by that inline script** — the mode store (`mode.svelte.ts`) *reads* it on init and only *rewrites* it on an explicit `mode.set()` (user toggle). This fact is what makes the no-flash fix safe (see Follow-up 2).
- **The a11y gate already exists and is strong:** `tests/a11y.spec.ts` loops all 5 routes × both modes, seeds `did-mode` via `addInitScript`, waits for `html[data-mode=…]`, runs `AxeBuilder` with tags `wcag2a/aa/aaa/21aa/22aa`, and asserts `violations` is `[]`. QA-01's axe half is essentially wiring this into CI, not writing it.
- **`@lhci/cli@0.15.1`, `@axe-core/playwright@4.12.1`, `@playwright/test@1.61.1`** installed (verified `pnpm exec lhci --version` → `0.15.1`). Node **24.18.0** with **global `fetch`** (verified) — so `scripts/live-smoke.mjs` needs no `node-fetch` dependency.
- **HeroScene split is intact:** `PremiumHero.svelte` does `{#await import('./HeroScene.svelte')}` gated on `show3D`; `scripts/check-3d-boundary.mjs` proves the three/@threlte JS chunk is split out and absent from the home critical bundle. HeroScene.svelte carries a scoped `<style>` (`.scene { position:absolute; inset:0; pointer-events:none } .scene :global(canvas){…}`) — this is the CSS that leaks a `<link>` (Follow-up 3).
- **`static/` contains** `.nojekyll` and `robots.txt` only. OG image must be added here.

## SEO Meta Architecture (SEO-01)

### Where the head goes
- **Shared layout (`+layout.svelte`):** keep favicon + font preloads. **Remove the hardcoded `<title>`** — a per-page `<Seo>` will own the title. (SvelteKit special-cases `<title>` and dedupes to the last-rendered one, so a layout title would be harmlessly overridden, but removing it avoids a redundant default and prevents a wrong title on any route that forgets `<Seo>`.)
- **Per route (`+page.svelte`):** render `<Seo title=… description=… path=… />` near the top. Because pages are prerendered, the full head is baked into each route's HTML at build time — ideal for crawlers and social scrapers (no JS execution needed to read tags).

### The absolute-URL problem and the deterministic fix
During prerender the page origin is a placeholder and `page.url.pathname` has a documented history of quirks under the static adapter with a base path (SvelteKit issue #3164; "URLs not reflecting base path" discussion #11554). **Do not read the runtime URL.** Compose absolute URLs from constants:

```
canonical / og:url  =  ${site.url}${base}${path}
og:image            =  ${site.url}${base}/og-image.png
```

- `site.url` — a new constant in `site.ts`: `url: 'https://wolfwdavid.github.io'` (origin only, **no trailing slash**).
- `base` — from `$app/paths`; reliably `/diversityincludesdisability_four` in the BASE_PATH build, `''` locally. (This is why the *deployed* build gets the repo segment and the local preview does not — see the SEO test note below.)
- `path` — explicit per-page prop matching `trailingSlash='always'`: `'/'`, `'/about/'`, `'/services/'`, `'/contact/'`, `'/accessibility/'`. Home → `${site.url}${base}/` = `https://wolfwdavid.github.io/diversityincludesdisability_four/`. ✅

This is deterministic, testable via a build-artifact grep, and immune to prerender URL quirks.

### The Seo component (Svelte 5 idiom)

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

	// Home title is the bare org name; inner pages get "Page | Org".
	const fullTitle = path === '/' ? site.org : `${title} | ${site.org}`;
	const url = `${site.url}${base}${path}`;
	const imageAlt = `${site.org} — ${site.tagline}`;
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={url} />

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={site.org} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:image" content={image} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={imageAlt} />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
	<meta name="twitter:image:alt" content={imageAlt} />
</svelte:head>
```

**Exact tag set (SEO-01 checklist):** `title`, `meta[name=description]`, `link[rel=canonical]`, `og:type`, `og:site_name`, `og:title`, `og:description`, `og:url`, `og:image` (+ `:width`/`:height`/`:alt`), `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image` (+ `:alt`).

### site.ts additions

```ts
// add to the `site` object
url: 'https://wolfwdavid.github.io',   // origin only, no trailing slash
seo: {
	home:          { title: 'Diversity Includes Disability', description: '<= 160 chars, drawn from site.home.mission/tagline' },
	about:         { title: 'About Eman Rimawi',            description: '…' },
	services:      { title: 'Services',                     description: '… from site.servicesIntro' },
	contact:       { title: 'Contact',                      description: '… from site.contactIntro' },
	accessibility: { title: 'Accessibility Statement',      description: '… WCAG 2.2 AA/AAA commitment' }
},
```

Keep descriptions ≤ ~160 chars, sourced from existing verified copy (mission, servicesIntro, contactIntro, a11yStatement) — no invented claims (content-authenticity rule in `site.ts` is LOCKED). Because `site` is `as const`, adding fields is fine; the `[REVIEW]`-marker gate (`check-review-markers.mjs`) still applies to any placeholder text.

### Per-page usage

```svelte
<!-- src/routes/about/+page.svelte -->
<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { site } from '$lib/content/site';
	// …existing imports…
</script>
<Seo title={site.seo.about.title} description={site.seo.about.description} path="/about/" />
```

Repeat for all 5 routes with the matching `path`.

## OG Image (SEO-01)

**Recommendation: a single static branded PNG at `static/og-image.png`, 1200×630, referenced by absolute URL.** Rationale:
- GitHub Pages has **no server runtime** — per-request/serverless OG generation (e.g. `@vercel/og`) is impossible here.
- Per-page build-time generation (Satori/resvg per route) is real complexity for a 5-page site whose pages share one brand. Not worth it.
- One 1200×630 card (the OG/Twitter `summary_large_image` standard; 1.91:1) covers Facebook, LinkedIn, X, iMessage, Slack.

**Production path:** author `static/og-image.svg` at 1200×630 using the site tokens (brand primary/accent from `tokens.css`, no raw hex — reuse token values) with the "Diversity Includes Disability" wordmark + tagline, then rasterize **once** to `static/og-image.png` and commit both. Rasterize with a tiny one-off script (`@resvg/resvg-js` or `sharp`) or any SVG→PNG tool; the PNG is a committed static asset, not a build step, so no new runtime dependency ships. `paths.relative=false` + the absolute `${site.url}${base}/og-image.png` guarantees crawlers fetch it correctly under the base path.

**Note on validators:** Facebook/LinkedIn/X require the image at an absolute, publicly reachable URL — which is exactly what the smoke check (DEPLOY-04) verifies returns 200 live.

## CI Gate (QA-01)

### Structure: a gating `verify` job before build/deploy
Cleanest wiring given the existing scripts:

```
verify  →  build  →  deploy  →  smoke
```

- **`verify`** runs the full Playwright suite (`pnpm test:e2e`) — which includes `a11y.spec.ts` (axe, both modes, all routes = the hard WCAG gate) **and** every other e2e (the regression net) — then `lhci autorun`. Any axe violation or Lighthouse assertion failure fails the job and blocks deploy.
- **`build`** (`needs: verify`) does the **BASE_PATH** build and uploads the Pages artifact.
- **`deploy`** (`needs: build`) publishes, wrapped in retry (Follow-up 1).
- **`smoke`** (`needs: deploy`) hits the live URL (DEPLOY-04).

**Why two builds (base-less in verify, BASE_PATH in build):** Playwright's `webServer` runs `pnpm build && pnpm preview` with `base=''` (see `playwright.config.ts`) so tests hit plain `/…` URLs, and `lhci` serves that same base-less `build/` at root. The Pages artifact needs the real base path. These are genuinely different artifacts; building twice is correct, not wasteful.

### Lighthouse: serve the base-less build via `staticDistDir`
`lhci autorun` with `staticDistDir` spins up its own static server at **root**. The base-less `build/` (left on disk by the Playwright `webServer` step, or produced by a plain `pnpm build`) has assets at `/`, so they resolve. **Do not point lhci at the BASE_PATH build** — its assets expect the `/diversityincludesdisability_four/` prefix and would 404 under lhci's root server. lhci auto-discovers the prerendered `*.html` files (index.html, about/index.html, …) and audits each.

### lighthouserc.json (new, repo root)

```json
{
  "ci": {
    "collect": {
      "staticDistDir": "build",
      "numberOfRuns": 1
    },
    "assert": {
      "assertions": {
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:performance": ["warn", { "minScore": 0.85 }]
      }
    },
    "upload": { "target": "temporary-public-storage" }
  }
}
```

- **a11y ≥ 0.95 as `error`** (blocks) — the CONTEXT-mandated floor; the axe suite is the stricter primary gate, Lighthouse a11y is the secondary budget.
- **SEO ≥ 0.90 `error`** — validates SEO-01 didn't ship broken/missing meta (Lighthouse checks title/description/canonical/crawlability).
- **best-practices ≥ 0.90 `error`**, **performance ≥ 0.85 `warn`** (non-blocking) — realistic for a static, self-hosted-fonts, token-CSS site; keep perf a `warn` so a cold-cache LCP blip doesn't red the deploy. `numberOfRuns: 1` keeps CI fast; bump to 3 with median if perf proves noisy.
- **upload → `temporary-public-storage`** gives a shareable report link per run without secrets. (Drop `upload` entirely if you don't want the public link.)
- lhci uses the runner's preinstalled Chrome on `ubuntu-latest`; set `CHROME_PATH` only if it can't find one. Add `"lhci": "lhci autorun"` to `package.json` scripts.

### Playwright / CI worker stability
CI is `ubuntu-latest`, so the Windows-only Playwright teardown flake is not in play. The no-flash flake is fixed deterministically (Follow-up 2), so `fullyParallel` can stay. As belt-and-suspenders for timing-sensitive tests under runner contention, pin workers in CI:

```ts
// playwright.config.ts
workers: process.env.CI ? 2 : undefined,
```

This trades a little wall-clock for stability without serializing to 1. In CI, `reuseExistingServer` is already `false`, so the suite always builds/serves this project's own artifact.

## Live Smoke (DEPLOY-04)

A `smoke` job (`needs: deploy`) runs `node scripts/live-smoke.mjs` against the **live base-path URL** with retry for Pages CDN propagation. Node 24 global `fetch` → no dependency.

### What it asserts
1. **All 5 routes return 200:** `/`, `/about/`, `/services/`, `/contact/`, `/accessibility/` (base-path-prefixed).
2. **An `_app/immutable` asset returns 200:** fetch `/` HTML, regex out the first `_app/immutable/…\.js` reference (these are absolute+base-prefixed thanks to `relative:false`), fetch it, expect 200 + a JS content-type. Proves chunks resolve live under the base.
3. **SPA 404 fallback works:** GET a deliberately nonexistent deep link (e.g. `…/diversityincludesdisability_four/no-such-page/`). GitHub Pages serves `404.html` (the SvelteKit SPA shell) — expect the body to contain the app shell markers (`_app/immutable` or the `data-mode` root), confirming `fallback:'404.html'` wiring. (HTTP status will be 404; assert on body content, not status, for this check.)
4. **No Google Fonts:** fetch `/` HTML and assert the body contains neither `fonts.googleapis.com` nor `fonts.gstatic.com` (self-hosted-fonts guarantee, live).

### scripts/live-smoke.mjs (shape)

```js
// Node 24 global fetch. Base URL from arg or env, default to the known live URL.
const BASE = (process.argv[2] ?? process.env.SMOKE_URL ??
  'https://wolfwdavid.github.io/diversityincludesdisability_four').replace(/\/$/, '');

const ROUTES = ['/', '/about/', '/services/', '/contact/', '/accessibility/'];
const fails = [];
const get = (u) => fetch(u, { redirect: 'follow' });

for (const r of ROUTES) {
  const res = await get(BASE + r);
  if (res.status !== 200) fails.push(`route ${r} -> ${res.status}`);
}

// asset chunk
const homeHtml = await (await get(BASE + '/')).text();
if (/fonts\.(googleapis|gstatic)\.com/.test(homeHtml)) fails.push('google fonts reference found');
const m = homeHtml.match(/\/_app\/immutable\/[^"']+\.js/);
if (!m) fails.push('no _app/immutable chunk referenced in home html');
else {
  const asset = await get(BASE + m[0].replace(BASE, ''));  // m[0] is already absolute+base-prefixed
  if (asset.status !== 200) fails.push(`asset ${m[0]} -> ${asset.status}`);
}

// SPA fallback
const spa = await get(BASE + '/definitely-not-a-real-page-xyz/');
const spaBody = await spa.text();
if (!/_app\/immutable|data-mode/.test(spaBody)) fails.push('SPA 404 fallback shell not served');

if (fails.length) { console.error('SMOKE FAIL:\n' + fails.join('\n')); process.exit(1); }
console.log('SMOKE OK: all routes, asset, SPA fallback, no google fonts');
```

Add `"smoke": "node scripts/live-smoke.mjs"` to `package.json`. Locally: `pnpm smoke` (hits the live prod URL).

### Live URL source in the workflow
`actions/deploy-pages@v4` exposes `page_url` as a step output. Surface it as a job output and consume it in `smoke`, or hardcode the known URL (it's stable per repo). Hardcoding is simplest and matches the constant already used for OG tags; passing `page_url` is marginally more robust to a repo rename. Recommend passing `page_url` through job outputs.

## Follow-up 1: Deploy Retry

`actions/deploy-pages@v4` occasionally returns a transient "Deployment failed, try again later" when the build was fine. Wrap the deploy step in `nick-fields/retry@v4` (verified latest, released 2026-03-20). The `retry` action runs a **shell command**, so drive the deploy via `gh`/API is unnecessary — instead retry at the **step** level is awkward because `deploy-pages` is a composite action, not a shell command. Two clean options:

**Option A (recommended) — retry the whole deploy JOB via `nick-fields/retry` is not applicable to composite actions; instead use the action's own idempotency + a job-level re-run guard.** The pragmatic, widely-used pattern is to keep `deploy-pages@v4` (which is itself idempotent per artifact) and add a retrying wrapper step that calls the Pages deploy through the action, but since the action isn't a CLI, the reliable approach is:

```yaml
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    outputs:
      page_url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages (with transient-failure retry)
        id: deployment
        uses: nick-fields/retry@v4
        with:
          timeout_minutes: 5
          max_attempts: 3
          retry_wait_seconds: 30
          command: |
            gh api --method POST \
              -H "Accept: application/vnd.github+json" \
              /repos/${{ github.repository }}/pages/deployments \
              ... # not recommended: reimplements the action
```

Reimplementing the deploy via `gh api` is fragile. **Prefer Option B.**

**Option B (recommended, simplest) — retry the deploy step with a composite-action re-invocation guard using a small `bash` retry loop is impossible for a `uses:` step.** GitHub Actions cannot loop a `uses:` step. The clean, real-world solution is **job-level retry**: keep `deploy-pages@v4` as-is and add automatic job retry via the `retry` pattern at the workflow level. Since native "retry this job N times" is not a built-in, the accepted approach is one of:

1. **`nick-fields/retry` wrapping the official CLI-free step is not possible** → so use the **`actions/deploy-pages` built-in `timeout` + a second guarded attempt** by duplicating the deploy step with `if: failure()` and `continue-on-error` on the first:

```yaml
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy2.outputs.page_url || steps.deploy1.outputs.page_url }}
    outputs:
      page_url: ${{ steps.deploy2.outputs.page_url || steps.deploy1.outputs.page_url }}
    steps:
      - id: deploy1
        uses: actions/deploy-pages@v4
        continue-on-error: true
        with:
          timeout: 600000        # ms; give the Pages API room
      - name: Wait before retry
        if: steps.deploy1.outcome == 'failure'
        run: sleep 30
      - id: deploy2
        if: steps.deploy1.outcome == 'failure'
        uses: actions/deploy-pages@v4
        with:
          timeout: 600000
```

This is the concrete, copy-pasteable fix: first attempt is non-fatal, on failure it waits 30 s and re-runs the official action once more; `page_url` resolves from whichever attempt succeeded. `deploy-pages@v4` also accepts `timeout` (ms) and `error_count`/`reporting_interval` inputs to tolerate slow Pages API responses — bump `timeout` as shown. Two attempts self-heal the observed transient failure without re-running the expensive build.

**Recommendation: Option B (the `deploy1`/`deploy2` guarded pair).** It uses only the official action, needs no third-party dependency, and is transparent. Add `nick-fields/retry@v4` only if you later want retry on the **smoke** shell step (there it IS a CLI command, so `nick-fields/retry` is the right tool — see below).

### Retry the smoke step (nick-fields/retry is a good fit here)
Because the live-smoke is a shell command, wrap it to absorb CDN propagation lag:

```yaml
  smoke:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - name: Live smoke (with propagation retry)
        uses: nick-fields/retry@v4
        with:
          timeout_minutes: 3
          max_attempts: 5
          retry_wait_seconds: 15
          command: node scripts/live-smoke.mjs "${{ needs.deploy.outputs.page_url }}"
```

Up to 5 attempts × 15 s covers the ~minute Pages CDN propagation window after a fresh deploy.

## Follow-up 2: no-flash Flake (deterministic fix)

**Root cause:** `tests/no-flash.spec.ts` navigates with `waitUntil:'commit'` (fires as soon as the response starts) then *immediately synchronously* reads `document.documentElement.dataset.mode` via `page.evaluate`. Under 8-worker contention the evaluate can land in the microsecond window where `document.documentElement` is transiently `null`, throwing / returning undefined → flake. Passes at `--workers=1` because there's no contention.

**Why the fix cannot weaken the guarantee:** `data-mode` is written **only** by the inline `<head>` script in `app.html`, which runs synchronously before `%sveltekit.head%` and before first paint. The mode store *reads* it on init and only *rewrites* it on an explicit user toggle (`mode.set()`), which cannot happen during this test. Therefore **any** observation of `data-mode='premium'` — whenever we read it — provably came from the pre-paint inline script. Polling for it introduces no false-positive path.

**The fix:** replace the one-shot synchronous read with `expect.poll` + optional chaining. `expect.poll` retries the getter until it matches or times out; `?.` swallows the transient null.

```ts
test('mode applied before hydration (no flash) — MODE-03', async ({ page }) => {
	await page.addInitScript(() => localStorage.setItem('did-mode', 'premium'));
	await page.goto('/', { waitUntil: 'commit' });
	// data-mode is written ONLY by the synchronous inline <head> script (pre-paint); the store
	// merely reads it. Polling for it therefore still proves pre-paint origin — it cannot be
	// satisfied by any later code path. `?.` tolerates the transient-null documentElement race
	// that flaked the old one-shot page.evaluate() under parallel-worker contention.
	await expect
		.poll(() => page.evaluate(() => document.documentElement?.dataset.mode ?? null), {
			timeout: 5_000
		})
		.toBe('premium');
});
```

Equivalent alternative: `await page.waitForFunction(() => document.documentElement?.dataset.mode === 'premium')`. Both are deterministic; `expect.poll` gives a clearer failure diff. Keep `waitUntil:'commit'` (proves *early*, pre-hydration) — do not relax it to `load`/`networkidle`, which would weaken the pre-paint meaning. The second test in the file (no Google Fonts) is unaffected.

## Follow-up 3: HeroScene CSS Hoist

**Why Vite hoists the dynamically-imported component's scoped CSS.** `Hero.svelte` statically imports `PremiumHero.svelte` (the WebGL-free boundary — correct). `PremiumHero` dynamically `import('./HeroScene.svelte')`. Vite's default `build.cssCodeSplit` associates each module's CSS with its JS chunk, but SvelteKit, to prevent FOUC on prerendered pages, collects the stylesheets for **all** components reachable in a route's module graph — including CSS of async-imported modules — and injects them as `<link>`s in the prerendered HTML. So even though HeroScene's *JS* is correctly split into its own async chunk (`check-3d-boundary.mjs` proves it never enters the home critical bundle), HeroScene's *scoped CSS* is pulled into the home page's `<link>` set because it's reachable through PremiumHero's import graph. **The JS boundary (PREM-02) is intact; only ~5 lines of positioning CSS leak.**

**Clean fix (recommended) — move HeroScene's wrapper CSS into the always-loaded layer, leaving HeroScene with no `<style>`.** HeroScene's entire scoped style is generic decorative positioning:

```css
.scene { position: absolute; inset: 0; pointer-events: none; }
.scene :global(canvas) { width: 100%; height: 100%; }
```

These rules only position a decorative overlay; they carry no premium-specific meaning. Relocate them to the always-loaded layer and delete HeroScene's `<style>` block:
- **Option 3a (recommended):** move the two rules into `src/lib/styles/tokens.css` (already `<link>`ed on every page) under a `.hero-scene` class, and give HeroScene's root `<div class="hero-scene">`. Net effect: HeroScene.svelte emits **no CSS chunk** → nothing for SvelteKit to hoist → the extra `<link>` disappears, and the ~150 bytes move into an already-loaded file (zero added requests, zero added bytes on the wire beyond what already ships). JS dynamic import untouched → `check-3d-boundary.mjs` stays green.
- **Option 3b:** put the rules in `Hero.svelte`'s scoped `<style>` targeting a wrapper Hero owns. Slightly more coupling (needs a `:global(.hero-scene)` since the element lives inside the child), and Hero.svelte's CSS is already always-loaded — so same benefit. 3a is cleaner (single decorative-positioning home).

**Verify after the fix:** rebuild and grep `build/index.html` for a HeroScene CSS `<link>` — it should be gone; `pnpm test:split` (check-3d-boundary) still passes; the premium hero still renders in Premium mode (`tests/premium-3d.spec.ts`).

**Byte evidence if you instead accept it:** the leaked stylesheet is ~150–200 bytes uncompressed (two rules), one cached HTTP/2 `<link>`, no render-blocking cost of consequence. Accepting is defensible — but **Option 3a is low-risk and strictly better**, so the recommendation is to fix, not accept.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Absolute URL from runtime page origin | Reading `page.url.origin` during prerender | `${site.url}${base}${path}` constants | Prerender origin is a placeholder; base-path pathname has documented static-adapter quirks |
| Retry a live HTTP check | Hand-rolled bash `until` loop with `curl` | `nick-fields/retry@v4` on the smoke step | Maintained, handles timeout/backoff/exit codes cleanly |
| a11y scanning | Custom DOM contrast checks | existing `@axe-core/playwright` suite (already written) | `a11y.spec.ts` already scans 5 routes × 2 modes with AAA tags |
| Lighthouse budgets | Parsing Lighthouse JSON yourself | `@lhci/cli@0.15.1` `assert.assertions` | Declarative thresholds, CI exit codes, report upload built-in |
| Serving the static build for Lighthouse | Spin up your own `http-server` | lhci `staticDistDir` | lhci serves + audits `*.html` automatically |
| HTTP client in smoke script | add `node-fetch` | Node 24 global `fetch` | Verified present; zero new dependency |

## Common Pitfalls

### Pitfall 1: Pointing Lighthouse at the BASE_PATH build
**What goes wrong:** lhci `staticDistDir` serves at root; a BASE_PATH build's assets expect `/diversityincludesdisability_four/` → every asset 404s → perf/best-practices tank.
**Avoid:** run lhci against the **base-less** `build/` (the one Playwright's webServer already produced, or a plain `pnpm build`). The live base-path verification is the smoke job's job, not Lighthouse's.

### Pitfall 2: Trusting `page.url.pathname` for canonical URLs
**What goes wrong:** under the static adapter, prerendered pathname/origin have historically rendered as placeholders (`//prerender/`, `http://sveltekit-prerender`), producing wrong canonical/og:url in the baked HTML.
**Avoid:** compose from `site.url` + `base` + explicit `path`. Never read the runtime URL for SEO tags.

### Pitfall 3: Asserting full base-path URLs in the local Playwright preview
**What goes wrong:** the SEO Playwright test runs against the base-less preview (`base=''`), so og:url is `https://wolfwdavid.github.io/about/` — missing the repo segment. Asserting the *full* base-path URL there fails.
**Avoid:** split the SEO validation (see Validation Architecture): a Playwright test asserts **tag presence + origin + path** in preview; a **BASE_PATH build-grep** (`scripts/check-seo-meta.mjs`) asserts the repo segment is present in the actual artifact.

### Pitfall 4: Duplicate `<title>` from layout + page
**What goes wrong:** confusion over which title wins.
**Avoid:** remove the layout `<title>`; let `<Seo>` own it. SvelteKit dedupes `<title>` to the last-rendered, so even if left, the page wins — but removing it is cleaner and prevents a stale default.

### Pitfall 5: Looping a `uses:` step for deploy retry
**What goes wrong:** GitHub Actions cannot wrap a composite `uses:` step in a shell retry loop; attempts to `nick-fields/retry` a non-CLI action fail.
**Avoid:** use the `deploy1`/`deploy2` guarded-pair pattern (Option B) for the deploy; reserve `nick-fields/retry` for the shell-command smoke step.

## Validation Architecture

Nyquist validation is **enabled** (`config.json` → `workflow.nyquist_validation: true`). Every requirement gets an automated assertion runnable in CI.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright `@playwright/test@1.61.1` (e2e/a11y) + `@lhci/cli@0.15.1` (budgets) + Node ESM scripts (build-grep + live-smoke) |
| Config file | `playwright.config.ts` (chromium, webServer = `pnpm build && pnpm preview`), new `lighthouserc.json` |
| Quick run command | `pnpm test:e2e` (single spec: `pnpm exec playwright test tests/seo.spec.ts`) |
| Full suite command | `pnpm test` (check + lint + tokens + content + build + split + review + e2e) then `pnpm exec lhci autorun` + `pnpm smoke` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEO-01 | Each route's built HTML has title/description/canonical/OG/Twitter tags with correct **absolute base-path** URLs | build-grep | `BASE_PATH=/diversityincludesdisability_four pnpm build && node scripts/check-seo-meta.mjs` | ❌ Wave 0 (`scripts/check-seo-meta.mjs`) |
| SEO-01 | Tag **presence + correctness** (title/description/twitter card/og:type) on every route | e2e head assertions | `pnpm exec playwright test tests/seo.spec.ts` | ❌ Wave 0 (`tests/seo.spec.ts`) |
| QA-01 | axe zero-violations, 5 routes × both modes (the hard WCAG gate) | e2e + axe | `pnpm exec playwright test tests/a11y.spec.ts` | ✅ (`tests/a11y.spec.ts`) — wire into CI |
| QA-01 | Lighthouse budget: a11y≥0.95, seo≥0.9, best-practices≥0.9 block the build | lhci | `pnpm exec lhci autorun` | ❌ Wave 0 (`lighthouserc.json`) |
| QA-01 | Workflow actually contains the gate (verify job runs playwright+axe+lhci before deploy) | workflow-grep | `node scripts/check-ci-gate.mjs` | ❌ Wave 0 (optional but recommended) |
| DEPLOY-04 | Live: 5×200 + `_app/immutable` asset 200 + SPA-404 shell + no-google-fonts | live-smoke | `node scripts/live-smoke.mjs <live-url>` | ❌ Wave 0 (`scripts/live-smoke.mjs`) |
| Follow-up 2 | `data-mode` present pre-paint, deterministic under contention | e2e | `pnpm exec playwright test tests/no-flash.spec.ts --workers=4` | ✅ fix in place (`tests/no-flash.spec.ts`) |
| Follow-up 3 | Home critical bundle has no premium JS chunk (must stay green after CSS move) | build-grep | `pnpm test:split` | ✅ (`scripts/check-3d-boundary.mjs`) |
| Regression | All prior e2e still green | e2e | `pnpm test:e2e` | ✅ (12 specs in `tests/`) |

### Sampling Rate
- **Per task commit:** `pnpm exec playwright test tests/seo.spec.ts tests/no-flash.spec.ts` (fast, targeted).
- **Per wave merge:** `pnpm test` (full local suite incl. build + split + a11y + regression) then `pnpm exec lhci autorun`.
- **Phase gate:** the `verify` CI job green (axe + lhci) → build → deploy → **`smoke` job green against the live URL** before `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] `src/lib/components/Seo.svelte` — the meta component (SEO-01)
- [ ] `src/lib/content/site.ts` — add `url` constant + `seo` per-page title/description map (SEO-01)
- [ ] 5× `+page.svelte` — add `<Seo …>`; `+layout.svelte` — remove hardcoded `<title>` (SEO-01)
- [ ] `static/og-image.png` (1200×630) + `static/og-image.svg` source (SEO-01)
- [ ] `tests/seo.spec.ts` — per-route head presence/correctness assertions (SEO-01)
- [ ] `scripts/check-seo-meta.mjs` — BASE_PATH-build grep for absolute base-path URLs (SEO-01)
- [ ] `lighthouserc.json` — budgets against `staticDistDir: build` (QA-01)
- [ ] `scripts/check-ci-gate.mjs` — asserts `deploy.yml` contains verify job + playwright install + lhci (QA-01, optional)
- [ ] `scripts/live-smoke.mjs` — live base-path smoke (DEPLOY-04)
- [ ] `.github/workflows/deploy.yml` — extend: `verify` job (playwright+axe+lhci) → `build` (BASE_PATH) → `deploy` (guarded retry pair, `page_url` output) → `smoke` (retry-wrapped)
- [ ] `tests/no-flash.spec.ts` — `expect.poll` + `?.` fix (Follow-up 2)
- [ ] HeroScene CSS move → `tokens.css` (or Hero.svelte), delete HeroScene `<style>` (Follow-up 3)
- [ ] `package.json` scripts: `test:seo`, `test:seo:build` (grep), `lhci`, `smoke`
- [ ] Framework installs already present (playwright, lhci, axe) — only CI needs `pnpm exec playwright install --with-deps chromium`

## Concrete File List (for the planner)

**New:**
- `src/lib/components/Seo.svelte`
- `static/og-image.png` (+ `static/og-image.svg` source)
- `lighthouserc.json`
- `scripts/live-smoke.mjs`
- `scripts/check-seo-meta.mjs`
- `scripts/check-ci-gate.mjs` (optional)
- `tests/seo.spec.ts`

**Edited:**
- `src/lib/content/site.ts` (+`url`, +`seo` map)
- `src/routes/+page.svelte`, `about/+page.svelte`, `services/+page.svelte`, `contact/+page.svelte`, `accessibility/+page.svelte` (+`<Seo>`)
- `src/routes/+layout.svelte` (remove hardcoded `<title>`)
- `src/lib/styles/tokens.css` (+`.hero-scene` positioning rules)
- `src/lib/components/premium/HeroScene.svelte` (delete `<style>`, add `class="hero-scene"`)
- `tests/no-flash.spec.ts` (deterministic fix)
- `playwright.config.ts` (+`workers: process.env.CI ? 2 : undefined`)
- `.github/workflows/deploy.yml` (verify → build → deploy(retry) → smoke)
- `package.json` (scripts)

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `$app/stores` `$page` | `$app/state` `page` (no `$`) | Svelte-5/runes idiom (Kit ≥ 2.12); this project is on Kit 2.63+. For SEO tags we avoid `page` entirely and use constants — but any runtime page access should use `$app/state`. |
| `peaceiris/actions-gh-pages` (branch push) | `upload-pages-artifact` + `deploy-pages@v4` | Already in use here; official artifact flow, no build output committed. |
| Per-request/serverless OG (`@vercel/og`) | Single static PNG for a static host | GitHub Pages has no runtime; static card is the correct pattern. |
| One-shot `page.evaluate` for early-DOM asserts | `expect.poll` / `waitForFunction` with `?.` | Deterministic under parallel workers; the flake fix. |

## Open Questions

1. **OG image copy/art specifics** — the card needs the wordmark + tagline in brand tokens. No invented claims required (org name + tagline are verified facts). *Recommendation:* wordmark "Diversity Includes Disability" + `site.tagline` on a token-colored ground; keep it text-forward for clarity at small render sizes.
2. **Exact Lighthouse performance floor** — 0.85 `warn` is a starting estimate for a static, self-hosted-fonts site; first CI run will reveal the real score. *Recommendation:* keep perf as `warn` until one baseline run, then tighten to `error` if comfortably above.
3. **`page_url` vs hardcoded live URL in smoke** — both work; `page_url` output is marginally more rename-robust. *Recommendation:* pass `needs.deploy.outputs.page_url`, fall back to the hardcoded constant if empty.

## Sources

### Primary (HIGH confidence)
- This repository's actual files (read 2026-07-05): `svelte.config.js`, `+layout.svelte`, `+layout.ts`, `site.ts`, `app.html`, `mode.svelte.ts`, `Hero.svelte`, `PremiumHero.svelte`, `HeroScene.svelte`, `tests/a11y.spec.ts`, `tests/content-routes.spec.ts`, `tests/no-flash.spec.ts`, `playwright.config.ts`, `package.json`, `scripts/check-3d-boundary.mjs`, `.github/workflows/deploy.yml`, `.planning/config.json`. — authoritative for all repo-specific claims.
- Verified locally: Node `v24.18.0` with global `fetch` (`typeof fetch === 'function'`); `pnpm exec lhci --version` → `0.15.1`.
- Lighthouse CI configuration docs (`GoogleChrome/lighthouse-ci` docs/configuration.md) — `staticDistDir` vs `startServerCommand`, `assert.assertions` `["error", {minScore}]` syntax, presets. Verified 2026-07-05.
- `nick-fields/retry` — latest `v4` (released 2026-03-20), inputs `timeout_minutes`/`max_attempts`/`retry_wait_seconds`/`command`. Verified 2026-07-05.

### Secondary (MEDIUM confidence)
- SvelteKit `$app/state` / `$app/paths` docs + issue #3164 and discussion #11554 (`page.url.pathname` / base-path quirks under the static adapter) — corroborate the decision to compose absolute URLs from constants rather than the runtime URL. Multiple sources agree.

### Tertiary (LOW confidence)
- Exact eager-CSS hoist byte size (~150–200 B) — estimated from the two-rule `<style>` block, not measured; the recommendation (move to always-loaded layer) does not depend on the exact number.

## Metadata

**Confidence breakdown:**
- SEO architecture: HIGH — grounded in repo files + a deterministic constant-based approach that sidesteps the one MEDIUM-confidence area (runtime pathname).
- CI gate: HIGH — existing axe suite + verified lhci version + verified lighthouserc syntax.
- Live smoke: HIGH — Node 24 global fetch verified; `relative:false` guarantees absolute asset URLs to grep.
- Deploy retry: MEDIUM-HIGH — the guarded `deploy1`/`deploy2` pair is a well-established pattern; exact `deploy-pages@v4` input names (`timeout`) should be reconfirmed against the action's current README at plan time.
- Follow-ups 2 & 3: HIGH — root causes traced directly in the repo's own code paths.

**Research date:** 2026-07-05
**Valid until:** ~2026-08-05 (stable domain; re-verify `deploy-pages` / `nick-fields/retry` input names and lhci assertion syntax if planning slips past this window).
