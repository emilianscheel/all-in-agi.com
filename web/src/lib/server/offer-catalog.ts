import { asc, desc, eq, inArray } from 'drizzle-orm';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { PostgresJsDatabase, PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import { lucideIconSvg } from '$lib/lucide-icons';
import type { ClientLogoRecord, OfferCatalogService } from '$lib/offer';
import { generateUniquePublicId, isClientLogoId, LOGO_ID_PREFIX, SERVICE_ID_PREFIX } from '$lib/public-id';
import { sanitizeClientLogoSvg } from '$lib/svg-logo';
import { getDb } from './db';
import { clientLogos, offerServiceLinks, offerServices } from './db/schema';
import * as schema from './db/schema';

type Database = PostgresJsDatabase<typeof schema>;
type Executor = Database | PgTransaction<PostgresJsQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>;
type OfferServiceRow = typeof offerServices.$inferSelect;

function catalogService(row: OfferServiceRow): OfferCatalogService {
	return {
		id: row.id,
		label: row.label,
		labelEn: row.labelEn,
		...(row.description ? { description: row.description } : {}),
		...(row.descriptionEn ? { descriptionEn: row.descriptionEn } : {}),
		icon: row.icon,
		sortOrder: row.sortOrder
	};
}

export async function listClientLogos(): Promise<ClientLogoRecord[]> {
	const db = await getDb();
	const rows = await db.select({
		id: clientLogos.id,
		name: clientLogos.name,
		svg: clientLogos.svg
	}).from(clientLogos).orderBy(asc(clientLogos.name), asc(clientLogos.id));
	return rows;
}

export async function getClientLogo(id: string) {
	if (!isClientLogoId(id)) return null;
	const db = await getDb();
	const [row] = await db.select({
		id: clientLogos.id,
		name: clientLogos.name,
		svg: clientLogos.svg
	}).from(clientLogos).where(eq(clientLogos.id, id)).limit(1);
	return row ?? null;
}

export async function createClientLogo(name: string, svg: string) {
	const cleanName = name.trim().replace(/\s+/g, ' ').slice(0, 80);
	const cleanSvg = sanitizeClientLogoSvg(svg);
	if (!cleanName || !cleanSvg) return null;
	const db = await getDb();
	const id = await generateUniquePublicId(LOGO_ID_PREFIX, async (candidate) => {
		const [existing] = await db.select({ id: clientLogos.id }).from(clientLogos).where(eq(clientLogos.id, candidate)).limit(1);
		return Boolean(existing);
	});
	const [row] = await db.insert(clientLogos).values({ id, name: cleanName, svg: cleanSvg }).returning({
		id: clientLogos.id,
		name: clientLogos.name,
		svg: clientLogos.svg
	});
	return row ?? null;
}

export async function listOfferServices() {
	const db = await getDb();
	const rows = await db.select().from(offerServices).orderBy(asc(offerServices.sortOrder), asc(offerServices.label));
	return rows.map(catalogService);
}

export async function createOfferService(label: string, icon: string) {
	const cleanLabel = label.trim().replace(/\s+/g, ' ');
	const cleanIcon = icon.trim().toLowerCase();
	if (!cleanLabel || cleanLabel.length > 200 || !/^[a-z0-9-]+$/.test(cleanIcon)) return null;
	if (!(await lucideIconSvg(cleanIcon))) return null;
	const db = await getDb();
	const id = await generateUniquePublicId(SERVICE_ID_PREFIX, async (candidate) => {
		const [existing] = await db.select({ id: offerServices.id }).from(offerServices).where(eq(offerServices.id, candidate)).limit(1);
		return Boolean(existing);
	});
	const [latest] = await db.select({ sortOrder: offerServices.sortOrder }).from(offerServices).orderBy(desc(offerServices.sortOrder)).limit(1);
	const [row] = await db.insert(offerServices).values({
		id,
		label: cleanLabel,
		labelEn: cleanLabel,
		icon: cleanIcon,
		sortOrder: (latest?.sortOrder ?? -1) + 1
	}).returning();
	return row ? catalogService(row) : null;
}

export async function replaceOfferServiceLinks(db: Executor, offerId: string, serviceIds: readonly string[]) {
	await db.delete(offerServiceLinks).where(eq(offerServiceLinks.offerId, offerId));
	const uniqueIds = serviceIds.filter((serviceId, index) => serviceIds.indexOf(serviceId) === index);
	if (!uniqueIds.length) return;
	const known = await db.select({ id: offerServices.id }).from(offerServices).where(inArray(offerServices.id, uniqueIds));
	const knownIds = new Set(known.map((row) => row.id));
	const values = uniqueIds.filter((serviceId) => knownIds.has(serviceId)).map((serviceId, position) => ({
		offerId,
		serviceId,
		position
	}));
	if (values.length) await db.insert(offerServiceLinks).values(values);
}
