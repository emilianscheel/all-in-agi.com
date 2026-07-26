import { validateConfiguration } from '$lib/booking';
import { eventDurationMinutes } from '$lib/event-time';
import { applyHackathonUpdate, HackathonUpdateError, parseHackathonUpdate } from '$lib/hackathon-edit';
import { isHackathonId } from '$lib/public-id';
import {
	bookHackathonDay,
	cancelCalBooking,
	rescheduleHackathonDay,
	reschedulePrepCall,
	BookingProviderError
} from '$lib/server/cal-booking';
import {
	getConfirmedHackathonRecord,
	recordToBookingConfiguration,
	recordToHackathonBookingSummary,
	toPublicHackathon,
	updateConfirmedHackathon,
	type ConfirmedBooking
} from '$lib/server/hackathons';
import { dev } from '$app/environment';
import { json } from '@sveltejs/kit';

function confirmedFromRecord(record: NonNullable<Awaited<ReturnType<typeof getConfirmedHackathonRecord>>>): ConfirmedBooking {
	return { status: 'success', demo: record.demoMode, ...recordToHackathonBookingSummary(record) };
}

export async function PATCH({ params, request, fetch }) {
	const id = params.id.toUpperCase();
	if (!isHackathonId(id)) return json({ message: 'Hackathon nicht gefunden.' }, { status: 404 });
	const record = await getConfirmedHackathonRecord(id);
	if (!record) return json({ message: 'Hackathon nicht gefunden.' }, { status: 404 });

	let body: unknown;
	try { body = await request.json(); }
	catch { return json({ message: 'Die Änderungen sind ungültig.' }, { status: 400 }); }

	try {
		const update = parseHackathonUpdate(body);
		const current = recordToBookingConfiguration(record);
		const next = applyHackathonUpdate(current, update);
		const errors = validateConfiguration(next);
		if (errors.length) return json({ message: errors[0], errors }, { status: 400 });

		if (update.section === 'prep-call' && next.consultationSlot !== current.consultationSlot) {
			const rescheduled = await reschedulePrepCall(record.prepCallBookingUid, next.consultationSlot, fetch, record.demoMode);
			const booking = {
				...rescheduled,
				icsUid: rescheduled.icsUid ?? record.prepCallBookingIcsUid ?? undefined,
				title: rescheduled.title ?? record.prepCallBookingTitle ?? undefined,
				meetingUrl: rescheduled.meetingUrl ?? record.prepCallMeetingUrl ?? undefined
			};
			try {
				const updated = await updateConfirmedHackathon(id, next, { prepCallBooking: booking });
				return json({ hackathon: toPublicHackathon(updated) });
			} catch (error) {
				await reschedulePrepCall(booking.uid ?? record.prepCallBookingUid, current.consultationSlot, fetch, record.demoMode).catch(() => undefined);
				throw error;
			}
		}

		if (update.section === 'event-time' && (next.eventStart !== current.eventStart || next.eventEnd !== current.eventEnd)) {
			const currentBooking = confirmedFromRecord(record);
			if (!record.hackathonBookingUid) {
				const created = await bookHackathonDay(next, fetch, dev);
				try {
					const updated = await updateConfirmedHackathon(id, next, { hackathonBooking: created });
					return json({ hackathon: toPublicHackathon(updated) });
				} catch (error) {
					await cancelCalBooking(created, fetch).catch(() => undefined);
					throw error;
				}
			}
			const durationChanged = eventDurationMinutes(next.eventStart, next.eventEnd) !== eventDurationMinutes(current.eventStart, current.eventEnd);
			if (!durationChanged) {
				const rescheduled = await rescheduleHackathonDay(record.hackathonBookingUid, next.eventStart, next.eventEnd, fetch, record.demoMode);
				const booking = {
					...rescheduled,
					icsUid: rescheduled.icsUid ?? record.hackathonBookingIcsUid ?? undefined,
					title: rescheduled.title ?? record.hackathonBookingTitle ?? undefined
				};
				try {
					const updated = await updateConfirmedHackathon(id, next, { hackathonBooking: booking });
					return json({ hackathon: toPublicHackathon(updated) });
				} catch (error) {
					await rescheduleHackathonDay(booking.uid ?? record.hackathonBookingUid, current.eventStart, current.eventEnd, fetch, record.demoMode).catch(() => undefined);
					throw error;
				}
			}

			await cancelCalBooking(currentBooking, fetch);
			let replacement: ConfirmedBooking;
			try {
				replacement = await bookHackathonDay(next, fetch, dev);
			} catch (error) {
				const restored = await bookHackathonDay(current, fetch, dev).catch(() => undefined);
				if (restored) await updateConfirmedHackathon(id, current, { hackathonBooking: restored }).catch(() => undefined);
				throw error;
			}
			try {
				const updated = await updateConfirmedHackathon(id, next, { hackathonBooking: replacement });
				return json({ hackathon: toPublicHackathon(updated) });
			} catch (error) {
				await cancelCalBooking(replacement, fetch).catch(() => undefined);
				const restored = await bookHackathonDay(current, fetch, dev).catch(() => undefined);
				if (restored) await updateConfirmedHackathon(id, current, { hackathonBooking: restored }).catch(() => undefined);
				throw error;
			}
		}

		const updated = await updateConfirmedHackathon(id, next);
		return json({ hackathon: toPublicHackathon(updated) });
	} catch (error) {
		if (error instanceof HackathonUpdateError) return json({ message: error.message }, { status: 400 });
		if (error instanceof BookingProviderError) return json({ message: error.message, field: error.field }, { status: error.status });
		console.error('Hackathon update failed', error);
		return json({ message: 'Die Änderungen konnten nicht gespeichert werden. Bitte versuchen Sie es erneut.' }, { status: 503 });
	}
}
