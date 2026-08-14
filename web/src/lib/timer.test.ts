import { describe, expect, test } from 'bun:test';
import {
	deriveHackathonMilestones,
	formatRemainingTime,
	hackathonCountdownState,
	resolveBerlinTargetTime
} from './timer';

describe('timer targets', () => {
	test('resolves a later Berlin time today and an earlier time tomorrow', () => {
		expect(resolveBerlinTargetTime('13:00', new Date('2026-07-26T10:00:00.000Z'))).toBe('2026-07-26T11:00:00.000Z');
		expect(resolveBerlinTargetTime('09:00', new Date('2026-07-26T10:00:00.000Z'))).toBe('2026-07-27T07:00:00.000Z');
	});

	test('resolves midnight and skips a nonexistent Berlin DST time', () => {
		expect(resolveBerlinTargetTime('00:00', new Date('2026-07-26T10:00:00.000Z'))).toBe('2026-07-26T22:00:00.000Z');
		expect(resolveBerlinTargetTime('02:30', new Date('2026-03-29T00:00:00.000Z'))).toBe('2026-03-30T00:30:00.000Z');
	});
});

describe('remaining time formatting', () => {
	test('rounds up partial minutes and clamps completed timers', () => {
		expect(formatRemainingTime('2026-01-01T01:00:01.000Z', '2026-01-01T00:00:00.000Z').display).toBe('01:01 h');
		expect(formatRemainingTime('2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')).toEqual({ completed: true, display: '00:00 h', totalMinutes: 0 });
	});

	test('uses an adaptive day display for long waits', () => {
		expect(formatRemainingTime('2026-01-03T03:04:00.000Z', '2026-01-01T00:00:00.000Z').display).toBe('2 Tage · 03:04 h');
	});
});

describe('hackathon milestones', () => {
	const base = { eventStart: '2026-07-26T07:00:00.000Z', eventEnd: '2026-07-26T15:00:00.000Z', lunch: 'pizza' as const, customLunch: '' };

	test('derives the full standard-day agenda and countdown state', () => {
		const milestones = deriveHackathonMilestones(base);
		expect(milestones.map(({ label, at }) => [label, at])).toEqual([
			['Kickoff', '2026-07-26T07:00:00.000Z'],
			['Build Sprint', '2026-07-26T07:30:00.000Z'],
			['Pizza', '2026-07-26T11:00:00.000Z'],
			['Hand-in', '2026-07-26T14:30:00.000Z'],
			['Ende', '2026-07-26T15:00:00.000Z']
		]);
		expect(hackathonCountdownState(milestones, '2026-07-26T08:00:00.000Z').label).toBe('Bis Pizza');
		expect(hackathonCountdownState(milestones, '2026-07-26T16:00:00.000Z').completed).toBe(true);
	});

	test('compresses edge milestones for short events while preserving order', () => {
		const milestones = deriveHackathonMilestones({ ...base, eventEnd: '2026-07-26T08:00:00.000Z' });
		expect(milestones.map(({ at }) => at)).toEqual([...milestones.map(({ at }) => at)].sort());
		expect(milestones[1].at).toBe('2026-07-26T07:15:00.000Z');
		expect(milestones[3].at).toBe('2026-07-26T07:45:00.000Z');
	});

	test('uses every configured lunch behavior', () => {
		expect(deriveHackathonMilestones({ ...base, lunch: 'custom', customLunch: 'Tacos' })[2].label).toBe('Tacos');
		expect(deriveHackathonMilestones({ ...base, lunch: 'self-organized' })[2].label).toBe('Selbstorganisiertes Lunch');
		expect(deriveHackathonMilestones({ ...base, lunch: 'none' }).some(({ id }) => id === 'lunch')).toBe(false);
	});
});
