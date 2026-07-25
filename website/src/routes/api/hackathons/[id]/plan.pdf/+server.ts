import { createPlanPdf } from '$lib/booking-artifacts';
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
	const bytes = await createPlanPdf(recordToBookingConfiguration(record), {
		includeContact: false,
		booking: recordToBookingSummary(record),
		hackathonId: id
	});
	return new Response(new Blob([bytes as Uint8Array<ArrayBuffer>]), {
		headers: {
			'content-type': 'application/pdf',
			'content-disposition': `attachment; filename="all-in-agi-hackathon-${id}.pdf"`,
			'cache-control': 'private, no-store'
		}
	});
}
