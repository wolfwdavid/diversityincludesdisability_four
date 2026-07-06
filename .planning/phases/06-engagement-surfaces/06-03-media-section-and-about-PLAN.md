---
phase: 06-engagement-surfaces
plan: 03
type: execute
wave: 2
depends_on: ["06-01"]
files_modified:
  - src/lib/content/site.ts
  - src/lib/components/MediaSection.svelte
  - src/routes/about/+page.svelte
  - tests/media-section.spec.ts
  - tests/unit/media-section.spec.ts
autonomous: true
requirements: [ENGAGE-03]

must_haves:
  truths:
    - "While site.podcasts is empty (now), the About page renders NO media section — no heading, no landmark, no empty shell (ENGAGE-03)."
    - "MediaSection with a populated fixture renders each item as a link with an accessible name plus its description; with an empty list it renders nothing (vitest data-branch proof)."
  artifacts:
    - path: "src/lib/content/site.ts"
      provides: "PodcastItem interface + empty typed podcasts list (single content source)"
      contains: "PodcastItem"
    - path: "src/lib/components/MediaSection.svelte"
      provides: "Data-driven section that self-omits when the list is empty (accepts items prop for fixture injection)"
      contains: "items.length"
    - path: "tests/unit/media-section.spec.ts"
      provides: "vitest empty→nothing / populated→list branch test"
      contains: "MediaSection"
    - path: "tests/media-section.spec.ts"
      provides: "Default-build e2e: section omitted on /about"
      contains: "media-h"
  key_links:
    - from: "src/routes/about/+page.svelte"
      to: "src/lib/components/MediaSection.svelte"
      via: "rendered below the bio; self-omits on empty list"
      pattern: "MediaSection"
    - from: "src/lib/components/MediaSection.svelte"
      to: "site.podcasts"
      via: "default prop items = site.podcasts"
      pattern: "items = site.podcasts"
---

<objective>
Add the typed podcast/media list to the single content source, build a `MediaSection` that renders on the About page only when the list is non-empty, and prove both branches: omitted when empty (e2e, default build) and rendered-with-accessible-names when populated (vitest fixture). Ships inert (empty list) now.

Purpose: Give the site a place for founder media appearances without inventing content or leaving an empty shell, and without adding a new route that would churn the 5-route SEO/axe gates (RESEARCH Pattern 4: section on About, not a `/media` route).
Output: `PodcastItem` + `podcasts: []` in `site.ts`, `MediaSection.svelte`, an About-page render, and two specs.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/06-engagement-surfaces/06-RESEARCH.md
@.planning/phases/06-engagement-surfaces/06-VALIDATION.md
@src/routes/about/+page.svelte
@src/lib/content/site.ts
@src/lib/components/SocialLinks.svelte

<interfaces>
<!-- Contracts the executor uses directly. From 06-01 (Wave 1) and the existing repo. -->

From 06-01: vitest is installed; `vitest.config.ts` uses jsdom + `$lib` alias and includes `tests/unit/**/*.spec.ts`; `pnpm test:unit` = `vitest run`. The default `playwright.config.ts` ignores `tests/unit/**`, so the vitest spec will NOT be run by Playwright.

site.ts is `export const site = { … } as const;` and every `+page.svelte` must import `content/site` (content-source gate). Existing typed lists use the `satisfies X[]` pattern (see `services` and `social`).

External link convention (SocialLinks.svelte precedent): off-site URLs use a literal `href={item.url}` with `<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- … -->`. Do NOT base-resolve external media URLs.

The content-source gate `check-content-source.mjs` only forbids literal `href="/…"`; `href={…}` expressions and `href="#"`/`mailto:` are allowed. It scans `+page.svelte` files for the `content/site` import (components are not required to import it, but MediaSection does anyway for its default).
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Author RED specs + add the typed podcasts list to site.ts</name>
  <read_first>src/lib/content/site.ts, vitest.config.ts</read_first>
  <files>src/lib/content/site.ts, tests/media-section.spec.ts, tests/unit/media-section.spec.ts</files>
  <action>
Add the type + empty list to `site.ts`. Place the interface beside the existing `SocialItem` interface:
```ts
export interface PodcastItem {
	title: string;
	description: string;
	url: string;
	platform?: string;
}
```
Add the empty list inside the `site` object (e.g. after `social: [ … ]`). Empty now → section self-omits; real appearances are Phase-7-adjacent, invent none:
```ts
	// Podcast / media appearances (ENGAGE-03). MediaSection renders NOTHING while this is empty —
	// no empty shell. Populate with real, verified appearances only.
	podcasts: [] satisfies PodcastItem[] as PodcastItem[],
```

Author the two RED specs (fail until Task 2 creates the component).

`tests/media-section.spec.ts` (default build — ENGAGE-03: omitted while empty):
```ts
import { test, expect } from '@playwright/test';

// site.podcasts is empty → the About page must have NO media section at all (no heading, no
// landmark, no empty shell).
test('empty podcasts list → no media section on /about', async ({ page }) => {
	await page.goto('/about/');
	await expect(page.locator('#media-h')).toHaveCount(0);
	await expect(page.locator('section.media')).toHaveCount(0);
	await expect(page.getByRole('heading', { name: /media/i })).toHaveCount(0);
});
```

`tests/unit/media-section.spec.ts` (vitest — the populated branch, injected via prop):
```ts
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import MediaSection from '$lib/components/MediaSection.svelte';

const fixture = [
	{
		title: 'On Disability Justice',
		description: 'A conversation about intersectional advocacy.',
		url: 'https://example.com/ep1',
		platform: 'Example FM'
	}
];

describe('MediaSection', () => {
	it('renders nothing when the list is empty', () => {
		const { container } = render(MediaSection, { props: { items: [] } });
		expect(container.querySelector('section.media')).toBeNull();
		expect(screen.queryByRole('heading', { name: /media/i })).toBeNull();
	});

	it('renders items with accessible link names + descriptions when populated', () => {
		render(MediaSection, { props: { items: fixture } });
		expect(screen.getByRole('heading', { name: /media/i })).toBeTruthy();
		const link = screen.getByRole('link', { name: /On Disability Justice/i });
		expect(link.getAttribute('href')).toBe('https://example.com/ep1');
		expect(screen.getByText(/intersectional advocacy/i)).toBeTruthy();
	});
});
```

Confirm site.ts still type-checks:
```bash
pnpm check
```
  </action>
  <verify>
    <automated>grep -q "interface PodcastItem" src/lib/content/site.ts && grep -q "podcasts:" src/lib/content/site.ts && grep -q "media-h" tests/media-section.spec.ts && grep -q "MediaSection" tests/unit/media-section.spec.ts && pnpm check</automated>
  </verify>
  <done>`PodcastItem` + empty `podcasts` list added and type-checking; both RED specs authored (expected to fail until Task 2).</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Build MediaSection.svelte and render it on the About page</name>
  <read_first>src/routes/about/+page.svelte, src/lib/components/SocialLinks.svelte</read_first>
  <behavior>
    - Empty list → component renders nothing (no section.media, no #media-h) — vitest + default e2e.
    - Populated list → renders a labelled section with each item as an accessible link + description — vitest fixture.
  </behavior>
  <files>src/lib/components/MediaSection.svelte, src/routes/about/+page.svelte</files>
  <action>
Create `src/lib/components/MediaSection.svelte` (Svelte 5 runes; token-only; `items` prop defaults to `site.podcasts` so vitest can inject a fixture; external URLs are literal with the eslint-disable precedent):
```svelte
<script lang="ts">
	import { site } from '$lib/content/site';
	import type { PodcastItem } from '$lib/content/site';
	let { items = site.podcasts }: { items?: PodcastItem[] } = $props();
</script>

{#if items.length}
	<section class="media" aria-labelledby="media-h">
		<h2 id="media-h">Media &amp; Podcasts</h2>
		<ul class="media__list">
			{#each items as item (item.url)}
				<li class="media__item">
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external media/podcast URLs are off-site and must NOT be base-resolved -->
					<a class="media__link" href={item.url} rel="noopener" target="_blank">
						{item.title}{#if item.platform}<span class="media__platform"> · {item.platform}</span>{/if}
					</a>
					<p class="media__desc">{item.description}</p>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.media { margin: var(--space-7) 0 0; }
	.media h2 { font-size: var(--fs-h2); margin: 0 0 var(--space-4); }
	.media__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-5); }
	.media__link {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		font-size: var(--fs-lg);
		font-weight: 600;
		color: var(--primary);
		text-decoration: underline;
	}
	.media__platform { font-weight: 400; color: var(--text-muted); }
	.media__desc { margin: var(--space-2) 0 0; }
</style>
```

Render it on the About page. In `src/routes/about/+page.svelte` add to `<script>`:
```ts
import MediaSection from '$lib/components/MediaSection.svelte';
```
and place `<MediaSection />` inside the `<article class="about">`, after the pull-quote block and before the `<p class="about__cta">`:
```svelte
	<MediaSection />
```
(The component self-omits while `site.podcasts` is empty, so nothing renders yet.)

Verify RED→GREEN:
```bash
pnpm check && pnpm lint
pnpm test:unit                                                   # populated + empty branch → GREEN
pnpm exec playwright test tests/media-section.spec.ts           # omitted on /about → GREEN
pnpm exec playwright test tests/a11y.spec.ts                     # /about still axe-clean both modes
```
  </action>
  <verify>
    <automated>pnpm check && pnpm lint && pnpm test:unit && pnpm exec playwright test tests/media-section.spec.ts && pnpm exec playwright test tests/a11y.spec.ts</automated>
  </verify>
  <done>MediaSection self-omits on empty (About shows no media section — default e2e GREEN); vitest proves both branches; `/about/` stays axe-clean both modes; `pnpm check` + `pnpm lint` clean.</done>
</task>

</tasks>

<verification>
- `pnpm test:unit`: MediaSection empty→nothing, populated→accessible links — GREEN.
- `pnpm exec playwright test tests/media-section.spec.ts`: no media section on /about while empty — GREEN.
- `pnpm exec playwright test tests/a11y.spec.ts`: /about clean both modes (no new violations).
- `pnpm check`, `pnpm lint`, `pnpm test:content`, `pnpm test:tokens`, `pnpm test:review` — GREEN.
- No new route added → SEO/axe 5-route arrays untouched.
</verification>

<success_criteria>
- ENGAGE-03: typed podcast list in site.ts; section omitted entirely while empty (no shell), rendered with accessible names when populated.
- Both data branches proven automatically (e2e omitted + vitest populated).
- No route churn; every existing gate stays green.
</success_criteria>

<output>
After completion, create `.planning/phases/06-engagement-surfaces/06-03-SUMMARY.md`.
</output>
