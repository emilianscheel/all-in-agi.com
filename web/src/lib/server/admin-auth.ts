import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { getDb } from './db';
import { passkey, user } from './db/schema';

export interface SessionUserIdentity {
	id: string;
	email: string;
}

export interface AdminAccessState {
	authenticated: boolean;
	authorized: boolean;
	needsPasskey: boolean;
}

export function normalizeEmail(value: unknown) {
	return String(value ?? '').trim().toLowerCase();
}

export function seedAdminEmail() {
	return normalizeEmail(process.env.SEED_ADMIN_EMAIL);
}

export function seedAdminName() {
	const configured = String(process.env.SEED_ADMIN_NAME ?? '').trim();
	return configured || 'ALL IN AGI Admin';
}

export function isSeedAdminEmail(value: unknown) {
	const configured = seedAdminEmail();
	return Boolean(configured) && normalizeEmail(value) === configured;
}

export async function userHasPasskey(userId: string) {
	const db = await getDb();
	const [record] = await db.select({ id: passkey.id }).from(passkey).where(eq(passkey.userId, userId)).limit(1);
	return Boolean(record);
}

export async function adminAccessFor(userIdentity: SessionUserIdentity | null | undefined): Promise<AdminAccessState> {
	if (!userIdentity) {
		return { authenticated: false, authorized: false, needsPasskey: false };
	}
	const hasPasskey = await userHasPasskey(userIdentity.id);
	return { authenticated: true, authorized: hasPasskey, needsPasskey: !hasPasskey };
}

export async function getAdminLoginState(rawEmail: unknown) {
	const email = normalizeEmail(rawEmail);
	if (!email) return null;
	const db = await getDb();
	const [adminUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
	if (adminUser) {
		return await userHasPasskey(adminUser.id)
			? { method: 'passkey' as const, accountExists: true }
			: { method: 'password' as const, accountExists: true };
	}
	if (isSeedAdminEmail(email)) {
		return { method: 'seed' as const, accountExists: false };
	}
	return null;
}

export function requireAdmin(locals: App.Locals) {
	if (!locals.admin.authorized || !locals.user) error(401, 'Nicht autorisiert');
	return locals.user;
}
