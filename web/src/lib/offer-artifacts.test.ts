import { describe, expect, test } from 'bun:test';
import { PDFDocument } from 'pdf-lib';
import { defaultOfferConfiguration } from './offer';
import { createOfferPdf } from './offer-artifacts';

describe('offer PDF', () => {
	test('creates a branded one-page offer PDF', async () => {
		const bytes = await createOfferPdf({ ...defaultOfferConfiguration(new Date('2026-08-27T12:00:00.000Z')), netTotal: 6000 });
		expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
		expect(bytes.length).toBeGreaterThan(10_000);
	});
});
