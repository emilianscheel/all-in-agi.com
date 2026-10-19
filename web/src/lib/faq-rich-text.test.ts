import { describe, expect, test } from 'bun:test';
import { linkifyFaqAnswer } from './faq-rich-text';

describe('linkifyFaqAnswer', () => {
	test('escapes HTML before linking', () => {
		expect(linkifyFaqAnswer('<script>alert(1)</script>')).toBe(
			'&lt;script&gt;alert(1)&lt;/script&gt;'
		);
	});

	test('linkifies emails and phone numbers', () => {
		const html = linkifyFaqAnswer(
			'Contact go@all-in-agi.com or call +49 152 57257750.'
		);
		expect(html).toContain('href="mailto:go@all-in-agi.com"');
		expect(html).toContain('target="_blank"');
		expect(html).toContain('>go@all-in-agi.com</a>');
		expect(html).toContain('href="tel:+4915257257750"');
		expect(html).toContain('>+49 152 57257750</a>');
	});

	test('linkifies bare URLs and markdown links', () => {
		const bare = linkifyFaqAnswer('See https://all-in-agi.com/en/go for booking.');
		expect(bare).toContain('href="https://all-in-agi.com/en/go"');
		expect(bare).toContain('target="_blank"');
		const md = linkifyFaqAnswer('See [booking page](https://all-in-agi.com/en/go).');
		expect(md).toContain('>booking page</a>');
		expect(md).toContain('href="https://all-in-agi.com/en/go"');
		expect(md).toContain('target="_blank"');
	});
});
