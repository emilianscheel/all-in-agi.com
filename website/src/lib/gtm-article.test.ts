import { describe, expect, test } from 'bun:test';
import { gtmArticleSchema } from './gtm-article';
import { GTM_HERO_IMAGES } from './gtm-images';
import { getGtmPage } from './gtm-pages';
import { SITE_ORIGIN } from './seo';

describe('GTM article schema', () => {
	test('uses the article canonical URL, publication date, and assigned hero image', () => {
		const page = getGtmPage('developer-experience-ai-tools');
		const schema = gtmArticleSchema(page);
		const hero = GTM_HERO_IMAGES.engineering;

		expect(schema['@type']).toBe('Article');
		expect(schema.headline).toBe(page.title);
		expect(schema.datePublished).toBe('2026-07-29');
		expect(schema.mainEntityOfPage).toBe(`${SITE_ORIGIN}/${page.slug}`);
		expect(schema.image).toEqual({
			'@type': 'ImageObject',
			url: `${SITE_ORIGIN}${hero.src}`,
			width: hero.width,
			height: hero.height
		});
	});
});
