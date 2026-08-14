function localDateString(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function eventDateBounds(reference = new Date()) {
	const minimum = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() + 1);
	const maximum = new Date(reference.getFullYear() + 1, reference.getMonth(), reference.getDate());
	return { min: localDateString(minimum), max: localDateString(maximum) };
}

export function isEventDateInRange(value: string, bounds = eventDateBounds()) {
	return /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= bounds.min && value <= bounds.max;
}
