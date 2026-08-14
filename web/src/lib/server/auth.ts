import { building, dev } from '$app/environment';
import { getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';
import { passkey } from '@better-auth/passkey';
import { betterAuth } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { createHash, timingSafeEqual } from 'node:crypto';
import { getDb } from './db';
import * as schema from './db/schema';

const DEVELOPMENT_AUTH_SECRET = 'all-in-agi-local-development-auth-secret-2026';
const DEVELOPMENT_AUTH_URL = 'http://localhost:5173';

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

function rejectSeedLogin() {
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
			if (!seedEmail || email !== seedEmail || !secretEquals(ctx.body?.password, seedPassword)) {
				rejectSeedLogin();
			}

			if (ctx.path === '/sign-in/email') {
				const user = await ctx.context.adapter.findOne<{ id: string }>({
					model: 'user',
					where: [{ field: 'email', value: seedEmail }]
				});
				if (user) {
					const registeredPasskey = await ctx.context.adapter.findOne({
						model: 'passkey',
						where: [{ field: 'userId', value: user.id }]
					});
					if (registeredPasskey) rejectSeedLogin();
				}
			}

			if (ctx.path === '/sign-up/email') {
				return {
					context: {
						...ctx,
						body: { ...ctx.body, email: seedEmail, name: 'ALL IN AGI Admin' }
					}
				};
			}
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

