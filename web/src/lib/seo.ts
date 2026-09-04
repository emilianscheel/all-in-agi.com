import { gtmPaths } from '$lib/gtm-pages';
import { LOCALES, internalPathForPublic, localeFromPath, localizedPath, stripLocale } from '$lib/i18n';

export const SITE_ORIGIN = 'https://all-in-agi.com';
export const SOCIAL_IMAGE_URL = `${SITE_ORIGIN}/images/all-in-agi-event.webp`;
export const SOCIAL_IMAGE_ALT = 'Team arbeitet gemeinsam an einem Agentic Engineering Hackathon-Projekt';

export const INDEXABLE_INTERNAL_PATHS = ['/', '/impressum', '/agb', '/datenschutz', '/teilnehmer-datenschutz', '/buchen', ...gtmPaths];
export const INDEXABLE_PATHS = LOCALES.flatMap((locale) => INDEXABLE_INTERNAL_PATHS.map((path) => localizedPath(locale, path)));

const indexableInternalPathSet = new Set<string>(INDEXABLE_INTERNAL_PATHS);

export function isIndexablePath(pathname: string) {
	if (!localeFromPath(pathname)) return false;
	const publicPath = stripLocale(pathname).pathname;
	const internalPath = internalPathForPublic(publicPath);
	return internalPath !== null && indexableInternalPathSet.has(internalPath);
}

export function robotsDirective(pathname: string) {
	return isIndexablePath(pathname)
		? 'index, follow, max-image-preview:large'
		: 'noindex, nofollow, noarchive';
}
