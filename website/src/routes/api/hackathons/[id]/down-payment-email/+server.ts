import { isHackathonId } from '$lib/public-id';
import { requireAdmin } from '$lib/server/admin-auth';
import { EmailTransportError } from '$lib/server/email-transport';
import { sendInvoiceEmail, type InvoiceEmailDependencies } from '$lib/server/invoice-email';
import { InvoiceConfigurationError } from '$lib/server/invoice-config';
import { markDownPaymentInvoiceEmailSent, type HackathonRecord } from '$lib/server/hackathons';
import {
	getOrCreateDownPaymentInvoice,
	InvoiceNotFoundError,
	InvoiceNotIssuableError,
	type InvoicePersistenceDependencies
} from '$lib/server/invoices';
import { json } from '@sveltejs/kit';

export interface DownPaymentEmailEndpointDependencies extends InvoicePersistenceDependencies {
	send?: typeof sendInvoiceEmail;
	markSent?: (id: string, messageId?: string, at?: string) => Promise<HackathonRecord | null>;
	email?: InvoiceEmailDependencies;
	nowIso?: () => string;
}

export function _createDownPaymentEmailPost(dependencies: DownPaymentEmailEndpointDependencies = {}) {
	return async function POST({ params, locals, fetch }: { params: { id: string }; locals: App.Locals; fetch: typeof globalThis.fetch }) {
		requireAdmin(locals);
		const id = params.id.toUpperCase();
		if (!isHackathonId(id)) return json({ message: 'Hackathon nicht gefunden.' }, { status: 404 });
		try {
			const { record, snapshot } = await getOrCreateDownPaymentInvoice(id, dependencies);
			if (record.status !== 'confirmed') return json({ message: 'Eine stornierte Buchung kann keine Rechnung erhalten.' }, { status: 409 });
			const delivery = await (dependencies.send ?? sendInvoiceEmail)(snapshot, { ...dependencies.email, fetch: dependencies.email?.fetch ?? fetch });
			const sentAt = dependencies.nowIso?.() ?? new Date().toISOString();
			const updated = await (dependencies.markSent ?? markDownPaymentInvoiceEmailSent)(id, delivery.messageId, sentAt);
			if (!updated) throw new Error('Down-payment delivery state could not be saved.');
			return json({ sent: true, sentAt });
		} catch (error) {
			if (error instanceof InvoiceNotFoundError) return json({ message: error.message }, { status: 404 });
			if (error instanceof InvoiceNotIssuableError) return json({ message: error.message }, { status: 409 });
			if (error instanceof InvoiceConfigurationError) return json({ message: 'Die Rechnungskonfiguration ist unvollständig.' }, { status: 503 });
			if (error instanceof EmailTransportError) return json({ message: 'Die Anzahlungsrechnung konnte nicht gesendet werden.' }, { status: error.stage === 'configuration' ? 503 : 502 });
			console.error('Down-payment invoice email failed', { hackathonId: id, error });
			return json({ message: 'Die Anzahlungsrechnung konnte nicht gesendet werden.' }, { status: 500 });
		}
	};
}

export const POST = _createDownPaymentEmailPost();
