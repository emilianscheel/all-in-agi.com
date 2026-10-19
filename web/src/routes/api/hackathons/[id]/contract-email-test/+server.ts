import { isHackathonId } from '$lib/public-id';
import { requireAdmin } from '$lib/server/admin-auth';
import { sendContractConfirmationTestEmail } from '$lib/server/contract-confirmation-email';
import { getCustomerHackathonRecord } from '$lib/server/hackathons';
import { EmailTransportError } from '$lib/server/email-transport';
import { json } from '@sveltejs/kit';

export async function POST({ params, request, locals }: { params: { id: string }; request: Request; locals: App.Locals }) {
	requireAdmin(locals);
	const id = params.id.toUpperCase();
	if (!isHackathonId(id)) return json({ message: 'Hackathon nicht gefunden.' }, { status: 404 });
	let body: { customerName?: string; organizerName?: string };
	try {
		body = await request.json();
	} catch {
		return json({ message: 'Die Vertragsdaten sind ungültig.' }, { status: 400 });
	}
	if (!body.customerName?.trim() || !body.organizerName?.trim()) {
		return json({ message: 'Beide zustimmenden Personen müssen dokumentiert werden.' }, { status: 400 });
	}
	const record = await getCustomerHackathonRecord(id);
	if (!record) return json({ message: 'Hackathon nicht gefunden.' }, { status: 404 });
	if (!record.legalSnapshot) {
		return json({ message: 'Die Vertragsvorlage ist für diese Buchung nicht verfügbar.' }, { status: 409 });
	}
	try {
		const delivery = await sendContractConfirmationTestEmail(record, body.customerName, body.organizerName);
		return json({ emailSent: true, messageId: delivery.messageId });
	} catch (error) {
		console.error('Contract confirmation test email failed', { id, error });
		if (error instanceof EmailTransportError) {
			return json({ message: 'Die Test-Vertrags-E-Mail konnte nicht gesendet werden.' }, { status: error.stage === 'configuration' ? 503 : 502 });
		}
		return json({ message: 'Die Test-Vertrags-E-Mail konnte nicht gesendet werden.' }, { status: 500 });
	}
}
