import { isHackathonId } from '$lib/public-id';
import {
	sendCustomerBookingConfirmationEmail,
	type BookingConfirmationAttempt
} from '$lib/server/booking-confirmation-email';
import {
	getConfirmedHackathonRecord,
	recordToBookingConfiguration,
	recordToPrepCallBookingSummary,
	type HackathonRecord
} from '$lib/server/hackathons';
import { json } from '@sveltejs/kit';

export interface ConfirmationEmailEndpointDependencies {
	getRecord?: (id: string) => Promise<HackathonRecord | null>;
	sendConfirmation?: typeof sendCustomerBookingConfirmationEmail;
}

function logFailure(hackathonId: string, attempt: BookingConfirmationAttempt) {
	if (attempt.sent) return;
	console.error('Booking confirmation email resend failed', {
		hackathonId,
		recipientRole: attempt.role,
		stage: attempt.error.stage,
		status: attempt.error.status,
		providerCode: attempt.error.providerCode,
		messageId: attempt.error.messageId,
		causeName: attempt.error.causeName,
		causeMessage: attempt.error.causeMessage
	});
}

export function _createConfirmationEmailPost(
	dependencies: ConfirmationEmailEndpointDependencies = {}
) {
	return async function POST({ params, fetch }: { params: { id: string }; fetch: typeof globalThis.fetch }) {
		const id = params.id.toUpperCase();
		if (!isHackathonId(id)) {
			return json({ message: 'Hackathon nicht gefunden.' }, { status: 404 });
		}

		const record = await (dependencies.getRecord ?? getConfirmedHackathonRecord)(id);
		if (!record) return json({ message: 'Hackathon nicht gefunden.' }, { status: 404 });

		const attempt = await (dependencies.sendConfirmation ?? sendCustomerBookingConfirmationEmail)(
			{
				id,
				config: recordToBookingConfiguration(record),
				booking: recordToPrepCallBookingSummary(record)
			},
			{ fetch }
		);
		if (!attempt.sent) {
			logFailure(id, attempt);
			const status = attempt.error.stage === 'configuration' ? 503
				: attempt.error.stage === 'network' || attempt.error.stage === 'provider' ? 502
				: 500;
			return json(
				{ message: 'Die Bestätigungs-E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es erneut.' },
				{ status }
			);
		}

		return json({ sent: true });
	};
}

export const POST = _createConfirmationEmailPost();
