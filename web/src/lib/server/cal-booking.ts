import { env } from '$env/dynamic/private';
import { hackathonCalendarLocation, type BookingConfiguration } from '$lib/booking';
import { berlinInputsFromIso } from '$lib/event-time';
import { PREP_CALL_DURATION_MINUTES } from '$lib/prep-call';
import type { ConfirmedBooking } from './hackathons';
import { cancelCalBookingWithToken, createCalBookingWithToken } from './cal-api';
import { CalAvailabilityError, isCalHackathonSlotAvailable } from './cal-hackathon-availability';
import { CalPrepAvailabilityError, getCalPrepCallSlots } from './cal-prep-availability';
import { BookingProviderError, reschedulePrepCallWithToken } from './cal-reschedule';

export { BookingProviderError } from './cal-reschedule';

export function bookHackathonDay(config: BookingConfiguration, requestFetch: typeof fetch, development: boolean) {
	const location = hackathonCalendarLocation(config);
	return createCalBookingWithToken(config, requestFetch, development, {
		eventTypeId: env.CAL_HACKATHON_EVENT_TYPE_ID,
		start: config.eventStart,
		end: config.eventEnd,
		title: 'ALL IN AGI Hackathon',
		field: 'hackathon',
		location
	}, env.CAL_API_KEY);
}

export async function assertHackathonDayAvailable(
	config: BookingConfiguration,
	requestFetch: typeof fetch,
	development: boolean,
	bookingUidToReschedule?: string
) {
	const token = env.CAL_API_KEY;
	const eventTypeId = env.CAL_HACKATHON_EVENT_TYPE_ID;
	if (!token || !eventTypeId) {
		if (development) return;
		throw new BookingProviderError('Die Hackathon-Terminbuchung ist noch nicht für den Live-Betrieb konfiguriert.', 503, 'hackathon');
	}
	try {
		const available = await isCalHackathonSlotAvailable(requestFetch, {
			token,
			eventTypeId,
			start: config.eventStart,
			end: config.eventEnd,
			bookingUidToReschedule
		});
		if (!available) throw new BookingProviderError('Dieser Hackathon-Termin ist nicht mehr verfügbar. Bitte wählen Sie einen neuen Termin.', 409, 'hackathon');
	} catch (error) {
		if (error instanceof BookingProviderError) throw error;
		if (error instanceof CalAvailabilityError) {
			throw new BookingProviderError(error.message, error.status >= 500 ? error.status : 502, 'hackathon');
		}
		throw new BookingProviderError('Der Kalenderdienst ist vorübergehend nicht erreichbar.', 502, 'hackathon');
	}
}

export function bookPrepCall(config: BookingConfiguration, requestFetch: typeof fetch, development: boolean) {
	const start = new Date(config.consultationSlot);
	return createCalBookingWithToken(config, requestFetch, development, {
		eventTypeId: env.CAL_EVENT_TYPE_ID,
		start: start.toISOString(),
		end: new Date(start.getTime() + PREP_CALL_DURATION_MINUTES * 60_000).toISOString(),
		title: 'ALL IN AGI Prep Call',
		field: 'prep-call',
		includeLengthInMinutes: false
	}, env.CAL_API_KEY);
}

export async function assertPrepCallAvailable(
	config: BookingConfiguration,
	requestFetch: typeof fetch,
	development: boolean
) {
	const token = env.CAL_API_KEY;
	const eventTypeId = env.CAL_EVENT_TYPE_ID;
	if (!token || !eventTypeId) {
		if (development) return;
		throw new BookingProviderError('Die Vorbereitungstermin-Buchung ist noch nicht für den Live-Betrieb konfiguriert.', 503, 'prep-call');
	}
	const selected = new Date(config.consultationSlot);
	if (Number.isNaN(selected.getTime())) throw new BookingProviderError('Bitte wählen Sie einen gültigen Vorbereitungstermin.', 400, 'prep-call');
	const date = berlinInputsFromIso(selected.toISOString()).date;
	try {
		const slots = await getCalPrepCallSlots(requestFetch, { token, eventTypeId, start: date, end: date });
		const selectedIso = selected.toISOString();
		if (!slots.some((slot) => new Date(slot).toISOString() === selectedIso)) {
			throw new BookingProviderError('Dieser Vorbereitungstermin ist nicht mehr verfügbar. Bitte wählen Sie einen neuen Termin.', 409, 'prep-call');
		}
	} catch (error) {
		if (error instanceof BookingProviderError) throw error;
		if (error instanceof CalPrepAvailabilityError) {
			throw new BookingProviderError(error.message, error.status >= 500 ? error.status : 502, 'prep-call');
		}
		throw new BookingProviderError('Der Kalenderdienst ist vorübergehend nicht erreichbar.', 502, 'prep-call');
	}
}

export function cancelCalBooking(booking: ConfirmedBooking, requestFetch: typeof fetch, reason?: string) {
	return cancelCalBookingWithToken(booking, requestFetch, env.CAL_API_KEY, { reason });
}

export function reschedulePrepCall(bookingUid: string | null, startValue: string, requestFetch: typeof fetch, demo: boolean) {
	return reschedulePrepCallWithToken(bookingUid, startValue, requestFetch, demo, env.CAL_API_KEY, { field: 'prep-call' });
}

export function rescheduleHackathonDay(bookingUid: string | null, eventStart: string, eventEnd: string, requestFetch: typeof fetch, demo: boolean) {
	return reschedulePrepCallWithToken(bookingUid, eventStart, requestFetch, demo, env.CAL_API_KEY, {
		end: eventEnd,
		title: 'ALL IN AGI Hackathon',
		reason: 'Hackathon-Termin über die Detailseite geändert',
		field: 'hackathon'
	});
}
