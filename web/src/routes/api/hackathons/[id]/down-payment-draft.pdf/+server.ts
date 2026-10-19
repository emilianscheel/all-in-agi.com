import { createInvoicePdf } from '$lib/invoice-artifacts';
import { localeMessage } from '$lib/locale-message';
import { isHackathonId } from '$lib/public-id';
import { requireAdmin } from '$lib/server/admin-auth';
import { invoiceErrorResponse } from '$lib/server/invoice-messages';
import {
	previewDownPaymentInvoiceDraft,
	type InvoicePersistenceDependencies
} from '$lib/server/invoices';
import { json } from '@sveltejs/kit';

export interface DownPaymentDraftPdfEndpointDependencies extends InvoicePersistenceDependencies {
	createPdf?: typeof createInvoicePdf;
}

export function _createDownPaymentDraftPdfPost(dependencies: DownPaymentDraftPdfEndpointDependencies = {}) {
	return async function POST({ params, locals }: { params: { id: string }; locals: App.Locals }) {
		requireAdmin(locals);
		const id = params.id.toUpperCase();
		if (!isHackathonId(id)) return json({ message: localeMessage(locals.locale, 'Hackathon nicht gefunden.', 'Hackathon not found.') }, { status: 404 });
		try {
			const { snapshot } = await previewDownPaymentInvoiceDraft(id, dependencies, locals.locale);
			const bytes = await (dependencies.createPdf ?? createInvoicePdf)(snapshot);
			return new Response(new Blob([bytes as Uint8Array<ArrayBuffer>]), {
				headers: {
					'content-type': 'application/pdf',
					'content-disposition': `attachment; filename="all-in-agi-anzahlungsentwurf-${id}.pdf"`,
					'cache-control': 'private, no-store'
				}
			});
		} catch (error) {
			const failure = invoiceErrorResponse(error, locals.locale);
			if (failure) return json({ message: failure.message }, { status: failure.status });
			console.error('Deposit invoice draft PDF generation failed', { hackathonId: id, error });
			return json({ message: localeMessage(locals.locale, 'Der Anzahlungsentwurf konnte nicht erstellt werden.', 'The deposit invoice draft could not be created.') }, { status: 500 });
		}
	};
}

export const POST = _createDownPaymentDraftPdfPost();
