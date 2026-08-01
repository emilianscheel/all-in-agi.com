import { bookingMetadata, type BookingConfiguration } from '$lib/booking';
import { eventDurationMinutes } from '$lib/event-time';
import type { ConfirmedBooking } from './hackathons';
import { BookingProviderError } from './cal-reschedule';

const CAL_API_VERSION = '2026-02-25';

export interface CreateCalBookingOptions {
	eventTypeId?: string;
	start: string;
	end: string;
	title: string;
	field: 'hackathon' | 'prep-call';
	location?: string;
	allowBookingOutOfBounds?: boolean;
}

export async function createCalBookingWithToken(
	config: BookingConfiguration,
	requestFetch: typeof fetch,
	development: boolean,
	options: CreateCalBookingOptions,
	token?: string
): Promise<ConfirmedBooking> {
	const eventTypeId = Number(options.eventTypeId);
	if (!token || !eventTypeId) {
		if (development) {
			const demoUid = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
			return { status: 'success', demo: true, uid: demoUid, icsUid: `${demoUid}@all-in-agi.com`, title: options.title, start: options.start, end: options.end, meetingUrl: '' };
		}
		throw new BookingProviderError('Die Terminbuchung ist noch nicht für den Live-Betrieb konfiguriert.', 503, options.field);
	}

	try {
		const response = await requestFetch('https://api.cal.com/v2/bookings', {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}`, 'cal-api-version': CAL_API_VERSION, 'content-type': 'application/json' },
			body: JSON.stringify({
				start: options.start,
				eventTypeId,
				attendee: { name: config.contactName, email: config.email, phoneNumber: config.phone, timeZone: 'Europe/Berlin', language: 'de' },
				metadata: bookingMetadata(config),
				lengthInMinutes: eventDurationMinutes(options.start, options.end),
				...(options.location ? { location: { type: 'attendeeAddress', address: options.location } } : {}),
				...(options.allowBookingOutOfBounds ? { allowBookingOutOfBounds: true } : {})
			})
		});
		const result = await response.json() as any;
		if (!response.ok) {
			const conflict = response.status === 409 || /slot|available|conflict/i.test(JSON.stringify(result));
			throw new BookingProviderError(conflict ? 'Dieser Termin wurde gerade vergeben. Bitte wählen Sie einen neuen Termin.' : 'Der Termin konnte nicht gebucht werden.', conflict ? 409 : response.status, options.field);
		}
		return {
			status: 'success', demo: false, uid: result?.data?.uid, icsUid: result?.data?.icsUid, title: result?.data?.title,
			start: result?.data?.start ?? options.start, end: result?.data?.end ?? options.end,
			meetingUrl: result?.data?.meetingUrl ?? result?.data?.location ?? ''
		};
	} catch (error) {
		if (error instanceof BookingProviderError) throw error;
		throw new BookingProviderError('Der Kalenderdienst ist vorübergehend nicht erreichbar.', 502, options.field);
	}
}

export async function cancelCalBookingWithToken(
	booking: ConfirmedBooking,
	requestFetch: typeof fetch,
	token?: string,
	options: { reason?: string } = {}
) {
	if (booking.demo) return;
	if (!token || !booking.uid) throw new BookingProviderError('Der Kalendertermin konnte nicht storniert werden.', 503);
	const response = await requestFetch(`https://api.cal.com/v2/bookings/${encodeURIComponent(booking.uid)}/cancel`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}`, 'cal-api-version': CAL_API_VERSION, 'content-type': 'application/json' },
		body: JSON.stringify({ cancellationReason: options.reason ?? 'Buchung über ALL IN AGI zurückgerollt' })
	});
	if (!response.ok) {
		let result: unknown;
		try { result = await response.json(); } catch { result = null; }
		const alreadyCancelled = (response.status === 404 || response.status === 409)
			&& /cancelled|canceled|already|not found/i.test(JSON.stringify(result));
		if (!alreadyCancelled) throw new BookingProviderError('Der Kalendertermin konnte nicht storniert werden.', response.status);
	}
}
