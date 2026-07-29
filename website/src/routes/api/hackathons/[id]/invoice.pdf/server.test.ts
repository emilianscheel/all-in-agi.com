import { describe, expect, test } from 'bun:test';
import type { InvoiceLegalConfiguration } from '$lib/invoice';
import { InvoiceConfigurationError } from '$lib/server/invoice-config';
import type { HackathonRecord } from '$lib/server/hackathons';
import { _createInvoicePdfPost } from './+server';

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
		id: 'HAA-AAA-AAA', status: 'confirmed', companyName: 'Musterwerke', contactName: 'Ada', contactEmail: 'ada@example.com',
		address: { street: 'Musterstraße 1', postalCode: '10115', city: 'Berlin', country: 'Deutschland' }, eventStart: '2099-06-20T07:00:00.000Z',
		capacity: 15, basePrice: 4000, venueSurcharge: 0, lunchAdjustment: 0, toolsAdjustment: 0, totalPrice: 4000,
		invoiceSnapshot: null
	} as HackathonRecord;
}

describe('invoice PDF endpoint', () => {
	test('requires an authorized admin', async () => {
		const post = _createInvoicePdfPost();
		await expect(post({
			params: { id: 'HAA-AAA-AAA' },
			locals: { ...adminLocals, admin: { authenticated: false, authorized: false, needsPasskey: false }, user: null } as App.Locals
		})).rejects.toMatchObject({ status: 401 });
	});

	test('returns a private PDF with the stable invoice filename', async () => {
		let current = record();
		const post = _createInvoicePdfPost({
			getRecord: async () => current,
			getConfiguration: () => legal,
			now: () => new Date('2099-05-01T10:00:00.000Z'),
			freeze: async (_id, snapshot, issuedAt) => (current = { ...current, invoiceSnapshot: snapshot, invoiceIssuedAt: issuedAt }),
			createPdf: async () => new Uint8Array([37, 80, 68, 70])
		});
		const response = await post({ params: { id: 'haa-aaa-aaa' }, locals: adminLocals });
		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('application/pdf');
		expect(response.headers.get('content-disposition')).toContain('all-in-agi-rechnung-HAA-AAA-AAA.pdf');
		expect(response.headers.get('cache-control')).toBe('private, no-store');
	});

	test('reports incomplete legal configuration without issuing an invoice', async () => {
		let frozen = false;
		const post = _createInvoicePdfPost({
			getRecord: async () => record(),
			getConfiguration: () => { throw new InvoiceConfigurationError(['taxIdValue']); },
			freeze: async () => { frozen = true; return null; }
		});
		const response = await post({ params: { id: 'HAA-AAA-AAA' }, locals: adminLocals });
		expect(response.status).toBe(503);
		expect(frozen).toBe(false);
	});
});
