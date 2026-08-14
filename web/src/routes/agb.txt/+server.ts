import { LEGAL_MODULES, legalDocumentPlainText } from '$lib/legal';

export function GET() {
	return new Response(legalDocumentPlainText(LEGAL_MODULES.map(({ id }) => id)), {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
			'content-disposition': 'attachment; filename="ALL-IN-AGI-Allgemeine-Geschaeftsbedingungen.txt"'
		}
	});
}
