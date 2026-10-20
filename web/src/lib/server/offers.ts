import { and, desc, eq, ne } from 'drizzle-orm';
import type { Locale } from '$lib/i18n';
import { defaultOfferConfiguration, isOfferConfiguration, normalizeOfferConfiguration, type OfferConfiguration } from '$lib/offer';
import { generateUniquePublicId, isHackathonId } from '$lib/public-id';
import { getDb } from './db';
import { hackathons, offers } from './db/schema';
import { replaceOfferServiceLinks } from './offer-catalog';

const CLOSED_BOOKING_STATUSES = new Set<string>(['cancelled', 'declined', 'withdrawn']);

export interface OfferSummary {
	id: string;
	companyName: string;
	offerTitle: string;
}

export interface AttachableBooking {
	id: string;
	companyName: string;
}

function draftConfig(locale: Locale): OfferConfiguration {
	const config = { ...defaultOfferConfiguration(), locale };
	if (locale === 'en') config.offerTitle = 'Offer: International hackathon';
	return config;
}

function summary(id: string, config: OfferConfiguration): OfferSummary {
	return { id, companyName: config.companyName, offerTitle: config.offerTitle };
}

export async function listOfferSummaries() {
	const db = await getDb();
	const rows = await db.select({ id: offers.id, config: offers.config }).from(offers).orderBy(desc(offers.updatedAt));
	return rows.flatMap((row) => {
		const config = normalizeOfferConfiguration(row.config);
		return config ? [summary(row.id, config)] : [];
	});
}

export async function getOffer(id: string) {
	const db = await getDb();
	const [row] = await db.select().from(offers).where(eq(offers.id, id)).limit(1);
	if (!row) return null;
	const config = normalizeOfferConfiguration(row.config);
	if (!config) return null;
	return { ...row, config };
}

export async function getLatestOffer() {
	const db = await getDb();
	const [row] = await db.select().from(offers).orderBy(desc(offers.updatedAt)).limit(1);
	if (!row) return null;
	const config = normalizeOfferConfiguration(row.config);
	if (!config) return null;
	return { ...row, config };
}

export async function createOffer(locale: Locale) {
	const db = await getDb();
	const id = await generateUniquePublicId('O', async (candidate) => {
		const [existing] = await db.select({ id: offers.id }).from(offers).where(eq(offers.id, candidate)).limit(1);
		return Boolean(existing);
	});
	const config = draftConfig(locale);
	const row = await db.transaction(async (tx) => {
		const [created] = await tx.insert(offers).values({ id, config }).returning();
		await replaceOfferServiceLinks(tx, id, config.services);
		return created;
	});
	return { ...row, config };
}

export async function updateOfferConfig(id: string, value: unknown) {
	const config = isOfferConfiguration(value) ? value : null;
	if (!config) return null;
	const db = await getDb();
	const row = await db.transaction(async (tx) => {
		const [updated] = await tx.update(offers).set({
			config,
			updatedAt: new Date().toISOString()
		}).where(eq(offers.id, id)).returning();
		if (!updated) return null;
		await replaceOfferServiceLinks(tx, id, config.services);
		return updated;
	});
	return row ?? null;
}

export async function bookingForOffer(offerId: string) {
	const db = await getDb();
	const [row] = await db.select({ id: hackathons.id, companyName: hackathons.companyName }).from(hackathons).where(eq(hackathons.offerId, offerId)).limit(1);
	return row ?? null;
}

export async function attachOfferToBooking(offerId: string, hackathonId: string | null) {
	const offer = await getOffer(offerId);
	if (!offer) return { ok: false as const, status: 404 as const };
	const db = await getDb();
	if (hackathonId === null) {
		await db.update(hackathons).set({ offerId: null }).where(eq(hackathons.offerId, offerId));
		return { ok: true as const, hackathonId: null };
	}
	if (!isHackathonId(hackathonId)) return { ok: false as const, status: 400 as const };
	const [booking] = await db.select({ id: hackathons.id, status: hackathons.status, offerId: hackathons.offerId }).from(hackathons).where(eq(hackathons.id, hackathonId)).limit(1);
	if (!booking || (CLOSED_BOOKING_STATUSES.has(booking.status) && booking.offerId !== offerId)) {
		return { ok: false as const, status: 404 as const };
	}
	await db.transaction(async (tx) => {
		await tx.update(hackathons).set({ offerId: null }).where(and(eq(hackathons.offerId, offerId), ne(hackathons.id, hackathonId)));
		await tx.update(hackathons).set({ offerId }).where(eq(hackathons.id, hackathonId));
	});
	return { ok: true as const, hackathonId };
}
