import { createPlanPdf } from '$lib/booking-artifacts';
import { validateConfiguration, type BookingConfiguration } from '$lib/booking';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
	try {
		const config = await request.json() as BookingConfiguration;
		const errors = validateConfiguration(config);
		if (errors.length) return json({ message: errors[0] }, { status: 400 });
		const bytes = await createPlanPdf(config);
		return new Response(new Blob([bytes as Uint8Array<ArrayBuffer>]), { headers: { 'content-type': 'application/pdf', 'content-disposition': 'attachment; filename="all-in-agi-hackathon-plan.pdf"', 'cache-control': 'no-store' } });
	} catch { return json({ message: 'Die PDF konnte nicht erstellt werden.' }, { status: 500 }); }
}
