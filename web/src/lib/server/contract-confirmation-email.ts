import { CONTACT_EMAIL } from '$lib/contact';
import { formatPrice } from '$lib/booking';
import { addBerlinBusinessDays } from './legal-contracts';
import type { HackathonRecord } from './hackathons';
import { sendEmailMessage, type EmailTransportDependencies } from './email-transport';

function bytesToBase64(value: string) {
	return Buffer.from(value, 'utf8').toString('base64');
}

function berlinDateTime(value: string) {
	return new Intl.DateTimeFormat('de-DE', {
		dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Berlin'
	}).format(new Date(value));
}

export interface ContractConfirmationOverrides {
	customerAgreementName?: string | null;
	organizerAgreementName?: string | null;
	oralAgreementAt?: string | null;
	exitDeadline?: string | null;
}

export function contractConfirmationText(record: HackathonRecord, overrides: ContractConfirmationOverrides = {}) {
	const oralAgreementAt = overrides.oralAgreementAt ?? record.oralAgreementAt;
	const exitDeadline = overrides.exitDeadline ?? record.exitDeadline;
	const customerAgreementName = overrides.customerAgreementName ?? record.customerAgreementName;
	const organizerAgreementName = overrides.organizerAgreementName ?? record.organizerAgreementName;
	if (!oralAgreementAt || !exitDeadline || !record.legalSnapshot) throw new Error('Vertragsdaten sind unvollständig.');
	return [
		`Hallo ${record.contactName},`, '',
		'vielen Dank für die beiderseitige Zustimmung im Preparation Call. Der B2B-Vertrag ist mit der mündlichen Zustimmung zustande gekommen.',
		`Beide Parteien können sich bis ${berlinDateTime(exitDeadline)} durch eine formlose E-Mail kostenfrei vom Vertrag lösen.`, '',
		`Hackathon-ID: ${record.id}`,
		`Kunde: ${record.billing?.companyName ?? record.companyName}`,
		`Zustimmung Kunde: ${customerAgreementName}`,
		`Zustimmung ALL IN AGI: ${organizerAgreementName}`,
		`Zeitpunkt: ${berlinDateTime(oralAgreementAt)}`,
		`Event: ${record.eventStart ? berlinDateTime(record.eventStart) : 'Termin wird noch gemeinsam vereinbart'}`,
		`Teilnehmendenpaket: bis ${record.capacity} Personen`,
		`Nettoentgelt: ${formatPrice(record.totalPrice)}`,
		`Umsatzsteuer 19 %: ${formatPrice(record.totalPrice * 0.19)}`,
		`Bruttoentgelt: ${formatPrice(record.totalPrice * 1.19)}`,
		`AGB-Version: ${record.legalVersion}`,
		`AGB-Prüfsumme (SHA-256): ${record.legalContentHash}`,
		`Module: ${(record.legalModules ?? []).join(', ') || 'keine Zusatzmodule'}`, '',
		'Zahlung: 30 % Anzahlung mit sieben Tagen Zahlungsziel; Schlussrechnung nach Durchführung mit 14 Tagen Zahlungsziel.',
		'Änderungen an Leistung oder Preis werden gesondert dokumentiert.', '',
		'Viele Grüße', 'ALL IN AGI', '', '', ''
	].join('\n');
}

export interface SendContractConfirmationOptions {
	to?: { address: string; name: string };
	subjectPrefix?: string;
	overrides?: ContractConfirmationOverrides;
}

export async function sendContractConfirmationEmail(
	record: HackathonRecord,
	dependencies: EmailTransportDependencies = {},
	options: SendContractConfirmationOptions = {}
) {
	const summary = contractConfirmationText(record, options.overrides);
	const subjectBase = `Vertragsbestätigung Hackathon ${record.id}`;
	return sendEmailMessage({
		to: options.to ?? { address: record.contactEmail, name: record.contactName },
		subject: options.subjectPrefix ? `${options.subjectPrefix}${subjectBase}` : subjectBase,
		text: summary,
		headers: { 'X-Booking-ID': record.id, 'X-Legal-Version': record.legalVersion ?? '' },
		attachments: [
			{ content: bytesToBase64(summary), filename: `Leistungsbestaetigung-${record.id}.txt`, type: 'text/plain; charset=utf-8', disposition: 'attachment' },
			{ content: bytesToBase64(record.legalSnapshot!.content), filename: `B2B-AGB-${record.legalSnapshot!.version}.txt`, type: 'text/plain; charset=utf-8', disposition: 'attachment' }
		]
	}, dependencies);
}

export async function sendContractConfirmationTestEmail(
	record: HackathonRecord,
	customerName: string,
	organizerName: string,
	dependencies: EmailTransportDependencies = {},
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
