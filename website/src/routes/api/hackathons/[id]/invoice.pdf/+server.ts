import { createInvoicePdf } from '$lib/invoice-artifacts';
import { isHackathonId } from '$lib/public-id';
import { requireAdmin } from '$lib/server/admin-auth';
import { InvoiceConfigurationError } from '$lib/server/invoice-config';
import {
	getOrCreateInvoice,
	InvoiceNotFoundError,
	InvoiceNotIssuableError,
	type InvoicePersistenceDependencies
} from '$lib/server/invoices';
import { json } from '@sveltejs/kit';

export interface InvoicePdfEndpointDependencies extends InvoicePersistenceDependencies {
	createPdf?: typeof createInvoicePdf;
}

export function _createInvoicePdfPost(dependencies: InvoicePdfEndpointDependencies = {}) {
	return async function POST({ params, locals }: { params: { id: string }; locals: App.Locals }) {
		requireAdmin(locals);
		const id = params.id.toUpperCase();
		if (!isHackathonId(id)) return json({ message: 'Hackathon nicht gefunden.' }, { status: 404 });
		try {
			const { snapshot } = await getOrCreateInvoice(id, dependencies);
			const bytes = await (dependencies.createPdf ?? createInvoicePdf)(snapshot);
			return new Response(new Blob([bytes as Uint8Array<ArrayBuffer>]), {
				headers: {
					'content-type': 'application/pdf',
					'content-disposition': `attachment; filename="all-in-agi-rechnung-${id}.pdf"`,
					'cache-control': 'private, no-store'
				}
			});
		} catch (error) {
			if (error instanceof InvoiceNotFoundError) return json({ message: error.message }, { status: 404 });
			if (error instanceof InvoiceNotIssuableError) return json({ message: error.message }, { status: 409 });
			if (error instanceof InvoiceConfigurationError) {
				return json({ message: 'Die Rechnungskonfiguration ist unvollständig.' }, { status: 503 });
			}
			console.error('Invoice PDF generation failed', { hackathonId: id, error });
			return json({ message: 'Die Rechnung konnte nicht erstellt werden.' }, { status: 500 });
		}
	};
}

export const POST = _createInvoicePdfPost();
