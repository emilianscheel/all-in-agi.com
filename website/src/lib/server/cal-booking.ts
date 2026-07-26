import { env } from '$env/dynamic/private';
import type { BookingConfiguration } from '$lib/booking';
import type { ConfirmedBooking } from './hackathons';
import { cancelCalBookingWithToken, createCalBookingWithToken } from './cal-api';
import { reschedulePrepCallWithToken } from './cal-reschedule';

export { BookingProviderError } from './cal-reschedule';

export function bookHackathonDay(config: BookingConfiguration, requestFetch: typeof fetch, development: boolean) {
	const location = [config.address.street, `${config.address.postalCode} ${config.address.city}`, config.address.country].filter(Boolean).join(', ');
	return createCalBookingWithToken(config, requestFetch, development, {
		eventTypeId: env.CAL_HACKATHON_EVENT_TYPE_ID,
		start: config.eventStart,
		end: config.eventEnd,
		title: 'ALL-IN-AGI Hackathon',
		field: 'hackathon',
		location,
		allowBookingOutOfBounds: true
	}, env.CAL_API_KEY);
}

export function bookPrepCall(config: BookingConfiguration, requestFetch: typeof fetch, development: boolean) {
	const start = new Date(config.consultationSlot);
	return createCalBookingWithToken(config, requestFetch, development, {
		eventTypeId: env.CAL_EVENT_TYPE_ID,
		start: start.toISOString(),
		end: new Date(start.getTime() + 60 * 60_000).toISOString(),
		title: 'ALL-IN-AGI Prep Call',
		field: 'prep-call'
	}, env.CAL_API_KEY);
}

export function cancelCalBooking(booking: ConfirmedBooking, requestFetch: typeof fetch) {
	return cancelCalBookingWithToken(booking, requestFetch, env.CAL_API_KEY);
}

export function reschedulePrepCall(bookingUid: string | null, startValue: string, requestFetch: typeof fetch, demo: boolean) {
	return reschedulePrepCallWithToken(bookingUid, startValue, requestFetch, demo, env.CAL_API_KEY, { field: 'prep-call' });
}

export function rescheduleHackathonDay(bookingUid: string | null, eventStart: string, eventEnd: string, requestFetch: typeof fetch, demo: boolean) {
	return reschedulePrepCallWithToken(bookingUid, eventStart, requestFetch, demo, env.CAL_API_KEY, {
		end: eventEnd,
		title: 'ALL-IN-AGI Hackathon',
		reason: 'Hackathon-Termin über die Detailseite geändert',
		field: 'hackathon'
	});
}
