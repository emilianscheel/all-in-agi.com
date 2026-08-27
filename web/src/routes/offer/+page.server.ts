import { defaultOfferConfiguration } from '$lib/offer';
import { OFFER_ACCESS_COOKIE, hasOfferAccess } from '$lib/server/offer-access';

export async function load({ cookies }) {
	const authorized = await hasOfferAccess(cookies.get(OFFER_ACCESS_COOKIE));
	return authorized ? { authorized: true, config: defaultOfferConfiguration() } : { authorized: false };
}
