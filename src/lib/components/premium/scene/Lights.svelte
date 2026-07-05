<script lang="ts">
	import { T } from '@threlte/core';
	const BLUE = '#6FB4FF'; // --primary (premium)
	const ORANGE = '#FF9E5E'; // --accent (premium)
</script>

<T.AmbientLight intensity={0.35} />
<T.PointLight color={BLUE} intensity={26} position={[3, 2.5, 3]} distance={20} />
<T.PointLight color={ORANGE} intensity={20} position={[-3, -2, 2]} distance={20} />
