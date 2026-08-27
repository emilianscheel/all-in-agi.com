import { describe, expect, test } from 'bun:test';
import { defaultOfferConfiguration } from '$lib/offer';
import { decryptOffer, encryptOffer } from './offer-token';

describe('offer token', () => {
	test('round-trips the complete offer configuration through an encrypted URL token', async () => {
		const config = { ...defaultOfferConfiguration(new Date('2026-08-27T12:00:00.000Z')), netTotal: 7200, notes: 'Individuelles Angebot.', clientLogo: 'none' as const };
		const token = await encryptOffer(config, 'a sufficiently long test secret that is only used for tests');
		expect(token).not.toContain(config.contactEmail);
		expect(await decryptOffer(token, 'a sufficiently long test secret that is only used for tests')).toEqual(config);
	});

	test('rejects malformed tokens', async () => {
		await expect(decryptOffer('not-a-token', 'test secret')).rejects.toThrow('Ungültiger Angebots-Link.');
	});
});
