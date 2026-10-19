import { eq } from 'drizzle-orm';
import { randomBytes, randomUUID } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import { getDb } from './db';
import { account, passkey, user } from './db/schema';
import { normalizeEmail } from './admin-auth';
import { getDashboardSummary } from './admin-bookings';

export interface AdminUserRow {
	id: string;
	name: string;
	email: string;
	createdAt: Date | string;
	hasPasskey: boolean;
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
	const db = await getDb();
	const rows = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			createdAt: user.createdAt,
			passkeyId: passkey.id
		})
		.from(user)
		.leftJoin(passkey, eq(passkey.userId, user.id))
		.orderBy(user.createdAt);

	const byId = new Map<string, AdminUserRow>();
	for (const row of rows) {
		const existing = byId.get(row.id);
		if (existing) {
			existing.hasPasskey = existing.hasPasskey || Boolean(row.passkeyId);
			continue;
		}
		byId.set(row.id, {
			id: row.id,
			name: row.name,
			email: row.email,
			createdAt: row.createdAt,
			hasPasskey: Boolean(row.passkeyId)
		});
	}
	return [...byId.values()];
}

export async function getAdminUserSummary() {
	const users = await listAdminUsers();
	return {
		userCount: users.length,
		passkeyReadyCount: users.filter((entry) => entry.hasPasskey).length
	};
}

export function generateInitialPassword(length = 16) {
	const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
	const bytes = randomBytes(length);
	return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

export async function createAdminUser(input: { name: string; email: string }) {
	const email = normalizeEmail(input.email);
	const name = input.name.trim();
	if (!name) throw new Error('Name is required.');
	if (!email || !email.includes('@')) throw new Error('E-Mail is invalid.');

	const db = await getDb();
	const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
	if (existing) throw new Error('A user with this email already exists.');

	const initialPassword = generateInitialPassword();
	const passwordHash = await hashPassword(initialPassword);
	const id = randomUUID();
	const now = new Date();

	await db.insert(user).values({
		id,
		name,
		email,
		emailVerified: true,
		createdAt: now,
		updatedAt: now
	});
	await db.insert(account).values({
		id: randomUUID(),
		accountId: id,
		providerId: 'credential',
		userId: id,
		password: passwordHash,
		createdAt: now,
		updatedAt: now
	});

	return { id, email, name, initialPassword };
}

export async function deleteAdminUser(id: string, actorId: string) {
	if (!id) throw new Error('User id is required.');
	if (id === actorId) throw new Error('You cannot delete your own account.');

	const db = await getDb();
	const [target] = await db.select({ id: user.id }).from(user).where(eq(user.id, id)).limit(1);
	if (!target) throw new Error('User not found.');

	const users = await listAdminUsers();
	if (users.length <= 1) throw new Error('The last admin user cannot be deleted.');

	await db.delete(user).where(eq(user.id, id));
	return { id };
}

export async function getDashboardCombinedSummary() {
	const [bookingSummary, userSummary] = await Promise.all([getDashboardSummary(), getAdminUserSummary()]);
	return { ...bookingSummary, ...userSummary };
}
