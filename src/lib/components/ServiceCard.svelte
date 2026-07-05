<script lang="ts">
	import type { ServiceItem } from '$lib/content/site';
	import { resolve } from '$app/paths';

	// `level` keeps heading order valid per context (Pitfall 2): the card renders <h3> on Home
	// (under the "Our Services" <h2>) and <h2> on /services (under the page <h1>). `showBody`
	// swaps the one-line summary for the fuller body paragraph on the Services page.
	let {
		service,
		level = 3,
		showBody = false
	}: { service: ServiceItem; level?: 2 | 3; showBody?: boolean } = $props();
</script>

<article class="service-card">
	<svelte:element this={`h${level}`} class="service-card__title">{service.title}</svelte:element>
	<p class="service-card__body">{showBody ? service.body : service.summary}</p>
	<a class="service-card__link" href={resolve('/contact')}>Let's Connect</a>
</article>

<style>
	.service-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-5);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow);
	}
	.service-card__title {
		margin: 0;
		font-size: var(--fs-h3);
		color: var(--text);
	}
	.service-card__body {
		margin: 0;
		flex: 1;
		color: var(--text-muted);
	}
	.service-card__link {
		display: inline-flex;
		align-items: center;
		align-self: flex-start;
		min-height: 44px;
		padding: var(--space-2) var(--space-4);
		color: var(--primary);
		font-weight: 600;
		text-decoration: underline;
	}
	.service-card__link:hover {
		text-decoration: none;
	}
	/* focus ring inherited from global :focus-visible in tokens.css */
</style>
