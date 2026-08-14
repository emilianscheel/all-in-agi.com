import { berlinInputsFromIso, eventDurationMinutes } from '$lib/event-time';
import { normalizeHackathonSlots, type HackathonAvailabilitySlot } from '$lib/hackathon-availability';

const EVENT_TYPE_API_VERSION = '2024-06-14';
const SLOTS_API_VERSION = '2024-09-04';
const DURATION_CACHE_MS = 5 * 60_000;

export class CalAvailabilityError extends Error {
	constructor(message: string, readonly status = 502) { super(message); }
}

let durationCache: { key: string; expires: number; durations: number[] } | undefined;

function headers(token: string, version: string) {
	return { Authorization: `Bearer ${token}`, 'cal-api-version': version };
}

function configuredDurations(data: any) {
	const values = [data?.lengthInMinutes, ...(Array.isArray(data?.lengthInMinutesOptions) ? data.lengthInMinutesOptions : [])];
	return [...new Set(values.filter((value): value is number => Number.isInteger(value) && value > 0 && value < 24 * 60))].sort((a, b) => a - b);
}

export async function getCalHackathonDurations(
	requestFetch: typeof fetch,
	token: string,
	eventTypeId: string,
	now = Date.now()
) {
	const key = `${eventTypeId}:${token.slice(-8)}`;
	if (durationCache?.key === key && durationCache.expires > now) return durationCache.durations;
	const response = await requestFetch(`https://api.cal.com/v2/event-types/${encodeURIComponent(eventTypeId)}`, {
		headers: headers(token, EVENT_TYPE_API_VERSION)
	});
	let result: any;
	try { result = await response.json(); } catch { result = null; }
	if (!response.ok) throw new CalAvailabilityError('Die Hackathon-Konfiguration konnte nicht geladen werden.', response.status);
	const durations = configuredDurations(result?.data);
	if (!durations.length) throw new CalAvailabilityError('Für den Hackathon sind keine buchbaren Dauern konfiguriert.', 503);
	durationCache = { key, expires: now + DURATION_CACHE_MS, durations };
	return durations;
}

async function getSlotsForDuration(
	requestFetch: typeof fetch,
	token: string,
	eventTypeId: string,
	start: string,
	end: string,
	duration: number,
	bookingUidToReschedule?: string
) {
	const url = new URL('https://api.cal.com/v2/slots');
	for (const [key, value] of Object.entries({
		eventTypeId,
		start,
		end,
		timeZone: 'Europe/Berlin',
		duration: String(duration),
		format: 'range',
		...(bookingUidToReschedule ? { bookingUidToReschedule } : {})
	})) url.searchParams.set(key, value);
	const response = await requestFetch(url, { headers: headers(token, SLOTS_API_VERSION) });
	let result: any;
	try { result = await response.json(); } catch { result = null; }
	if (!response.ok) throw new CalAvailabilityError('Die Hackathon-Verfügbarkeit konnte nicht geladen werden.', response.status);
	return Object.values(result?.data ?? {}).flatMap((values): HackathonAvailabilitySlot[] =>
		(Array.isArray(values) ? values : []).flatMap((value: any) => {
			if (typeof value === 'string') {
				const slotStart = new Date(value);
				if (Number.isNaN(slotStart.getTime())) return [];
				return [{ start: slotStart.toISOString(), end: new Date(slotStart.getTime() + duration * 60_000).toISOString(), duration }];
			}
			if (typeof value?.start !== 'string') return [];
			const slotStart = new Date(value.start);
			const slotEnd = typeof value.end === 'string' ? new Date(value.end) : new Date(slotStart.getTime() + duration * 60_000);
			if (Number.isNaN(slotStart.getTime()) || Number.isNaN(slotEnd.getTime())) return [];
			return [{ start: slotStart.toISOString(), end: slotEnd.toISOString(), duration }];
		})
	);
}

export async function getCalHackathonAvailability(
	requestFetch: typeof fetch,
	options: { token: string; eventTypeId: string; start: string; end: string; bookingUidToReschedule?: string }
) {
	const durations = await getCalHackathonDurations(requestFetch, options.token, options.eventTypeId);
	const groups = await Promise.all(durations.map((duration) => getSlotsForDuration(
		requestFetch,
		options.token,
		options.eventTypeId,
		options.start,
		options.end,
		duration,
		options.bookingUidToReschedule
	)));
	return { durations, slots: normalizeHackathonSlots(groups.flat()) };
}

export async function isCalHackathonSlotAvailable(
	requestFetch: typeof fetch,
	options: { token: string; eventTypeId: string; start: string; end: string; bookingUidToReschedule?: string }
) {
	const duration = eventDurationMinutes(options.start, options.end);
	const durations = await getCalHackathonDurations(requestFetch, options.token, options.eventTypeId);
	if (!durations.includes(duration)) return false;
	const date = berlinInputsFromIso(options.start).date;
	const slots = normalizeHackathonSlots(await getSlotsForDuration(
		requestFetch,
		options.token,
		options.eventTypeId,
		date,
		date,
		duration,
		options.bookingUidToReschedule
	));
	const start = new Date(options.start).toISOString();
	const end = new Date(options.end).toISOString();
	return slots.some((slot) => slot.start === start && slot.end === end);
}

export function clearCalHackathonDurationCache() {
	durationCache = undefined;
}
