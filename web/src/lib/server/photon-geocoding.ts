import { json } from '@sveltejs/kit';
import type { PhotonFeature } from '$lib/photon';

const PUBLIC_PHOTON_URL = 'https://photon.komoot.io/api';

function photonEndpoint(configuredUrl: string | undefined, mode: 'search' | 'reverse') {
	const endpoint = new URL(configuredUrl || PUBLIC_PHOTON_URL);
	if (endpoint.protocol !== 'https:') throw new Error('HTTPS required');
	if (mode === 'reverse') {
		const parts = endpoint.pathname.split('/').filter(Boolean);
		if (parts.at(-1) === 'api' || parts.at(-1) === 'reverse') parts[parts.length - 1] = 'reverse';
		else parts.push('reverse');
		endpoint.pathname = `/${parts.join('/')}`;
	} else if (!endpoint.pathname.split('/').filter(Boolean).length) {
		endpoint.pathname = '/api';
	}
	return endpoint;
}

function isGermanFeature(feature: PhotonFeature) {
	const countryCode = typeof feature.properties?.countrycode === 'string'
		? feature.properties.countrycode.toUpperCase()
		: '';
	return countryCode === 'DE';
}

export async function handleGeocodeRequest(url: URL, requestFetch: typeof fetch, configuredUrl?: string) {
	const query = url.searchParams.get('q')?.trim() ?? '';
	const latitudeValue = url.searchParams.get('lat');
	const longitudeValue = url.searchParams.get('lon');
	const hasCoordinates = latitudeValue !== null || longitudeValue !== null;
	const locale = url.searchParams.get('lang') === 'en' ? 'en' : 'de';

	if (query && hasCoordinates) return json({ message: 'Suchtext und Koordinaten dürfen nicht kombiniert werden.' }, { status: 400 });
	if (!query && !hasCoordinates) return json({ message: 'Suchtext oder Koordinaten fehlen.' }, { status: 400 });
	if (query && (query.length < 3 || query.length > 200)) return json({ message: 'Die Suchanfrage ist ungültig.' }, { status: 400 });

	const latitude = Number(latitudeValue);
	const longitude = Number(longitudeValue);
	if (hasCoordinates && (
		latitudeValue === null || longitudeValue === null || !Number.isFinite(latitude) || !Number.isFinite(longitude)
		|| latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180
	)) return json({ message: 'Die Koordinaten sind ungültig.' }, { status: 400 });

	let endpoint: URL;
	try {
		endpoint = photonEndpoint(configuredUrl, hasCoordinates ? 'reverse' : 'search');
	} catch {
		return json({ message: 'Die Adresssuche ist nicht korrekt konfiguriert.' }, { status: 503 });
	}

	if (hasCoordinates) {
		endpoint.searchParams.set('lat', String(latitude));
		endpoint.searchParams.set('lon', String(longitude));
		endpoint.searchParams.set('limit', '1');
	} else {
		endpoint.searchParams.set('q', query);
		endpoint.searchParams.set('countrycode', 'DE');
		endpoint.searchParams.set('limit', String(Math.min(5, Math.max(1, Number(url.searchParams.get('limit')) || 5))));
	}
	endpoint.searchParams.set('lang', locale);

	try {
		const response = await requestFetch(endpoint, {
			headers: {
				accept: 'application/geo+json, application/json',
				'accept-language': locale,
				'user-agent': 'all-in-agi.com address search'
			}
		});
		if (!response.ok) return json({ message: 'Die Adresssuche ist derzeit nicht verfügbar.' }, { status: 502 });
		const body = await response.json() as { features?: PhotonFeature[] };
		return json({ ...body, features: (body.features ?? []).filter(isGermanFeature) }, {
			headers: { 'cache-control': hasCoordinates ? 'private, max-age=300' : 'private, max-age=60' }
		});
	} catch {
		return json({ message: 'Die Adresssuche ist derzeit nicht verfügbar.' }, { status: 502 });
	}
}
