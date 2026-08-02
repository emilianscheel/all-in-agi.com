import { describe, expect, test } from 'bun:test';
import { LEGAL_MODULES, legalDocumentPlainText, legalModulesForConfiguration } from './legal';

describe('versioned legal modules', () => {
	test('derives only modules actually selected in the booking', () => {
		expect(legalModulesForConfiguration({ venueProvided: false, lunch: 'pizza', deviceProvision: 'needed', toolProvision: 'existing', eventPhotos: false })).toEqual(['venue', 'catering', 'organizer_devices']);
	});

	test('renders a complete immutable source document', () => {
		const text = legalDocumentPlainText(LEGAL_MODULES.map(({ id }) => id));
		expect(text).toContain('B2B-AGB FÜR AGENTIC ENGINEERING HACKATHONS');
		expect(text).toContain('Zusatzmodul: Veranstaltergeräte');
		expect(text).toContain('Dem Kunden bleibt ausdrücklich der Nachweis gestattet');
	});
});

