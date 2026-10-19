import { localeMessage } from '$lib/locale-message';
import { isHackathonId } from '$lib/public-id';
import { requireAdmin } from '$lib/server/admin-auth';
import { EmailTransportError } from '$lib/server/email-transport';
import { sendInvoiceEmail, type InvoiceEmailDependencies } from '$lib/server/invoice-email';
import { invoiceErrorResponse } from '$lib/server/invoice-messages';
import {
	getOrCreateInvoice,
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
	return async function POST({ params, locals }: { params: { id: string }; locals: App.Locals }) {
		requireAdmin(locals);
		const id = params.id.toUpperCase();
		if (!isHackathonId(id)) return json({ message: 'Hackathon nicht gefunden.' }, { status: 404 });
		try {
			const { record, snapshot } = await getOrCreateInvoice(id, dependencies);
			if (!['contracted', 'confirmed', 'completed'].includes(record.status)) {
				return json({ message: localeMessage(locals.locale, 'Für diesen Vertragsstatus kann keine Rechnung versandt werden.', 'An invoice cannot be sent for this contract status.') }, { status: 409 });
			}
			const delivery = await (dependencies.send ?? sendInvoiceEmail)(snapshot, dependencies.email);
			const sentAt = dependencies.nowIso?.() ?? new Date().toISOString();
			const updated = await (dependencies.markSent ?? markInvoiceEmailSent)(id, delivery.messageId, sentAt);
			if (!updated) throw new Error('Invoice delivery state could not be saved.');
			return json({ sent: true, sentAt });
		} catch (error) {
			const failure = invoiceErrorResponse(error, locals.locale);
			if (failure) return json({ message: failure.message }, { status: failure.status });
			if (error instanceof EmailTransportError) {
				const status = error.stage === 'configuration' ? 503
					: error.stage === 'network' || error.stage === 'provider' ? 502
					: 500;
				return json({ message: localeMessage(locals.locale, 'Die Rechnungs-E-Mail konnte nicht gesendet werden.', 'The invoice email could not be sent.') }, { status });
			}
			console.error('Invoice email failed', { hackathonId: id, error });
			return json({ message: localeMessage(locals.locale, 'Die Rechnungs-E-Mail konnte nicht gesendet werden.', 'The invoice email could not be sent.') }, { status: 500 });
		}
	};
}

export const POST = _createInvoiceEmailPost();
