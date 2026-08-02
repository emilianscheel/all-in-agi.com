import { describe, expect, test } from 'bun:test';
import { gtmPages } from './gtm-pages';
import { INDEXABLE_PATHS, SITE_ORIGIN } from './seo';
import { sitemapXml } from './sitemap';

describe('XML sitemap', () => {
	test('contains exactly the 26 canonical public URLs', () => {
		const xml = sitemapXml();
		const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
		const expected = INDEXABLE_PATHS.map((path) => `${SITE_ORIGIN}${path}`);

		expect(INDEXABLE_PATHS).toHaveLength(26);
		expect(gtmPages).toHaveLength(20);
		expect(locations).toEqual(expected);
		expect(new Set(locations).size).toBe(26);
		expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
		expect(xml).not.toContain('<priority>');
		expect(xml).not.toContain('<changefreq>');
		expect(xml).not.toContain('<lastmod>');
		expect(xml).not.toContain('/dashboard');
		expect(xml).not.toContain('/verwalten');
		expect(xml).not.toContain('/api/');
	});
});
