import { requireAdmin } from '$lib/server/admin-auth';
import { createAdminUser, listAdminUsers } from '$lib/server/admin-users';
import { json } from '@sveltejs/kit';

export async function GET({ locals }) {
	requireAdmin(locals);
	const users = await listAdminUsers();
	return json({ users });
}

export async function POST({ request, locals }) {
	requireAdmin(locals);
	let body: { name?: string; email?: string };
	try {
		body = await request.json();
	} catch {
		return json({ message: 'Die Benutzerdaten sind ungültig.' }, { status: 400 });
	}
	try {
		const created = await createAdminUser({ name: body.name ?? '', email: body.email ?? '' });
		return json(created, { status: 201 });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Der Benutzer konnte nicht erstellt werden.';
		const status = message.includes('already exists') ? 409 : 400;
		return json({ message }, { status });
	}
}
