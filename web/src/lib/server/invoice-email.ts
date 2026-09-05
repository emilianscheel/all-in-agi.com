import { createInvoicePdf } from '$lib/invoice-artifacts';
import { formatInvoiceDate, formatInvoiceMoney, type InvoiceSnapshot } from '$lib/invoice';
import { sendEmailMessage, type EmailTransportDependencies } from './email-transport';

export interface InvoiceEmailDependencies extends EmailTransportDependencies {
	createPdf?: typeof createInvoicePdf;
}

function escapeHtml(value: string) {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function bytesToBase64(bytes: Uint8Array) {
	if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
	let binary = '';
	const chunkSize = 32_768;
	for (let offset = 0; offset < bytes.length; offset += chunkSize) {
		binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
	}
	return btoa(binary);
}

export function buildInvoiceEmailText(snapshot: InvoiceSnapshot) {
	const en = snapshot.locale === 'en';
	const split = snapshot.version === 2 || snapshot.version === 3;
	const label = split && snapshot.kind === 'down-payment' ? 'Anzahlungsrechnung'
		: split && snapshot.kind === 'final' ? 'Endrechnung' : 'Rechnung';
	const englishLabel = split && snapshot.kind === 'down-payment' ? 'deposit invoice'
		: split && snapshot.kind === 'final' ? 'final invoice' : 'invoice';
	return [
		en ? `Hello ${snapshot.customer.contactName},` : `Hallo ${snapshot.customer.contactName},`,
		'',
		en ? `Please find attached the ${englishLabel} for your ALL IN AGI Agentic Engineering Hackathon.` : `anbei erhalten Sie die ${label} für Ihren ALL IN AGI Agentic Engineering Hackathon.`,
		'',
		`${en ? 'Invoice number' : 'Rechnungsnummer'}: ${snapshot.invoiceNumber}`,
		`${en ? 'Total amount' : 'Gesamtbetrag'}: ${formatInvoiceMoney(snapshot.grossTotalCents)}`,
		`${en ? 'Due date' : 'Zahlbar bis'}: ${formatInvoiceDate(snapshot.dueDate)}`,
		'',
		en ? 'Best regards' : 'Viele Grüße',
		'ALL IN AGI',
		'', '', ''
	].join('\n');
}

export function buildInvoiceEmailHtml(snapshot: InvoiceSnapshot) {
	const en = snapshot.locale === 'en';
	const split = snapshot.version === 2 || snapshot.version === 3;
	const label = split && snapshot.kind === 'down-payment' ? 'Anzahlungsrechnung'
		: split && snapshot.kind === 'final' ? 'Endrechnung' : 'Rechnung';
	const englishLabel = split && snapshot.kind === 'down-payment' ? 'deposit invoice' : split && snapshot.kind === 'final' ? 'final invoice' : 'invoice';
	if (en) return `<p>Hello ${escapeHtml(snapshot.customer.contactName)},</p><p>Please find attached the ${englishLabel} for your ALL IN AGI Agentic Engineering Hackathon.</p><p><strong>Invoice number:</strong> ${escapeHtml(snapshot.invoiceNumber)}<br><strong>Total amount:</strong> ${escapeHtml(formatInvoiceMoney(snapshot.grossTotalCents))}<br><strong>Due date:</strong> ${escapeHtml(formatInvoiceDate(snapshot.dueDate))}</p><p>Best regards<br>ALL IN AGI</p>`;
	return `<p>Hallo ${escapeHtml(snapshot.customer.contactName)},</p><p>anbei erhalten Sie die ${label} für Ihren ALL IN AGI Agentic Engineering Hackathon.</p><p><strong>Rechnungsnummer:</strong> ${escapeHtml(snapshot.invoiceNumber)}<br><strong>Gesamtbetrag:</strong> ${escapeHtml(formatInvoiceMoney(snapshot.grossTotalCents))}<br><strong>Zahlbar bis:</strong> ${escapeHtml(formatInvoiceDate(snapshot.dueDate))}</p><p>Viele Grüße<br>ALL IN AGI</p>`;
}

export async function sendInvoiceEmail(snapshot: InvoiceSnapshot, dependencies: InvoiceEmailDependencies = {}) {
	const en = snapshot.locale === 'en';
	const split = snapshot.version === 2 || snapshot.version === 3;
	const label = split && snapshot.kind === 'down-payment' ? 'Anzahlungsrechnung'
		: split && snapshot.kind === 'final' ? 'Endrechnung' : 'Rechnung';
	const pdf = await (dependencies.createPdf ?? createInvoicePdf)(snapshot);
	return sendEmailMessage({
		to: { address: snapshot.customer.email, name: snapshot.customer.contactName },
		subject: en ? `Your ALL IN AGI hackathon invoice – ${snapshot.invoiceNumber}` : `Ihre ${label} für den ALL IN AGI Hackathon – ${snapshot.invoiceNumber}`,
		text: buildInvoiceEmailText(snapshot),
		html: buildInvoiceEmailHtml(snapshot),
		headers: {
			'X-Booking-ID': snapshot.hackathonId,
			'X-Invoice-Number': snapshot.invoiceNumber
		},
		attachments: [{
			content: bytesToBase64(pdf),
			filename: `all-in-agi-${split ? snapshot.kind : (en ? 'invoice' : 'rechnung')}-${snapshot.hackathonId}.pdf`,
			type: 'application/pdf',
			disposition: 'attachment'
		}]
	}, dependencies);
}
