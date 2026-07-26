import { resolveManagedHackathonId } from '$lib/server/manage-booking';
import { fail, redirect } from '@sveltejs/kit';

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const result = await resolveManagedHackathonId(data.get('hackathonId'));
		if (!result.ok) {
			return fail(result.status, { id: result.id, message: result.message });
		}
		redirect(303, `/${result.id}`);
	}
};
