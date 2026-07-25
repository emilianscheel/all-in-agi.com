<script lang="ts">
	import {
		Award,
		CalendarDays,
		CalendarPlus,
		Camera,
		Check,
		Clock3,
		Code2,
		Cookie,
		Download,
		MapPin,
		Monitor,
		Pizza,
		Plane,
		ReceiptEuro,
		Users
	} from 'lucide-svelte';
	import MapPreview from '$lib/MapPreview.svelte';
	import SharePlanButton from '$lib/SharePlanButton.svelte';
	import { formatDate, formatPrice, selectedCodingToolLabels } from '$lib/booking';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let hackathon = $derived(data.hackathon);
	let eventAddressLabel = $derived([
		hackathon.address.street,
		[hackathon.address.postalCode, hackathon.address.city].filter(Boolean).join(' ')
	].filter(Boolean).join(', '));
	let equipmentLabel = $derived(hackathon.equipment === 'none' ? 'Provided by us' : 'Projector / Display');
	let codingToolLabels = $derived(selectedCodingToolLabels(hackathon));

	async function getDetailUrl() {
		return location.href;
	}
</script>

<svelte:head>
	<title>Hackathon für {hackathon.companyName} — ALL-IN-AGI</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="success-page detail-page">
	<div class="success-layout detail-layout">
		<div class="success-map detail-map">
			<MapPreview latitude={hackathon.address.latitude} longitude={hackathon.address.longitude}>
				<article class="event-card">
					<div class="event-card-top">
						<h2>{hackathon.companyName}</h2>
						<div class="event-card-price">{formatPrice(hackathon.price.totalPrice)}</div>
					</div>
					{#if eventAddressLabel}<p class="event-address">{eventAddressLabel}</p>{/if}
					<div class="event-details">
						<div class="event-detail"><small>Event Date</small><b>{formatDate(hackathon.preferredEventDate)}</b></div>
						<div class="event-detail"><small>Team</small><b>Bis {hackathon.capacity} Personen</b></div>
						<div class="event-detail"><small>Location</small><b>{hackathon.venueProvided ? 'Eigener Raum' : 'Von uns organisiert'}</b></div>
						<div class="event-detail"><small>Screen</small><b>{equipmentLabel}</b></div>
					</div>
				</article>
			</MapPreview>
		</div>

		<section class="success-panel detail-panel" aria-labelledby="detail-title">
			<div class="detail-heading">
				<div class="success-mark"><Check size={30} strokeWidth={2.5} aria-hidden="true" /></div>
				<span class="detail-status">Bestätigt</span>
			</div>
			<p class="detail-id">{hackathon.id}</p>
			<h1 id="detail-title">Hackathon für {hackathon.companyName}</h1>
			<p class="success-date">{formatDate(hackathon.preferredEventDate)}</p>
			<p>Ihr Hackathon ist geplant. Hier finden Sie den aktuellen Überblick und alle Unterlagen für den nächsten Schritt.</p>

			<div class="success-actions">
				<SharePlanButton getUrl={getDetailUrl} label="Hackathon teilen" />
				<a class="button-primary action-button" href={`/api/hackathons/${hackathon.id}/plan.pdf`}>
					<Download size={18} aria-hidden="true" />Plan herunterladen
				</a>
				<a class="button-secondary action-button" href={`/api/hackathons/${hackathon.id}/prep-call.ics`}>
					<CalendarPlus size={18} aria-hidden="true" />Kalenderereignis hinzufügen
				</a>
			</div>

			<div class="summary-box overview-box detail-overview">
				<div class="summary-row"><Users size={18} aria-hidden="true" /><span><small>Team</small>Bis {hackathon.capacity} Personen</span><b>{formatPrice(hackathon.price.basePrice)}</b></div>
				<div class="summary-row"><MapPin size={18} aria-hidden="true" /><span><small>Location</small>{hackathon.venueProvided ? 'Wir kommen zu Ihnen' : 'Location organisiert'}</span><b>{hackathon.venueProvided ? 'Inklusive' : formatPrice(hackathon.price.venueSurcharge)}</b></div>
				<div class="summary-row"><Code2 size={18} aria-hidden="true" /><span><small>{hackathon.toolProvision === 'needed' ? 'Tools für den Tag' : 'Tools vorhanden'}</small>{codingToolLabels.join(', ')}</span><b>{hackathon.price.toolsAdjustment ? `+ ${formatPrice(hackathon.price.toolsAdjustment)}` : 'Inklusive'}</b></div>
				<div class="summary-row"><Monitor size={18} aria-hidden="true" /><span><small>Demo Setup</small>{equipmentLabel}</span><b>Inklusive</b></div>
				<div class="summary-row"><CalendarDays size={18} aria-hidden="true" /><span><small>Event Date</small>{formatDate(hackathon.preferredEventDate)}</span><b>Geplant</b></div>
				<div class="summary-row"><Clock3 size={18} aria-hidden="true" /><span><small>Prep Call</small>{formatDate(hackathon.booking.start || hackathon.consultationSlot, true)} Uhr</span><b>Gebucht</b></div>
				<div class="summary-row"><Pizza size={18} aria-hidden="true" /><span><small>Lunch</small>{hackathon.lunch === 'pizza' ? 'Pizza' : hackathon.lunch === 'custom' ? hackathon.customLunch : hackathon.lunch === 'self-organized' ? 'Selbstorganisiert' : 'No lunch'}</span><b>{hackathon.price.lunchAdjustment ? `${hackathon.price.lunchAdjustment > 0 ? '+' : '−'} ${formatPrice(Math.abs(hackathon.price.lunchAdjustment))}` : 'Inklusive'}</b></div>
				<div class="summary-row"><Award size={18} aria-hidden="true" /><span><small>Winner Poster</small>Auszeichnung für das Gewinnerteam</span><b>Inklusive</b></div>
				<div class="summary-row"><Camera size={18} aria-hidden="true" /><span><small>Event-Fotos</small>Dokumentation des Tages</span><b>Inklusive</b></div>
				<div class="summary-row"><Cookie size={18} aria-hidden="true" /><span><small>Snacks</small>Cookies</span><b>Inklusive</b></div>
				<div class="summary-row"><Plane size={18} aria-hidden="true" /><span><small>Anreise</small>Innerhalb Deutschlands</span><b>Inklusive</b></div>
				<div class="summary-row total"><ReceiptEuro size={20} aria-hidden="true" /><span>Gesamt</span><b>{formatPrice(hackathon.price.totalPrice)} netto</b></div>
			</div>
		</section>
	</div>
</div>
