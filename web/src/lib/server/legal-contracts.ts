import { createHash, randomUUID } from 'node:crypto';
import { and, eq, inArray, lte } from 'drizzle-orm';
import type { BookingConfiguration } from '$lib/booking';
import {
	LEGAL_DOCUMENT_STATUS,
	legalVersion,
	legalDocumentPlainText,
	legalModulesForConfiguration,
	type LegalDocumentSnapshot
} from '$lib/legal';
import { getDb } from './db';
import { contractEvents, hackathons, legalDocumentVersions } from './db/schema';

function berlinDateParts(date: Date) {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
		hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
	}).formatToParts(date);
	const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
	return { year: value('year'), month: value('month'), day: value('day'), hour: value('hour'), minute: value('minute'), second: value('second') };
}

function easterSunday(year: number) {
	const a = year % 19;
	const b = Math.floor(year / 100);
	const c = year % 100;
	const d = Math.floor(b / 4);
	const e = b % 4;
	const f = Math.floor((b + 8) / 25);
	const g = Math.floor((b - f + 1) / 3);
	const h = (19 * a + b - d - g + 15) % 30;
	const i = Math.floor(c / 4);
	const k = c % 4;
	const l = (32 + 2 * e + 2 * i - h - k) % 7;
	const m = Math.floor((a + 11 * h + 22 * l) / 451);
	const month = Math.floor((h + l - 7 * m + 114) / 31);
	const day = ((h + l - 7 * m + 114) % 31) + 1;
	return new Date(Date.UTC(year, month - 1, day));
}

function isoDay(date: Date) {
	return date.toISOString().slice(0, 10);
}

export function berlinPublicHolidays(year: number) {
	const easter = easterSunday(year);
	const relative = (days: number) => isoDay(new Date(easter.getTime() + days * 86_400_000));
	return new Set([
		`${year}-01-01`, `${year}-03-08`, relative(-2), relative(1), `${year}-05-01`,
		relative(39), relative(50), `${year}-10-03`, `${year}-12-25`, `${year}-12-26`
	]);
}

function isBerlinBusinessDay(date: Date) {
	const weekday = date.getUTCDay();
	if (weekday === 0 || weekday === 6) return false;
	return !berlinPublicHolidays(date.getUTCFullYear()).has(isoDay(date));
}

export function addBerlinBusinessDays(value: Date, days: number) {
	const parts = berlinDateParts(value);
	let cursor = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
	let remaining = days;
	while (remaining > 0) {
		cursor = new Date(cursor.getTime() + 86_400_000);
		if (isBerlinBusinessDay(cursor)) remaining -= 1;
	}
	const targetParts = { year: cursor.getUTCFullYear(), month: cursor.getUTCMonth() + 1, day: cursor.getUTCDate(), hour: parts.hour, minute: parts.minute, second: parts.second };
	let timestamp = Date.UTC(targetParts.year, targetParts.month - 1, targetParts.day, targetParts.hour, targetParts.minute, targetParts.second);
	for (let attempt = 0; attempt < 3; attempt += 1) {
		const actual = berlinDateParts(new Date(timestamp));
		const desiredWallTime = Date.UTC(targetParts.year, targetParts.month - 1, targetParts.day, targetParts.hour, targetParts.minute, targetParts.second);
		const actualWallTime = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
		timestamp += desiredWallTime - actualWallTime;
	}
	return new Date(timestamp);
}

export function createLegalSnapshot(config: BookingConfiguration, capturedAt = new Date()): LegalDocumentSnapshot {
	const modules = legalModulesForConfiguration(config);
	const locale = config.locale ?? 'de';
	const content = legalDocumentPlainText(modules, locale);
	const contentHash = createHash('sha256').update(content, 'utf8').digest('hex');
	return { locale, version: legalVersion(locale), contentHash, modules, content, capturedAt: capturedAt.toISOString() };
}

export async function registerLegalSnapshot(snapshot: LegalDocumentSnapshot) {
	const db = await getDb();
	await db.insert(legalDocumentVersions).values({
		version: snapshot.version,
		contentHash: snapshot.contentHash,
		status: LEGAL_DOCUMENT_STATUS,
		content: snapshot.content
	}).onConflictDoNothing({ target: legalDocumentVersions.version });
}

async function appendContractEvent(hackathonId: string, type: string, actor: string, payload: Record<string, unknown>, occurredAt: string) {
	const db = await getDb();
	await db.insert(contractEvents).values({ id: randomUUID(), hackathonId, type, actor, payload, occurredAt });
}

export async function recordBillingDetailsUpdated(id: string, actor: 'admin' | 'customer', now = new Date()) {
	await appendContractEvent(id, 'billing_details_updated', actor, {}, now.toISOString());
}

export async function recordOralAgreement(id: string, customerName: string, organizerName: string, agreedAt = new Date()) {
	const at = agreedAt.toISOString();
	const exitDeadline = addBerlinBusinessDays(agreedAt, 2).toISOString();
	const db = await getDb();
	const [record] = await db.update(hackathons).set({
		status: 'exit_window', customerAgreementName: customerName.trim(), organizerAgreementName: organizerName.trim(),
		oralAgreementAt: at, exitDeadline, legalAcknowledgedAt: at,
		businessCustomerConfirmed: true, authorityConfirmed: true, updatedAt: at
	}).where(and(eq(hackathons.id, id), inArray(hackathons.status, ['requested', 'prep_scheduled']))).returning();
	if (!record) return null;
	await appendContractEvent(id, 'oral_agreement_recorded', organizerName, {
		customerName, organizerName, exitDeadline, legalVersion: record.legalVersion, legalContentHash: record.legalContentHash
	}, at);
	return record;
}

export async function finalizeDueContracts(now = new Date()) {
	const at = now.toISOString();
	const db = await getDb();
	const records = await db.update(hackathons).set({ status: 'contracted', contractedAt: at, updatedAt: at })
		.where(and(eq(hackathons.status, 'exit_window'), lte(hackathons.exitDeadline, at))).returning();
	for (const record of records) await appendContractEvent(record.id, 'exit_window_elapsed', 'system', {}, at);
	return records;
}

export async function withdrawContract(id: string, by: 'customer' | 'organizer', reason = '', now = new Date()) {
	const at = now.toISOString();
	const db = await getDb();
	const [record] = await db.update(hackathons).set({
		status: 'withdrawn', withdrawnAt: at, withdrawnBy: by, withdrawalReason: reason.trim(), updatedAt: at
	}).where(and(eq(hackathons.id, id), eq(hackathons.status, 'exit_window'))).returning();
	if (record) await appendContractEvent(id, 'contract_withdrawn', by, { reason }, at);
	return record ?? null;
}

export async function markContractCompleted(id: string, actor: string, now = new Date()) {
	const at = now.toISOString();
	const db = await getDb();
	const [record] = await db.update(hackathons).set({ status: 'completed', updatedAt: at })
		.where(and(eq(hackathons.id, id), inArray(hackathons.status, ['contracted', 'confirmed']))).returning();
	if (record) await appendContractEvent(id, 'contract_completed', actor, {}, at);
	return record ?? null;
}
