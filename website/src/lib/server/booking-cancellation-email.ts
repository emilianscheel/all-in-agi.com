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
	return `<!doctype html>
<html lang="de">
<body style="margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#171717;">
	<p style="margin:0 0 16px;">Hallo ${escapeHtml(record.contactName)},</p>
	<p style="margin:0 0 20px;">Ihre Buchung für den ALL IN AGI Agentic Engineering Hackathon wurde storniert.</p>
	<table role="presentation" style="border-collapse:collapse;margin:0 0 20px;">
		<tr><td style="padding:6px 16px 6px 0;vertical-align:top;">Buchungs-ID</td><td style="padding:6px 0;"><strong>${escapeHtml(record.id)}</strong></td></tr>
		<tr><td style="padding:6px 16px 6px 0;vertical-align:top;">Unternehmen</td><td style="padding:6px 0;"><strong>${escapeHtml(record.companyName)}</strong></td></tr>
		<tr><td style="padding:6px 16px 6px 0;vertical-align:top;">Termin</td><td style="padding:6px 0;"><strong>${escapeHtml(formatEventTimeRange(record.eventStart, record.eventEnd))}</strong></td></tr>
	</table>
	<p style="margin:0 0 24px;">Die zugehörigen Kalendertermine wurden ebenfalls storniert.</p>
	<p style="margin:0 0 8px;">Bei Fragen können Sie uns gerne jederzeit kontaktieren.</p>
	<p style="margin:0;"><a href="tel:${escapeHtml(CONTACT_PHONE_HREF)}">${escapeHtml(CONTACT_PHONE_DISPLAY)}</a><br><a href="mailto:${escapeHtml(CONTACT_EMAIL)}">${escapeHtml(CONTACT_EMAIL)}</a></p>
	<div style="height:2.5em;line-height:1.25em;" aria-hidden="true">&nbsp;</div>
</body>
</html>`;
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

