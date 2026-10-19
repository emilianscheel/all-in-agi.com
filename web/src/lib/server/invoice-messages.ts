import type { Locale } from '$lib/i18n';
import { localeMessage } from '$lib/locale-message';
import { InvoiceConfigurationError } from './invoice-config';
import { InvoiceNotFoundError, InvoiceNotIssuableError } from './invoices';

export function invoiceErrorResponse(error: unknown, locale: Locale | undefined) {
	if (error instanceof InvoiceNotFoundError) {
		return { status: 404, message: localeMessage(locale, 'Hackathon nicht gefunden.', 'Hackathon not found.') };
	}
	if (error instanceof InvoiceNotIssuableError) {
		return { status: 409, message: localeMessage(locale, 'Für diese Buchung kann keine Rechnung ausgestellt werden.', 'An invoice cannot be issued for this booking.') };
	}
	if (error instanceof InvoiceConfigurationError) {
		return { status: 503, message: localeMessage(locale, 'Die Rechnungskonfiguration ist unvollständig.', 'The invoice configuration is incomplete.') };
	}
	return null;
}
