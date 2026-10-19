import { getDashboardBookings } from '$lib/server/admin-bookings';
import { redirect } from '@sveltejs/kit';
import { localizedPath } from '$lib/i18n';

export async function load({ locals }) {
	if (!locals.admin.authorized) {
		redirect(303, localizedPath(locals.locale, '/dashboard'));
	}
	return getDashboardBookings();
}
