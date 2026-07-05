<!-- CONT-01 Home. All copy from src/lib/content/site.ts (CONT-06); every internal link via resolve()
     for base-path safety. Exactly one <h1>, provided by <Hero /> — the sections below descend
     h2 -> h3 with no skipped levels (A11Y-02 / WCAG 1.3.1). Zero WebGL (PREM-03): the hero is the
     static token-driven poster from Hero.svelte. -->
<script lang="ts">
	import Hero from '$lib/components/Hero.svelte';
	import ServiceCard from '$lib/components/ServiceCard.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { site } from '$lib/content/site';
	import { resolve } from '$app/paths';
</script>

<Seo title={site.seo.home.title} description={site.seo.home.description} path="/" />

<Hero />

<section class="mission" aria-labelledby="mission-h">
	<h2 id="mission-h">Our mission</h2>
	<p>{site.home.mission}</p>
</section>

<section class="services" aria-labelledby="services-h">
	<h2 id="services-h">Our services</h2>
	<ul class="services__grid">
		{#each site.services as service (service.slug)}
			<li>
				<ServiceCard {service} level={3} />
			</li>
		{/each}
	</ul>
	<a class="services__all" href={resolve('/services')}>See all services</a>
</section>

<section class="founder" aria-labelledby="founder-h">
	<h2 id="founder-h">{site.founder}</h2>
	<p class="founder__role">{site.home.founderRole}</p>
	<p>{site.home.founderPositioning}</p>
	<a class="founder__link" href={resolve('/about')}>About {site.founder}</a>
</section>

<section class="cta" aria-label={site.contact.ctaPhrase}>
	<a class="cta__link" href={resolve('/contact')}>{site.contact.ctaPhrase}</a>
</section>

<style>
	section {
		margin-block-start: var(--space-8);
	}
	h2 {
		margin: 0 0 var(--space-4);
		font-size: var(--fs-h2);
		color: var(--text);
	}
	p {
		margin: 0 0 var(--space-4);
		color: var(--text);
		line-height: var(--lh-body);
	}
	.mission p {
		font-size: var(--fs-lg);
		color: var(--text-muted);
		max-width: 60ch;
	}

	.services__grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-5);
	}
	@media (min-width: 48rem) {
		.services__grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	.services__all {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		margin-block-start: var(--space-5);
		color: var(--primary);
		font-weight: 600;
		text-decoration: underline;
	}
	.services__all:hover {
		text-decoration: none;
	}

	.founder__role {
		margin-block-end: var(--space-2);
		font-weight: 600;
		color: var(--text);
	}
	.founder__link {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		color: var(--primary);
		font-weight: 600;
		text-decoration: underline;
	}
	.founder__link:hover {
		text-decoration: none;
	}

	.cta {
		display: flex;
		justify-content: center;
		padding: var(--space-8) var(--space-5);
		border-radius: var(--radius-lg);
		background: var(--surface);
		border: 1px solid var(--border);
	}
	.cta__link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		padding: var(--space-3) var(--space-6);
		background: var(--primary);
		color: var(--on-primary);
		border-radius: var(--radius-md);
		font-weight: 600;
		text-decoration: none;
	}
	.cta__link:hover {
		background: var(--primary-hover, var(--primary));
	}
	/* focus ring inherited from global :focus-visible in tokens.css */
</style>
