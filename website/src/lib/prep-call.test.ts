import { describe, expect, test } from 'bun:test';
import { availablePrepCallDates, berlinDateKey, normalizeAvailabilitySlots, prepCallDateBounds, prepCallSlotsForDate } from './prep-call';

describe('prep call availability', () => {
	test('uses a 45 day local selection window starting tomorrow', () => {
		expect(prepCallDateBounds(new Date(2026, 6, 22, 23, 30))).toEqual({ min: '2026-07-23', max: '2026-09-05' });
	});

	test('groups UTC slots by their calendar date in Europe/Berlin', () => {
		const slots = ['2026-07-23T22:30:00.000Z', '2026-07-24T08:00:00.000Z'];
		expect(berlinDateKey(slots[0])).toBe('2026-07-24');
		expect(availablePrepCallDates(slots)).toEqual(['2026-07-24']);
		expect(prepCallSlotsForDate(slots, '2026-07-24')).toEqual(slots);
	});

	test('sorts, deduplicates, and drops invalid slots', () => {
		expect(normalizeAvailabilitySlots(['invalid', '2026-07-24T10:00:00Z', '2026-07-24T09:00:00Z', '2026-07-24T10:00:00Z'])).toEqual([
			'2026-07-24T09:00:00Z',
			'2026-07-24T10:00:00Z'
		]);
	});
});
