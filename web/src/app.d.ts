// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { AuthSession } from '$lib/server/auth';
import type { AdminAccessState } from '$lib/server/admin-auth';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: AuthSession['session'] | null;
			user: AuthSession['user'] | null;
			admin: AdminAccessState;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
