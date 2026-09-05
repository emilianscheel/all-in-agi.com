import type { EventAddress } from './booking';

export interface PhotonFeature {
	type?: string;
	geometry?: { type?: string; coordinates?: unknown };
	properties?: Record<string, unknown> & {
		name?: string;
		street?: string;
		housenumber?: string;
		postcode?: string;
		city?: string;
		town?: string;
		village?: string;
		district?: string;
		country?: string;
		countrycode?: string;
	};
}

function stringValue(value: unknown) {
	return typeof value === 'string' ? value.trim() : '';
}

export function normalizePhotonAddress(feature: PhotonFeature): EventAddress {
	const properties = feature.properties ?? {};
	const name = stringValue(properties.name);
	const streetName = stringValue(properties.street) || name;
	const houseNumber = stringValue(properties.housenumber);
	const street = [streetName, houseNumber].filter(Boolean).join(' ');
	const postalCode = stringValue(properties.postcode);
	const city =
		stringValue(properties.city) ||
		stringValue(properties.town) ||
		stringValue(properties.village) ||
		stringValue(properties.district);
	const country = stringValue(properties.country) || 'Deutschland';
	const geometryCoordinates = Array.isArray(feature.geometry?.coordinates)
		? feature.geometry.coordinates
		: undefined;
	const longitude = typeof geometryCoordinates?.[0] === 'number' ? geometryCoordinates[0] : undefined;
	const latitude = typeof geometryCoordinates?.[1] === 'number' ? geometryCoordinates[1] : undefined;
	const label = [street || name, [postalCode, city].filter(Boolean).join(' '), country]
		.filter(Boolean)
		.join(', ');

	return {
		label,
		street,
		postalCode,
		city,
		country: 'Deutschland',
		longitude,
		latitude
	};
}

export function photonFeatureLabel(feature: PhotonFeature) {
	return normalizePhotonAddress(feature).label;
}
