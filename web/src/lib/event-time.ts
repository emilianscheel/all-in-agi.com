export const BERLIN_TIME_ZONE = 'Europe/Berlin';
export const DEFAULT_EVENT_START_TIME = '09:00';
export const DEFAULT_EVENT_END_TIME = '17:00';

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

export function eventDurationMinutes(eventStart: string | null, eventEnd: string | null) {
	if (!eventStart || !eventEnd) return Number.NaN;
	return (new Date(eventEnd).getTime() - new Date(eventStart).getTime()) / 60_000;
}

export function isDeferredEventTime(eventStart: string | null, eventEnd: string | null) {
	return eventStart === null && eventEnd === null;
}

export function isValidEventTimeRange(eventStart: string | null, eventEnd: string | null, now = new Date()) {
	if (!eventStart || !eventEnd) return false;
	const start = new Date(eventStart);
	const end = new Date(eventEnd);
	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start <= now) return false;
	const startLocal = berlinInputsFromIso(eventStart);
	const endLocal = berlinInputsFromIso(eventEnd);
	const duration = eventDurationMinutes(eventStart, eventEnd);
	return startLocal.date === endLocal.date
		&& duration > 0;
}

export function formatEventTimeRange(eventStart: string | null, eventEnd: string | null, locale: 'de' | 'en' = 'de') {
	if (isDeferredEventTime(eventStart, eventEnd)) return locale === 'en' ? 'Choose later' : 'Später festlegen';
	if (!eventStart || !eventEnd) return locale === 'en' ? 'Not set' : 'Noch offen';
	const start = new Date(eventStart);
	const end = new Date(eventEnd);
	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return locale === 'en' ? 'Not set' : 'Noch offen';
	const date = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'de-DE', {
		weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: BERLIN_TIME_ZONE
	}).format(start);
	const time = (value: Date) => new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'de-DE', {
		hour: '2-digit', minute: '2-digit', timeZone: BERLIN_TIME_ZONE
	}).format(value);
	return `${date}, ${time(start)}–${time(end)}${locale === 'en' ? '' : ' Uhr'}`;
}
