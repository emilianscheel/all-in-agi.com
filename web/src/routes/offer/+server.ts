import { requireAdmin } from '$lib/server/admin-auth';
import { createOffer } from '$lib/server/offers';
import { json } from '@sveltejs/kit';

export async function POST({ locals }) {
	requireAdmin(locals);
	const offer = await createOffer(locals.locale);
	return json({ id: offer.id });
}
