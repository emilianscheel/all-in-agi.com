import { getDashboardCombinedSummary } from '$lib/server/admin-users';

export async function load({ locals }) {
	if (!locals.admin.authorized) return { summary: null };
	return { summary: await getDashboardCombinedSummary() };
}
