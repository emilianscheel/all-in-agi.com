import { isHackathonId } from '$lib/public-id';
import { requireAdmin } from '$lib/server/admin-auth';
import { cancelHackathonBooking } from '$lib/server/cancel-hackathon';
import { json } from '@sveltejs/kit';

export async function POST({ params, locals, fetch }) {
	requireAdmin(locals);
	const id = params.id.toUpperCase();
	if (!isHackathonId(id)) return json({ message: 'Hackathon nicht gefunden.' }, { status: 404 });
	const result = await cancelHackathonBooking(id, fetch);
	if (!result.found) return json({ message: 'Hackathon nicht gefunden.' }, { status: 404 });
	return json(result.state, { status: result.state.complete ? 200 : 202 });
}

