import { describe, expect, test } from 'bun:test';
import type { BookingConfiguration } from '$lib/booking';
import { completeHackathonBooking, type BookingPersistence } from './book-hackathon';

const configuration: BookingConfiguration = {
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

function store(log: string[]): BookingPersistence {
	return {
		async createPending() {
			log.push('pending');
			return 'HAA-AAA-AAA';
		},
		async confirm() {
			log.push('confirmed');
		},
		async deletePending() {
			log.push('deleted');
		}
	};
}

const confirmed = {
	status: 'success' as const,
	demo: true,
	uid: 'demo-1',
	start: '2099-05-10T10:00:00.000Z',
	end: '2099-05-10T11:00:00.000Z'
};

describe('booking persistence orchestration', () => {
	test('persists before booking and confirms after provider success', async () => {
		const log: string[] = [];
		const result = await completeHackathonBooking(configuration, async () => {
			log.push('provider');
			return confirmed;
		}, store(log));
		expect(log).toEqual(['pending', 'provider', 'confirmed']);
		expect(result).toEqual({ id: 'HAA-AAA-AAA', booking: confirmed });
	});

	test('cleans up a pending row after provider failure', async () => {
		const log: string[] = [];
		await expect(completeHackathonBooking(configuration, async () => {
			log.push('provider');
			throw new Error('conflict');
		}, store(log))).rejects.toThrow('conflict');
		expect(log).toEqual(['pending', 'provider', 'deleted']);
	});

	test('does not call the provider when creating the pending row fails', async () => {
		let providerCalled = false;
		const failingStore: BookingPersistence = {
			async createPending() { throw new Error('database unavailable'); },
			async confirm() {},
			async deletePending() {}
		};
		await expect(completeHackathonBooking(configuration, async () => {
			providerCalled = true;
			return confirmed;
		}, failingStore)).rejects.toThrow('database unavailable');
		expect(providerCalled).toBe(false);
	});

	test('keeps the pending row when confirmation fails after external success', async () => {
		const log: string[] = [];
		const failingStore = store(log);
		failingStore.confirm = async () => {
			log.push('confirm-failed');
			throw new Error('database unavailable');
		};
		await expect(completeHackathonBooking(configuration, async () => {
			log.push('provider');
			return confirmed;
		}, failingStore)).rejects.toThrow('database unavailable');
		expect(log).toEqual(['pending', 'provider', 'confirm-failed']);
	});
});
