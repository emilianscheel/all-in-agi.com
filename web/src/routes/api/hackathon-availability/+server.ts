import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { berlinDateTimeToIso } from '$lib/event-time';
import { isHackathonId } from '$lib/public-id';
import { getCalHackathonAvailability, CalAvailabilityError } from '$lib/server/cal-hackathon-availability';
import { getConfirmedHackathonRecord } from '$lib/server/hackathons';

function validDate(value: string | null) {
	return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()));
}

function demoAvailability(start: string, end: string) {
	const durations = [300, 360, 420, 480, 540, 600];
	const slots = [];
	const cursor = new Date(`${start}T12:00:00Z`);
	const last = new Date(`${end}T12:00:00Z`);
	while (cursor <= last) {
		if (![0, 6].includes(cursor.getUTCDay())) {
			const date = cursor.toISOString().slice(0, 10);
			for (const duration of durations) {
				const slotStart = berlinDateTimeToIso(date, '09:00');
				slots.push({ start: slotStart, end: new Date(new Date(slotStart).getTime() + duration * 60_000).toISOString(), duration });
			}
		}
		cursor.setUTCDate(cursor.getUTCDate() + 1);
	}
	return { durations, slots, demo: true };
}

export async function GET({ url, fetch }) {
	const start = url.searchParams.get('start');
	const end = url.searchParams.get('end');
	if (!validDate(start) || !validDate(end) || start! > end!) return json({ message: 'Der Verfügbarkeitszeitraum ist ungültig.' }, { status: 400 });
	const rangeDays = (new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime()) / 86_400_000;
	if (rangeDays > 45) return json({ message: 'Der Verfügbarkeitszeitraum ist zu groß.' }, { status: 400 });

	const token = env.CAL_API_KEY;
	const eventTypeId = env.CAL_HACKATHON_EVENT_TYPE_ID;
	if (!token || !eventTypeId) {
		if (dev) return json(demoAvailability(start!, end!));
		return json({ message: 'Die Hackathon-Terminbuchung ist noch nicht für den Live-Betrieb konfiguriert.' }, { status: 503 });
	}

	let bookingUidToReschedule: string | undefined;
	const hackathonId = url.searchParams.get('hackathonId');
	if (hackathonId) {
		const canonicalId = hackathonId.toUpperCase();
		if (!isHackathonId(canonicalId)) return json({ message: 'Hackathon nicht gefunden.' }, { status: 404 });
		const record = await getConfirmedHackathonRecord(canonicalId);
		if (!record) return json({ message: 'Hackathon nicht gefunden.' }, { status: 404 });
		bookingUidToReschedule = record.hackathonBookingUid ?? undefined;
	}

	try {
		const result = await getCalHackathonAvailability(fetch, { token, eventTypeId, start: start!, end: end!, bookingUidToReschedule });
		return json({ ...result, demo: false }, { headers: { 'cache-control': 'private, no-store' } });
	} catch (error) {
		if (error instanceof CalAvailabilityError) return json({ message: error.message }, { status: error.status });
		return json({ message: 'Der Kalenderdienst ist vorübergehend nicht erreichbar.' }, { status: 502 });
	}
}
