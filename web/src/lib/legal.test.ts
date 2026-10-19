import { describe, expect, test } from 'bun:test';
import { LEGAL_DOCUMENT_VERSION, LEGAL_MODULES, isStandardOfferLegalVersion, legalDocumentPlainText, legalModulesForConfiguration } from './legal';

describe('versioned legal modules', () => {
	test('derives only modules actually selected in the booking', () => {
		expect(legalModulesForConfiguration({ venueProvided: false, lunch: 'custom', deviceProvision: 'needed', toolProvision: 'existing', eventPhotos: false })).toEqual(['catering']);
		expect(legalModulesForConfiguration({ venueProvided: true, lunch: 'pizza', deviceProvision: 'existing', toolProvision: 'needed', eventPhotos: true })).toEqual(['catering', 'tool_accounts', 'event_photos']);
	});

	test('renders a complete immutable source document', () => {
		const text = legalDocumentPlainText(LEGAL_MODULES.map(({ id }) => id));
		expect(text).toContain('ALLGEMEINE GESCHÄFTSBEDINGUNGEN FÜR AGENTIC ENGINEERING HACKATHONS');
		expect(text).toContain('Pizza-Catering');
		expect(text).not.toContain('Zusatzmodul:');
		expect(text).not.toContain('Veranstaltergeräte');
		expect(text).toContain('Dem Kunden bleibt ausdrücklich der Nachweis gestattet');
		expect(text).toContain(`Version ${LEGAL_DOCUMENT_VERSION}`);
		expect(text).toContain('Zahlungsziel von 14 Kalendertagen');
		expect(text).not.toContain('sieben Kalendertagen');
		expect(legalDocumentPlainText(undefined, 'en')).toContain('14 calendar days for payment');
		expect(isStandardOfferLegalVersion(LEGAL_DOCUMENT_VERSION)).toBe(true);
		expect(isStandardOfferLegalVersion('2026-08-02.2')).toBe(true);
		expect(isStandardOfferLegalVersion('2026-01-01.1')).toBe(false);
	});
});
