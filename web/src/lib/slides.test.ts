import { describe, expect, test } from 'bun:test';
import { slides } from './slides';

describe('company slides', () => {
	test('opens with a title slide and then three sentences each', () => {
		expect(slides[0]).toEqual({
			kind: 'intro',
			title: 'Your Team Can Just Build Things',
			lede: 'Agentic Engineering Hackathons.'
		});
		expect(slides.slice(1).map((slide) => slide.title)).toEqual([
			'Warum wir?',
			'Warum ein Hackathon?',
			'Nächste Schritte'
		]);
		for (const slide of slides.slice(1)) {
			expect(slide.kind).toBe('content');
			if (slide.kind !== 'content') continue;
			expect(slide.points).toHaveLength(3);
			for (const point of slide.points) expect(point.endsWith('.')).toBe(true);
		}
	});
});
