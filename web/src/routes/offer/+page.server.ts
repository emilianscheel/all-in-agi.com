import { localizedPath } from '$lib/i18n';
import { createOffer, getLatestOffer } from '$lib/server/offers';
import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	if (!locals.admin.authorized) redirect(303, localizedPath(locals.locale, '/dashboard'));
	const latest = await getLatestOffer();
	const offer = latest ?? await createOffer(locals.locale);
	redirect(303, localizedPath(locals.locale, `/offer/${offer.id}`));
}
