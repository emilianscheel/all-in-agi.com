import { localeMessage } from '$lib/locale-message';
import { isHackathonId } from '$lib/public-id';
import { effectiveBillingDetails, validateBillingDetails } from '$lib/booking';
import { requireAdmin } from '$lib/server/admin-auth';
import { sendContractConfirmationEmail } from '$lib/server/contract-confirmation-email';
import { recordOralAgreement } from '$lib/server/legal-contracts';
import { getCustomerHackathonRecord } from '$lib/server/hackathons';
import { json } from '@sveltejs/kit';

export async function POST({ params, request, locals }: { params: { id: string }; request: Request; locals: App.Locals }) {
	requireAdmin(locals);
	const say = (de: string, en: string) => localeMessage(locals.locale, de, en);
	const id = params.id.toUpperCase();
	if (!isHackathonId(id)) return json({ message: say('Hackathon nicht gefunden.', 'Hackathon not found.') }, { status: 404 });
	let body: { customerName?: string; organizerName?: string; agreedAt?: string };
	try { body = await request.json(); } catch { return json({ message: say('Die Vertragsdaten sind ungültig.', 'The contract details are invalid.') }, { status: 400 }); }
	if (!body.customerName?.trim() || !body.organizerName?.trim()) return json({ message: say('Beide zustimmenden Personen müssen dokumentiert werden.', 'Both agreeing people must be recorded.') }, { status: 400 });
	const current = await getCustomerHackathonRecord(id);
	if (!current) return json({ message: say('Hackathon nicht gefunden.', 'Hackathon not found.') }, { status: 404 });
	const billing = effectiveBillingDetails({
		billing: current.billing,
		companyName: current.companyName,
		contactName: current.contactName,
		email: current.contactEmail,
		address: current.address
	});
	const readinessErrors = validateBillingDetails(billing, locals.locale);
	if (readinessErrors.length) return json({ message: say('Vor der Vertragszustimmung müssen die Rechnungsdaten vollständig hinterlegt werden.', 'Billing details must be complete before recording the agreement.'), errors: readinessErrors }, { status: 409 });
	const agreedAt = body.agreedAt ? new Date(body.agreedAt) : new Date();
	if (Number.isNaN(agreedAt.getTime()) || agreedAt > new Date()) return json({ message: say('Der Zustimmungszeitpunkt ist ungültig.', 'The agreement time is invalid.') }, { status: 400 });
	const record = await recordOralAgreement(id, body.customerName, body.organizerName, agreedAt, current.billing ? undefined : billing);
	if (!record) return json({ message: say('Die Zustimmung kann in diesem Status nicht erfasst werden.', 'The agreement cannot be recorded in this status.') }, { status: 409 });
	try {
		const delivery = await sendContractConfirmationEmail(record);
		return json({ status: record.status, exitDeadline: record.exitDeadline, emailSent: true, messageId: delivery.messageId });
	} catch (error) {
		console.error('Contract confirmation email failed', { id, error });
		return json({ status: record.status, exitDeadline: record.exitDeadline, emailSent: false, message: say('Die Zustimmung wurde gespeichert, aber die Vertrags-E-Mail konnte nicht gesendet werden.', 'The agreement was saved, but the contract email could not be sent.') }, { status: 202 });
	}
}
