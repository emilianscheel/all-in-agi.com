import { createInvoicePdf } from '$lib/invoice-artifacts';
import { localeMessage } from '$lib/locale-message';
import { isHackathonId } from '$lib/public-id';
import { requireAdmin } from '$lib/server/admin-auth';
import { invoiceErrorResponse } from '$lib/server/invoice-messages';
import {
	getOrCreateDownPaymentInvoice,
	type InvoicePersistenceDependencies
} from '$lib/server/invoices';
import { json } from '@sveltejs/kit';

export interface DownPaymentPdfEndpointDependencies extends InvoicePersistenceDependencies {
	createPdf?: typeof createInvoicePdf;
}

export function _createDownPaymentPdfPost(dependencies: DownPaymentPdfEndpointDependencies = {}) {
	return async function POST({ params, locals }: { params: { id: string }; locals: App.Locals }) {
		requireAdmin(locals);
		const id = params.id.toUpperCase();
		if (!isHackathonId(id)) return json({ message: 'Hackathon nicht gefunden.' }, { status: 404 });
		try {
			const { snapshot } = await getOrCreateDownPaymentInvoice(id, dependencies);
			const bytes = await (dependencies.createPdf ?? createInvoicePdf)(snapshot);
			return new Response(new Blob([bytes as Uint8Array<ArrayBuffer>]), {
				headers: {
					'content-type': 'application/pdf',
					'content-disposition': `attachment; filename="all-in-agi-anzahlung-${id}.pdf"`,
					'cache-control': 'private, no-store'
				}
			});
		} catch (error) {
			const failure = invoiceErrorResponse(error, locals.locale);
			if (failure) return json({ message: failure.message }, { status: failure.status });
			console.error('Down-payment PDF generation failed', { hackathonId: id, error });
			return json({ message: localeMessage(locals.locale, 'Die Anzahlungsrechnung konnte nicht erstellt werden.', 'The deposit invoice could not be created.') }, { status: 500 });
		}
	};
}

export const POST = _createDownPaymentPdfPost();
