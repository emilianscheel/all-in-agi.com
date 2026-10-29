import { dev } from '$app/environment';
import { localizedPath } from '$lib/i18n';
import { loadSlides } from '$lib/server/slides';
import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	if (!dev && !locals.admin.authorized) redirect(303, localizedPath(locals.locale, '/dashboard'));
	return { slides: await loadSlides() };
}
