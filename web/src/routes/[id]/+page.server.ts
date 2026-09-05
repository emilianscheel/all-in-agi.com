import { isHackathonId } from '$lib/public-id';
import { getCustomerHackathonRecord, toPublicHackathon } from '$lib/server/hackathons';
import { error, redirect } from '@sveltejs/kit';
import { finalizeDueContracts } from '$lib/server/legal-contracts';
import { localizedPath } from '$lib/i18n';

export async function load({ params, locals }) {
	const canonicalId = params.id.toUpperCase();
	if (!isHackathonId(canonicalId)) error(404, 'Hackathon nicht gefunden');
	if (params.id !== canonicalId) redirect(308, localizedPath(locals.locale, `/${canonicalId}`));
	await finalizeDueContracts();
	const record = await getCustomerHackathonRecord(canonicalId);
	if (!record) error(404, 'Hackathon nicht gefunden');
	return {
		hackathon: toPublicHackathon(record),
		invoice: locals.admin.authorized ? {
			billingModel: record.billingModel,
			issued: Boolean(record.invoiceSnapshot),
			emailSentAt: record.invoiceEmailSentAt,
			finalAvailable: Boolean(record.eventEnd) && (record.billingModel === 'legacy_full'
				|| (Boolean(record.downPaymentPaidAt) && new Date() >= new Date(record.eventEnd!))),
			downPayment: {
				issued: Boolean(record.downPaymentInvoiceSnapshot),
				emailSentAt: record.downPaymentInvoiceEmailSentAt,
				paidAt: record.downPaymentPaidAt
			}
		} : null
	};
}
