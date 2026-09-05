const BERLIN_TIME_ZONE = 'Europe/Berlin';
export const PREP_CALL_DURATION_MINUTES = 30;

function localDateString(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function prepCallDateBounds(reference = new Date()) {
	const minimum = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() + 1);
	const maximum = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() + 45);
	return { min: localDateString(minimum), max: localDateString(maximum) };
}

export function berlinDateKey(value: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '';
	const parts = new Intl.DateTimeFormat('de-DE', {
		timeZone: BERLIN_TIME_ZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).formatToParts(date);
	const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
	return `${part('year')}-${part('month')}-${part('day')}`;
}

export function normalizeAvailabilitySlots(slots: unknown[]) {
	return [...new Set(slots.filter((slot): slot is string => typeof slot === 'string' && !Number.isNaN(new Date(slot).getTime())))]
		.sort((left, right) => new Date(left).getTime() - new Date(right).getTime());
}

export function availablePrepCallDates(slots: string[]) {
	return [...new Set(slots.map(berlinDateKey).filter(Boolean))];
}

export function prepCallSlotsForDate(slots: string[], date: string) {
	return slots.filter((slot) => berlinDateKey(slot) === date);
}

export function prepCallQuickSlots(slots: string[], limit = 15, perDate = 2) {
	const counts = new Map<string, number>();
	const quickSlots: string[] = [];
	for (const slot of normalizeAvailabilitySlots(slots)) {
		const date = berlinDateKey(slot);
		if (!date || (counts.get(date) ?? 0) >= perDate) continue;
		counts.set(date, (counts.get(date) ?? 0) + 1);
		quickSlots.push(slot);
		if (quickSlots.length >= limit) break;
	}
	return quickSlots;
}

export function formatPrepCallTime(value: string) {
	return new Intl.DateTimeFormat('de-DE', {
		timeZone: BERLIN_TIME_ZONE,
		hour: '2-digit',
		minute: '2-digit'
	}).format(new Date(value));
}
