import { describe, expect, test } from 'bun:test';
import { _llmsContent } from '../routes/llms.txt/+server';

describe('localized /llms.txt', () => {
	test('provides German and English machine-readable summaries', () => {
		const de = _llmsContent.de('de');
		const en = _llmsContent.en('en');
		for (const content of [de, en]) {
			expect(content).toMatch(/^# ALL IN AGI\n\n> \S.+\n/);
			expect(content).toContain('go@all-in-agi.com');
			expect(content).toContain('+49 152 57257750');
		}
		expect(de).toContain('https://all-in-agi.com/de/go');
		expect(en).toContain('https://all-in-agi.com/en/go');
		expect(en).toContain('Plan a hackathon');
	});
});
