import { localeMessage } from '$lib/locale-message';
import { isHackathonId } from '$lib/public-id';
import { requireAdmin } from '$lib/server/admin-auth';
import { markContractCompleted } from '$lib/server/legal-contracts';
import { json } from '@sveltejs/kit';

export async function POST({ params, locals }: { params: { id: string }; locals: App.Locals }) {
	requireAdmin(locals);
	const say = (de: string, en: string) => localeMessage(locals.locale, de, en);
	const id = params.id.toUpperCase();
	if (!isHackathonId(id)) return json({ message: say('Hackathon nicht gefunden.', 'Hackathon not found.') }, { status: 404 });
	const record = await markContractCompleted(id, locals.user?.email ?? 'admin');
	if (!record) return json({ message: say('Der Vertrag kann in diesem Status nicht abgeschlossen werden.', 'The contract cannot be completed in this status.') }, { status: 409 });
	return json({ status: record.status });
}
