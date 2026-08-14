import { decryptPlan } from '$lib/server/plan-token';
import { json } from '@sveltejs/kit';

export async function GET({ params }) {
	try {
		return json({ plan: await decryptPlan(params.token) });
	} catch (error) {
		return json({ message: error instanceof Error ? error.message : 'Ungültiger Plan-Link.' }, { status: 400 });
	}
}
