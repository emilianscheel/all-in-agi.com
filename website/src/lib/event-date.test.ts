import { describe, expect, test } from 'bun:test';
import { eventDateBounds, isEventDateInRange } from './event-date';

describe('event date calendar', () => {
	const bounds = eventDateBounds(new Date(2026, 6, 22, 23, 30));

	test('uses local calendar days for tomorrow and the one-year limit', () => {
		expect(bounds).toEqual({ min: '2026-07-23', max: '2027-07-22' });
	});

	test('accepts only ISO dates inside the configured range', () => {
		expect(isEventDateInRange('2026-07-23', bounds)).toBe(true);
		expect(isEventDateInRange('2027-07-22', bounds)).toBe(true);
		expect(isEventDateInRange('2026-07-22', bounds)).toBe(false);
		expect(isEventDateInRange('not-a-date', bounds)).toBe(false);
	});
});
