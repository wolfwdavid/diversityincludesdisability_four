<script lang="ts">
	import { onDestroy } from 'svelte';
	import { T, useTask, useThrelte } from '@threlte/core';
	import Lights from './Lights.svelte';
	import ParticleField from './ParticleField.svelte';
	import EchoRings from './EchoRings.svelte';

	let { onContextLost }: { onContextLost?: () => void } = $props();

	const { renderer, invalidate } = useThrelte();
	const canvas = renderer.domElement;

	// running gate: only advance/render when the tab is visible AND the hero is onscreen.
	let visible = $state(typeof document === 'undefined' ? true : !document.hidden);
	let onscreen = $state(true);
	const running = () => visible && onscreen;

	const onVis = () => (visible = !document.hidden);
	document.addEventListener('visibilitychange', onVis);

	const io = new IntersectionObserver(([e]) => (onscreen = e.isIntersecting), { threshold: 0 });
	io.observe(canvas);

	const onLost = (e: Event) => {
		e.preventDefault(); // keep the context recoverable; we retreat to the poster instead
		onContextLost?.();
	};
	canvas.addEventListener('webglcontextlost', onLost, false);

	// Shared drift clock; children read elapsed. Tiny amplitude = restrained, non-vestibular.
	let elapsed = $state(0);
	useTask(
		(delta) => {
			elapsed += delta;
			invalidate(); // drive the on-demand renderer while running
		},
		{ running }
	);

	onDestroy(() => {
		document.removeEventListener('visibilitychange', onVis);
		canvas.removeEventListener('webglcontextlost', onLost);
		io.disconnect();
		try {
			renderer.dispose(); // free renderer-held GL resources + programs
			renderer.forceContextLoss(); // release the GL context immediately (vs the ~8-16 cap)
		} catch {
			/* already gone */
		}
	});
</script>

<T.PerspectiveCamera makeDefault position={[0, 0, 6]} fov={50} />
<Lights />
<ParticleField {elapsed} />
<EchoRings {elapsed} />
