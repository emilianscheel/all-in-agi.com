import { getAdminLoginState } from '$lib/server/admin-auth';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
	let email = '';
	try {
		email = String((await request.json() as { email?: unknown }).email ?? '');
	} catch {
		return json({ message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' }, { status: 400 });
	}
	const state = await getAdminLoginState(email);
	if (!state) return json({ message: 'Die Anmeldedaten sind ungültig.' }, { status: 401 });
	return json(state);
}

