import { describe, expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { jsonLdScript, serializeJsonLd } from './json-ld';

describe('JSON-LD rendering', () => {
	test('serializes data as valid JSON without changing its value', () => {
		const data = {
			'@context': 'https://schema.org',
			'@type': 'Service',
			name: 'Agentic Engineering Hackathon',
			audience: { '@type': 'BusinessAudience', audienceType: 'Engineering & Product' }
		};

		const serialized = serializeJsonLd(data);
		expect(JSON.parse(serialized)).toEqual(data);
	});

	test('prevents data from ending the script element or creating HTML markup', () => {
		const dangerous = {
			value: '</script><script>alert("xss")</script> & < >\u2028\u2029'
		};

		const serialized = serializeJsonLd(dangerous);
		expect(JSON.parse(serialized)).toEqual(dangerous);
		expect(serialized).not.toContain('<');
		expect(serialized).not.toContain('>');
		expect(serialized).not.toContain('&');
		expect(serialized).not.toContain('\u2028');
		expect(serialized).not.toContain('\u2029');

		const markup = jsonLdScript(dangerous);
		expect(markup.match(/<script/g)).toHaveLength(1);
		expect(markup.match(/<\/script>/g)).toHaveLength(1);
		const json = markup.match(/^<script type="application\/ld\+json">(.+)<\/script>$/)?.[1];
		expect(json).toBeDefined();
		expect(JSON.parse(json!)).toEqual(dangerous);
	});

	test('both structured-data consumers use the shared renderer', async () => {
		const homepage = await readFile(
			fileURLToPath(new URL('../routes/+page.svelte', import.meta.url)),
			'utf8'
		);
		const landingPage = await readFile(
			fileURLToPath(new URL('./GtmLandingPage.svelte', import.meta.url)),
			'utf8'
		);

		for (const source of [homepage, landingPage]) {
			expect(source).toContain('<JsonLd data={schema} />');
			expect(source).not.toContain('{JSON.stringify(schema)}');
		}
	});
});
