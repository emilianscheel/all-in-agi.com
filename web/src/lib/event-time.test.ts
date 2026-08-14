import { describe, expect, test } from 'bun:test';
import {
	berlinDateTimeToIso,
	berlinInputsFromIso,
	eventDurationMinutes,
	eventTimesForDate,
	formatEventTimeRange,
	isValidEventTimeRange
} from './event-time';

describe('hackathon event times', () => {
	test('converts Berlin winter and summer times to UTC', () => {
		expect(berlinDateTimeToIso('2099-01-15', '09:00')).toBe('2099-01-15T08:00:00.000Z');
		expect(berlinDateTimeToIso('2099-06-20', '09:00')).toBe('2099-06-20T07:00:00.000Z');
		expect(berlinInputsFromIso('2099-06-20T15:00:00.000Z')).toEqual({ date: '2099-06-20', time: '17:00' });
	});

	test('uses the default 09:00–17:00 Berlin window', () => {
		const range = eventTimesForDate('2099-06-20');
		expect(range).toEqual({ eventStart: '2099-06-20T07:00:00.000Z', eventEnd: '2099-06-20T15:00:00.000Z' });
		expect(eventDurationMinutes(range.eventStart, range.eventEnd)).toBe(480);
	});

	test('performs structural validation while Cal.com controls available slots', () => {
		expect(isValidEventTimeRange('2099-06-20T07:00:00.000Z', '2099-06-20T12:00:00.000Z')).toBe(true);
		expect(isValidEventTimeRange('2099-06-20T07:00:00.000Z', '2099-06-20T12:30:00.000Z')).toBe(true);
		expect(isValidEventTimeRange('2099-06-20T07:00:00.000Z', '2099-06-20T15:00:00.000Z')).toBe(true);
		expect(isValidEventTimeRange('2099-06-20T07:00:00.000Z', '2099-06-20T07:00:00.000Z')).toBe(false);
		expect(isValidEventTimeRange('2099-06-20T15:00:00.000Z', '2099-06-20T07:00:00.000Z')).toBe(false);
		expect(isValidEventTimeRange('2099-06-20T07:00:00.000Z', '2099-06-21T07:00:00.000Z')).toBe(false);
	});

	test('formats the complete local date and time range', () => {
		expect(formatEventTimeRange('2099-06-20T07:00:00.000Z', '2099-06-20T15:00:00.000Z')).toContain('09:00–17:00 Uhr');
	});
});
