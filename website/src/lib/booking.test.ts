import { describe, expect, test } from 'bun:test';
import { getPrice, validateConfiguration, type BookingConfiguration } from './booking';

const validConfiguration: BookingConfiguration = {
	capacity: 15,
	venueProvided: true,
	equipment: 'projector',
	lunch: 'pizza',
	customLunch: '',
	companyName: 'Musterwerke GmbH',
	contactName: 'Ada Beispiel',
	email: 'ada@example.com',
	phone: '+49 30 123456',
	address: {
		label: 'Musterstraße 1, 10115 Berlin',
		street: 'Musterstraße 1',
		postalCode: '10115',
		city: 'Berlin',
		country: 'Deutschland'
	},
	preferredEventDate: '2099-06-20',
	consultationSlot: '2099-05-10T10:00:00.000Z'
};

describe('price calculation', () => {
	test.each([
		[15, true, 'pizza', 3000],
		[15, true, 'custom', 3500],
		[15, true, 'none', 2500],
		[30, false, 'pizza', 5500],
		[30, false, 'custom', 6000],
		[30, false, 'none', 5000],
		[50, true, 'pizza', 6500],
		[50, true, 'custom', 7000],
		[50, true, 'none', 6000]
	] as const)('%p people, venue=%p, lunch=%p totals %p', (capacity, venueProvided, lunch, total) => {
		expect(getPrice(capacity, venueProvided, lunch).totalPrice).toBe(total);
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
			preferredEventDate: '2020-01-01',
			consultationSlot: ''
		});
		expect(errors).toHaveLength(7);
	});

	test('requires a description only for custom lunch', () => {
		expect(validateConfiguration({ ...validConfiguration, lunch: 'custom', customLunch: '' })).toContain('Bitte beschreiben Sie Ihren Catering-Wunsch.');
		expect(validateConfiguration({ ...validConfiguration, lunch: 'custom', customLunch: 'Vegetarische Bowls' })).toEqual([]);
		expect(validateConfiguration({ ...validConfiguration, lunch: 'none', customLunch: 'ignored' })).toEqual([]);
	});
});
