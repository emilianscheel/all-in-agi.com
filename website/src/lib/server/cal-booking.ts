import { env } from '$env/dynamic/private';
import { bookingMetadata, type BookingConfiguration } from '$lib/booking';
import type { ConfirmedBooking } from './hackathons';

export class BookingProviderError extends Error {
	constructor(message: string, readonly status: number) {
		super(message);
	}
}

export async function bookPrepCall(
	config: BookingConfiguration,
	requestFetch: typeof fetch,
	development: boolean
): Promise<ConfirmedBooking> {
	const token = env.CAL_API_KEY;
	const eventTypeId = Number(env.CAL_EVENT_TYPE_ID);
	if (!token || !eventTypeId) {
		if (development) {
			const start = new Date(config.consultationSlot);
			const end = new Date(start.getTime() + 60 * 60_000);
			const demoUid = `demo-${Date.now()}`;
			return {
				status: 'success',
				demo: true,
				uid: demoUid,
				icsUid: `${demoUid}@all-in-agi.com`,
				title: 'ALL-IN-AGI Prep Call',
				start: start.toISOString(),
				end: end.toISOString(),
				meetingUrl: ''
			};
		}
		throw new BookingProviderError('Die Terminbuchung ist noch nicht für den Live-Betrieb konfiguriert.', 503);
	}

	try {
		const response = await requestFetch('https://api.cal.com/v2/bookings', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'cal-api-version': '2026-02-25',
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				start: config.consultationSlot,
				eventTypeId,
				attendee: {
					name: config.contactName,
					email: config.email,
					phoneNumber: config.phone,
					timeZone: 'Europe/Berlin',
					language: 'de'
				},
				metadata: bookingMetadata(config)
			})
		});
		const result = await response.json();
		if (!response.ok) {
			const conflict = response.status === 409 || /slot|available|conflict/i.test(JSON.stringify(result));
			throw new BookingProviderError(
				conflict ? 'Dieser Termin wurde gerade vergeben. Bitte wählen Sie einen neuen Slot.' : 'Das Erstgespräch konnte nicht gebucht werden.',
				conflict ? 409 : response.status
			);
		}
		return {
			status: 'success',
			demo: false,
			uid: result.data?.uid,
			icsUid: result.data?.icsUid,
			title: result.data?.title,
			start: result.data?.start ?? config.consultationSlot,
			end: result.data?.end,
			meetingUrl: result.data?.meetingUrl ?? result.data?.location ?? ''
		};
	} catch (error) {
		if (error instanceof BookingProviderError) throw error;
		throw new BookingProviderError('Der Kalenderdienst ist vorübergehend nicht erreichbar.', 502);
	}
}
