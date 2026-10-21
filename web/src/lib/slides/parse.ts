export type Slide = {
	kicker: string;
	title: string;
	points: readonly string[];
};

/** Turns one slide text file into the slide shown on screen. */
export function parseSlideDocument(source: string, name = 'slide'): Slide {
	const lines = source
		.replace(/^\uFEFF/, '')
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0 && !line.startsWith('#'));
	const [kicker, title, ...rest] = lines;
	if (!kicker || !title) throw new Error(`${name}: Kopfzeile und Titel fehlen.`);
	if (rest.some((line) => !line.startsWith('- '))) {
		throw new Error(`${name}: jeder Satz beginnt mit "- ".`);
	}
	const points = rest.map((line) => line.slice(2).trim());
	if (points.length < 1 || points.length > 3) {
		throw new Error(`${name}: eine Folie hat ein bis drei Sätze.`);
	}
	return { kicker, title, points };
}

export function slidesFromDocuments(sources: Record<string, string>): Slide[] {
	return Object.entries(sources)
		.sort(([left], [right]) => left.localeCompare(right, 'en'))
		.map(([path, source]) => parseSlideDocument(source, path));
}
