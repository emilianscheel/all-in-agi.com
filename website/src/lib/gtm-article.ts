import { GTM_HERO_IMAGES } from '$lib/gtm-images';
import type { GtmPage } from '$lib/gtm-pages';
import { SITE_ORIGIN } from '$lib/seo';

export function gtmArticleSchema(page: GtmPage) {
	const hero = GTM_HERO_IMAGES[page.heroImage];
	const canonicalUrl = `${SITE_ORIGIN}/${page.slug}`;

	return {
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: page.title,
		description: page.description,
		inLanguage: 'de-DE',
		datePublished: page.publishedAt,
		articleSection: page.group,
		mainEntityOfPage: canonicalUrl,
		url: canonicalUrl,
		image: {
			'@type': 'ImageObject',
			url: `${SITE_ORIGIN}${hero.src}`,
			width: hero.width,
			height: hero.height
		},
		author: {
			'@type': 'Organization',
			'@id': `${SITE_ORIGIN}/#organization`,
			name: 'ALL IN AGI',
			url: SITE_ORIGIN
		},
		publisher: {
			'@type': 'Organization',
			'@id': `${SITE_ORIGIN}/#organization`,
			name: 'ALL IN AGI',
			url: SITE_ORIGIN,
			logo: {
				'@type': 'ImageObject',
				url: `${SITE_ORIGIN}/brand/all-in-agi-logo.png`
			}
		}
	};
}
