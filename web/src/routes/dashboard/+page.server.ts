import { getDashboardBookings } from '$lib/server/admin-bookings';

export async function load({ locals }) {
	if (!locals.admin.authorized) return { bookings: [], summary: null };
	return getDashboardBookings();
}

