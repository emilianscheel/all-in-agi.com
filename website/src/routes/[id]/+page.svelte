<script lang="ts">
	import {
		Award,
		Building2,
		CalendarDays,
		CalendarPlus,
		Camera,
		Check,
		Clock3,
		Code2,
		Contact,
		Cookie,
		Download,
		MapPin,
		MapPinned,
		MessageSquareText,
		Monitor,
		Pizza,
		Plane,
		ReceiptEuro,
		Users
	} from 'lucide-svelte';
	import AddressEditor from '$lib/config/AddressEditor.svelte';
	import ConfigOptionCards, { type OptionValues } from '$lib/config/ConfigOptionCards.svelte';
	import ContactFields from '$lib/config/ContactFields.svelte';
	import MessageField from '$lib/config/MessageField.svelte';
	import PrepCallEditor from '$lib/config/PrepCallEditor.svelte';
	import EditableSummaryRow from '$lib/EditableSummaryRow.svelte';
	import EventDateCalendar from '$lib/EventDateCalendar.svelte';
	import MapPreview from '$lib/MapPreview.svelte';
	import MiniContactCards from '$lib/MiniContactCards.svelte';
	import SharePlanButton from '$lib/SharePlanButton.svelte';
	import { eventDateBounds } from '$lib/event-date';
	import { formatDate, formatPrice, selectedCodingToolLabels, validateConfiguration, type BookingConfiguration } from '$lib/booking';
	import type { HackathonUpdate } from '$lib/hackathon-edit';
	import { untrack } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	type EditSection = HackathonUpdate['section'];

	const initialHackathon = untrack(() => data.hackathon);
	let hackathon = $state(initialHackathon);
	let activeSection = $state<EditSection | null>(null);
	let saving = $state(false);
	let editError = $state('');
	let prepCallMode = $state<'quick' | 'custom'>('quick');
	let customPrepCallDate = $state('');
	let draft = $state<BookingConfiguration>(configurationFromHackathon(initialHackathon));
	const { min: minEventDate, max: maxEventDate } = eventDateBounds();

	let eventAddressLabel = $derived([
		hackathon.address.street,
		[hackathon.address.postalCode, hackathon.address.city].filter(Boolean).join(' ')
	].filter(Boolean).join(', '));
	let equipmentLabel = $derived(hackathon.equipment === 'none' ? 'Provided by us' : 'Projector / Display');
	let codingToolLabels = $derived(selectedCodingToolLabels(hackathon));
	let draftOptions = $derived<OptionValues>({
		capacity: draft.capacity,
		venueProvided: draft.venueProvided,
		equipment: draft.equipment,
		lunch: draft.lunch,
		customLunch: draft.customLunch,
		toolProvision: draft.toolProvision,
		codingTools: draft.codingTools,
		customCodingTool: draft.customCodingTool
	});

	function configurationFromHackathon(value: typeof data.hackathon): BookingConfiguration {
		return {
			capacity: value.capacity,
			venueProvided: value.venueProvided,
			equipment: value.equipment,
			lunch: value.lunch,
			customLunch: value.customLunch,
			toolProvision: value.toolProvision,
			codingTools: [...value.codingTools],
			customCodingTool: value.customCodingTool,
			companyName: value.companyName,
			contactName: value.contactName,
			email: value.email,
			phone: value.phone,
			message: value.message,
			address: { ...value.address },
			preferredEventDate: value.preferredEventDate,
			consultationSlot: value.consultationSlot
		};
	}

	function updateDraftOptions(patch: Partial<OptionValues>) {
		draft = { ...draft, ...patch };
	}

	function openEditor(section: EditSection) {
		draft = configurationFromHackathon(hackathon);
		prepCallMode = 'quick';
		customPrepCallDate = '';
		editError = '';
		activeSection = section;
	}

	function cancelEditor() {
		draft = configurationFromHackathon(hackathon);
		editError = '';
		activeSection = null;
	}

	function updatePayload(section: EditSection): HackathonUpdate {
		switch (section) {
			case 'capacity': return { section, capacity: draft.capacity };
			case 'venue': return { section, venueProvided: draft.venueProvided };
			case 'tools': return { section, toolProvision: draft.toolProvision!, codingTools: draft.codingTools, customCodingTool: draft.customCodingTool };
			case 'equipment': return { section, equipment: draft.equipment };
			case 'lunch': return { section, lunch: draft.lunch, customLunch: draft.customLunch };
			case 'address': return { section, address: draft.address };
			case 'event-date': return { section, preferredEventDate: draft.preferredEventDate };
			case 'prep-call': return { section, consultationSlot: draft.consultationSlot };
			case 'company': return { section, companyName: draft.companyName };
			case 'contact': return { section, contactName: draft.contactName, email: draft.email, phone: draft.phone };
			case 'message': return { section, message: draft.message };
		}
	}

	async function saveEditor() {
		if (!activeSection) return;
		const errors = validateConfiguration(draft);
		if (errors.length) {
			editError = errors[0];
			return;
		}
		saving = true;
		editError = '';
		try {
			const response = await fetch(`/api/hackathons/${hackathon.id}`, {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(updatePayload(activeSection))
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.message ?? 'Die Änderungen konnten nicht gespeichert werden.');
			hackathon = result.hackathon;
			draft = configurationFromHackathon(result.hackathon);
			activeSection = null;
		} catch (error) {
			editError = error instanceof Error ? error.message : 'Die Änderungen konnten nicht gespeichert werden.';
		} finally {
			saving = false;
		}
	}

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

			<MiniContactCards />
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
				<EditableSummaryRow icon={Building2} label="Unternehmen" value={hackathon.companyName} status="Gespeichert" active={activeSection === 'company'} {saving} error={activeSection === 'company' ? editError : ''} onedit={() => openEditor('company')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}<div class="field"><label for="detail-company">Unternehmen</label><input id="detail-company" autocomplete="organization" value={draft.companyName} oninput={(event) => (draft = { ...draft, companyName: event.currentTarget.value })} /></div>{/snippet}
				</EditableSummaryRow>
				<EditableSummaryRow icon={Contact} label="Kontakt" value={`${hackathon.contactName} · ${hackathon.email} · ${hackathon.phone}`} status="Gespeichert" active={activeSection === 'contact'} {saving} error={activeSection === 'contact' ? editError : ''} onedit={() => openEditor('contact')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}<ContactFields companyName={draft.companyName} contactName={draft.contactName} email={draft.email} phone={draft.phone} showCompany={false} idPrefix="detail-contact" onchange={(patch) => (draft = { ...draft, ...patch })} />{/snippet}
				</EditableSummaryRow>
				<EditableSummaryRow icon={MessageSquareText} label="Ihre Nachricht" value={hackathon.message || 'Keine Nachricht hinterlegt'} status={hackathon.message ? 'Vorhanden' : 'Optional'} active={activeSection === 'message'} {saving} error={activeSection === 'message' ? editError : ''} onedit={() => openEditor('message')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}<MessageField value={draft.message} onchange={(message) => (draft = { ...draft, message })} id="detail-message" />{/snippet}
				</EditableSummaryRow>
				<EditableSummaryRow icon={Users} label="Team" value={`Bis ${hackathon.capacity} Personen`} status={formatPrice(hackathon.price.basePrice)} active={activeSection === 'capacity'} {saving} error={activeSection === 'capacity' ? editError : ''} onedit={() => openEditor('capacity')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}<ConfigOptionCards kind="capacity" values={draftOptions} onchange={updateDraftOptions} idPrefix="detail-capacity" />{/snippet}
				</EditableSummaryRow>
				<EditableSummaryRow icon={MapPin} label="Location" value={hackathon.venueProvided ? 'Wir kommen zu Ihnen' : 'Location organisiert'} status={hackathon.venueProvided ? 'Inklusive' : formatPrice(hackathon.price.venueSurcharge)} active={activeSection === 'venue'} {saving} error={activeSection === 'venue' ? editError : ''} onedit={() => openEditor('venue')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}<ConfigOptionCards kind="venue" values={draftOptions} onchange={updateDraftOptions} idPrefix="detail-venue" />{/snippet}
				</EditableSummaryRow>
				<EditableSummaryRow icon={MapPinned} label="Veranstaltungsadresse" value={eventAddressLabel} status="Geplant" active={activeSection === 'address'} {saving} error={activeSection === 'address' ? editError : ''} onedit={() => openEditor('address')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}<AddressEditor value={draft.address} onchange={(address) => (draft = { ...draft, address })} idPrefix="detail-address" />{/snippet}
				</EditableSummaryRow>
				<EditableSummaryRow icon={Code2} label={hackathon.toolProvision === 'needed' ? 'Tools für den Tag' : 'Tools vorhanden'} value={codingToolLabels.join(', ')} status={hackathon.price.toolsAdjustment ? `+ ${formatPrice(hackathon.price.toolsAdjustment)}` : 'Inklusive'} active={activeSection === 'tools'} {saving} error={activeSection === 'tools' ? editError : ''} onedit={() => openEditor('tools')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}<ConfigOptionCards kind="tools" values={draftOptions} onchange={updateDraftOptions} idPrefix="detail-tools" />{/snippet}
				</EditableSummaryRow>
				<EditableSummaryRow icon={Monitor} label="Demo Setup" value={equipmentLabel} status="Inklusive" active={activeSection === 'equipment'} {saving} error={activeSection === 'equipment' ? editError : ''} onedit={() => openEditor('equipment')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}<ConfigOptionCards kind="equipment" values={draftOptions} onchange={updateDraftOptions} idPrefix="detail-equipment" />{/snippet}
				</EditableSummaryRow>
				<EditableSummaryRow icon={CalendarDays} label="Event Date" value={formatDate(hackathon.preferredEventDate)} status="Geplant" active={activeSection === 'event-date'} {saving} error={activeSection === 'event-date' ? editError : ''} onedit={() => openEditor('event-date')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}<EventDateCalendar value={draft.preferredEventDate} minValue={minEventDate} maxValue={maxEventDate} onchange={(preferredEventDate) => (draft = { ...draft, preferredEventDate })} />{/snippet}
				</EditableSummaryRow>
				<EditableSummaryRow icon={Clock3} label="Prep Call" value={`${formatDate(hackathon.booking.start || hackathon.consultationSlot, true)} Uhr`} status="Gebucht" active={activeSection === 'prep-call'} {saving} error={activeSection === 'prep-call' ? editError : ''} onedit={() => openEditor('prep-call')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}<PrepCallEditor value={draft.consultationSlot} mode={prepCallMode} customDate={customPrepCallDate} onchange={(consultationSlot) => (draft = { ...draft, consultationSlot })} onmodechange={(value) => (prepCallMode = value)} oncustomdatechange={(value) => (customPrepCallDate = value)} />{/snippet}
				</EditableSummaryRow>
				<EditableSummaryRow icon={Pizza} label="Lunch" value={hackathon.lunch === 'pizza' ? 'Pizza' : hackathon.lunch === 'custom' ? hackathon.customLunch : hackathon.lunch === 'self-organized' ? 'Selbstorganisiert' : 'No lunch'} status={hackathon.price.lunchAdjustment ? `${hackathon.price.lunchAdjustment > 0 ? '+' : '−'} ${formatPrice(Math.abs(hackathon.price.lunchAdjustment))}` : 'Inklusive'} active={activeSection === 'lunch'} {saving} error={activeSection === 'lunch' ? editError : ''} onedit={() => openEditor('lunch')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}<ConfigOptionCards kind="lunch" values={draftOptions} onchange={updateDraftOptions} idPrefix="detail-lunch" />{/snippet}
				</EditableSummaryRow>
				<EditableSummaryRow icon={Award} label="Winner Poster" value="Auszeichnung für das Gewinnerteam" status="Inklusive" />
				<EditableSummaryRow icon={Camera} label="Event-Fotos" value="Dokumentation des Tages" status="Inklusive" />
				<EditableSummaryRow icon={Cookie} label="Snacks" value="Cookies" status="Inklusive" />
				<EditableSummaryRow icon={Plane} label="Anreise" value="Innerhalb Deutschlands" status="Inklusive" />
				<EditableSummaryRow icon={ReceiptEuro} label="Gesamt" value="Gesamt" status={`${formatPrice(hackathon.price.totalPrice)} netto`} total />
			</div>
		</section>
	</div>
</div>
