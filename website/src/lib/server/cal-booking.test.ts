import { describe, expect, test } from 'bun:test';
import { reschedulePrepCallWithToken } from './cal-reschedule';

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
