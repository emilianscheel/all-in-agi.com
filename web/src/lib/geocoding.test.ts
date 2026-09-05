import { describe, expect, test } from 'bun:test';
import { addressAtCoordinates, reverseGeocode } from './geocoding';

describe('coordinate address selection', () => {
	test('clears stale address fields while retaining the selected marker coordinates', () => {
		expect(addressAtCoordinates({ latitude: 52.52, longitude: 13.405 })).toEqual({
			label: '', street: '', postalCode: '', city: '', country: 'Deutschland', latitude: 52.52, longitude: 13.405
		});
	});

	test('normalizes a reverse-geocoded address', async () => {
		const mockFetch = (async () => new Response(JSON.stringify({ features: [{
			type: 'Feature', geometry: { type: 'Point', coordinates: [13.405, 52.52] },
			properties: { street: 'Unter den Linden', housenumber: '1', postcode: '10117', city: 'Berlin', country: 'Deutschland', countrycode: 'DE' }
		}] }), { status: 200 })) as unknown as typeof fetch;
		await expect(reverseGeocode(mockFetch, { latitude: 52.52, longitude: 13.405 }, 'de')).resolves.toMatchObject({
			street: 'Unter den Linden 1', postalCode: '10117', city: 'Berlin'
		});
	});
});
