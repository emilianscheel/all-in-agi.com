import { createPlanPdf } from '$lib/booking-artifacts';
import { validateInquiryConfiguration, type BookingConfiguration } from '$lib/booking';
import { isHackathonId } from '$lib/public-id';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
	try {
		const body = await request.json() as Partial<BookingConfiguration> & { hackathonId?: unknown };
		let hackathonId: string | undefined;
		if (body.hackathonId !== undefined) {
			if (typeof body.hackathonId !== 'string') {
				return json({ message: 'Die Hackathon-ID ist ungültig.' }, { status: 400 });
			}
			hackathonId = body.hackathonId.toUpperCase();
			if (!isHackathonId(hackathonId)) {
				return json({ message: 'Die Hackathon-ID ist ungültig.' }, { status: 400 });
			}
		}
		const config = { ...body, message: typeof body.message === 'string' ? body.message : '' } as BookingConfiguration;
		const errors = validateInquiryConfiguration(config);
		if (errors.length) return json({ message: errors[0] }, { status: 400 });
		const bytes = await createPlanPdf(config, { hackathonId });
		return new Response(new Blob([bytes as Uint8Array<ArrayBuffer>]), { headers: { 'content-type': 'application/pdf', 'content-disposition': 'attachment; filename="all-in-agi-hackathon-plan.pdf"', 'cache-control': 'no-store' } });
	} catch { return json({ message: 'Die PDF konnte nicht erstellt werden.' }, { status: 500 }); }
}
