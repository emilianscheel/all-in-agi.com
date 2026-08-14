import type { BookingConfiguration } from '$lib/booking';
import {
	checkpointPendingHackathon,
	confirmHackathon,
	createPendingHackathon,
	deletePendingHackathon,
	type ConfirmedBooking,
	type ConfirmedBookings
} from './hackathons';

export interface BookingPersistence {
	createPending(config: BookingConfiguration): Promise<string>;
	checkpoint(id: string, bookings: Partial<ConfirmedBookings>): Promise<void>;
	confirm(id: string, bookings: ConfirmedBookings): Promise<void>;
	deletePending(id: string): Promise<void>;
}

export interface BookingProviders {
	bookHackathon(config: BookingConfiguration): Promise<ConfirmedBooking>;
	bookPrepCall(config: BookingConfiguration): Promise<ConfirmedBooking>;
	cancel(booking: ConfirmedBooking): Promise<void>;
}

const persistence: BookingPersistence = {
	createPending: createPendingHackathon,
	checkpoint: checkpointPendingHackathon,
	confirm: confirmHackathon,
	deletePending: deletePendingHackathon
};

async function rollbackBookings(
	id: string,
	bookings: Partial<ConfirmedBookings>,
	providers: BookingProviders,
	store: BookingPersistence
) {
	const ordered = [bookings.prepCallBooking, bookings.hackathonBooking].filter((booking): booking is ConfirmedBooking => Boolean(booking));
	const results = [];
	for (const booking of ordered) {
		try {
			await providers.cancel(booking);
			results.push({ status: 'fulfilled' as const });
		} catch (error) {
			results.push({ status: 'rejected' as const, reason: error, bookingUid: booking.uid });
		}
	}
	const failed = results.filter((result) => result.status === 'rejected');
	if (failed.length) {
		console.error('Cal.com booking rollback incomplete', { hackathonId: id, failures: failed });
		await store.checkpoint(id, bookings).catch((error) => console.error('Could not checkpoint orphaned Cal.com bookings', { hackathonId: id, error }));
		return;
	}
	await store.deletePending(id).catch((error) => console.error('Could not delete rolled back pending hackathon', { hackathonId: id, error }));
}

export async function completeHackathonBooking(
	config: BookingConfiguration,
	providers: BookingProviders,
	store: BookingPersistence = persistence
) {
	const id = await store.createPending(config);
	const bookings: Partial<ConfirmedBookings> = {};
	try {
		bookings.hackathonBooking = await providers.bookHackathon(config);
		await store.checkpoint(id, bookings);
		bookings.prepCallBooking = await providers.bookPrepCall(config);
		await store.checkpoint(id, bookings);
		await store.confirm(id, bookings as ConfirmedBookings);
		return { id, ...(bookings as ConfirmedBookings) };
	} catch (error) {
		await rollbackBookings(id, bookings, providers, store);
		throw error;
	}
}

export async function completeHackathonBookingWithConfirmation<T>(
	config: BookingConfiguration,
	providers: BookingProviders,
	sendConfirmation: (id: string, config: BookingConfiguration, booking: ConfirmedBooking) => Promise<T>,
	store: BookingPersistence = persistence
) {
	const result = await completeHackathonBooking(config, providers, store);
	try {
		const confirmationDelivery = await sendConfirmation(result.id, config, result.prepCallBooking);
		return { ...result, confirmationDelivery };
	} catch (confirmationDeliveryError) {
		return { ...result, confirmationDeliveryError };
	}
}
