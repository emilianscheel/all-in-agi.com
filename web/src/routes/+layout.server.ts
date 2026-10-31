import { env } from '$env/dynamic/private';

export function load({ locals }) {
	return {
		locale: locals.locale,
		admin: locals.admin,
		adminEmail: locals.admin.authenticated ? locals.user?.email ?? '' : '',
		metaPixelId: (env.NEXT_PUBLIC_META_PIXEL_ID ?? '').trim()
	};
}
