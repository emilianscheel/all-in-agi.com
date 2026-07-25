import { describe, expect, test } from 'bun:test';
import type { BookingConfiguration } from './booking';
import { bookingOverviewRows } from './booking-overview';

const config: BookingConfiguration = {
	capacity: 30,
	venueProvided: false,
	equipment: 'none',
	lunch: 'custom',
	customLunch: 'Vegetarische Bowls',
	toolProvision: 'needed',
	codingTools: ['codex'],
	customCodingTool: '',
	companyName: 'Musterwerke GmbH',
	contactName: 'Ada Beispiel',
	email: 'ada@example.com',
	phone: '+49 30 123456',
	message: '',
	address: {
		label: 'Musterstraße 1, Berlin',
		street: 'Musterstraße 1',
		postalCode: '10115',
		city: 'Berlin',
		country: 'Deutschland'
	},
	preferredEventDate: '2099-06-20',
	consultationSlot: '2099-05-10T10:00:00.000Z'
};

describe('booking overview rows', () => {
	test('formats the selected options and confirmed prep-call time', () => {
		const rows = bookingOverviewRows(config, {
			start: '2099-05-10T12:00:00.000Z',
			end: '2099-05-10T13:00:00.000Z'
		});
		expect(rows.map(({ label }) => label)).toEqual([
			'Team',
			'Location',
			'Coding Tools',
			'Demo Setup',
			'Event Date',
			'Prep Call',
			'Lunch',
			'Winner Poster',
			'Event-Fotos',
			'Snacks',
			'Anreise',
			'Gesamt'
		]);
		expect(rows.find(({ id }) => id === 'tools')).toMatchObject({
			value: 'Für den Tag benötigt: Codex',
			status: '+ 500 €'
		});
		expect(rows.find(({ id }) => id === 'lunch')).toMatchObject({
			value: 'Vegetarische Bowls',
			status: '+ 500 €'
		});
		expect(rows.find(({ id }) => id === 'prep-call')?.value).toContain('14:00');
		expect(rows.at(-1)).toMatchObject({ status: '7.000 € netto', total: true });
	});
});
