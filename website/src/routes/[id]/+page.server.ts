import { isHackathonId } from '$lib/public-id';
import { getCustomerHackathonRecord, toPublicHackathon } from '$lib/server/hackathons';
import { error, redirect } from '@sveltejs/kit';

export async function load({ params, locals }) {
	const canonicalId = params.id.toUpperCase();
	if (!isHackathonId(canonicalId)) error(404, 'Hackathon nicht gefunden');
	if (params.id !== canonicalId) redirect(308, `/${canonicalId}`);
	const record = await getCustomerHackathonRecord(canonicalId);
	if (!record) error(404, 'Hackathon nicht gefunden');
	return {
		hackathon: toPublicHackathon(record),
		invoice: locals.admin.authorized ? {
			issued: Boolean(record.invoiceSnapshot),
			emailSentAt: record.invoiceEmailSentAt
		} : null
	};
}
