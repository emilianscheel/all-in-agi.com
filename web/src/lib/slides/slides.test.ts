import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { orderSlides, parseSlideDocument, slidesFromDocuments } from './parse';

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
		for (const slide of fromDisk) expect(slide.points.length).toBeLessThanOrEqual(3);
	});

	test('applies a saved order and keeps new files', () => {
		const slides = slidesFromDocuments({
			'01-a.txt': 'A\nErste\n- Eins.',
			'02-b.txt': 'B\nZweite\n- Zwei.',
			'03-c.txt': 'C\nDritte\n- Drei.'
		});
		expect(orderSlides(slides, ['02-b', '01-a']).map((slide) => slide.id)).toEqual(['02-b', '01-a', '03-c']);
	});

	test('rejects a document with more than three sentences', () => {
		expect(() =>
			parseSlideDocument(`Kopf\nTitel\n- Eins.\n- Zwei.\n- Drei.\n- Vier.`)
		).toThrow(/ein bis drei/);
	});
});
