<!-- Wave-1 placeholder stub. Overwritten with the real, fully accessible /about page in Wave 3 (03-06).
     Exists now so the crawler-strict build (prerender.entries:['*'], handleHttpError:'fail') resolves
     the shell's /about nav + footer link the moment Wave 2 adds it. -->
<script lang="ts">
	import { site } from '$lib/content/site';
</script>

<h1>{site.about.heading}</h1>
