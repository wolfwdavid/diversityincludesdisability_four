<!-- /about (CONT-02) — Eman Rimawi's story told through role-based, verified-public-fact copy.
     Single <h1>; every string comes from site.about (CONT-06). The personal-story paragraph is a
     true-but-generic placeholder while the real [REVIEW] bio lives as a comment in site.ts, and the
     pull-quote renders ONLY when a real quote is provided (undefined → nothing renders). -->
<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import MediaSection from '$lib/components/MediaSection.svelte';
	import { site } from '$lib/content/site';
	import { resolve } from '$app/paths';
</script>

<Seo title={site.seo.about.title} description={site.seo.about.description} path="/about/" />

<article class="about">
	<h1>{site.about.heading}</h1>

	<p>{site.about.para1}</p>
	<p>{site.about.para2Placeholder}</p>
	<p>{site.about.para3}</p>

	{#if site.about.pullQuote}
		<blockquote class="about__quote">{site.about.pullQuote}</blockquote>
	{/if}

	<MediaSection />

	<p class="about__cta">
		<a href={resolve('/contact')}>{site.contact.ctaPhrase}</a>
	</p>
</article>

<style>
	.about {
		max-width: var(--measure);
		margin-inline: auto;
		padding: var(--space-7) var(--space-5);
	}
	.about h1 {
		font-size: var(--fs-h1);
		margin: 0 0 var(--space-5);
	}
	.about p {
		font-size: var(--fs-lg);
		margin: 0 0 var(--space-5);
	}
	.about__quote {
		margin: var(--space-6) 0;
		padding: var(--space-4) var(--space-5);
		border-left: var(--space-1) solid var(--primary);
		background: var(--surface);
		border-radius: var(--radius-sm);
		font-size: var(--fs-lg);
		font-style: italic;
	}
	.about__cta a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		padding: var(--space-2) var(--space-4);
		color: var(--primary);
		font-weight: 600;
		text-decoration: underline;
		border-radius: var(--radius-sm);
	}
	.about__cta a:hover {
		color: var(--primary-hover, var(--primary));
	}
</style>
