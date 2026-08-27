import { isOfferConfiguration } from '$lib/offer';
import { OFFER_ACCESS_COOKIE, hasOfferAccess } from '$lib/server/offer-access';
import { encryptOffer } from '$lib/server/offer-token';
import { json } from '@sveltejs/kit';

// This endpoint intentionally lives below /offer so it receives the access
// cookie, which is deliberately scoped to that private area.
export async function POST({ request, cookies }) {
	if (!await hasOfferAccess(cookies.get(OFFER_ACCESS_COOKIE))) return json({ message: 'Nicht autorisiert.' }, { status: 401 });
	try {
		const config = await request.json();
		if (!isOfferConfiguration(config)) return json({ message: 'Ungültige Angebotsdaten.' }, { status: 400 });
		return json({ token: await encryptOffer(config) });
	} catch (error) {
		return json({ message: error instanceof Error ? error.message : 'Angebots-Link konnte nicht erstellt werden.' }, { status: 400 });
	}
}
