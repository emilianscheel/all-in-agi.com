import { describe, expect, test } from 'bun:test';
import { defaultOfferConfiguration, grossTotal, isOfferConfiguration, normalizeOfferConfiguration, selectedOfferServices } from './offer';

describe('offer configuration', () => {
	test('prefills the Hitachi recipient and all requested services', () => {
		const config = defaultOfferConfiguration(new Date('2026-08-27T12:00:00.000Z'));
		expect(config.companyName).toBe('Hitachi Rail');
		expect(config.contactName).toBe('Lourdes Diaz Turó');
		expect(config.contactEmail).toBe('lourdes.diazturo@hitachirail.com');
		expect(config.issueDate).toBe('2026-08-27');
		expect(config.netTotal).toBe(14_500);
		expect(config.clientLogo).toBe('hitachi');
		expect(config.validUntil).toBe('');
		expect(config.netTotal).toBe(14_500);
		expect(selectedOfferServices(config)).toHaveLength(20);
		expect(selectedOfferServices(config)).toContainEqual({
			id: 'preparation',
			label: '4 Tage Konzeption, Tool-/IT-Setup und Abstimmung – im Preis enthalten'
		});
	});

	test('calculates gross totals and accepts an initially blank net price', () => {
		expect(grossTotal({ netTotal: null, vatRate: 19 })).toBe(0);
		expect(grossTotal({ netTotal: 14_500, vatRate: 19 })).toBe(17_255);
		expect(isOfferConfiguration(defaultOfferConfiguration())).toBe(true);
	});

	test('normalizes legacy offer links to the default client logo', () => {
		const { clientLogo: _clientLogo, ...legacyConfig } = defaultOfferConfiguration();
		expect(normalizeOfferConfiguration(legacyConfig)).toEqual({ ...legacyConfig, clientLogo: 'hitachi' });
	});
});
