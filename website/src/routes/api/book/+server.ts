import { dev } from '$app/environment';
import { validateConfiguration, type BookingConfiguration } from '$lib/booking';
import { completeHackathonBookingWithConfirmation } from '$lib/server/book-hackathon';
import { bookHackathonDay, bookPrepCall, cancelCalBooking, BookingProviderError } from '$lib/server/cal-booking';
import {
	BookingConfirmationEmailError,
	sendBookingConfirmationEmails,
	type BookingConfirmationAttempt,
	type BookingConfirmationRecipientRole
} from '$lib/server/booking-confirmation-email';
import { json } from '@sveltejs/kit';

function logConfirmationAttempt(hackathonId: string, attempt: BookingConfirmationAttempt) {
	if (attempt.sent) {
		console.info('Booking confirmation email accepted', {
			hackathonId,
			recipientRole: attempt.role,
			status: attempt.status,
			messageId: attempt.messageId
		});
		return;
	}

	const error = attempt.error;
	console.error('Booking confirmation email failed', {
		hackathonId,
		recipientRole: attempt.role,
		stage: error.stage,
		status: error.status,
		providerCode: error.providerCode,
		messageId: error.messageId,
		causeName: error.causeName,
		causeMessage: error.causeMessage
	});
}

function unexpectedFailure(
	role: BookingConfirmationRecipientRole,
	error: unknown
): BookingConfirmationAttempt {
	return {
		role,
		sent: false,
		error: error instanceof BookingConfirmationEmailError
			? error
			: new BookingConfirmationEmailError(
					'Der Versand der Buchungsbestätigung ist unerwartet fehlgeschlagen.',
					{
						stage: 'provider',
						providerCode: 'unexpected_error',
						cause: error
					}
				)
	};
}

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
			{
				bookHackathon: (bookingConfig) => bookHackathonDay(bookingConfig, fetch, dev),
				bookPrepCall: (bookingConfig) => bookPrepCall(bookingConfig, fetch, dev),
				cancel: (booking) => cancelCalBooking(booking, fetch)
			},
			(id, bookingConfig, booking) =>
				sendBookingConfirmationEmails({ id, config: bookingConfig, booking }, { fetch })
		);
		const { id, hackathonBooking, prepCallBooking } = result;
		let customerAttempt: BookingConfirmationAttempt;
		let organizerAttempt: BookingConfirmationAttempt;
		if ('confirmationDelivery' in result) {
			customerAttempt = result.confirmationDelivery.customer;
			organizerAttempt = result.confirmationDelivery.organizer;
		} else {
			customerAttempt = unexpectedFailure('customer', result.confirmationDeliveryError);
			organizerAttempt = unexpectedFailure('organizer', result.confirmationDeliveryError);
		}
		logConfirmationAttempt(id, customerAttempt);
		logConfirmationAttempt(id, organizerAttempt);
		return json({
			hackathonBooking,
			prepCallBooking,
			hackathonId: id,
			detailUrl: `/${id}`,
			confirmationEmailSent: customerAttempt.sent,
			organizerConfirmationEmailSent: organizerAttempt.sent
		}, { status: 201 });
	} catch (error) {
		if (error instanceof BookingProviderError) return json({ message: error.message, field: error.field }, { status: error.status });
		console.error('Hackathon booking failed', error);
		return json({ message: 'Die Buchung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.' }, { status: 503 });
	}
}
