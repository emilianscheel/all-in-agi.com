import type { EventAddress } from './booking';

export interface MapTilerFeature {
	id?: string;
	text?: string;
	place_name?: string;
	address?: string;
	center?: [number, number];
	geometry?: { coordinates?: unknown };
	properties?: Record<string, unknown>;
	context?: Array<Record<string, unknown>>;
}

function stringValue(value: unknown) {
	return typeof value === 'string' ? value.trim() : '';
}

function contextValue(feature: MapTilerFeature, prefixes: string[]) {
	const entry = feature.context?.find((item) => {
		const id = stringValue(item.id);
		return prefixes.some((prefix) => id.startsWith(`${prefix}.`) || id === prefix);
	});
	return stringValue(entry?.text) || stringValue(entry?.name);
}

export function normalizeMapTilerAddress(feature: MapTilerFeature): EventAddress {
	const properties = feature.properties ?? {};
	const label =
		stringValue(properties.full_address) ||
		stringValue(feature.place_name) ||
		stringValue(properties.name) ||
		stringValue(feature.text);
	const streetName = stringValue(properties.street) || stringValue(feature.text);
	const houseNumber = stringValue(properties.housenumber) || stringValue(properties.house_number) || stringValue(feature.address);
	const street = [streetName, houseNumber].filter(Boolean).join(' ') || label.split(',')[0]?.trim() || '';
	const postalCode =
		stringValue(properties.postcode) ||
		stringValue(properties.postal_code) ||
		contextValue(feature, ['postal_code', 'postcode']);
	const city =
		stringValue(properties.city) ||
		stringValue(properties.locality) ||
		contextValue(feature, ['place', 'locality', 'municipality']);
	const geometryCoordinates = Array.isArray(feature.geometry?.coordinates) ? feature.geometry?.coordinates : undefined;
	const coordinates = feature.center ?? (geometryCoordinates?.length === 2 ? geometryCoordinates as [number, number] : undefined);

	return {
		label,
		street,
		postalCode,
		city,
		country: 'Deutschland',
		longitude: typeof coordinates?.[0] === 'number' ? coordinates[0] : undefined,
		latitude: typeof coordinates?.[1] === 'number' ? coordinates[1] : undefined
	};
}

export function mapTilerFeatureLabel(feature: MapTilerFeature) {
	return stringValue(feature.properties?.full_address) || stringValue(feature.place_name) || stringValue(feature.text);
}
