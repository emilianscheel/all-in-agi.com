import { CONTACT_EMAIL } from '$lib/contact';
import { formatPrice } from '$lib/booking';
import { emailSignatureHtml, emailSignatureText } from '$lib/email-signature';
import { LEGAL_MODULES } from '$lib/legal';
import { createLegalPdf, type LegalPdfInput } from '$lib/legal-pdf';
import { createOfferPdf } from '$lib/offer-artifacts';
import type { OfferConfiguration } from '$lib/offer';
import { addBerlinBusinessDays } from './legal-contracts';
import type { HackathonRecord } from './hackathons';
import { getOffer } from './offers';
import { sendEmailMessage, type EmailAttachment, type EmailTransportDependencies } from './email-transport';

function bytesToBase64(bytes: Uint8Array) {
	if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
	let binary = '';
	const chunkSize = 32_768;
	for (let offset = 0; offset < bytes.length; offset += chunkSize) {
		binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
	}
	return btoa(binary);
}

function escapeHtml(value: string) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function berlinDateTime(value: string) {
	return new Intl.DateTimeFormat('de-DE', {
		dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Berlin'
	}).format(new Date(value));
}

function moduleList(ids: readonly string[] | null) {
	const labels = (ids ?? []).map((id) => LEGAL_MODULES.find((module) => module.id === id)?.label ?? id);
	return labels.join(', ') || 'keine Zusatzmodule';
}

export interface ContractConfirmationOverrides {
	customerAgreementName?: string | null;
	organizerAgreementName?: string | null;
	oralAgreementAt?: string | null;
	exitDeadline?: string | null;
}

function confirmationDetails(record: HackathonRecord, overrides: ContractConfirmationOverrides = {}) {
	const oralAgreementAt = overrides.oralAgreementAt ?? record.oralAgreementAt;
	const exitDeadline = overrides.exitDeadline ?? record.exitDeadline;
	const customerAgreementName = overrides.customerAgreementName ?? record.customerAgreementName ?? '';
	if (!oralAgreementAt || !exitDeadline || !record.legalSnapshot) throw new Error('Vertragsdaten sind unvollständig.');
	const rows: Array<[string, string]> = [
		['Hackathon', record.id],
		['Kunde', record.billing?.companyName ?? record.companyName],
		['Zustimmung Kunde', customerAgreementName],
		['Zeitpunkt', berlinDateTime(oralAgreementAt)],
		['Event', record.eventStart ? berlinDateTime(record.eventStart) : 'Termin wird noch gemeinsam vereinbart'],
		['Teilnehmendenpaket', `bis ${record.capacity} Personen`],
		['Nettoentgelt', formatPrice(record.totalPrice)],
		['Umsatzsteuer 19 %', formatPrice(record.totalPrice * 0.19)],
		['Bruttoentgelt', formatPrice(record.totalPrice * 1.19)],
		['AGB-Version', record.legalVersion ?? ''],
		['Module', moduleList(record.legalModules)]
	];
	return { exitDeadline, rows };
}

export function contractConfirmationText(record: HackathonRecord, overrides: ContractConfirmationOverrides = {}) {
	const { exitDeadline, rows } = confirmationDetails(record, overrides);
	return [
		`Hallo ${record.contactName},`,
		'',
		'vielen Dank, dass Sie sich für ein Hackathon von ALL IN AGI entschieden haben. Der Vertrag ist mit der mündlichen Zustimmung zustande gekommen.',
		`Beide Parteien können sich bis ${berlinDateTime(exitDeadline)} durch eine formlose E-Mail kostenfrei vom Vertrag lösen.`,
		'',
		...rows.map(([label, value]) => `- ${label}: ${value}`),
		'',
		'Zahlung: 30 % Anzahlung mit 14 Tagen Zahlungsziel; Schlussrechnung nach Durchführung mit 14 Tagen Zahlungsziel.',
		'Änderungen an Leistung oder Preis werden gesondert dokumentiert.',
		'',
		...emailSignatureText('de')
	].join('\n') + '\n\n\n';
}

export function contractConfirmationHtml(record: HackathonRecord, overrides: ContractConfirmationOverrides = {}) {
	const { exitDeadline, rows } = confirmationDetails(record, overrides);
	const options = rows
		.map(([label, value]) => `<strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}`)
		.join('<br>');
	return `<p>Hallo ${escapeHtml(record.contactName)},</p>
<p>vielen Dank, dass Sie sich für ein Hackathon von ALL IN AGI entschieden haben. Der Vertrag ist mit der mündlichen Zustimmung zustande gekommen.</p>
<p>Beide Parteien können sich bis ${escapeHtml(berlinDateTime(exitDeadline))} durch eine formlose E-Mail kostenfrei vom Vertrag lösen.</p>
<p>${options}</p>
<p>Zahlung: 30 % Anzahlung mit 14 Tagen Zahlungsziel; Schlussrechnung nach Durchführung mit 14 Tagen Zahlungsziel.<br>Änderungen an Leistung oder Preis werden gesondert dokumentiert.</p>
${emailSignatureHtml('de')}
<p><br><br></p>`;
}

export interface SendContractConfirmationOptions {
	to?: { address: string; name: string };
	subjectPrefix?: string;
	overrides?: ContractConfirmationOverrides;
}

export interface ContractConfirmationDependencies extends EmailTransportDependencies {
	createPdf?: (input: LegalPdfInput) => Promise<Uint8Array>;
	loadOffer?: (id: string) => Promise<OfferConfiguration | null>;
	createScopePdf?: (config: OfferConfiguration) => Promise<Uint8Array>;
}

function scopeFilename(config: OfferConfiguration) {
	const base = (config.companyName || 'all-in-agi').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'all-in-agi';
	return `${base}-leistungsbeschreibung.pdf`;
}

export async function sendContractConfirmationEmail(
	record: HackathonRecord,
	dependencies: ContractConfirmationDependencies = {},
	options: SendContractConfirmationOptions = {}
) {
	const summary = contractConfirmationText(record, options.overrides);
	const pdf = await (dependencies.createPdf ?? createLegalPdf)({
		content: record.legalSnapshot!.content,
		version: record.legalSnapshot!.version,
		hackathonId: record.id
	});
	const attachments: EmailAttachment[] = [{
		content: bytesToBase64(pdf),
		filename: `AGB-${record.legalSnapshot!.version}-${record.id}.pdf`,
		type: 'application/pdf',
		disposition: 'attachment'
	}];
	if (record.offerId) {
		const config = await (dependencies.loadOffer ?? (async (id: string) => (await getOffer(id))?.config ?? null))(record.offerId);
		if (!config) throw new Error('Die verknüpfte Leistungsbeschreibung wurde nicht gefunden.');
		const scopePdf = await (dependencies.createScopePdf ?? ((offer: OfferConfiguration) => createOfferPdf(offer, { mode: 'scope', locale: 'de' })))(config);
		attachments.push({
			content: bytesToBase64(scopePdf),
			filename: scopeFilename(config),
			type: 'application/pdf',
			disposition: 'attachment'
		});
	}
	const subjectBase = `Vertragsbestätigung Hackathon ${record.id}`;
	return sendEmailMessage({
		to: options.to ?? { address: record.contactEmail, name: record.contactName },
		subject: options.subjectPrefix ? `${options.subjectPrefix}${subjectBase}` : subjectBase,
		text: summary,
		html: contractConfirmationHtml(record, options.overrides),
		headers: { 'X-Booking-ID': record.id, 'X-Legal-Version': record.legalVersion ?? '' },
		attachments
	}, dependencies);
}

export async function sendContractConfirmationTestEmail(
	record: HackathonRecord,
	customerName: string,
	organizerName: string,
	dependencies: ContractConfirmationDependencies = {},
	agreedAt = new Date()
) {
	if (!record.legalSnapshot) throw new Error('Vertragsdaten sind unvollständig.');
	const oralAgreementAt = agreedAt.toISOString();
	const exitDeadline = addBerlinBusinessDays(agreedAt, 2).toISOString();
	return sendContractConfirmationEmail(record, dependencies, {
		to: { address: CONTACT_EMAIL, name: 'ALL IN AGI' },
		subjectPrefix: '[TEST] ',
		overrides: {
			customerAgreementName: customerName.trim(),
			organizerAgreementName: organizerName.trim(),
			oralAgreementAt,
			exitDeadline
		}
	});
}
