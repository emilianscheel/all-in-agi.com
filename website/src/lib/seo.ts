import { gtmPaths } from '$lib/gtm-pages';

export const SITE_ORIGIN = 'https://all-in-agi.com';
export const SOCIAL_IMAGE_URL = `${SITE_ORIGIN}/images/all-in-agi-event.webp`;
export const SOCIAL_IMAGE_ALT = 'Team arbeitet gemeinsam an einem Agentic Engineering Hackathon-Projekt';

export const INDEXABLE_PATHS = ['/', '/impressum', '/agb', '/datenschutz', '/teilnehmer-datenschutz', '/buchen', ...gtmPaths];

const indexablePathSet = new Set<string>(INDEXABLE_PATHS);

export function isIndexablePath(pathname: string) {
	return indexablePathSet.has(pathname);
}

export function robotsDirective(pathname: string) {
	return isIndexablePath(pathname)
		? 'index, follow, max-image-preview:large'
		: 'noindex, nofollow, noarchive';
}
