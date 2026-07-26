<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Buchung verwalten — ALL-IN-AGI</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="manage-page">
	<form class="manage-form" method="POST" aria-labelledby="manage-title">
		<h1 id="manage-title">Buchung verwalten</h1>
		<label for="hackathon-id">Hackathon-ID</label>
		<div class="manage-input-row">
			<input
				id="hackathon-id"
				name="hackathonId"
				value={form?.id ?? ''}
				placeholder="HAA-AAA-AAA"
				pattern="[Hh][A-Za-z0-9]{2}-[A-Za-z0-9]{3}-[A-Za-z0-9]{3}"
				autocomplete="off"
				autocapitalize="characters"
				required
			/>
			<button class="button-primary" type="submit" aria-label="Buchung öffnen"><ArrowRight size={20} aria-hidden="true" /></button>
		</div>
		{#if form?.message}<p class="manage-error" role="alert">{form.message}</p>{/if}
	</form>
</div>
