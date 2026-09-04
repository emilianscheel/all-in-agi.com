import type { Reroute } from '@sveltejs/kit';
import { reroutePath } from '$lib/i18n';

export const reroute: Reroute = ({ url }) => {
	const localized = reroutePath(url.pathname);
	const pathname = localized ?? url.pathname;
	if (/^\/buchen\/[^/]+$/.test(pathname) && pathname !== '/buchen/erfolg') return '/buchen';
	return localized;
};
