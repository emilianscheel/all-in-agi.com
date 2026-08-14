import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from '$lib/contact';
import { formatEventTimeRange } from '$lib/event-time';
import type { HackathonRecord } from './hackathons';
import { sendEmailMessage, type EmailTransportDependencies } from './email-transport';

function escapeHtml(value: string) {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function buildCancellationEmailText(record: HackathonRecord) {
	return [
		`Hallo ${record.contactName},`,
		'',
		`Ihre Buchung für den ALL IN AGI Agentic Engineering Hackathon wurde storniert.`,
		'',
		`Buchungs-ID: ${record.id}`,
		`Unternehmen: ${record.companyName}`,
		`Termin: ${formatEventTimeRange(record.eventStart, record.eventEnd)}`,
		'',
		'Die zugehörigen Kalendertermine wurden ebenfalls storniert.',
		'',
		'Bei Fragen können Sie uns gerne jederzeit kontaktieren.',
		`Telefon: ${CONTACT_PHONE_DISPLAY} (tel:${CONTACT_PHONE_HREF})`,
		`E-Mail: ${CONTACT_EMAIL} (mailto:${CONTACT_EMAIL})`,
		'', '', ''
	].join('\n');
}

export function buildCancellationEmailHtml(record: HackathonRecord) {
	return `<p>Hallo ${escapeHtml(record.contactName)},</p>
	<p>Ihre Buchung für den ALL IN AGI Agentic Engineering Hackathon wurde storniert.</p>
	<p><strong>Buchungs-ID:</strong> ${escapeHtml(record.id)}<br><strong>Unternehmen:</strong> ${escapeHtml(record.companyName)}<br><strong>Termin:</strong> ${escapeHtml(formatEventTimeRange(record.eventStart, record.eventEnd))}</p>
	<p>Die zugehörigen Kalendertermine wurden ebenfalls storniert.</p>
	<p>Bei Fragen können Sie uns gerne jederzeit kontaktieren.</p>
	<p><strong>Telefon:</strong> <a href="tel:${escapeHtml(CONTACT_PHONE_HREF)}">${escapeHtml(CONTACT_PHONE_DISPLAY)}</a><br><strong>E-Mail:</strong> <a href="mailto:${escapeHtml(CONTACT_EMAIL)}">${escapeHtml(CONTACT_EMAIL)}</a></p>
	<p><br><br></p>`;
}

export function sendBookingCancellationEmail(record: HackathonRecord, dependencies: EmailTransportDependencies = {}) {
	return sendEmailMessage({
		to: { address: record.contactEmail, name: record.contactName },
		subject: `Stornierung Hackathon ${record.id}`,
		text: buildCancellationEmailText(record),
		html: buildCancellationEmailHtml(record),
		headers: { 'X-Booking-ID': record.id }
	}, dependencies);
}
