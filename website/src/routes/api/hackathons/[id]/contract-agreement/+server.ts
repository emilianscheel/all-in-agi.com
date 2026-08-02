import { isHackathonId } from '$lib/public-id';
import { requireAdmin } from '$lib/server/admin-auth';
import { sendContractConfirmationEmail } from '$lib/server/contract-confirmation-email';
import { recordOralAgreement } from '$lib/server/legal-contracts';
import { json } from '@sveltejs/kit';

export async function POST({ params, request, locals, fetch }: { params: { id: string }; request: Request; locals: App.Locals; fetch: typeof globalThis.fetch }) {
	requireAdmin(locals);
	const id = params.id.toUpperCase();
	if (!isHackathonId(id)) return json({ message: 'Hackathon nicht gefunden.' }, { status: 404 });
	let body: { customerName?: string; organizerName?: string; agreedAt?: string };
	try { body = await request.json(); } catch { return json({ message: 'Die Vertragsdaten sind ungültig.' }, { status: 400 }); }
	if (!body.customerName?.trim() || !body.organizerName?.trim()) return json({ message: 'Beide zustimmenden Personen müssen dokumentiert werden.' }, { status: 400 });
	const agreedAt = body.agreedAt ? new Date(body.agreedAt) : new Date();
	if (Number.isNaN(agreedAt.getTime()) || agreedAt > new Date()) return json({ message: 'Der Zustimmungszeitpunkt ist ungültig.' }, { status: 400 });
	const record = await recordOralAgreement(id, body.customerName, body.organizerName, agreedAt);
	if (!record) return json({ message: 'Die Zustimmung kann in diesem Status nicht erfasst werden.' }, { status: 409 });
	try {
		const delivery = await sendContractConfirmationEmail(record, { fetch });
		return json({ status: record.status, exitDeadline: record.exitDeadline, emailSent: true, messageId: delivery.messageId });
	} catch (error) {
		console.error('Contract confirmation email failed', { id, error });
		return json({ status: record.status, exitDeadline: record.exitDeadline, emailSent: false, message: 'Die Zustimmung wurde gespeichert, aber die Vertrags-E-Mail konnte nicht gesendet werden.' }, { status: 202 });
	}
}

