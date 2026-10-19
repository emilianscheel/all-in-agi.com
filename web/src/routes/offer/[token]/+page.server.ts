import { localizedPath } from '$lib/i18n';
import { decryptOffer } from '$lib/server/offer-token';
import { error, redirect } from '@sveltejs/kit';

export async function load({ locals, params }) {
	if (!locals.admin.authorized) redirect(303, localizedPath(locals.locale, '/dashboard'));
	try {
		return { config: await decryptOffer(params.token) };
	} catch {
		error(404, locals.locale === 'en' ? 'Offer not found' : 'Angebot nicht gefunden');
	}
}
