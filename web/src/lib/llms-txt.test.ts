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

	test('documents every capacity price and configurable tool adjustment', () => {
		for (const detail of [
			'bis zu 15 Personen für 4.000 € netto',
			'bis zu 30 Personen für 5.000 € netto',
			'bis zu 50 Personen für 6.000 € netto',
			'500 €, 1.000 € oder 1.500 € netto zusätzlich',
			'Pizza-Lunch',
			'geeignete Arbeitsgeräte'
		]) {
			expect(content).toContain(detail);
		}
	});

	test('documents request-only formats without implying standard pricing', () => {
		for (const detail of [
			'mehr als 50 Teilnehmenden',
			'bis zu 100 Personen',
			'Vollständig online durchgeführte Hackathons über Microsoft Teams',
			'internationale Formate',
			'Match-making mit automatischer Teamzusammenstellung',
			'Umfang, Ablauf, Verfügbarkeit und Preis werden individuell angefragt und vereinbart'
		]) {
			expect(content).toContain(detail);
		}
	});

	test('provides safe, direct booking guidance for agents', () => {
		expect(content).toContain('](https://all-in-agi.com/buchen)');
		expect(content).toContain('](https://cal.com/emilian.scheel/hackathon-vorbereitung)');
		expect(content).toContain('ausdrücklich zustimmt');
		expect(content).toContain('authentifizierten Zugriff auf die Cal.com API');
		expect(content).toContain('mailto:go@all-in-agi.com');
		expect(content).toContain('tel:+4915257257750');
		expect(content).toContain('Für mehr als 50 Teilnehmende, einen Online- oder internationalen Hackathon');
	});

	test('lists canonical resources in the dedicated information section', () => {
		const resources = content.split('## Weiterführende Informationen\n\n')[1];
		expect(resources).toBeDefined();

		for (const line of resources!.trim().split('\n')) {
			expect(line).toMatch(/^- \[[^\]]+\]\((?:https:|mailto:|tel:)[^)]+\): .+$/);
		}
	});
});
