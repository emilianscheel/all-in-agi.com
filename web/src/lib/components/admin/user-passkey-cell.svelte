<script lang="ts">
	import type { Locale } from '$lib/i18n';

	let { hasPasskey, locale }: { hasPasskey: boolean; locale: Locale } = $props();
</script>

<span class={`booking-status ${hasPasskey ? '' : 'prep_scheduled'}`}>
	{hasPasskey
		? locale === 'en'
			? 'Ready'
			: 'Bereit'
		: locale === 'en'
			? 'Pending'
			: 'Ausstehend'}
</span>
