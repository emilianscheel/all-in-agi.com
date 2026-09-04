import { INDEXABLE_INTERNAL_PATHS, SITE_ORIGIN } from '$lib/seo';
import { localizedPath } from '$lib/i18n';

function escapeXml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

export function sitemapXml() {
	const urls = (['de', 'en'] as const).flatMap((locale) => INDEXABLE_INTERNAL_PATHS.map((internalPath) => {
		const path = localizedPath(locale as 'de' | 'en', internalPath);
		const de = `${SITE_ORIGIN}${localizedPath('de', internalPath)}`;
		const en = `${SITE_ORIGIN}${localizedPath('en', internalPath)}`;
		return `  <url><loc>${escapeXml(`${SITE_ORIGIN}${path}`)}</loc><xhtml:link rel="alternate" hreflang="de-DE" href="${escapeXml(de)}"/><xhtml:link rel="alternate" hreflang="en-US" href="${escapeXml(en)}"/></url>`;
	})
	).join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}
