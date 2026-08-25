<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowRight, CalendarPlus, Check, Download } from 'lucide-svelte';
	import MapPreview from '$lib/MapPreview.svelte';
	import MiniContactCards from '$lib/MiniContactCards.svelte';
	import SharePlanButton from '$lib/SharePlanButton.svelte';
	import { createPrepCallIcs, type BookingResultSummary } from '$lib/booking-ics';
	import { formatDate, type BookingConfiguration } from '$lib/booking';
	import { formatEventTimeRange } from '$lib/event-time';
	import { trackAnalyticsEvent } from '$lib/analytics';

	type SuccessSummary = BookingConfiguration & {
		prepCallBooking: BookingResultSummary;
		hackathonBooking: BookingResultSummary;
		planUrl: string;
		hackathonId?: string;
		detailUrl?: string;
	};

	let summary = $state<SuccessSummary | null>(null);
	let downloadState = $state<'idle' | 'loading' | 'error'>('idle');

	onMount(() => {
		try {
			const raw = sessionStorage.getItem('all-in-agi-booking');
			if (raw) summary = JSON.parse(raw) as SuccessSummary;
		} catch { summary = null; }
	});

	function downloadBlob(blob: Blob, filename: string) {
		const href = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = href;
		link.download = filename;
		link.click();
		setTimeout(() => URL.revokeObjectURL(href), 1_000);
	}

	async function downloadPlan() {
		if (!summary) return;
		downloadState = 'loading';
		try {
			const response = await fetch('/api/plan-pdf', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(summary) });
			if (!response.ok) throw new Error('PDF error');
			downloadBlob(await response.blob(), 'all-in-agi-hackathon-plan.pdf');
			trackAnalyticsEvent('booking_plan_downloaded');
			downloadState = 'idle';
		} catch { downloadState = 'error'; }
	}

	function downloadCalendar() {
		if (!summary) return;
		downloadBlob(new Blob([createPrepCallIcs(summary, summary.prepCallBooking)], { type: 'text/calendar;charset=utf-8' }), 'all-in-agi-prep-call.ics');
		trackAnalyticsEvent('booking_calendar_downloaded');
	}
</script>

<svelte:head>
	<title>Hackathon angefragt — ALL IN AGI</title>
</svelte:head>

<div class="success-page">
	<div class="success-layout">
		<div class="success-map">
			<MapPreview latitude={summary?.address.latitude} longitude={summary?.address.longitude} />
		</div>
		<section class="success-panel" aria-labelledby="success-title">
			<div class="success-mark"><Check size={30} strokeWidth={2.5} aria-hidden="true" /></div>
			<h1 id="success-title">Anfrage eingegangen</h1>
			{#if summary}
				<p class="success-date">{formatEventTimeRange(summary.hackathonBooking.start || summary.eventStart, summary.hackathonBooking.end || summary.eventEnd)}</p>
				<p>Prep Call reserviert: {formatDate(summary.prepCallBooking.start || summary.consultationSlot, true)} Uhr</p>
				<p>Dies ist noch keine Vertragsbestätigung. Im Prep-Call stimmen wir die eingefrorene Leistung gemeinsam ab.</p>
				<MiniContactCards />
				<div class="success-actions">
					{#if summary.hackathonId}
						<a class="button-primary action-button" href={summary.detailUrl || `/${summary.hackathonId}`}>
							<ArrowRight size={18} aria-hidden="true" />Anfrage öffnen
						</a>
					{/if}
					<SharePlanButton getUrl={async () => summary?.planUrl || location.href} />
					<button class="button-secondary action-button" type="button" onclick={downloadPlan} disabled={downloadState === 'loading'}>
						<Download size={18} aria-hidden="true" />{downloadState === 'loading' ? 'Plan wird erstellt …' : downloadState === 'error' ? 'Download erneut versuchen' : 'Plan herunterladen'}
					</button>
					<button class="button-secondary action-button" type="button" onclick={downloadCalendar}>
						<CalendarPlus size={18} aria-hidden="true" />Kalenderereignis hinzufügen
					</button>
				</div>
			{:else}
				<p>Die Buchungszusammenfassung ist in dieser Browsersitzung nicht mehr verfügbar.</p>
				<MiniContactCards />
				<div class="success-actions">
					<a class="button-primary action-button" href="/buchen">Neuen Hackathon planen</a>
				</div>
			{/if}
		</section>
	</div>
</div>
