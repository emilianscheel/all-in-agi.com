import { describe, expect, test } from 'bun:test';
import { POST } from './+server';

describe('plan PDF endpoint', () => {
	test('rejects a malformed hackathon ID', async () => {
		const request = new Request('https://all-in-agi.com/api/plan-pdf', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ hackathonId: 'not-a-hackathon' })
		});
		const response = await POST({ request } as Parameters<typeof POST>[0]);
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ message: 'Die Hackathon-ID ist ungültig.' });
	});
});
