import {
	BERLIN_TIME_ZONE,
	DEFAULT_EVENT_END_TIME,
	DEFAULT_EVENT_START_TIME,
	berlinInputsFromIso
} from './event-time';

export interface HackathonAvailabilitySlot {
	start: string;
	end: string;
	duration: number;
}

export interface HackathonAvailabilityResponse {
	durations: number[];
	slots: HackathonAvailabilitySlot[];
	demo: boolean;
}

function validIso(value: unknown): value is string {
	return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
}

export function normalizeHackathonSlots(values: unknown[]) {
	const slots = values.flatMap((value): HackathonAvailabilitySlot[] => {
		if (!value || typeof value !== 'object') return [];
		const candidate = value as Partial<HackathonAvailabilitySlot>;
		if (!validIso(candidate.start) || !validIso(candidate.end) || !Number.isInteger(candidate.duration) || candidate.duration! <= 0) return [];
		const actualDuration = (new Date(candidate.end).getTime() - new Date(candidate.start).getTime()) / 60_000;
		if (actualDuration !== candidate.duration) return [];
		if (berlinInputsFromIso(candidate.start).date !== berlinInputsFromIso(candidate.end).date) return [];
		return [{ start: new Date(candidate.start).toISOString(), end: new Date(candidate.end).toISOString(), duration: candidate.duration }];
	});
	return [...new Map(slots.map((slot) => [`${slot.start}|${slot.end}|${slot.duration}`, slot])).values()]
		.sort((a, b) => a.start.localeCompare(b.start) || b.duration - a.duration);
}

export function hackathonAvailableDates(slots: HackathonAvailabilitySlot[]) {
	return [...new Set(slots.map((slot) => berlinInputsFromIso(slot.start).date).filter(Boolean))];
}

export function hackathonSlotsForDate(slots: HackathonAvailabilitySlot[], date: string) {
	return slots.filter((slot) => berlinInputsFromIso(slot.start).date === date);
}

export function hackathonStartSlots(slots: HackathonAvailabilitySlot[], date: string) {
	return [...new Map(hackathonSlotsForDate(slots, date).map((slot) => [slot.start, slot])).values()]
		.sort((a, b) => a.start.localeCompare(b.start));
}

export function hackathonEndSlots(slots: HackathonAvailabilitySlot[], start: string) {
	return slots.filter((slot) => slot.start === start).sort((a, b) => a.end.localeCompare(b.end));
}

export function preferredHackathonSlot(
	slots: HackathonAvailabilitySlot[],
	date: string,
	currentStart = '',
	currentEnd = ''
) {
	const dateSlots = hackathonSlotsForDate(slots, date);
	const current = dateSlots.find((slot) => slot.start === currentStart && slot.end === currentEnd);
	if (current) return current;
	const preferred = dateSlots.find((slot) => {
		const parts = berlinInputsFromIso(slot.start);
		return parts.time === DEFAULT_EVENT_START_TIME
			&& berlinInputsFromIso(slot.end).time === DEFAULT_EVENT_END_TIME;
	});
	if (preferred) return preferred;
	const firstStart = dateSlots[0]?.start;
	return dateSlots.filter((slot) => slot.start === firstStart).sort((a, b) => b.duration - a.duration)[0];
}

export function formatHackathonSlotTime(value: string) {
	return new Intl.DateTimeFormat('de-DE', {
		hour: '2-digit', minute: '2-digit', timeZone: BERLIN_TIME_ZONE
	}).format(new Date(value));
}

export function formatHackathonDuration(minutes: number) {
	const hours = minutes / 60;
	return `${Number.isInteger(hours) ? hours : hours.toLocaleString('de-DE')} Std.`;
}
