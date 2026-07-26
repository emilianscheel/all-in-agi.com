<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { formatPrice } from '$lib/booking';
	import { animate } from 'motion';
	import { Download, KeyRound, LogIn } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let email = $state('');
	let password = $state('');
	let accountExists = $state(false);
	let showPassword = $state(false);
	let busy = $state(false);
	let errorMessage = $state('');

	function formatDate(value: string) {
		return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' }).format(new Date(value));
	}

	function statusLabel(status: string) {
		if (status === 'confirmed') return 'Bestätigt';
		if (status === 'cancellation_pending') return 'Stornierung offen';
		return 'Storniert';
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
			await invalidateAll();
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
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head><title>Dashboard — ALL IN AGI</title></svelte:head>

{#if data.admin.authorized && data.summary}
	<div class="dashboard-page">
		<header class="dashboard-heading">
			<div>
				<p class="eyebrow">Admin</p>
				<h1>Buchungen</h1>
				<p>Alle bestätigten und stornierten Hackathons an einem Ort.</p>
			</div>
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
				<h2 id="booking-list-title">Alle Buchungen</h2>
				<span>{data.bookings.length} Einträge</span>
			</div>
			{#if data.bookings.length}
				<div class="dashboard-table-wrap">
					<table class="dashboard-table">
						<thead><tr><th>Status</th><th>Hackathon</th><th>Termin</th><th>Team</th><th>Netto</th><th>Gebucht</th></tr></thead>
						<tbody>
							{#each data.bookings as booking}
								<tr>
									<td><span class={`booking-status ${booking.status}`}>{statusLabel(booking.status)}</span></td>
									<td><a class="booking-primary-link" href={`/${booking.id}`}><strong>{booking.companyName}</strong><small>{booking.id} · {booking.contactName}</small></a></td>
									<td>{formatDate(booking.eventStart)}</td>
									<td>Bis {booking.capacity}</td>
									<td>{formatPrice(booking.totalPrice)}</td>
									<td>{formatDate(booking.createdAt)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<p class="dashboard-empty">Noch keine Kundenbuchungen vorhanden.</p>
			{/if}
		</section>
	</div>
{:else}
	<div class="dashboard-login-page">
		<section class="dashboard-login-card" aria-label="Admin-Anmeldung">
			{#if data.admin.needsPasskey}
				<p class="eyebrow">Einrichtung abschließen</p>
				<h1>Passkey erstellen</h1>
				<p>Schützen Sie das Dashboard jetzt mit einem Passkey. Erst danach werden Buchungsdaten freigeschaltet.</p>
				<button class="button-primary dashboard-login-button" type="button" onclick={registerPasskey} disabled={busy}>
					<KeyRound size={18} aria-hidden="true" /> {busy ? 'Passkey wird erstellt …' : 'Passkey erstellen'}
				</button>
			{:else}
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
