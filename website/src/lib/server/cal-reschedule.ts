import type { ConfirmedBooking } from './hackathons';

export class BookingProviderError extends Error {
	constructor(message: string, readonly status: number, readonly field?: 'hackathon' | 'prep-call') {
		super(message);
	}
}

export async function reschedulePrepCallWithToken(
	bookingUid: string | null,
	startValue: string,
	requestFetch: typeof fetch,
	demo: boolean,
	token?: string,
	options: { end?: string; title?: string; reason?: string; field?: 'hackathon' | 'prep-call' } = {}
): Promise<ConfirmedBooking> {
	const start = new Date(startValue);
	if (Number.isNaN(start.getTime())) throw new BookingProviderError('Der neue Termin ist ungültig.', 400, options.field);
	const end = options.end ? new Date(options.end) : new Date(start.getTime() + 60 * 60_000);
	if (demo) {
		const uid = bookingUid ?? `demo-${Date.now()}`;
		return {
			status: 'success',
			demo: true,
			uid,
			icsUid: `${uid}@all-in-agi.com`,
			title: options.title ?? 'ALL IN AGI Prep Call',
			start: start.toISOString(),
			end: end.toISOString(),
			meetingUrl: ''
		};
	}

	if (!token || !bookingUid) throw new BookingProviderError('Der gebuchte Termin kann derzeit nicht geändert werden.', 503, options.field);
	try {
		const response = await requestFetch(`https://api.cal.com/v2/bookings/${encodeURIComponent(bookingUid)}/reschedule`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'cal-api-version': '2026-02-25',
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				start: start.toISOString(),
				reschedulingReason: options.reason ?? 'Über die Hackathon-Detailseite geändert'
			})
		});
		const result = await response.json();
		if (!response.ok) {
			const conflict = response.status === 409 || /slot|available|conflict/i.test(JSON.stringify(result));
			throw new BookingProviderError(
				conflict
					? 'Dieser Termin wurde gerade vergeben. Bitte wählen Sie einen neuen Slot.'
					: options.field === 'hackathon' ? 'Der Hackathon-Termin konnte nicht geändert werden.' : 'Der Vorbereitungstermin konnte nicht geändert werden.',
				conflict ? 409 : response.status,
				options.field
			);
		}
		return {
			status: 'success',
			demo: false,
			uid: result.data?.uid ?? bookingUid,
			icsUid: result.data?.icsUid,
			title: result.data?.title,
			start: result.data?.start ?? start.toISOString(),
			end: result.data?.end ?? end.toISOString(),
			meetingUrl: result.data?.meetingUrl ?? result.data?.location ?? ''
		};
	} catch (error) {
		if (error instanceof BookingProviderError) throw error;
		throw new BookingProviderError('Der Kalenderdienst ist vorübergehend nicht erreichbar.', 502, options.field);
	}
}
