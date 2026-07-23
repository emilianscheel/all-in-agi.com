import { describe, expect, test } from 'bun:test';
import {
	generatePublicId,
	generateUniquePublicId,
	isHackathonId,
	isPublicId,
	PUBLIC_ID_PATTERN
} from './public-id';

describe('public IDs', () => {
	test('generates the shared grouped format with the table prefix', () => {
		const id = generatePublicId('H', () => 0);
		expect(id).toBe('HAA-AAA-AAA');
		expect(id).toMatch(PUBLIC_ID_PATTERN);
		expect(isHackathonId(id)).toBe(true);
	});

	test('accepts general table IDs but reserves H for hackathons', () => {
		expect(isPublicId('FF7-ZJI-BLW')).toBe(true);
		expect(isHackathonId('FF7-ZJI-BLW')).toBe(false);
		expect(isHackathonId('HF7-ZJI-BLW')).toBe(true);
		expect(isHackathonId('hf7-zji-blw')).toBe(false);
		expect(isHackathonId('H12-ABC-45')).toBe(false);
	});

	test('rejects invalid prefixes', () => {
		expect(() => generatePublicId('hackathon')).toThrow();
		expect(() => generatePublicId('7')).toThrow();
	});

	test('retries collisions', async () => {
		const candidates = ['HAA-AAA-AAA', 'HBB-BBB-BBB'];
		const id = await generateUniquePublicId(
			'H',
			(candidate) => candidate === 'HAA-AAA-AAA',
			() => candidates.shift()!
		);
		expect(id).toBe('HBB-BBB-BBB');
	});
});
