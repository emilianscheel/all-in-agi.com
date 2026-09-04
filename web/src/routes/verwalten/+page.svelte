<script lang="ts">
	import { PinInput } from 'bits-ui';
	import { untrack } from 'svelte';
	import type { ActionData } from './$types';
	import { page } from '$app/state';
	import type { Locale } from '$lib/i18n';

	let { form }: { form: ActionData } = $props();
	let otpValue = $state(untrack(() => (form?.id ?? '').replace(/[^a-z0-9]/gi, '').slice(0, 9)));
	let locale = $derived((page.data.locale ?? 'de') as Locale);
</script>

<svelte:head>
	<title>{locale === 'en' ? 'Manage booking' : 'Buchung verwalten'} — ALL IN AGI</title>
</svelte:head>

<div class="manage-page">
	<form class="manage-form" method="POST" aria-labelledby="manage-title">
		<h1 id="manage-title">{locale === 'en' ? 'Manage booking' : 'Buchung verwalten'}</h1>
		<PinInput.Root
			class="manage-otp"
			bind:value={otpValue}
			maxlength={9}
			pattern="^[a-zA-Z0-9]+$"
			inputmode="text"
			inputId="hackathon-id"
			name="hackathonId"
			aria-label="Hackathon-ID"
			autocomplete="off"
			autocapitalize="characters"
			pasteTransformer={(value) => value.replace(/[^a-z0-9]/gi, '').slice(0, 9)}
		>
			{#snippet children({ cells })}
				<div class="manage-otp-groups" aria-hidden="true">
					{#each [0, 1, 2] as group}
						<div class="manage-otp-group">
							{#each cells.slice(group * 3, group * 3 + 3) as cell}
								<PinInput.Cell {cell} class="manage-otp-cell">
									{cell.char ?? ''}
									{#if cell.hasFakeCaret}<span class="manage-otp-caret"></span>{/if}
								</PinInput.Cell>
							{/each}
						</div>
					{/each}
				</div>
			{/snippet}
		</PinInput.Root>
		<button class="button-primary manage-submit" type="submit">{locale === 'en' ? 'Open booking' : 'Buchung öffnen'}</button>
		{#if form?.message}<p class="manage-error" role="alert">{form.message}</p>{/if}
	</form>
</div>
