<script lang="ts">
	import { onMount } from 'svelte';
	import { formatDate, formatPrice } from '$lib/booking';
	let summary: any = $state(null);
	onMount(() => { const raw = sessionStorage.getItem('werksprung-booking'); if (raw) summary = JSON.parse(raw); });
</script>
<svelte:head><title>Erstgespräch gebucht — WERKSPRUNG</title><meta name="robots" content="noindex" /></svelte:head>
<div class="simple-page"><div class="simple-card"><div class="success-mark" aria-hidden="true">✓</div><p class="eyebrow">Termin bestätigt</p><h1>Der erste Schritt ist gemacht.</h1><p>Ihr Erstgespräch ist gebucht. Wir prüfen Ihre Konfiguration gemeinsam und bestätigen anschließend den passenden Event-Termin.</p>
	{#if summary}<div class="summary-box" style="margin-top:30px"><div class="summary-row"><span>Unternehmen</span><b>{summary.companyName}</b></div><div class="summary-row"><span>Erstgespräch</span><b>{formatDate(summary.consultationSlot, true)} Uhr</b></div><div class="summary-row"><span>Event-Wunschtermin</span><b>{formatDate(summary.preferredEventDate)}</b></div><div class="summary-row"><span>Teamgröße</span><b>Bis {summary.capacity} Personen</b></div><div class="summary-row total"><span>Event-Konfiguration</span><b>{formatPrice(summary.totalPrice)} netto</b></div></div>{:else}<p class="placeholder-alert">Die Buchungszusammenfassung ist in dieser Browsersitzung nicht mehr verfügbar. Die Kalenderbestätigung enthält Ihren Gesprächstermin.</p>{/if}
	<a class="button-primary" style="margin-top:28px" href="/">Zur Startseite</a></div></div>
