import { isHackathonId } from '$lib/public-id';

export type ManagedBookingResolution =
	| { ok: true; id: string }
	| { ok: false; id: string; status: 400 | 404; message: string };

export async function resolveManagedHackathonId(raw: unknown, exists: (id: string) => boolean | Promise<boolean>): Promise<ManagedBookingResolution> {
	const id = String(raw ?? '').trim().toUpperCase();
	if (!isHackathonId(id)) return { ok: false, id, status: 400, message: 'Bitte geben Sie eine gültige Hackathon-ID ein.' };
	if (!(await exists(id))) return { ok: false, id, status: 404, message: 'Zu dieser ID wurde keine Buchung gefunden.' };
	return { ok: true, id };
}
