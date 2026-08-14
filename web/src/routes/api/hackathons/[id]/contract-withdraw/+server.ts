import { isHackathonId } from '$lib/public-id';
import { requireAdmin } from '$lib/server/admin-auth';
import { withdrawContract } from '$lib/server/legal-contracts';
import { json } from '@sveltejs/kit';

export async function POST({ params, request, locals }: { params: { id: string }; request: Request; locals: App.Locals }) {
	requireAdmin(locals);
	const id = params.id.toUpperCase();
	if (!isHackathonId(id)) return json({ message: 'Hackathon nicht gefunden.' }, { status: 404 });
	let body: { by?: 'customer' | 'organizer'; reason?: string };
	try { body = await request.json(); } catch { return json({ message: 'Die Rücktrittsdaten sind ungültig.' }, { status: 400 }); }
	if (body.by !== 'customer' && body.by !== 'organizer') return json({ message: 'Die zurücktretende Partei fehlt.' }, { status: 400 });
	const record = await withdrawContract(id, body.by, body.reason ?? '');
	if (!record) return json({ message: 'Das kostenlose Lösungsrecht ist nicht verfügbar.' }, { status: 409 });
	return json({ status: record.status, withdrawnAt: record.withdrawnAt });
}

