<script lang="ts">
	import { onDestroy } from 'svelte';
	import EventDateCalendar from '$lib/EventDateCalendar.svelte';
	import {
		formatHackathonDuration,
		formatHackathonSlotTime,
		hackathonAvailableDates,
		hackathonEndSlots,
		hackathonStartSlots,
		normalizeHackathonSlots,
		preferredHackathonSlot,
		type HackathonAvailabilityResponse
	} from '$lib/hackathon-availability';
	import { berlinInputsFromIso } from '$lib/event-time';

	let {
		eventStart = '',
		eventEnd = '',
		minValue,
		maxValue,
		hackathonId,
		onloadingchange = () => {},
		onchange
	}: {
		eventStart?: string;
		eventEnd?: string;
		minValue: string;
		maxValue: string;
		hackathonId?: string;
		onloadingchange?: (loading: boolean) => void;
		onchange: (value: { eventStart: string; eventEnd: string }) => void;
	} = $props();

	let startParts = $derived(berlinInputsFromIso(eventStart));
	let selectedDate = $state('');
	let slots = $state<ReturnType<typeof normalizeHackathonSlots>>([]);
	let availableDates = $derived(hackathonAvailableDates(slots));
	let startOptions = $derived(hackathonStartSlots(slots, selectedDate));
	let endOptions = $derived(hackathonEndSlots(slots, eventStart));
	let loading = $state(true);
	let loadError = $state('');
	let currentMonth = $state('');
	let abortController: AbortController | undefined;
	const monthCache = new Map<string, HackathonAvailabilityResponse>();

	$effect(() => {
		if (startParts.date) selectedDate = startParts.date;
	});

	function monthRange(month: string) {
		const [year, monthNumber] = month.split('-').map(Number);
		const first = new Date(Date.UTC(year, monthNumber - 1, 1));
		const last = new Date(Date.UTC(year, monthNumber, 0));
		first.setUTCDate(first.getUTCDate() - 7);
		last.setUTCDate(last.getUTCDate() + 7);
		return { start: first.toISOString().slice(0, 10), end: last.toISOString().slice(0, 10) };
	}

	function applyAvailability(result: HackathonAvailabilityResponse, month: string) {
		slots = normalizeHackathonSlots(Array.isArray(result.slots) ? result.slots : []);
		if (!selectedDate) return;
		const range = monthRange(month);
		if (selectedDate < range.start || selectedDate > range.end) return;
		if (!availableDates.includes(selectedDate)) {
			if (eventStart || eventEnd) onchange({ eventStart: '', eventEnd: '' });
			return;
		}
		const preferred = preferredHackathonSlot(slots, selectedDate, eventStart, eventEnd);
		if (preferred && (preferred.start !== eventStart || preferred.end !== eventEnd)) {
			onchange({ eventStart: preferred.start, eventEnd: preferred.end });
		}
	}

	async function loadAvailability(month = currentMonth, force = false) {
		if (!month) return;
		currentMonth = month;
		abortController?.abort();
		const cached = !force && monthCache.get(month);
		if (cached) {
			loading = false;
			onloadingchange(false);
			return applyAvailability(cached, month);
		}
		const controller = new AbortController();
		abortController = controller;
		loading = true;
		loadError = '';
		onloadingchange(true);
		const { start, end } = monthRange(month);
		const params = new URLSearchParams({ start, end });
		if (hackathonId) params.set('hackathonId', hackathonId);
		try {
			const response = await fetch(`/api/hackathon-availability?${params}`, { signal: controller.signal, cache: 'no-store' });
			const result = await response.json();
			if (!response.ok) throw new Error(result.message ?? 'Die Hackathon-Verfügbarkeit konnte nicht geladen werden.');
			const normalized = { ...result, slots: normalizeHackathonSlots(Array.isArray(result.slots) ? result.slots : []) } as HackathonAvailabilityResponse;
			monthCache.set(month, normalized);
			applyAvailability(normalized, month);
		} catch (error) {
			if ((error as Error).name === 'AbortError') return;
			slots = [];
			loadError = error instanceof Error ? error.message : 'Die Hackathon-Verfügbarkeit konnte nicht geladen werden.';
		} finally {
			if (!controller.signal.aborted) {
				loading = false;
				onloadingchange(false);
			}
		}
	}

	function selectDate(date: string) {
		selectedDate = date;
		if (!date) return onchange({ eventStart: '', eventEnd: '' });
		const preferred = preferredHackathonSlot(slots, date, eventStart, eventEnd);
		onchange(preferred
			? { eventStart: preferred.start, eventEnd: preferred.end }
			: { eventStart: '', eventEnd: '' });
	}

	function selectStart(start: string) {
		const options = hackathonEndSlots(slots, start);
		const currentDuration = (new Date(eventEnd).getTime() - new Date(eventStart).getTime()) / 60_000;
		const selected = options.find((slot) => slot.duration === currentDuration)
			?? [...options].sort((a, b) => b.duration - a.duration)[0];
		if (selected) onchange({ eventStart: selected.start, eventEnd: selected.end });
	}

	function selectEnd(end: string) {
		const selected = endOptions.find((slot) => slot.end === end);
		if (selected) onchange({ eventStart: selected.start, eventEnd: selected.end });
	}

	onDestroy(() => abortController?.abort());
</script>

<div class="event-date-time-editor">
	<EventDateCalendar
		value={selectedDate || startParts.date}
		{minValue}
		{maxValue}
		{availableDates}
		calendarLabel="Datum für den Hackathon"
		emptyText="Bitte wählen Sie den Hackathontag."
		onmonthchange={loadAvailability}
		onchange={selectDate}
	/>
	{#if loading}
		<p class="slot-status" aria-live="polite">Freie Hackathon-Termine werden geladen …</p>
	{:else if loadError}
		<p class="slot-status" role="alert">{loadError}</p>
		<button class="button-secondary" type="button" onclick={() => loadAvailability(currentMonth, true)}>Neu laden</button>
	{:else if availableDates.length === 0}
		<p class="slot-status">In diesem Zeitraum sind keine Hackathon-Termine verfügbar.</p>
	{:else if selectedDate}
		<div class="event-time-fields">
			<div class="field">
				<label for="event-start-time">Start</label>
				<select id="event-start-time" value={eventStart} onchange={(event) => selectStart(event.currentTarget.value)}>
					{#each startOptions as slot}<option value={slot.start}>{formatHackathonSlotTime(slot.start)} Uhr</option>{/each}
				</select>
			</div>
			<div class="field">
				<label for="event-end-time">Ende</label>
				<select id="event-end-time" value={eventEnd} onchange={(event) => selectEnd(event.currentTarget.value)}>
					{#each endOptions as slot}<option value={slot.end}>{formatHackathonSlotTime(slot.end)} Uhr ({formatHackathonDuration(slot.duration)})</option>{/each}
				</select>
			</div>
		</div>
	{/if}
</div>
