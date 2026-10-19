import { localeMessage } from '$lib/locale-message';
import { isHackathonId } from '$lib/public-id';
import { requireAdmin } from '$lib/server/admin-auth';
import { getCustomerHackathonRecord, markDownPaymentPaid } from '$lib/server/hackathons';
import { json } from '@sveltejs/kit';

export async function POST({ params, locals }: { params: { id: string }; locals: App.Locals }) {
	requireAdmin(locals);
	const say = (de: string, en: string) => localeMessage(locals.locale, de, en);
	const id = params.id.toUpperCase();
	if (!isHackathonId(id)) return json({ message: say('Hackathon nicht gefunden.', 'Hackathon not found.') }, { status: 404 });
	const record = await getCustomerHackathonRecord(id);
	if (!record) return json({ message: say('Hackathon nicht gefunden.', 'Hackathon not found.') }, { status: 404 });
	if (!['contracted', 'confirmed', 'completed'].includes(record.status) || record.billingModel !== 'deposit_30' || !record.downPaymentInvoiceSnapshot) {
		return json({ message: say('Die Anzahlung kann für diese Buchung nicht als bezahlt markiert werden.', 'The deposit cannot be marked as paid for this booking.') }, { status: 409 });
	}
	if (record.downPaymentPaidAt) return json({ paidAt: record.downPaymentPaidAt });
	const paidAt = new Date().toISOString();
	const updated = await markDownPaymentPaid(id, paidAt);
	if (!updated) return json({ message: say('Der Zahlungseingang konnte nicht gespeichert werden.', 'The payment could not be saved.') }, { status: 409 });
	return json({ paidAt });
}
