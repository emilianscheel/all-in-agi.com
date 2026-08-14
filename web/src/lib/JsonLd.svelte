<script lang="ts">
	import { jsonLdScript } from '$lib/json-ld';

	let { data }: { data: unknown } = $props();
	let markup = $derived(jsonLdScript(data));
</script>

<svelte:head>
	{@html markup}
</svelte:head>
