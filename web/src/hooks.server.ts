import { building } from '$app/environment';
import { robotsDirective } from '$lib/seo';
import { redirect, type Handle } from '@sveltejs/kit';
import {
	canonicalPublicPath,
	internalPathForPublic,
	localeFromPath,
	localeFromReferer,
	localizedPathFromPublic,
	preferredLocale,
	publicPathForInternal,
	stripLocale
} from '$lib/i18n';

export const handle: Handle = async ({ event, resolve }) => {
	const explicitLocale = localeFromPath(event.url.pathname);
	const stripped = stripLocale(event.url.pathname);
	if (explicitLocale) {
		const internal = internalPathForPublic(stripped.pathname);
		const canonical = internal
			? publicPathForInternal(internal, explicitLocale)
			: publicPathForInternal(stripped.pathname, explicitLocale);
		if (canonical && canonical !== stripped.pathname) {
			redirect(308, `${localizedPathFromPublic(explicitLocale, canonical)}${event.url.search}`);
		}
	}

	if (!explicitLocale && (event.request.method === 'GET' || event.request.method === 'HEAD')) {
		const locale = preferredLocale(
			event.request.headers.get('x-vercel-ip-country'),
			event.request.headers.get('accept-language')
		);
		const canonical = canonicalPublicPath(event.url.pathname, locale);
		if (canonical) {
			redirect(307, `${localizedPathFromPublic(locale, canonical)}${event.url.search}`);
		}
	}

	event.locals.locale = explicitLocale ?? localeFromReferer(event.request.headers.get('referer')) ?? 'de';
	const resolvePage = async (resolvedEvent: typeof event) => {
		const response = await resolve(resolvedEvent, {
			transformPageChunk: ({ html }) => html.replace('%lang%', `${event.locals.locale === 'en' ? 'en-US' : 'de-DE'}`)
		});
		response.headers.set('X-Robots-Tag', robotsDirective(resolvedEvent.url.pathname));
		response.headers.set('Content-Language', event.locals.locale === 'en' ? 'en-US' : 'de-DE');
		return response;
	};

	// Anonymous page views do not need to initialize Better Auth or query the session store.
	const hasSessionCookie = event.cookies.get('better-auth.session_token') ||
		event.cookies.get('__Secure-better-auth.session_token') ||
		event.cookies.get('better-auth-session_token') ||
		event.cookies.get('__Secure-better-auth-session_token');
	if ((event.request.method === 'GET' || event.request.method === 'HEAD') &&
		!event.url.pathname.startsWith('/api/auth/') && !hasSessionCookie) {
		event.locals.session = null;
		event.locals.user = null;
		event.locals.admin = { authenticated: false, authorized: false, needsPasskey: false };
		return resolvePage(event);
	}

	const [{ auth }, { adminAccessFor }, { svelteKitHandler }] = await Promise.all([
		import('$lib/server/auth'),
		import('$lib/server/admin-auth'),
		import('better-auth/svelte-kit')
	]);
	const authSession = await auth.api.getSession({ headers: event.request.headers });
	event.locals.session = authSession?.session ?? null;
	event.locals.user = authSession?.user ?? null;
	event.locals.admin = await adminAccessFor(authSession?.user ?? null);
	return svelteKitHandler({
		event,
		auth,
		building,
		resolve: resolvePage
	});
};
