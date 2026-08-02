import { isHackathonId } from '$lib/public-id';
import { requireAdmin } from '$lib/server/admin-auth';
import { markContractCompleted } from '$lib/server/legal-contracts';
import { json } from '@sveltejs/kit';

export async function POST({ params, locals }: { params: { id: string }; locals: App.Locals }) {
	requireAdmin(locals);
	const id = params.id.toUpperCase();
	if (!isHackathonId(id)) return json({ message: 'Hackathon nicht gefunden.' }, { status: 404 });
	const record = await markContractCompleted(id, locals.user?.email ?? 'admin');
	if (!record) return json({ message: 'Der Vertrag kann in diesem Status nicht abgeschlossen werden.' }, { status: 409 });
	return json({ status: record.status });
}
