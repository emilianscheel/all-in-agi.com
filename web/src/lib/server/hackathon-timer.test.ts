import { describe, expect, test } from 'bun:test';
import { toPublicHackathonTimer } from './hackathons';

describe('public hackathon timer mapping', () => {
	test('exposes only fields required by the timer', () => {
		const result = toPublicHackathonTimer({
			id: 'HAA-AAA-AAA',
			eventStart: '2099-06-20T07:00:00.000Z',
			eventEnd: '2099-06-20T15:00:00.000Z',
			lunch: 'custom',
			customLunch: 'Tacos'
		});
		expect(result).toEqual({
			id: 'HAA-AAA-AAA',
			eventStart: '2099-06-20T07:00:00.000Z',
			eventEnd: '2099-06-20T15:00:00.000Z',
			lunch: 'custom',
			customLunch: 'Tacos'
		});
		expect(result).not.toHaveProperty('contactEmail');
		expect(result).not.toHaveProperty('price');
	});
});
