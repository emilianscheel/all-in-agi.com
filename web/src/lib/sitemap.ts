import { INDEXABLE_PATHS, SITE_ORIGIN } from '$lib/seo';

function escapeXml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

export function sitemapXml() {
	const urls = INDEXABLE_PATHS.map(
		(path) => `  <url><loc>${escapeXml(`${SITE_ORIGIN}${path}`)}</loc></url>`
	).join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
