<script lang="ts">
	import { mode } from '$lib/stores/mode.svelte';
	import { prefersReducedMotion, webglSupported } from '$lib/a11y/prefers.svelte';

	// Runtime context-loss flag, raised by HeroScene's webglcontextlost listener via the callback.
	let contextLost = $state(false);

	// Show the 3D scene ONLY when: Premium mode AND motion allowed AND WebGL present AND context alive.
	// Any false -> render nothing here; the poster underneath (in Hero.svelte) is the fallback.
	const show3D = $derived(
		mode.current === 'premium' &&
			!prefersReducedMotion.current &&
			webglSupported() &&
			!contextLost
	);
</script>

{#if show3D}
	{#await import('./HeroScene.svelte')}
		<!-- pending: render nothing; poster shows through -->
	{:then { default: HeroScene }}
		<HeroScene onContextLost={() => (contextLost = true)} />
	{:catch}
		<!-- import/runtime failure: render nothing; poster shows through (no content loss) -->
	{/await}
{/if}
