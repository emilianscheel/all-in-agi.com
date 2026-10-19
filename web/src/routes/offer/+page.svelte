<script lang="ts">
	import OfferBuilder from '$lib/OfferBuilder.svelte';
	import { type Locale } from '$lib/i18n';
	let { data } = $props();
	let locale = $derived((data.locale ?? 'de') as Locale);
</script>

<OfferBuilder initialConfig={data.config} {locale} />
