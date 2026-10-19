import { describe, expect, test } from 'bun:test';
import { CONTACT_EMAIL } from '$lib/contact';
import type { InvoiceSnapshot } from '$lib/invoice';
import type { HackathonRecord } from '$lib/server/hackathons';
import { _createInvoiceEmailTestPost } from './+server';
import { _createDownPaymentEmailTestPost } from '../down-payment-email-test/+server';

const adminLocals = {
	admin: { authenticated: true, authorized: true, needsPasskey: false },
	user: { id: 'admin-1', email: 'admin@example.com' },
	locale: 'en'
} as App.Locals

function record(): HackathonRecord {
	return {
		id: 'HAA-AAA-AAA', status: 'confirmed', companyName: 'Musterwerke', contactName: 'Ada', contactEmail: 'ada@example.com',
		address: { street: 'Musterstraße 1', postalCode: '10115', city: 'Berlin', country: 'Deutschland' },
		billing: { companyName: 'Musterwerke', legalForm: '', contactName: 'Ada', email: 'rechnung@example.com', vatId: '', purchaseOrder: '', address: { street: 'Musterstraße 1', postalCode: '10115', city: 'Berlin', country: 'Deutschland' } },
		eventStart: '2099-06-20T07:00:00.000Z', eventEnd: '2099-06-20T15:00:00.000Z', capacity: 15, basePrice: 4000,
		venueSurcharge: 0, lunchAdjustment: 0, toolsAdjustment: 0, deviceCount: 0, devicesAdjustment: 0, totalPrice: 4000,
		invoiceSnapshot: null, billingModel: 'legacy_full'
	} as HackathonRecord;
}

describe('invoice test email', () => {
	test('sends a preview to the organizer without freezing the invoice', async () => {
		let delivery: { to?: { address: string }; subjectPrefix?: string } | undefined;
		let frozen = false;
		const post = _createInvoiceEmailTestPost({
			getRecord: async () => record(),
			getConfiguration: () => ({
				taxIdLabel: 'USt-IdNr.', taxIdValue: 'DE123456789', accountHolder: 'Emilian Scheel',
				iban: 'DE02120300000000202051', bic: 'BYLADEM1001'
			}),
			now: () => new Date('2099-05-01T10:00:00.000Z'),
			freeze: async () => { frozen = true; return null; },
			send: async (_snapshot: InvoiceSnapshot, _dependencies, options) => {
				delivery = options;
				return { messageId: 'test-mail', status: 'accepted' };
			}
		});
		const response = await post({ params: { id: 'HAA-AAA-AAA' }, locals: adminLocals });
		expect(response.status).toBe(200);
		expect(frozen).toBe(false);
		expect(delivery?.to?.address).toBe(CONTACT_EMAIL);
		expect(delivery?.subjectPrefix).toBe('[TEST] ');
	});

	test('sends a deposit invoice preview without marking it sent', async () => {
		let marked = false;
		const current = { ...record(), billingModel: 'deposit_30' as const };
		const post = _createDownPaymentEmailTestPost({
			getRecord: async () => current,
			getConfiguration: () => ({
				taxIdLabel: 'USt-IdNr.', taxIdValue: 'DE123456789', accountHolder: 'Emilian Scheel',
				iban: 'DE02120300000000202051', bic: 'BYLADEM1001'
			}),
			now: () => new Date('2099-05-01T10:00:00.000Z'),
			freezeDownPayment: async () => { marked = true; return null; },
			send: async () => ({ messageId: 'deposit-test', status: 'accepted' })
		});
		const response = await post({ params: { id: 'HAA-AAA-AAA' }, locals: adminLocals });
		expect(response.status).toBe(200);
		expect(marked).toBe(false);
		expect(current.downPaymentInvoiceSnapshot).toBeUndefined();
	});
});
