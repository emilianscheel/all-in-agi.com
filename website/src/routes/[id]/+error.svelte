<script lang="ts">
	import MiniContactCards from '$lib/MiniContactCards.svelte';
</script>

<svelte:head>
	<title>Buchung nicht verfügbar — ALL-IN-AGI</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="booking-error-page">
	<section class="booking-error-card" aria-labelledby="booking-error-title">
		<h1 id="booking-error-title">Buchung nicht verfügbar</h1>
		<MiniContactCards />
		<div class="booking-error-actions">
			<a class="button-primary" href="/verwalten">Erneut versuchen</a>
			<a class="button-secondary" href="/buchen">Neuen Hackathon planen</a>
		</div>
	</section>
</div>
