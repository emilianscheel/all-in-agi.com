import type { Reroute } from '@sveltejs/kit';

export const reroute: Reroute = ({ url }) => {
	if (/^\/buchen\/[^/]+$/.test(url.pathname) && url.pathname !== '/buchen/erfolg') return '/buchen';
};
