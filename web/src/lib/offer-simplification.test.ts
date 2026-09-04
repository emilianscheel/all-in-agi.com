import { describe, expect, test } from 'bun:test';

const agbPage = await Bun.file(new URL('../routes/agb/+page.svelte', import.meta.url)).text();
const bookingPage = await Bun.file(new URL('../routes/buchen/+page.svelte', import.meta.url)).text();
const timeEditor = await Bun.file(new URL('./EventDateTimeEditor.svelte', import.meta.url)).text();
const layout = await Bun.file(new URL('../routes/+layout.svelte', import.meta.url)).text();

describe('simplified public offer', () => {
	test('uses the full AGB title and a plain module list', () => {
		expect(layout).toContain('{copy.terms}</a>');
		expect(agbPage).toContain("'Terms and Conditions' : 'Allgemeine Geschäftsbedingungen'");
		expect(agbPage).not.toContain('Transparenzhinweis');
		expect(agbPage).not.toContain('Version {');
		expect(agbPage).not.toContain('Leistungsmodule anzeigen');
		expect(agbPage).not.toContain('legal-filter-heading');
		expect(agbPage).toContain('<div class="coding-tool-list">');
		expect(agbPage).toContain('<label class="coding-tool-option">');
		expect(agbPage).not.toContain('legal-module-option');
	});

	test('omits fixed offer and removed request sections', () => {
		for (const heading of ['<h2>Veranstaltungsort</h2>', '<h2>Devices</h2>', '<h2>Mittagessen</h2>', '<h2>Eventfotos</h2>', '<h2>Rechnungsdaten</h2>', '<h2>Unternehmensanfrage</h2>']) {
			expect(bookingPage).not.toContain(heading);
		}
	});

	test('renders only selectable time-window cards', () => {
		expect(timeEditor).not.toContain('event-start-time');
		expect(timeEditor).not.toContain('event-end-time');
		expect(timeEditor).not.toContain('Alle verfügbaren Zeitfenster');
		expect(timeEditor).toContain('class="slot"');
	});
});
