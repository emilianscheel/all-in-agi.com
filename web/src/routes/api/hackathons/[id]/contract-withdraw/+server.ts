import { localeMessage } from '$lib/locale-message';
import { isHackathonId } from '$lib/public-id';
import { requireAdmin } from '$lib/server/admin-auth';
import { withdrawContract } from '$lib/server/legal-contracts';
import { json } from '@sveltejs/kit';

export async function POST({ params, request, locals }: { params: { id: string }; request: Request; locals: App.Locals }) {
	requireAdmin(locals);
	const say = (de: string, en: string) => localeMessage(locals.locale, de, en);
	const id = params.id.toUpperCase();
	if (!isHackathonId(id)) return json({ message: say('Hackathon nicht gefunden.', 'Hackathon not found.') }, { status: 404 });
	let body: { by?: 'customer' | 'organizer'; reason?: string };
	try { body = await request.json(); } catch { return json({ message: say('Die Rücktrittsdaten sind ungültig.', 'The withdrawal details are invalid.') }, { status: 400 }); }
	if (body.by !== 'customer' && body.by !== 'organizer') return json({ message: say('Die zurücktretende Partei fehlt.', 'The withdrawing party is missing.') }, { status: 400 });
	const record = await withdrawContract(id, body.by, body.reason ?? '');
	if (!record) return json({ message: say('Das kostenlose Lösungsrecht ist nicht verfügbar.', 'The free withdrawal right is not available.') }, { status: 409 });
	return json({ status: record.status, withdrawnAt: record.withdrawnAt });
}

