<script lang="ts">
	import OfferBuilder from '$lib/OfferBuilder.svelte';
	import { type Locale } from '$lib/i18n';
	let { data } = $props();
	let locale = $derived((data.locale ?? 'de') as Locale);
</script>

{#key data.offerId}
	<OfferBuilder
		offerId={data.offerId}
		initialConfig={data.config}
		offers={data.offers}
		bookings={data.bookings}
		hackathonId={data.hackathonId}
		logos={data.logos}
		services={data.services}
		{locale}
	/>
{/key}
