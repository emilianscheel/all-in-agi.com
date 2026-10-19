import { configurationDateChecks, validateBillingDetails, validateConfiguration } from '$lib/booking';
import { localeMessage } from '$lib/locale-message';
import { eventDurationMinutes } from '$lib/event-time';
import { applyHackathonUpdate, HackathonUpdateError, parseHackathonUpdate } from '$lib/hackathon-edit';
import { isHackathonId } from '$lib/public-id';
import {
	bookHackathonDay,
	assertHackathonDayAvailable,
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
import { recordBillingDetailsUpdated } from '$lib/server/legal-contracts';
import { dev } from '$app/environment';
import { json } from '@sveltejs/kit';

function confirmedFromRecord(record: NonNullable<Awaited<ReturnType<typeof getConfirmedHackathonRecord>>>, locale: App.Locals['locale']): ConfirmedBooking {
	const summary = recordToHackathonBookingSummary(record);
	if (!summary) throw new HackathonUpdateError(localeMessage(locale, 'Für diesen Hackathon ist noch keine Kalenderbuchung vorhanden.', 'This hackathon does not have a calendar booking yet.'));
	return { status: 'success', demo: record.demoMode, ...summary };
}

export async function PATCH({ params, request, fetch, locals }) {
	const id = params.id.toUpperCase();
	const say = (de: string, en: string) => localeMessage(locals.locale, de, en);
	if (!isHackathonId(id)) return json({ message: say('Hackathon nicht gefunden.', 'Hackathon not found.') }, { status: 404 });
	const record = await getConfirmedHackathonRecord(id);
	if (!record) return json({ message: say('Hackathon nicht gefunden.', 'Hackathon not found.') }, { status: 404 });

	let body: unknown;
	try { body = await request.json(); }
	catch { return json({ message: say('Die Änderungen sind ungültig.', 'The changes are invalid.') }, { status: 400 }); }

	try {
		const update = parseHackathonUpdate(body, locals.locale);
		const priceAffecting = ['capacity', 'venue', 'tools', 'devices', 'lunch'].includes(update.section);
		if (priceAffecting && (record.invoiceSnapshot || record.downPaymentInvoiceSnapshot)) {
			return json({ message: say('Preisrelevante Angaben können nach Ausstellung einer Rechnung nicht mehr geändert werden.', 'Price-related details cannot be changed after an invoice has been issued.') }, { status: 409 });
		}
		const current = recordToBookingConfiguration(record);
		const next = applyHackathonUpdate(current, update);
		const errors = validateConfiguration({ ...next, locale: locals.locale }, configurationDateChecks(update.section));
		if (update.section === 'billing') errors.push(...validateBillingDetails(next.billing, locals.locale));
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
			await assertHackathonDayAvailable(next, fetch, dev, record.hackathonBookingUid ?? undefined);
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
			if (!next.eventStart || !next.eventEnd) throw new HackathonUpdateError(say('Bitte wählen Sie einen gültigen Hackathon-Termin.', 'Please select a valid hackathon date.'));
			const currentBooking = confirmedFromRecord(record, locals.locale);
			if (!current.eventStart || !current.eventEnd) throw new HackathonUpdateError(say('Die bestehende Kalenderbuchung hat keinen gültigen Termin.', 'The existing calendar booking does not have a valid time.'));
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

		const updated = await updateConfirmedHackathon(id, next, {}, priceAffecting);
		if (update.section === 'billing') await recordBillingDetailsUpdated(id, locals.admin.authorized ? 'admin' : 'customer');
		return json({ hackathon: toPublicHackathon(updated) });
	} catch (error) {
		if (error instanceof HackathonUpdateError) return json({ message: error.message }, { status: 400 });
		if (error instanceof BookingProviderError) return json({ message: locals.locale === 'en' ? error.englishMessage : error.message, field: error.field }, { status: error.status });
		console.error('Hackathon update failed', error);
		return json({ message: say('Die Änderungen konnten nicht gespeichert werden. Bitte versuchen Sie es erneut.', 'The changes could not be saved. Please try again.') }, { status: 503 });
	}
}
