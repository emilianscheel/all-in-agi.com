import { describe, expect, test } from 'bun:test';
import { getCalPrepCallSlots } from './cal-prep-availability';

describe('Cal.com prep-call availability', () => {
	test('requests fixed 30-minute slots and normalizes the response', async () => {
		let requestedUrl = '';
		const mockFetch = (async (url: URL | RequestInfo) => {
			requestedUrl = String(url);
			return new Response(JSON.stringify({ data: {
				'2099-08-03': [{ start: '2099-08-03T08:00:00.000Z' }, '2099-08-03T09:00:00.000Z', { start: 'invalid' }]
			} }), { status: 200, headers: { 'content-type': 'application/json' } });
		}) as typeof fetch;
		const slots = await getCalPrepCallSlots(mockFetch, {
			token: 'cal_test', eventTypeId: '123', start: '2099-08-03', end: '2099-08-03'
		});
		const url = new URL(requestedUrl);
		expect(url.searchParams.get('duration')).toBe('30');
		expect(url.searchParams.get('timeZone')).toBe('Europe/Berlin');
		expect(slots).toEqual(['2099-08-03T08:00:00.000Z', '2099-08-03T09:00:00.000Z']);
	});

	test('preserves provider status for actionable handling', async () => {
		const mockFetch = (async () => new Response('{}', { status: 401 })) as unknown as typeof fetch;
		await expect(getCalPrepCallSlots(mockFetch, {
			token: 'bad', eventTypeId: '123', start: '2099-08-03', end: '2099-08-03'
		})).rejects.toEqual(expect.objectContaining({ status: 401 }));
	});
});
