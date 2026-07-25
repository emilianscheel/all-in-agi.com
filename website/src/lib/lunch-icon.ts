import type { Lunch } from './booking';

export type LunchIconKind =
	| 'pizza'
	| 'utensils-crossed'
	| 'utensils'
	| 'soup'
	| 'salad'
	| 'sandwich'
	| 'fish'
	| 'beef'
	| 'drumstick'
	| 'cake'
	| 'ice-cream'
	| 'coffee'
	| 'apple';

function normalize(value: string) {
	return value
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLocaleLowerCase('de-DE');
}

export function lunchIconKind(lunch: Lunch, customLunch = ''): LunchIconKind {
	if (lunch === 'pizza') return 'pizza';
	if (lunch === 'none') return 'utensils-crossed';
	if (lunch === 'self-organized') return 'utensils';

	const menu = normalize(customLunch);
	if (['bowl', 'suppe', 'soup', 'ramen'].some((keyword) => menu.includes(keyword))) return 'soup';
	if (['salat', 'salad'].some((keyword) => menu.includes(keyword))) return 'salad';
	if (['sandwich', 'burger', 'wrap'].some((keyword) => menu.includes(keyword))) return 'sandwich';
	if (['fisch', 'fish', 'lachs', 'salmon'].some((keyword) => menu.includes(keyword))) return 'fish';
	if (['rind', 'beef', 'steak'].some((keyword) => menu.includes(keyword))) return 'beef';
	if (['huhn', 'hahnchen', 'chicken', 'poultry'].some((keyword) => menu.includes(keyword))) return 'drumstick';
	if (/\b(eis|ice cream|gelato)\b/.test(menu)) return 'ice-cream';
	if (['kuchen', 'torte', 'cake', 'dessert'].some((keyword) => menu.includes(keyword))) return 'cake';
	if (['kaffee', 'coffee'].some((keyword) => menu.includes(keyword))) return 'coffee';
	if (['apfel', 'apple', 'obst', 'fruit'].some((keyword) => menu.includes(keyword))) return 'apple';
	return 'utensils';
}
