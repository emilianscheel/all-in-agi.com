import { seedAdminName } from '$lib/server/admin-auth';
import { getDashboardCombinedSummary } from '$lib/server/admin-users';

export async function load({ locals }) {
	const seedName = seedAdminName();
	if (!locals.admin.authorized) return { summary: null, seedAdminName: seedName };
	return { summary: await getDashboardCombinedSummary(), seedAdminName: seedName };
}
