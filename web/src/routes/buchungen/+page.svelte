<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import BookingsDataTable from '$lib/components/admin/bookings-data-table.svelte';
	import type { BookingTableRow } from '$lib/components/admin/booking-types';
	import { formatPrice } from '$lib/booking';
	import { localizedPath, type Locale } from '$lib/i18n';
	import { AlertDialog } from 'bits-ui';
	import { Ban, Download } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let locale = $derived((data.locale ?? 'de') as Locale);
	let cancellationTarget = $state<BookingTableRow | null>(null);
	let cancellationBusyId = $state<string | null>(null);
	let cancellationMessage = $state('');
	let cancelDialogOpen = $state(false);

	function openDetails(id: string) {
		window.open(`/${id}`, '_blank', 'noopener,noreferrer');
	}

	function openTimer(id: string) {
		window.open(`/${id}/timer`, '_blank', 'noopener,noreferrer');
	}

	function openClock() {
		window.open('/clock', '_blank', 'noopener,noreferrer');
	}

	function confirmCancellation(booking: BookingTableRow) {
		cancellationTarget = booking;
		cancellationMessage = '';
		cancelDialogOpen = true;
	}

	async function cancelBooking(booking: BookingTableRow | null) {
		if (!booking || cancellationBusyId) return;
		cancellationBusyId = booking.id;
		cancellationMessage = '';
		try {
			const response = await fetch(`/api/hackathons/${booking.id}/cancel`, { method: 'POST' });
			const result = await response.json();
			if (!response.ok && response.status !== 202) throw new Error(result.message ?? 'Die Stornierung konnte nicht gestartet werden.');
			cancellationMessage = result.complete
				? 'Die Buchung wurde storniert und der Kunde benachrichtigt.'
				: result.message ?? 'Die Stornierung ist noch nicht vollständig. Bitte versuchen Sie es erneut.';
			cancelDialogOpen = false;
			cancellationTarget = null;
			await invalidateAll();
		} catch (error) {
			cancellationMessage = error instanceof Error ? error.message : 'Die Stornierung konnte nicht gestartet werden.';
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

		<section class="dashboard-stats" aria-label={locale === 'en' ? 'Metrics' : 'Kennzahlen'}>
			<article class="dashboard-stat-card">
				<span>{locale === 'en' ? 'Confirmed bookings' : 'Bestätigte Buchungen'}</span>
				<strong>{data.summary.bookingCount}</strong>
			</article>
			<article class="dashboard-stat-card">
				<span>{locale === 'en' ? 'Booked net revenue' : 'Gebuchter Nettoumsatz'}</span>
				<strong>{formatPrice(data.summary.totalRevenue)}</strong>
			</article>
		</section>

		{#if cancellationMessage}
			<p class="dashboard-action-message" role="status">{cancellationMessage}</p>
		{/if}

		<BookingsDataTable
			bookings={data.bookings}
			{locale}
			{cancellationBusyId}
			onOpenDetails={openDetails}
			onOpenTimer={openTimer}
			onOpenClock={openClock}
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
	</div>
{/if}
