import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';

export async function GET({ url, fetch }) {
	const query = url.searchParams.get('q')?.trim() ?? '';
	if (query.length < 3 || query.length > 200) return json({ message: 'Die Suchanfrage ist ungültig.' }, { status: 400 });
	if (!env.GEOCODING_API_URL) return json({ message: 'Die Adresssuche ist nicht konfiguriert. Bitte geben Sie die Adresse manuell ein.' }, { status: 503 });
	let endpoint: URL;
	try {
		endpoint = new URL(env.GEOCODING_API_URL);
		if (endpoint.protocol !== 'https:') throw new Error('HTTPS required');
	} catch {
		return json({ message: 'Die Adresssuche ist nicht korrekt konfiguriert.' }, { status: 503 });
	}
	endpoint.searchParams.set('q', query);
	endpoint.searchParams.set('countrycode', 'DE');
	endpoint.searchParams.set('lang', 'de');
	endpoint.searchParams.set('limit', '5');
	try {
		const response = await fetch(endpoint, { headers: { accept: 'application/geo+json, application/json' } });
		if (!response.ok) return json({ message: 'Die Adresssuche ist derzeit nicht verfügbar.' }, { status: 502 });
		const body = await response.json();
		return json(body, { headers: { 'cache-control': 'private, max-age=60' } });
	} catch {
		return json({ message: 'Die Adresssuche ist derzeit nicht verfügbar.' }, { status: 502 });
	}
}

