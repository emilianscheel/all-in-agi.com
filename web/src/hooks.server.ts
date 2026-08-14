import { building } from '$app/environment';
import { robotsDirective } from '$lib/seo';
import { adminAccessFor } from '$lib/server/admin-auth';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const authSession = await auth.api.getSession({ headers: event.request.headers });
	event.locals.session = authSession?.session ?? null;
	event.locals.user = authSession?.user ?? null;
	event.locals.admin = await adminAccessFor(authSession?.user ?? null);
	return svelteKitHandler({
		event,
		auth,
		building,
		resolve: async (resolvedEvent) => {
			const response = await resolve(resolvedEvent);
			response.headers.set('X-Robots-Tag', robotsDirective(resolvedEvent.url.pathname));
			return response;
		}
	});
};
