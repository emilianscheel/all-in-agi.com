import { formatPrice } from '$lib/booking';
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

export function contractConfirmationText(record: HackathonRecord) {
	if (!record.oralAgreementAt || !record.exitDeadline || !record.legalSnapshot) throw new Error('Vertragsdaten sind unvollständig.');
	return [
		`Hallo ${record.contactName},`, '',
		'vielen Dank für die beiderseitige Zustimmung im Prep-Call. Der B2B-Vertrag ist mit der mündlichen Zustimmung zustande gekommen.',
		`Beide Parteien können sich bis ${berlinDateTime(record.exitDeadline)} durch eine formlose E-Mail kostenfrei vom Vertrag lösen.`, '',
		`Hackathon-ID: ${record.id}`,
		`Kunde: ${record.billing?.companyName ?? record.companyName}`,
		`Zustimmung Kunde: ${record.customerAgreementName}`,
		`Zustimmung ALL IN AGI: ${record.organizerAgreementName}`,
		`Zeitpunkt: ${berlinDateTime(record.oralAgreementAt)}`,
		`Event: ${berlinDateTime(record.eventStart)}`,
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

export async function sendContractConfirmationEmail(record: HackathonRecord, dependencies: EmailTransportDependencies = {}) {
	const summary = contractConfirmationText(record);
	return sendEmailMessage({
		to: { address: record.contactEmail, name: record.contactName },
		subject: `Vertragsbestätigung Hackathon ${record.id}`,
		text: summary,
		headers: { 'X-Booking-ID': record.id, 'X-Legal-Version': record.legalVersion ?? '' },
		attachments: [
			{ content: bytesToBase64(summary), filename: `Leistungsbestaetigung-${record.id}.txt`, type: 'text/plain; charset=utf-8', disposition: 'attachment' },
			{ content: bytesToBase64(record.legalSnapshot!.content), filename: `B2B-AGB-${record.legalSnapshot!.version}.txt`, type: 'text/plain; charset=utf-8', disposition: 'attachment' }
		]
	}, dependencies);
}

