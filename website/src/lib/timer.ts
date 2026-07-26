import { berlinDateTimeToIso, berlinInputsFromIso, BERLIN_TIME_ZONE } from './event-time';
import type { Lunch } from './booking';

const MINUTE_MS = 60_000;
const DAY_MINUTES = 24 * 60;

export interface TimerMilestone {
	id: 'start' | 'build' | 'lunch' | 'hand-in' | 'end';
	label: string;
	at: string;
}

export interface HackathonTimerSource {
	eventStart: string;
	eventEnd: string;
	lunch: Lunch;
	customLunch: string;
}

export interface RemainingTime {
	completed: boolean;
	display: string;
	totalMinutes: number;
}

function addBerlinCalendarDays(date: string, days: number) {
	const [year, month, day] = date.split('-').map(Number);
	const shifted = new Date(Date.UTC(year, month - 1, day + days));
	return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`;
}

export function resolveBerlinTargetTime(time: string, now = new Date()) {
	if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || Number.isNaN(now.getTime())) return '';
	const today = berlinInputsFromIso(now.toISOString()).date;
	for (let dayOffset = 0; dayOffset <= 1; dayOffset += 1) {
		const candidate = berlinDateTimeToIso(addBerlinCalendarDays(today, dayOffset), time);
		if (candidate && new Date(candidate).getTime() > now.getTime()) return candidate;
	}
	return '';
}

export function formatRemainingTime(target: string | Date | number, now: string | Date | number = Date.now()): RemainingTime {
	const targetMs = new Date(target).getTime();
	const nowMs = new Date(now).getTime();
	if (!Number.isFinite(targetMs) || !Number.isFinite(nowMs) || targetMs <= nowMs) {
		return { completed: true, display: '00:00 h', totalMinutes: 0 };
	}
	const totalMinutes = Math.ceil((targetMs - nowMs) / MINUTE_MS);
	const days = Math.floor(totalMinutes / DAY_MINUTES);
	const remainingMinutes = totalMinutes % DAY_MINUTES;
	const hours = days ? Math.floor(remainingMinutes / 60) : Math.floor(totalMinutes / 60);
	const minutes = remainingMinutes % 60;
	const clock = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} h`;
	return {
		completed: false,
		display: days ? `${days} ${days === 1 ? 'Tag' : 'Tage'} · ${clock}` : clock,
		totalMinutes
	};
}

export function formatBerlinClock(value: string | Date | number = Date.now()) {
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return '--:-- h';
	return `${new Intl.DateTimeFormat('de-DE', {
		timeZone: BERLIN_TIME_ZONE,
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23'
	}).format(parsed)} h`;
}

export function formatBerlinTimelineTime(value: string | Date | number) {
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return '--:--';
	return new Intl.DateTimeFormat('de-DE', {
		timeZone: BERLIN_TIME_ZONE,
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23'
	}).format(parsed);
}

function lunchLabel(source: HackathonTimerSource) {
	if (source.lunch === 'pizza') return 'Pizza';
	if (source.lunch === 'custom') return source.customLunch.trim() || 'Lunch';
	if (source.lunch === 'self-organized') return 'Selbstorganisiertes Lunch';
	return '';
}

export function deriveHackathonMilestones(source: HackathonTimerSource): TimerMilestone[] {
	const start = new Date(source.eventStart).getTime();
	const end = new Date(source.eventEnd).getTime();
	if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];
	const durationMinutes = (end - start) / MINUTE_MS;
	const rawOffset = Math.min(30, durationMinutes / 4);
	const edgeOffsetMinutes = Math.max(5, Math.floor(rawOffset / 5) * 5);
	const result: TimerMilestone[] = [
		{ id: 'start', label: 'Kickoff', at: new Date(start).toISOString() },
		{ id: 'build', label: 'Build Sprint', at: new Date(start + edgeOffsetMinutes * MINUTE_MS).toISOString() }
	];
	const food = lunchLabel(source);
	if (food) result.push({ id: 'lunch', label: food, at: new Date(start + (end - start) / 2).toISOString() });
	result.push(
		{ id: 'hand-in', label: 'Hand-in', at: new Date(end - edgeOffsetMinutes * MINUTE_MS).toISOString() },
		{ id: 'end', label: 'Ende', at: new Date(end).toISOString() }
	);
	return result;
}

export function hackathonCountdownState(milestones: TimerMilestone[], now: string | Date | number = Date.now()) {
	const nowMs = new Date(now).getTime();
	if (!milestones.length || !Number.isFinite(nowMs)) {
		return { target: '', label: 'Hackathon beendet', completed: true, progress: 1 };
	}
	const first = new Date(milestones[0].at).getTime();
	const last = new Date(milestones[milestones.length - 1].at).getTime();
	if (nowMs < first) return { target: milestones[0].at, label: 'Bis zum Hackathon', completed: false, progress: 0 };
	const next = milestones.find((milestone) => new Date(milestone.at).getTime() > nowMs);
	if (!next) return { target: milestones[milestones.length - 1].at, label: 'Hackathon beendet', completed: true, progress: 1 };
	const progress = Math.max(0, Math.min(1, (nowMs - first) / (last - first)));
	return { target: next.at, label: next.id === 'end' ? 'Bis zum Ende' : `Bis ${next.label}`, completed: false, progress };
}
