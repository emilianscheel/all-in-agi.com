import { requireAdmin } from '$lib/server/admin-auth';
import { createOfferService } from '$lib/server/offer-catalog';
import { json } from '@sveltejs/kit';

function message(locale: App.Locals['locale'], de: string, en: string) {
	return locale === 'en' ? en : de;
}

export async function POST({ locals, request }) {
	requireAdmin(locals);
	let body: unknown;
	try { body = await request.json(); } catch {
		return json({ message: message(locals.locale, 'Die Leistung ist ungültig.', 'The service is invalid.') }, { status: 400 });
	}
	const label = body && typeof body === 'object' && 'label' in body && typeof body.label === 'string' ? body.label : '';
	const icon = body && typeof body === 'object' && 'icon' in body && typeof body.icon === 'string' ? body.icon : '';
	const service = await createOfferService(label, icon);
	if (!service) return json({ message: message(locals.locale, 'Die Leistung ist ungültig.', 'The service is invalid.') }, { status: 400 });
	return json(service);
}
