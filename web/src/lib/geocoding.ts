import type { EventAddress } from './booking';
import { normalizePhotonAddress, type PhotonFeature } from './photon';
import type { Locale } from './i18n';

export interface LocationCoordinates {
	latitude: number;
	longitude: number;
}

export function addressAtCoordinates({ latitude, longitude }: LocationCoordinates): EventAddress {
	return {
		label: '',
		street: '',
		postalCode: '',
		city: '',
		country: 'Deutschland',
		latitude,
		longitude
	};
}

export async function fetchAddressSuggestions(
	requestFetch: typeof fetch,
	query: string,
	locale: Locale,
	signal?: AbortSignal
) {
	const params = new URLSearchParams({ q: query, countrycode: 'DE', lang: locale, limit: '5' });
	const response = await requestFetch(`/api/geocode?${params}`, { signal });
	if (!response.ok) throw new Error(locale === 'en' ? 'Address search is unavailable.' : 'Adresssuche nicht verfügbar.');
	const result = await response.json() as { features?: PhotonFeature[] };
	return result.features ?? [];
}

export async function reverseGeocode(
	requestFetch: typeof fetch,
	coordinates: LocationCoordinates,
	locale: Locale,
	signal?: AbortSignal
) {
	const params = new URLSearchParams({
		lat: String(coordinates.latitude),
		lon: String(coordinates.longitude),
		lang: locale
	});
	const response = await requestFetch(`/api/geocode?${params}`, { signal });
	if (!response.ok) throw new Error(locale === 'en' ? 'The address could not be determined.' : 'Die Adresse konnte nicht ermittelt werden.');
	const result = await response.json() as { features?: PhotonFeature[] };
	const feature = result.features?.[0];
	return feature ? normalizePhotonAddress(feature) : null;
}
