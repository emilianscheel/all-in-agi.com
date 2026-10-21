import { describe, expect, test } from 'bun:test';
import { slides } from './slides';

describe('company slides', () => {
	test('opens with a title slide and then the same content shape', () => {
		expect(slides[0]).toEqual({
			kind: 'intro',
			title: 'Your Team Can Just Build Things',
			lede: 'Agentic Engineering Hackathons.'
		});
		const content = slides.slice(1);
		expect(content.length).toBeGreaterThan(0);
		for (const slide of content) {
			expect(slide.kind).toBe('content');
			if (slide.kind !== 'content') continue;
			expect(slide.kicker.length).toBeGreaterThan(0);
			expect(slide.title.length).toBeGreaterThan(0);
			expect(slide.points).toHaveLength(3);
			for (const point of slide.points) {
				expect(point.label.length).toBeGreaterThan(0);
				expect(point.text.length).toBeGreaterThan(0);
			}
		}
	});
});
