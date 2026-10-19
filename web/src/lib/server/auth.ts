import { building, dev } from '$app/environment';
import { getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';
import { passkey } from '@better-auth/passkey';
import { betterAuth } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { createHash, timingSafeEqual } from 'node:crypto';
import { seedAdminName } from './admin-auth';
import { getDb } from './db';
import * as schema from './db/schema';

const DEVELOPMENT_AUTH_SECRET = 'all-in-agi-local-development-auth-secret-2026';
const DEVELOPMENT_AUTH_URL = 'http://localhost:3000';

function configuredSecret() {
	if (env.BETTER_AUTH_SECRET) return env.BETTER_AUTH_SECRET;
	if (dev || building) return DEVELOPMENT_AUTH_SECRET;
	throw new Error('BETTER_AUTH_SECRET ist nicht konfiguriert.');
}

function configuredUrl() {
	if (env.BETTER_AUTH_URL) return env.BETTER_AUTH_URL.replace(/\/$/, '');
	if (dev || building) return DEVELOPMENT_AUTH_URL;
	throw new Error('BETTER_AUTH_URL ist nicht konfiguriert.');
}

function normalizedSeedEmail() {
	return String(env.SEED_ADMIN_EMAIL ?? '').trim().toLowerCase();
}

function secretEquals(candidate: unknown, expected: string) {
	if (typeof candidate !== 'string' || !expected) return false;
	const candidateDigest = createHash('sha256').update(candidate).digest();
	const expectedDigest = createHash('sha256').update(expected).digest();
	return timingSafeEqual(candidateDigest, expectedDigest);
}

function rejectLogin() {
	throw new APIError('UNAUTHORIZED', { message: 'Die Anmeldedaten sind ungültig.' });
}

const baseURL = configuredUrl();
const database = await getDb();

export const auth = betterAuth({
	appName: 'ALL IN AGI Admin',
	baseURL,
	secret: configuredSecret(),
	database: drizzleAdapter(database, { provider: 'pg', schema }),
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 8,
		maxPasswordLength: 128
	},
	hooks: {
		before: createAuthMiddleware(async (ctx) => {
			if (ctx.path !== '/sign-up/email' && ctx.path !== '/sign-in/email') return;
			const email = String(ctx.body?.email ?? '').trim().toLowerCase();
			const seedEmail = normalizedSeedEmail();
			const seedPassword = String(env.SEED_ADMIN_PASSWORD ?? '');

			if (ctx.path === '/sign-up/email') {
				// Public sign-up is only allowed for the seed bootstrap account.
				if (!seedEmail || email !== seedEmail || !secretEquals(ctx.body?.password, seedPassword)) {
					rejectLogin();
				}
				const existing = await ctx.context.adapter.findOne<{ id: string }>({
					model: 'user',
					where: [{ field: 'email', value: seedEmail }]
				});
				if (existing) rejectLogin();
				return {
					context: {
						...ctx,
						body: { ...ctx.body, email: seedEmail, name: seedAdminName() }
					}
				};
			}

			// sign-in/email: any existing user without a passkey may use password once.
			const existingUser = await ctx.context.adapter.findOne<{ id: string }>({
				model: 'user',
				where: [{ field: 'email', value: email }]
			});
			if (!existingUser) {
				// Seed bootstrap path before account exists should use sign-up, not sign-in.
				if (seedEmail && email === seedEmail && secretEquals(ctx.body?.password, seedPassword)) {
					return;
				}
				rejectLogin();
				return;
			}

			const registeredPasskey = await ctx.context.adapter.findOne({
				model: 'passkey',
				where: [{ field: 'userId', value: existingUser.id }]
			});
			if (registeredPasskey) rejectLogin();
		})
	},
	plugins: [
		passkey({
			rpID: new URL(baseURL).hostname,
			rpName: 'ALL IN AGI Admin',
			origin: baseURL,
			authenticatorSelection: {
				residentKey: 'preferred',
				userVerification: 'required'
			}
		}),
		sveltekitCookies(getRequestEvent)
	]
});

export type AuthSession = typeof auth.$Infer.Session;
