import { describe, expect, test } from 'bun:test';
import { applyHackathonUpdate, HackathonUpdateError, parseHackathonUpdate } from './hackathon-edit';
import type { BookingConfiguration } from './booking';

const config: BookingConfiguration = {
	capacity: 15,
	venueProvided: true,
	equipment: 'projector',
	lunch: 'pizza',
	customLunch: '',
	toolProvision: 'existing',
	codingTools: ['codex'],
	customCodingTool: '',
	deviceProvision: 'existing',
	deviceCount: 0,
	companyName: 'Musterwerke GmbH',
	contactName: 'Ada Beispiel',
	email: 'ada@example.com',
	phone: '+49 30 123456',
	message: '',
	address: { label: '', street: 'Musterstraße 1', postalCode: '10115', city: 'Berlin', country: 'Deutschland' },
	eventStart: '2099-06-20T07:00:00.000Z',
	eventEnd: '2099-06-20T15:00:00.000Z',
	consultationSlot: '2099-05-10T10:00:00.000Z'
};

describe('hackathon section updates', () => {
	test.each([
		[{ section: 'capacity', capacity: 30 }, { capacity: 30 }],
		[{ section: 'venue', venueProvided: false }, { venueProvided: false }],
		[{ section: 'tools', toolProvision: 'needed', codingTools: ['cursor'], customCodingTool: '' }, { toolProvision: 'needed', codingTools: ['cursor'] }],
		[{ section: 'devices', deviceProvision: 'needed', deviceCount: 8 }, { deviceProvision: 'needed', deviceCount: 8 }],
		[{ section: 'equipment', equipment: 'none' }, { equipment: 'none' }],
		[{ section: 'lunch', lunch: 'custom', customLunch: 'Bowls' }, { lunch: 'custom', customLunch: 'Bowls' }],
		[{ section: 'address', address: { label: '', street: 'Neue Straße 2', postalCode: '20095', city: 'Hamburg', country: 'Deutschland' } }, { address: { label: '', street: 'Neue Straße 2', postalCode: '20095', city: 'Hamburg', country: 'Deutschland' } }],
		[{ section: 'event-time', eventStart: '2099-07-01T07:00:00.000Z', eventEnd: '2099-07-01T15:00:00.000Z' }, { eventStart: '2099-07-01T07:00:00.000Z', eventEnd: '2099-07-01T15:00:00.000Z' }],
		[{ section: 'prep-call', consultationSlot: '2099-05-11T10:00:00.000Z' }, { consultationSlot: '2099-05-11T10:00:00.000Z' }],
		[{ section: 'company', companyName: 'Neue Firma' }, { companyName: 'Neue Firma' }],
		[{ section: 'contact', contactName: 'Grace Beispiel', email: 'grace@example.com', phone: '+49 40 123456' }, { contactName: 'Grace Beispiel', email: 'grace@example.com', phone: '+49 40 123456' }],
		[{ section: 'message', message: 'Neue Nachricht' }, { message: 'Neue Nachricht' }]
	] as const)('parses and applies %s without replacing unrelated fields', (input, expected) => {
		const next = applyHackathonUpdate(config, parseHackathonUpdate(input));
		expect(next).toMatchObject(expected);
		expect(next.eventStart).toBe('eventStart' in expected ? expected.eventStart : config.eventStart);
		expect(next.companyName).toBe('companyName' in expected ? expected.companyName : config.companyName);
	});

	test('clamps requested devices when capacity is reduced', () => {
		const next = applyHackathonUpdate({ ...config, capacity: 50, deviceProvision: 'needed', deviceCount: 40 }, parseHackathonUpdate({ section: 'capacity', capacity: 15 }));
		expect(next).toMatchObject({ capacity: 15, deviceProvision: 'needed', deviceCount: 15 });
	});

	test('clears custom lunch when another lunch option is selected', () => {
		const next = applyHackathonUpdate({ ...config, lunch: 'custom', customLunch: 'Bowls' }, parseHackathonUpdate({ section: 'lunch', lunch: 'pizza', customLunch: 'ignored' }));
		expect(next.customLunch).toBe('');
	});

	test('rejects unknown sections and invalid values', () => {
		expect(() => parseHackathonUpdate({ section: 'unknown' })).toThrow(HackathonUpdateError);
		expect(() => parseHackathonUpdate({ section: 'capacity', capacity: 20 })).toThrow('Die Teamgröße ist ungültig.');
		expect(() => parseHackathonUpdate({ section: 'message', message: 'x'.repeat(501) })).toThrow('Ihre Nachricht ist ungültig.');
		expect(() => parseHackathonUpdate({ section: 'devices', deviceProvision: 'needed', deviceCount: 1.5 })).toThrow('Die Geräteauswahl ist ungültig.');
	});
});
