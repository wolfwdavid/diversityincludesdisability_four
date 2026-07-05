<script lang="ts">
	import { onDestroy } from 'svelte';
	import { T } from '@threlte/core';
	import { MeshBasicMaterial, Color } from 'three';

	let { elapsed = 0 }: { elapsed?: number } = $props();
	const mat = new MeshBasicMaterial({
		color: new Color('#6FB4FF'),
		wireframe: true,
		transparent: true,
		opacity: 0.35
	});
	const rings = [
		{ r: 1.6, z: -0.5, speed: 0.05 },
		{ r: 2.4, z: -1.2, speed: -0.035 },
		{ r: 3.2, z: -2.0, speed: 0.02 }
	];

	onDestroy(() => mat.dispose());
</script>

{#each rings as ring (ring.r)}
	<T.Mesh position={[1.2, 0.8, ring.z]} rotation.z={elapsed * ring.speed} rotation.x={0.6}>
		<T.TorusGeometry args={[ring.r, 0.012, 8, 96]} />
		<T is={mat} />
	</T.Mesh>
{/each}
