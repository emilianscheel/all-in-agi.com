import { listAdminUsers, getAdminUserSummary } from '$lib/server/admin-users';
import { redirect } from '@sveltejs/kit';
import { localizedPath } from '$lib/i18n';

export async function load({ locals }) {
	if (!locals.admin.authorized) {
		redirect(303, localizedPath(locals.locale, '/dashboard'));
	}
	const [users, summary] = await Promise.all([listAdminUsers(), getAdminUserSummary()]);
	return { users, summary };
}
