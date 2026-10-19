<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { formatPrice } from '$lib/booking';
	import { localizedPath, type Locale } from '$lib/i18n';
	import { animate } from 'motion';
	import { LogIn } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let locale = $derived((data.locale ?? 'de') as Locale);
	let email = $state('');
	let password = $state('');
	let accountExists = $state(false);
	let showPassword = $state(false);
	let busy = $state(false);
	let errorMessage = $state('');

	onMount(() => {
		if (data.admin.needsPasskey) void registerPasskey();
	});

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

	async function submitPassword(event: SubmitEvent) {
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
			<h1>Dashboard</h1>
		</header>

		<section class="dashboard-stats dashboard-stats-wide" aria-label={locale === 'en' ? 'Metrics' : 'Kennzahlen'}>
			<article class="dashboard-stat-card">
				<span>{locale === 'en' ? 'Confirmed bookings' : 'Bestätigte Buchungen'}</span>
				<strong>{data.summary.bookingCount}</strong>
			</article>
			<article class="dashboard-stat-card">
				<span>{locale === 'en' ? 'Booked net revenue' : 'Gebuchter Nettoumsatz'}</span>
				<strong>{formatPrice(data.summary.totalRevenue)}</strong>
			</article>
			<article class="dashboard-stat-card">
				<span>{locale === 'en' ? 'Users' : 'Benutzer'}</span>
				<strong>{data.summary.userCount}</strong>
			</article>
			<article class="dashboard-stat-card">
				<span>{locale === 'en' ? 'Passkey ready' : 'Passkey bereit'}</span>
				<strong>{data.summary.passkeyReadyCount}</strong>
			</article>
		</section>

		<section class="dashboard-list-card dashboard-overview-links" aria-label={locale === 'en' ? 'Quick links' : 'Schnellzugriff'}>
			<div class="dashboard-list-heading">
				<div>
					<h2>{locale === 'en' ? 'Go to' : 'Weiter zu'}</h2>
				</div>
			</div>
			<div class="dashboard-overview-actions">
				<a class="button-secondary dashboard-export" href={localizedPath(locale, '/buchungen')}>
					{locale === 'en' ? 'Bookings' : 'Buchungen'}
				</a>
				<a class="button-secondary dashboard-export" href={localizedPath(locale, '/user')}>Users</a>
			</div>
		</section>
	</div>
{:else}
	<div class="dashboard-login-page">
		<section class="dashboard-login-card" aria-label="Admin-Anmeldung">
			{#if !data.admin.needsPasskey}
				<form onsubmit={showPassword ? submitPassword : continueWithEmail}>
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
