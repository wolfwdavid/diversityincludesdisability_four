<script lang="ts">
	import { Canvas } from '@threlte/core';
	import Scene from './scene/Scene.svelte';

	let { onContextLost }: { onContextLost?: () => void } = $props();
</script>

<div class="scene" aria-hidden="true">
	<Canvas renderMode="on-demand" dpr={[1, 1.5]}>
		<Scene {onContextLost} />
	</Canvas>
</div>

<style>
	.scene {
		position: absolute;
		inset: 0;
		pointer-events: none; /* decorative — no pointer/AT capture, never in tab order */
	}
	.scene :global(canvas) {
		width: 100%;
		height: 100%;
	}
</style>
