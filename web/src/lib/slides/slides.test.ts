import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { editorSource, orderSlides, parseEditorDocument, parseSlideDocument, removedSlideSource, slidesFromDocuments, slidesWithSavedDocuments, visibleSlides, withSavedSources } from './parse';

const directory = import.meta.dir;

describe('slide documents', () => {
	test('reads every text file in filename order and nothing else', () => {
		const names = readdirSync(directory).filter((name) => name.endsWith('.txt')).sort((left, right) => left.localeCompare(right, 'en'));
		const fromDisk = slidesFromDocuments(
			Object.fromEntries(names.map((name) => [name, readFileSync(join(directory, name), 'utf8')]))
		);
		expect(names).toEqual([
			'01-warum-ein-hackathon.txt',
			'02-warum-wir.txt',
			'03-ablauf.txt',
			'04-naechste-schritte.txt'
		]);
		expect(fromDisk.map((slide) => slide.title)).toEqual([
			'Warum ein Hackathon?',
			'Warum wir?',
			'Ablauf',
			'Nächste Schritte'
		]);
		for (const slide of fromDisk) expect(slide.points.length).toBeLessThanOrEqual(6);
	});

	test('applies a saved order and keeps new files', () => {
		const slides = slidesFromDocuments({
			'01-a.txt': 'A\nErste\n- Eins.',
			'02-b.txt': 'B\nZweite\n- Zwei.',
			'03-c.txt': 'C\nDritte\n- Drei.'
		});
		expect(orderSlides(slides, ['02-b', '01-a']).map((slide) => slide.id)).toEqual(['02-b', '01-a', '03-c']);
		expect(visibleSlides(slides, ['02-b', '01-a'], ['01-a']).map((slide) => slide.id)).toEqual(['02-b', '03-c']);
	});

	test('reads a title and sentences from the editor', () => {
		const slides = slidesFromDocuments({ '01-a.txt': 'Kopf\nTitel\n- Eins.' });
		expect(slides[0]?.source).toBe(editorSource({ title: 'Titel', points: ['Eins.'] }));
		expect(parseEditorDocument('Neue Überschrift\n\n- Erster Satz\n- Zweiter Satz')).toEqual({
			title: 'Neue Überschrift',
			points: ['Erster Satz', 'Zweiter Satz']
		});
		expect(withSavedSources(slides, { '01-a': 'Geändert\n- Nur noch das.' })[0]).toMatchObject({
			title: 'Geändert',
			points: ['Nur noch das.'],
			source: 'Geändert\n- Nur noch das.'
		});
		expect(withSavedSources(slides, { '01-a': 'ohne satz' })[0]?.title).toBe('Titel');
		expect(slidesWithSavedDocuments(slides, [
			{ id: 'slide-200', source: 'Neu\n- Ein Satz' },
			{ id: 'slide-100', source: 'Früher\n- Alter Satz' },
			{ id: '01-a', source: 'Geändert\n- Nur noch das.' }
		]).map((slide) => slide.id)).toEqual(['01-a', 'slide-100', 'slide-200']);
		expect(slidesWithSavedDocuments(slides, [
			{ id: '01-a', source: removedSlideSource },
			{ id: 'slide-100', source: 'Bleibt\n- Ein Satz' }
		]).map((slide) => slide.id)).toEqual(['slide-100']);
	});

	test('rejects a document with more than six sentences', () => {
		expect(() =>
			parseSlideDocument(`Kopf\nTitel\n- Eins.\n- Zwei.\n- Drei.\n- Vier.\n- Fünf.\n- Sechs.\n- Sieben.`)
		).toThrow(/ein bis sechs/);
	});
});
