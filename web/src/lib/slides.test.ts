import { describe, expect, test } from 'bun:test';
import { slides } from './slides';

describe('intro-call slides', () => {
	test('covers the call sections with speakable points', () => {
		expect(slides.map((slide) => slide.kicker)).toEqual([
			'Erstgespräch',
			'Allgemein',
			'Ort',
			'Verpflegung',
			'Tools',
			'Challenge'
		]);
		for (const slide of slides) {
			expect(slide.title.length).toBeGreaterThan(0);
			expect(slide.points.length).toBeGreaterThan(0);
		}
	});
});
