import { env } from '$env/dynamic/private';
import { handleGeocodeRequest } from '$lib/server/photon-geocoding';

export async function GET({ url, fetch }) {
	return handleGeocodeRequest(url, fetch, env.GEOCODING_API_URL);
}
