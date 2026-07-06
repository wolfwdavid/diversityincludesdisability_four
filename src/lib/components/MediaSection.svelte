<script lang="ts">
	// MediaSection (ENGAGE-03) — founder podcast/media appearances rendered as accessible-named
	// links + descriptions. Self-omits ENTIRELY when the list is empty (no heading, no landmark, no
	// empty shell) so the About page shows nothing until real appearances exist. The `items` prop
	// defaults to site.podcasts so the page renders live data, while vitest injects a fixture. The
	// heading text lives in site.mediaHeading (single content source) — never hardcoded here.
	import { site } from '$lib/content/site';
	import type { PodcastItem } from '$lib/content/site';
	let { items = site.podcasts }: { items?: PodcastItem[] } = $props();
</script>

{#if items.length}
	<section class="media" aria-labelledby="media-h">
		<h2 id="media-h">{site.mediaHeading}</h2>
		<ul class="media__list">
			{#each items as item (item.url)}
				<li class="media__item">
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external media/podcast URLs are off-site and must NOT be base-resolved -->
					<a class="media__link" href={item.url} rel="noopener" target="_blank">
						{item.title}{#if item.platform}<span class="media__platform">
								· {item.platform}</span
							>{/if}
					</a>
					<p class="media__desc">{item.description}</p>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.media {
		margin: var(--space-7) 0 0;
	}
	.media h2 {
		font-size: var(--fs-h2);
		margin: 0 0 var(--space-4);
	}
	.media__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}
	.media__link {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		font-size: var(--fs-lg);
		font-weight: 600;
		color: var(--primary);
		text-decoration: underline;
	}
	.media__platform {
		font-weight: 400;
		color: var(--text-muted);
	}
	.media__desc {
		margin: var(--space-2) 0 0;
	}
</style>
