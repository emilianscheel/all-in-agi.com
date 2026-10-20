import { describe, expect, test } from 'bun:test';
import { PDFDocument } from 'pdf-lib';
import { defaultOfferConfiguration } from './offer';
import { createOfferPdf } from './offer-artifacts';

describe('offer PDF', () => {
	test('creates a branded one-page offer PDF in the selected language', async () => {
		const config = { ...defaultOfferConfiguration(new Date('2026-08-27T12:00:00.000Z')), netTotal: 6000 };
		const german = await createOfferPdf(config, { locale: 'de' });
		const english = await createOfferPdf(config, { locale: 'en' });
		expect((await PDFDocument.load(german)).getPageCount()).toBe(1);
		expect((await PDFDocument.load(english)).getPageCount()).toBe(1);
		expect(german.length).toBeGreaterThan(10_000);
		expect(english).not.toEqual(german);
	});

	test('creates a Leistungsbeschreibung with the same page count', async () => {
		const config = { ...defaultOfferConfiguration(new Date('2026-08-27T12:00:00.000Z')), netTotal: 6000 };
		const offer = await createOfferPdf(config, { locale: 'de' });
		const scope = await createOfferPdf(config, { mode: 'scope', locale: 'de' });
		expect((await PDFDocument.load(scope)).getPageCount()).toBe(1);
		expect(scope).not.toEqual(offer);
	});

	test('renders the selected client-logo behavior', async () => {
		const config = defaultOfferConfiguration(new Date('2026-08-27T12:00:00.000Z'));
		const withHitachi = await createOfferPdf(config);
		const withoutClientLogo = await createOfferPdf({ ...config, clientLogo: 'none' });
		const services = [{ id: 'star-service', label: 'Stern', labelEn: 'Star', icon: 'star', sortOrder: 1 }];
		const custom = { ...config, services: ['star-service'] };
		const withoutUploadedLogo = await createOfferPdf({ ...custom, clientLogo: 'none' }, { services });
		const uploaded = await createOfferPdf(
			{ ...custom, clientLogo: 'LAA-AAA-AAA' },
			{
				logoSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><rect width="100" height="40"/></svg>',
				services
			}
		);
		expect(withHitachi.length).toBeGreaterThan(withoutClientLogo.length);
		expect((await PDFDocument.load(uploaded)).getPageCount()).toBe(1);
		expect(uploaded.length).toBeGreaterThan(withoutUploadedLogo.length);
	});
});
