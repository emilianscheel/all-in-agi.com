<script lang="ts">
	import EventDateCalendar from '$lib/EventDateCalendar.svelte';
	import {
		EVENT_START_TIME_OPTIONS,
		berlinDateTimeToIso,
		berlinInputsFromIso,
		eventEndTimeOptions,
		eventTimesForDate
	} from '$lib/event-time';

	let {
		eventStart = '',
		eventEnd = '',
		minValue,
		maxValue,
		onchange
	}: {
		eventStart?: string;
		eventEnd?: string;
		minValue: string;
		maxValue: string;
		onchange: (value: { eventStart: string; eventEnd: string }) => void;
	} = $props();

	let startParts = $derived(berlinInputsFromIso(eventStart));
	let endParts = $derived(berlinInputsFromIso(eventEnd));
	let endTimeOptions = $derived(eventEndTimeOptions(startParts.time));

	function selectDate(date: string) {
		if (!date) return onchange({ eventStart: '', eventEnd: '' });
		onchange(eventTimesForDate(date, startParts.time || undefined, endParts.time || undefined));
	}

	function selectStart(time: string) {
		if (!startParts.date) return;
		const validEndTimes = eventEndTimeOptions(time);
		const endTime = validEndTimes.includes(endParts.time) ? endParts.time : validEndTimes[0];
		if (!endTime) return;
		onchange({
			eventStart: berlinDateTimeToIso(startParts.date, time),
			eventEnd: berlinDateTimeToIso(startParts.date, endTime)
		});
	}

	function selectEnd(time: string) {
		if (!startParts.date) return;
		onchange({ eventStart, eventEnd: berlinDateTimeToIso(startParts.date, time) });
	}
</script>

<div class="event-date-time-editor">
	<EventDateCalendar
		value={startParts.date}
		{minValue}
		{maxValue}
		calendarLabel="Datum für den Hackathon"
		emptyText="Bitte wählen Sie den Hackathontag."
		onchange={selectDate}
	/>
	{#if startParts.date}
		<div class="event-time-fields">
			<div class="field">
				<label for="event-start-time">Start</label>
				<select id="event-start-time" value={startParts.time} onchange={(event) => selectStart(event.currentTarget.value)}>
					{#each EVENT_START_TIME_OPTIONS as time}<option value={time}>{time} Uhr</option>{/each}
				</select>
			</div>
			<div class="field">
				<label for="event-end-time">Ende</label>
				<select id="event-end-time" value={endParts.time} onchange={(event) => selectEnd(event.currentTarget.value)}>
					{#each endTimeOptions as time}<option value={time}>{time} Uhr</option>{/each}
				</select>
			</div>
		</div>
	{/if}
</div>
