import { normalizeAvailabilitySlots } from '$lib/prep-call';

const SLOTS_API_VERSION = '2024-09-04';

export class CalPrepAvailabilityError extends Error {
	constructor(message: string, readonly status = 502) { super(message); }
}

export async function getCalPrepCallSlots(
	requestFetch: typeof fetch,
	options: { token: string; eventTypeId: string; start: string; end: string; timeZone?: string }
) {
	const url = new URL('https://api.cal.com/v2/slots');
	for (const [key, value] of Object.entries({
		eventTypeId: options.eventTypeId,
		start: options.start,
		end: options.end,
		timeZone: options.timeZone ?? 'Europe/Berlin',
		duration: '60'
	})) url.searchParams.set(key, value);

	const response = await requestFetch(url, {
		headers: { Authorization: `Bearer ${options.token}`, 'cal-api-version': SLOTS_API_VERSION }
	});
	let result: any;
	try { result = await response.json(); } catch { result = null; }
	if (!response.ok) throw new CalPrepAvailabilityError('Die Verfügbarkeit des Vorbereitungstermins konnte nicht geprüft werden.', response.status);
	return normalizeAvailabilitySlots(Object.values(result?.data ?? {}).flatMap((values) =>
		(Array.isArray(values) ? values : []).map((value: any) => typeof value === 'string' ? value : value?.start)
	));
}
