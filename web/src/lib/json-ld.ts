export function serializeJsonLd(data: unknown) {
	const json = JSON.stringify(data);
	if (json === undefined) throw new TypeError('JSON-LD data must be serializable');

	return json
		.replaceAll('&', '\\u0026')
		.replaceAll('<', '\\u003c')
		.replaceAll('>', '\\u003e')
		.replaceAll('\u2028', '\\u2028')
		.replaceAll('\u2029', '\\u2029');
}

export function jsonLdScript(data: unknown) {
	return `<script type="application/ld+json">${serializeJsonLd(data)}</script>`;
}
