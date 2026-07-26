import { describe, expect, test } from 'bun:test';
import { PDFDocument } from 'pdf-lib';
import { createPlanPdf, hackathonDetailUrl } from './booking-artifacts';
import { createPrepCallIcs } from './booking-ics';
import type { BookingConfiguration } from './booking';

const config: BookingConfiguration = { capacity: 15, venueProvided: true, equipment: 'projector', lunch: 'custom', customLunch: 'Vegetarische Bowls', toolProvision: 'needed', codingTools: ['codex', 'custom'], customCodingTool: 'Internes Tool', companyName: 'Musterwerke GmbH', contactName: 'Ada Beispiel', email: 'ada@example.com', phone: '+49 30 123456', message: '', address: { label: 'Musterstraße 1, Berlin', street: 'Musterstraße 1', postalCode: '10115', city: 'Berlin', country: 'Deutschland' }, preferredEventDate: '2099-06-20', consultationSlot: '2099-05-10T10:00:00.000Z' };

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
		expect(hackathonDetailUrl('HAA-AAA-AAA')).toBe('https://all-in-agi.com/HAA-AAA-AAA');
	});

	test('creates a 60 minute ICS event', () => {
		const ics = createPrepCallIcs(config, { start: config.consultationSlot, uid: 'booking-1' });
		expect(ics).toContain('DTSTART:20990510T100000Z');
		expect(ics).toContain('DTEND:20990510T110000Z');
		expect(ics).toContain('UID:booking-1');
		expect(ics).toContain('PRODID:-//ALL-IN-AGI//Prep Call//DE');
		expect(ics).toContain('SUMMARY:ALL-IN-AGI Prep Call');
	});

	test('uses the ALL-IN-AGI domain for generated calendar UIDs', () => {
		const ics = createPrepCallIcs(config, { start: config.consultationSlot });
		expect(ics).toContain('UID:4082090400000@all-in-agi.com');
	});
});
