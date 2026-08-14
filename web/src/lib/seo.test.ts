import { describe, expect, test } from 'bun:test';
import { gtmPaths } from './gtm-pages';
import { INDEXABLE_PATHS, isIndexablePath, robotsDirective } from './seo';

describe('SEO indexing policy', () => {
	test.each(INDEXABLE_PATHS)('allows %s', (pathname) => {
		expect(isIndexablePath(pathname)).toBe(true);
		expect(robotsDirective(pathname)).toBe('index, follow, max-image-preview:large');
	});

	test('contains the six core pages and all GTM pages', () => {
		expect(INDEXABLE_PATHS).toHaveLength(46);
		expect(INDEXABLE_PATHS.slice(0, 6)).toEqual(['/', '/impressum', '/agb', '/datenschutz', '/teilnehmer-datenschutz', '/buchen']);
		expect(INDEXABLE_PATHS.slice(6)).toEqual(gtmPaths);
	});

	test.each([
		'/ABC123XYZ',
		'/ABC123XYZ/timer',
		'/buchen/shared-plan-token',
		'/buchen/erfolg',
		'/verwalten',
		'/timer',
		'/clock',
		'/api/availability',
		'/unknown',
		'/impressum/'
	])('blocks %s', (pathname) => {
		expect(isIndexablePath(pathname)).toBe(false);
		expect(robotsDirective(pathname)).toBe('noindex, nofollow, noarchive');
	});
});
