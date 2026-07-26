import { describe, expect, test } from 'bun:test';
import { bookingsCsv, type AdminBooking } from './admin-bookings';

const booking = {
	id: 'HAA-AAA-AAA', status: 'confirmed', companyName: '=CMD()', contactName: 'Ada, "Admin"', contactEmail: 'ada@example.com',
	contactPhone: '+49 30 123', message: '@danger', capacity: 15, venueProvided: true, equipment: 'projector', lunch: 'pizza',
	customLunch: '', toolProvision: 'existing', codingTools: ['codex'], customCodingTool: '',
	address: { label: '', street: '-1 Teststraße', postalCode: '10115', city: 'Berlin', country: 'Deutschland' },
	eventStart: '2099-06-20T07:00:00.000Z', eventEnd: '2099-06-20T15:00:00.000Z', consultationSlot: '2099-05-10T10:00:00.000Z',
	basePrice: 4000, venueSurcharge: 0, lunchAdjustment: 0, toolsAdjustment: 0, totalPrice: 4000,
	createdAt: '2099-01-01T00:00:00.000Z', updatedAt: '2099-01-02T00:00:00.000Z', cancelledAt: null, cancellationEmailSentAt: null
} as AdminBooking;

describe('admin booking CSV', () => {
	test('emits Excel-friendly UTF-8 CSV and neutralizes customer formulas', () => {
		const csv = bookingsCsv([booking]);
		expect(csv.startsWith('\uFEFF"ID","Status"')).toBe(true);
		expect(csv).toContain('"\'=CMD()"');
		expect(csv).toContain('"Ada, ""Admin"""');
		expect(csv).toContain('"\'@danger"');
		expect(csv).toContain('"\'-1 Teststraße"');
		expect(csv).toEndWith('\r\n');
	});
});

