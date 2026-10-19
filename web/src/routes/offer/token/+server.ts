import { isOfferConfiguration } from '$lib/offer';
import { requireAdmin } from '$lib/server/admin-auth';
import { encryptOffer } from '$lib/server/offer-token';
import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
	requireAdmin(locals);
	try {
		const config = await request.json();
		if (!isOfferConfiguration(config)) return json({ message: locals.locale === 'en' ? 'Invalid offer data.' : 'Ungültige Angebotsdaten.' }, { status: 400 });
		return json({ token: await encryptOffer(config) });
	} catch (error) {
		return json({ message: error instanceof Error ? error.message : (locals.locale === 'en' ? 'The offer link could not be created.' : 'Angebots-Link konnte nicht erstellt werden.') }, { status: 400 });
	}
}
