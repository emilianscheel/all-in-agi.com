import { describe, expect, test } from 'bun:test';
import { lunchIconKind } from './lunch-icon';

describe('lunch icon selection', () => {
	test('uses icons for the standard lunch choices', () => {
		expect(lunchIconKind('pizza')).toBe('pizza');
		expect(lunchIconKind('none')).toBe('utensils-crossed');
		expect(lunchIconKind('self-organized')).toBe('utensils');
	});

	test('recognizes German and English custom menu keywords', () => {
		expect(lunchIconKind('custom', 'Vegetarische Bowls')).toBe('soup');
		expect(lunchIconKind('custom', 'Salat und Brot')).toBe('salad');
		expect(lunchIconKind('custom', 'Chicken wraps')).toBe('sandwich');
		expect(lunchIconKind('custom', 'Gegrillter Lachs')).toBe('fish');
		expect(lunchIconKind('custom', 'Rindersteak')).toBe('beef');
		expect(lunchIconKind('custom', 'Hähnchen')).toBe('drumstick');
		expect(lunchIconKind('custom', 'Eis')).toBe('ice-cream');
		expect(lunchIconKind('custom', 'Kuchen und Kaffee')).toBe('cake');
		expect(lunchIconKind('custom', 'Fresh apple')).toBe('apple');
	});

	test('falls back to generic utensils for unmatched custom food', () => {
		expect(lunchIconKind('custom', 'Vegetarisches Catering')).toBe('utensils');
		expect(lunchIconKind('custom', '')).toBe('utensils');
	});
});
