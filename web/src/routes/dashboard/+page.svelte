<script lang="ts">
	import { onMount } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { formatPrice } from '$lib/booking';
	import { AlertDialog, DropdownMenu } from 'bits-ui';
	import { animate } from 'motion';
	import { Ban, Download, Ellipsis, ExternalLink, Eye, LogIn, RotateCcw } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let email = $state('');
	let password = $state('');
	let accountExists = $state(false);
	let showPassword = $state(false);
	let busy = $state(false);
	let errorMessage = $state('');
	let cancellationTarget = $state<PageData['bookings'][number] | null>(null);
	let cancellationBusyId = $state<string | null>(null);
	let cancellationMessage = $state('');
	let cancelDialogOpen = $state(false);

	onMount(() => {
		if (data.admin.needsPasskey) void registerPasskey();
	});

	function formatDate(value: string) {
		return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' }).format(new Date(value));
	}

	function statusLabel(status: string) {
		if (status === 'requested') return 'Angefragt';
		if (status === 'prep_scheduled') return 'Prep Call geplant';
		if (status === 'exit_window') return 'Lösungsfrist';
		if (status === 'contracted' || status === 'confirmed') return 'Vertraglich';
		if (status === 'completed') return 'Durchgeführt';
		if (status === 'withdrawn') return 'Zurückgetreten';
		if (status === 'declined') return 'Abgelehnt';
		if (status === 'cancellation_pending') return 'Stornierung offen';
		return 'Storniert';
	}

	function openTimer(id: string) {
		window.open(`/${id}/timer`, '_blank', 'noopener,noreferrer');
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

	function expandPassword(node: HTMLElement) {
		queueMicrotask(() => node.querySelector<HTMLInputElement>('input')?.focus());
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const height = node.scrollHeight;
		node.style.overflow = 'hidden';
		const controls = animate(node, { height: [0, height], opacity: [0, 1], y: [-8, 0] }, { duration: .42, ease: [0.22, 1, 0.36, 1] });
		controls.finished.then(() => {
			node.style.height = 'auto';
			node.style.overflow = 'visible';
		});
		return { destroy: () => controls.stop() };
	}

	async function continueWithEmail(event: SubmitEvent) {
		event.preventDefault();
		busy = true;
		errorMessage = '';
		try {
			const response = await fetch('/api/admin/login-state', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email })
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.message ?? 'Die Anmeldung konnte nicht gestartet werden.');
			if (result.method === 'passkey') {
				const signIn = await authClient.signIn.passkey();
				if (signIn.error) throw new Error(signIn.error.message ?? 'Der Passkey konnte nicht bestätigt werden.');
				await invalidateAll();
				return;
			}
			accountExists = Boolean(result.accountExists);
			showPassword = true;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Die Anmeldung konnte nicht gestartet werden.';
		} finally {
			busy = false;
		}
	}

	async function submitSeed(event: SubmitEvent) {
		event.preventDefault();
		busy = true;
		errorMessage = '';
		try {
			const result = accountExists
				? await authClient.signIn.email({ email, password })
				: await authClient.signUp.email({ email, password, name: 'ALL IN AGI Admin' });
			if (result.error) throw new Error(result.error.message ?? 'Die Anmeldedaten sind ungültig.');
			password = '';
			await registerPasskey();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Die Anmeldedaten sind ungültig.';
		} finally {
			busy = false;
		}
	}

	async function registerPasskey() {
		busy = true;
		errorMessage = '';
		try {
			const result = await authClient.passkey.addPasskey({ name: 'Admin Passkey' });
			if (result.error) throw new Error(result.error.message ?? 'Der Passkey konnte nicht erstellt werden.');
			await invalidateAll();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Der Passkey konnte nicht erstellt werden.';
			await authClient.signOut();
			await invalidateAll();
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head><title>Dashboard — ALL IN AGI</title></svelte:head>

{#if data.admin.authorized && data.summary}
	<div class="dashboard-page">
		<header class="dashboard-heading">
			<h1>Buchungen</h1>
			<a class="button-secondary dashboard-export" href="/dashboard/bookings.csv">
				<Download size={17} aria-hidden="true" /> CSV exportieren
			</a>
		</header>

		<section class="dashboard-stats" aria-label="Kennzahlen">
			<article class="dashboard-stat-card">
				<span>Bestätigte Buchungen</span>
				<strong>{data.summary.bookingCount}</strong>
			</article>
			<article class="dashboard-stat-card">
				<span>Gebuchter Nettoumsatz</span>
				<strong>{formatPrice(data.summary.totalRevenue)}</strong>
			</article>
		</section>

		<section class="dashboard-list-card" aria-labelledby="booking-list-title">
			<div class="dashboard-list-heading">
				<div>
					<h2 id="booking-list-title">Alle Buchungen</h2>
					{#if cancellationMessage}<p class="dashboard-action-message" role="status">{cancellationMessage}</p>{/if}
				</div>
				<span>{data.bookings.length} Einträge</span>
			</div>
			{#if data.bookings.length}
				<div class="dashboard-table-wrap">
					<table class="dashboard-table">
						<thead><tr><th>Status</th><th>Hackathon</th><th>Termin</th><th>Team</th><th>Netto</th><th>Gebucht</th><th><span class="visually-hidden">Aktionen</span></th></tr></thead>
						<tbody>
							{#each data.bookings as booking}
								<tr>
									<td><span class={`booking-status ${booking.status}`}>{statusLabel(booking.status)}</span></td>
									<td><a class="booking-primary-link" href={`/${booking.id}`}><strong>{booking.companyName}</strong><small>{booking.id} · {booking.contactName}</small></a></td>
									<td>{formatDate(booking.eventStart)}</td>
									<td>Bis {booking.capacity}</td>
									<td>{formatPrice(booking.totalPrice)}</td>
									<td>{formatDate(booking.createdAt)}</td>
									<td class="dashboard-actions-cell">
										<DropdownMenu.Root>
											<DropdownMenu.Trigger class="dashboard-action-trigger" aria-label={`Aktionen für ${booking.companyName}`}>
												<Ellipsis size={19} aria-hidden="true" />
											</DropdownMenu.Trigger>
											<DropdownMenu.Portal>
												<DropdownMenu.Content class="dashboard-actions-menu" sideOffset={6} align="end" loop>
													<DropdownMenu.Item class="dashboard-actions-item" onSelect={() => goto(`/${booking.id}`)}>
														<Eye size={16} aria-hidden="true" />Details öffnen
													</DropdownMenu.Item>
											{#if booking.status === 'contracted' || booking.status === 'confirmed'}
														<DropdownMenu.Item class="dashboard-actions-item" onSelect={() => openTimer(booking.id)}>
															<ExternalLink size={16} aria-hidden="true" />Timer öffnen
														</DropdownMenu.Item>
														<DropdownMenu.Separator class="dashboard-actions-separator" />
														<DropdownMenu.Item class="dashboard-actions-item" onSelect={() => confirmCancellation(booking)} disabled={cancellationBusyId !== null}>
															<Ban size={16} aria-hidden="true" />Buchung stornieren
														</DropdownMenu.Item>
													{:else if !booking.cancellationEmailSentAt}
														<DropdownMenu.Separator class="dashboard-actions-separator" />
														<DropdownMenu.Item class="dashboard-actions-item" onSelect={() => cancelBooking(booking)} disabled={cancellationBusyId !== null}>
															<RotateCcw size={16} aria-hidden="true" />{cancellationBusyId === booking.id ? 'Wird fortgesetzt …' : booking.status === 'cancelled' ? 'E-Mail erneut senden' : 'Stornierung fortsetzen'}
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
				<p class="dashboard-empty">Noch keine Kundenbuchungen vorhanden.</p>
			{/if}
		</section>

		<AlertDialog.Root bind:open={cancelDialogOpen}>
			<AlertDialog.Portal>
				<AlertDialog.Overlay class="confirmation-overlay" />
				<AlertDialog.Content class="confirmation-dialog">
					<div class="confirmation-dialog-icon"><Ban size={24} aria-hidden="true" /></div>
					<AlertDialog.Title>Booking wirklich stornieren?</AlertDialog.Title>
					<AlertDialog.Description>Der Hackathontag und der Prep Call werden bei Cal.com storniert. Anschließend erhält {cancellationTarget?.contactName ?? 'der Kunde'} eine Stornierungs-E-Mail.</AlertDialog.Description>
					<div class="confirmation-dialog-actions">
						<AlertDialog.Cancel class="button-secondary">Abbrechen</AlertDialog.Cancel>
						<AlertDialog.Action class="button-primary" onclick={() => cancelBooking(cancellationTarget)} disabled={cancellationBusyId !== null}>Buchung stornieren</AlertDialog.Action>
					</div>
				</AlertDialog.Content>
			</AlertDialog.Portal>
		</AlertDialog.Root>
	</div>
{:else}
	<div class="dashboard-login-page">
		<section class="dashboard-login-card" aria-label="Admin-Anmeldung">
			{#if !data.admin.needsPasskey}
				<form onsubmit={showPassword ? submitSeed : continueWithEmail}>
					<div class="field dashboard-login-field">
						<label for="admin-email">E-Mail</label>
						<input id="admin-email" type="email" bind:value={email} autocomplete="username webauthn" required disabled={busy || showPassword} />
					</div>
					{#if showPassword}
						<div class="dashboard-password-reveal" use:expandPassword>
							<div class="field dashboard-login-field">
								<label for="admin-password">Passwort</label>
								<input id="admin-password" type="password" bind:value={password} autocomplete="current-password" minlength="8" required />
							</div>
						</div>
					{/if}
					<button class="button-primary dashboard-login-button" type="submit" disabled={busy}>
						<LogIn size={18} aria-hidden="true" /> {busy ? 'Bitte warten …' : 'Sign in'}
					</button>
				</form>
			{/if}
			{#if errorMessage}<p class="dashboard-login-error" role="alert">{errorMessage}</p>{/if}
		</section>
	</div>
{/if}
