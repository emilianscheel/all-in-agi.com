import { building } from '$app/environment';
import { robotsDirective } from '$lib/seo';
import { adminAccessFor } from '$lib/server/admin-auth';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { redirect, type Handle } from '@sveltejs/kit';
import {
	canonicalPublicPath,
	localeFromPath,
	localizedPathFromPublic,
	preferredLocale,
	publicPathForInternal,
	stripLocale
} from '$lib/i18n';

export const handle: Handle = async ({ event, resolve }) => {
	const explicitLocale = localeFromPath(event.url.pathname);
	const stripped = stripLocale(event.url.pathname);
	if (explicitLocale) {
		const canonical = publicPathForInternal(stripped.pathname);
		if (canonical && canonical !== stripped.pathname) {
			redirect(308, `${localizedPathFromPublic(explicitLocale, canonical)}${event.url.search}`);
		}
	}

	if (!explicitLocale && (event.request.method === 'GET' || event.request.method === 'HEAD')) {
		const canonical = canonicalPublicPath(event.url.pathname);
		if (canonical) {
			const locale = preferredLocale(
				event.request.headers.get('x-vercel-ip-country'),
				event.request.headers.get('accept-language')
			);
			redirect(307, `${localizedPathFromPublic(locale, canonical)}${event.url.search}`);
		}
	}

	event.locals.locale = explicitLocale ?? 'de';
	const authSession = await auth.api.getSession({ headers: event.request.headers });
	event.locals.session = authSession?.session ?? null;
	event.locals.user = authSession?.user ?? null;
	event.locals.admin = await adminAccessFor(authSession?.user ?? null);
	return svelteKitHandler({
		event,
		auth,
		building,
		resolve: async (resolvedEvent) => {
			const response = await resolve(resolvedEvent, {
				transformPageChunk: ({ html }) => html.replace('%lang%', `${event.locals.locale === 'en' ? 'en-US' : 'de-DE'}`)
			});
			response.headers.set('X-Robots-Tag', robotsDirective(resolvedEvent.url.pathname));
			response.headers.set('Content-Language', event.locals.locale === 'en' ? 'en-US' : 'de-DE');
			return response;
		}
	});
};
