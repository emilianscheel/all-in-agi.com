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
	import EventDateTimeEditor from '$lib/EventDateTimeEditor.svelte';
	import { formatEventTimeRange } from '$lib/event-time';
	import MapPreview from '$lib/MapPreview.svelte';
	import MiniContactCards from '$lib/MiniContactCards.svelte';
	import SharePlanButton from '$lib/SharePlanButton.svelte';
	import { eventDateBounds } from '$lib/event-date';
	import { formatPrice, selectedCodingToolLabels, validateConfiguration, type BookingConfiguration } from '$lib/booking';
	import { bookingOverviewRows, type BookingOverviewRowId } from '$lib/booking-overview';
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
	let overviewRows = $derived(bookingOverviewRows(hackathon, hackathon.prepCallBooking));

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
			eventStart: value.eventStart,
			eventEnd: value.eventEnd,
			consultationSlot: value.consultationSlot
		};
	}

	function overviewRow(id: BookingOverviewRowId) {
		return overviewRows.find((row) => row.id === id)!;
	}

	function updateDraftOptions(patch: Partial<OptionValues>) {
		draft = { ...draft, ...patch };
	}

	function openEditor(section: EditSection) {
		if (activeSection === section) {
			cancelEditor();
			return;
		}
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
			case 'event-time': return { section, eventStart: draft.eventStart, eventEnd: draft.eventEnd };
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
						<div class="event-detail"><small>Event Date</small><b>{formatEventTimeRange(hackathon.eventStart, hackathon.eventEnd)}</b></div>
						<div class="event-detail"><small>Team</small><b>Bis {hackathon.capacity} Personen</b></div>
						<div class="event-detail"><small>Location</small><b>{hackathon.venueProvided ? 'Eigener Raum' : 'Von uns organisiert'}</b></div>
						<div class="event-detail"><small>Screen</small><b>{equipmentLabel}</b></div>
					</div>
				</article>
			</MapPreview>
		</div>

		<section class="success-panel detail-panel" aria-labelledby="detail-title">
			<div class="success-mark"><Check size={30} strokeWidth={2.5} aria-hidden="true" /></div>
			<div class="detail-id-row">
				<span class="detail-id">{hackathon.id}</span>
			</div>
			<h1 id="detail-title">Hackathon für {hackathon.companyName}</h1>
			<p class="success-date">{formatEventTimeRange(hackathon.eventStart, hackathon.eventEnd)}</p>

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
				<EditableSummaryRow icon={Users} label={overviewRow('team').label} value={overviewRow('team').value} status={overviewRow('team').status} active={activeSection === 'capacity'} {saving} error={activeSection === 'capacity' ? editError : ''} onedit={() => openEditor('capacity')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}<ConfigOptionCards kind="capacity" values={draftOptions} onchange={updateDraftOptions} idPrefix="detail-capacity" />{/snippet}
				</EditableSummaryRow>
				<EditableSummaryRow icon={MapPin} label={overviewRow('location').label} value={overviewRow('location').value} status={overviewRow('location').status} active={activeSection === 'venue'} {saving} error={activeSection === 'venue' ? editError : ''} onedit={() => openEditor('venue')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}<ConfigOptionCards kind="venue" values={draftOptions} onchange={updateDraftOptions} idPrefix="detail-venue" />{/snippet}
				</EditableSummaryRow>
				<EditableSummaryRow icon={MapPinned} label="Veranstaltungsadresse" value={eventAddressLabel} status="Geplant" active={activeSection === 'address'} {saving} error={activeSection === 'address' ? editError : ''} onedit={() => openEditor('address')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}<AddressEditor value={draft.address} onchange={(address) => (draft = { ...draft, address })} idPrefix="detail-address" />{/snippet}
				</EditableSummaryRow>
				<EditableSummaryRow icon={Code2} label={overviewRow('tools').label} value={overviewRow('tools').value} status={overviewRow('tools').status} active={activeSection === 'tools'} {saving} error={activeSection === 'tools' ? editError : ''} onedit={() => openEditor('tools')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}<ConfigOptionCards kind="tools" values={draftOptions} onchange={updateDraftOptions} idPrefix="detail-tools" />{/snippet}
				</EditableSummaryRow>
				<EditableSummaryRow icon={Monitor} label={overviewRow('equipment').label} value={overviewRow('equipment').value} status={overviewRow('equipment').status} active={activeSection === 'equipment'} {saving} error={activeSection === 'equipment' ? editError : ''} onedit={() => openEditor('equipment')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}<ConfigOptionCards kind="equipment" values={draftOptions} onchange={updateDraftOptions} idPrefix="detail-equipment" />{/snippet}
				</EditableSummaryRow>
				<EditableSummaryRow icon={CalendarDays} label={overviewRow('event-date').label} value={overviewRow('event-date').value} status={overviewRow('event-date').status} active={activeSection === 'event-time'} {saving} error={activeSection === 'event-time' ? editError : ''} onedit={() => openEditor('event-time')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}<EventDateTimeEditor eventStart={draft.eventStart} eventEnd={draft.eventEnd} minValue={minEventDate} maxValue={maxEventDate} onchange={(value) => (draft = { ...draft, ...value })} />{/snippet}
				</EditableSummaryRow>
				<EditableSummaryRow icon={Clock3} label={overviewRow('prep-call').label} value={overviewRow('prep-call').value} status={overviewRow('prep-call').status} active={activeSection === 'prep-call'} {saving} error={activeSection === 'prep-call' ? editError : ''} onedit={() => openEditor('prep-call')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}<PrepCallEditor value={draft.consultationSlot} mode={prepCallMode} customDate={customPrepCallDate} onchange={(consultationSlot) => (draft = { ...draft, consultationSlot })} onmodechange={(value) => (prepCallMode = value)} oncustomdatechange={(value) => (customPrepCallDate = value)} />{/snippet}
				</EditableSummaryRow>
				<EditableSummaryRow icon={Pizza} label={overviewRow('lunch').label} value={overviewRow('lunch').value} status={overviewRow('lunch').status} active={activeSection === 'lunch'} {saving} error={activeSection === 'lunch' ? editError : ''} onedit={() => openEditor('lunch')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}<ConfigOptionCards kind="lunch" values={draftOptions} onchange={updateDraftOptions} idPrefix="detail-lunch" />{/snippet}
				</EditableSummaryRow>
				<EditableSummaryRow icon={Award} label={overviewRow('winner-poster').label} value={overviewRow('winner-poster').value} status={overviewRow('winner-poster').status} />
				<EditableSummaryRow icon={Camera} label={overviewRow('event-photos').label} value={overviewRow('event-photos').value} status={overviewRow('event-photos').status} />
				<EditableSummaryRow icon={Cookie} label={overviewRow('snacks').label} value={overviewRow('snacks').value} status={overviewRow('snacks').status} />
				<EditableSummaryRow icon={Plane} label={overviewRow('travel').label} value={overviewRow('travel').value} status={overviewRow('travel').status} />
				<EditableSummaryRow icon={ReceiptEuro} label={overviewRow('total').label} value={overviewRow('total').value} status={overviewRow('total').status} total />
			</div>
		</section>
	</div>
</div>
