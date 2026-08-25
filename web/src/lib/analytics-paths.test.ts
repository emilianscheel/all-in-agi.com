import { describe, expect, test } from 'bun:test';
import { isAnalyticsPath, sanitizeAnalyticsPath } from './analytics-paths';

describe('analytics route privacy', () => {
	test('excludes bearer and private routes', () => {
		expect(isAnalyticsPath('/buchen/secret-plan-token')).toBe(false);
		expect(isAnalyticsPath('/HAA-ABC-123')).toBe(false);
		expect(isAnalyticsPath('/dashboard')).toBe(false);
		expect(isAnalyticsPath('/verwalten')).toBe(false);
	});

	test('retains safe public paths and masks dynamic ones', () => {
		expect(isAnalyticsPath('/buchen/erfolg')).toBe(true);
		expect(sanitizeAnalyticsPath('/buchen/secret-plan-token')).toBe('/buchen/:plan');
		expect(sanitizeAnalyticsPath('/HAA-ABC-123')).toBe('/:booking');
		expect(sanitizeAnalyticsPath('/ki-hackathon-ruhrgebiet')).toBe('/ki-hackathon-ruhrgebiet');
	});
});
