import { describe, expect, test } from 'bun:test';
import { createInvoiceSnapshot, type InvoiceLegalConfiguration, type InvoiceSource } from '$lib/invoice';
import { buildInvoiceEmailHtml, buildInvoiceEmailText, sendInvoiceEmail } from './invoice-email';

const legal: InvoiceLegalConfiguration = {
	taxIdLabel: 'USt-IdNr.', taxIdValue: 'DE123456789', accountHolder: 'Emilian Scheel',
	iban: 'DE02120300000000202051', bic: 'BYLADEM1001'
};
const source = {
	id: 'HAA-AAA-AAA', companyName: 'Musterwerke GmbH', contactName: 'Ada & Co', contactEmail: 'ada@example.com',
	address: { street: 'Musterstraße 1', postalCode: '10115', city: 'Berlin', country: 'Deutschland' },
	eventStart: '2099-06-20T07:00:00.000Z', capacity: 15, basePrice: 4000, venueSurcharge: 0,
	lunchAdjustment: 0, toolsAdjustment: 0, deviceCount: 0, devicesAdjustment: 0, totalPrice: 4000
} satisfies InvoiceSource;
const snapshot = createInvoiceSnapshot(source, legal, new Date('2099-05-01T10:00:00.000Z'));

describe('invoice email', () => {
	test('builds concise unstyled rich text and a matching plain-text fallback', () => {
		const html = buildInvoiceEmailHtml(snapshot);
		const text = buildInvoiceEmailText(snapshot);
		expect(html).toContain('Hallo Ada &amp; Co');
		expect(html).toContain('<strong>Rechnungsnummer:</strong> RE-HAA-AAA-AAA');
		expect(html).not.toMatch(/<!doctype|<html|<body|<table|style=/i);
		expect(text).toContain('Gesamtbetrag: 4.760');
		expect(text).toContain('Zahlbar bis: 15.05.2099');
	});

	test('sends the generated PDF as an attachment', async () => {
		let payload: any;
		const result = await sendInvoiceEmail(snapshot, {
			accountId: 'account', apiToken: 'token',
			createPdf: async () => new Uint8Array([37, 80, 68, 70]),
			fetch: async (_input, init) => {
				payload = JSON.parse(String(init?.body));
				return Response.json({ success: true, result: { queued: ['ada@example.com'], message_id: 'invoice-mail-1' } });
			}
		});
		expect(result.messageId).toBe('invoice-mail-1');
		expect(payload.subject).toContain('RE-HAA-AAA-AAA');
		expect(payload.attachments).toEqual([{
			content: 'JVBERg==',
			filename: 'all-in-agi-rechnung-HAA-AAA-AAA.pdf',
			type: 'application/pdf',
			disposition: 'attachment'
		}]);
	});
});
