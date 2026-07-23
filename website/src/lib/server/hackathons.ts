import { and, eq } from 'drizzle-orm';
import { getPrice, type BookingConfiguration, type Capacity } from '$lib/booking';
import type { BookingResultSummary } from '$lib/booking-ics';
import { generatePublicId, HACKATHON_ID_PREFIX } from '$lib/public-id';
import { getDb } from './db';
import { hackathons } from './db/schema';

export type HackathonRecord = typeof hackathons.$inferSelect;

export interface ConfirmedBooking extends BookingResultSummary {
	status: 'success';
	demo: boolean;
}

export interface PublicHackathon {
	id: string;
	companyName: string;
	capacity: Capacity;
	venueProvided: boolean;
	equipment: BookingConfiguration['equipment'];
	lunch: BookingConfiguration['lunch'];
	customLunch: string;
	toolProvision: BookingConfiguration['toolProvision'];
	codingTools: BookingConfiguration['codingTools'];
	customCodingTool: string;
	address: BookingConfiguration['address'];
	preferredEventDate: string;
	consultationSlot: string;
	price: ReturnType<typeof getPrice>;
	booking: BookingResultSummary;
}

function pendingValues(id: string, config: BookingConfiguration) {
	const price = getPrice(config.capacity, config.venueProvided, config.lunch, config.toolProvision);
	return {
		id,
		status: 'pending' as const,
		companyName: config.companyName,
		contactName: config.contactName,
		contactEmail: config.email,
		contactPhone: config.phone,
		capacity: config.capacity,
		venueProvided: config.venueProvided,
		equipment: config.equipment,
		lunch: config.lunch,
		customLunch: config.customLunch,
		toolProvision: config.toolProvision!,
		codingTools: config.codingTools,
		customCodingTool: config.customCodingTool,
		address: config.address,
		preferredEventDate: config.preferredEventDate,
		consultationSlot: new Date(config.consultationSlot).toISOString(),
		...price
	};
}

export async function createPendingHackathon(config: BookingConfiguration) {
	const db = getDb();
	for (let attempt = 0; attempt < 10; attempt += 1) {
		const id = generatePublicId(HACKATHON_ID_PREFIX);
		const inserted = await db
			.insert(hackathons)
			.values(pendingValues(id, config))
			.onConflictDoNothing({ target: hackathons.id })
			.returning({ id: hackathons.id });
		if (inserted[0]) return inserted[0].id;
	}
	throw new Error('Es konnte keine eindeutige Hackathon-ID erzeugt werden.');
}

export async function confirmHackathon(id: string, booking: ConfirmedBooking) {
	const updated = await getDb()
		.update(hackathons)
		.set({
			status: 'confirmed',
			bookingUid: booking.uid ?? null,
			bookingIcsUid: booking.icsUid ?? null,
			bookingTitle: booking.title ?? null,
			bookingStart: new Date(booking.start).toISOString(),
			bookingEnd: booking.end ? new Date(booking.end).toISOString() : null,
			meetingUrl: booking.meetingUrl ?? null,
			demoMode: booking.demo,
			updatedAt: new Date().toISOString()
		})
		.where(and(eq(hackathons.id, id), eq(hackathons.status, 'pending')))
		.returning({ id: hackathons.id });
	if (!updated[0]) throw new Error('Der Hackathon konnte nicht bestätigt werden.');
}

export async function deletePendingHackathon(id: string) {
	await getDb().delete(hackathons).where(and(eq(hackathons.id, id), eq(hackathons.status, 'pending')));
}

export async function getConfirmedHackathonRecord(id: string) {
	const [record] = await getDb()
		.select()
		.from(hackathons)
		.where(and(eq(hackathons.id, id), eq(hackathons.status, 'confirmed')))
		.limit(1);
	return record ?? null;
}

export function recordToBookingConfiguration(record: HackathonRecord): BookingConfiguration {
	return {
		capacity: record.capacity as Capacity,
		venueProvided: record.venueProvided,
		equipment: record.equipment,
		lunch: record.lunch,
		customLunch: record.customLunch,
		toolProvision: record.toolProvision,
		codingTools: record.codingTools,
		customCodingTool: record.customCodingTool,
		companyName: record.companyName,
		contactName: record.contactName,
		email: record.contactEmail,
		phone: record.contactPhone,
		address: record.address,
		preferredEventDate: record.preferredEventDate,
		consultationSlot: record.consultationSlot
	};
}

export function recordToBookingSummary(record: HackathonRecord): BookingResultSummary {
	return {
		uid: record.bookingUid ?? undefined,
		icsUid: record.bookingIcsUid ?? undefined,
		title: record.bookingTitle ?? undefined,
		start: record.bookingStart ?? record.consultationSlot,
		end: record.bookingEnd ?? undefined,
		meetingUrl: record.meetingUrl ?? undefined
	};
}

export function toPublicHackathon(record: HackathonRecord): PublicHackathon {
	return {
		id: record.id,
		companyName: record.companyName,
		capacity: record.capacity as Capacity,
		venueProvided: record.venueProvided,
		equipment: record.equipment,
		lunch: record.lunch,
		customLunch: record.customLunch,
		toolProvision: record.toolProvision,
		codingTools: record.codingTools,
		customCodingTool: record.customCodingTool,
		address: record.address,
		preferredEventDate: record.preferredEventDate,
		consultationSlot: record.consultationSlot,
		price: {
			basePrice: record.basePrice,
			venueSurcharge: record.venueSurcharge,
			lunchAdjustment: record.lunchAdjustment,
			toolsAdjustment: record.toolsAdjustment,
			totalPrice: record.totalPrice
		},
		booking: recordToBookingSummary(record)
	};
}

export async function getPublicHackathon(id: string) {
	const record = await getConfirmedHackathonRecord(id);
	return record ? toPublicHackathon(record) : null;
}
