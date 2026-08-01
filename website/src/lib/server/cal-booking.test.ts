import { describe, expect, test } from 'bun:test';
import type { BookingConfiguration } from '$lib/booking';
import { cancelCalBookingWithToken, createCalBookingWithToken } from './cal-api';
import { reschedulePrepCallWithToken } from './cal-reschedule';

const configuration: BookingConfiguration = {
	capacity: 15, venueProvided: true, equipment: 'projector', lunch: 'pizza', customLunch: '',
	toolProvision: 'existing', codingTools: ['codex'], customCodingTool: '', companyName: 'Musterwerke GmbH',
	contactName: 'Ada Beispiel', email: 'ada@example.com', phone: '+49 30 123456', message: '',
	address: { label: '', street: 'Musterstraße 1', postalCode: '10115', city: 'Berlin', country: 'Deutschland' },
	eventStart: '2099-06-20T07:00:00.000Z', eventEnd: '2099-06-20T15:00:00.000Z',
	consultationSlot: '2099-05-10T10:00:00.000Z'
};

describe('Cal.com booking contracts', () => {
	test('creates the hackathon invite with duration, attendee, address and metadata', async () => {
		let request: { url: string; init?: RequestInit } | undefined;
		const mockFetch = (async (url: URL | RequestInfo, init?: RequestInit) => {
			request = { url: String(url), init };
			return new Response(JSON.stringify({ data: { uid: 'event-1', start: configuration.eventStart, end: configuration.eventEnd } }), {
				status: 201, headers: { 'content-type': 'application/json' }
			});
		}) as typeof fetch;
		const result = await createCalBookingWithToken(configuration, mockFetch, false, {
			eventTypeId: '456', start: configuration.eventStart, end: configuration.eventEnd,
			title: 'ALL IN AGI Hackathon', field: 'hackathon', location: 'Musterstraße 1, 10115 Berlin, Deutschland', allowBookingOutOfBounds: true
		}, 'cal_test');
		const body = JSON.parse(String(request?.init?.body));
		expect(request?.url).toBe('https://api.cal.com/v2/bookings');
		expect(request?.init?.headers).toMatchObject({ Authorization: 'Bearer cal_test', 'cal-api-version': '2026-02-25' });
		expect(body).toMatchObject({
			start: configuration.eventStart,
			eventTypeId: 456,
			lengthInMinutes: 480,
			allowBookingOutOfBounds: true,
			attendee: { name: 'Ada Beispiel', email: 'ada@example.com', phoneNumber: '+4930123456', timeZone: 'Europe/Berlin' },
			location: { type: 'attendeeAddress', address: 'Musterstraße 1, 10115 Berlin, Deutschland' },
			metadata: { company: 'Musterwerke GmbH' }
		});
		expect(result.uid).toBe('event-1');
	});

	test('normalizes a local German attendee phone number for Cal.com', async () => {
		let body: any;
		const mockFetch = (async (_url: URL | RequestInfo, init?: RequestInit) => {
			body = JSON.parse(String(init?.body));
			return new Response(JSON.stringify({ data: { uid: 'event-2' } }), {
				status: 201, headers: { 'content-type': 'application/json' }
			});
		}) as typeof fetch;
		await createCalBookingWithToken({ ...configuration, phone: '030 123456' }, mockFetch, false, {
			eventTypeId: '456', start: configuration.eventStart, end: configuration.eventEnd,
			title: 'ALL IN AGI Hackathon', field: 'hackathon'
		}, 'cal_test');
		expect(body.attendee.phoneNumber).toBe('+4930123456');
	});

	test('omits a phone number that cannot be normalized safely', async () => {
		let body: any;
		const mockFetch = (async (_url: URL | RequestInfo, init?: RequestInit) => {
			body = JSON.parse(String(init?.body));
			return new Response(JSON.stringify({ data: { uid: 'event-3' } }), {
				status: 201, headers: { 'content-type': 'application/json' }
			});
		}) as typeof fetch;
		await createCalBookingWithToken({ ...configuration, phone: '123456' }, mockFetch, false, {
			eventTypeId: '456', start: configuration.eventStart, end: configuration.eventEnd,
			title: 'ALL IN AGI Hackathon', field: 'hackathon'
		}, 'cal_test');
		expect(body.attendee).not.toHaveProperty('phoneNumber');
	});

	test('maps Cal.com validation failures to actionable customer warnings', async () => {
		const cases = [
			{
				result: { error: { details: 'Invalid phone number format' } },
				message: 'Die Telefonnummer konnte nicht verarbeitet werden. Bitte verwenden Sie ein internationales Format, zum Beispiel +49 30 123456.'
			},
			{
				result: { error: { details: 'Validation failed for attendeeAddress location' } },
				message: 'Die Veranstaltungsadresse konnte nicht verarbeitet werden. Bitte prüfen Sie Straße, PLZ und Ort.'
			},
			{
				result: { error: { details: 'lengthInMinutes is not one of the event type durations' } },
				message: 'Die gewählte Termindauer wird vom Kalender nicht unterstützt. Bitte wählen Sie ein anderes Start- und Endzeitfenster.'
			}
		];
		const originalConsoleError = console.error;
		console.error = () => {};
		try {
			for (const testCase of cases) {
				const mockFetch = (async () => new Response(JSON.stringify(testCase.result), {
					status: 400, headers: { 'content-type': 'application/json' }
				})) as unknown as typeof fetch;
				const promise = createCalBookingWithToken(configuration, mockFetch, false, {
					eventTypeId: '456', start: configuration.eventStart, end: configuration.eventEnd,
					title: 'ALL IN AGI Hackathon', field: 'hackathon', location: 'Musterstraße 1, 10115 Berlin, Deutschland'
				}, 'cal_test');
				await expect(promise).rejects.toEqual(expect.objectContaining({ message: testCase.message, status: 400, field: 'hackathon' }));
			}
		} finally {
			console.error = originalConsoleError;
		}
	});

	test('turns provider configuration failures into a retryable service warning', async () => {
		const originalConsoleError = console.error;
		console.error = () => {};
		try {
			const mockFetch = (async () => new Response(JSON.stringify({ error: { message: 'Event type not found' } }), {
				status: 404, headers: { 'content-type': 'application/json' }
			})) as unknown as typeof fetch;
			const promise = createCalBookingWithToken(configuration, mockFetch, false, {
				eventTypeId: '456', start: configuration.eventStart, end: configuration.eventEnd,
				title: 'ALL IN AGI Hackathon', field: 'hackathon'
			}, 'cal_test');
			await expect(promise).rejects.toEqual(expect.objectContaining({
				message: 'Unser Buchungskalender ist derzeit nicht vollständig verfügbar. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns.',
				status: 503,
				field: 'hackathon'
			}));
		} finally {
			console.error = originalConsoleError;
		}
	});

	test('cancels a non-demo booking through Cal.com', async () => {
		let request: { url: string; init?: RequestInit } | undefined;
		const mockFetch = (async (url: URL | RequestInfo, init?: RequestInit) => {
			request = { url: String(url), init };
			return new Response(JSON.stringify({ status: 'success' }), { status: 200, headers: { 'content-type': 'application/json' } });
		}) as typeof fetch;
		await cancelCalBookingWithToken({ status: 'success', demo: false, uid: 'event/1', start: configuration.eventStart, end: configuration.eventEnd }, mockFetch, 'cal_test');
		expect(request?.url).toEndWith('/event%2F1/cancel');
		expect(request?.init?.method).toBe('POST');
	});
});

describe('prep-call rescheduling', () => {
	test('updates demo bookings without calling Cal.com', async () => {
		let called = false;
		const mockFetch = (async () => {
			called = true;
			throw new Error('should not be called');
		}) as unknown as typeof fetch;
		const result = await reschedulePrepCallWithToken('demo-1', '2099-05-11T10:00:00.000Z', mockFetch, true);
		expect(called).toBe(false);
		expect(result).toMatchObject({
			demo: true,
			uid: 'demo-1',
			start: '2099-05-11T10:00:00.000Z',
			end: '2099-05-11T11:00:00.000Z'
		});
	});

	test('uses the returned Cal.com booking identifiers', async () => {
		let request: { url: string; init?: RequestInit } | undefined;
		const mockFetch = (async (url: URL | RequestInfo, init?: RequestInit) => {
			request = { url: String(url), init };
			return new Response(JSON.stringify({
				data: {
					uid: 'new-uid',
					icsUid: 'new-ics',
					title: 'Prep Call',
					start: '2099-05-11T10:00:00.000Z',
					end: '2099-05-11T11:00:00.000Z',
					meetingUrl: 'https://meet.example.com'
				}
			}), { status: 201, headers: { 'content-type': 'application/json' } });
		}) as typeof fetch;
		const result = await reschedulePrepCallWithToken('old-uid', '2099-05-11T10:00:00.000Z', mockFetch, false, 'cal_test');
		expect(request?.url).toEndWith('/old-uid/reschedule');
		expect(request?.init?.method).toBe('POST');
		expect(result).toMatchObject({ uid: 'new-uid', icsUid: 'new-ics', meetingUrl: 'https://meet.example.com' });
	});

	test('maps slot conflicts to a retryable booking error', async () => {
		const mockFetch = (async () => (
			new Response(JSON.stringify({ message: 'slot conflict' }), { status: 409, headers: { 'content-type': 'application/json' } })
		)) as unknown as typeof fetch;
		const promise = reschedulePrepCallWithToken('old-uid', '2099-05-11T10:00:00.000Z', mockFetch, false, 'cal_test');
		await expect(promise).rejects.toEqual(expect.objectContaining({ status: 409 }));
	});
});
