import type { BookingConfiguration } from '$lib/booking';
import {
	confirmHackathon,
	createPendingHackathon,
	deletePendingHackathon,
	type ConfirmedBooking
} from './hackathons';

export interface BookingPersistence {
	createPending(config: BookingConfiguration): Promise<string>;
	confirm(id: string, booking: ConfirmedBooking): Promise<void>;
	deletePending(id: string): Promise<void>;
}

const persistence: BookingPersistence = {
	createPending: createPendingHackathon,
	confirm: confirmHackathon,
	deletePending: deletePendingHackathon
};

export async function completeHackathonBooking(
	config: BookingConfiguration,
	bookPrepCall: (config: BookingConfiguration) => Promise<ConfirmedBooking>,
	store: BookingPersistence = persistence
) {
	const id = await store.createPending(config);
	let booking: ConfirmedBooking;
	try {
		booking = await bookPrepCall(config);
	} catch (error) {
		await store.deletePending(id).catch(() => undefined);
		throw error;
	}
	await store.confirm(id, booking);
	return { id, booking };
}
