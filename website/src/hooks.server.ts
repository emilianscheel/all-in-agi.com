import { robotsDirective } from '$lib/seo';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	response.headers.set('X-Robots-Tag', robotsDirective(event.url.pathname));
	return response;
};
