import { describe, expect, test } from 'bun:test';
import { analyticsPageLocation, isAnalyticsPath, sanitizeAnalyticsPath } from './analytics-paths';

describe('analytics route privacy', () => {
	test('excludes bearer and private routes', () => {
		expect(isAnalyticsPath('/buchen/secret-plan-token')).toBe(false);
		expect(isAnalyticsPath('/HAA-ABC-123')).toBe(false);
		expect(isAnalyticsPath('/dashboard')).toBe(false);
		expect(isAnalyticsPath('/verwalten')).toBe(false);
		expect(isAnalyticsPath('/slides')).toBe(false);
		expect(isAnalyticsPath('/en/go/secret-plan-token')).toBe(false);
		expect(isAnalyticsPath('/de/HAA-ABC-123')).toBe(false);
	});

	test('retains safe public paths and masks dynamic ones', () => {
		expect(isAnalyticsPath('/buchen/erfolg')).toBe(true);
		expect(sanitizeAnalyticsPath('/buchen/secret-plan-token')).toBe('/go/:plan');
		expect(sanitizeAnalyticsPath('/HAA-ABC-123')).toBe('/:booking');
		expect(sanitizeAnalyticsPath('/ki-hackathon-ruhrgebiet')).toBe('/ki-hackathon-ruhrgebiet');
		expect(sanitizeAnalyticsPath('/en/go/secret-plan-token')).toBe('/en/go/:plan');
	});

	test('keeps flyer campaign fields and drops unrelated query data', () => {
		expect(analyticsPageLocation('https://all-in-agi.com', '/de', '?utm_source=flyer&utm_medium=offline&utm_campaign=berlin_2026&utm_content=seite_a&email=person%40example.com'))
			.toBe('https://all-in-agi.com/de?utm_source=flyer&utm_medium=offline&utm_campaign=berlin_2026&utm_content=seite_a');
		expect(analyticsPageLocation('https://all-in-agi.com', '/de/go', '?utm_campaign=berlin_2026&token=secret'))
			.toBe('https://all-in-agi.com/de/go?utm_campaign=berlin_2026');
	});
});
