export type SlideDocument = {
	kicker: string;
	title: string;
	points: readonly string[];
};

export type Slide = SlideDocument & {
	id: string;
	source: string;
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
	if (points.length < 1 || points.length > 6) {
		throw new Error(`${name}: eine Folie hat ein bis sechs Sätze.`);
	}
	return { kicker, title, points };
}

/** Textarea shape: the title, then one sentence per line starting with "- ". */
export function editorSource(slide: Pick<SlideDocument, 'title' | 'points'>) {
	return [slide.title, '', ...slide.points.map((point) => `- ${point}`)].join('\n');
}

export function parseEditorDocument(source: string, name = 'slide'): Pick<SlideDocument, 'title' | 'points'> {
	const lines = source
		.replace(/^\uFEFF/, '')
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0 && !line.startsWith('#'));
	const [title, ...rest] = lines;
	if (!title || title.startsWith('- ')) throw new Error(`${name}: die erste Zeile ist der Titel.`);
	if (rest.some((line) => !line.startsWith('- '))) {
		throw new Error(`${name}: jeder Satz beginnt mit "- ".`);
	}
	const points = rest.map((line) => line.slice(2).trim());
	if (points.some((point) => point.length === 0) || points.length < 1 || points.length > 6) {
		throw new Error(`${name}: eine Folie hat ein bis sechs Sätze.`);
	}
	return { title, points };
}

/** Empty saved text means the slide was deleted, including a slide that also exists as a file. */
export const removedSlideSource = '';

/** File slides, then slides that exist only as saved editor text. Deleted slides are left out. */
export function slidesWithSavedDocuments(
	fileSlides: readonly Slide[],
	saved: readonly { id: string; source: string }[]
): Slide[] {
	const removed = new Set(saved.filter((row) => row.source === removedSlideSource).map((row) => row.id));
	const active = saved.filter((row) => row.source !== removedSlideSource);
	const byId = Object.fromEntries(active.map((row) => [row.id, row.source]));
	const merged = withSavedSources(fileSlides, byId).filter((slide) => !removed.has(slide.id));
	const known = new Set(fileSlides.map((slide) => slide.id));
	const extras = active
		.filter((row) => !known.has(row.id))
		.sort((left, right) => left.id.localeCompare(right.id))
		.flatMap((row) => {
			try {
				const parsed = parseEditorDocument(row.source, row.id);
				return [{ id: row.id, kicker: '', title: parsed.title, points: parsed.points, source: row.source }];
			} catch {
				return [];
			}
		});
	return [...merged, ...extras];
}

/** Saved editor text replaces the file copy. An unreadable save keeps the file copy. */
export function withSavedSources(slides: readonly Slide[], saved: Readonly<Record<string, string>>): Slide[] {
	return slides.map((slide) => {
		const source = saved[slide.id];
		if (source == null) return slide;
		try {
			const parsed = parseEditorDocument(source, slide.id);
			return { ...slide, title: parsed.title, points: parsed.points, source };
		} catch {
			return slide;
		}
	});
}

export function slideId(path: string) {
	const name = path.split('/').pop() ?? path;
	return name.replace(/\.txt$/, '');
}

/** File order, then any saved id list, without slides hidden in this browser. */
export function visibleSlides(slides: readonly Slide[], ids: readonly string[], hidden: readonly string[] = []): Slide[] {
	const hiddenIds = new Set(hidden);
	return orderSlides(slides, ids).filter((slide) => !hiddenIds.has(slide.id));
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
		.map(([path, source]) => {
			const document = parseSlideDocument(source, path);
			return { ...document, id: slideId(path), source: editorSource(document) };
		});
}
