import { describe, expect, test } from 'bun:test';
import { PDFDocument } from 'pdf-lib';
import { createInvoiceSnapshot, type InvoiceLegalConfiguration, type InvoiceSource } from './invoice';
import { createInvoicePdf } from './invoice-artifacts';

const legal: InvoiceLegalConfiguration = {
	taxIdLabel: 'USt-IdNr.', taxIdValue: 'DE123456789', accountHolder: 'Emilian Scheel',
	iban: 'DE02120300000000202051', bic: 'BYLADEM1001'
};
const source = {
	id: 'HAA-AAA-AAA', companyName: 'Musterwerke GmbH', contactName: 'Ada Beispiel', contactEmail: 'ada@example.com',
	address: { street: 'Musterstraße 1', postalCode: '10115', city: 'Berlin', country: 'Deutschland' },
	eventStart: '2099-06-20T07:00:00.000Z', capacity: 30, basePrice: 5000, venueSurcharge: 1000,
	lunchAdjustment: -500, toolsAdjustment: 1000, deviceCount: 0, devicesAdjustment: 0, totalPrice: 6500
} satisfies InvoiceSource;

describe('invoice PDF', () => {
	test('creates a substantial single-page branded document', async () => {
		const bytes = await createInvoicePdf(createInvoiceSnapshot(source, legal, new Date('2099-05-01T10:00:00.000Z')));
		const pdf = await PDFDocument.load(bytes);
		expect(pdf.getPageCount()).toBe(1);
		expect(bytes.length).toBeGreaterThan(10_000);
	});
});
