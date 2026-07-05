<script lang="ts">
	// SocialLinks (CONT-05 / A11Y-06) — the org's social profiles rendered as icon + VISIBLE TEXT
	// links (never icon-only). Each link carries an explicit aria-label (`s.label`) for a rich
	// accessible name, the inline SVG glyph is decorative (aria-hidden), and the visible {s.name}
	// span guarantees a text label even if the icon fails to render. Inline SVG only — no icon
	// library — matching the ModeToggle precedent. URLs are `#` placeholders until confirmed
	// ([REVIEW] in site.ts); rel="me noopener" declares identity ownership and hardens the tab.
	import { site } from '$lib/content/site';
</script>

<ul class="social">
	{#each site.social as s (s.icon)}
		<li>
			<a href={s.href} rel="me noopener" aria-label={s.label}>
				<svg class="social__icon" aria-hidden="true" viewBox="0 0 24 24" width="24" height="24">
					{#if s.icon === 'facebook'}
						<path
							fill="currentColor"
							d="M13 22v-8h2.7l.4-3H13V9.1c0-.87.24-1.46 1.5-1.46H16V5c-.28-.04-1.2-.12-2.28-.12-2.26 0-3.8 1.38-3.8 3.9V11H7v3h2.9v8z"
						/>
					{:else if s.icon === 'x'}
						<path
							fill="currentColor"
							d="M17.5 3h3l-6.55 7.48L21.7 21h-6.02l-4.2-5.5L6.6 21H3.6l7-8-7.3-10h6.17l3.8 5.02zM16.4 19.2h1.66L7.7 4.7H5.9z"
						/>
					{:else if s.icon === 'linkedin'}
						<path
							fill="currentColor"
							d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1 0-5zM3 9h4v12H3zm7 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C21 8.65 22 11 22 14.3V21h-4v-6c0-1.43-.03-3.27-2-3.27-2 0-2.3 1.56-2.3 3.17V21h-4z"
						/>
					{:else}
						<rect
							x="3"
							y="3"
							width="18"
							height="18"
							rx="5"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						/>
						<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2" />
						<circle cx="17.2" cy="6.8" r="1.3" fill="currentColor" />
					{/if}
				</svg>
				<span class="social__label">{s.name}</span>
			</a>
		</li>
	{/each}
</ul>

<style>
	.social {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.social li {
		list-style: none;
	}
	/* Icon + text link, target box >=44px tall (A11Y-04). */
	.social a {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 44px;
		padding: var(--space-2) var(--space-3);
		color: var(--text);
		text-decoration: none;
		border-radius: var(--radius-sm);
	}
	.social a:hover {
		color: var(--primary);
		text-decoration: underline;
	}
	.social__icon {
		flex: none;
	}
</style>
