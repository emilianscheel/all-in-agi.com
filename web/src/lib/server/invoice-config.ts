import type { InvoiceLegalConfiguration } from '$lib/invoice';

export class InvoiceConfigurationError extends Error {
	constructor(readonly missing: string[]) {
		super(`Invoice configuration is incomplete: ${missing.join(', ')}`);
		this.name = 'InvoiceConfigurationError';
	}
}

export function getInvoiceLegalConfiguration(): InvoiceLegalConfiguration {
	const values = {
		taxIdLabel: process.env.INVOICE_TAX_ID_LABEL?.trim() ?? '',
		taxIdValue: process.env.INVOICE_TAX_ID_VALUE?.trim() ?? '',
		accountHolder: process.env.INVOICE_ACCOUNT_HOLDER?.trim() ?? '',
		iban: process.env.INVOICE_IBAN?.trim() ?? '',
		bic: process.env.INVOICE_BIC?.trim() ?? '',
		bank: process.env.INVOICE_BANK?.trim() ?? ''
	};
	const missing = (['accountHolder', 'iban', 'bic'] as const).filter((key) => !values[key]);
	if (missing.length) throw new InvoiceConfigurationError([...missing]);
	return values;
}
