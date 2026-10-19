import { afterEach, describe, expect, test } from 'bun:test';
import { getInvoiceLegalConfiguration, InvoiceConfigurationError } from './invoice-config';

const keys = ['INVOICE_TAX_ID_LABEL', 'INVOICE_TAX_ID_VALUE', 'INVOICE_ACCOUNT_HOLDER', 'INVOICE_IBAN', 'INVOICE_BIC', 'INVOICE_BANK'] as const;
const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

afterEach(() => {
	for (const key of keys) {
		const value = previous[key];
		if (value === undefined) delete process.env[key];
		else process.env[key] = value;
	}
});

describe('invoice legal configuration', () => {
	test('accepts bank details without a seller tax ID', () => {
		delete process.env.INVOICE_TAX_ID_LABEL;
		delete process.env.INVOICE_TAX_ID_VALUE;
		process.env.INVOICE_ACCOUNT_HOLDER = 'Emilian Scheel';
		process.env.INVOICE_IBAN = 'de02 120300000000202051';
		process.env.INVOICE_BIC = 'BYLADEM1001';
		process.env.INVOICE_BANK = 'Trade Republic';
		expect(getInvoiceLegalConfiguration()).toEqual({
			taxIdLabel: '',
			taxIdValue: '',
			accountHolder: 'Emilian Scheel',
			iban: 'de02 120300000000202051',
			bic: 'BYLADEM1001',
			bank: 'Trade Republic'
		});
	});

	test('still requires the account holder, IBAN, and BIC', () => {
		process.env.INVOICE_TAX_ID_LABEL = 'USt-IdNr.';
		process.env.INVOICE_TAX_ID_VALUE = 'DE123456789';
		process.env.INVOICE_ACCOUNT_HOLDER = 'Emilian Scheel';
		delete process.env.INVOICE_IBAN;
		delete process.env.INVOICE_BIC;
		expect(() => getInvoiceLegalConfiguration()).toThrow(InvoiceConfigurationError);
	});
});
