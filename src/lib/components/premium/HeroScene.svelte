<script lang="ts">
	let { onContextLost }: { onContextLost?: () => void } = $props();
</script>

<!-- `.hero-scene` positioning lives in tokens.css (always-loaded), so this component carries NO
     scoped style block → no HeroScene CSS chunk to hoist. The only CSS-bearing node in the scene is
     @threlte/core's <Canvas>, isolated in SceneCanvas.svelte behind a SECOND dynamic import. That
     extra hop puts the Canvas CSS at SvelteKit find_deps `dynamic_import_depth` 2 — past the
     `depth <= 1` window that eagerly links dynamic-import CSS to prevent FOUC — so NO premium scene
     CSS <link> loads on the accessible home. The JS code-split boundary is unchanged/strengthened
     (check-3d-boundary.mjs stays green); Vite still fetches the scene CSS on demand in premium. -->
<div class="hero-scene" aria-hidden="true">
	{#await import('./SceneCanvas.svelte') then { default: SceneCanvas }}
		<SceneCanvas {onContextLost} />
	{/await}
</div>
