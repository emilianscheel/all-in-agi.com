import { getDashboardBookings } from '$lib/server/admin-bookings';
import { seedAdminName } from '$lib/server/admin-auth';
import { redirect } from '@sveltejs/kit';
import { localizedPath } from '$lib/i18n';

export async function load({ locals }) {
	if (!locals.admin.authorized) {
		redirect(303, localizedPath(locals.locale, '/dashboard'));
	}
	const dashboard = await getDashboardBookings();
	return { ...dashboard, seedAdminName: seedAdminName() };
}
