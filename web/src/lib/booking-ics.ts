import type { BookingConfiguration } from './booking';

export interface BookingResultSummary {
	uid?: string;
	icsUid?: string;
	title?: string;
	start: string;
	end?: string;
	meetingUrl?: string;
}

function escape(value: string) {
	return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function utcDate(value: string) {
	return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function createPrepCallIcs(
	config: BookingConfiguration,
	booking: BookingResultSummary,
	bookingUrl?: string
) {
	const start = new Date(booking.start || config.consultationSlot);
	const end = booking.end ? new Date(booking.end) : new Date(start.getTime() + 60 * 60_000);
	const description = [
		(config.locale === 'en' ? `Preparation call for ${config.companyName}'s Agentic Engineering Hackathon` : `Prep Call für den Agentic Engineering Hackathon von ${config.companyName}`),
		...(bookingUrl ? [`${config.locale === 'en' ? 'Manage booking' : 'Buchung verwalten'}: ${bookingUrl}`] : [])
	].join('\n\n');
	return [
		'BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//ALL IN AGI//Prep Call//${config.locale === 'en' ? 'EN' : 'DE'}`, 'CALSCALE:GREGORIAN',
		'BEGIN:VEVENT',
		`UID:${escape(booking.icsUid || booking.uid || `${start.getTime()}@all-in-agi.com`)}`,
		`DTSTAMP:${utcDate(new Date().toISOString())}`,
		`DTSTART:${utcDate(start.toISOString())}`,
		`DTEND:${utcDate(end.toISOString())}`,
		`SUMMARY:${escape(booking.title || 'ALL IN AGI Prep Call')}`,
		`DESCRIPTION:${escape(description)}`,
		...(bookingUrl ? [`URL:${escape(bookingUrl)}`] : []),
		...(booking.meetingUrl ? [`LOCATION:${escape(booking.meetingUrl)}`] : []),
		'END:VEVENT', 'END:VCALENDAR', ''
	].join('\r\n');
}
