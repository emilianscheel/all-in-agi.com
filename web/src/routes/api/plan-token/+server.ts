import { encryptPlan } from '$lib/server/plan-token';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
	try {
		const token = await encryptPlan(await request.json());
		return json({ token });
	} catch (error) {
		return json({ message: error instanceof Error ? error.message : 'Plan-Link konnte nicht erstellt werden.' }, { status: 400 });
	}
}
