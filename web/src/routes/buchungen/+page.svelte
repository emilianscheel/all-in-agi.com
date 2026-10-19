<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import BookingsDataTable from '$lib/components/admin/bookings-data-table.svelte';
	import type { BookingTableRow } from '$lib/components/admin/booking-types';
	import { effectiveBillingDetails, formatPrice, validateBillingDetails } from '$lib/booking';
	import { localizedPath, type Locale } from '$lib/i18n';
	import { trackAnalyticsEvent } from '$lib/analytics';
	import { AlertDialog } from 'bits-ui';
	import { Ban, Download } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let locale = $derived((data.locale ?? 'de') as Locale);
	let bookings = $derived(data.bookings as BookingTableRow[]);
	let cancellationTarget = $state<BookingTableRow | null>(null);
	let cancellationBusyId = $state<string | null>(null);
	let confirmationBusyId = $state<string | null>(null);
	let actionMessage = $state('');
	let cancelDialogOpen = $state(false);

	let agreementModalOpen = $state(false);
	let agreementModalMode = $state<'record' | 'test'>('record');
	let agreementTarget = $state<BookingTableRow | null>(null);
	let agreementCustomerName = $state('');
	let agreementOrganizerName = $state('');
	let contractBusy = $state(false);
	let seedName = $derived(data.seedAdminName || 'ALL IN AGI Admin');

	let agreementBillingComplete = $derived(
		agreementTarget ? validateBillingDetails(effectiveBillingDetails({
			billing: agreementTarget.billing,
			companyName: agreementTarget.companyName,
			contactName: agreementTarget.contactName,
			contactEmail: agreementTarget.contactEmail,
			address: agreementTarget.address
		}), locale).length === 0 : false
	);

	function openDetails(id: string) {
		window.open(`/${id}`, '_blank', 'noopener,noreferrer');
	}

	function openTimer(id: string) {
		window.open(`/${id}/timer`, '_blank', 'noopener,noreferrer');
	}

	function openClock() {
		window.open('/clock', '_blank', 'noopener,noreferrer');
	}

	async function shareBooking(booking: BookingTableRow) {
		actionMessage = '';
		try {
			const url = `${window.location.origin}/${booking.id}`;
			if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
			else {
				const textarea = document.createElement('textarea');
				textarea.value = url;
				textarea.style.position = 'fixed';
				textarea.style.opacity = '0';
				document.body.append(textarea);
				textarea.select();
				document.execCommand('copy');
				textarea.remove();
			}
			trackAnalyticsEvent('booking_plan_shared');
			actionMessage = locale === 'en' ? 'Plan link copied.' : 'Plan-Link kopiert.';
		} catch {
			actionMessage = locale === 'en' ? 'Copy failed.' : 'Kopieren fehlgeschlagen.';
		}
	}

	function downloadPlan(booking: BookingTableRow) {
		window.location.href = `/api/hackathons/${booking.id}/plan.pdf`;
	}

	function addCalendar(booking: BookingTableRow) {
		window.location.href = `/api/hackathons/${booking.id}/prep-call.ics`;
	}

	async function sendConfirmation(booking: BookingTableRow) {
		if (confirmationBusyId) return;
		confirmationBusyId = booking.id;
		actionMessage = '';
		try {
			const response = await fetch(`/api/hackathons/${booking.id}/confirmation-email`, { method: 'POST' });
			if (!response.ok) throw new Error(locale === 'en' ? 'The confirmation email could not be sent.' : 'Die Bestätigungs-E-Mail konnte nicht gesendet werden.');
			actionMessage = locale === 'en' ? 'Confirmation email sent.' : 'Bestätigungs-E-Mail gesendet.';
		} catch (error) {
			actionMessage = error instanceof Error ? error.message : (locale === 'en' ? 'The confirmation email could not be sent.' : 'Die Bestätigungs-E-Mail konnte nicht gesendet werden.');
		} finally {
			confirmationBusyId = null;
		}
	}

	function openAgreementModal(booking: BookingTableRow, mode: 'record' | 'test') {
		agreementTarget = booking;
		agreementModalMode = mode;
		agreementCustomerName = booking.contactName;
		agreementOrganizerName = seedName;
		actionMessage = '';
		agreementModalOpen = true;
	}

	async function submitAgreementModal() {
		if (!agreementTarget || contractBusy) return;
		if (agreementModalMode === 'record' && !agreementBillingComplete) return;
		contractBusy = true;
		actionMessage = '';
		try {
			const endpoint =
				agreementModalMode === 'test'
					? `/api/hackathons/${agreementTarget.id}/contract-email-test`
					: `/api/hackathons/${agreementTarget.id}/contract-agreement`;
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					customerName: agreementCustomerName,
					organizerName: agreementOrganizerName
				})
			});
			const result = await response.json().catch(() => ({}));
			if (!response.ok && response.status !== 202) {
				throw new Error(
					result.message ??
						(agreementModalMode === 'test'
							? locale === 'en'
								? 'The test contract email could not be sent.'
								: 'Die Test-Vertrags-E-Mail konnte nicht gesendet werden.'
							: locale === 'en'
								? 'The agreement could not be saved.'
								: 'Die Zustimmung konnte nicht gespeichert werden.')
				);
			}
			if (agreementModalMode === 'test') {
				actionMessage =
					locale === 'en'
						? 'Test contract email sent to go@all-in-agi.com.'
						: 'Test-Vertrags-E-Mail an go@all-in-agi.com gesendet.';
			} else {
				actionMessage = result.emailSent
					? locale === 'en'
						? 'Agreement saved and contract confirmation sent.'
						: 'Zustimmung gespeichert und Vertragsbestätigung versandt.'
					: result.message ??
						(locale === 'en' ? 'Agreement saved.' : 'Zustimmung gespeichert.');
				await invalidateAll();
			}
			agreementModalOpen = false;
			agreementTarget = null;
		} catch (error) {
			actionMessage =
				error instanceof Error
					? error.message
					: locale === 'en'
						? 'The action could not be completed.'
						: 'Die Aktion konnte nicht abgeschlossen werden.';
		} finally {
			contractBusy = false;
		}
	}

	function confirmCancellation(booking: BookingTableRow) {
		cancellationTarget = booking;
		actionMessage = '';
		cancelDialogOpen = true;
	}

	async function cancelBooking(booking: BookingTableRow | null) {
		if (!booking || cancellationBusyId) return;
		cancellationBusyId = booking.id;
		actionMessage = '';
		try {
			const response = await fetch(`/api/hackathons/${booking.id}/cancel`, { method: 'POST' });
			const result = await response.json();
			if (!response.ok && response.status !== 202)
				throw new Error(
					result.message ??
						(locale === 'en' ? 'Cancellation could not be started.' : 'Die Stornierung konnte nicht gestartet werden.')
				);
			actionMessage = result.complete
				? locale === 'en'
					? 'The booking was cancelled and the customer notified.'
					: 'Die Buchung wurde storniert und der Kunde benachrichtigt.'
				: result.message ??
					(locale === 'en'
						? 'Cancellation is not complete yet. Please try again.'
						: 'Die Stornierung ist noch nicht vollständig. Bitte versuchen Sie es erneut.');
			cancelDialogOpen = false;
			cancellationTarget = null;
			await invalidateAll();
		} catch (error) {
			actionMessage =
				error instanceof Error
					? error.message
					: locale === 'en'
						? 'Cancellation could not be started.'
						: 'Die Stornierung konnte nicht gestartet werden.';
		} finally {
			cancellationBusyId = null;
		}
	}

	let csvHref = $derived(localizedPath(locale, '/buchungen/bookings.csv'));
	let title = $derived(locale === 'en' ? 'Bookings' : 'Buchungen');
</script>

<svelte:head><title>{title} — ALL IN AGI</title></svelte:head>

{#if data.summary}
	<div class="dashboard-page">
		<header class="dashboard-heading">
			<h1>{title}</h1>
			<a class="button-secondary dashboard-export" href={csvHref}>
				<Download size={17} aria-hidden="true" /> {locale === 'en' ? 'Export CSV' : 'CSV exportieren'}
			</a>
		</header>

		<section class="dashboard-stats dashboard-stats-wide" aria-label={locale === 'en' ? 'Metrics' : 'Kennzahlen'}>
			<article class="dashboard-stat-card">
				<span>{locale === 'en' ? 'Confirmed bookings' : 'Bestätigte Buchungen'}</span>
				<strong>{data.summary.bookingCount}</strong>
			</article>
			<article class="dashboard-stat-card">
				<span>{locale === 'en' ? 'Total net revenue' : 'Gesamter Nettoumsatz'}</span>
				<strong>{formatPrice(data.summary.totalRevenue)}</strong>
			</article>
			<article class="dashboard-stat-card">
				<span>{locale === 'en' ? 'Pipeline net revenue' : 'Pipeline-Nettoumsatz'}</span>
				<strong>{formatPrice(data.summary.pipelineRevenue)}</strong>
			</article>
			<article class="dashboard-stat-card">
				<span>{locale === 'en' ? 'Contracted net revenue' : 'Vertraglicher Nettoumsatz'}</span>
				<strong>{formatPrice(data.summary.contractedRevenue)}</strong>
			</article>
		</section>

		{#if actionMessage}
			<p class="dashboard-action-message" role="status">{actionMessage}</p>
		{/if}

		<BookingsDataTable
			{bookings}
			{locale}
			{cancellationBusyId}
			{confirmationBusyId}
			onOpenDetails={openDetails}
			onOpenTimer={openTimer}
			onOpenClock={openClock}
			onShare={shareBooking}
			onDownloadPlan={downloadPlan}
			onAddCalendar={addCalendar}
			onSendConfirmation={sendConfirmation}
			onOpenAgreementTest={(booking) => openAgreementModal(booking, 'test')}
			onOpenAgreementRecord={(booking) => openAgreementModal(booking, 'record')}
			onConfirmCancellation={confirmCancellation}
			onCancelBooking={cancelBooking}
		/>

		<AlertDialog.Root bind:open={cancelDialogOpen}>
			<AlertDialog.Portal>
				<AlertDialog.Overlay class="confirmation-overlay" />
				<AlertDialog.Content class="confirmation-dialog">
					<div class="confirmation-dialog-icon"><Ban size={24} aria-hidden="true" /></div>
					<AlertDialog.Title>{locale === 'en' ? 'Really cancel booking?' : 'Booking wirklich stornieren?'}</AlertDialog.Title>
					<AlertDialog.Description>{locale === 'en' ? `The hackathon day and preparation call will be cancelled in Cal.com. ${cancellationTarget?.contactName ?? 'The customer'} will then receive a cancellation email.` : `Der Hackathontag und der Preparation Call werden bei Cal.com storniert. Anschließend erhält ${cancellationTarget?.contactName ?? 'der Kunde'} eine Stornierungs-E-Mail.`}</AlertDialog.Description>
					<div class="confirmation-dialog-actions">
						<AlertDialog.Cancel class="button-secondary">{locale === 'en' ? 'Cancel' : 'Abbrechen'}</AlertDialog.Cancel>
						<AlertDialog.Action class="button-primary" onclick={() => cancelBooking(cancellationTarget)} disabled={cancellationBusyId !== null}>{locale === 'en' ? 'Cancel booking' : 'Buchung stornieren'}</AlertDialog.Action>
					</div>
				</AlertDialog.Content>
			</AlertDialog.Portal>
		</AlertDialog.Root>

		<AlertDialog.Root bind:open={agreementModalOpen}>
			<AlertDialog.Portal>
				<AlertDialog.Overlay class="confirmation-overlay" />
				<AlertDialog.Content class="confirmation-dialog agreement-dialog">
					<AlertDialog.Title>
						{agreementModalMode === 'test'
							? locale === 'en'
								? 'Send test contract email'
								: 'Test-Vertrags-E-Mail senden'
							: locale === 'en'
								? 'Document mutual agreement'
								: 'Beiderseitige Zustimmung dokumentieren'}
					</AlertDialog.Title>
					<AlertDialog.Description>
						{agreementModalMode === 'test'
							? locale === 'en'
								? 'The email is only sent to go@all-in-agi.com with a [TEST] subject prefix. The booking status stays unchanged.'
								: 'Die E-Mail wird nur an go@all-in-agi.com mit dem Betreffpräfix [TEST] gesendet. Der Buchungsstatus bleibt unverändert.'
							: locale === 'en'
								? 'Saving closes the contract and sends the contract confirmation to the customer.'
								: 'Nach dem Speichern wird der Vertrag geschlossen und die Vertragsbestätigung an den Kunden gesendet.'}
					</AlertDialog.Description>
					{#if agreementModalMode === 'record' && !agreementBillingComplete}
						<p class="dashboard-action-message" role="status">
							{locale === 'en'
								? 'Billing details must be complete before recording the agreement.'
								: 'Vor der Zustimmung müssen die Rechnungsdaten vollständig hinterlegt werden.'}
						</p>
					{/if}
					<div class="contract-admin-form agreement-dialog-fields">
						<div class="field">
							<label for="bookings-agreement-customer">{locale === 'en' ? 'Agreeing person (customer)' : 'Zustimmende Person Kunde'}</label>
							<input id="bookings-agreement-customer" bind:value={agreementCustomerName} />
						</div>
						<div class="field">
							<label for="bookings-agreement-organizer">{locale === 'en' ? 'Agreeing person (ALL IN AGI)' : 'Zustimmende Person ALL IN AGI'}</label>
							<input id="bookings-agreement-organizer" bind:value={agreementOrganizerName} />
						</div>
					</div>
					<div class="confirmation-dialog-actions">
						<AlertDialog.Cancel class="button-secondary">{locale === 'en' ? 'Cancel' : 'Abbrechen'}</AlertDialog.Cancel>
						<button
							class="button-primary"
							type="button"
							onclick={submitAgreementModal}
							disabled={contractBusy ||
								!agreementCustomerName.trim() ||
								!agreementOrganizerName.trim() ||
								(agreementModalMode === 'record' && !agreementBillingComplete)}
						>
							{#if agreementModalMode === 'test'}
								{contractBusy
									? locale === 'en'
										? 'Sending …'
										: 'Wird gesendet …'
									: locale === 'en'
										? 'Send test'
										: 'Test senden'}
							{:else}
								{contractBusy
									? locale === 'en'
										? 'Saving …'
										: 'Wird gespeichert …'
									: locale === 'en'
										? 'Save agreement'
										: 'Zustimmung speichern'}
							{/if}
						</button>
					</div>
				</AlertDialog.Content>
			</AlertDialog.Portal>
		</AlertDialog.Root>
	</div>
{/if}
