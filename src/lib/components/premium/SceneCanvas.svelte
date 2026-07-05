<script lang="ts">
	import { Canvas } from '@threlte/core';
	import Scene from './scene/Scene.svelte';

	let { onContextLost }: { onContextLost?: () => void } = $props();
</script>

<!-- Isolates @threlte/core's <Canvas> — the sole CSS-bearing node in the premium scene. Reached
     via a SECOND dynamic import (from HeroScene), so the Canvas's scoped wrapper CSS lands at
     SvelteKit find_deps dynamic_import_depth 2, beyond the eager-hoist window, and never links on
     the accessible home. Vite loads it on demand when premium mode mounts the scene. The wrapper
     `.hero-scene` positioning is owned by HeroScene (class from tokens.css); this component adds
     no scoped style block of its own. -->
<Canvas renderMode="on-demand" dpr={[1, 1.5]}>
	<Scene {onContextLost} />
</Canvas>
