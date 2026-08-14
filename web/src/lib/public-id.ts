export const PUBLIC_ID_PATTERN = /^[A-Z][A-Z0-9]{2}-[A-Z0-9]{3}-[A-Z0-9]{3}$/;
export const HACKATHON_ID_PREFIX = 'H';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function secureRandomIndex(length: number) {
	const range = 2 ** 32;
	const unbiasedLimit = range - (range % length);
	let value: number;
	do {
		value = crypto.getRandomValues(new Uint32Array(1))[0];
	} while (value >= unbiasedLimit);
	return value % length;
}

export function generatePublicId(prefix: string, randomIndex = secureRandomIndex) {
	if (!/^[A-Z]$/.test(prefix)) throw new Error('Der ID-Präfix muss ein einzelner Großbuchstabe sein.');
	const suffix = Array.from({ length: 8 }, () => ALPHABET[randomIndex(ALPHABET.length)]).join('');
	const compact = `${prefix}${suffix}`;
	return `${compact.slice(0, 3)}-${compact.slice(3, 6)}-${compact.slice(6, 9)}`;
}

export function isPublicId(value: string) {
	return PUBLIC_ID_PATTERN.test(value);
}

export function isHackathonId(value: string) {
	return value.startsWith(HACKATHON_ID_PREFIX) && isPublicId(value);
}

export async function generateUniquePublicId(
	prefix: string,
	exists: (id: string) => boolean | Promise<boolean>,
	generate = generatePublicId,
	maxAttempts = 10
) {
	for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
		const id = generate(prefix);
		if (!(await exists(id))) return id;
	}
	throw new Error('Es konnte keine eindeutige öffentliche ID erzeugt werden.');
}
