import { dev } from '$app/environment';
import { requireAdmin } from '$lib/server/admin-auth';
import { saveSlideSource } from '$lib/server/slides';
import { json } from '@sveltejs/kit';

export async function PUT({ params, locals, request }) {
	if (!dev) requireAdmin(locals);
	const body = await request.json().catch(() => null) as { source?: unknown } | null;
	if (!body || typeof body.source !== 'string') return json({ message: 'Text fehlt.' }, { status: 400 });
	try {
		await saveSlideSource(params.id, body.source);
		return json({ ok: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Speichern fehlgeschlagen.';
		const status = message.includes('nicht gefunden') ? 404 : 400;
		return json({ message }, { status });
	}
}
