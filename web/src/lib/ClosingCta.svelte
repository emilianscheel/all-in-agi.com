<script lang="ts">
	import { reveal } from '$lib/motion';
	import { localizedPath, ui, type Locale } from '$lib/i18n';
	import { page } from '$app/state';
	let { locale = (page.data.locale ?? 'de') as Locale }: { locale?: Locale } = $props();
</script>

<section class="closing" aria-labelledby="closing-title">
	<div class="closing-inner" use:reveal>
		<h2 id="closing-title" class="section-title">{ui[locale].closingTitle}</h2>
		<a class="button-primary" href={localizedPath(locale, '/buchen')} data-analytics-event="booking_cta" data-analytics-placement="closing">{ui[locale].plan}</a>
	</div>
</section>
