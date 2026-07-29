import { sitemapXml } from '$lib/sitemap';

export const prerender = true;

export function GET() {
	return new Response(sitemapXml(), {
		headers: {
			'content-type': 'application/xml; charset=utf-8'
		}
	});
}
