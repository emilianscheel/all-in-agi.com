import { isSharedPlan, toSharedPlanV2, type SharedPlan } from '$lib/shared-plan';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const MAX_PAYLOAD_BYTES = 8_000;

function base64Url(bytes: Uint8Array) {
	return Buffer.from(bytes).toString('base64url');
}

function fromBase64Url(value: string) {
	return new Uint8Array(Buffer.from(value, 'base64url'));
}

function planSecret(override?: string) {
	const secret = override ?? process.env.PLAN_URL_SECRET ?? (process.env.NODE_ENV !== 'production' ? 'all-in-agi-local-development-plan-secret' : '');
	if (!secret) throw new Error('PLAN_URL_SECRET fehlt.');
	if (process.env.NODE_ENV === 'production' && secret.length < 32) throw new Error('PLAN_URL_SECRET muss mindestens 32 Zeichen lang sein.');
	return secret;
}

async function encryptionKey(secretOverride?: string) {
	const secret = planSecret(secretOverride);
	const digest = await crypto.subtle.digest('SHA-256', encoder.encode(secret));
	return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptPlan(plan: SharedPlan, secretOverride?: string) {
	if (!isSharedPlan(plan)) throw new Error('Ungültige Plandaten.');
	const payload = encoder.encode(JSON.stringify(plan));
	if (payload.byteLength > MAX_PAYLOAD_BYTES) throw new Error('Der Plan ist zu umfangreich.');
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await encryptionKey(secretOverride), payload));
	return `${base64Url(iv)}.${base64Url(ciphertext)}`;
}

export async function decryptPlan(token: string, secretOverride?: string) {
	const [ivPart, cipherPart, extra] = token.split('.');
	if (!ivPart || !cipherPart || extra || token.length > 12_000) throw new Error('Ungültiger Plan-Link.');
	try {
		const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64Url(ivPart) }, await encryptionKey(secretOverride), fromBase64Url(cipherPart));
		const plan = JSON.parse(decoder.decode(plaintext));
		if (!isSharedPlan(plan)) throw new Error('Ungültiger Plan-Link.');
		return toSharedPlanV2(plan);
	} catch {
		throw new Error('Ungültiger Plan-Link.');
	}
}
