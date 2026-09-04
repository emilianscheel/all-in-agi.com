import { LEGAL_MODULES, legalDocumentPlainText } from '$lib/legal';

export function GET({ locals }) {
	const locale = locals.locale;
	return new Response(legalDocumentPlainText(LEGAL_MODULES.map(({ id }) => id), locale), {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
			'content-disposition': `attachment; filename="ALL-IN-AGI-${locale === 'en' ? 'Terms-and-Conditions' : 'Allgemeine-Geschaeftsbedingungen'}.txt"`
		}
	});
}
