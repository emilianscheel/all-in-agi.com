import { bookingsCsv, listCustomerBookings } from '$lib/server/admin-bookings';
import { requireAdmin } from '$lib/server/admin-auth';

export async function GET({ locals }) {
	requireAdmin(locals);
	const csv = bookingsCsv(await listCustomerBookings());
	const date = new Date().toISOString().slice(0, 10);
	return new Response(csv, {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': `attachment; filename="all-in-agi-bookings-${date}.csv"`,
			'cache-control': 'private, no-store'
		}
	});
}

