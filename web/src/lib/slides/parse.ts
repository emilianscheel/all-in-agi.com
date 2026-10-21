export type SlideDocument = {
	kicker: string;
	title: string;
	points: readonly string[];
};

export type Slide = SlideDocument & {
	id: string;
};

/** Turns one slide text file into the slide shown on screen. */
export function parseSlideDocument(source: string, name = 'slide'): SlideDocument {
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

export function slideId(path: string) {
	const name = path.split('/').pop() ?? path;
	return name.replace(/\.txt$/, '');
}

/** File order, then any saved id list. Unknown files stay at the end. */
export function orderSlides(slides: readonly Slide[], ids: readonly string[]): Slide[] {
	const byId = new Map(slides.map((slide) => [slide.id, slide]));
	const ordered: Slide[] = [];
	const seen = new Set<string>();
	for (const id of ids) {
		const slide = byId.get(id);
		if (!slide || seen.has(id)) continue;
		ordered.push(slide);
		seen.add(id);
	}
	for (const slide of slides) {
		if (!seen.has(slide.id)) ordered.push(slide);
	}
	return ordered;
}

export function slidesFromDocuments(sources: Record<string, string>): Slide[] {
	return Object.entries(sources)
		.sort(([left], [right]) => left.localeCompare(right, 'en'))
		.map(([path, source]) => ({ ...parseSlideDocument(source, path), id: slideId(path) }));
}
