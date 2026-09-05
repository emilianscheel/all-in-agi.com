import { sendBookingCancellationEmail } from './booking-cancellation-email';
import {
	claimHackathonCancellation,
	getCustomerHackathonRecord,
	markCancellationEmailSent,
	markHackathonCalendarCancelled,
	markHackathonCancelled,
	recordToHackathonBookingSummary,
	recordToPrepCallBookingSummary,
	releaseHackathonCancellation,
	type ConfirmedBooking,
	type HackathonRecord
} from './hackathons';

export interface CancellationDependencies {
	claim?: typeof claimHackathonCancellation;
	getRecord?: typeof getCustomerHackathonRecord;
	markCalendar?: typeof markHackathonCalendarCancelled;
	markCancelled?: typeof markHackathonCancelled;
	markEmail?: typeof markCancellationEmailSent;
	release?: typeof releaseHackathonCancellation;
	cancelCalendar?: (booking: ConfirmedBooking, requestFetch: typeof fetch, reason?: string) => Promise<void>;
	sendEmail?: typeof sendBookingCancellationEmail;
}

export interface CancellationState {
	status: HackathonRecord['status'];
	hackathonCancelled: boolean;
	prepCallCancelled: boolean;
	emailSent: boolean;
	complete: boolean;
	processing?: boolean;
	message?: string;
}

function stateFromRecord(record: HackathonRecord, additions: Partial<CancellationState> = {}): CancellationState {
	return {
		status: record.status,
		hackathonCancelled: Boolean(record.hackathonCancelledAt),
		prepCallCancelled: Boolean(record.prepCallCancelledAt),
		emailSent: Boolean(record.cancellationEmailSentAt),
		complete: record.status === 'cancelled' && Boolean(record.cancellationEmailSentAt),
		...additions
	};
}

function confirmedBooking(record: HackathonRecord, kind: 'hackathon' | 'prep-call'): ConfirmedBooking {
	const summary = kind === 'hackathon' ? recordToHackathonBookingSummary(record) : recordToPrepCallBookingSummary(record);
	if (!summary) throw new Error('Keine Hackathon-Kalenderbuchung vorhanden.');
	return {
		status: 'success',
		demo: record.demoMode,
		...summary
	};
}

export async function cancelHackathonBooking(
	id: string,
	requestFetch: typeof fetch,
	dependencies: CancellationDependencies = {}
): Promise<{ found: false } | { found: true; state: CancellationState }> {
	const claim = dependencies.claim ?? claimHackathonCancellation;
	const getRecord = dependencies.getRecord ?? getCustomerHackathonRecord;
	const markCalendar = dependencies.markCalendar ?? markHackathonCalendarCancelled;
	const markCancelled = dependencies.markCancelled ?? markHackathonCancelled;
	const markEmail = dependencies.markEmail ?? markCancellationEmailSent;
	const release = dependencies.release ?? releaseHackathonCancellation;
	const cancelCalendar = dependencies.cancelCalendar ?? (await import('./cal-booking')).cancelCalBooking;
	const sendEmail = dependencies.sendEmail ?? sendBookingCancellationEmail;

	const claimed = await claim(id);
	if (!claimed.record) return { found: false };
	if (!claimed.claimed) {
		return { found: true, state: stateFromRecord(claimed.record, { processing: !claimed.record.cancellationEmailSentAt }) };
	}

	let record = claimed.record;
	try {
		if (record.status === 'cancellation_pending' && !record.hackathonCancelledAt) {
			if (record.hackathonBookingUid || record.eventStart) await cancelCalendar(confirmedBooking(record, 'hackathon'), requestFetch, 'Hackathon-Buchung durch ALL IN AGI storniert');
			record = await markCalendar(id, 'hackathon') ?? record;
		}
		if (record.status === 'cancellation_pending' && !record.prepCallCancelledAt) {
			await cancelCalendar(confirmedBooking(record, 'prep-call'), requestFetch, 'Hackathon-Buchung durch ALL IN AGI storniert');
			record = await markCalendar(id, 'prep-call') ?? record;
		}
		if (record.status === 'cancellation_pending' && record.hackathonCancelledAt && record.prepCallCancelledAt) {
			record = await markCancelled(id) ?? record;
		}
		if (record.status === 'cancelled' && !record.cancellationEmailSentAt) {
			const delivery = await sendEmail(record, { fetch: requestFetch });
			record = await markEmail(id, delivery.messageId) ?? record;
		}
		return { found: true, state: stateFromRecord(record) };
	} catch (error) {
		console.error('Hackathon cancellation incomplete', { hackathonId: id, error });
		record = await getRecord(id) ?? record;
		return {
			found: true,
			state: stateFromRecord(record, {
				message: record.status === 'cancelled'
					? 'Die Buchung wurde storniert, aber die Kunden-E-Mail konnte noch nicht gesendet werden.'
					: 'Die Stornierung ist noch nicht vollständig. Bitte versuchen Sie es erneut.'
			})
		};
	} finally {
		await release(id, claimed.record.cancellationProcessingAt)
			.catch((error) => console.error('Could not release cancellation lease', { hackathonId: id, error }));
	}
}
