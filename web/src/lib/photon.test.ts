import { describe, expect, test } from 'bun:test';
import { normalizePhotonAddress } from './photon';

describe('Photon address normalization', () => {
	test('normalizes a typical German address feature', () => {
		expect(normalizePhotonAddress({
			type: 'Feature',
			geometry: { type: 'Point', coordinates: [13.3769, 52.5282] },
			properties: {
				name: 'Invalidenstraße 117',
				street: 'Invalidenstraße',
				housenumber: '117',
				postcode: '10115',
				city: 'Berlin',
				country: 'Deutschland'
			}
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
		expect(normalizePhotonAddress({
			geometry: { coordinates: [8.68, 50.11] },
			properties: { name: 'Werkstraße' }
		})).toEqual({
			label: 'Werkstraße, Deutschland',
			street: 'Werkstraße',
			postalCode: '',
			city: '',
			country: 'Deutschland',
			longitude: 8.68,
			latitude: 50.11
		});
	});
});
