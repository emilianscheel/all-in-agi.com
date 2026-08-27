const encoder = new TextEncoder();
export const OFFER_ACCESS_COOKIE = 'all-in-agi-offer-access';

function secret() {
	const value = process.env.OFFER_ACCESS_SECRET ?? process.env.PLAN_URL_SECRET ?? (process.env.NODE_ENV !== 'production' ? 'all-in-agi-local-development-offer-access-secret' : '');
	if (!value) throw new Error('OFFER_ACCESS_SECRET oder PLAN_URL_SECRET fehlt.');
	if (process.env.NODE_ENV === 'production' && value.length < 32) throw new Error('OFFER_ACCESS_SECRET muss mindestens 32 Zeichen lang sein.');
	return value;
}

function base64Url(bytes: Uint8Array) {
	return Buffer.from(bytes).toString('base64url');
}

async function signature() {
	const key = await crypto.subtle.importKey('raw', encoder.encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
	return base64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode('all-in-agi-offer-access-v1'))));
}

function sameValue(a: string, b: string) {
	if (a.length !== b.length) return false;
	let difference = 0;
	for (let index = 0; index < a.length; index += 1) difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
	return difference === 0;
}

export function correctOfferPassword(value: unknown) {
	return typeof value === 'string' && sameValue(value, process.env.OFFER_PASSWORD ?? 'offer');
}

export async function offerAccessValue() {
	return `v1.${await signature()}`;
}

export async function hasOfferAccess(value: string | undefined) {
	if (!value?.startsWith('v1.')) return false;
	return sameValue(value, await offerAccessValue());
}
