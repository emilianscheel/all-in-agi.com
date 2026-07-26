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
	eventStart: '2099-06-20T07:00:00.000Z',
	eventEnd: '2099-06-20T15:00:00.000Z',
	consultationSlot: '2099-05-10T10:00:00.000Z',
	basePrice: 4000,
	venueSurcharge: 0,
	lunchAdjustment: 0,
	toolsAdjustment: 0,
	totalPrice: 4000,
	prepCallBookingUid: 'prep-1',
	prepCallBookingIcsUid: 'prep-1@example.com',
	prepCallBookingTitle: 'ALL IN AGI Prep Call',
	prepCallBookingStart: '2099-05-10T10:00:00.000Z',
	prepCallBookingEnd: '2099-05-10T11:00:00.000Z',
	prepCallMeetingUrl: '',
	hackathonBookingUid: 'hackathon-1',
	hackathonBookingIcsUid: 'hackathon-1@example.com',
	hackathonBookingTitle: 'ALL IN AGI Hackathon',
	hackathonBookingStart: '2099-06-20T07:00:00.000Z',
	hackathonBookingEnd: '2099-06-20T15:00:00.000Z',
	demoMode: false,
	createdAt: '2099-01-01T00:00:00.000Z',
	updatedAt: '2099-01-01T00:00:00.000Z'
} as HackathonRecord;

describe('public hackathon mapping', () => {
	test('exposes editable booking and contact details', () => {
		const result = toPublicHackathon(record);
		expect(result.companyName).toBe('Musterwerke GmbH');
		expect(result.price.totalPrice).toBe(4000);
		expect(result.prepCallBooking.uid).toBe('prep-1');
		expect(result.hackathonBooking.uid).toBe('hackathon-1');
		expect(result.contactName).toBe('Ada Beispiel');
		expect(result.email).toBe('ada@example.com');
		expect(result.phone).toBe('+49 30 123456');
		expect(result.message).toBe('Bitte vegetarisch.');
		expect(result).not.toHaveProperty('contactEmail');
		expect(result).not.toHaveProperty('contactPhone');
	});
});
