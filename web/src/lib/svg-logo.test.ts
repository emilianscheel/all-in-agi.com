import { describe, expect, test } from 'bun:test';
import { sanitizeClientLogoSvg } from './svg-logo';

const logo = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><path d="M0 0h100v40H0z"/></svg>';

describe('client logo SVG', () => {
	test('keeps a plain svg document and its namespace', () => {
		expect(sanitizeClientLogoSvg(`<?xml version="1.0"?>\n${logo}`)).toBe(logo);
	});

	test('rejects active content, embedded documents, and external references', () => {
		expect(sanitizeClientLogoSvg(logo.replace('<path', '<script></script><path'))).toBeNull();
		expect(sanitizeClientLogoSvg(logo.replace('<path', '<foreignObject></foreignObject><path'))).toBeNull();
		expect(sanitizeClientLogoSvg(logo.replace('<path', '<path onclick="alert(1)"'))).toBeNull();
		expect(sanitizeClientLogoSvg(logo.replace('<path', '<image href="https://example.com/a.png"></image><path'))).toBeNull();
		expect(sanitizeClientLogoSvg(logo.replace('<path', '<use href="https://example.com/sprite.svg#a"></use><path'))).toBeNull();
		expect(sanitizeClientLogoSvg('<div></div>')).toBeNull();
		expect(sanitizeClientLogoSvg(`${logo}${'x'.repeat(100_001)}`)).toBeNull();
	});
});
