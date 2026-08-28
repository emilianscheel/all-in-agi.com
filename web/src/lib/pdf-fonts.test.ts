import { describe, expect, test } from 'bun:test';
import { PDFDict, PDFDocument, PDFName } from 'pdf-lib';
import { createPlanPdf } from './booking-artifacts';
import type { BookingConfiguration } from './booking';
import { createInvoicePdf } from './invoice-artifacts';
import { createInvoiceSnapshot, type InvoiceLegalConfiguration, type InvoiceSource } from './invoice';
import { defaultOfferConfiguration } from './offer';
import { createOfferPdf } from './offer-artifacts';

function embeddedBaseFonts(pdf: PDFDocument) {
	const names = new Set<string>();
	for (const page of pdf.getPages()) {
		const fonts = page.node.Resources()?.lookupMaybe(PDFName.Font, PDFDict);
		if (!fonts) continue;
		for (const [key] of fonts.entries()) {
			const font = fonts.lookup(key, PDFDict);
			const baseFont = font.lookupMaybe(PDFName.of('BaseFont'), PDFName);
			if (baseFont) names.add(baseFont.decodeText());
		}
	}
	return [...names];
}

async function expectGoogleSans(bytes: Uint8Array) {
	const fonts = embeddedBaseFonts(await PDFDocument.load(bytes));
	expect(fonts.some((font) => font.includes('GoogleSans'))).toBe(true);
	expect(fonts.some((font) => font.includes('Helvetica'))).toBe(false);
}

const booking: BookingConfiguration = {
	capacity: 15,
	venueProvided: true,
	equipment: 'projector',
	lunch: 'pizza',
	customLunch: '',
	toolProvision: 'existing',
	codingTools: ['codex'],
	customCodingTool: '',
	deviceProvision: 'existing',
	deviceCount: 0,
	companyName: 'Musterwerke GmbH',
	contactName: 'Ada Beispiel',
	email: 'ada@example.com',
	phone: '+49 30 123456',
	message: '',
	address: { label: 'Musterstraße 1, Berlin', street: 'Musterstraße 1', postalCode: '10115', city: 'Berlin', country: 'Deutschland' },
	eventStart: '2099-06-20T07:00:00.000Z',
	eventEnd: '2099-06-20T15:00:00.000Z',
	consultationSlot: '2099-05-10T10:00:00.000Z'
};

const legal: InvoiceLegalConfiguration = {
	taxIdLabel: 'USt-IdNr.',
	taxIdValue: 'DE123456789',
	accountHolder: 'Emilian Scheel',
	iban: 'DE02120300000000202051',
	bic: 'BYLADEM1001'
};

const invoiceSource = {
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
	deviceCount: 0,
	devicesAdjustment: 0,
	totalPrice: 6500
} satisfies InvoiceSource;

describe('PDF font embedding', () => {
	test('embeds Google Sans and no Helvetica in every PDF template', async () => {
		await expectGoogleSans(await createOfferPdf(defaultOfferConfiguration(new Date('2026-08-27T12:00:00.000Z'))));
		await expectGoogleSans(await createPlanPdf(booking));
		await expectGoogleSans(await createInvoicePdf(createInvoiceSnapshot(invoiceSource, legal, new Date('2099-05-01T10:00:00.000Z'))));
	});
});
