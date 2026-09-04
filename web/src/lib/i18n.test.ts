import { describe, expect, test } from 'bun:test';
import {
	PUBLIC_ROUTE_ENTRIES, canonicalPublicPath, internalPathForPublic, localizedPath,
	preferredLocale, publicPathForInternal, reroutePath, stripLocale, switchLocalePath
} from './i18n';

describe('localized routes', () => {
	test('has a unique reversible public route for every internal route', () => {
		expect(new Set(PUBLIC_ROUTE_ENTRIES.map(([path]) => path)).size).toBe(PUBLIC_ROUTE_ENTRIES.length);
		expect(new Set(PUBLIC_ROUTE_ENTRIES.map(([, path]) => path)).size).toBe(PUBLIC_ROUTE_ENTRIES.length);
		for (const [internal, publicPath] of PUBLIC_ROUTE_ENTRIES) {
			expect(publicPathForInternal(internal)).toBe(publicPath);
			expect(internalPathForPublic(publicPath)).toBe(internal);
		}
	});

	test('reroutes static, shared-plan, offer, and booking paths', () => {
		expect(reroutePath('/en/go')).toBe('/buchen');
		expect(reroutePath('/de/go/opaque-token')).toBe('/buchen/opaque-token');
		expect(reroutePath('/en/offer/opaque-token')).toBe('/offer/opaque-token');
		expect(reroutePath('/en/HAA-ABC-123')).toBe('/HAA-ABC-123');
		expect(canonicalPublicPath('/buchen')).toBe('/go');
	});

	test('switches only the locale and preserves query and fragment', () => {
		expect(switchLocalePath(new URL('https://all-in-agi.com/de/go?a=1#date'), 'en')).toBe('/en/go?a=1#date');
		expect(stripLocale('/en/company-hackathon-berlin')).toEqual({ locale: 'en', pathname: '/company-hackathon-berlin' });
		expect(localizedPath('de', '/buchen')).toBe('/de/go');
	});
});

describe('locale selection', () => {
	test('uses German only for Germany when country is known', () => {
		expect(preferredLocale('DE', 'en-US')).toBe('de');
		expect(preferredLocale('AT', 'de-DE')).toBe('en');
		expect(preferredLocale('US', 'de-DE')).toBe('en');
	});

	test('uses weighted browser language and falls back to German', () => {
		expect(preferredLocale(null, 'en-US,en;q=0.9,de;q=0.5')).toBe('en');
		expect(preferredLocale(null, 'de-DE,de;q=0.9,en;q=0.2')).toBe('de');
		expect(preferredLocale(null, 'fr-FR')).toBe('de');
		expect(preferredLocale(null, null)).toBe('de');
	});
});
