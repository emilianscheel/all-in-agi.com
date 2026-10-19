import { requireAdmin } from '$lib/server/admin-auth';
import { deleteAdminUser } from '$lib/server/admin-users';
import { json } from '@sveltejs/kit';

export async function DELETE({ params, locals }) {
	const actor = requireAdmin(locals);
	try {
		const deleted = await deleteAdminUser(params.id, actor.id);
		return json(deleted);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Der Benutzer konnte nicht gelöscht werden.';
		const status = message.includes('not found') ? 404
			: message.includes('own account') || message.includes('last admin') ? 409
			: 400;
		return json({ message }, { status });
	}
}
