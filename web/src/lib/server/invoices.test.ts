import { describe, expect, test } from 'bun:test';
import type { InvoiceLegalConfiguration } from '$lib/invoice';
import { getOrCreateDownPaymentInvoice, getOrCreateInvoice, InvoiceNotIssuableError } from './invoices';
import type { HackathonRecord } from './hackathons';

const legal: InvoiceLegalConfiguration = {
	taxIdLabel: 'USt-IdNr.', taxIdValue: 'DE123456789', accountHolder: 'Emilian Scheel',
	iban: 'DE02120300000000202051', bic: 'BYLADEM1001'
};

function record(): HackathonRecord {
	return {
		id: 'HAA-AAA-AAA', status: 'confirmed', companyName: 'Musterwerke GmbH', contactName: 'Ada Beispiel',
		contactEmail: 'ada@example.com', address: { street: 'Musterstraße 1', postalCode: '10115', city: 'Berlin', country: 'Deutschland' },
		billing: { companyName: 'Musterwerke GmbH', legalForm: '', contactName: 'Ada Beispiel', email: 'rechnung@example.com', vatId: '', purchaseOrder: '', address: { street: 'Musterstraße 1', postalCode: '10115', city: 'Berlin', country: 'Deutschland' } },
		eventStart: '2099-06-20T07:00:00.000Z', eventEnd: '2099-06-20T15:00:00.000Z', capacity: 15, basePrice: 4000, venueSurcharge: 0,
		lunchAdjustment: 0, toolsAdjustment: 0, deviceCount: 0, devicesAdjustment: 0, totalPrice: 4000, invoiceSnapshot: null
	} as HackathonRecord;
}

describe('invoice persistence orchestration', () => {
	test('freezes one immutable snapshot across concurrent first requests', async () => {
		let current = record();
		let accepted = 0;
		const dependencies = {
			getRecord: async () => current,
			getConfiguration: () => legal,
			now: () => new Date('2099-05-01T10:00:00.000Z'),
			freeze: async (_id: string, snapshot: NonNullable<HackathonRecord['invoiceSnapshot']>, issuedAt: string) => {
				if (current.invoiceSnapshot) return null;
				accepted += 1;
				current = { ...current, invoiceSnapshot: snapshot, invoiceIssuedAt: issuedAt };
				return current;
			}
		};
		const [first, second] = await Promise.all([
			getOrCreateInvoice(current.id, dependencies),
			getOrCreateInvoice(current.id, dependencies)
		]);
		expect(accepted).toBe(1);
		expect(second.snapshot).toEqual(first.snapshot);

		current.companyName = 'Später geändert';
		const later = await getOrCreateInvoice(current.id, dependencies);
		expect(later.snapshot.customer.companyName).toBe('Musterwerke GmbH');
	});

	test('does not issue a new invoice for a cancelled booking', async () => {
		const cancelled = { ...record(), status: 'cancelled' as const };
		await expect(getOrCreateInvoice(cancelled.id, {
			getRecord: async () => cancelled,
			getConfiguration: () => legal
		})).rejects.toBeInstanceOf(InvoiceNotIssuableError);
	});

	test('keeps an already-issued invoice downloadable after cancellation', async () => {
		const confirmed = record();
		const snapshot = (await getOrCreateInvoice(confirmed.id, {
			getRecord: async () => confirmed,
			getConfiguration: () => legal,
			freeze: async (_id, value, issuedAt) => ({ ...confirmed, invoiceSnapshot: value, invoiceIssuedAt: issuedAt })
		})).snapshot;
		const cancelled = { ...confirmed, status: 'cancelled' as const, invoiceSnapshot: snapshot };
		const result = await getOrCreateInvoice(cancelled.id, { getRecord: async () => cancelled });
		expect(result.snapshot).toEqual(snapshot);
	});

	test('requires a received down payment and completed event before freezing the final invoice', async () => {
		let current = { ...record(), billingModel: 'deposit_30' as const };
		const downPayment = await getOrCreateDownPaymentInvoice(current.id, {
			getRecord: async () => current,
			getConfiguration: () => legal,
			now: () => new Date('2099-05-01T10:00:00.000Z'),
			freezeDownPayment: async (_id, snapshot, issuedAt) => {
				current = { ...current, downPaymentInvoiceSnapshot: snapshot, downPaymentInvoiceIssuedAt: issuedAt };
				return current;
			}
		});
		expect(downPayment.snapshot.invoiceNumber).toBe('RE-HAA-AAA-AAA-AZ');

		await expect(getOrCreateInvoice(current.id, {
			getRecord: async () => current,
			getConfiguration: () => legal,
			now: () => new Date('2099-06-21T10:00:00.000Z')
		})).rejects.toBeInstanceOf(InvoiceNotIssuableError);

		current = { ...current, downPaymentPaidAt: '2099-05-08T10:00:00.000Z' };
		const final = await getOrCreateInvoice(current.id, {
			getRecord: async () => current,
			getConfiguration: () => legal,
			now: () => new Date('2099-06-21T10:00:00.000Z'),
			freeze: async (_id, snapshot, issuedAt) => {
				current = { ...current, invoiceSnapshot: snapshot, invoiceIssuedAt: issuedAt };
				return current;
			}
		});
		expect(final.snapshot).toMatchObject({ version: 3, kind: 'final', netTotalCents: 280000 });
	});
});
