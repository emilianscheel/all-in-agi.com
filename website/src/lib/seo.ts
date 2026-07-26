export const SITE_ORIGIN = 'https://all-in-agi.com';
export const SOCIAL_IMAGE_URL = `${SITE_ORIGIN}/images/all-in-agi-event.webp`;
export const SOCIAL_IMAGE_ALT = 'Team arbeitet gemeinsam an einem Agentic Engineering Hackathon-Projekt';

const INDEXABLE_PATHS = new Set(['/', '/impressum', '/datenschutz', '/buchen']);

export function isIndexablePath(pathname: string) {
	return INDEXABLE_PATHS.has(pathname);
}

export function robotsDirective(pathname: string) {
	return isIndexablePath(pathname)
		? 'index, follow, max-image-preview:large'
		: 'noindex, nofollow, noarchive';
}
