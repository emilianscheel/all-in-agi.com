import { hackathonCalendarLocation, type BookingConfiguration } from './booking';
import { PREP_CALL_DURATION_MINUTES } from './prep-call';

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

function calendar(events: string[][], locale: BookingConfiguration['locale'], product = 'Preparation Call') {
	return [
		'BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//ALL IN AGI//${product}//${locale === 'en' ? 'EN' : 'DE'}`, 'CALSCALE:GREGORIAN',
		...events.flat(), 'END:VCALENDAR', ''
	].join('\r\n');
}

function prepCallEvent(config: BookingConfiguration, booking: BookingResultSummary, bookingUrl?: string) {
	const start = new Date(booking.start || config.consultationSlot);
	const end = booking.end ? new Date(booking.end) : new Date(start.getTime() + PREP_CALL_DURATION_MINUTES * 60_000);
	const description = [
		(config.locale === 'en' ? `Preparation Call for ${config.companyName}'s Agentic Engineering Hackathon` : `Preparation Call für den Agentic Engineering Hackathon von ${config.companyName}`),
		...(bookingUrl ? [`${config.locale === 'en' ? 'Manage booking' : 'Buchung verwalten'}: ${bookingUrl}`] : [])
	].join('\n\n');
	return [
		'BEGIN:VEVENT',
		`UID:${escape(booking.icsUid || booking.uid || `${start.getTime()}@all-in-agi.com`)}`,
		`DTSTAMP:${utcDate(new Date().toISOString())}`,
		`DTSTART:${utcDate(start.toISOString())}`,
		`DTEND:${utcDate(end.toISOString())}`,
		`SUMMARY:${escape((booking.title || 'ALL IN AGI Preparation Call').replace(/Prep[ -]Call/gi, 'Preparation Call'))}`,
		`DESCRIPTION:${escape(description)}`,
		...(bookingUrl ? [`URL:${escape(bookingUrl)}`] : []),
		...(booking.meetingUrl ? [`LOCATION:${escape(booking.meetingUrl)}`] : []),
		'END:VEVENT'
	];
}

function hackathonEvent(config: BookingConfiguration, booking?: BookingResultSummary | null, bookingUrl?: string) {
	const start = booking?.start || config.eventStart;
	const end = booking?.end || config.eventEnd;
	if (!start || !end) return null;
	const location = hackathonCalendarLocation(config);
	return [
		'BEGIN:VEVENT',
		`UID:${escape(booking?.icsUid || booking?.uid || `hackathon-${new Date(start).getTime()}@all-in-agi.com`)}`,
		`DTSTAMP:${utcDate(new Date().toISOString())}`,
		`DTSTART:${utcDate(start)}`,
		`DTEND:${utcDate(end)}`,
		`SUMMARY:${escape(booking?.title || 'ALL IN AGI Hackathon')}`,
		`DESCRIPTION:${escape(config.locale === 'en' ? `Agentic Engineering Hackathon for ${config.companyName}` : `Agentic Engineering Hackathon für ${config.companyName}`)}`,
		...(bookingUrl ? [`URL:${escape(bookingUrl)}`] : []),
		...(location ? [`LOCATION:${escape(location)}`] : []),
		'END:VEVENT'
	];
}

export function createPrepCallIcs(
	config: BookingConfiguration,
	booking: BookingResultSummary,
	bookingUrl?: string
) {
	return calendar([prepCallEvent(config, booking, bookingUrl)], config.locale);
}

export function createHackathonIcs(config: BookingConfiguration, booking?: BookingResultSummary | null, bookingUrl?: string) {
	const event = hackathonEvent(config, booking, bookingUrl);
	return event ? calendar([event], config.locale, 'Hackathon') : null;
}

export function createBookingCalendarIcs(config: BookingConfiguration, prepBooking: BookingResultSummary, hackathonBooking?: BookingResultSummary | null, bookingUrl?: string) {
	const event = hackathonEvent(config, hackathonBooking, bookingUrl);
	return calendar([prepCallEvent(config, prepBooking, bookingUrl), ...(event ? [event] : [])], config.locale, 'Booking Events');
}
