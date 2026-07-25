import { dev } from '$app/environment';
import { validateConfiguration, type BookingConfiguration } from '$lib/booking';
import { completeHackathonBookingWithConfirmation } from '$lib/server/book-hackathon';
import { bookPrepCall, BookingProviderError } from '$lib/server/cal-booking';
import {
	BookingConfirmationEmailError,
	sendBookingConfirmationEmail
} from '$lib/server/booking-confirmation-email';
import { json } from '@sveltejs/kit';

export async function POST({ request, fetch }) {
	let config: BookingConfiguration;
	try {
		const body = await request.json() as Partial<BookingConfiguration>;
		config = { ...body, message: typeof body.message === 'string' ? body.message : '' } as BookingConfiguration;
	} catch { return json({ message: 'Die Buchungsdaten sind ungültig.' }, { status: 400 }); }
	const errors = validateConfiguration(config);
	if (errors.length) return json({ message: errors[0], errors }, { status: 400 });
	try {
		const result = await completeHackathonBookingWithConfirmation(
			config,
			(bookingConfig) => bookPrepCall(bookingConfig, fetch, dev),
			(id, bookingConfig, booking) =>
				sendBookingConfirmationEmail({ id, config: bookingConfig, booking }, { fetch })
		);
		const { id, booking, confirmationEmailSent } = result;
		if (result.confirmationEmailSent) {
			const delivery = result.confirmationEmailDelivery;
			console.info('Booking confirmation email accepted', {
				hackathonId: id,
				status: delivery.status,
				messageId: delivery.messageId
			});
		} else {
			const error = result.confirmationEmailError;
			if (error instanceof BookingConfirmationEmailError) {
				console.error('Booking confirmation email failed', {
					hackathonId: id,
					status: error.status,
					providerCode: error.providerCode,
					messageId: error.messageId
				});
			} else {
				console.error('Booking confirmation email failed', {
					hackathonId: id,
					errorName: error instanceof Error ? error.name : 'UnknownError'
				});
			}
		}
		return json({
			...booking,
			hackathonId: id,
			detailUrl: `/${id}`,
			confirmationEmailSent
		}, { status: 201 });
	} catch (error) {
		if (error instanceof BookingProviderError) return json({ message: error.message }, { status: error.status });
		console.error('Hackathon booking failed', error);
		return json({ message: 'Die Buchung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.' }, { status: 503 });
	}
}
