import { describe, expect, test } from 'bun:test';
import { getPrice, validateConfiguration, type BookingConfiguration } from './booking';

const validConfiguration: BookingConfiguration = {
	capacity: 15,
	venueProvided: true,
	equipment: 'projector',
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
		[15, true, 3000],
		[30, true, 4500],
		[50, true, 6500],
		[15, false, 4000],
		[30, false, 5500],
		[50, false, 7500]
	] as const)('%p people, venue=%p totals %p', (capacity, venueProvided, total) => {
		expect(getPrice(capacity, venueProvided).totalPrice).toBe(total);
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
});
