import { existsSync } from 'node:fs';
import { describe, expect, test } from 'bun:test';
import { GTM_HERO_IMAGES } from './gtm-images';
import { GTM_GROUPS, GTM_ICON_NAMES, GTM_PUBLICATION_DATE, getGtmPage, gtmPages, gtmPagesForGroup } from './gtm-pages';

function contentWords(page: (typeof gtmPages)[number]) {
	const content = page.kind === 'offer'
		? [page.title, page.description, ...page.lead, page.relevanceTitle, ...page.relevance, ...page.challenges, page.audienceTitle, page.audienceIntro, ...page.audience, ...page.security, ...page.outcome]
		: [page.title, page.description, page.dek, ...page.sections.flatMap((section) => [section.title, ...section.paragraphs.map((paragraph) => paragraph.text), ...(section.bullets ?? []).map((bullet) => bullet.text)])];

	return content
		.join(' ')
		.trim()
		.split(/\s+/).length;
}

describe('GTM page catalog', () => {
	test('contains exactly eight groups with five pages each', () => {
		expect(gtmPages).toHaveLength(40);
		expect(GTM_GROUPS).toHaveLength(8);
		for (const group of GTM_GROUPS) expect(gtmPagesForGroup(group)).toHaveLength(5);
	});

	test('uses unique, simple slugs, titles, descriptions, and icons', () => {
		expect(new Set(gtmPages.map((page) => page.slug)).size).toBe(40);
		expect(new Set(gtmPages.map((page) => page.title)).size).toBe(40);
		expect(new Set(gtmPages.map((page) => page.description)).size).toBe(40);
		expect(new Set(gtmPages.map((page) => page.icon)).size).toBe(40);
		expect(new Set(GTM_ICON_NAMES).size).toBe(40);

		for (const page of gtmPages) {
			expect(page.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
			expect(page.description.length).toBeGreaterThanOrEqual(100);
			expect(page.description.length).toBeLessThanOrEqual(170);
			expect(contentWords(page)).toBeGreaterThanOrEqual(page.kind === 'editorial' ? 650 : 350);
			expect(getGtmPage(page.slug)).toBe(page);
			expect(page.publishedAt).toBe(page.kind === 'editorial' ? '2026-08-02' : GTM_PUBLICATION_DATE);
			expect(GTM_HERO_IMAGES[page.heroImage]).toBeDefined();
		}
	});

	test('provides valid editorial metadata, citations, and related links', () => {
		const editorialPages = gtmPages.filter((page) => page.kind === 'editorial');
		expect(editorialPages).toHaveLength(20);

		for (const page of editorialPages) {
			expect(page.seoTitle.length).toBeGreaterThanOrEqual(30);
			expect(page.sections.length).toBeGreaterThanOrEqual(4);
			expect(page.sources.length).toBeGreaterThanOrEqual(2);
			expect(page.relatedSlugs.length).toBeGreaterThanOrEqual(2);
			const sourceIds = new Set(page.sources.map((source) => source.id));
			expect(sourceIds.size).toBe(page.sources.length);
			for (const source of page.sources) expect(source.url).toMatch(/^https:\/\//);
			for (const section of page.sections) {
				for (const paragraph of [...section.paragraphs, ...(section.bullets ?? [])]) {
					for (const sourceId of paragraph.sourceIds ?? []) expect(sourceIds.has(sourceId)).toBe(true);
				}
			}
			for (const relatedSlug of page.relatedSlugs) expect(getGtmPage(relatedSlug).slug).toBe(relatedSlug);
			if (page.blueprint) expect(page.sections[0].title).toBe('Blueprint, keine Kundenreferenz');
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
