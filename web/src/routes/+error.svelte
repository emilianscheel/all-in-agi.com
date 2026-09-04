<script lang="ts">
	import { page } from '$app/state';
	import { localeFromPath, localizedPath, type Locale } from '$lib/i18n';
	let locale = $derived((localeFromPath(page.url.pathname) ?? page.data.locale ?? 'de') as Locale);
</script>

<svelte:head><title>{locale === 'en' ? 'Page not found' : 'Seite nicht gefunden'} — ALL IN AGI</title></svelte:head>

<div class="simple-page">
	<section class="simple-card">
		<p class="eyebrow">404</p>
		<h1>{locale === 'en' ? 'Page not found' : 'Seite nicht gefunden'}</h1>
		<p>{locale === 'en' ? 'The requested page does not exist or is no longer available.' : 'Die angeforderte Seite existiert nicht oder ist nicht mehr verfügbar.'}</p>
		<a class="button-primary" href={localizedPath(locale, '/')}>{locale === 'en' ? 'Back to the homepage' : 'Zur Startseite'}</a>
	</section>
</div>
