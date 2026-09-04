<script lang="ts">
	import MiniContactCards from '$lib/MiniContactCards.svelte';
	import { page } from '$app/state';
	import { localizedPath, type Locale } from '$lib/i18n';
	let locale = $derived((page.data.locale ?? 'de') as Locale);
</script>

<svelte:head>
	<title>{locale === 'en' ? 'Booking unavailable' : 'Buchung nicht verfügbar'} — ALL IN AGI</title>
</svelte:head>

<div class="booking-error-page">
	<section class="booking-error-card" aria-labelledby="booking-error-title">
		<h1 id="booking-error-title">{locale === 'en' ? 'Booking unavailable' : 'Buchung nicht verfügbar'}</h1>
		<MiniContactCards {locale} />
		<div class="booking-error-actions">
			<a class="button-primary" href={localizedPath(locale, '/verwalten')}>{locale === 'en' ? 'Try again' : 'Erneut versuchen'}</a>
			<a class="button-secondary" href={localizedPath(locale, '/buchen')}>{locale === 'en' ? 'Plan another hackathon' : 'Neuen Hackathon planen'}</a>
		</div>
	</section>
</div>
