import { eq } from 'drizzle-orm';
import { slides } from '$lib/slides/documents';
import { editorSource, parseEditorDocument, removedSlideSource, slidesWithSavedDocuments, type Slide } from '$lib/slides/parse';
import { getDb } from './db';
import { slideDocuments } from './db/schema';

const newSlide = { title: 'Neue Folie', points: ['Neuer Satz'] };

export async function loadSlides() {
	const db = await getDb();
	const rows = await db.select({ id: slideDocuments.id, source: slideDocuments.source }).from(slideDocuments);
	return slidesWithSavedDocuments(slides, rows);
}

export async function createSlide(): Promise<Slide> {
	const id = `slide-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
	const source = editorSource(newSlide);
	const parsed = parseEditorDocument(source, id);
	const db = await getDb();
	await db.insert(slideDocuments).values({ id, source, updatedAt: new Date().toISOString() });
	return { id, kicker: '', title: parsed.title, points: [...parsed.points], source };
}

export async function deleteSlide(id: string) {
	const db = await getDb();
	if (!slides.some((slide) => slide.id === id)) {
		await db.delete(slideDocuments).where(eq(slideDocuments.id, id));
		return;
	}
	const updatedAt = new Date().toISOString();
	await db
		.insert(slideDocuments)
		.values({ id, source: removedSlideSource, updatedAt })
		.onConflictDoUpdate({
			target: slideDocuments.id,
			set: { source: removedSlideSource, updatedAt }
		});
}

export async function saveSlideSource(id: string, source: string) {
	parseEditorDocument(source, id);
	const db = await getDb();
	if (!slides.some((slide) => slide.id === id)) {
		const [existing] = await db.select({ id: slideDocuments.id }).from(slideDocuments).where(eq(slideDocuments.id, id)).limit(1);
		if (!existing) throw new Error('Folie nicht gefunden.');
	}
	const updatedAt = new Date().toISOString();
	await db
		.insert(slideDocuments)
		.values({ id, source, updatedAt })
		.onConflictDoUpdate({
			target: slideDocuments.id,
			set: { source, updatedAt }
		});
}
