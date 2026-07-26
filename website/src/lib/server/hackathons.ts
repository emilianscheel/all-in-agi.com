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

export interface ConfirmedBookings {
	hackathonBooking: ConfirmedBooking;
	prepCallBooking: ConfirmedBooking;
}

export interface PublicHackathon extends BookingConfiguration {
	id: string;
	price: ReturnType<typeof getPrice>;
	hackathonBooking: BookingResultSummary;
	prepCallBooking: BookingResultSummary;
}

export interface PublicHackathonTimer {
	id: string;
	eventStart: string;
	eventEnd: string;
	lunch: BookingConfiguration['lunch'];
	customLunch: string;
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
		message: config.message,
		capacity: config.capacity,
		venueProvided: config.venueProvided,
		equipment: config.equipment,
		lunch: config.lunch,
		customLunch: config.customLunch,
		toolProvision: config.toolProvision!,
		codingTools: config.codingTools,
		customCodingTool: config.customCodingTool,
		address: config.address,
		eventStart: new Date(config.eventStart).toISOString(),
		eventEnd: new Date(config.eventEnd).toISOString(),
		consultationSlot: new Date(config.consultationSlot).toISOString(),
		...price
	};
}

export async function createPendingHackathon(config: BookingConfiguration) {
	const db = await getDb();
	for (let attempt = 0; attempt < 10; attempt += 1) {
		const id = generatePublicId(HACKATHON_ID_PREFIX);
		const inserted = await db.insert(hackathons).values(pendingValues(id, config)).onConflictDoNothing({ target: hackathons.id }).returning({ id: hackathons.id });
		if (inserted[0]) return inserted[0].id;
	}
	throw new Error('Es konnte keine eindeutige Hackathon-ID erzeugt werden.');
}

function bookingValues(bookings: Partial<ConfirmedBookings>) {
	const prep = bookings.prepCallBooking;
	const event = bookings.hackathonBooking;
	return {
		...(prep ? {
			prepCallBookingUid: prep.uid ?? null,
			prepCallBookingIcsUid: prep.icsUid ?? null,
			prepCallBookingTitle: prep.title ?? null,
			prepCallBookingStart: new Date(prep.start).toISOString(),
			prepCallBookingEnd: prep.end ? new Date(prep.end).toISOString() : null,
			prepCallMeetingUrl: prep.meetingUrl ?? null
		} : {}),
		...(event ? {
			hackathonBookingUid: event.uid ?? null,
			hackathonBookingIcsUid: event.icsUid ?? null,
			hackathonBookingTitle: event.title ?? null,
			hackathonBookingStart: new Date(event.start).toISOString(),
			hackathonBookingEnd: event.end ? new Date(event.end).toISOString() : null
		} : {}),
		...(prep || event ? { demoMode: Boolean(prep?.demo ?? event?.demo), updatedAt: new Date().toISOString() } : {})
	};
}

export async function checkpointPendingHackathon(id: string, bookings: Partial<ConfirmedBookings>) {
	const db = await getDb();
	await db.update(hackathons).set(bookingValues(bookings)).where(and(eq(hackathons.id, id), eq(hackathons.status, 'pending')));
}

export async function confirmHackathon(id: string, bookings: ConfirmedBookings) {
	const db = await getDb();
	const updated = await db.update(hackathons).set({ status: 'confirmed', ...bookingValues(bookings) })
		.where(and(eq(hackathons.id, id), eq(hackathons.status, 'pending'))).returning({ id: hackathons.id });
	if (!updated[0]) throw new Error('Der Hackathon konnte nicht bestätigt werden.');
}

export async function deletePendingHackathon(id: string) {
	const db = await getDb();
	await db.delete(hackathons).where(and(eq(hackathons.id, id), eq(hackathons.status, 'pending')));
}

export async function getConfirmedHackathonRecord(id: string) {
	const db = await getDb();
	const [record] = await db.select().from(hackathons).where(and(eq(hackathons.id, id), eq(hackathons.status, 'confirmed'))).limit(1);
	return record ?? null;
}

export async function updateConfirmedHackathon(id: string, config: BookingConfiguration, bookings: Partial<ConfirmedBookings> = {}) {
	const price = getPrice(config.capacity, config.venueProvided, config.lunch, config.toolProvision);
	const db = await getDb();
	const [record] = await db.update(hackathons).set({
		companyName: config.companyName,
		contactName: config.contactName,
		contactEmail: config.email,
		contactPhone: config.phone,
		message: config.message,
		capacity: config.capacity,
		venueProvided: config.venueProvided,
		equipment: config.equipment,
		lunch: config.lunch,
		customLunch: config.customLunch,
		toolProvision: config.toolProvision!,
		codingTools: config.codingTools,
		customCodingTool: config.customCodingTool,
		address: config.address,
		eventStart: new Date(config.eventStart).toISOString(),
		eventEnd: new Date(config.eventEnd).toISOString(),
		consultationSlot: new Date(config.consultationSlot).toISOString(),
		...price,
		...bookingValues(bookings),
		updatedAt: new Date().toISOString()
	}).where(and(eq(hackathons.id, id), eq(hackathons.status, 'confirmed'))).returning();
	if (!record) throw new Error('Der Hackathon konnte nicht aktualisiert werden.');
	return record;
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
		message: record.message,
		address: record.address,
		eventStart: record.eventStart,
		eventEnd: record.eventEnd,
		consultationSlot: record.consultationSlot
	};
}

export function recordToPrepCallBookingSummary(record: HackathonRecord): BookingResultSummary {
	return {
		uid: record.prepCallBookingUid ?? undefined,
		icsUid: record.prepCallBookingIcsUid ?? undefined,
		title: record.prepCallBookingTitle ?? undefined,
		start: record.prepCallBookingStart ?? record.consultationSlot,
		end: record.prepCallBookingEnd ?? undefined,
		meetingUrl: record.prepCallMeetingUrl ?? undefined
	};
}

export function recordToHackathonBookingSummary(record: HackathonRecord): BookingResultSummary {
	return {
		uid: record.hackathonBookingUid ?? undefined,
		icsUid: record.hackathonBookingIcsUid ?? undefined,
		title: record.hackathonBookingTitle ?? undefined,
		start: record.hackathonBookingStart ?? record.eventStart,
		end: record.hackathonBookingEnd ?? record.eventEnd
	};
}

export function toPublicHackathon(record: HackathonRecord): PublicHackathon {
	return {
		id: record.id,
		...recordToBookingConfiguration(record),
		price: {
			basePrice: record.basePrice,
			venueSurcharge: record.venueSurcharge,
			lunchAdjustment: record.lunchAdjustment,
			toolsAdjustment: record.toolsAdjustment,
			totalPrice: record.totalPrice
		},
		hackathonBooking: recordToHackathonBookingSummary(record),
		prepCallBooking: recordToPrepCallBookingSummary(record)
	};
}

export async function getPublicHackathon(id: string) {
	const record = await getConfirmedHackathonRecord(id);
	return record ? toPublicHackathon(record) : null;
}

export function toPublicHackathonTimer(record: Pick<HackathonRecord, 'id' | 'eventStart' | 'eventEnd' | 'lunch' | 'customLunch'>): PublicHackathonTimer {
	return {
		id: record.id,
		eventStart: record.eventStart,
		eventEnd: record.eventEnd,
		lunch: record.lunch,
		customLunch: record.customLunch
	};
}

export async function getPublicHackathonTimer(id: string) {
	const db = await getDb();
	const [record] = await db.select({
		id: hackathons.id,
		eventStart: hackathons.eventStart,
		eventEnd: hackathons.eventEnd,
		lunch: hackathons.lunch,
		customLunch: hackathons.customLunch
	}).from(hackathons).where(and(eq(hackathons.id, id), eq(hackathons.status, 'confirmed'))).limit(1);
	return record ? toPublicHackathonTimer(record) : null;
}
