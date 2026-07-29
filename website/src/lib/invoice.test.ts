import { describe, expect, test } from 'bun:test';
import { createInvoiceSnapshot, formatInvoiceMoney, type InvoiceLegalConfiguration, type InvoiceSource } from './invoice';

const legal: InvoiceLegalConfiguration = {
	taxIdLabel: 'USt-IdNr.',
	taxIdValue: 'DE123456789',
	accountHolder: 'Emilian Scheel',
	iban: 'DE02120300000000202051',
	bic: 'BYLADEM1001'
};

const source: InvoiceSource = {
	id: 'HAA-AAA-AAA',
	companyName: 'Musterwerke GmbH',
	contactName: 'Ada Beispiel',
	contactEmail: 'ada@example.com',
	address: { street: 'Musterstraße 1', postalCode: '10115', city: 'Berlin', country: 'Deutschland' },
	eventStart: '2099-06-20T07:00:00.000Z',
	capacity: 30,
	basePrice: 5000,
	venueSurcharge: 1000,
	lunchAdjustment: -500,
	toolsAdjustment: 1000,
	totalPrice: 6500
};

describe('invoice snapshot', () => {
	test('creates a complete 19 percent VAT invoice with optional adjustments', () => {
		const result = createInvoiceSnapshot(source, legal, new Date('2099-05-01T10:00:00.000Z'));
		expect(result.invoiceNumber).toBe('RE-HAA-AAA-AAA');
		expect(result.issueDate).toBe('2099-05-01');
		expect(result.serviceDate).toBe('2099-06-20');
		expect(result.dueDate).toBe('2099-05-15');
		expect(result.items.map((item) => item.netAmountCents)).toEqual([500000, 100000, -50000, 100000]);
		expect(result.netTotalCents).toBe(650000);
		expect(result.vatAmountCents).toBe(123500);
		expect(result.grossTotalCents).toBe(773500);
		expect(result.customer.address.street).toBe('Musterstraße 1');
		expect(result.seller.taxIdValue).toBe('DE123456789');
		expect(formatInvoiceMoney(result.grossTotalCents)).toContain('7.735');
	});

	test('omits zero-value adjustments and rejects inconsistent totals', () => {
		const minimal = createInvoiceSnapshot({
			...source,
			venueSurcharge: 0,
			lunchAdjustment: 0,
			toolsAdjustment: 0,
			totalPrice: source.basePrice
		}, legal);
		expect(minimal.items).toHaveLength(1);
		expect(() => createInvoiceSnapshot({ ...source, totalPrice: 1 }, legal)).toThrow('do not match');
	});
});
