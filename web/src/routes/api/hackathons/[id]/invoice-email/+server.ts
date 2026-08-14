import { isHackathonId } from '$lib/public-id';
import { requireAdmin } from '$lib/server/admin-auth';
import { EmailTransportError } from '$lib/server/email-transport';
import { sendInvoiceEmail, type InvoiceEmailDependencies } from '$lib/server/invoice-email';
import { InvoiceConfigurationError } from '$lib/server/invoice-config';
import {
	getOrCreateInvoice,
	InvoiceNotFoundError,
	InvoiceNotIssuableError,
	type InvoicePersistenceDependencies
} from '$lib/server/invoices';
import { markInvoiceEmailSent, type HackathonRecord } from '$lib/server/hackathons';
import { json } from '@sveltejs/kit';

export interface InvoiceEmailEndpointDependencies extends InvoicePersistenceDependencies {
	send?: typeof sendInvoiceEmail;
	markSent?: (id: string, messageId?: string, at?: string) => Promise<HackathonRecord | null>;
	email?: InvoiceEmailDependencies;
	nowIso?: () => string;
}

export function _createInvoiceEmailPost(dependencies: InvoiceEmailEndpointDependencies = {}) {
	return async function POST({ params, locals, fetch }: { params: { id: string }; locals: App.Locals; fetch: typeof globalThis.fetch }) {
		requireAdmin(locals);
		const id = params.id.toUpperCase();
		if (!isHackathonId(id)) return json({ message: 'Hackathon nicht gefunden.' }, { status: 404 });
		try {
			const { record, snapshot } = await getOrCreateInvoice(id, dependencies);
			if (!['contracted', 'confirmed', 'completed'].includes(record.status)) {
				return json({ message: 'Für diesen Vertragsstatus kann keine Rechnung versandt werden.' }, { status: 409 });
			}
			const delivery = await (dependencies.send ?? sendInvoiceEmail)(snapshot, {
				...dependencies.email,
				fetch: dependencies.email?.fetch ?? fetch
			});
			const sentAt = dependencies.nowIso?.() ?? new Date().toISOString();
			const updated = await (dependencies.markSent ?? markInvoiceEmailSent)(id, delivery.messageId, sentAt);
			if (!updated) throw new Error('Invoice delivery state could not be saved.');
			return json({ sent: true, sentAt });
		} catch (error) {
			if (error instanceof InvoiceNotFoundError) return json({ message: error.message }, { status: 404 });
			if (error instanceof InvoiceNotIssuableError) return json({ message: error.message }, { status: 409 });
			if (error instanceof InvoiceConfigurationError) {
				return json({ message: 'Die Rechnungskonfiguration ist unvollständig.' }, { status: 503 });
			}
			if (error instanceof EmailTransportError) {
				const status = error.stage === 'configuration' ? 503
					: error.stage === 'network' || error.stage === 'provider' ? 502
					: 500;
				return json({ message: 'Die Rechnungs-E-Mail konnte nicht gesendet werden.' }, { status });
			}
			console.error('Invoice email failed', { hackathonId: id, error });
			return json({ message: 'Die Rechnungs-E-Mail konnte nicht gesendet werden.' }, { status: 500 });
		}
	};
}

export const POST = _createInvoiceEmailPost();
