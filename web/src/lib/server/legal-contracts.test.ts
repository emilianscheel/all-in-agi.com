import { describe, expect, test } from 'bun:test';
import { addBerlinBusinessDays, berlinPublicHolidays } from './legal-contracts';

describe('Berlin contract exit deadline', () => {
	test('skips weekends and Berlin public holidays', () => {
		const deadline = addBerlinBusinessDays(new Date('2026-12-23T14:00:00Z'), 2);
		expect(deadline.toISOString()).toBe('2026-12-28T14:00:00.000Z');
		expect(berlinPublicHolidays(2026).has('2026-12-25')).toBe(true);
	});

	test('preserves Berlin local wall time in winter and summer', () => {
		expect(addBerlinBusinessDays(new Date('2026-01-12T14:00:00Z'), 2).toISOString()).toBe('2026-01-14T14:00:00.000Z');
		expect(addBerlinBusinessDays(new Date('2026-07-13T13:00:00Z'), 2).toISOString()).toBe('2026-07-15T13:00:00.000Z');
	});
});
