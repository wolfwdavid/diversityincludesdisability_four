<!-- /contact/success — no-JS submission landing (Web3Forms redirect target). Prerendered + noindex
     utility page: intentionally NOT in the 5-route SEO/seo.spec gate arrays (it is not a marketing
     route). Added to tests/a11y.spec.ts ROUTES so axe still scans it in both modes. Copy: site.contactSuccess. -->
<script lang="ts">
	import { site } from '$lib/content/site';
	import { resolve } from '$app/paths';
	const copy = site.contactSuccess;
</script>

<svelte:head>
	<title>{copy.title} · {site.org}</title>
	<meta name="description" content="Your message to {site.org} was sent." />
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="success">
	<h1>{copy.heading}</h1>
	<p>{copy.lead} {site.founder} will get back to you.</p>
	<p>
		{copy.mailtoPrefix} <a href={`mailto:${site.contact.email}`}>Email {site.founder}</a>
		at {site.contact.email}.
	</p>
	<p><a class="success__back" href={resolve('/contact')}>{copy.back}</a></p>
</section>

<style>
	.success {
		max-width: var(--measure);
		margin-inline: auto;
		padding: var(--space-7) var(--space-5);
	}
	.success h1 {
		font-size: var(--fs-h1);
		margin: 0 0 var(--space-5);
	}
	.success p {
		font-size: var(--fs-lg);
		margin: 0 0 var(--space-5);
	}
	.success__back {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		padding: var(--space-2) var(--space-4);
		color: var(--primary);
		font-weight: 600;
		text-decoration: underline;
		border-radius: var(--radius-sm);
	}
</style>
