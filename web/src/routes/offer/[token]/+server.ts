import { isOfferConfiguration } from '$lib/offer';
import { isOfferId } from '$lib/public-id';
import { requireAdmin } from '$lib/server/admin-auth';
import { attachOfferToBooking, updateOfferConfig } from '$lib/server/offers';
import { json } from '@sveltejs/kit';

function message(locale: App.Locals['locale'], de: string, en: string) {
	return locale === 'en' ? en : de;
}

export async function PATCH({ params, request, locals }) {
	requireAdmin(locals);
	const id = params.token.toUpperCase();
	if (!isOfferId(id)) return json({ message: message(locals.locale, 'Angebot nicht gefunden.', 'Offer not found.') }, { status: 404 });
	let body: unknown;
	try { body = await request.json(); } catch {
		return json({ message: message(locals.locale, 'Ungültige Angebotsdaten.', 'Invalid offer data.') }, { status: 400 });
	}
	if (body && typeof body === 'object' && 'hackathonId' in body && !('v' in body)) {
		const raw = (body as { hackathonId?: unknown }).hackathonId;
		const hackathonId = raw === null || raw === '' ? null : raw;
		if (hackathonId !== null && typeof hackathonId !== 'string') {
			return json({ message: message(locals.locale, 'Die Buchung ist ungültig.', 'The booking is invalid.') }, { status: 400 });
		}
		const result = await attachOfferToBooking(id, hackathonId);
		if (!result.ok) {
			const missing = result.status === 404;
			return json({
				message: message(
					locals.locale,
					missing ? 'Die Buchung wurde nicht gefunden.' : 'Die Buchung ist ungültig.',
					missing ? 'The booking was not found.' : 'The booking is invalid.'
				)
			}, { status: result.status });
		}
		return json({ ok: true, hackathonId: result.hackathonId });
	}
	if (!isOfferConfiguration(body)) return json({ message: message(locals.locale, 'Ungültige Angebotsdaten.', 'Invalid offer data.') }, { status: 400 });
	const updated = await updateOfferConfig(id, body);
	if (!updated) return json({ message: message(locals.locale, 'Angebot nicht gefunden.', 'Offer not found.') }, { status: 404 });
	return json({ ok: true });
}
