import { describe, expect, test } from 'bun:test';
import type { InvoiceLegalConfiguration } from '$lib/invoice';
import { getOrCreateDownPaymentInvoice, getOrCreateInvoice, InvoiceNotIssuableError, previewDownPaymentInvoice, previewDownPaymentInvoiceDraft, previewInvoice, previewInvoiceDraft } from './invoices';
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

	test('issues a standard invoice after the event has happened', async () => {
		const past = { ...record(), eventStart: '2020-06-20T07:00:00.000Z', eventEnd: '2020-06-20T15:00:00.000Z' };
		const result = await getOrCreateInvoice(past.id, {
			getRecord: async () => past,
			getConfiguration: () => legal,
			now: () => new Date('2026-10-19T10:00:00.000Z'),
			freeze: async (_id, snapshot, issuedAt) => ({ ...past, invoiceSnapshot: snapshot, invoiceIssuedAt: issuedAt })
		});
		expect(result.snapshot.serviceDate).toBe('2020-06-20');
	});

	test('issues the final invoice after a past event when the deposit was paid', async () => {
		const past = {
			...record(),
			billingModel: 'deposit_30' as const,
			eventStart: '2020-06-20T07:00:00.000Z',
			eventEnd: '2020-06-20T15:00:00.000Z'
		};
		let current = past;
		const downPayment = await getOrCreateDownPaymentInvoice(current.id, {
			getRecord: async () => current,
			getConfiguration: () => legal,
			now: () => new Date('2020-05-01T10:00:00.000Z'),
			freezeDownPayment: async (_id, snapshot, issuedAt) => {
				current = { ...current, downPaymentInvoiceSnapshot: snapshot, downPaymentInvoiceIssuedAt: issuedAt };
				return current;
			}
		});
		current = { ...current, downPaymentPaidAt: '2020-05-08T10:00:00.000Z' };
		const final = await getOrCreateInvoice(current.id, {
			getRecord: async () => current,
			getConfiguration: () => legal,
			now: () => new Date('2026-10-19T10:00:00.000Z'),
			freeze: async (_id, snapshot, issuedAt) => {
				current = { ...current, invoiceSnapshot: snapshot, invoiceIssuedAt: issuedAt };
				return current;
			}
		});
		expect(downPayment.snapshot.version === 2 || downPayment.snapshot.version === 3).toBe(true);
		expect(final.snapshot.version === 2 || final.snapshot.version === 3).toBe(true);
		if (final.snapshot.version === 2 || final.snapshot.version === 3) expect(final.snapshot.kind).toBe('final');
	});

	test('previews an invoice without freezing an official snapshot', async () => {
		let frozen = false;
		const current = record();
		const preview = await previewInvoice(current.id, {
			getRecord: async () => current,
			getConfiguration: () => legal,
			now: () => new Date('2099-05-01T10:00:00.000Z'),
			freeze: async () => { frozen = true; return null; }
		});
		expect(frozen).toBe(false);
		expect(preview.snapshot.invoiceNumber).toBe('RE-HAA-AAA-AAA');
		expect(current.invoiceSnapshot).toBeNull();

		const deposit = { ...current, billingModel: 'deposit_30' as const };
		const downPayment = await previewDownPaymentInvoice(deposit.id, {
			getRecord: async () => deposit,
			getConfiguration: () => legal,
			now: () => new Date('2099-05-01T10:00:00.000Z'),
			freezeDownPayment: async () => { frozen = true; return null; }
		});
		expect(frozen).toBe(false);
		expect(downPayment.snapshot.invoiceNumber).toBe('RE-HAA-AAA-AAA-AZ');
	});

	test('previews deposit and full invoice drafts for a non-binding request without freezing', async () => {
		const current = { ...record(), status: 'prep_scheduled' as const, billingModel: 'deposit_30' as const, downPaymentInvoiceSnapshot: null };
		let frozen = false;
		const dependencies = {
			getRecord: async () => current,
			getConfiguration: () => legal,
			now: () => new Date('2026-10-19T15:45:00.000Z'),
			freeze: async () => { frozen = true; return null; },
			freezeDownPayment: async () => { frozen = true; return null; }
		};
		const invoice = await previewInvoiceDraft(current.id, dependencies, 'de');
		const deposit = await previewDownPaymentInvoiceDraft(current.id, dependencies, 'de');
		expect(frozen).toBe(false);
		expect(current.invoiceSnapshot).toBeNull();
		expect(current.downPaymentInvoiceSnapshot).toBeNull();
		expect(current.status).toBe('prep_scheduled');
		expect(invoice.snapshot).toMatchObject({ version: 1, locale: 'de', invoiceNumber: 'RE-HAA-AAA-AAA', netTotalCents: 400000 });
		expect(deposit.snapshot).toMatchObject({ version: 3, kind: 'down-payment', locale: 'de', invoiceNumber: 'RE-HAA-AAA-AAA-AZ', netTotalCents: 120000 });
	});

	test('previews deposit and full invoice drafts during the exit window without freezing', async () => {
		const current = { ...record(), status: 'exit_window' as const, billingModel: 'deposit_30' as const };
		let frozen = false;
		const dependencies = {
			getRecord: async () => current,
			getConfiguration: () => legal,
			now: () => new Date('2026-10-19T15:45:00.000Z'),
			freeze: async () => { frozen = true; return null; },
			freezeDownPayment: async () => { frozen = true; return null; }
		};
		const invoice = await previewInvoiceDraft(current.id, dependencies, 'en');
		const deposit = await previewDownPaymentInvoiceDraft(current.id, dependencies, 'en');
		expect(frozen).toBe(false);
		expect(current.invoiceSnapshot).toBeNull();
		expect(invoice.snapshot).toMatchObject({ version: 1, locale: 'en', invoiceNumber: 'RE-HAA-AAA-AAA', netTotalCents: 400000 });
		expect(deposit.snapshot).toMatchObject({ version: 3, kind: 'down-payment', locale: 'en', invoiceNumber: 'RE-HAA-AAA-AAA-AZ', netTotalCents: 120000 });
		await expect(previewDownPaymentInvoiceDraft(current.id, {
			getRecord: async () => ({ ...current, billingModel: 'legacy_full' as const }),
			getConfiguration: () => legal
		})).rejects.toBeInstanceOf(InvoiceNotIssuableError);
	});

	test('does not issue a deposit invoice for a single-invoice booking', async () => {
		const legacy = { ...record(), billingModel: 'legacy_full' as const, status: 'confirmed' as const };
		await expect(previewDownPaymentInvoice(legacy.id, {
			getRecord: async () => legacy,
			getConfiguration: () => legal,
			now: () => new Date('2026-10-19T10:00:00.000Z')
		})).rejects.toBeInstanceOf(InvoiceNotIssuableError);
	});
});
