import { describe, expect, test } from 'bun:test';
import { bookingMetadata, getPrice, validateConfiguration, type BookingConfiguration } from './booking';

const validConfiguration: BookingConfiguration = {
	capacity: 15,
	venueProvided: true,
	equipment: 'projector',
	lunch: 'pizza',
	customLunch: '',
	toolProvision: 'existing',
	codingTools: ['codex'],
	customCodingTool: '',
	companyName: 'Musterwerke GmbH',
	contactName: 'Ada Beispiel',
	email: 'ada@example.com',
	phone: '+49 30 123456',
	message: '',
	address: {
		label: 'Musterstraße 1, 10115 Berlin',
		street: 'Musterstraße 1',
		postalCode: '10115',
		city: 'Berlin',
		country: 'Deutschland'
	},
	eventStart: '2099-06-20T07:00:00.000Z',
	eventEnd: '2099-06-20T15:00:00.000Z',
	consultationSlot: '2099-05-10T10:00:00.000Z'
};

describe('price calculation', () => {
	test.each([
		[15, true, 'pizza', 4000],
		[15, true, 'custom', 4500],
		[15, true, 'none', 3500],
		[15, true, 'self-organized', 3500],
		[30, false, 'pizza', 6000],
		[30, false, 'custom', 6500],
		[30, false, 'none', 5500],
		[50, true, 'pizza', 6000],
		[50, true, 'custom', 6500],
		[50, true, 'none', 5500]
	] as const)('%p people, venue=%p, lunch=%p totals %p', (capacity, venueProvided, lunch, total) => {
		expect(getPrice(capacity, venueProvided, lunch).totalPrice).toBe(total);
	});

	test('adds the tool surcharge only when tools are needed', () => {
		expect(getPrice(15, true, 'self-organized', 'needed')).toMatchObject({ lunchAdjustment: -500, toolsAdjustment: 500, totalPrice: 4000 });
		expect(getPrice(15, true, 'pizza', 'existing')).toMatchObject({ toolsAdjustment: 0, totalPrice: 4000 });
	});
});

describe('booking validation', () => {
	test('accepts a complete future configuration', () => {
		expect(validateConfiguration(validConfiguration)).toEqual([]);
	});

	test('rejects missing contact, address, date, and slot data', () => {
		const errors = validateConfiguration({
			...validConfiguration,
			companyName: '',
			contactName: '',
			email: 'invalid',
			phone: '12',
			address: { ...validConfiguration.address, street: '', city: '' },
			eventStart: '2020-01-01T08:00:00.000Z',
			eventEnd: '2020-01-01T16:00:00.000Z',
			consultationSlot: ''
		});
		expect(errors).toHaveLength(7);
	});

	test('requires a description only for custom lunch', () => {
		expect(validateConfiguration({ ...validConfiguration, lunch: 'custom', customLunch: '' })).toContain('Bitte beschreiben Sie Ihren Catering-Wunsch.');
		expect(validateConfiguration({ ...validConfiguration, lunch: 'custom', customLunch: 'Vegetarische Bowls' })).toEqual([]);
		expect(validateConfiguration({ ...validConfiguration, lunch: 'none', customLunch: 'ignored' })).toEqual([]);
	});

	test('accepts an optional message up to 500 characters', () => {
		expect(validateConfiguration({ ...validConfiguration, message: 'x'.repeat(500) })).toEqual([]);
		expect(validateConfiguration({ ...validConfiguration, message: 'x'.repeat(501) })).toContain('Ihre Nachricht darf maximal 500 Zeichen lang sein.');
	});

	test('requires a tool mode and at least one valid tool', () => {
		expect(validateConfiguration({ ...validConfiguration, toolProvision: null })).toContain('Bitte wählen Sie aus, ob Coding Tools vorhanden sind.');
		expect(validateConfiguration({ ...validConfiguration, codingTools: [] })).toContain('Bitte wählen Sie mindestens ein Coding Tool.');
		expect(validateConfiguration({ ...validConfiguration, codingTools: ['custom'], customCodingTool: '' })).toContain('Bitte geben Sie das individuelle Coding Tool an.');
		expect(validateConfiguration({ ...validConfiguration, codingTools: ['codex', 'custom'], customCodingTool: 'Internes Tool' })).toEqual([]);
		expect(validateConfiguration({ ...validConfiguration, toolProvision: 'needed', codingTools: ['devin'] })).toContain('Für den Tag können nur Codex, Cursor oder Claude Code bereitgestellt werden.');
		expect(validateConfiguration({ ...validConfiguration, toolProvision: 'needed', codingTools: ['codex', 'cursor', 'claude-code'] })).toEqual([]);
	});
});

describe('booking metadata', () => {
	test('includes normalized coding tools and the tools surcharge in the total', () => {
		const metadata = bookingMetadata({
			...validConfiguration,
			toolProvision: 'needed',
			codingTools: ['codex', 'custom'],
			customCodingTool: 'Internes Tool'
		});
		expect(metadata).toMatchObject({
			toolProvision: 'needed',
			codingTools: 'Codex, Internes Tool',
			customCodingTool: 'Internes Tool',
			message: '',
			totalPrice: '4500'
		});
	});

	test('includes the customer message in Cal.com metadata', () => {
		expect(bookingMetadata({ ...validConfiguration, message: 'Bitte vegetarisch.' }).message).toBe('Bitte vegetarisch.');
	});
});
