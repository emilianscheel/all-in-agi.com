import { describe, expect, test } from 'bun:test';
import {
	EVENT_DURATION_OPTIONS_MINUTES,
	EVENT_START_TIME_OPTIONS,
	berlinDateTimeToIso,
	berlinInputsFromIso,
	eventDurationMinutes,
	eventEndTimeOptions,
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

	test('allows only same-day ranges of 5 to 10 full hours', () => {
		expect(EVENT_DURATION_OPTIONS_MINUTES).toEqual([300, 360, 420, 480, 540, 600]);
		expect(isValidEventTimeRange('2099-06-20T07:00:00.000Z', '2099-06-20T12:00:00.000Z')).toBe(true);
		expect(isValidEventTimeRange('2099-06-20T07:00:00.000Z', '2099-06-20T12:30:00.000Z')).toBe(false);
		expect(isValidEventTimeRange('2099-06-20T07:00:00.000Z', '2099-06-20T15:00:00.000Z')).toBe(true);
		expect(isValidEventTimeRange('2099-06-20T07:00:00.000Z', '2099-06-20T17:00:00.000Z')).toBe(true);
		expect(isValidEventTimeRange('2099-06-20T07:00:00.000Z', '2099-06-20T11:30:00.000Z')).toBe(false);
		expect(isValidEventTimeRange('2099-06-20T07:00:00.000Z', '2099-06-20T17:30:00.000Z')).toBe(false);
		expect(isValidEventTimeRange('2099-06-20T07:15:00.000Z', '2099-06-20T15:00:00.000Z')).toBe(false);
		expect(isValidEventTimeRange('2099-06-20T07:00:00.000Z', '2099-06-21T07:00:00.000Z')).toBe(false);
	});

	test('offers only end times matching the allowed durations', () => {
		expect(eventEndTimeOptions('11:00')).toEqual([
			'16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
		]);
		expect(eventEndTimeOptions('11:30')).toEqual([
			'16:30', '17:30', '18:30', '19:30', '20:30', '21:30'
		]);
		expect(EVENT_START_TIME_OPTIONS).toContain('18:30');
		expect(EVENT_START_TIME_OPTIONS).not.toContain('19:00');
	});

	test('formats the complete local date and time range', () => {
		expect(formatEventTimeRange('2099-06-20T07:00:00.000Z', '2099-06-20T15:00:00.000Z')).toContain('09:00–17:00 Uhr');
	});
});
