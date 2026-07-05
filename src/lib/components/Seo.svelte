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

	const fullTitle = $derived(path === '/' ? site.org : `${title} | ${site.org}`);
	const url = $derived(`${site.url}${base}${path}`);
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
