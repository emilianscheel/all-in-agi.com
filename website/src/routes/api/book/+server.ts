import { dev } from '$app/environment';
import { validateConfiguration, type BookingConfiguration } from '$lib/booking';
import { completeHackathonBooking } from '$lib/server/book-hackathon';
import { bookPrepCall, BookingProviderError } from '$lib/server/cal-booking';
import { json } from '@sveltejs/kit';

export async function POST({ request, fetch }) {
	let config: BookingConfiguration;
	try { config = await request.json(); } catch { return json({ message: 'Die Buchungsdaten sind ungültig.' }, { status: 400 }); }
	const errors = validateConfiguration(config);
	if (errors.length) return json({ message: errors[0], errors }, { status: 400 });
	try {
		const { id, booking } = await completeHackathonBooking(config, (bookingConfig) => bookPrepCall(bookingConfig, fetch, dev));
		return json({ ...booking, hackathonId: id, detailUrl: `/${id}` }, { status: 201 });
	} catch (error) {
		if (error instanceof BookingProviderError) return json({ message: error.message }, { status: error.status });
		console.error('Hackathon booking failed', error);
		return json({ message: 'Die Buchung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.' }, { status: 503 });
	}
}
