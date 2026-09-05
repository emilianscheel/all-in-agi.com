import { describe, expect, test } from 'bun:test';
import { handleGeocodeRequest } from './photon-geocoding';

const germanFeature = {
	type: 'Feature',
	geometry: { type: 'Point', coordinates: [13.405, 52.52] },
	properties: { street: 'Unter den Linden', housenumber: '1', postcode: '10117', city: 'Berlin', country: 'Deutschland', countrycode: 'DE' }
};

describe('Photon geocoding proxy', () => {
	test('uses public Photon for forward search when no endpoint is configured', async () => {
		let requestedUrl = '';
		const mockFetch = (async (input: URL | RequestInfo) => {
			requestedUrl = String(input);
			return new Response(JSON.stringify({ features: [germanFeature] }), { status: 200 });
		}) as typeof fetch;
		const response = await handleGeocodeRequest(new URL('https://example.com/api/geocode?q=Berlin&lang=en&limit=9'), mockFetch);
		const requested = new URL(requestedUrl);
		expect(requested.origin + requested.pathname).toBe('https://photon.komoot.io/api');
		expect(requested.searchParams.get('countrycode')).toBe('DE');
		expect(requested.searchParams.get('limit')).toBe('5');
		expect((await response.json()).features).toHaveLength(1);
	});

	test('uses the reverse endpoint for coordinates', async () => {
		let requestedUrl = '';
		const mockFetch = (async (input: URL | RequestInfo) => {
			requestedUrl = String(input);
			return new Response(JSON.stringify({ features: [germanFeature] }), { status: 200 });
		}) as typeof fetch;
		const response = await handleGeocodeRequest(new URL('https://example.com/api/geocode?lat=52.52&lon=13.405'), mockFetch);
		const requested = new URL(requestedUrl);
		expect(requested.pathname).toBe('/reverse');
		expect(requested.searchParams.get('lat')).toBe('52.52');
		expect(requested.searchParams.get('lon')).toBe('13.405');
		expect((await response.json()).features).toHaveLength(1);
	});

	test('rejects invalid coordinates without contacting Photon', async () => {
		let called = false;
		const response = await handleGeocodeRequest(
			new URL('https://example.com/api/geocode?lat=100&lon=13'),
			(async () => { called = true; return new Response('{}'); }) as unknown as typeof fetch
		);
		expect(response.status).toBe(400);
		expect(called).toBe(false);
	});

	test('maps provider failures to a gateway error', async () => {
		const response = await handleGeocodeRequest(
			new URL('https://example.com/api/geocode?q=Berlin'),
			(async () => new Response('{}', { status: 503 })) as unknown as typeof fetch
		);
		expect(response.status).toBe(502);
	});

	test('removes non-German results from forward and reverse responses', async () => {
		const foreignFeature = { ...germanFeature, properties: { ...germanFeature.properties, country: 'France', countrycode: 'FR' } };
		const mockFetch = (async () => new Response(JSON.stringify({ features: [foreignFeature, germanFeature] }), { status: 200 })) as unknown as typeof fetch;
		const response = await handleGeocodeRequest(new URL('https://example.com/api/geocode?lat=49&lon=7'), mockFetch);
		expect((await response.json()).features).toEqual([germanFeature]);
	});
});
