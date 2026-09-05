<script lang="ts">
	import { Calendar } from 'bits-ui';
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { parseDate } from '@internationalized/date';
	import { onMount } from 'svelte';

	let {
		value = '',
		minValue,
		maxValue,
		availableDates,
		calendarLabel = 'Wunschtermin für den Hackathon',
		emptyText = 'Bitte wählen Sie einen Wunschtermin.',
		onmonthchange,
		onchange
	}: {
		value?: string;
		minValue: string;
		maxValue: string;
		availableDates?: string[];
		calendarLabel?: string;
		emptyText?: string;
		onmonthchange?: (month: string) => void;
		onchange: (value: string) => void;
	} = $props();

	let calendarValue = $derived(value ? parseDate(value) : undefined);
	let minimum = $derived(parseDate(minValue));
	let maximum = $derived(parseDate(maxValue));
	let years = $derived(Array.from({ length: maximum.year - minimum.year + 1 }, (_, index) => minimum.year + index));
	let availableDateSet = $derived(availableDates ? new Set(availableDates) : undefined);
	let reportedMonth = '';

	function reportMonth(value: { year: number; month: number }) {
		const month = `${value.year}-${String(value.month).padStart(2, '0')}`;
		if (month === reportedMonth) return;
		reportedMonth = month;
		onmonthchange?.(month);
	}

	onMount(() => reportMonth(calendarValue ?? minimum));
</script>

<div class="event-date-picker">
	<Calendar.Root
		class="event-calendar"
		type="single"
		value={calendarValue}
		onValueChange={(nextValue) => onchange(nextValue?.toString() ?? '')}
		placeholder={calendarValue ?? minimum}
		onPlaceholderChange={reportMonth}
		minValue={minimum}
		maxValue={maximum}
		locale="de-DE"
		weekStartsOn={1}
		weekdayFormat="short"
		fixedWeeks
		{calendarLabel}
		isDateDisabled={(date) => availableDateSet ? !availableDateSet.has(date.toString()) : false}
	>
		{#snippet children({ months, weekdays })}
			<Calendar.Header class="calendar-header">
				<div class="calendar-selects">
					<Calendar.MonthSelect aria-label="Monat auswählen" />
					<Calendar.YearSelect {years} aria-label="Jahr auswählen" />
				</div>
				<div class="calendar-navigation">
					<Calendar.PrevButton aria-label="Vorheriger Monat"><ChevronLeft size={25} strokeWidth={2.2} aria-hidden="true" /></Calendar.PrevButton>
					<Calendar.NextButton aria-label="Nächster Monat"><ChevronRight size={25} strokeWidth={2.2} aria-hidden="true" /></Calendar.NextButton>
				</div>
			</Calendar.Header>
			{#each months as month}
				<Calendar.Grid class="calendar-grid">
					<Calendar.GridHead>
						<Calendar.GridRow>
							{#each weekdays as weekday}
								<Calendar.HeadCell>{weekday.slice(0, 2)}</Calendar.HeadCell>
							{/each}
						</Calendar.GridRow>
					</Calendar.GridHead>
					<Calendar.GridBody>
						{#each month.weeks as weekDates}
							<Calendar.GridRow>
								{#each weekDates as date}
									<Calendar.Cell {date} month={month.value}>
										<Calendar.Day>{date.day}</Calendar.Day>
									</Calendar.Cell>
								{/each}
							</Calendar.GridRow>
						{/each}
					</Calendar.GridBody>
				</Calendar.Grid>
			{/each}
		{/snippet}
	</Calendar.Root>
	{#if value || emptyText}
		<p class="calendar-selection" aria-live="polite">
			{value ? `Ausgewählt: ${new Intl.DateTimeFormat('de-DE', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`))}` : emptyText}
		</p>
	{/if}
</div>
