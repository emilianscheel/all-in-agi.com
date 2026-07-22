import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { getPrice, validateConfiguration, type BookingConfiguration } from '$lib/booking';
import { json } from '@sveltejs/kit';

export async function POST({ request, fetch }) {
	let config: BookingConfiguration;
	try { config = await request.json(); } catch { return json({ message: 'Die Buchungsdaten sind ungültig.' }, { status: 400 }); }
	const errors = validateConfiguration(config);
	if (errors.length) return json({ message: errors[0], errors }, { status: 400 });
	const token = env.CAL_API_KEY;
	const eventTypeId = Number(env.CAL_EVENT_TYPE_ID);
	if (!token || !eventTypeId) {
		if (dev) return json({ status: 'success', demo: true, uid: `demo-${Date.now()}` }, { status: 201 });
		return json({ message: 'Die Terminbuchung ist noch nicht für den Live-Betrieb konfiguriert.' }, { status: 503 });
	}
	const price = getPrice(config.capacity, config.venueProvided);
	const metadata: Record<string, string> = { company: config.companyName, capacity: String(config.capacity), preferredEventDate: config.preferredEventDate, venueProvided: String(config.venueProvided), equipment: config.equipment, address: [config.address.street, config.address.postalCode, config.address.city].join(', '), totalPrice: String(price.totalPrice) };
	try {
		const response = await fetch('https://api.cal.com/v2/bookings', {
			method: 'POST', headers: { Authorization: `Bearer ${token}`, 'cal-api-version': '2026-02-25', 'content-type': 'application/json' },
			body: JSON.stringify({ start: config.consultationSlot, eventTypeId, attendee: { name: config.contactName, email: config.email, phoneNumber: config.phone, timeZone: 'Europe/Berlin', language: 'de' }, metadata })
		});
		const result = await response.json();
		if (!response.ok) {
			const conflict = response.status === 409 || /slot|available|conflict/i.test(JSON.stringify(result));
			return json({ message: conflict ? 'Dieser Termin wurde gerade vergeben. Bitte wählen Sie einen neuen Slot.' : 'Das Erstgespräch konnte nicht gebucht werden.' }, { status: conflict ? 409 : response.status });
		}
		return json({ status: 'success', demo: false, uid: result.data?.uid, start: result.data?.start }, { status: 201 });
	} catch { return json({ message: 'Der Kalenderdienst ist vorübergehend nicht erreichbar.' }, { status: 502 }); }
}
