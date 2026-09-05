import { localeFromPath } from '$lib/i18n';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ data, url }) => {
	return {
		...data,
		locale: localeFromPath(url.pathname) ?? data.locale ?? 'de'
	};
};
