import { describe, expect, test } from 'bun:test';
import type { BookingConfiguration } from '$lib/booking';
import {
	completeHackathonBooking,
	completeHackathonBookingWithConfirmation,
	type BookingPersistence,
	type BookingProviders
} from './book-hackathon';

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
	message: '',
	address: { label: 'Musterstraße 1, 10115 Berlin', street: 'Musterstraße 1', postalCode: '10115', city: 'Berlin', country: 'Deutschland' },
	eventStart: '2099-06-20T07:00:00.000Z',
	eventEnd: '2099-06-20T15:00:00.000Z',
	consultationSlot: '2099-05-10T10:00:00.000Z'
};

const hackathonBooking = { status: 'success' as const, demo: true, uid: 'event-1', start: configuration.eventStart, end: configuration.eventEnd };
const prepCallBooking = { status: 'success' as const, demo: true, uid: 'prep-1', start: configuration.consultationSlot, end: '2099-05-10T11:00:00.000Z' };

function store(log: string[]): BookingPersistence {
	return {
		async createPending() { log.push('pending'); return 'HAA-AAA-AAA'; },
		async checkpoint(_id, bookings) { log.push(`checkpoint:${bookings.prepCallBooking ? 'both' : 'event'}`); },
		async confirm() { log.push('confirmed'); },
		async deletePending() { log.push('deleted'); }
	};
}

function providers(log: string[]): BookingProviders {
	return {
		async bookHackathon() { log.push('book:event'); return hackathonBooking; },
		async bookPrepCall() { log.push('book:prep'); return prepCallBooking; },
		async cancel(booking) { log.push(`cancel:${booking.uid}`); }
	};
}

describe('booking persistence orchestration', () => {
	test('confirms only after both Cal.com bookings are checkpointed', async () => {
		const log: string[] = [];
		const result = await completeHackathonBooking(configuration, providers(log), store(log));
		expect(log).toEqual(['pending', 'book:event', 'checkpoint:event', 'book:prep', 'checkpoint:both', 'confirmed']);
		expect(result).toEqual({ id: 'HAA-AAA-AAA', hackathonBooking, prepCallBooking });
	});

	test('deletes the pending row when the first provider fails', async () => {
		const log: string[] = [];
		const failing = providers(log);
		failing.bookHackathon = async () => { log.push('book:event'); throw new Error('conflict'); };
		await expect(completeHackathonBooking(configuration, failing, store(log))).rejects.toThrow('conflict');
		expect(log).toEqual(['pending', 'book:event', 'deleted']);
	});

	test('cancels the event booking when the prep call fails', async () => {
		const log: string[] = [];
		const failing = providers(log);
		failing.bookPrepCall = async () => { log.push('book:prep'); throw new Error('conflict'); };
		await expect(completeHackathonBooking(configuration, failing, store(log))).rejects.toThrow('conflict');
		expect(log).toEqual(['pending', 'book:event', 'checkpoint:event', 'book:prep', 'cancel:event-1', 'deleted']);
	});

	test('keeps and checkpoints pending data when cancellation fails', async () => {
		const log: string[] = [];
		const failing = providers(log);
		failing.bookPrepCall = async () => { log.push('book:prep'); throw new Error('conflict'); };
		failing.cancel = async (booking) => { log.push(`cancel:${booking.uid}`); throw new Error('provider unavailable'); };
		await expect(completeHackathonBooking(configuration, failing, store(log))).rejects.toThrow('conflict');
		expect(log).toEqual(['pending', 'book:event', 'checkpoint:event', 'book:prep', 'cancel:event-1', 'checkpoint:event']);
	});

	test('rolls both bookings back after a database confirmation failure', async () => {
		const log: string[] = [];
		const failingStore = store(log);
		failingStore.confirm = async () => { log.push('confirm-failed'); throw new Error('database unavailable'); };
		await expect(completeHackathonBooking(configuration, providers(log), failingStore)).rejects.toThrow('database unavailable');
		expect(log).toEqual(['pending', 'book:event', 'checkpoint:event', 'book:prep', 'checkpoint:both', 'confirm-failed', 'cancel:prep-1', 'cancel:event-1', 'deleted']);
	});

	test('sends confirmation only after both bookings are confirmed', async () => {
		const log: string[] = [];
		const result = await completeHackathonBookingWithConfirmation(
			configuration,
			providers(log),
			async (id, _config, prep) => { log.push(`email:${id}:${prep.uid}`); return { messageId: 'message-1' }; },
			store(log)
		);
		expect(log.at(-1)).toBe('email:HAA-AAA-AAA:prep-1');
		expect(result).toMatchObject({ confirmationDelivery: { messageId: 'message-1' } });
	});
});
