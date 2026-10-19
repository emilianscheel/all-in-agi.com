import { defaultOfferConfiguration } from '$lib/offer';
import { localizedPath } from '$lib/i18n';
import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	if (!locals.admin.authorized) redirect(303, localizedPath(locals.locale, '/dashboard'));
	const config = { ...defaultOfferConfiguration(), locale: locals.locale };
	if (locals.locale === 'en') config.offerTitle = 'Offer: International hackathon';
	return { config };
}
