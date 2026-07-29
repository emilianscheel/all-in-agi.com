export interface InvoiceAddress {
	street: string;
	postalCode: string;
	city: string;
	country: string;
}

export interface InvoiceSeller {
	legalName: string;
	brandName: string;
	address: InvoiceAddress;
	email: string;
	phone: string;
	taxIdLabel: string;
	taxIdValue: string;
}

export interface InvoiceCustomer {
	companyName: string;
	contactName: string;
	email: string;
	address: InvoiceAddress;
}

export interface InvoiceLineItem {
	description: string;
	netAmountCents: number;
}

export interface InvoicePayment {
	accountHolder: string;
	iban: string;
	bic: string;
	termsDays: number;
}

export interface InvoiceSnapshot {
	version: 1;
	hackathonId: string;
	invoiceNumber: string;
	issueDate: string;
	serviceDate: string;
	dueDate: string;
	seller: InvoiceSeller;
	customer: InvoiceCustomer;
	items: InvoiceLineItem[];
	netTotalCents: number;
	vatRatePercent: 19;
	vatAmountCents: number;
	grossTotalCents: number;
	payment: InvoicePayment;
}

export interface InvoiceLegalConfiguration {
	taxIdLabel: string;
	taxIdValue: string;
	accountHolder: string;
	iban: string;
	bic: string;
}

export interface InvoiceSource {
	id: string;
	companyName: string;
	contactName: string;
	contactEmail: string;
	address: InvoiceAddress;
	eventStart: string;
	capacity: number;
	basePrice: number;
	venueSurcharge: number;
	lunchAdjustment: number;
	toolsAdjustment: number;
	totalPrice: number;
}

function dateInBerlin(value: Date | string) {
	const date = typeof value === 'string' ? new Date(value) : value;
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Europe/Berlin',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).formatToParts(date);
	const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)?.value ?? '';
	return `${part('year')}-${part('month')}-${part('day')}`;
}

function addCalendarDays(date: string, days: number) {
	const [year, month, day] = date.split('-').map(Number);
	const value = new Date(Date.UTC(year, month - 1, day + days));
	return value.toISOString().slice(0, 10);
}

function eurosToCents(value: number) {
	if (!Number.isInteger(value)) throw new Error('Invoice amounts must be whole euros.');
	return value * 100;
}

export function createInvoiceSnapshot(
	source: InvoiceSource,
	legal: InvoiceLegalConfiguration,
	issuedAt = new Date()
): InvoiceSnapshot {
	const items: InvoiceLineItem[] = [
		{
			description: `Agentic Engineering Hackathon - bis ${source.capacity} Personen`,
			netAmountCents: eurosToCents(source.basePrice)
		}
	];
	for (const [description, amount] of [
		['Raumorganisation', source.venueSurcharge],
		[source.lunchAdjustment < 0 ? 'Catering-Abzug' : 'Catering', source.lunchAdjustment],
		['Coding-Tool-Bereitstellung', source.toolsAdjustment]
	] as const) {
		if (amount !== 0) items.push({ description, netAmountCents: eurosToCents(amount) });
	}

	const netTotalCents = eurosToCents(source.totalPrice);
	if (items.reduce((sum, item) => sum + item.netAmountCents, 0) !== netTotalCents) {
		throw new Error('Invoice line items do not match the stored total.');
	}
	const vatAmountCents = Math.round(netTotalCents * 0.19);
	const issueDate = dateInBerlin(issuedAt);

	return {
		version: 1,
		hackathonId: source.id,
		invoiceNumber: `RE-${source.id}`,
		issueDate,
		serviceDate: dateInBerlin(source.eventStart),
		dueDate: addCalendarDays(issueDate, 14),
		seller: {
			legalName: 'Emilian Scheel',
			brandName: 'ALL IN AGI',
			address: {
				street: 'Moosdorfstraße 10',
				postalCode: '12435',
				city: 'Berlin',
				country: 'Deutschland'
			},
			email: 'go@all-in-agi.com',
			phone: '0152 57257750',
			taxIdLabel: legal.taxIdLabel,
			taxIdValue: legal.taxIdValue
		},
		customer: {
			companyName: source.companyName,
			contactName: source.contactName,
			email: source.contactEmail,
			address: { ...source.address }
		},
		items,
		netTotalCents,
		vatRatePercent: 19,
		vatAmountCents,
		grossTotalCents: netTotalCents + vatAmountCents,
		payment: {
			accountHolder: legal.accountHolder,
			iban: legal.iban,
			bic: legal.bic,
			termsDays: 14
		}
	};
}

export function formatInvoiceMoney(cents: number) {
	return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export function formatInvoiceDate(value: string) {
	const [year, month, day] = value.split('-').map(Number);
	return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
		.format(new Date(Date.UTC(year, month - 1, day)));
}
