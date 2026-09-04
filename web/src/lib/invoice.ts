import type { Locale } from './i18n';

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
	legalForm?: string;
	contactName: string;
	email: string;
	vatId?: string;
	purchaseOrder?: string;
	address: InvoiceAddress;
}

export interface InvoiceLineItem {
	description: string;
	netAmountCents: number;
	vatRatePercent?: number;
}

export interface InvoicePayment {
	accountHolder: string;
	iban: string;
	bic: string;
	termsDays: number;
}

interface InvoiceSnapshotBase {
	locale?: 'de' | 'en';
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

export interface LegacyInvoiceSnapshot extends InvoiceSnapshotBase {
	version: 1;
}

export interface SplitInvoiceSnapshot extends InvoiceSnapshotBase {
	version: 2;
	kind: 'down-payment' | 'final';
}

export type InvoiceSnapshot = LegacyInvoiceSnapshot | SplitInvoiceSnapshot;

export interface InvoiceLegalConfiguration {
	taxIdLabel: string;
	taxIdValue: string;
	accountHolder: string;
	iban: string;
	bic: string;
}

export interface InvoiceSource {
	locale?: 'de' | 'en';
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
	deviceCount: number;
	devicesAdjustment: number;
	totalPrice: number;
	billing?: {
		companyName: string;
		legalForm: string;
		contactName: string;
		email: string;
		vatId: string;
		purchaseOrder: string;
		address: InvoiceAddress;
	} | null;
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
	issuedAt = new Date(),
	invoiceNumber = `RE-${source.id}`
): InvoiceSnapshot {
	const en = source.locale === 'en';
	const items: InvoiceLineItem[] = [
		{
			description: en ? `Agentic Engineering Hackathon - up to ${source.capacity} people` : `Agentic Engineering Hackathon - bis ${source.capacity} Personen`,
			netAmountCents: eurosToCents(source.basePrice)
		}
	];
	for (const [description, amount] of [
		[en ? 'Venue organization' : 'Raumorganisation', source.venueSurcharge],
		[source.lunchAdjustment < 0 ? (en ? 'Catering deduction' : 'Catering-Abzug') : 'Catering', source.lunchAdjustment],
		[en ? 'Coding tool provision' : 'Coding-Tool-Bereitstellung', source.toolsAdjustment],
		[en ? `${source.deviceCount} rental devices × €150` : `${source.deviceCount} Leihgeräte × 150 €`, source.devicesAdjustment]
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
		locale: source.locale ?? 'de',
		hackathonId: source.id,
		invoiceNumber,
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
		customer: invoiceCustomer(source),
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

function splitInvoiceBase(
	source: InvoiceSource,
	legal: InvoiceLegalConfiguration,
	invoiceNumber: string,
	issueDate: string,
	dueDate: string,
	items: InvoiceLineItem[],
	kind: SplitInvoiceSnapshot['kind']
): SplitInvoiceSnapshot {
	const netTotalCents = items.reduce((sum, item) => sum + item.netAmountCents, 0);
	const vatAmountCents = Math.round(netTotalCents * 0.19);
	return {
		version: 2,
		locale: source.locale ?? 'de',
		kind,
		hackathonId: source.id,
		invoiceNumber,
		issueDate,
		serviceDate: dateInBerlin(source.eventStart),
		dueDate,
		seller: {
			legalName: 'Emilian Scheel',
			brandName: 'ALL IN AGI',
			address: { street: 'Moosdorfstraße 10', postalCode: '12435', city: 'Berlin', country: 'Deutschland' },
			email: 'go@all-in-agi.com',
			phone: '0152 57257750',
			taxIdLabel: legal.taxIdLabel,
			taxIdValue: legal.taxIdValue
		},
		customer: invoiceCustomer(source),
		items,
		netTotalCents,
		vatRatePercent: 19,
		vatAmountCents,
		grossTotalCents: netTotalCents + vatAmountCents,
		payment: {
			accountHolder: legal.accountHolder,
			iban: legal.iban,
			bic: legal.bic,
			termsDays: kind === 'down-payment' ? 7 : 14
		}
	};
}

export function createDownPaymentInvoiceSnapshot(
	source: InvoiceSource,
	legal: InvoiceLegalConfiguration,
	issuedAt = new Date(),
	invoiceNumber = `RE-${source.id}-AZ`
) {
	const issueDate = dateInBerlin(issuedAt);
	const netAmountCents = Math.round(eurosToCents(source.totalPrice) * 0.3);
	return splitInvoiceBase(
		source,
		legal,
		invoiceNumber,
		issueDate,
		addCalendarDays(issueDate, 7),
		[{ description: source.locale === 'en' ? `30% deposit – Agentic Engineering Hackathon for up to ${source.capacity} people` : `30 % Anzahlung – Agentic Engineering Hackathon für bis zu ${source.capacity} Personen`, netAmountCents }],
		'down-payment'
	);
}

export function createFinalInvoiceSnapshot(
	source: InvoiceSource,
	legal: InvoiceLegalConfiguration,
	downPayment: SplitInvoiceSnapshot,
	issuedAt = new Date(),
	invoiceNumber = `RE-${source.id}-ER`
) {
	if (downPayment.kind !== 'down-payment') throw new Error('A down-payment invoice is required.');
	const items: InvoiceLineItem[] = [
		{ description: source.locale === 'en' ? `Agentic Engineering Hackathon - up to ${source.capacity} people` : `Agentic Engineering Hackathon - bis ${source.capacity} Personen`, netAmountCents: eurosToCents(source.basePrice) }
	];
	for (const [description, amount] of [
		[source.locale === 'en' ? 'Venue organization' : 'Raumorganisation', source.venueSurcharge],
		[source.lunchAdjustment < 0 ? (source.locale === 'en' ? 'Catering deduction' : 'Catering-Abzug') : 'Catering', source.lunchAdjustment],
		[source.locale === 'en' ? 'Coding tool provision' : 'Coding-Tool-Bereitstellung', source.toolsAdjustment],
		[source.locale === 'en' ? `${source.deviceCount} rental devices × €150` : `${source.deviceCount} Leihgeräte × 150 €`, source.devicesAdjustment]
	] as const) {
		if (amount !== 0) items.push({ description, netAmountCents: eurosToCents(amount) });
	}
	if (items.reduce((sum, item) => sum + item.netAmountCents, 0) !== eurosToCents(source.totalPrice)) {
		throw new Error('Invoice line items do not match the stored total.');
	}
	items.push({
		description: source.locale === 'en' ? `Deposit received ${downPayment.invoiceNumber} (VAT included ${formatInvoiceMoney(downPayment.vatAmountCents)})` : `Erhaltene Anzahlung ${downPayment.invoiceNumber} (enthaltene USt. ${formatInvoiceMoney(downPayment.vatAmountCents)})`,
		netAmountCents: -downPayment.netTotalCents
	});
	const issueDate = dateInBerlin(issuedAt);
	return splitInvoiceBase(source, legal, invoiceNumber, issueDate, addCalendarDays(issueDate, 14), items, 'final');
}

function invoiceCustomer(source: InvoiceSource): InvoiceCustomer {
	if (source.billing) {
		return {
			companyName: source.billing.companyName,
			legalForm: source.billing.legalForm,
			contactName: source.billing.contactName,
			email: source.billing.email,
			vatId: source.billing.vatId,
			purchaseOrder: source.billing.purchaseOrder,
			address: { ...source.billing.address }
		};
	}
	return { companyName: source.companyName, contactName: source.contactName, email: source.contactEmail, address: { ...source.address } };
}

function xmlEscape(value: string) {
	return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

function zugferdDate(value: string) {
	return value.replaceAll('-', '');
}

export function createZugferdXml(snapshot: InvoiceSnapshot) {
	const itemXml = snapshot.items.map((item, index) => `<ram:IncludedSupplyChainTradeLineItem>
<ram:AssociatedDocumentLineDocument><ram:LineID>${index + 1}</ram:LineID></ram:AssociatedDocumentLineDocument>
<ram:SpecifiedTradeProduct><ram:Name>${xmlEscape(item.description)}</ram:Name></ram:SpecifiedTradeProduct>
<ram:SpecifiedLineTradeAgreement><ram:NetPriceProductTradePrice><ram:ChargeAmount>${(item.netAmountCents / 100).toFixed(2)}</ram:ChargeAmount><ram:BasisQuantity unitCode="C62">1</ram:BasisQuantity></ram:NetPriceProductTradePrice></ram:SpecifiedLineTradeAgreement>
<ram:SpecifiedLineTradeDelivery><ram:BilledQuantity unitCode="C62">1</ram:BilledQuantity></ram:SpecifiedLineTradeDelivery>
<ram:SpecifiedLineTradeSettlement><ram:ApplicableTradeTax><ram:TypeCode>VAT</ram:TypeCode><ram:CategoryCode>S</ram:CategoryCode><ram:RateApplicablePercent>${item.vatRatePercent ?? snapshot.vatRatePercent}</ram:RateApplicablePercent></ram:ApplicableTradeTax><ram:SpecifiedTradeSettlementLineMonetarySummation><ram:LineTotalAmount>${(item.netAmountCents / 100).toFixed(2)}</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation></ram:SpecifiedLineTradeSettlement>
</ram:IncludedSupplyChainTradeLineItem>`).join('');
	const sellerName = `${snapshot.seller.legalName}, handelnd unter ${snapshot.seller.brandName}`;
	const buyerReference = snapshot.customer.purchaseOrder ? `<ram:BuyerReference>${xmlEscape(snapshot.customer.purchaseOrder)}</ram:BuyerReference>` : '';
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
<rsm:ExchangedDocumentContext><ram:GuidelineSpecifiedDocumentContextParameter><ram:ID>urn:cen.eu:en16931:2017#compliant#urn:zugferd.de:2p3:EN16931</ram:ID></ram:GuidelineSpecifiedDocumentContextParameter></rsm:ExchangedDocumentContext>
<rsm:ExchangedDocument><ram:ID>${xmlEscape(snapshot.invoiceNumber)}</ram:ID><ram:TypeCode>380</ram:TypeCode><ram:IssueDateTime><udt:DateTimeString format="102">${zugferdDate(snapshot.issueDate)}</udt:DateTimeString></ram:IssueDateTime></rsm:ExchangedDocument>
<rsm:SupplyChainTradeTransaction>${itemXml}
<ram:ApplicableHeaderTradeAgreement>
<ram:SellerTradeParty><ram:Name>${xmlEscape(sellerName)}</ram:Name><ram:PostalTradeAddress><ram:PostcodeCode>${xmlEscape(snapshot.seller.address.postalCode)}</ram:PostcodeCode><ram:LineOne>${xmlEscape(snapshot.seller.address.street)}</ram:LineOne><ram:CityName>${xmlEscape(snapshot.seller.address.city)}</ram:CityName><ram:CountryID>DE</ram:CountryID></ram:PostalTradeAddress><ram:SpecifiedTaxRegistration><ram:ID schemeID="FC">${xmlEscape(snapshot.seller.taxIdValue)}</ram:ID></ram:SpecifiedTaxRegistration></ram:SellerTradeParty>
<ram:BuyerTradeParty><ram:Name>${xmlEscape(`${snapshot.customer.companyName}${snapshot.customer.legalForm ? ` ${snapshot.customer.legalForm}` : ''}`)}</ram:Name><ram:PostalTradeAddress><ram:PostcodeCode>${xmlEscape(snapshot.customer.address.postalCode)}</ram:PostcodeCode><ram:LineOne>${xmlEscape(snapshot.customer.address.street)}</ram:LineOne><ram:CityName>${xmlEscape(snapshot.customer.address.city)}</ram:CityName><ram:CountryID>DE</ram:CountryID></ram:PostalTradeAddress>${snapshot.customer.vatId ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${xmlEscape(snapshot.customer.vatId)}</ram:ID></ram:SpecifiedTaxRegistration>` : ''}</ram:BuyerTradeParty>
</ram:ApplicableHeaderTradeAgreement>
<ram:ApplicableHeaderTradeDelivery><ram:ActualDeliverySupplyChainEvent><ram:OccurrenceDateTime><udt:DateTimeString format="102">${zugferdDate(snapshot.serviceDate)}</udt:DateTimeString></ram:OccurrenceDateTime></ram:ActualDeliverySupplyChainEvent></ram:ApplicableHeaderTradeDelivery>
<ram:ApplicableHeaderTradeSettlement><ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>${snapshot.customer.purchaseOrder ? `<ram:BuyerReference>${xmlEscape(snapshot.customer.purchaseOrder)}</ram:BuyerReference>` : ''}<ram:ApplicableTradeTax><ram:CalculatedAmount>${(snapshot.vatAmountCents / 100).toFixed(2)}</ram:CalculatedAmount><ram:TypeCode>VAT</ram:TypeCode><ram:BasisAmount>${(snapshot.netTotalCents / 100).toFixed(2)}</ram:BasisAmount><ram:CategoryCode>S</ram:CategoryCode><ram:RateApplicablePercent>${snapshot.vatRatePercent}</ram:RateApplicablePercent></ram:ApplicableTradeTax><ram:SpecifiedTradePaymentTerms><ram:Description>${snapshot.locale === 'en' ? 'Due by' : 'Zahlbar bis'} ${snapshot.dueDate}</ram:Description><ram:DueDateDateTime><udt:DateTimeString format="102">${zugferdDate(snapshot.dueDate)}</udt:DateTimeString></ram:DueDateDateTime></ram:SpecifiedTradePaymentTerms><ram:SpecifiedTradeSettlementHeaderMonetarySummation><ram:LineTotalAmount>${(snapshot.netTotalCents / 100).toFixed(2)}</ram:LineTotalAmount><ram:TaxBasisTotalAmount>${(snapshot.netTotalCents / 100).toFixed(2)}</ram:TaxBasisTotalAmount><ram:TaxTotalAmount currencyID="EUR">${(snapshot.vatAmountCents / 100).toFixed(2)}</ram:TaxTotalAmount><ram:GrandTotalAmount>${(snapshot.grossTotalCents / 100).toFixed(2)}</ram:GrandTotalAmount><ram:DuePayableAmount>${(snapshot.grossTotalCents / 100).toFixed(2)}</ram:DuePayableAmount></ram:SpecifiedTradeSettlementHeaderMonetarySummation></ram:ApplicableHeaderTradeSettlement>
</rsm:SupplyChainTradeTransaction></rsm:CrossIndustryInvoice>`;
	return xml
		.replace('<ram:ApplicableHeaderTradeAgreement>', `<ram:ApplicableHeaderTradeAgreement>${buyerReference}`)
		.replace(`<ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>${buyerReference}`, '<ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>');
}

export function formatInvoiceMoney(cents: number, locale: Locale = 'de') {
	return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export function formatInvoiceDate(value: string, locale: Locale = 'de') {
	const [year, month, day] = value.split('-').map(Number);
	return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
		.format(new Date(Date.UTC(year, month - 1, day)));
}
