import { describe, expect, test } from 'bun:test';
import { isIndexablePath, robotsDirective } from './seo';

describe('SEO indexing policy', () => {
	test.each(['/', '/impressum', '/datenschutz', '/buchen'])('allows %s', (pathname) => {
		expect(isIndexablePath(pathname)).toBe(true);
		expect(robotsDirective(pathname)).toBe('index, follow, max-image-preview:large');
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
