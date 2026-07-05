<script lang="ts">
	import { onDestroy } from 'svelte';
	import { T } from '@threlte/core';
	import { InstancedMesh, Object3D, SphereGeometry, MeshStandardMaterial, Color } from 'three';

	let { elapsed = 0 }: { elapsed?: number } = $props();

	const COUNT = 300;
	const geo = new SphereGeometry(0.03, 8, 8);
	const mat = new MeshStandardMaterial({
		color: new Color('#8FC4FF'),
		emissive: new Color('#6FB4FF'),
		emissiveIntensity: 0.9
	});
	const mesh = new InstancedMesh(geo, mat, COUNT);
	const dummy = new Object3D();
	// seed positions: biased toward the upper-right focal point (poster motif)
	const seeds = Array.from({ length: COUNT }, () => ({
		x: 1.2 + (Math.random() - 0.5) * 6,
		y: 0.8 + (Math.random() - 0.5) * 4,
		z: (Math.random() - 0.5) * 3,
		p: Math.random() * Math.PI * 2
	}));

	$effect(() => {
		for (let i = 0; i < COUNT; i++) {
			const s = seeds[i];
			dummy.position.set(
				s.x + Math.sin(elapsed * 0.2 + s.p) * 0.08,
				s.y + Math.cos(elapsed * 0.18 + s.p) * 0.08,
				s.z
			);
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
		}
		mesh.instanceMatrix.needsUpdate = true;
	});

	// belt-and-suspenders: free the geometry/material we created imperatively.
	onDestroy(() => {
		geo.dispose();
		mat.dispose();
	});
</script>

<T is={mesh} />
