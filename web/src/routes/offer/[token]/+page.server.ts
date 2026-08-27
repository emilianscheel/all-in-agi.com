import { OFFER_ACCESS_COOKIE, hasOfferAccess } from '$lib/server/offer-access';
import { decryptOffer } from '$lib/server/offer-token';
import { error } from '@sveltejs/kit';

export async function load({ cookies, params }) {
	if (!await hasOfferAccess(cookies.get(OFFER_ACCESS_COOKIE))) return { authorized: false };
	try {
		return { authorized: true, config: await decryptOffer(params.token) };
	} catch {
		error(404, 'Angebot nicht gefunden');
	}
}
