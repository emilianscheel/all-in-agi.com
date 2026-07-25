import { createPrepCallIcs } from '$lib/booking-ics';
import { isHackathonId } from '$lib/public-id';
import {
	getConfirmedHackathonRecord,
	recordToBookingConfiguration,
	recordToBookingSummary
} from '$lib/server/hackathons';
import { error } from '@sveltejs/kit';

export async function GET({ params }) {
	const id = params.id.toUpperCase();
	if (!isHackathonId(id)) error(404, 'Hackathon nicht gefunden');
	const record = await getConfirmedHackathonRecord(id);
	if (!record) error(404, 'Hackathon nicht gefunden');
	const calendar = createPrepCallIcs(recordToBookingConfiguration(record), recordToBookingSummary(record));
	return new Response(calendar, {
		headers: {
			'content-type': 'text/calendar; charset=utf-8',
			'content-disposition': `attachment; filename="all-in-agi-prep-call-${id}.ics"`,
			'cache-control': 'private, no-store'
		}
	});
}
