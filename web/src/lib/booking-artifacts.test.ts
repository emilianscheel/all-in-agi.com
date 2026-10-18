import { describe, expect, test } from 'bun:test';
import { PDFDocument } from 'pdf-lib';
import { createPlanPdf, hackathonDetailUrl } from './booking-artifacts';
import { createBookingCalendarIcs, createHackathonIcs, createPrepCallIcs } from './booking-ics';
import type { BookingConfiguration } from './booking';

const config: BookingConfiguration = { capacity: 15, venueProvided: true, equipment: 'projector', lunch: 'custom', customLunch: 'Vegetarische Bowls', toolProvision: 'needed', codingTools: ['codex', 'custom'], customCodingTool: 'Internes Tool', deviceProvision: 'needed', deviceCount: 4, companyName: 'Musterwerke GmbH', contactName: 'Ada Beispiel', email: 'ada@example.com', phone: '+49 30 123456', message: '', address: { label: 'Musterstraße 1, Berlin', street: 'Musterstraße 1', postalCode: '10115', city: 'Berlin', country: 'Deutschland' }, eventStart: '2099-06-20T07:00:00.000Z', eventEnd: '2099-06-20T15:00:00.000Z', consultationSlot: '2099-05-10T10:00:00.000Z' };

describe('booking artifacts', () => {
	test('creates a single-page PDF with contact details and a hackathon QR code', async () => {
		const bytes = await createPlanPdf(config, {
			hackathonId: 'HAA-AAA-AAA',
			generatedAt: new Date('2099-05-01T00:00:00.000Z')
		});
		expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
		expect(bytes.length).toBeGreaterThan(10_000);
	});

	test('uses the canonical hackathon detail URL', () => {
		expect(hackathonDetailUrl('HAA-AAA-AAA')).toBe('https://all-in-agi.com/de/HAA-AAA-AAA');
	});

	test('creates a 30 minute ICS event', () => {
		const ics = createPrepCallIcs(config, { start: config.consultationSlot, uid: 'booking-1' });
		expect(ics).toContain('DTSTART:20990510T100000Z');
		expect(ics).toContain('DTEND:20990510T103000Z');
		expect(ics).toContain('UID:booking-1');
		expect(ics).toContain('PRODID:-//ALL IN AGI//Preparation Call//DE');
		expect(ics).toContain('SUMMARY:ALL IN AGI Preparation Call');
	});

	test('adds the booking management URL to the ICS when provided', () => {
		const ics = createPrepCallIcs(
			config,
			{ start: config.consultationSlot, uid: 'booking-1' },
			'https://all-in-agi.com/HAA-AAA-AAA'
		);
		expect(ics).toContain('URL:https://all-in-agi.com/HAA-AAA-AAA');
		expect(ics).toContain('Buchung verwalten: https://all-in-agi.com/HAA-AAA-AAA');
	});

	test('uses the ALL IN AGI domain for generated calendar UIDs', () => {
		const ics = createPrepCallIcs(config, { start: config.consultationSlot });
		expect(ics).toContain('UID:4082090400000@all-in-agi.com');
	});

	test('creates separate and combined calendar events with distinct UIDs', () => {
		const prep = { start: config.consultationSlot, uid: 'prep-1', title: 'ALL IN AGI Prep Call', meetingUrl: 'https://meet.example.com' };
		const hackathon = { start: config.eventStart!, end: config.eventEnd!, uid: 'hackathon-1' };
		const prepIcs = createPrepCallIcs(config, prep);
		const hackathonIcs = createHackathonIcs(config, hackathon);
		const combined = createBookingCalendarIcs(config, prep, hackathon);
		expect(prepIcs.match(/BEGIN:VEVENT/g)).toHaveLength(1);
		expect(prepIcs).toContain('SUMMARY:ALL IN AGI Preparation Call');
		expect(prepIcs).toContain('LOCATION:https://meet.example.com');
		expect(hackathonIcs?.match(/BEGIN:VEVENT/g)).toHaveLength(1);
		expect(hackathonIcs).toContain('LOCATION:Musterstraße 1\\, 10115 Berlin\\, Deutschland');
		expect(combined.match(/BEGIN:VEVENT/g)).toHaveLength(2);
		expect(combined).toContain('UID:prep-1');
		expect(combined).toContain('UID:hackathon-1');
	});

	test('omits an unscheduled hackathon from calendar files', () => {
		const deferred = { ...config, eventStart: null, eventEnd: null };
		expect(createHackathonIcs(deferred)).toBeNull();
		expect(createBookingCalendarIcs(deferred, { start: config.consultationSlot }).match(/BEGIN:VEVENT/g)).toHaveLength(1);
	});
});
