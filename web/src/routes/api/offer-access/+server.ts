import { OFFER_ACCESS_COOKIE, correctOfferPassword, offerAccessValue } from '$lib/server/offer-access';
import { json } from '@sveltejs/kit';

export async function POST({ request, cookies }) {
	try {
		const body = await request.json() as { password?: unknown };
		if (!correctOfferPassword(body.password)) return json({ message: 'Das Passwort ist nicht korrekt.' }, { status: 401 });
		cookies.set(OFFER_ACCESS_COOKIE, await offerAccessValue(), {
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			path: '/offer'
		});
		return json({ ok: true });
	} catch {
		return json({ message: 'Der Zugriff konnte nicht freigeschaltet werden.' }, { status: 400 });
	}
}
