import { existsSync } from 'node:fs';
import { describe, expect, test } from 'bun:test';
import { GTM_HERO_IMAGES } from './gtm-images';
import { GTM_GROUPS, GTM_ICON_NAMES, GTM_PUBLICATION_DATE, getGtmPage, gtmPages, gtmPagesForGroup } from './gtm-pages';

function contentWords(page: (typeof gtmPages)[number]) {
	return [
		page.title,
		page.description,
		...page.lead,
		page.relevanceTitle,
		...page.relevance,
		...page.challenges,
		page.audienceTitle,
		page.audienceIntro,
		...page.audience,
		...page.security,
		...page.outcome
	]
		.join(' ')
		.trim()
		.split(/\s+/).length;
}

describe('GTM page catalog', () => {
	test('contains exactly four groups with five pages each', () => {
		expect(gtmPages).toHaveLength(20);
		expect(GTM_GROUPS).toHaveLength(4);
		for (const group of GTM_GROUPS) expect(gtmPagesForGroup(group)).toHaveLength(5);
	});

	test('uses unique, simple slugs, titles, descriptions, and icons', () => {
		expect(new Set(gtmPages.map((page) => page.slug)).size).toBe(20);
		expect(new Set(gtmPages.map((page) => page.title)).size).toBe(20);
		expect(new Set(gtmPages.map((page) => page.description)).size).toBe(20);
		expect(new Set(gtmPages.map((page) => page.icon)).size).toBe(20);
		expect(new Set(GTM_ICON_NAMES).size).toBe(20);

		for (const page of gtmPages) {
			expect(page.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
			expect(page.description.length).toBeGreaterThanOrEqual(100);
			expect(page.description.length).toBeLessThanOrEqual(170);
			expect(contentWords(page)).toBeGreaterThanOrEqual(350);
			expect(getGtmPage(page.slug)).toBe(page);
			expect(page.publishedAt).toBe(GTM_PUBLICATION_DATE);
			expect(GTM_HERO_IMAGES[page.heroImage]).toBeDefined();
		}
	});

	test('assigns every curated hero image to at least one article', () => {
		expect(new Set(gtmPages.map((page) => page.heroImage))).toEqual(
			new Set(Object.keys(GTM_HERO_IMAGES) as Array<keyof typeof GTM_HERO_IMAGES>)
		);
	});

	test('provides a local WebP placeholder for every hero image', () => {
		for (const hero of Object.values(GTM_HERO_IMAGES)) {
			expect(hero.placeholderSrc).toMatch(/^\/images\/placeholders\/[a-z0-9-]+\.webp$/);
			expect(existsSync(new URL(`../../static${hero.placeholderSrc}`, import.meta.url))).toBe(true);
		}
	});
});
