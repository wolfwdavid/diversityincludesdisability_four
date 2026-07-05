<script lang="ts">
	import { browser } from '$app/environment';
	import { mode } from '$lib/stores/mode.svelte';
	import SkipLinks from '$lib/components/shell/SkipLinks.svelte';
	import SiteHeader from '$lib/components/shell/SiteHeader.svelte';
	import SiteFooter from '$lib/components/shell/SiteFooter.svelte';
	import favicon from '$lib/assets/favicon.svg';

	// Global tokens + self-hosted fonts (Vite rewrites url() → base-correct hashed assets; no googleapis).
	import '$lib/styles/tokens.css';
	import '@fontsource/lexend/latin-300.css';
	import '@fontsource/lexend/latin-400.css';
	import '@fontsource/lexend/latin-600.css';
	import '@fontsource/lexend/latin-700.css';
	import '@fontsource/source-sans-3/latin-400.css';
	import '@fontsource/source-sans-3/latin-500.css';
	import '@fontsource/source-sans-3/latin-600.css';
	import '@fontsource/source-sans-3/latin-700.css';

	// Resolve hashed, base-correct URLs for the two critical-weight preloads.
	import lexend700 from '@fontsource/lexend/files/lexend-latin-700-normal.woff2';
	import bodySans400 from '@fontsource/source-sans-3/files/source-sans-3-latin-400-normal.woff2';

	let { children } = $props();

	// Hydration signal: on a prerendered static SPA the header button exists in the HTML before
	// its click handler is attached. Marking the root once the client mounts lets e2e (and any
	// consumer) wait for real interactivity instead of racing hydration. Set inside the $effect
	// below so it only runs in the browser after mount.

	// MODE-04 live OS change — only auto-flip when the user has made NO explicit choice.
	$effect(() => {
		if (!browser) return;
		document.documentElement.dataset.hydrated = 'true';
		const rm = matchMedia('(prefers-reduced-motion: reduce)');
		const hc = matchMedia('(prefers-contrast: more)');
		const onChange = () => {
			if (localStorage.getItem('did-mode')) return; // respect explicit choice
			mode.set(rm.matches || hc.matches ? 'accessible' : 'premium');
		};
		rm.addEventListener('change', onChange);
		hc.addEventListener('change', onChange);
		return () => {
			rm.removeEventListener('change', onChange);
			hc.removeEventListener('change', onChange);
		};
	});
</script>

<svelte:head>
	<title>Diversity Includes Disability</title>
	<link rel="icon" href={favicon} />
	<link rel="preload" href={lexend700} as="font" type="font/woff2" crossorigin="anonymous" />
	<link rel="preload" href={bodySans400} as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>

<SkipLinks />
<SiteHeader />

<main id="main" tabindex="-1">
	{@render children()}
</main>

<SiteFooter />

<!-- MODE-05: persistent polite region (present at mount so AT announces later changes) -->
<p class="visually-hidden" role="status" aria-live="polite">{mode.announcement}</p>

<style>
	#main {
		padding: var(--space-6) var(--space-5);
		max-width: var(--measure);
		margin-inline: auto;
	}
</style>
