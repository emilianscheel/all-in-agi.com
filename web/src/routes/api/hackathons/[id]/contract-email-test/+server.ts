import { localeMessage } from '$lib/locale-message';
import { isHackathonId } from '$lib/public-id';
import { requireAdmin } from '$lib/server/admin-auth';
import { sendContractConfirmationTestEmail } from '$lib/server/contract-confirmation-email';
import { getCustomerHackathonRecord } from '$lib/server/hackathons';
import { EmailTransportError } from '$lib/server/email-transport';
import { json } from '@sveltejs/kit';

export async function POST({ params, request, locals }: { params: { id: string }; request: Request; locals: App.Locals }) {
	requireAdmin(locals);
	const say = (de: string, en: string) => localeMessage(locals.locale, de, en);
	const id = params.id.toUpperCase();
	if (!isHackathonId(id)) return json({ message: say('Hackathon nicht gefunden.', 'Hackathon not found.') }, { status: 404 });
	let body: { customerName?: string; organizerName?: string };
	try {
		body = await request.json();
	} catch {
		return json({ message: say('Die Vertragsdaten sind ungültig.', 'The contract details are invalid.') }, { status: 400 });
	}
	if (!body.customerName?.trim() || !body.organizerName?.trim()) {
		return json({ message: say('Beide zustimmenden Personen müssen dokumentiert werden.', 'Both agreeing people must be recorded.') }, { status: 400 });
	}
	const record = await getCustomerHackathonRecord(id);
	if (!record) return json({ message: say('Hackathon nicht gefunden.', 'Hackathon not found.') }, { status: 404 });
	if (!record.legalSnapshot) {
		return json({ message: say('Die Vertragsvorlage ist für diese Buchung nicht verfügbar.', 'The contract template is not available for this booking.') }, { status: 409 });
	}
	try {
		const delivery = await sendContractConfirmationTestEmail(record, body.customerName, body.organizerName);
		return json({ emailSent: true, messageId: delivery.messageId });
	} catch (error) {
		console.error('Contract confirmation test email failed', { id, error });
		const message = say('Die Test-Vertrags-E-Mail konnte nicht gesendet werden.', 'The test contract email could not be sent.');
		if (error instanceof EmailTransportError) {
			return json({ message }, { status: error.stage === 'configuration' ? 503 : 502 });
		}
		return json({ message }, { status: 500 });
	}
}
