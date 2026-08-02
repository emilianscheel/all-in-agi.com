import { describe, expect, test } from 'bun:test';

const llmsFile = Bun.file(new URL('../../static/llms.txt', import.meta.url));
const content = await llmsFile.text();

describe('/llms.txt', () => {
	test('uses the llms.txt title and summary structure', () => {
		expect(content).toMatch(/^# ALL IN AGI\n\n> \S.+\n/);
		expect(content.match(/^# /gm)).toHaveLength(1);
	});

	test('identifies the organizers and public contact details', () => {
		expect(content).toContain('Emilian Scheel und Maddox Sciuchetti');
		expect(content).toContain('go@all-in-agi.com');
		expect(content).toContain('+49 152 57257750');
		expect(content).toContain('Moosdorfstraße 10, 12435 Berlin');
	});

	test('documents every capacity price and configurable adjustment', () => {
		for (const detail of [
			'Bis zu 15 Personen: 4.000 € netto',
			'Bis zu 30 Personen: 5.000 € netto',
			'Bis zu 50 Personen: 6.000 € netto',
			'+500 € für bis zu 15 Personen',
			'+1.000 € für bis zu 30 Personen',
			'+1.500 € für bis zu 50 Personen',
			'+150 € netto pro Gerät',
			'−500 € netto'
		]) {
			expect(content).toContain(detail);
		}
	});

	test('links only to canonical public resources in its link sections', () => {
		for (const url of [
			'https://all-in-agi.com/',
			'https://all-in-agi.com/buchen',
			'https://all-in-agi.com/verwalten',
			'https://all-in-agi.com/impressum',
			'https://all-in-agi.com/datenschutz'
		]) {
			expect(content).toContain(`](${url})`);
		}

		const linkSections = content.split(/^## /m).slice(1);
		expect(linkSections.length).toBeGreaterThan(0);
		for (const section of linkSections) {
			const [, ...body] = section.trim().split('\n');
			for (const line of body.filter(Boolean)) {
				expect(line).toMatch(/^- \[[^\]]+\]\(https:\/\/[^)]+\): .+$/);
			}
		}
	});
});
