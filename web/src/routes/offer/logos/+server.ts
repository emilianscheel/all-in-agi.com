import { requireAdmin } from '$lib/server/admin-auth';
import { createClientLogo } from '$lib/server/offer-catalog';
import { json } from '@sveltejs/kit';

function message(locale: App.Locals['locale'], de: string, en: string) {
	return locale === 'en' ? en : de;
}

export async function POST({ locals, request }) {
	requireAdmin(locals);
	let body: unknown;
	try { body = await request.json(); } catch {
		return json({ message: message(locals.locale, 'Das Logo ist ungültig.', 'The logo is invalid.') }, { status: 400 });
	}
	const name = body && typeof body === 'object' && 'name' in body && typeof body.name === 'string' ? body.name : '';
	const svg = body && typeof body === 'object' && 'svg' in body && typeof body.svg === 'string' ? body.svg : '';
	const logo = await createClientLogo(name, svg);
	if (!logo) return json({ message: message(locals.locale, 'Es sind nur SVG-Logos bis 100 KB möglich.', 'Only SVG logos up to 100 KB are accepted.') }, { status: 400 });
	return json(logo);
}
