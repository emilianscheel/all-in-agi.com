import { describe, expect, test } from 'bun:test';
import { PDFDocument } from 'pdf-lib';
import { createPlanPdf } from './booking-artifacts';
import { createPrepCallIcs } from './booking-ics';
import type { BookingConfiguration } from './booking';

const config: BookingConfiguration = { capacity: 15, venueProvided: true, equipment: 'projector', lunch: 'custom', customLunch: 'Vegetarische Bowls', companyName: 'Musterwerke GmbH', contactName: 'Ada Beispiel', email: 'ada@example.com', phone: '+49 30 123456', address: { label: 'Musterstraße 1, Berlin', street: 'Musterstraße 1', postalCode: '10115', city: 'Berlin', country: 'Deutschland' }, preferredEventDate: '2099-06-20', consultationSlot: '2099-05-10T10:00:00.000Z' };

describe('booking artifacts', () => {
	test('creates a single-page PDF', async () => {
		const bytes = await createPlanPdf(config);
		expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
	});

	test('creates a 30 minute ICS event', () => {
		const ics = createPrepCallIcs(config, { start: config.consultationSlot, uid: 'booking-1' });
		expect(ics).toContain('DTSTART:20990510T100000Z');
		expect(ics).toContain('DTEND:20990510T103000Z');
		expect(ics).toContain('UID:booking-1');
	});
});
