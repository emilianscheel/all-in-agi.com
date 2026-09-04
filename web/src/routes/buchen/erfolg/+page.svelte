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
	import { page } from '$app/state';
	import { localizedPath, type Locale } from '$lib/i18n';

	type SuccessSummary = BookingConfiguration & {
		prepCallBooking: BookingResultSummary;
		hackathonBooking: BookingResultSummary;
		planUrl: string;
		hackathonId?: string;
		detailUrl?: string;
	};

	let summary = $state<SuccessSummary | null>(null);
	let downloadState = $state<'idle' | 'loading' | 'error'>('idle');
	let locale = $derived((page.data.locale ?? 'de') as Locale);

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
	<title>{locale === 'en' ? 'Hackathon requested' : 'Hackathon angefragt'} — ALL IN AGI</title>
</svelte:head>

<div class="success-page">
	<div class="success-layout">
		<div class="success-map">
			<MapPreview latitude={summary?.address.latitude} longitude={summary?.address.longitude} {locale} />
		</div>
		<section class="success-panel" aria-labelledby="success-title">
			<div class="success-mark"><Check size={30} strokeWidth={2.5} aria-hidden="true" /></div>
			<h1 id="success-title">{locale === 'en' ? 'Request received' : 'Anfrage eingegangen'}</h1>
			{#if summary}
				<p class="success-date">{formatEventTimeRange(summary.hackathonBooking.start || summary.eventStart, summary.hackathonBooking.end || summary.eventEnd, locale)}</p>
				<p>{locale === 'en' ? 'Preparation call reserved' : 'Prep Call reserviert'}: {formatDate(summary.prepCallBooking.start || summary.consultationSlot, true, locale)}{locale === 'de' ? ' Uhr' : ''}</p>
				<p>{locale === 'en' ? 'This is not yet a contract confirmation. During the preparation call, we will review the fixed scope together.' : 'Dies ist noch keine Vertragsbestätigung. Im Prep-Call stimmen wir die eingefrorene Leistung gemeinsam ab.'}</p>
				<MiniContactCards {locale} />
				<div class="success-actions">
					{#if summary.hackathonId}
						<a class="button-primary action-button" href={summary.detailUrl || localizedPath(locale, `/${summary.hackathonId}`)}>
							<ArrowRight size={18} aria-hidden="true" />{locale === 'en' ? 'Open request' : 'Anfrage öffnen'}
						</a>
					{/if}
					<SharePlanButton getUrl={async () => summary?.planUrl || location.href} {locale} />
					<button class="button-secondary action-button" type="button" onclick={downloadPlan} disabled={downloadState === 'loading'}>
						<Download size={18} aria-hidden="true" />{locale === 'en' ? (downloadState === 'loading' ? 'Creating plan …' : downloadState === 'error' ? 'Try download again' : 'Download plan') : (downloadState === 'loading' ? 'Plan wird erstellt …' : downloadState === 'error' ? 'Download erneut versuchen' : 'Plan herunterladen')}
					</button>
					<button class="button-secondary action-button" type="button" onclick={downloadCalendar}>
						<CalendarPlus size={18} aria-hidden="true" />{locale === 'en' ? 'Add calendar event' : 'Kalenderereignis hinzufügen'}
					</button>
				</div>
			{:else}
				<p>{locale === 'en' ? 'The booking summary is no longer available in this browser session.' : 'Die Buchungszusammenfassung ist in dieser Browsersitzung nicht mehr verfügbar.'}</p>
				<MiniContactCards {locale} />
				<div class="success-actions">
					<a class="button-primary action-button" href={localizedPath(locale, '/buchen')}>{locale === 'en' ? 'Plan another hackathon' : 'Neuen Hackathon planen'}</a>
				</div>
			{/if}
		</section>
	</div>
</div>
