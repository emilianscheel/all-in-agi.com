import { applyHackathonUpdate, HackathonUpdateError, parseHackathonUpdate } from '$lib/hackathon-edit';
import { isHackathonId } from '$lib/public-id';
import { reschedulePrepCall, BookingProviderError } from '$lib/server/cal-booking';
import {
	getConfirmedHackathonRecord,
	recordToBookingConfiguration,
	toPublicHackathon,
	updateConfirmedHackathon
} from '$lib/server/hackathons';
import { validateConfiguration } from '$lib/booking';
import { json } from '@sveltejs/kit';

export async function PATCH({ params, request, fetch }) {
	const id = params.id.toUpperCase();
	if (!isHackathonId(id)) return json({ message: 'Hackathon nicht gefunden.' }, { status: 404 });
	const record = await getConfirmedHackathonRecord(id);
	if (!record) return json({ message: 'Hackathon nicht gefunden.' }, { status: 404 });

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ message: 'Die Änderungen sind ungültig.' }, { status: 400 });
	}

	try {
		const update = parseHackathonUpdate(body);
		const current = recordToBookingConfiguration(record);
		const next = applyHackathonUpdate(current, update);
		const errors = validateConfiguration(next);
		if (errors.length) return json({ message: errors[0], errors }, { status: 400 });

		if (update.section !== 'prep-call' || next.consultationSlot === current.consultationSlot) {
			const updated = await updateConfirmedHackathon(id, next);
			return json({ hackathon: toPublicHackathon(updated) });
		}

		const rescheduled = await reschedulePrepCall(record.bookingUid, next.consultationSlot, fetch, record.demoMode);
		const booking = {
			...rescheduled,
			icsUid: rescheduled.icsUid ?? record.bookingIcsUid ?? undefined,
			title: rescheduled.title ?? record.bookingTitle ?? undefined,
			meetingUrl: rescheduled.meetingUrl ?? record.meetingUrl ?? undefined
		};
		try {
			const updated = await updateConfirmedHackathon(id, next, booking);
			return json({ hackathon: toPublicHackathon(updated) });
		} catch (error) {
			await reschedulePrepCall(booking.uid ?? record.bookingUid, current.consultationSlot, fetch, record.demoMode).catch(() => undefined);
			throw error;
		}
	} catch (error) {
		if (error instanceof HackathonUpdateError) return json({ message: error.message }, { status: 400 });
		if (error instanceof BookingProviderError) return json({ message: error.message }, { status: error.status });
		console.error('Hackathon update failed', error);
		return json({ message: 'Die Änderungen konnten nicht gespeichert werden. Bitte versuchen Sie es erneut.' }, { status: 503 });
	}
}
