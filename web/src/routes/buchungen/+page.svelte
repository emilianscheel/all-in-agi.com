<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { formatPrice } from '$lib/booking';
	import { localizedPath, type Locale } from '$lib/i18n';
	import { AlertDialog, DropdownMenu } from 'bits-ui';
	import { Ban, Clock, Download, Ellipsis, ExternalLink, Eye, RotateCcw } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let locale = $derived((data.locale ?? 'de') as Locale);
	let cancellationTarget = $state<PageData['bookings'][number] | null>(null);
	let cancellationBusyId = $state<string | null>(null);
	let cancellationMessage = $state('');
	let cancelDialogOpen = $state(false);

	function formatDate(value: string | null) {
		if (!value) return locale === 'en' ? 'Set later' : 'Später festlegen';
		return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de-DE', {
			dateStyle: 'medium',
			timeStyle: 'short',
			timeZone: 'Europe/Berlin'
		}).format(new Date(value));
	}

	function statusLabel(status: string) {
		if (status === 'requested') return locale === 'en' ? 'Requested' : 'Angefragt';
		if (status === 'prep_scheduled') return 'Preparation Call geplant';
		if (status === 'exit_window') return locale === 'en' ? 'Exit window' : 'Lösungsfrist';
		if (status === 'contracted' || status === 'confirmed') return locale === 'en' ? 'Contracted' : 'Vertraglich';
		if (status === 'completed') return locale === 'en' ? 'Completed' : 'Durchgeführt';
		if (status === 'withdrawn') return locale === 'en' ? 'Withdrawn' : 'Zurückgetreten';
		if (status === 'declined') return locale === 'en' ? 'Declined' : 'Abgelehnt';
		if (status === 'cancellation_pending') return locale === 'en' ? 'Cancellation pending' : 'Stornierung offen';
		return locale === 'en' ? 'Cancelled' : 'Storniert';
	}

	function openDetails(id: string) {
		window.open(`/${id}`, '_blank', 'noopener,noreferrer');
	}

	function openTimer(id: string) {
		window.open(`/${id}/timer`, '_blank', 'noopener,noreferrer');
	}

	function openClock() {
		window.open('/clock', '_blank', 'noopener,noreferrer');
	}

	function confirmCancellation(booking: PageData['bookings'][number]) {
		cancellationTarget = booking;
		cancellationMessage = '';
		cancelDialogOpen = true;
	}

	async function cancelBooking(booking: PageData['bookings'][number] | null) {
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

		<section class="dashboard-list-card" aria-labelledby="booking-list-title">
			<div class="dashboard-list-heading">
				<div>
					<h2 id="booking-list-title">{locale === 'en' ? 'All bookings' : 'Alle Buchungen'}</h2>
					{#if cancellationMessage}<p class="dashboard-action-message" role="status">{cancellationMessage}</p>{/if}
				</div>
				<span>{data.bookings.length} {locale === 'en' ? 'entries' : 'Einträge'}</span>
			</div>
			{#if data.bookings.length}
				<div class="dashboard-table-wrap">
					<table class="dashboard-table">
						<thead>
							<tr>
								<th>{locale === 'en' ? 'Status' : 'Status'}</th>
								<th>Hackathon</th>
								<th>{locale === 'en' ? 'Event' : 'Termin'}</th>
								<th>Team</th>
								<th>{locale === 'en' ? 'Net' : 'Netto'}</th>
								<th>{locale === 'en' ? 'Requested on' : 'Angefragt am'}</th>
								<th><span class="visually-hidden">{locale === 'en' ? 'Actions' : 'Aktionen'}</span></th>
							</tr>
						</thead>
						<tbody>
							{#each data.bookings as booking}
								<tr>
									<td><span class={`booking-status ${booking.status}`}>{statusLabel(booking.status)}</span></td>
									<td>
										<a class="booking-primary-link" href={`/${booking.id}`} target="_blank" rel="noopener noreferrer">
											<strong>{booking.companyName}</strong>
											<small>{booking.id} · {booking.contactName}</small>
											<small>{booking.contactEmail}</small>
										</a>
									</td>
									<td>{formatDate(booking.eventStart)}</td>
									<td>{locale === 'en' ? `Up to ${booking.capacity}` : `Bis ${booking.capacity}`}</td>
									<td>{formatPrice(booking.totalPrice)}</td>
									<td>{formatDate(booking.createdAt)}</td>
									<td class="dashboard-actions-cell">
										<DropdownMenu.Root>
											<DropdownMenu.Trigger class="dashboard-action-trigger" aria-label={`${locale === 'en' ? 'Actions for' : 'Aktionen für'} ${booking.companyName}`}>
												<Ellipsis size={19} aria-hidden="true" />
											</DropdownMenu.Trigger>
											<DropdownMenu.Portal>
												<DropdownMenu.Content class="dashboard-actions-menu" sideOffset={6} align="end" loop>
													<DropdownMenu.Item class="dashboard-actions-item" onSelect={() => openDetails(booking.id)}>
														<Eye size={16} aria-hidden="true" />{locale === 'en' ? 'Open details' : 'Details öffnen'}
													</DropdownMenu.Item>
													{#if booking.status === 'contracted' || booking.status === 'confirmed'}
														{#if booking.eventStart && booking.eventEnd}
															<DropdownMenu.Item class="dashboard-actions-item" onSelect={() => openTimer(booking.id)}>
																<ExternalLink size={16} aria-hidden="true" />{locale === 'en' ? 'Open timer' : 'Timer öffnen'}
															</DropdownMenu.Item>
														{/if}
														<DropdownMenu.Item class="dashboard-actions-item" onSelect={openClock}>
															<Clock size={16} aria-hidden="true" />{locale === 'en' ? 'Open clock' : 'Clock öffnen'}
														</DropdownMenu.Item>
														{#if booking.eventStart && booking.eventEnd}
															<DropdownMenu.Separator class="dashboard-actions-separator" />
															<DropdownMenu.Item class="dashboard-actions-item" onSelect={() => confirmCancellation(booking)} disabled={cancellationBusyId !== null}>
																<Ban size={16} aria-hidden="true" />{locale === 'en' ? 'Cancel booking' : 'Buchung stornieren'}
															</DropdownMenu.Item>
														{/if}
													{:else if ['requested', 'prep_scheduled', 'cancellation_pending', 'cancelled'].includes(booking.status) && !booking.cancellationEmailSentAt}
														<DropdownMenu.Separator class="dashboard-actions-separator" />
														<DropdownMenu.Item class="dashboard-actions-item" onSelect={() => cancelBooking(booking)} disabled={cancellationBusyId !== null}>
															<RotateCcw size={16} aria-hidden="true" />{cancellationBusyId === booking.id ? (locale === 'en' ? 'Working …' : 'Wird bearbeitet …') : booking.status === 'cancelled' ? (locale === 'en' ? 'Resend email' : 'E-Mail erneut senden') : booking.status === 'cancellation_pending' ? (locale === 'en' ? 'Continue cancellation' : 'Stornierung fortsetzen') : (locale === 'en' ? 'Cancel booking' : 'Buchung stornieren')}
														</DropdownMenu.Item>
													{/if}
												</DropdownMenu.Content>
											</DropdownMenu.Portal>
										</DropdownMenu.Root>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<p class="dashboard-empty">{locale === 'en' ? 'No customer bookings yet.' : 'Noch keine Kundenbuchungen vorhanden.'}</p>
			{/if}
		</section>

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
