import { describe, expect, test } from 'bun:test';
import { correctOfferPassword, hasOfferAccess, offerAccessValue } from './offer-access';

describe('offer access', () => {
	test('issues a signed value only after the configured password is accepted', async () => {
		expect(correctOfferPassword('offer')).toBe(true);
		expect(correctOfferPassword('wrong')).toBe(false);
		expect(await hasOfferAccess(await offerAccessValue())).toBe(true);
		expect(await hasOfferAccess('v1.invalid')).toBe(false);
	});
});
