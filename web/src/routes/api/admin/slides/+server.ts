import { dev } from '$app/environment';
import { requireAdmin } from '$lib/server/admin-auth';
import { createSlide } from '$lib/server/slides';
import { json } from '@sveltejs/kit';

export async function POST({ locals }) {
	if (!dev) requireAdmin(locals);
	try {
		return json(await createSlide());
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Die Folie konnte nicht angelegt werden.';
		return json({ message }, { status: 400 });
	}
}
