<script lang="ts">
	import { mode } from '$lib/stores/mode.svelte';
</script>

<h1>Diversity Includes Disability</h1>
<p class="lead">
	One site, two experiences. You are viewing <strong>{mode.current}</strong> mode — use the toggle in
	the header to switch. Your choice is remembered.
</p>
<p>
	This page is intentionally minimal: Phase 2 proves the mode engine and token contract. Full
	content arrives in Phase 3.
</p>

<style>
	h1 {
		font-size: var(--fs-h1);
		color: var(--text);
	}
	.lead {
		font-size: var(--fs-lg);
		color: var(--text-muted);
	}
	p {
		color: var(--text);
		line-height: var(--lh-body);
	}
	strong {
		color: var(--accent);
	}
</style>
