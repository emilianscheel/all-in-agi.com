<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { animateContentHeight } from '$lib/animateContentHeight';
	import { CONTACT_EMAIL } from '$lib/contact';
	import { trackEvent } from '$lib/meta-pixel';
	import type { Locale } from '$lib/i18n';

	let {
		locale,
		open = $bindable(false)
	}: {
		locale: Locale;
		open?: boolean;
	} = $props();

	let name = $state('');
	let email = $state('');
	let subject = $state('');
	let message = $state('');
	let busy = $state(false);
	let errorMessage = $state<string | null>(null);
	let sent = $state(false);

	let title = $derived(locale === 'en' ? 'Send a message' : 'Nachricht senden');
	let descriptionLead = $derived(
		locale === 'en'
			? 'Tell us what you need. We reply from '
			: 'Schreiben Sie uns, worum es geht. Wir antworten von '
	);

	function resetForm() {
		name = '';
		email = '';
		subject = '';
		message = '';
		busy = false;
		errorMessage = null;
		sent = false;
	}

	function onOpenChange(next: boolean) {
		open = next;
		if (!next) {
			queueMicrotask(() => {
				if (!open) resetForm();
			});
		}
	}

	async function onSubmit(event: Event) {
		event.preventDefault();
		if (busy) return;
		busy = true;
		errorMessage = null;

		try {
			const response = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name, email, subject, message, locale })
			});
			const payload = await response.json().catch(() => null);
			if (!response.ok) {
				throw new Error(
					typeof payload?.error === 'string'
						? payload.error
						: locale === 'en'
							? 'Could not send your message. Please try again.'
							: 'Nachricht konnte nicht gesendet werden. Bitte erneut versuchen.'
				);
			}
			trackEvent('Lead', { content_name: 'contact' });
			sent = true;
		} catch (error) {
			errorMessage =
				error instanceof Error
					? error.message
					: locale === 'en'
						? 'Something went wrong.'
						: 'Etwas ist schiefgelaufen.';
		} finally {
			busy = false;
		}
	}
</script>

<Dialog.Root {open} onOpenChange={onOpenChange}>
	<Dialog.Portal>
		<Dialog.Overlay class="confirmation-overlay" />
		<Dialog.Content class="confirmation-dialog agreement-dialog contact-form-dialog">
			<div class="contact-form-dialog-inner" use:animateContentHeight>
				<div class="contact-form-dialog-body">
					{#if sent}
						<Dialog.Title
							>{locale === 'en' ? 'Message sent' : 'Nachricht gesendet'}</Dialog.Title
						>
						<Dialog.Description>
							{locale === 'en'
								? 'Thanks — we will get back to you soon.'
								: 'Danke — wir melden uns in Kürze.'}
						</Dialog.Description>
						<div class="confirmation-dialog-actions">
							<Dialog.Close class="button-primary"
								>{locale === 'en' ? 'Done' : 'Fertig'}</Dialog.Close
							>
						</div>
					{:else}
						<Dialog.Title>{title}</Dialog.Title>
						<Dialog.Description>
							{descriptionLead}<a class="contact-form-mail" href="mailto:{CONTACT_EMAIL}"
								>{CONTACT_EMAIL}</a
							>.
						</Dialog.Description>
						<form class="agreement-dialog-fields contact-form-fields" onsubmit={onSubmit}>
							<div class="field">
								<label for="contact-form-name">{locale === 'en' ? 'Name' : 'Name'}</label>
								<input
									id="contact-form-name"
									bind:value={name}
									required
									maxlength="120"
									autocomplete="name"
								/>
							</div>
							<div class="field">
								<label for="contact-form-email">E-Mail</label>
								<input
									id="contact-form-email"
									type="email"
									bind:value={email}
									required
									maxlength="254"
									autocomplete="email"
								/>
							</div>
							<div class="field">
								<label for="contact-form-subject"
									>{locale === 'en' ? 'Subject' : 'Betreff'}</label
								>
								<input
									id="contact-form-subject"
									bind:value={subject}
									required
									maxlength="200"
									autocomplete="off"
								/>
							</div>
							<div class="field">
								<label for="contact-form-message"
									>{locale === 'en' ? 'Message' : 'Nachricht'}</label
								>
								<textarea
									id="contact-form-message"
									bind:value={message}
									required
									maxlength="5000"
									rows="5"
								></textarea>
							</div>
							{#if errorMessage}
								<p class="dashboard-login-error" role="alert">{errorMessage}</p>
							{/if}
							<div class="confirmation-dialog-actions">
								<Dialog.Close class="button-secondary" type="button"
									>{locale === 'en' ? 'Cancel' : 'Abbrechen'}</Dialog.Close
								>
								<button class="button-primary" type="submit" disabled={busy}>
									{busy
										? locale === 'en'
											? 'Sending …'
											: 'Wird gesendet …'
										: locale === 'en'
											? 'Send message'
											: 'Nachricht senden'}
								</button>
							</div>
						</form>
					{/if}
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
