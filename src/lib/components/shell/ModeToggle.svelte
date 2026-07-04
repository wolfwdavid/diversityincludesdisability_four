<script lang="ts">
	import { mode } from '$lib/stores/mode.svelte';
	const isPremium = $derived(mode.current === 'premium');
</script>

<button
	type="button"
	class="mode-toggle"
	aria-pressed={isPremium}
	aria-label={isPremium ? 'Switch to Accessible visual mode' : 'Switch to Premium visual mode'}
	onclick={() => mode.toggle()}
>
	<svg class="mode-toggle__icon" aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
		<path
			d={isPremium ? 'M12 3v2M12 19v2M5 12H3M21 12h-2' : 'M4 12h16M4 6h16M4 18h16'}
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
		/>
	</svg>
	<span class="mode-toggle__label">{isPremium ? 'Premium' : 'Accessible'}</span>
</button>

<style>
	.mode-toggle {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 44px;
		min-width: 44px;
		padding: var(--space-2) var(--space-4);
		background: var(--surface);
		color: var(--text);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		font: inherit;
		cursor: pointer;
		transition: background var(--dur) var(--ease);
	}
	.mode-toggle:hover {
		background: var(--bg);
	}
	/* focus ring inherited from global :focus-visible in tokens.css */
</style>
