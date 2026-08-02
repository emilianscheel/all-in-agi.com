import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { CalPrepAvailabilityError, getCalPrepCallSlots } from '$lib/server/cal-prep-availability';

function demoSlots() {
	const slots: string[] = [];
	const cursor = new Date();
	cursor.setDate(cursor.getDate() + 2);
	while (slots.length < 8) {
		if (![0, 6].includes(cursor.getDay())) {
			for (const hour of [10, 14]) {
				const slot = new Date(cursor); slot.setHours(hour, 0, 0, 0); slots.push(slot.toISOString());
				if (slots.length >= 8) break;
			}
		}
		cursor.setDate(cursor.getDate() + 1);
	}
	return slots;
}

export async function GET({ url, fetch }) {
	const token = env.CAL_API_KEY;
	const eventTypeId = env.CAL_EVENT_TYPE_ID;
	if (!token || !eventTypeId) {
		if (dev) return json({ slots: demoSlots(), demo: true });
		return json({ message: 'Die Terminbuchung ist noch nicht für den Live-Betrieb konfiguriert.' }, { status: 503 });
	}
	const start = url.searchParams.get('start');
	const end = url.searchParams.get('end');
	if (!start || !end) return json({ message: 'Start- und Enddatum fehlen.' }, { status: 400 });
	try {
		const slots = await getCalPrepCallSlots(fetch, {
			token, eventTypeId, start, end, timeZone: url.searchParams.get('tz') ?? 'Europe/Berlin'
		});
		return json({ slots, demo: false });
	} catch (error) {
		if (error instanceof CalPrepAvailabilityError) return json({ message: 'Die Verfügbarkeit konnte nicht geladen werden.' }, { status: error.status });
		return json({ message: 'Der Kalenderdienst ist vorübergehend nicht erreichbar.' }, { status: 502 });
	}
}
