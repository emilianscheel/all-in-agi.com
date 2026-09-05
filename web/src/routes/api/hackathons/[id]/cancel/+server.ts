import { isHackathonId } from '$lib/public-id';
import { requireAdmin } from '$lib/server/admin-auth';
import { cancelHackathonBooking } from '$lib/server/cancel-hackathon';
import { getCustomerHackathonRecord } from '$lib/server/hackathons';
import { json } from '@sveltejs/kit';

export async function POST({ params, locals, fetch }) {
	requireAdmin(locals);
	const id = params.id.toUpperCase();
	if (!isHackathonId(id)) return json({ message: 'Hackathon nicht gefunden.' }, { status: 404 });
	const record = await getCustomerHackathonRecord(id);
	if (!record) return json({ message: 'Hackathon nicht gefunden.' }, { status: 404 });
	if (['contracted', 'confirmed'].includes(record.status) && !record.eventStart) {
		return json({ message: record.customerLocale === 'en' ? 'Set the hackathon date before cancelling this contracted booking.' : 'Legen Sie vor der Stornierung dieser vertraglichen Buchung den Hackathon-Termin fest.' }, { status: 409 });
	}
	const result = await cancelHackathonBooking(id, fetch);
	if (!result.found) return json({ message: 'Hackathon nicht gefunden.' }, { status: 404 });
	return json(result.state, { status: result.state.complete ? 200 : 202 });
}
