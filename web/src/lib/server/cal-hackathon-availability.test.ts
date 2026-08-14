import { beforeEach, describe, expect, test } from 'bun:test';
import {
	clearCalHackathonDurationCache,
	getCalHackathonAvailability,
	getCalHackathonDurations,
	isCalHackathonSlotAvailable
} from './cal-hackathon-availability';

function response(value: unknown, status = 200) {
	return new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
}

beforeEach(clearCalHackathonDurationCache);

describe('Cal.com hackathon availability', () => {
	test('loads, sanitizes and caches the event type durations', async () => {
		const requests: Array<{ url: string; init?: RequestInit }> = [];
		const mockFetch = (async (url: URL | RequestInfo, init?: RequestInit) => {
			requests.push({ url: String(url), init });
			return response({ data: { lengthInMinutes: 480, lengthInMinutesOptions: [600, 300, 480, -1, 1440, '360'] } });
		}) as typeof fetch;
		expect(await getCalHackathonDurations(mockFetch, 'cal_test', '123', 1)).toEqual([300, 480, 600]);
		expect(await getCalHackathonDurations(mockFetch, 'cal_test', '123', 2)).toEqual([300, 480, 600]);
		expect(requests).toHaveLength(1);
		expect(requests[0].init?.headers).toMatchObject({ Authorization: 'Bearer cal_test', 'cal-api-version': '2024-06-14' });
	});

	test('requests and combines slots for every configured duration', async () => {
		const requestedUrls: string[] = [];
		const mockFetch = (async (urlValue: URL | RequestInfo) => {
			const url = String(urlValue);
			requestedUrls.push(url);
			if (url.includes('/event-types/')) return response({ data: { lengthInMinutes: 300, lengthInMinutesOptions: [300, 480] } });
			const duration = Number(new URL(url).searchParams.get('duration'));
			return response({ data: { '2099-08-19': [{ start: '2099-08-19T09:00:00.000+02:00', end: new Date('2099-08-19T07:00:00.000Z').getTime() + duration * 60_000 }] } });
		}) as typeof fetch;
		// Use string end values, matching Cal.com's range response.
		const rangedFetch = (async (urlValue: URL | RequestInfo, init?: RequestInit) => {
			const url = String(urlValue);
			if (url.includes('/event-types/')) return mockFetch(urlValue, init);
			requestedUrls.push(url);
			const duration = Number(new URL(url).searchParams.get('duration'));
			return response({ data: { '2099-08-19': [{ start: '2099-08-19T09:00:00.000+02:00', end: new Date(Date.parse('2099-08-19T07:00:00.000Z') + duration * 60_000).toISOString() }] } });
		}) as typeof fetch;
		const result = await getCalHackathonAvailability(rangedFetch, {
			token: 'cal_test', eventTypeId: '123', start: '2099-08-01', end: '2099-08-31', bookingUidToReschedule: 'booking-1'
		});
		expect(result.durations).toEqual([300, 480]);
		expect(result.slots.map((slot) => slot.duration)).toEqual([480, 300]);
		const slotUrls = requestedUrls.filter((url) => url.includes('/slots'));
		expect(slotUrls).toHaveLength(2);
		expect(slotUrls.every((url) => new URL(url).searchParams.get('format') === 'range')).toBe(true);
		expect(slotUrls.every((url) => new URL(url).searchParams.get('bookingUidToReschedule') === 'booking-1')).toBe(true);
	});

	test('revalidates an exact start, end and duration', async () => {
		const mockFetch = (async (urlValue: URL | RequestInfo) => {
			const url = String(urlValue);
			if (url.includes('/event-types/')) return response({ data: { lengthInMinutes: 480, lengthInMinutesOptions: [480] } });
			return response({ data: { '2099-08-19': [{ start: '2099-08-19T09:00:00.000+02:00', end: '2099-08-19T17:00:00.000+02:00' }] } });
		}) as typeof fetch;
		expect(await isCalHackathonSlotAvailable(mockFetch, {
			token: 'cal_test', eventTypeId: '123', start: '2099-08-19T07:00:00.000Z', end: '2099-08-19T15:00:00.000Z'
		})).toBe(true);
		expect(await isCalHackathonSlotAvailable(mockFetch, {
			token: 'cal_test', eventTypeId: '123', start: '2099-08-19T08:00:00.000Z', end: '2099-08-19T16:00:00.000Z'
		})).toBe(false);
	});

	test('turns event type failures into actionable provider errors', async () => {
		const mockFetch = (async () => response({ error: { message: 'not found' } }, 404)) as unknown as typeof fetch;
		await expect(getCalHackathonDurations(mockFetch, 'cal_test', '123')).rejects.toEqual(
			expect.objectContaining({ status: 404, message: 'Die Hackathon-Konfiguration konnte nicht geladen werden.' })
		);
	});
});
