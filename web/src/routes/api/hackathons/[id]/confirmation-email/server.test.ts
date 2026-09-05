import { describe, expect, test } from 'bun:test';
import {
	BookingConfirmationEmailError,
	type BookingConfirmationAttempt,
	type BookingConfirmationStage
} from '$lib/server/booking-confirmation-email';
import type { HackathonRecord } from '$lib/server/hackathons';
import { _createConfirmationEmailPost } from './+server';

const record = {
	id: 'HAA-AAA-AAA',
	status: 'confirmed',
	companyName: 'Musterwerke GmbH',
	contactName: 'Ada Beispiel',
	contactEmail: 'ada@example.com',
	contactPhone: '+49 30 123456',
	message: '',
	capacity: 15,
	venueProvided: true,
	equipment: 'projector',
	lunch: 'pizza',
	customLunch: '',
	toolProvision: 'existing',
	codingTools: ['codex'],
	customCodingTool: '',
	deviceProvision: 'existing',
	deviceCount: 0,
	address: { label: '', street: 'Musterstraße 1', postalCode: '10115', city: 'Berlin', country: 'Deutschland' },
	eventStart: '2099-06-20T07:00:00.000Z',
	eventEnd: '2099-06-20T15:00:00.000Z',
	consultationSlot: '2099-05-10T10:00:00.000Z',
	prepCallBookingUid: 'prep-1',
	prepCallBookingIcsUid: 'prep-1@example.com',
	prepCallBookingTitle: 'ALL IN AGI Prep Call',
	prepCallBookingStart: '2099-05-10T10:00:00.000Z',
	prepCallBookingEnd: '2099-05-10T10:30:00.000Z',
	prepCallMeetingUrl: 'https://meet.example.com/prep-1'
} as HackathonRecord;

const event = (id: string) => ({ params: { id }, fetch: globalThis.fetch });

function failedAttempt(stage: BookingConfirmationStage): BookingConfirmationAttempt {
	return {
		role: 'customer',
		sent: false,
		error: new BookingConfirmationEmailError('delivery failed', { stage })
	};
}

describe('confirmation email endpoint', () => {
	test('returns 404 for malformed and unknown hackathon IDs', async () => {
		let lookupCount = 0;
		const post = _createConfirmationEmailPost({
			getRecord: async () => {
				lookupCount += 1;
				return null;
			}
		});

		const malformed = await post(event('invalid'));
		expect(malformed.status).toBe(404);
		expect(lookupCount).toBe(0);

		const unknown = await post(event('HAA-AAA-AAA'));
		expect(unknown.status).toBe(404);
		expect(lookupCount).toBe(1);
	});

	test('sends the current confirmation to the stored customer', async () => {
		let recipient = '';
		const post = _createConfirmationEmailPost({
			getRecord: async () => record,
			sendConfirmation: async (input) => {
				recipient = input.config.email;
				return { role: 'customer', sent: true, status: 'accepted' };
			}
		});

		const response = await post(event('haa-aaa-aaa'));
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ sent: true });
		expect(recipient).toBe('ada@example.com');
	});

	test('returns understandable errors for configuration, network, and provider failures', async () => {
		for (const [stage, expectedStatus] of [
			['configuration', 503],
			['network', 502],
			['provider', 502]
		] as const) {
			const post = _createConfirmationEmailPost({
				getRecord: async () => record,
				sendConfirmation: async () => failedAttempt(stage)
			});
			const response = await post(event('HAA-AAA-AAA'));
			expect(response.status).toBe(expectedStatus);
			expect(await response.json()).toEqual({
				message: 'Die Bestätigungs-E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es erneut.'
			});
		}
	});
});
