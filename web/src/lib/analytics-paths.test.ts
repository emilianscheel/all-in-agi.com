import { describe, expect, test } from 'bun:test';
import { isAnalyticsPath, sanitizeAnalyticsPath } from './analytics-paths';

describe('analytics route privacy', () => {
	test('excludes bearer and private routes', () => {
		expect(isAnalyticsPath('/buchen/secret-plan-token')).toBe(false);
		expect(isAnalyticsPath('/HAA-ABC-123')).toBe(false);
		expect(isAnalyticsPath('/dashboard')).toBe(false);
		expect(isAnalyticsPath('/verwalten')).toBe(false);
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
});
