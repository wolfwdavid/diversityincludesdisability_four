<!-- CONT-03 Services. Overwrites the Wave-1 (03-01) placeholder stub with the real content.
     All copy from src/lib/content/site.ts (CONT-06). Exactly one <h1>Services</h1>; each service is
     a ServiceCard at level=2, so the page renders precisely four <h2> sections (heading order clean,
     A11Y-02 / WCAG 1.3.1), each with its fuller body description and a "Let's Connect" link. -->
<script lang="ts">
	import ServiceCard from '$lib/components/ServiceCard.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { site } from '$lib/content/site';
</script>

<Seo title={site.seo.services.title} description={site.seo.services.description} path="/services/" />

<h1>Services</h1>
<p class="intro">{site.servicesIntro}</p>

<ul class="services__list">
	{#each site.services as service (service.slug)}
		<li>
			<ServiceCard {service} level={2} showBody />
		</li>
	{/each}
</ul>

<style>
	h1 {
		margin: 0 0 var(--space-4);
		font-size: var(--fs-h1);
		color: var(--text);
	}
	.intro {
		margin: 0 0 var(--space-8);
		max-width: 60ch;
		font-size: var(--fs-lg);
		color: var(--text-muted);
		line-height: var(--lh-body);
	}
	.services__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-5);
	}
	@media (min-width: 48rem) {
		.services__list {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
