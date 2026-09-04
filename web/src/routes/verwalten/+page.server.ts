import { resolveManagedHackathonId } from '$lib/server/manage-booking';
import { fail, redirect } from '@sveltejs/kit';
import { localizedPath } from '$lib/i18n';

export const actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const result = await resolveManagedHackathonId(data.get('hackathonId'));
		if (!result.ok) {
			return fail(result.status, { id: result.id, message: locals.locale === 'en'
				? (result.status === 404 ? 'No booking was found for this ID.' : 'Please enter a valid booking ID.')
				: result.message });
		}
		redirect(303, localizedPath(locals.locale, `/${result.id}`));
	}
};
