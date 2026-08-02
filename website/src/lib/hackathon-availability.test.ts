import { describe, expect, test } from 'bun:test';
import {
	formatHackathonDuration,
	formatHackathonSlot,
	hackathonAvailableDates,
	hackathonEndSlots,
	hackathonStartSlots,
	normalizeHackathonSlots,
	preferredHackathonSlot
} from './hackathon-availability';

const slots = normalizeHackathonSlots([
	{ start: '2099-08-19T06:00:00.000Z', end: '2099-08-19T11:00:00.000Z', duration: 300 },
	{ start: '2099-08-19T07:00:00.000Z', end: '2099-08-19T12:00:00.000Z', duration: 300 },
	{ start: '2099-08-19T07:00:00.000Z', end: '2099-08-19T15:00:00.000Z', duration: 480 },
	{ start: '2099-08-19T07:00:00.000Z', end: '2099-08-19T15:00:00.000Z', duration: 480 },
	{ start: '2099-08-20T07:00:00.000Z', end: '2099-08-20T15:00:00.000Z', duration: 480 },
	{ start: 'invalid', end: '2099-08-20T15:00:00.000Z', duration: 480 },
	{ start: '2099-08-20T20:00:00.000Z', end: '2099-08-21T01:00:00.000Z', duration: 300 }
]);

describe('hackathon availability model', () => {
	test('normalizes, sorts and groups concrete Cal.com slots', () => {
		expect(slots).toHaveLength(4);
		expect(hackathonAvailableDates(slots)).toEqual(['2099-08-19', '2099-08-20']);
		expect(hackathonStartSlots(slots, '2099-08-19').map((slot) => slot.start)).toEqual([
			'2099-08-19T06:00:00.000Z', '2099-08-19T07:00:00.000Z'
		]);
		expect(hackathonEndSlots(slots, '2099-08-19T07:00:00.000Z').map((slot) => slot.duration)).toEqual([300, 480]);
	});

	test('prefers 09:00–17:00, then another 09:00 slot, and avoids an earlier 08:00 fallback', () => {
		expect(preferredHackathonSlot(slots, '2099-08-19')?.duration).toBe(480);
		const withLaterStart = normalizeHackathonSlots([
			...slots.filter((slot) => slot.start !== '2099-08-19T07:00:00.000Z'),
			{ start: '2099-08-19T11:00:00.000Z', end: '2099-08-19T16:00:00.000Z', duration: 300 }
		]);
		expect(preferredHackathonSlot(withLaterStart, '2099-08-19')?.start).toBe('2099-08-19T11:00:00.000Z');
		expect(preferredHackathonSlot(slots, '2099-08-19', slots[0].start, slots[0].end)).toEqual(slots[0]);
	});

	test('formats configured durations for the existing end-time select', () => {
		expect(formatHackathonDuration(300)).toBe('5 Std.');
		expect(formatHackathonDuration(330)).toBe('5,5 Std.');
		const fullDay = slots.find((slot) => slot.duration === 480)!;
		expect(formatHackathonSlot(fullDay)).toBe('09:00–17:00 Uhr · 8 Std.');
	});
});
