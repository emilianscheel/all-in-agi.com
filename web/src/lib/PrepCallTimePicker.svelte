<script lang="ts">
	import { Clock } from 'lucide-svelte';
	import { formatPrepCallTime } from '$lib/prep-call';

	let {
		date = '',
		slots = [],
		value = '',
		onchange
	}: {
		date?: string;
		slots?: string[];
		value?: string;
		onchange: (value: string) => void;
	} = $props();
</script>

<div class="prep-time-picker">
	<div class="prep-time-heading"><Clock size={19} strokeWidth={2} aria-hidden="true" /><h3>Uhrzeit</h3></div>
	{#if !date}
		<p>Wählen Sie zuerst einen verfügbaren Tag.</p>
	{:else if slots.length === 0}
		<p>Für diesen Tag sind keine freien Zeiten verfügbar.</p>
	{:else}
		<div class="prep-time-options" aria-label="Verfügbare Uhrzeiten">
			{#each slots as slot}
				<button type="button" class:selected={value === slot} aria-pressed={value === slot} onclick={() => onchange(slot)}>
					{formatPrepCallTime(slot)} Uhr
				</button>
			{/each}
		</div>
	{/if}
</div>
