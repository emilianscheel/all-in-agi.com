<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import EventDateCalendar from '$lib/EventDateCalendar.svelte';
	import PrepCallTimePicker from '$lib/PrepCallTimePicker.svelte';
	import { formatDate } from '$lib/booking';
	import type { Locale } from '$lib/i18n';
	import {
		availablePrepCallDates,
		normalizeAvailabilitySlots,
		prepCallDateBounds,
		prepCallSlotsForDate
	} from '$lib/prep-call';

	let {
		value,
		mode,
		customDate,
		onchange,
		onmodechange,
		oncustomdatechange,
		onloadingchange = () => {},
		clearUnavailableValue = false
		,locale = 'de'
	}: {
		value: string;
		mode: 'quick' | 'custom';
		customDate: string;
		onchange: (value: string) => void;
		onmodechange: (value: 'quick' | 'custom') => void;
		oncustomdatechange: (value: string) => void;
		onloadingchange?: (loading: boolean) => void;
		clearUnavailableValue?: boolean;
		locale?: Locale;
	} = $props();

	let slots = $state<string[]>([]);
	let loading = $state(true);
	let loadError = $state('');
	let prepCallDates = $derived(availablePrepCallDates(slots));
	let customSlots = $derived(prepCallSlotsForDate(slots, customDate));
	const { min, max } = prepCallDateBounds();

	async function loadAvailability() {
		loading = true;
		loadError = '';
		onloadingchange(true);
		try {
			const start = new Date().toISOString().slice(0, 10);
			const endDate = new Date();
			endDate.setDate(endDate.getDate() + 45);
			const response = await fetch(`/api/availability?start=${start}&end=${endDate.toISOString().slice(0, 10)}&tz=Europe/Berlin`);
			const result = await response.json();
			if (!response.ok) throw new Error(result.message ?? 'Verfügbarkeit konnte nicht geladen werden.');
			slots = normalizeAvailabilitySlots(Array.isArray(result.slots) ? result.slots : []);
			if (clearUnavailableValue && value && !slots.includes(value)) onchange('');
			if (customDate && !availablePrepCallDates(slots).includes(customDate)) oncustomdatechange('');
		} catch (error) {
			slots = [];
			loadError = error instanceof Error ? error.message : 'Verfügbarkeit konnte nicht geladen werden.';
		} finally {
			loading = false;
			onloadingchange(false);
		}
	}

	function selectQuickSlot(slot: string) {
		onmodechange('quick');
		oncustomdatechange('');
		onchange(slot);
	}

	function selectCustomMode() {
		if (mode === 'custom') return;
		onmodechange('custom');
		onchange('');
	}

	function selectCustomDate(date: string) {
		oncustomdatechange(date);
		onchange('');
	}

	onMount(loadAvailability);
</script>

{#if loading}
	<p class="slot-status">{locale === 'en' ? 'Loading available times …' : 'Freie Termine werden geladen …'}</p>
{:else if slots.length === 0}
	<p class="slot-status">{loadError || (locale === 'en' ? 'No times are currently available. Please try again later.' : 'Aktuell sind keine Termine verfügbar. Bitte versuchen Sie es später erneut.')}</p>
	<button class="button-secondary" type="button" onclick={loadAvailability}>{locale === 'en' ? 'Reload' : 'Neu laden'}</button>
{:else}
	<div class="slots">
		{#each slots.slice(0, 15) as slot}
			<button type="button" class:selected={mode === 'quick' && value === slot} class="slot" aria-pressed={mode === 'quick' && value === slot} onclick={() => selectQuickSlot(slot)}>{formatDate(slot, true, locale)}{locale === 'de' ? ' Uhr' : ''}</button>
		{/each}
		<button type="button" class:selected={mode === 'custom'} class="slot custom-slot" aria-pressed={mode === 'custom'} onclick={selectCustomMode}>Custom</button>
	</div>
	{#if mode === 'custom'}
		<div class="custom-prep-call" transition:slide={{ duration: 320 }}>
			<EventDateCalendar
				value={customDate}
				minValue={min}
				maxValue={max}
				availableDates={prepCallDates}
				calendarLabel={locale === 'en' ? 'Preparation call date' : 'Datum für den Prep Call'}
				emptyText={locale === 'en' ? 'Please select an available day.' : 'Bitte wählen Sie einen verfügbaren Tag.'}
				onchange={selectCustomDate}
			/>
			{#if customDate}<div transition:slide={{ duration: 280 }}><PrepCallTimePicker date={customDate} slots={customSlots} {value} onchange={(slot) => onchange(slot)} /></div>{/if}
		</div>
	{/if}
{/if}
