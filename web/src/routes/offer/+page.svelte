<script lang="ts">
	import OfferBuilder from '$lib/OfferBuilder.svelte';
	import OfferGate from '$lib/OfferGate.svelte';
	import { type Locale } from '$lib/i18n';
	let { data } = $props();
	let locale = $derived((data.locale ?? 'de') as Locale);
</script>

{#if data.authorized && data.config}<OfferBuilder initialConfig={data.config} {locale} />{:else}<OfferGate {locale} />{/if}
