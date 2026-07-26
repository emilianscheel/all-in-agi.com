import { describe, expect, test } from 'bun:test';
import { buildCancellationEmailHtml, buildCancellationEmailText, sendBookingCancellationEmail } from './booking-cancellation-email';
import type { HackathonRecord } from './hackathons';

const record = {
	id: 'HAA-AAA-AAA', companyName: '<Musterwerke>', contactName: 'Ada & Co', contactEmail: 'ada@example.com',
	eventStart: '2099-06-20T07:00:00.000Z', eventEnd: '2099-06-20T15:00:00.000Z'
} as HackathonRecord;

describe('booking cancellation email', () => {
	test('uses the stored customer and escapes rich-text booking data', () => {
		expect(buildCancellationEmailText(record)).toContain('HAA-AAA-AAA');
		expect(buildCancellationEmailText(record)).toContain('Kalendertermine wurden ebenfalls storniert');
		const html = buildCancellationEmailHtml(record);
		expect(html).toContain('Ada &amp; Co');
		expect(html).toContain('&lt;Musterwerke&gt;');
	});

	test('sends one attachment-free customer message through the shared transport', async () => {
		let payload: any;
		const result = await sendBookingCancellationEmail(record, {
			accountId: 'account', apiToken: 'token',
			fetch: async (_input, init) => {
				payload = JSON.parse(String(init?.body));
				return new Response(JSON.stringify({ success: true, result: { queued: ['ada@example.com'], message_id: 'mail-1' } }), { status: 200 });
			}
		});
		expect(result.messageId).toBe('mail-1');
		expect(payload.to.address).toBe('ada@example.com');
		expect(payload.attachments).toBeUndefined();
	});
});

