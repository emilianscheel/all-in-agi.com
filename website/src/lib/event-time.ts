export const BERLIN_TIME_ZONE = 'Europe/Berlin';
export const DEFAULT_EVENT_START_TIME = '09:00';
export const DEFAULT_EVENT_END_TIME = '17:00';
export const EVENT_TIME_STEP_MINUTES = 30;
export const EVENT_DURATION_STEP_MINUTES = 60;
export const MIN_EVENT_DURATION_MINUTES = 5 * 60;
export const MAX_EVENT_DURATION_MINUTES = 10 * 60;
export const EVENT_DURATION_OPTIONS_MINUTES = Array.from(
	{ length: (MAX_EVENT_DURATION_MINUTES - MIN_EVENT_DURATION_MINUTES) / EVENT_DURATION_STEP_MINUTES + 1 },
	(_, index) => MIN_EVENT_DURATION_MINUTES + index * EVENT_DURATION_STEP_MINUTES
);

function localParts(value: Date) {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: BERLIN_TIME_ZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23'
	}).formatToParts(value);
	const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
	return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` };
}

export function berlinDateTimeToIso(date: string, time: string) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return '';
	const [year, month, day] = date.split('-').map(Number);
	const [hour, minute] = time.split(':').map(Number);
	if (hour > 23 || minute > 59) return '';
	const desiredUtc = Date.UTC(year, month - 1, day, hour, minute);
	let candidate = new Date(desiredUtc);
	for (let iteration = 0; iteration < 3; iteration += 1) {
		const parts = localParts(candidate);
		const [actualYear, actualMonth, actualDay] = parts.date.split('-').map(Number);
		const [actualHour, actualMinute] = parts.time.split(':').map(Number);
		const actualUtc = Date.UTC(actualYear, actualMonth - 1, actualDay, actualHour, actualMinute);
		candidate = new Date(candidate.getTime() + desiredUtc - actualUtc);
	}
	const roundTrip = localParts(candidate);
	return roundTrip.date === date && roundTrip.time === time ? candidate.toISOString() : '';
}

export function berlinInputsFromIso(value: string) {
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? { date: '', time: '' } : localParts(parsed);
}

export function eventTimesForDate(
	date: string,
	startTime = DEFAULT_EVENT_START_TIME,
	endTime = DEFAULT_EVENT_END_TIME
) {
	return {
		eventStart: berlinDateTimeToIso(date, startTime),
		eventEnd: berlinDateTimeToIso(date, endTime)
	};
}

export function eventDurationMinutes(eventStart: string, eventEnd: string) {
	return (new Date(eventEnd).getTime() - new Date(eventStart).getTime()) / 60_000;
}

export function isValidEventTimeRange(eventStart: string, eventEnd: string, now = new Date()) {
	const start = new Date(eventStart);
	const end = new Date(eventEnd);
	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start <= now) return false;
	const startLocal = berlinInputsFromIso(eventStart);
	const endLocal = berlinInputsFromIso(eventEnd);
	const duration = eventDurationMinutes(eventStart, eventEnd);
	return startLocal.date === endLocal.date
		&& EVENT_DURATION_OPTIONS_MINUTES.includes(duration)
		&& Number(startLocal.time.slice(3)) % EVENT_TIME_STEP_MINUTES === 0
		&& Number(endLocal.time.slice(3)) % EVENT_TIME_STEP_MINUTES === 0;
}

export function formatEventTimeRange(eventStart: string, eventEnd: string) {
	const start = new Date(eventStart);
	const end = new Date(eventEnd);
	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Noch offen';
	const date = new Intl.DateTimeFormat('de-DE', {
		weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: BERLIN_TIME_ZONE
	}).format(start);
	const time = (value: Date) => new Intl.DateTimeFormat('de-DE', {
		hour: '2-digit', minute: '2-digit', timeZone: BERLIN_TIME_ZONE
	}).format(value);
	return `${date}, ${time(start)}–${time(end)} Uhr`;
}

export const EVENT_TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
	const hours = String(Math.floor(index / 2)).padStart(2, '0');
	const minutes = index % 2 ? '30' : '00';
	return `${hours}:${minutes}`;
});

function timeToMinutes(time: string) {
	const match = /^(\d{2}):(\d{2})$/.exec(time);
	if (!match) return Number.NaN;
	return Number(match[1]) * 60 + Number(match[2]);
}

export function eventEndTimeOptions(startTime: string) {
	const startMinutes = timeToMinutes(startTime);
	return EVENT_TIME_OPTIONS.filter((endTime) =>
		EVENT_DURATION_OPTIONS_MINUTES.includes(timeToMinutes(endTime) - startMinutes)
	);
}

export const EVENT_START_TIME_OPTIONS = EVENT_TIME_OPTIONS.filter(
	(startTime) => eventEndTimeOptions(startTime).length > 0
);
