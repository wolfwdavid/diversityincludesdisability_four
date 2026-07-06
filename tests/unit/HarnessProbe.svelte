<script lang="ts">
	// Minimal Svelte 5 runes component used only by the Wave-0 harness smoke spec.
	let { label }: { label: string } = $props();
</script>

<span data-testid="probe">{label}</span>
