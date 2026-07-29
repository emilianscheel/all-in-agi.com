import { describe, expect, test } from 'bun:test';
import { createInvoiceSnapshot, type InvoiceLegalConfiguration } from '$lib/invoice';
import { EmailTransportError } from '$lib/server/email-transport';
import type { HackathonRecord } from '$lib/server/hackathons';
import { _createInvoiceEmailPost } from './+server';

const legal: InvoiceLegalConfiguration = {
	taxIdLabel: 'USt-IdNr.', taxIdValue: 'DE123456789', accountHolder: 'Emilian Scheel',
	iban: 'DE02120300000000202051', bic: 'BYLADEM1001'
};
const source = {
	id: 'HAA-AAA-AAA', companyName: 'Musterwerke', contactName: 'Ada', contactEmail: 'ada@example.com',
	address: { street: 'Musterstraße 1', postalCode: '10115', city: 'Berlin', country: 'Deutschland' },
	eventStart: '2099-06-20T07:00:00.000Z', capacity: 15, basePrice: 4000, venueSurcharge: 0,
	lunchAdjustment: 0, toolsAdjustment: 0, totalPrice: 4000
};
const snapshot = createInvoiceSnapshot(source, legal, new Date('2099-05-01T10:00:00.000Z'));
const adminLocals = {
	admin: { authenticated: true, authorized: true, needsPasskey: false },
	user: { id: 'admin-1', email: 'admin@example.com' }
} as App.Locals;
const event = { params: { id: 'HAA-AAA-AAA' }, locals: adminLocals, fetch: globalThis.fetch };

function record(status: HackathonRecord['status'] = 'confirmed'): HackathonRecord {
	return { ...source, status, invoiceSnapshot: snapshot, invoiceIssuedAt: '2099-05-01T10:00:00.000Z' } as HackathonRecord;
}

describe('invoice email endpoint', () => {
	test('records accepted delivery and returns the timestamp used by the resend button', async () => {
		let marked: { id: string; messageId?: string; at?: string } | undefined;
		const post = _createInvoiceEmailPost({
			getRecord: async () => record(),
			send: async () => ({ messageId: 'mail-1', status: 'queued' }),
			nowIso: () => '2099-05-02T10:00:00.000Z',
			markSent: async (id, messageId, at) => {
				marked = { id, messageId, at };
				return { ...record(), invoiceEmailSentAt: at ?? null, invoiceEmailMessageId: messageId ?? null };
			}
		});
		const response = await post(event);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ sent: true, sentAt: '2099-05-02T10:00:00.000Z' });
		expect(marked).toEqual({ id: 'HAA-AAA-AAA', messageId: 'mail-1', at: '2099-05-02T10:00:00.000Z' });
	});

	test('does not mark failed delivery and rejects cancelled bookings', async () => {
		let marked = false;
		const failing = _createInvoiceEmailPost({
			getRecord: async () => record(),
			send: async () => { throw new EmailTransportError('offline', 'network'); },
			markSent: async () => { marked = true; return record(); }
		});
		expect((await failing(event)).status).toBe(502);
		expect(marked).toBe(false);

		const cancelled = _createInvoiceEmailPost({ getRecord: async () => record('cancelled') });
		expect((await cancelled(event)).status).toBe(409);
	});
});
