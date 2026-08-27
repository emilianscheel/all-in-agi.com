import { describe, expect, test } from 'bun:test';
import { defaultOfferConfiguration, grossTotal, isOfferConfiguration, selectedOfferServices } from './offer';

describe('offer configuration', () => {
	test('prefills the Hitachi recipient and all requested services', () => {
		const config = defaultOfferConfiguration(new Date('2026-08-27T12:00:00.000Z'));
		expect(config.companyName).toBe('Hitachi Rail – Public');
		expect(config.contactName).toBe('Lourdes Diaz Turó');
		expect(config.contactEmail).toBe('lourdes.diazturo@hitachirail.com');
		expect(config.issueDate).toBe('2026-08-27');
		expect(config.validUntil).toBe('2026-09-26');
		expect(selectedOfferServices(config)).toHaveLength(11);
	});

	test('calculates gross totals and accepts an initially blank net price', () => {
		expect(grossTotal({ netTotal: null, vatRate: 19 })).toBe(0);
		expect(grossTotal({ netTotal: 4000, vatRate: 19 })).toBe(4760);
		expect(isOfferConfiguration(defaultOfferConfiguration())).toBe(true);
	});
});
