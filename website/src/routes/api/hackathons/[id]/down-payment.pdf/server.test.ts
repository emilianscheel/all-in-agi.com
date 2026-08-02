import { describe, expect, test } from 'bun:test';
import type { InvoiceLegalConfiguration } from '$lib/invoice';
import type { HackathonRecord } from '$lib/server/hackathons';
import { _createDownPaymentPdfPost } from './+server';

const legal: InvoiceLegalConfiguration = {
	taxIdLabel: 'USt-IdNr.', taxIdValue: 'DE123456789', accountHolder: 'Emilian Scheel',
	iban: 'DE02120300000000202051', bic: 'BYLADEM1001'
};
const adminLocals = {
	admin: { authenticated: true, authorized: true, needsPasskey: false },
	user: { id: 'admin-1', email: 'admin@example.com' }
} as App.Locals;

function record(): HackathonRecord {
	return {
		id: 'HAA-AAA-AAA', status: 'confirmed', billingModel: 'deposit_30', companyName: 'Musterwerke', contactName: 'Ada', contactEmail: 'ada@example.com',
		billing: { companyName: 'Musterwerke', legalForm: '', contactName: 'Ada', email: 'rechnung@example.com', vatId: '', purchaseOrder: '', address: { street: 'Musterstraße 1', postalCode: '10115', city: 'Berlin', country: 'Deutschland' } },
		address: { street: 'Musterstraße 1', postalCode: '10115', city: 'Berlin', country: 'Deutschland' }, eventStart: '2099-06-20T07:00:00.000Z',
		capacity: 15, basePrice: 4000, venueSurcharge: 500, lunchAdjustment: 0, toolsAdjustment: 500, deviceCount: 0, devicesAdjustment: 0, totalPrice: 5000,
		downPaymentInvoiceSnapshot: null, invoiceSnapshot: null
	} as HackathonRecord;
}

describe('down-payment PDF endpoint', () => {
	test('requires an authorized admin', async () => {
		const post = _createDownPaymentPdfPost();
		await expect(post({
			params: { id: 'HAA-AAA-AAA' },
			locals: { ...adminLocals, admin: { authenticated: false, authorized: false, needsPasskey: false }, user: null } as App.Locals
		})).rejects.toMatchObject({ status: 401 });
	});

	test('freezes and returns the 30 percent invoice', async () => {
		let current = record();
		const post = _createDownPaymentPdfPost({
			getRecord: async () => current,
			getConfiguration: () => legal,
			now: () => new Date('2099-05-01T10:00:00.000Z'),
			freezeDownPayment: async (_id, snapshot, issuedAt) => (current = { ...current, downPaymentInvoiceSnapshot: snapshot, downPaymentInvoiceIssuedAt: issuedAt }),
			createPdf: async (snapshot) => {
				expect(snapshot).toMatchObject({ version: 2, kind: 'down-payment', netTotalCents: 150000 });
				return new Uint8Array([37, 80, 68, 70]);
			}
		});
		const response = await post({ params: { id: 'haa-aaa-aaa' }, locals: adminLocals });
		expect(response.status).toBe(200);
		expect(response.headers.get('content-disposition')).toContain('all-in-agi-anzahlung-HAA-AAA-AAA.pdf');
	});
});
