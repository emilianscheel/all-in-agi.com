import { describe, expect, test } from 'bun:test';
import { toPublicHackathon, type HackathonRecord } from './hackathons';

const record = {
	id: 'HAA-AAA-AAA',
	status: 'confirmed',
	companyName: 'Musterwerke GmbH',
	contactName: 'Ada Beispiel',
	contactEmail: 'ada@example.com',
	contactPhone: '+49 30 123456',
	message: 'Bitte vegetarisch.',
	capacity: 15,
	venueProvided: true,
	equipment: 'projector',
	lunch: 'pizza',
	customLunch: '',
	toolProvision: 'existing',
	codingTools: ['codex'],
	customCodingTool: '',
	address: { label: '', street: 'Musterstraße 1', postalCode: '10115', city: 'Berlin', country: 'Deutschland' },
	preferredEventDate: '2099-06-20',
	consultationSlot: '2099-05-10T10:00:00.000Z',
	basePrice: 4000,
	venueSurcharge: 0,
	lunchAdjustment: 0,
	toolsAdjustment: 0,
	totalPrice: 4000,
	bookingUid: 'booking-1',
	bookingIcsUid: 'booking-1@example.com',
	bookingTitle: 'ALL-IN-AGI Prep Call',
	bookingStart: '2099-05-10T10:00:00.000Z',
	bookingEnd: '2099-05-10T11:00:00.000Z',
	meetingUrl: '',
	demoMode: false,
	createdAt: '2099-01-01T00:00:00.000Z',
	updatedAt: '2099-01-01T00:00:00.000Z'
} as HackathonRecord;

describe('public hackathon mapping', () => {
	test('exposes editable booking and contact details', () => {
		const result = toPublicHackathon(record);
		expect(result.companyName).toBe('Musterwerke GmbH');
		expect(result.price.totalPrice).toBe(4000);
		expect(result.booking.uid).toBe('booking-1');
		expect(result.contactName).toBe('Ada Beispiel');
		expect(result.email).toBe('ada@example.com');
		expect(result.phone).toBe('+49 30 123456');
		expect(result.message).toBe('Bitte vegetarisch.');
		expect(result).not.toHaveProperty('contactEmail');
		expect(result).not.toHaveProperty('contactPhone');
	});
});
