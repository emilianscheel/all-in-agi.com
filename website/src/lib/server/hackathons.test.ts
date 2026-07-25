import { describe, expect, test } from 'bun:test';
import { toPublicHackathon, type HackathonRecord } from './hackathons';

const record = {
	id: 'HAA-AAA-AAA',
	status: 'confirmed',
	companyName: 'Musterwerke GmbH',
	contactName: 'Ada Beispiel',
	contactEmail: 'ada@example.com',
	contactPhone: '+49 30 123456',
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
	test('exposes event details and redacts all contact fields', () => {
		const result = toPublicHackathon(record);
		expect(result.companyName).toBe('Musterwerke GmbH');
		expect(result.price.totalPrice).toBe(4000);
		expect(result.booking.uid).toBe('booking-1');
		expect(result).not.toHaveProperty('contactName');
		expect(result).not.toHaveProperty('contactEmail');
		expect(result).not.toHaveProperty('contactPhone');
		expect(result).not.toHaveProperty('email');
		expect(result).not.toHaveProperty('phone');
	});
});
