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
	return [
		`Hallo ${snapshot.customer.contactName},`,
		'',
		'anbei erhalten Sie die Rechnung für Ihren ALL IN AGI Agentic Engineering Hackathon.',
		'',
		`Rechnungsnummer: ${snapshot.invoiceNumber}`,
		`Gesamtbetrag: ${formatInvoiceMoney(snapshot.grossTotalCents)}`,
		`Zahlbar bis: ${formatInvoiceDate(snapshot.dueDate)}`,
		'',
		'Viele Grüße',
		'ALL IN AGI',
		'', '', ''
	].join('\n');
}

export function buildInvoiceEmailHtml(snapshot: InvoiceSnapshot) {
	return `<p>Hallo ${escapeHtml(snapshot.customer.contactName)},</p>
	<p>anbei erhalten Sie die Rechnung für Ihren ALL IN AGI Agentic Engineering Hackathon.</p>
	<p><strong>Rechnungsnummer:</strong> ${escapeHtml(snapshot.invoiceNumber)}<br><strong>Gesamtbetrag:</strong> ${escapeHtml(formatInvoiceMoney(snapshot.grossTotalCents))}<br><strong>Zahlbar bis:</strong> ${escapeHtml(formatInvoiceDate(snapshot.dueDate))}</p>
	<p>Viele Grüße<br>ALL IN AGI</p>`;
}

export async function sendInvoiceEmail(snapshot: InvoiceSnapshot, dependencies: InvoiceEmailDependencies = {}) {
	const pdf = await (dependencies.createPdf ?? createInvoicePdf)(snapshot);
	return sendEmailMessage({
		to: { address: snapshot.customer.email, name: snapshot.customer.contactName },
		subject: `Ihre Rechnung für den ALL IN AGI Hackathon – ${snapshot.invoiceNumber}`,
		text: buildInvoiceEmailText(snapshot),
		html: buildInvoiceEmailHtml(snapshot),
		headers: {
			'X-Booking-ID': snapshot.hackathonId,
			'X-Invoice-Number': snapshot.invoiceNumber
		},
		attachments: [{
			content: bytesToBase64(pdf),
			filename: `all-in-agi-rechnung-${snapshot.hackathonId}.pdf`,
			type: 'application/pdf',
			disposition: 'attachment'
		}]
	}, dependencies);
}
