import { CONTACT_EMAIL } from '$lib/contact';
import { localeMessage } from '$lib/locale-message';
import { isHackathonId } from '$lib/public-id';
import { requireAdmin } from '$lib/server/admin-auth';
import { EmailTransportError } from '$lib/server/email-transport';
import { sendInvoiceEmail, type InvoiceEmailDependencies } from '$lib/server/invoice-email';
import { invoiceErrorResponse } from '$lib/server/invoice-messages';
import { previewInvoice, type InvoicePersistenceDependencies } from '$lib/server/invoices';
import { json } from '@sveltejs/kit';

export interface InvoiceEmailTestEndpointDependencies extends InvoicePersistenceDependencies {
	send?: typeof sendInvoiceEmail;
	email?: InvoiceEmailDependencies;
}

const testDelivery = {
	to: { address: CONTACT_EMAIL, name: 'ALL IN AGI' },
	subjectPrefix: '[TEST] '
};

export function _createInvoiceEmailTestPost(dependencies: InvoiceEmailTestEndpointDependencies = {}) {
	return async function POST({ params, locals }: { params: { id: string }; locals: App.Locals }) {
		requireAdmin(locals);
		const id = params.id.toUpperCase();
		if (!isHackathonId(id)) return json({ message: localeMessage(locals.locale, 'Hackathon nicht gefunden.', 'Hackathon not found.') }, { status: 404 });
		try {
			const { snapshot } = await previewInvoice(id, dependencies);
			await (dependencies.send ?? sendInvoiceEmail)(snapshot, dependencies.email, testDelivery);
			return json({ sent: true });
		} catch (error) {
			const failure = invoiceErrorResponse(error, locals.locale);
			if (failure) return json({ message: failure.message }, { status: failure.status });
			const message = localeMessage(locals.locale, 'Die Test-Rechnungs-E-Mail konnte nicht gesendet werden.', 'The test invoice email could not be sent.');
			if (error instanceof EmailTransportError) return json({ message }, { status: error.stage === 'configuration' ? 503 : 502 });
			console.error('Invoice test email failed', { hackathonId: id, error });
			return json({ message }, { status: 500 });
		}
	};
}

export const POST = _createInvoiceEmailTestPost();
