import { bookingMetadata, type BookingConfiguration } from '$lib/booking';
import { eventDurationMinutes } from '$lib/event-time';
import type { ConfirmedBooking } from './hackathons';
import { BookingProviderError } from './cal-reschedule';

const CAL_API_VERSION = '2026-02-25';

function calPhoneNumber(value: string) {
	const compact = value.trim().replace(/[^\d+]/g, '');
	if (/^\+\d{6,15}$/.test(compact)) return compact;
	if (/^00\d{6,15}$/.test(compact)) return `+${compact.slice(2)}`;
	if (/^0\d{5,14}$/.test(compact)) return `+49${compact.slice(1)}`;
	return undefined;
}

function providerErrorDetail(value: unknown) {
	return typeof value === 'string' ? value.slice(0, 500) : undefined;
}

function bookingRejection(result: unknown, status: number, field: 'hackathon' | 'prep-call') {
	let details = '';
	try { details = JSON.stringify(result).toLowerCase(); } catch { details = ''; }

	if (status === 409 || /slot|availability|conflict/.test(details)) {
		return { message: 'Dieser Termin wurde gerade vergeben. Bitte wählen Sie einen neuen Termin.', status: 409 };
	}
	if (/phone|telefon/.test(details)) {
		return { message: 'Die Telefonnummer konnte nicht verarbeitet werden. Bitte verwenden Sie ein internationales Format, zum Beispiel +49 30 123456.', status: 400 };
	}
	if (/location|address|adresse/.test(details)) {
		return { message: 'Die Veranstaltungsadresse konnte nicht verarbeitet werden. Bitte prüfen Sie Straße, PLZ und Ort.', status: 400 };
	}
	if (/length|duration|dauer/.test(details)) {
		return field === 'prep-call'
			? { message: 'Der Vorbereitungstermin ist im Kalender nicht korrekt als 60-Minuten-Termin konfiguriert. Bitte kontaktieren Sie uns.', status: 503 }
			: { message: 'Die gewählte Termindauer wird vom Kalender nicht unterstützt. Bitte wählen Sie ein anderes Start- und Endzeitfenster.', status: 400 };
	}
	if (/booking.?window|out.?of.?bounds|minimum.?booking.?notice|too.?soon/.test(details)) {
		return { message: 'Der gewählte Termin liegt außerhalb des buchbaren Zeitraums. Bitte wählen Sie ein anderes Datum.', status: 400 };
	}
	if (status === 401 || status === 403 || status === 404 || /event.?type|not.?found/.test(details)) {
		return { message: 'Unser Buchungskalender ist derzeit nicht vollständig verfügbar. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns.', status: 503 };
	}
	if (status === 429) {
		return { message: 'Der Kalenderdienst erhält gerade zu viele Anfragen. Bitte versuchen Sie es in wenigen Minuten erneut.', status: 503 };
	}
	if (status >= 500) {
		return { message: 'Der Kalenderdienst ist vorübergehend nicht erreichbar. Bitte versuchen Sie es später erneut.', status: 502 };
	}
	return {
		message: field === 'hackathon'
			? 'Der Hackathon-Termin wurde vom Kalender abgelehnt. Bitte prüfen Sie Datum, Uhrzeit und Adresse.'
			: 'Der Vorbereitungstermin wurde vom Kalender abgelehnt. Bitte wählen Sie einen anderen Termin.',
		status
	};
}

export interface CreateCalBookingOptions {
	eventTypeId?: string;
	start: string;
	end: string;
	title: string;
	field: 'hackathon' | 'prep-call';
	location?: string;
	includeLengthInMinutes?: boolean;
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
		const phoneNumber = calPhoneNumber(config.phone);
		const response = await requestFetch('https://api.cal.com/v2/bookings', {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}`, 'cal-api-version': CAL_API_VERSION, 'content-type': 'application/json' },
			body: JSON.stringify({
				start: options.start,
				eventTypeId,
				attendee: { name: config.contactName, email: config.email, ...(phoneNumber ? { phoneNumber } : {}), timeZone: 'Europe/Berlin', language: 'de' },
				metadata: bookingMetadata(config),
				...(options.includeLengthInMinutes === false ? {} : { lengthInMinutes: eventDurationMinutes(options.start, options.end) }),
				...(options.location ? { location: { type: 'attendeeAddress', address: options.location } } : {})
			})
		});
		const result = await response.json() as any;
		if (!response.ok) {
			console.error('Cal.com booking rejected', {
				status: response.status,
				field: options.field,
				providerCode: providerErrorDetail(result?.error?.code),
				providerMessage: providerErrorDetail(result?.error?.message),
				providerDetails: providerErrorDetail(result?.error?.details)
			});
			const rejection = bookingRejection(result, response.status, options.field);
			throw new BookingProviderError(rejection.message, rejection.status, options.field);
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
