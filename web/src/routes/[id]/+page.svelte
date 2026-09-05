<script lang="ts">
	import {
		Award,
		Ban,
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
		ExternalLink,
		MapPin,
		MapPinned,
		Laptop,
		Mail,
		MessageSquareText,
		Monitor,
		Pizza,
		Plane,
		ReceiptEuro,
		RotateCcw,
		Users
	} from 'lucide-svelte';
	import { AlertDialog } from 'bits-ui';
	import { invalidateAll } from '$app/navigation';
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
	import { formatPrice, selectedCodingToolLabels, validateBillingDetails, validateConfiguration, type BillingDetails, type BookingConfiguration } from '$lib/booking';
	import { bookingOverviewRows, type BookingOverviewRowId } from '$lib/booking-overview';
	import type { HackathonUpdate } from '$lib/hackathon-edit';
	import { LEGAL_DOCUMENT_VERSION } from '$lib/legal';
	import { untrack } from 'svelte';
	import type { PageData } from './$types';
	import type { Locale } from '$lib/i18n';

	let { data }: { data: PageData } = $props();
	type EditSection = HackathonUpdate['section'];

	const initialHackathon = untrack(() => data.hackathon);
	const initialInvoice = untrack(() => data.invoice);
	let hackathon = $state(initialHackathon);
	let locale = $derived((data.locale ?? 'de') as Locale);
	let activeSection = $state<EditSection | null>(null);
	let saving = $state(false);
	let eventSlotsLoading = $state(false);
	let eventAvailabilityKey = $state(0);
	let editError = $state('');
	let confirmationEmailState = $state<'idle' | 'loading' | 'sent' | 'error'>('idle');
	let invoiceDownloadState = $state<'idle' | 'loading' | 'error'>('idle');
	let invoiceEmailState = $state<'idle' | 'loading' | 'sent' | 'error'>('idle');
	let invoiceIssued = $state(Boolean(initialInvoice?.issued));
	let invoiceEmailSentAt = $state<string | null>(initialInvoice?.emailSentAt ?? null);
	let downPaymentDownloadState = $state<'idle' | 'loading' | 'error'>('idle');
	let downPaymentEmailState = $state<'idle' | 'loading' | 'sent' | 'error'>('idle');
	let downPaymentIssued = $state(Boolean(initialInvoice?.downPayment.issued));
	let downPaymentEmailSentAt = $state<string | null>(initialInvoice?.downPayment.emailSentAt ?? null);
	let downPaymentPaidAt = $state<string | null>(initialInvoice?.downPayment.paidAt ?? null);
	let downPaymentPaidBusy = $state(false);
	let invoiceMessage = $state('');
	let cancellationBusy = $state(false);
	let cancellationMessage = $state('');
	let contractBusy = $state(false);
	let contractMessage = $state('');
	let agreementCustomerName = $state(initialHackathon.contactName);
	let agreementOrganizerName = $state('Emilian Scheel');
	let cancelDialogOpen = $state(false);
	let prepCallMode = $state<'quick' | 'custom'>('quick');
	let customPrepCallDate = $state('');
	let draft = $state<BookingConfiguration>(configurationFromHackathon(initialHackathon));
	const { min: minEventDate, max: maxEventDate } = eventDateBounds();

	let eventAddressLabel = $derived([
		hackathon.address.street,
		[hackathon.address.postalCode, hackathon.address.city].filter(Boolean).join(' ')
	].filter(Boolean).join(', '));
	let equipmentLabel = $derived(hackathon.equipment === 'none' ? (locale === 'en' ? 'Provided by us' : 'Wird von uns gestellt') : 'Projector / Display');
	let codingToolLabels = $derived(selectedCodingToolLabels(hackathon));
	let draftOptions = $derived<OptionValues>({
		capacity: draft.capacity,
		venueProvided: draft.venueProvided,
		equipment: draft.equipment,
		lunch: draft.lunch,
		customLunch: draft.customLunch,
		toolProvision: draft.toolProvision,
		codingTools: draft.codingTools,
		customCodingTool: draft.customCodingTool,
		deviceProvision: draft.deviceProvision,
		deviceCount: draft.deviceCount
	});
	let overviewRows = $derived(bookingOverviewRows({ ...hackathon, locale }, hackathon.prepCallBooking));
	let readOnly = $derived(!['prep_scheduled', 'confirmed'].includes(hackathon.status));
	let canScheduleDeferredEvent = $derived(!hackathon.eventStart && ['prep_scheduled', 'exit_window', 'contracted', 'confirmed'].includes(hackathon.status));
	let invoiceEligible = $derived(['contracted', 'confirmed', 'completed'].includes(hackathon.status));
	let cancellableContract = $derived(['contracted', 'confirmed'].includes(hackathon.status));
	let splitBilling = $derived(initialInvoice?.billingModel === 'deposit_30');
	let finalInvoiceAvailable = $derived(Boolean(hackathon.eventEnd) && (!splitBilling || (Boolean(downPaymentPaidAt) && new Date() >= new Date(hackathon.eventEnd!))));
	let standardOffer = $derived(hackathon.legalVersion === LEGAL_DOCUMENT_VERSION);
	let billingComplete = $derived(validateBillingDetails(hackathon.billing, locale).length === 0);

	function billingDraft(value: typeof data.hackathon): BillingDetails {
		return value.billing ?? {
			companyName: value.companyName,
			legalForm: '',
			contactName: value.contactName,
			email: value.email,
			vatId: '',
			purchaseOrder: '',
			address: {
				street: value.address.street,
				postalCode: value.address.postalCode,
				city: value.address.city,
				country: 'Deutschland'
			}
		};
	}

	function configurationFromHackathon(value: typeof data.hackathon): BookingConfiguration {
		return {
			locale: value.locale,
			capacity: value.capacity,
			venueProvided: value.venueProvided,
			equipment: value.equipment,
			lunch: value.lunch,
			customLunch: value.customLunch,
			toolProvision: value.toolProvision,
			codingTools: [...value.codingTools],
			customCodingTool: value.customCodingTool,
			deviceProvision: value.deviceProvision,
			deviceCount: value.deviceCount,
			eventPhotos: value.eventPhotos,
			companyName: value.companyName,
			contactName: value.contactName,
			email: value.email,
			phone: value.phone,
			message: value.message,
			address: { ...value.address },
			eventStart: value.eventStart,
			eventEnd: value.eventEnd,
			consultationSlot: value.consultationSlot,
			billing: billingDraft(value),
			businessCustomerConfirmed: value.businessCustomerConfirmed,
			authorityConfirmed: value.authorityConfirmed
		};
	}

	async function recordAgreement() {
		if (contractBusy) return;
		contractBusy = true;
		contractMessage = '';
		try {
			const response = await fetch(`/api/hackathons/${hackathon.id}/contract-agreement`, {
				method: 'POST', headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ customerName: agreementCustomerName, organizerName: agreementOrganizerName })
			});
			const result = await response.json();
			if (!response.ok && response.status !== 202) throw new Error(result.message ?? 'Die Zustimmung konnte nicht gespeichert werden.');
			hackathon = { ...hackathon, status: result.status, exitDeadline: result.exitDeadline };
			contractMessage = result.emailSent ? 'Zustimmung gespeichert und Vertragsbestätigung versandt.' : result.message;
			await invalidateAll();
		} catch (error) { contractMessage = error instanceof Error ? error.message : 'Die Zustimmung konnte nicht gespeichert werden.'; }
		finally { contractBusy = false; }
	}

	async function withdrawDuringExitWindow(by: 'customer' | 'organizer') {
		if (contractBusy) return;
		contractBusy = true;
		contractMessage = '';
		try {
			const response = await fetch(`/api/hackathons/${hackathon.id}/contract-withdraw`, {
				method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ by })
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.message ?? 'Der Rücktritt konnte nicht gespeichert werden.');
			hackathon = { ...hackathon, status: result.status };
			contractMessage = 'Der kostenfreie Rücktritt wurde revisionsfest gespeichert.';
			await invalidateAll();
		} catch (error) { contractMessage = error instanceof Error ? error.message : 'Der Rücktritt konnte nicht gespeichert werden.'; }
		finally { contractBusy = false; }
	}

	async function completeContract() {
		if (contractBusy) return;
		contractBusy = true;
		try {
			const response = await fetch(`/api/hackathons/${hackathon.id}/contract-complete`, { method: 'POST' });
			const result = await response.json();
			if (!response.ok) throw new Error(result.message ?? 'Der Vertrag konnte nicht abgeschlossen werden.');
			hackathon = { ...hackathon, status: result.status };
			contractMessage = 'Durchführung als abgeschlossen markiert.';
			await invalidateAll();
		} catch (error) { contractMessage = error instanceof Error ? error.message : 'Der Vertrag konnte nicht abgeschlossen werden.'; }
		finally { contractBusy = false; }
	}

	function overviewRow(id: BookingOverviewRowId) {
		return overviewRows.find((row) => row.id === id)!;
	}

	function updateDraftOptions(patch: Partial<OptionValues>) {
		const next = { ...draft, ...patch };
		if (patch.capacity !== undefined && next.deviceProvision === 'needed' && next.deviceCount > patch.capacity) {
			next.deviceCount = patch.capacity;
		}
		draft = next;
	}

	function updateDraftBilling(patch: Partial<BillingDetails>) {
		draft = { ...draft, billing: { ...draft.billing!, ...patch } };
	}

	function updateDraftBillingAddress(patch: Partial<BillingDetails['address']>) {
		draft = { ...draft, billing: { ...draft.billing!, address: { ...draft.billing!.address, ...patch } } };
	}

	function openEditor(section: EditSection) {
		if (readOnly && !(section === 'event-time' && canScheduleDeferredEvent)) return;
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
			case 'devices': return { section, deviceProvision: draft.deviceProvision!, deviceCount: draft.deviceCount };
			case 'equipment': return { section, equipment: draft.equipment };
			case 'lunch': return { section, lunch: draft.lunch, customLunch: draft.customLunch };
			case 'address': return { section, address: draft.address };
			case 'event-time': {
				if (!draft.eventStart || !draft.eventEnd) throw new Error(locale === 'en' ? 'Please select a hackathon date.' : 'Bitte wählen Sie einen Hackathon-Termin.');
				return { section, eventStart: draft.eventStart, eventEnd: draft.eventEnd };
			}
			case 'prep-call': return { section, consultationSlot: draft.consultationSlot };
			case 'company': return { section, companyName: draft.companyName };
			case 'contact': return { section, contactName: draft.contactName, email: draft.email, phone: draft.phone };
			case 'billing': return { section, billing: draft.billing! };
			case 'message': return { section, message: draft.message };
		}
	}

	async function saveEditor() {
		if (!activeSection) return;
		const errors = validateConfiguration(draft);
		if (activeSection === 'billing') errors.push(...validateBillingDetails(draft.billing, locale));
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
			if (!response.ok) {
				if (response.status === 409 && result.field === 'hackathon') eventAvailabilityKey += 1;
				throw new Error(result.message ?? 'Die Änderungen konnten nicht gespeichert werden.');
			}
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

	async function resendConfirmationEmail() {
		if (confirmationEmailState === 'loading') return;
		confirmationEmailState = 'loading';
		try {
			const response = await fetch(`/api/hackathons/${hackathon.id}/confirmation-email`, {
				method: 'POST'
			});
			if (!response.ok) throw new Error('Die Bestätigungs-E-Mail konnte nicht gesendet werden.');
			confirmationEmailState = 'sent';
		} catch {
			confirmationEmailState = 'error';
		}
	}

	async function downloadInvoice() {
		if (invoiceDownloadState === 'loading') return;
		invoiceDownloadState = 'loading';
		invoiceMessage = '';
		try {
			const response = await fetch(`/api/hackathons/${hackathon.id}/invoice.pdf`, { method: 'POST' });
			if (!response.ok) {
				const result = await response.json().catch(() => ({}));
				throw new Error(result.message ?? 'Die Rechnung konnte nicht heruntergeladen werden.');
			}
			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `all-in-agi-rechnung-${hackathon.id}.pdf`;
			document.body.append(link);
			link.click();
			link.remove();
			setTimeout(() => URL.revokeObjectURL(url), 0);
			invoiceIssued = true;
			invoiceDownloadState = 'idle';
		} catch (error) {
			invoiceDownloadState = 'error';
			invoiceMessage = error instanceof Error ? error.message : 'Die Rechnung konnte nicht heruntergeladen werden.';
		}
	}

	async function sendInvoice() {
		if (invoiceEmailState === 'loading') return;
		invoiceEmailState = 'loading';
		invoiceMessage = '';
		try {
			const response = await fetch(`/api/hackathons/${hackathon.id}/invoice-email`, { method: 'POST' });
			const result = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(result.message ?? 'Die Rechnungs-E-Mail konnte nicht gesendet werden.');
			invoiceIssued = true;
			invoiceEmailSentAt = result.sentAt;
			invoiceEmailState = 'sent';
			invoiceMessage = 'Die Rechnung wurde per E-Mail gesendet.';
		} catch (error) {
			invoiceEmailState = 'error';
			invoiceMessage = error instanceof Error ? error.message : 'Die Rechnungs-E-Mail konnte nicht gesendet werden.';
		}
	}

	async function downloadDownPaymentInvoice() {
		if (downPaymentDownloadState === 'loading') return;
		downPaymentDownloadState = 'loading';
		invoiceMessage = '';
		try {
			const response = await fetch(`/api/hackathons/${hackathon.id}/down-payment.pdf`, { method: 'POST' });
			if (!response.ok) {
				const result = await response.json().catch(() => ({}));
				throw new Error(result.message ?? 'Die Anzahlungsrechnung konnte nicht heruntergeladen werden.');
			}
			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `all-in-agi-anzahlung-${hackathon.id}.pdf`;
			document.body.append(link);
			link.click();
			link.remove();
			setTimeout(() => URL.revokeObjectURL(url), 0);
			downPaymentIssued = true;
			downPaymentDownloadState = 'idle';
		} catch (error) {
			downPaymentDownloadState = 'error';
			invoiceMessage = error instanceof Error ? error.message : 'Die Anzahlungsrechnung konnte nicht heruntergeladen werden.';
		}
	}

	async function sendDownPaymentInvoice() {
		if (downPaymentEmailState === 'loading') return;
		downPaymentEmailState = 'loading';
		invoiceMessage = '';
		try {
			const response = await fetch(`/api/hackathons/${hackathon.id}/down-payment-email`, { method: 'POST' });
			const result = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(result.message ?? 'Die Anzahlungsrechnung konnte nicht gesendet werden.');
			downPaymentIssued = true;
			downPaymentEmailSentAt = result.sentAt;
			downPaymentEmailState = 'sent';
			invoiceMessage = 'Die Anzahlungsrechnung wurde per E-Mail gesendet.';
		} catch (error) {
			downPaymentEmailState = 'error';
			invoiceMessage = error instanceof Error ? error.message : 'Die Anzahlungsrechnung konnte nicht gesendet werden.';
		}
	}

	async function markDownPaymentReceived() {
		if (downPaymentPaidBusy || downPaymentPaidAt) return;
		downPaymentPaidBusy = true;
		invoiceMessage = '';
		try {
			const response = await fetch(`/api/hackathons/${hackathon.id}/down-payment-paid`, { method: 'POST' });
			const result = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(result.message ?? 'Der Zahlungseingang konnte nicht gespeichert werden.');
			downPaymentPaidAt = result.paidAt;
			invoiceMessage = 'Der Zahlungseingang wurde gespeichert.';
		} catch (error) {
			invoiceMessage = error instanceof Error ? error.message : 'Der Zahlungseingang konnte nicht gespeichert werden.';
		} finally {
			downPaymentPaidBusy = false;
		}
	}

	async function cancelBooking() {
		if (cancellationBusy) return;
		cancellationBusy = true;
		cancellationMessage = '';
		try {
			const response = await fetch(`/api/hackathons/${hackathon.id}/cancel`, { method: 'POST' });
			const result = await response.json();
			if (!response.ok && response.status !== 202) throw new Error(result.message ?? 'Die Stornierung konnte nicht gestartet werden.');
			hackathon = {
				...hackathon,
				status: result.status,
				cancelledAt: result.status === 'cancelled' ? hackathon.cancelledAt ?? new Date().toISOString() : hackathon.cancelledAt,
				cancellationEmailSentAt: result.emailSent ? hackathon.cancellationEmailSentAt ?? new Date().toISOString() : hackathon.cancellationEmailSentAt
			};
			cancellationMessage = result.complete
				? 'Die Buchung wurde storniert und der Kunde benachrichtigt.'
				: result.message ?? 'Die Stornierung ist noch nicht vollständig. Bitte versuchen Sie es erneut.';
			cancelDialogOpen = false;
			await invalidateAll();
		} catch (error) {
			cancellationMessage = error instanceof Error ? error.message : 'Die Stornierung konnte nicht gestartet werden.';
		} finally {
			cancellationBusy = false;
		}
	}

</script>

<svelte:head>
	<title>{locale === 'en' ? 'Hackathon for' : 'Hackathon für'} {hackathon.companyName} — ALL IN AGI</title>
</svelte:head>

<div class:detail-readonly={readOnly} class="success-page detail-page">
	<div class="success-layout detail-layout">
		<div class="success-map detail-map">
			<MapPreview latitude={hackathon.address.latitude} longitude={hackathon.address.longitude} {locale}>
				<article class="event-card">
					<div class="event-card-top">
						<h2>{hackathon.companyName}</h2>
						<div class="event-card-price">{formatPrice(hackathon.price.totalPrice, locale)}</div>
					</div>
					{#if eventAddressLabel}<p class="event-address">{hackathon.venueProvided ? eventAddressLabel : `${locale === 'en' ? 'Search area' : 'Suchgebiet'}: ${eventAddressLabel}`}</p>{/if}
					<div class="event-details">
						<div class="event-detail"><small>{locale === 'en' ? 'Event date' : 'Veranstaltungsdatum'}</small><b>{formatEventTimeRange(hackathon.eventStart, hackathon.eventEnd, locale)}</b></div>
						<div class="event-detail"><small>Team</small><b>{locale === 'en' ? 'Up to' : 'Bis'} {hackathon.capacity} {locale === 'en' ? 'people' : 'Personen'}</b></div>
						<div class="event-detail"><small>{locale === 'en' ? 'Location' : 'Ort'}</small><b>{hackathon.venueProvided ? (locale === 'en' ? 'Your venue' : 'Eigener Raum') : (locale === 'en' ? 'To be confirmed' : 'Wird bestätigt')}</b></div>
						<div class="event-detail"><small>Screen</small><b>{equipmentLabel}</b></div>
					</div>
				</article>
			</MapPreview>
		</div>

		<section class="success-panel detail-panel" aria-labelledby="detail-title">
			<div class="success-mark"><Check size={30} strokeWidth={2.5} aria-hidden="true" /></div>
			<h1 id="detail-title">{locale === 'en' ? 'Hackathon for' : 'Hackathon für'} {hackathon.companyName}</h1>
			<p class="success-date">{formatEventTimeRange(hackathon.eventStart, hackathon.eventEnd, locale)}</p>
			{#if hackathon.status === 'cancelled'}
				<div class="booking-state-banner cancelled" role="status"><Ban size={18} aria-hidden="true" /><span><strong>{locale === 'en' ? 'Booking cancelled' : 'Buchung storniert'}</strong>{locale === 'en' ? 'The calendar reservations have been cancelled.' : 'Die Kalendertermine wurden aufgehoben.'}</span></div>
			{:else if hackathon.status === 'cancellation_pending'}
				<div class="booking-state-banner pending" role="status"><RotateCcw size={18} aria-hidden="true" /><span><strong>{locale === 'en' ? 'Cancellation in progress' : 'Stornierung in Bearbeitung'}</strong>{locale === 'en' ? 'At least one step still needs to be completed.' : 'Mindestens ein Schritt muss noch abgeschlossen werden.'}</span></div>
			{:else if hackathon.status === 'prep_scheduled'}
				<div class="booking-state-banner pending" role="status"><Clock3 size={18} aria-hidden="true" /><span><strong>{locale === 'en' ? 'Non-binding request' : 'Unverbindliche Anfrage'}</strong>{hackathon.eventStart ? (locale === 'en' ? 'The preparation call and hackathon day are reserved. No contract has been concluded yet.' : 'Prep-Call und Hackathontag sind reserviert. Ein Vertrag ist noch nicht geschlossen.') : (locale === 'en' ? 'The preparation call is reserved. The hackathon date will be selected later.' : 'Der Prep-Call ist reserviert. Der Hackathon-Termin wird später festgelegt.')}</span></div>
			{:else if hackathon.status === 'exit_window'}
				<div class="booking-state-banner pending" role="status"><Clock3 size={18} aria-hidden="true" /><span><strong>Vertrag geschlossen · Lösungsfrist läuft</strong>Kostenfreier Rücktritt bis {hackathon.exitDeadline ? new Intl.DateTimeFormat('de-DE', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Berlin' }).format(new Date(hackathon.exitDeadline)) : 'Fristende wird berechnet'}.</span></div>
			{:else if hackathon.status === 'contracted'}
				<div class="booking-state-banner" role="status"><Check size={18} aria-hidden="true" /><span><strong>Vertrag verbindlich</strong>Die kostenlose beiderseitige Lösungsfrist ist abgelaufen.</span></div>
			{:else if hackathon.status === 'withdrawn'}
				<div class="booking-state-banner cancelled" role="status"><Ban size={18} aria-hidden="true" /><span><strong>Kostenfrei zurückgetreten</strong>Der Vertrag wurde innerhalb der Lösungsfrist beendet.</span></div>
			{:else if hackathon.status === 'completed'}
				<div class="booking-state-banner" role="status"><Check size={18} aria-hidden="true" /><span><strong>Durchgeführt</strong>Der Hackathon wurde abgeschlossen.</span></div>
			{/if}

			<MiniContactCards {locale} />
			<div class="success-actions">
				<SharePlanButton getUrl={getDetailUrl} label={locale === 'en' ? 'Share hackathon' : 'Hackathon teilen'} {locale} />
				<a class="button-primary action-button" href={`/api/hackathons/${hackathon.id}/plan.pdf`}>
					<Download size={18} aria-hidden="true" />{locale === 'en' ? 'Download plan' : 'Plan herunterladen'}
				</a>
				{#if !readOnly}
					<a class="button-secondary action-button" href={`/api/hackathons/${hackathon.id}/prep-call.ics`}>
						<CalendarPlus size={18} aria-hidden="true" />{locale === 'en' ? 'Add calendar event' : 'Kalenderereignis hinzufügen'}
					</a>
					<button class="button-secondary action-button" type="button" onclick={resendConfirmationEmail} disabled={confirmationEmailState === 'loading'} aria-live="polite">
						{#if confirmationEmailState === 'sent'}
							<Check size={18} aria-hidden="true" />{locale === 'en' ? 'Confirmation email sent' : 'Bestätigungs-E-Mail gesendet'}
						{:else}
							<Mail size={18} aria-hidden="true" />{locale === 'en' ? (confirmationEmailState === 'loading' ? 'Sending email …' : confirmationEmailState === 'error' ? 'Try sending again' : 'Send confirmation email') : (confirmationEmailState === 'loading' ? 'E-Mail wird gesendet …' : confirmationEmailState === 'error' ? 'Senden erneut versuchen' : 'Bestätigungs-E-Mail senden')}
						{/if}
					</button>
				{/if}
			</div>

			{#if data.admin.authorized}
				<div class="admin-detail-actions" aria-label="Admin-Aktionen">
					{#if hackathon.status === 'prep_scheduled'}
						<div class="contract-admin-form">
							<div class="field"><label for="agreement-customer">Zustimmende Person Kunde</label><input id="agreement-customer" bind:value={agreementCustomerName} /></div>
							<div class="field"><label for="agreement-organizer">Zustimmende Person ALL IN AGI</label><input id="agreement-organizer" bind:value={agreementOrganizerName} /></div>
							{#if !billingComplete}<p class="admin-action-message">Vor der Zustimmung müssen die Rechnungsdaten vollständig hinterlegt werden.</p>{/if}
							<button class="button-primary action-button" type="button" onclick={recordAgreement} disabled={contractBusy || !billingComplete}>Beiderseitige Zustimmung und B2B-Vertretungsbefugnis dokumentieren</button>
						</div>
					{:else if hackathon.status === 'exit_window'}
						<button class="button-secondary action-button" type="button" onclick={() => withdrawDuringExitWindow('customer')} disabled={contractBusy}>Rücktritt Kunde erfassen</button>
						<button class="button-secondary action-button" type="button" onclick={() => withdrawDuringExitWindow('organizer')} disabled={contractBusy}>Rücktritt ALL IN AGI erfassen</button>
					{:else if hackathon.status === 'contracted' && hackathon.eventEnd && new Date() >= new Date(hackathon.eventEnd)}
						<button class="button-secondary action-button" type="button" onclick={completeContract} disabled={contractBusy}>Durchführung abschließen</button>
					{/if}
					{#if invoiceIssued || (invoiceEligible && finalInvoiceAvailable)}
						<button class="button-secondary action-button" type="button" onclick={downloadInvoice} disabled={invoiceDownloadState === 'loading'}>
							<Download size={18} aria-hidden="true" />{invoiceDownloadState === 'loading' ? 'Rechnung wird erstellt …' : invoiceDownloadState === 'error' ? 'Download erneut versuchen' : splitBilling ? 'Endrechnung herunterladen' : 'Rechnung herunterladen'}
						</button>
					{/if}
					{#if invoiceEligible && finalInvoiceAvailable}
						<button class="button-secondary action-button" type="button" onclick={sendInvoice} disabled={invoiceEmailState === 'loading'} aria-live="polite">
							{#if invoiceEmailState === 'sent'}
								<Check size={18} aria-hidden="true" />{splitBilling ? 'Endrechnung erneut senden' : 'Rechnung erneut senden'}
							{:else}
								<Mail size={18} aria-hidden="true" />{invoiceEmailState === 'loading' ? 'Rechnung wird gesendet …' : invoiceEmailState === 'error' ? 'Senden erneut versuchen' : invoiceEmailSentAt ? (splitBilling ? 'Endrechnung erneut senden' : 'Rechnung erneut senden') : (splitBilling ? 'Endrechnung senden' : 'Rechnung senden')}
							{/if}
						</button>
					{/if}
					{#if splitBilling && (invoiceEligible || downPaymentIssued)}
						<button class="button-secondary action-button" type="button" onclick={downloadDownPaymentInvoice} disabled={downPaymentDownloadState === 'loading'}>
							<Download size={18} aria-hidden="true" />{downPaymentDownloadState === 'loading' ? 'Anzahlungsrechnung wird erstellt …' : downPaymentDownloadState === 'error' ? 'Download erneut versuchen' : 'Anzahlungsrechnung herunterladen'}
						</button>
					{/if}
					{#if splitBilling && invoiceEligible}
						<button class="button-secondary action-button" type="button" onclick={sendDownPaymentInvoice} disabled={downPaymentEmailState === 'loading'} aria-live="polite">
							<Mail size={18} aria-hidden="true" />{downPaymentEmailState === 'loading' ? 'Anzahlungsrechnung wird gesendet …' : downPaymentEmailState === 'error' ? 'Senden erneut versuchen' : downPaymentEmailSentAt ? 'Anzahlungsrechnung erneut senden' : 'Anzahlungsrechnung senden'}
						</button>
						{#if downPaymentIssued}
							<button class="button-secondary action-button" type="button" onclick={markDownPaymentReceived} disabled={downPaymentPaidBusy || Boolean(downPaymentPaidAt)}>
								<Check size={18} aria-hidden="true" />{downPaymentPaidAt ? 'Zahlung eingegangen' : downPaymentPaidBusy ? 'Wird gespeichert …' : 'Zahlung eingegangen'}
							</button>
						{/if}
						{#if downPaymentPaidAt && !finalInvoiceAvailable}<p class="admin-action-message">Endrechnung nach dem Hackathon verfügbar.</p>{/if}
					{/if}
					{#if cancellableContract && hackathon.eventStart && hackathon.eventEnd}
						<a class="button-secondary action-button" href={`/${hackathon.id}/timer`} target="_blank" rel="noopener">
							<ExternalLink size={18} aria-hidden="true" />Timer
						</a>
						<AlertDialog.Root bind:open={cancelDialogOpen}>
							<AlertDialog.Trigger class="button-primary action-button"><Ban size={18} aria-hidden="true" />Cancel booking</AlertDialog.Trigger>
							<AlertDialog.Portal>
								<AlertDialog.Overlay class="confirmation-overlay" />
								<AlertDialog.Content class="confirmation-dialog">
									<div class="confirmation-dialog-icon"><Ban size={24} aria-hidden="true" /></div>
									<AlertDialog.Title>Booking wirklich stornieren?</AlertDialog.Title>
									<AlertDialog.Description>Der Hackathontag und der Prep Call werden bei Cal.com storniert. Anschließend erhält {hackathon.contactName} eine Stornierungs-E-Mail.</AlertDialog.Description>
									<div class="confirmation-dialog-actions">
										<AlertDialog.Cancel class="button-secondary">Abbrechen</AlertDialog.Cancel>
										<AlertDialog.Action class="button-primary" onclick={cancelBooking}>Buchung stornieren</AlertDialog.Action>
									</div>
								</AlertDialog.Content>
							</AlertDialog.Portal>
						</AlertDialog.Root>
					{:else if cancellableContract}
						<p class="admin-action-message">{locale === 'en' ? 'Set the hackathon date before using the timer or cancelling this contracted booking.' : 'Legen Sie vor Timer-Nutzung oder Stornierung dieser vertraglichen Buchung den Hackathon-Termin fest.'}</p>
					{:else if ['requested', 'prep_scheduled', 'cancellation_pending', 'cancelled'].includes(hackathon.status) && !hackathon.cancellationEmailSentAt}
						<button class="button-primary action-button" type="button" onclick={cancelBooking} disabled={cancellationBusy}>
							<RotateCcw size={18} aria-hidden="true" />{cancellationBusy ? 'Wird bearbeitet …' : hackathon.status === 'cancelled' ? 'E-Mail erneut senden' : hackathon.status === 'cancellation_pending' ? 'Stornierung fortsetzen' : 'Buchung stornieren'}
						</button>
					{/if}
					{#if invoiceMessage}<p class="admin-action-message" role="status">{invoiceMessage}</p>{/if}
					{#if contractMessage}<p class="admin-action-message" role="status">{contractMessage}</p>{/if}
					{#if cancellationMessage}<p class="admin-action-message" role="status">{cancellationMessage}</p>{/if}
				</div>
			{/if}

			<div class="summary-box overview-box detail-overview">
				<EditableSummaryRow icon={Building2} label="Unternehmen" value={hackathon.companyName} status="Gespeichert" active={activeSection === 'company'} {saving} error={activeSection === 'company' ? editError : ''} onedit={() => openEditor('company')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}<div class="field"><label for="detail-company">Unternehmen</label><input id="detail-company" autocomplete="organization" value={draft.companyName} oninput={(event) => (draft = { ...draft, companyName: event.currentTarget.value })} /></div>{/snippet}
				</EditableSummaryRow>
				<EditableSummaryRow icon={Contact} label="Kontakt" value={`${hackathon.contactName} · ${hackathon.email} · ${hackathon.phone}`} status="Gespeichert" active={activeSection === 'contact'} {saving} error={activeSection === 'contact' ? editError : ''} onedit={() => openEditor('contact')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}<ContactFields companyName={draft.companyName} contactName={draft.contactName} email={draft.email} phone={draft.phone} showCompany={false} idPrefix="detail-contact" {locale} onchange={(patch) => (draft = { ...draft, ...patch })} />{/snippet}
				</EditableSummaryRow>
				<EditableSummaryRow icon={ReceiptEuro} label="Rechnungsdaten" value={hackathon.billing ? `${hackathon.billing.companyName}${hackathon.billing.legalForm ? ` ${hackathon.billing.legalForm}` : ''} · ${hackathon.billing.email}` : 'Noch nicht hinterlegt'} status={billingComplete ? 'Vollständig' : 'Vor Vertragsschluss erforderlich'} active={activeSection === 'billing'} {saving} error={activeSection === 'billing' ? editError : ''} onedit={() => openEditor('billing')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}
						<div class="field-grid billing-fields">
							<div class="field"><label for="detail-billing-company">Firma</label><input id="detail-billing-company" autocomplete="organization" value={draft.billing!.companyName} oninput={(event) => updateDraftBilling({ companyName: event.currentTarget.value })} /></div>
							<div class="field"><label for="detail-billing-legal-form">Rechtsform <small>(optional)</small></label><input id="detail-billing-legal-form" placeholder="z. B. GmbH" value={draft.billing!.legalForm} oninput={(event) => updateDraftBilling({ legalForm: event.currentTarget.value })} /></div>
							<div class="field"><label for="detail-billing-contact">Rechnungskontakt</label><input id="detail-billing-contact" autocomplete="name" value={draft.billing!.contactName} oninput={(event) => updateDraftBilling({ contactName: event.currentTarget.value })} /></div>
							<div class="field"><label for="detail-billing-email">Rechnungs-E-Mail</label><input id="detail-billing-email" type="email" autocomplete="email" value={draft.billing!.email} oninput={(event) => updateDraftBilling({ email: event.currentTarget.value })} /></div>
							<div class="field full"><label for="detail-billing-street">Straße und Hausnummer</label><input id="detail-billing-street" autocomplete="billing street-address" value={draft.billing!.address.street} oninput={(event) => updateDraftBillingAddress({ street: event.currentTarget.value })} /></div>
							<div class="field"><label for="detail-billing-postal">Postleitzahl</label><input id="detail-billing-postal" autocomplete="billing postal-code" value={draft.billing!.address.postalCode} oninput={(event) => updateDraftBillingAddress({ postalCode: event.currentTarget.value })} /></div>
							<div class="field"><label for="detail-billing-city">Ort</label><input id="detail-billing-city" autocomplete="billing address-level2" value={draft.billing!.address.city} oninput={(event) => updateDraftBillingAddress({ city: event.currentTarget.value })} /></div>
							<div class="field"><label for="detail-billing-vat">USt-IdNr. <small>(optional)</small></label><input id="detail-billing-vat" value={draft.billing!.vatId} oninput={(event) => updateDraftBilling({ vatId: event.currentTarget.value })} /></div>
							<div class="field"><label for="detail-billing-po">Bestellnummer <small>(optional)</small></label><input id="detail-billing-po" value={draft.billing!.purchaseOrder} oninput={(event) => updateDraftBilling({ purchaseOrder: event.currentTarget.value })} /></div>
						</div>
					{/snippet}
				</EditableSummaryRow>
				<EditableSummaryRow icon={MessageSquareText} label="Ihre Nachricht" value={hackathon.message || 'Keine Nachricht hinterlegt'} status={hackathon.message ? 'Vorhanden' : 'Optional'} active={activeSection === 'message'} {saving} error={activeSection === 'message' ? editError : ''} onedit={() => openEditor('message')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}<MessageField value={draft.message} onchange={(message) => (draft = { ...draft, message })} id="detail-message" {locale} />{/snippet}
				</EditableSummaryRow>
				<EditableSummaryRow icon={Users} label={overviewRow('team').label} value={overviewRow('team').value} status={overviewRow('team').status} active={activeSection === 'capacity'} {saving} error={activeSection === 'capacity' ? editError : ''} onedit={() => openEditor('capacity')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}<ConfigOptionCards kind="capacity" values={draftOptions} onchange={updateDraftOptions} idPrefix="detail-capacity" {locale} />{/snippet}
				</EditableSummaryRow>
				{#if standardOffer}
					<EditableSummaryRow icon={MapPin} label="Veranstaltungsort" value="Räume des Kunden" status="Vorausgesetzt" />
				{:else}
					<EditableSummaryRow icon={MapPin} label={overviewRow('location').label} value={overviewRow('location').value} status={overviewRow('location').status} active={activeSection === 'venue'} {saving} error={activeSection === 'venue' ? editError : ''} onedit={() => openEditor('venue')} onsave={saveEditor} oncancel={cancelEditor}>
						{#snippet editor()}<ConfigOptionCards kind="venue" values={draftOptions} onchange={updateDraftOptions} idPrefix="detail-venue" {locale} />{/snippet}
					</EditableSummaryRow>
				{/if}
				<EditableSummaryRow icon={MapPinned} label={hackathon.venueProvided ? 'Veranstaltungsadresse' : 'Gewünschtes Suchgebiet'} value={eventAddressLabel} status={hackathon.venueProvided ? 'Geplant' : 'Location wird bestätigt'} active={activeSection === 'address'} {saving} error={activeSection === 'address' ? editError : ''} onedit={() => openEditor('address')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}<AddressEditor value={draft.address} onchange={(address) => (draft = { ...draft, address })} idPrefix="detail-address" searchArea={!draft.venueProvided} {locale} />{/snippet}
				</EditableSummaryRow>
				<EditableSummaryRow icon={Code2} label={overviewRow('tools').label} value={overviewRow('tools').value} status={overviewRow('tools').status} active={activeSection === 'tools'} {saving} error={activeSection === 'tools' ? editError : ''} onedit={() => openEditor('tools')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}<ConfigOptionCards kind="tools" values={draftOptions} onchange={updateDraftOptions} idPrefix="detail-tools" {locale} />{/snippet}
				</EditableSummaryRow>
				{#if standardOffer}
					<EditableSummaryRow icon={Laptop} label="Devices" value="Kundengeräte mit Administratorrechten" status="Vorausgesetzt" />
				{:else}
					<EditableSummaryRow icon={Laptop} label={overviewRow('devices').label} value={overviewRow('devices').value} status={overviewRow('devices').status} active={activeSection === 'devices'} {saving} error={activeSection === 'devices' ? editError : ''} onedit={() => openEditor('devices')} onsave={saveEditor} oncancel={cancelEditor}>
						{#snippet editor()}<ConfigOptionCards kind="devices" values={draftOptions} onchange={updateDraftOptions} idPrefix="detail-devices" {locale} />{/snippet}
					</EditableSummaryRow>
				{/if}
				<EditableSummaryRow icon={Monitor} label={overviewRow('equipment').label} value={overviewRow('equipment').value} status={overviewRow('equipment').status} active={activeSection === 'equipment'} {saving} error={activeSection === 'equipment' ? editError : ''} onedit={() => openEditor('equipment')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}<ConfigOptionCards kind="equipment" values={draftOptions} onchange={updateDraftOptions} idPrefix="detail-equipment" {locale} />{/snippet}
				</EditableSummaryRow>
				<EditableSummaryRow icon={CalendarDays} label={overviewRow('event-date').label} value={overviewRow('event-date').value} status={overviewRow('event-date').status} active={activeSection === 'event-time'} saving={saving || eventSlotsLoading} error={activeSection === 'event-time' ? editError : ''} onedit={() => openEditor('event-time')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}{#key eventAvailabilityKey}<EventDateTimeEditor eventStart={draft.eventStart} eventEnd={draft.eventEnd} minValue={minEventDate} maxValue={maxEventDate} hackathonId={hackathon.id} {locale} onloadingchange={(value) => (eventSlotsLoading = value)} onchange={(value) => (draft = { ...draft, ...value })} />{/key}{/snippet}
				</EditableSummaryRow>
				<EditableSummaryRow icon={Clock3} label={overviewRow('prep-call').label} value={overviewRow('prep-call').value} status={overviewRow('prep-call').status} active={activeSection === 'prep-call'} {saving} error={activeSection === 'prep-call' ? editError : ''} onedit={() => openEditor('prep-call')} onsave={saveEditor} oncancel={cancelEditor}>
					{#snippet editor()}<PrepCallEditor value={draft.consultationSlot} mode={prepCallMode} customDate={customPrepCallDate} {locale} onchange={(consultationSlot) => (draft = { ...draft, consultationSlot })} onmodechange={(value) => (prepCallMode = value)} oncustomdatechange={(value) => (customPrepCallDate = value)} />{/snippet}
				</EditableSummaryRow>
				{#if standardOffer}
					<EditableSummaryRow icon={Pizza} label="Mittagessen" value="Pizza: Margherita, Salami und vegetarische Sorten" status="Inklusive" />
				{:else}
					<EditableSummaryRow icon={Pizza} label={overviewRow('lunch').label} value={overviewRow('lunch').value} status={overviewRow('lunch').status} active={activeSection === 'lunch'} {saving} error={activeSection === 'lunch' ? editError : ''} onedit={() => openEditor('lunch')} onsave={saveEditor} oncancel={cancelEditor}>
						{#snippet editor()}<ConfigOptionCards kind="lunch" values={draftOptions} onchange={updateDraftOptions} idPrefix="detail-lunch" {locale} />{/snippet}
					</EditableSummaryRow>
				{/if}
				<EditableSummaryRow icon={Award} label={overviewRow('winner-poster').label} value={overviewRow('winner-poster').value} status={overviewRow('winner-poster').status} />
				<EditableSummaryRow icon={Camera} label={overviewRow('event-photos').label} value={overviewRow('event-photos').value} status={overviewRow('event-photos').status} />
				<EditableSummaryRow icon={Cookie} label={overviewRow('snacks').label} value={overviewRow('snacks').value} status={overviewRow('snacks').status} />
				<EditableSummaryRow icon={Plane} label={overviewRow('travel').label} value={overviewRow('travel').value} status={overviewRow('travel').status} />
				<EditableSummaryRow icon={ReceiptEuro} label={overviewRow('total').label} value={overviewRow('total').value} status={overviewRow('total').status} total />
			</div>
		</section>
	</div>
</div>
