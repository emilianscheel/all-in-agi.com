<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { AlertDialog, Dialog, DropdownMenu } from 'bits-ui';
	import { Copy, Ellipsis, Plus, Trash2, UserRound } from 'lucide-svelte';
	import type { Locale } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let locale = $derived((data.locale ?? 'de') as Locale);
	let title = $derived(locale === 'en' ? 'Users' : 'Nutzer');
	let createOpen = $state(false);
	let name = $state('');
	let email = $state('');
	let busy = $state(false);
	let errorMessage = $state('');
	let createdPassword = $state<string | null>(null);
	let copyState = $state<'idle' | 'copied'>('idle');
	let deleteTarget = $state<PageData['users'][number] | null>(null);
	let deleteDialogOpen = $state(false);
	let deleteBusyId = $state<string | null>(null);
	let actionMessage = $state('');

	function formatDate(value: string | Date) {
		return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de-DE', {
			dateStyle: 'medium',
			timeStyle: 'short',
			timeZone: 'Europe/Berlin'
		}).format(new Date(value));
	}

	function openCreate() {
		name = '';
		email = '';
		errorMessage = '';
		createdPassword = null;
		copyState = 'idle';
		createOpen = true;
	}

	function confirmDelete(adminUser: PageData['users'][number]) {
		deleteTarget = adminUser;
		actionMessage = '';
		deleteDialogOpen = true;
	}

	async function createUser(event: SubmitEvent) {
		event.preventDefault();
		if (busy) return;
		busy = true;
		errorMessage = '';
		try {
			const response = await fetch('/api/admin/users', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name, email })
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.message ?? (locale === 'en' ? 'The user could not be created.' : 'Der Benutzer konnte nicht erstellt werden.'));
			createdPassword = result.initialPassword;
			await invalidateAll();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : (locale === 'en' ? 'The user could not be created.' : 'Der Benutzer konnte nicht erstellt werden.');
		} finally {
			busy = false;
		}
	}

	async function deleteUser(adminUser: PageData['users'][number] | null) {
		if (!adminUser || deleteBusyId) return;
		deleteBusyId = adminUser.id;
		actionMessage = '';
		try {
			const response = await fetch(`/api/admin/users/${adminUser.id}`, { method: 'DELETE' });
			const result = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(result.message ?? (locale === 'en' ? 'The user could not be deleted.' : 'Der Benutzer konnte nicht gelöscht werden.'));
			deleteDialogOpen = false;
			deleteTarget = null;
			actionMessage = locale === 'en' ? 'User deleted.' : 'Benutzer gelöscht.';
			await invalidateAll();
		} catch (error) {
			actionMessage = error instanceof Error ? error.message : (locale === 'en' ? 'The user could not be deleted.' : 'Der Benutzer konnte nicht gelöscht werden.');
		} finally {
			deleteBusyId = null;
		}
	}

	async function copyPassword() {
		if (!createdPassword) return;
		await navigator.clipboard.writeText(createdPassword);
		copyState = 'copied';
		setTimeout(() => (copyState = 'idle'), 1800);
	}
</script>

<svelte:head><title>{title} — ALL IN AGI</title></svelte:head>

<div class="dashboard-page">
	<header class="dashboard-heading">
		<h1>{title}</h1>
		<button class="button-secondary dashboard-export" type="button" onclick={openCreate}>
			<Plus size={17} aria-hidden="true" /> {locale === 'en' ? 'Create user' : 'Nutzer anlegen'}
		</button>
	</header>

	<section class="dashboard-stats" aria-label={locale === 'en' ? 'Metrics' : 'Kennzahlen'}>
		<article class="dashboard-stat-card">
			<span>{title}</span>
			<strong>{data.summary.userCount}</strong>
		</article>
		<article class="dashboard-stat-card">
			<span>{locale === 'en' ? 'Passkey ready' : 'Passkey bereit'}</span>
			<strong>{data.summary.passkeyReadyCount}</strong>
		</article>
	</section>

	<section class="dashboard-list-card" aria-labelledby="user-list-title">
		<div class="dashboard-list-heading">
			<div>
				<h2 id="user-list-title">{locale === 'en' ? 'All users' : 'Alle Nutzer'}</h2>
				{#if actionMessage}<p class="dashboard-action-message" role="status">{actionMessage}</p>{/if}
			</div>
			<span>{data.users.length} {locale === 'en' ? 'entries' : 'Einträge'}</span>
		</div>
		{#if data.users.length}
			<div class="dashboard-table-wrap">
				<table class="dashboard-table">
					<thead>
						<tr>
							<th>Name</th>
							<th>E-Mail</th>
							<th>Passkey</th>
							<th>{locale === 'en' ? 'Created' : 'Erstellt'}</th>
							<th><span class="visually-hidden">{locale === 'en' ? 'Actions' : 'Aktionen'}</span></th>
						</tr>
					</thead>
					<tbody>
						{#each data.users as adminUser}
							<tr>
								<td>
									<div class="booking-primary-link">
										<strong>{adminUser.name}</strong>
										<small>{adminUser.id}</small>
									</div>
								</td>
								<td>{adminUser.email}</td>
								<td>
									<span class={`booking-status ${adminUser.hasPasskey ? '' : 'prep_scheduled'}`}>
										{adminUser.hasPasskey ? (locale === 'en' ? 'Ready' : 'Bereit') : (locale === 'en' ? 'Pending' : 'Ausstehend')}
									</span>
								</td>
								<td>{formatDate(adminUser.createdAt)}</td>
								<td class="dashboard-actions-cell">
									<DropdownMenu.Root>
										<DropdownMenu.Trigger class="dashboard-action-trigger" aria-label={`${locale === 'en' ? 'Actions for' : 'Aktionen für'} ${adminUser.name}`}>
											<Ellipsis size={19} aria-hidden="true" />
										</DropdownMenu.Trigger>
										<DropdownMenu.Portal>
											<DropdownMenu.Content class="dashboard-actions-menu" sideOffset={6} align="end" loop>
												<DropdownMenu.Item
													class="dashboard-actions-item"
													onSelect={() => confirmDelete(adminUser)}
													disabled={deleteBusyId !== null || adminUser.id === data.currentUserId || data.users.length <= 1}
												>
													<Trash2 size={16} aria-hidden="true" />{locale === 'en' ? 'Delete user' : 'Nutzer löschen'}
												</DropdownMenu.Item>
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
			<p class="dashboard-empty">{locale === 'en' ? 'No users yet.' : 'Noch keine Nutzer vorhanden.'}</p>
		{/if}
	</section>

	<AlertDialog.Root bind:open={deleteDialogOpen}>
		<AlertDialog.Portal>
			<AlertDialog.Overlay class="confirmation-overlay" />
			<AlertDialog.Content class="confirmation-dialog">
				<div class="confirmation-dialog-icon"><Trash2 size={24} aria-hidden="true" /></div>
				<AlertDialog.Title>{locale === 'en' ? 'Delete user?' : 'Nutzer löschen?'}</AlertDialog.Title>
				<AlertDialog.Description>
					{locale === 'en'
						? `${deleteTarget?.name ?? 'This user'} (${deleteTarget?.email ?? ''}) will be permanently removed and can no longer sign in.`
						: `${deleteTarget?.name ?? 'Dieser Nutzer'} (${deleteTarget?.email ?? ''}) wird dauerhaft entfernt und kann sich nicht mehr anmelden.`}
				</AlertDialog.Description>
				<div class="confirmation-dialog-actions">
					<AlertDialog.Cancel class="button-secondary">{locale === 'en' ? 'Cancel' : 'Abbrechen'}</AlertDialog.Cancel>
					<AlertDialog.Action class="button-primary" onclick={() => deleteUser(deleteTarget)} disabled={deleteBusyId !== null}>
						{deleteBusyId ? (locale === 'en' ? 'Deleting …' : 'Wird gelöscht …') : (locale === 'en' ? 'Delete user' : 'Nutzer löschen')}
					</AlertDialog.Action>
				</div>
			</AlertDialog.Content>
		</AlertDialog.Portal>
	</AlertDialog.Root>
</div>

<Dialog.Root bind:open={createOpen}>
	<Dialog.Portal>
		<Dialog.Overlay class="confirmation-overlay" />
		<Dialog.Content class="confirmation-dialog agreement-dialog">
			{#if createdPassword}
				<div class="confirmation-dialog-icon" style="background: var(--surface); color: var(--ink);">
					<UserRound size={24} aria-hidden="true" />
				</div>
				<Dialog.Title>{locale === 'en' ? 'User created' : 'Nutzer erstellt'}</Dialog.Title>
				<Dialog.Description>
					{locale === 'en'
						? 'Share this initial password once. After the first login the user must register a passkey; the password will not be shown again.'
						: 'Teilen Sie dieses Initialpasswort einmalig. Nach dem ersten Login muss der Nutzer einen Passkey registrieren; das Passwort wird nicht erneut angezeigt.'}
				</Dialog.Description>
				<div class="field agreement-dialog-fields" style="display:grid;gap:10px;margin-top:20px;">
					<label for="created-password">{locale === 'en' ? 'Initial password' : 'Initialpasswort'}</label>
					<div style="display:flex;gap:8px;align-items:center;">
						<input id="created-password" readonly value={createdPassword} />
						<button class="button-secondary" type="button" onclick={copyPassword}>
							<Copy size={16} aria-hidden="true" /> {copyState === 'copied' ? (locale === 'en' ? 'Copied' : 'Kopiert') : (locale === 'en' ? 'Copy' : 'Kopieren')}
						</button>
					</div>
				</div>
				<div class="confirmation-dialog-actions">
					<Dialog.Close class="button-primary">{locale === 'en' ? 'Done' : 'Fertig'}</Dialog.Close>
				</div>
			{:else}
				<Dialog.Title>{locale === 'en' ? 'Create user' : 'Nutzer anlegen'}</Dialog.Title>
				<Dialog.Description>
					{locale === 'en'
						? 'The user receives a generated initial password and must register a passkey on first login.'
						: 'Der Nutzer erhält ein generiertes Initialpasswort und muss beim ersten Login einen Passkey registrieren.'}
				</Dialog.Description>
				<form class="agreement-dialog-fields" style="display:grid;gap:14px;" onsubmit={createUser}>
					<div class="field">
						<label for="new-user-name">Name</label>
						<input id="new-user-name" bind:value={name} required autocomplete="name" />
					</div>
					<div class="field">
						<label for="new-user-email">E-Mail</label>
						<input id="new-user-email" type="email" bind:value={email} required autocomplete="email" />
					</div>
					{#if errorMessage}<p class="dashboard-login-error" role="alert">{errorMessage}</p>{/if}
					<div class="confirmation-dialog-actions">
						<Dialog.Close class="button-secondary" type="button">{locale === 'en' ? 'Cancel' : 'Abbrechen'}</Dialog.Close>
						<button class="button-primary" type="submit" disabled={busy}>{busy ? (locale === 'en' ? 'Creating …' : 'Wird erstellt …') : (locale === 'en' ? 'Create user' : 'Nutzer anlegen')}</button>
					</div>
				</form>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
