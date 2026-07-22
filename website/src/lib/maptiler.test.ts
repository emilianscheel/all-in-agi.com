import { describe, expect, test } from 'bun:test';
import { normalizeMapTilerAddress } from './maptiler';

describe('MapTiler address normalization', () => {
	test('normalizes a typical German address feature', () => {
		expect(normalizeMapTilerAddress({
			id: 'address.123',
			text: 'Invalidenstraße',
			address: '117',
			place_name: 'Invalidenstraße 117, 10115 Berlin, Deutschland',
			center: [13.3769, 52.5282],
			context: [
				{ id: 'postal_code.10115', text: '10115' },
				{ id: 'place.berlin', text: 'Berlin' }
			]
		})).toEqual({
			label: 'Invalidenstraße 117, 10115 Berlin, Deutschland',
			street: 'Invalidenstraße 117',
			postalCode: '10115',
			city: 'Berlin',
			country: 'Deutschland',
			longitude: 13.3769,
			latitude: 52.5282
		});
	});

	test('keeps incomplete results manually editable', () => {
		expect(normalizeMapTilerAddress({
			text: 'Werkstraße',
			geometry: { coordinates: [8.68, 50.11] }
		})).toEqual({
			label: 'Werkstraße',
			street: 'Werkstraße',
			postalCode: '',
			city: '',
			country: 'Deutschland',
			longitude: 8.68,
			latitude: 50.11
		});
	});
});
