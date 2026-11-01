import { describe, expect, test } from 'bun:test';
import { createGtagStub } from './analytics-gtag';

describe('gtag command queue', () => {
	test('queues commands as Arguments objects', () => {
		const dataLayer: unknown[] = [];
		const gtag = createGtagStub(dataLayer);
		gtag('event', 'page_view', { page_path: '/' });
		const queued = dataLayer[0];
		expect(Object.prototype.toString.call(queued)).toBe('[object Arguments]');
		expect(Array.isArray(queued)).toBe(false);
		expect([...(queued as ArrayLike<unknown>)]).toEqual(['event', 'page_view', { page_path: '/' }]);
	});
});
