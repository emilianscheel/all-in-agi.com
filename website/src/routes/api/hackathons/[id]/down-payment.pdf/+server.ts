import { createInvoicePdf } from '$lib/invoice-artifacts';
import { isHackathonId } from '$lib/public-id';
import { requireAdmin } from '$lib/server/admin-auth';
import { InvoiceConfigurationError } from '$lib/server/invoice-config';
import {
	getOrCreateDownPaymentInvoice,
	InvoiceNotFoundError,
	InvoiceNotIssuableError,
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
			if (error instanceof InvoiceNotFoundError) return json({ message: error.message }, { status: 404 });
			if (error instanceof InvoiceNotIssuableError) return json({ message: error.message }, { status: 409 });
			if (error instanceof InvoiceConfigurationError) return json({ message: 'Die Rechnungskonfiguration ist unvollständig.' }, { status: 503 });
			console.error('Down-payment PDF generation failed', { hackathonId: id, error });
			return json({ message: 'Die Anzahlungsrechnung konnte nicht erstellt werden.' }, { status: 500 });
		}
	};
}

export const POST = _createDownPaymentPdfPost();
