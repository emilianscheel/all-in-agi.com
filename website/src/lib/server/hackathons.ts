import { and, eq, inArray, isNull, lt, or } from 'drizzle-orm';
import { getPrice, type BookingConfiguration, type Capacity } from '$lib/booking';
import { calculateCancellationCharge } from '$lib/cancellation';
import type { BookingResultSummary } from '$lib/booking-ics';
import type { InvoiceSnapshot } from '$lib/invoice';
import { generatePublicId, HACKATHON_ID_PREFIX } from '$lib/public-id';
import { getDb } from './db';
import { hackathons } from './db/schema';
import { createLegalSnapshot, registerLegalSnapshot } from './legal-contracts';

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
	status: 'requested' | 'prep_scheduled' | 'exit_window' | 'contracted' | 'withdrawn' | 'declined' | 'confirmed' | 'cancellation_pending' | 'cancelled' | 'completed';
	cancelledAt: string | null;
	cancellationEmailSentAt: string | null;
	legalVersion: string | null;
	legalContentHash: string | null;
	legalModules: HackathonRecord['legalModules'];
	exitDeadline: string | null;
	contractedAt: string | null;
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

function pendingValues(id: string, config: BookingConfiguration, legalSnapshot: NonNullable<HackathonRecord['legalSnapshot']>) {
	const price = getPrice(config.capacity, config.venueProvided, config.lunch, config.toolProvision, config.deviceProvision, config.deviceCount);
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
		deviceProvision: config.deviceProvision!,
		deviceCount: config.deviceCount,
		eventPhotos: config.eventPhotos ?? true,
		billing: config.billing!,
		businessCustomerConfirmed: Boolean(config.businessCustomerConfirmed),
		authorityConfirmed: Boolean(config.authorityConfirmed),
		legalModules: legalSnapshot.modules,
		legalVersion: legalSnapshot.version,
		legalContentHash: legalSnapshot.contentHash,
		legalSnapshot,
		address: config.address,
		eventStart: new Date(config.eventStart).toISOString(),
		eventEnd: new Date(config.eventEnd).toISOString(),
		consultationSlot: new Date(config.consultationSlot).toISOString(),
		billingModel: 'deposit_30' as const,
		...price
	};
}

export async function createPendingHackathon(config: BookingConfiguration) {
	const db = await getDb();
	const legalSnapshot = createLegalSnapshot(config);
	await registerLegalSnapshot(legalSnapshot);
	for (let attempt = 0; attempt < 10; attempt += 1) {
		const id = generatePublicId(HACKATHON_ID_PREFIX);
		const inserted = await db.insert(hackathons).values(pendingValues(id, config, legalSnapshot)).onConflictDoNothing({ target: hackathons.id }).returning({ id: hackathons.id });
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
	const updated = await db.update(hackathons).set({ status: 'prep_scheduled', ...bookingValues(bookings) })
		.where(and(eq(hackathons.id, id), eq(hackathons.status, 'pending'))).returning({ id: hackathons.id });
	if (!updated[0]) throw new Error('Der Hackathon konnte nicht bestätigt werden.');
}

export async function deletePendingHackathon(id: string) {
	const db = await getDb();
	await db.delete(hackathons).where(and(eq(hackathons.id, id), eq(hackathons.status, 'pending')));
}

export async function getConfirmedHackathonRecord(id: string) {
	const db = await getDb();
	const [record] = await db.select().from(hackathons).where(and(eq(hackathons.id, id), inArray(hackathons.status, ['prep_scheduled', 'exit_window', 'contracted', 'confirmed', 'completed']))).limit(1);
	return record ?? null;
}

export async function getCustomerHackathonRecord(id: string) {
	const db = await getDb();
	const [record] = await db.select().from(hackathons)
		.where(and(eq(hackathons.id, id), inArray(hackathons.status, ['requested', 'prep_scheduled', 'exit_window', 'contracted', 'withdrawn', 'declined', 'confirmed', 'cancellation_pending', 'cancelled', 'completed'])))
		.limit(1);
	return record ?? null;
}

export async function freezeInvoiceSnapshot(id: string, snapshot: InvoiceSnapshot, issuedAt: string) {
	const db = await getDb();
	const [record] = await db.update(hackathons).set({
		invoiceSnapshot: snapshot,
		invoiceIssuedAt: issuedAt,
		updatedAt: issuedAt
	}).where(and(
		eq(hackathons.id, id),
		inArray(hackathons.status, ['contracted', 'confirmed', 'completed']),
		isNull(hackathons.invoiceSnapshot)
	)).returning();
	return record ?? null;
}

export async function markInvoiceEmailSent(id: string, messageId?: string, at = new Date().toISOString()) {
	const db = await getDb();
	const [record] = await db.update(hackathons).set({
		invoiceEmailSentAt: at,
		invoiceEmailMessageId: messageId ?? null,
		updatedAt: at
	}).where(and(eq(hackathons.id, id), inArray(hackathons.status, ['contracted', 'confirmed', 'completed']))).returning();
	return record ?? null;
}

export async function freezeDownPaymentInvoiceSnapshot(id: string, snapshot: InvoiceSnapshot, issuedAt: string) {
	const db = await getDb();
	const [record] = await db.update(hackathons).set({
		downPaymentInvoiceSnapshot: snapshot,
		downPaymentInvoiceIssuedAt: issuedAt,
		updatedAt: issuedAt
	}).where(and(
		eq(hackathons.id, id),
		inArray(hackathons.status, ['contracted', 'confirmed', 'completed']),
		eq(hackathons.billingModel, 'deposit_30'),
		isNull(hackathons.downPaymentInvoiceSnapshot)
	)).returning();
	return record ?? null;
}

export async function markDownPaymentInvoiceEmailSent(id: string, messageId?: string, at = new Date().toISOString()) {
	const db = await getDb();
	const [record] = await db.update(hackathons).set({
		downPaymentInvoiceEmailSentAt: at,
		downPaymentInvoiceEmailMessageId: messageId ?? null,
		updatedAt: at
	}).where(and(eq(hackathons.id, id), inArray(hackathons.status, ['contracted', 'confirmed', 'completed']), eq(hackathons.billingModel, 'deposit_30'))).returning();
	return record ?? null;
}

export async function markDownPaymentPaid(id: string, at = new Date().toISOString()) {
	const db = await getDb();
	const [record] = await db.update(hackathons).set({ downPaymentPaidAt: at, updatedAt: at })
		.where(and(
			eq(hackathons.id, id),
			inArray(hackathons.status, ['contracted', 'confirmed', 'completed']),
			eq(hackathons.billingModel, 'deposit_30'),
			isNull(hackathons.downPaymentPaidAt)
		)).returning();
	return record ?? null;
}

export async function updateConfirmedHackathon(
	id: string,
	config: BookingConfiguration,
	bookings: Partial<ConfirmedBookings> = {},
	reprice = false
) {
	const price = getPrice(config.capacity, config.venueProvided, config.lunch, config.toolProvision, config.deviceProvision, config.deviceCount);
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
		deviceProvision: config.deviceProvision!,
		deviceCount: config.deviceCount,
		eventPhotos: config.eventPhotos ?? true,
		billing: config.billing ?? undefined,
		businessCustomerConfirmed: Boolean(config.businessCustomerConfirmed),
		authorityConfirmed: Boolean(config.authorityConfirmed),
		address: config.address,
		eventStart: new Date(config.eventStart).toISOString(),
		eventEnd: new Date(config.eventEnd).toISOString(),
		consultationSlot: new Date(config.consultationSlot).toISOString(),
		...(reprice ? price : {}),
		...bookingValues(bookings),
		updatedAt: new Date().toISOString()
	}).where(and(eq(hackathons.id, id), inArray(hackathons.status, ['prep_scheduled', 'exit_window', 'contracted', 'confirmed']))).returning();
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
		deviceProvision: record.deviceProvision,
		deviceCount: record.deviceCount,
		eventPhotos: record.eventPhotos,
		companyName: record.companyName,
		contactName: record.contactName,
		email: record.contactEmail,
		phone: record.contactPhone,
		message: record.message,
		address: record.address,
		eventStart: record.eventStart,
		eventEnd: record.eventEnd,
		consultationSlot: record.consultationSlot,
		billing: record.billing ?? {
			companyName: record.companyName, legalForm: '', contactName: record.contactName, email: record.contactEmail,
			vatId: '', purchaseOrder: '', address: { ...record.address, country: 'Deutschland' }
		},
		businessCustomerConfirmed: record.businessCustomerConfirmed,
		authorityConfirmed: record.authorityConfirmed
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
		status: record.status as PublicHackathon['status'],
		cancelledAt: record.cancelledAt,
		cancellationEmailSentAt: record.cancellationEmailSentAt,
		legalVersion: record.legalVersion,
		legalContentHash: record.legalContentHash,
		legalModules: record.legalModules,
		exitDeadline: record.exitDeadline,
		contractedAt: record.contractedAt,
		...recordToBookingConfiguration(record),
		price: {
			basePrice: record.basePrice,
			venueSurcharge: record.venueSurcharge,
			lunchAdjustment: record.lunchAdjustment,
			toolsAdjustment: record.toolsAdjustment,
			devicesAdjustment: record.devicesAdjustment,
			totalPrice: record.totalPrice
		},
		hackathonBooking: recordToHackathonBookingSummary(record),
		prepCallBooking: recordToPrepCallBookingSummary(record)
	};
}

export async function getPublicHackathon(id: string) {
	const record = await getCustomerHackathonRecord(id);
	return record ? toPublicHackathon(record) : null;
}

const CANCELLATION_LEASE_MS = 120_000;

export async function claimHackathonCancellation(id: string, now = new Date()) {
	const db = await getDb();
	const processingAt = now.toISOString();
	const current = await getCustomerHackathonRecord(id);
	const cancellationChargeSnapshot = current && ['contracted', 'confirmed'].includes(current.status)
		? calculateCancellationCharge({
			capacity: current.capacity as Capacity,
			organizerDevices: current.deviceProvision === 'needed',
			contractNetEuros: current.totalPrice,
			eventStart: new Date(current.eventStart),
			cancelledAt: now
		})
		: undefined;
	const [started] = await db.update(hackathons).set({
		status: 'cancellation_pending',
		cancellationProcessingAt: processingAt,
		cancellationChargeSnapshot,
		updatedAt: processingAt
	}).where(and(eq(hackathons.id, id), inArray(hackathons.status, ['contracted', 'confirmed']))).returning();
	if (started) return { claimed: true, record: started };

	const leaseExpiredAt = new Date(now.getTime() - CANCELLATION_LEASE_MS).toISOString();
	const [resumed] = await db.update(hackathons).set({ cancellationProcessingAt: processingAt, updatedAt: processingAt })
		.where(and(
			eq(hackathons.id, id),
			or(
				eq(hackathons.status, 'cancellation_pending'),
				and(eq(hackathons.status, 'cancelled'), isNull(hackathons.cancellationEmailSentAt))
			),
			or(isNull(hackathons.cancellationProcessingAt), lt(hackathons.cancellationProcessingAt, leaseExpiredAt))
		)).returning();
	if (resumed) return { claimed: true, record: resumed };
	return { claimed: false, record: await getCustomerHackathonRecord(id) };
}

export async function markHackathonCalendarCancelled(id: string, kind: 'hackathon' | 'prep-call', at = new Date().toISOString()) {
	const db = await getDb();
	const [record] = await db.update(hackathons).set({
		...(kind === 'hackathon' ? { hackathonCancelledAt: at } : { prepCallCancelledAt: at }),
		updatedAt: at
	}).where(and(eq(hackathons.id, id), inArray(hackathons.status, ['cancellation_pending', 'cancelled']))).returning();
	return record ?? null;
}

export async function markHackathonCancelled(id: string, at = new Date().toISOString()) {
	const db = await getDb();
	const [record] = await db.update(hackathons).set({ status: 'cancelled', cancelledAt: at, updatedAt: at })
		.where(and(eq(hackathons.id, id), eq(hackathons.status, 'cancellation_pending'))).returning();
	return record ?? await getCustomerHackathonRecord(id);
}

export async function markCancellationEmailSent(id: string, messageId?: string, at = new Date().toISOString()) {
	const db = await getDb();
	const [record] = await db.update(hackathons).set({
		cancellationEmailSentAt: at,
		cancellationEmailMessageId: messageId ?? null,
		updatedAt: at
	}).where(and(eq(hackathons.id, id), eq(hackathons.status, 'cancelled'))).returning();
	return record ?? null;
}

export async function releaseHackathonCancellation(id: string, processingAt: string | null) {
	const db = await getDb();
	await db.update(hackathons).set({ cancellationProcessingAt: null })
		.where(and(
			eq(hackathons.id, id),
			inArray(hackathons.status, ['cancellation_pending', 'cancelled']),
			processingAt ? eq(hackathons.cancellationProcessingAt, processingAt) : isNull(hackathons.cancellationProcessingAt)
		));
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
	}).from(hackathons).where(and(eq(hackathons.id, id), inArray(hackathons.status, ['contracted', 'confirmed', 'completed']))).limit(1);
	return record ? toPublicHackathonTimer(record) : null;
}
