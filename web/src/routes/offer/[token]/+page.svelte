<script lang="ts">
	import OfferBuilder from '$lib/OfferBuilder.svelte';
	import OfferGate from '$lib/OfferGate.svelte';
	let { data } = $props();
</script>

{#if data.authorized && data.config}<OfferBuilder initialConfig={data.config} />{:else}<OfferGate />{/if}
