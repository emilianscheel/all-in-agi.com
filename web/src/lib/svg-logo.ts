export const MAX_CLIENT_LOGO_BYTES = 100_000;

const DANGEROUS =
	/<\s*(?:script|foreignObject|iframe|embed|object|image|link|style)\b|<!DOCTYPE|<!ENTITY|<!\[CDATA\[|\bon[a-z]+\s*=|javascript:|vbscript:|expression\s*\(/i;

export function sanitizeClientLogoSvg(input: string): string | null {
	if (typeof input !== 'string') return null;
	const trimmed = input.replace(/^\uFEFF/, '').trim();
	if (!trimmed || new TextEncoder().encode(trimmed).length > MAX_CLIENT_LOGO_BYTES) return null;
	if (DANGEROUS.test(trimmed) || hasExternalReference(trimmed)) return null;
	const svg = trimmed.replace(/<\?xml[\s\S]*?\?>/gi, '').replace(/<!--[\s\S]*?-->/g, '').trim();
	if (!/^<svg\b[^>]*>[\s\S]*<\/svg>$/i.test(svg)) return null;
	if ((svg.match(/<svg\b/gi) ?? []).length !== 1) return null;
	if ((svg.match(/<\/svg>/gi) ?? []).length !== 1) return null;
	return svg;
}

function hasExternalReference(svg: string) {
	const attributes = /\b(?:href|src|xlink:href)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
	for (const match of svg.matchAll(attributes)) {
		const value = (match[1] ?? match[2] ?? '').trim();
		if (!value.startsWith('#')) return true;
	}
	return /\burl\s*\(/i.test(svg);
}
