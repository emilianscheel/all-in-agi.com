import { env } from '$env/dynamic/private';
import { finalizeDueContracts } from '$lib/server/legal-contracts';
import { json } from '@sveltejs/kit';

async function run(request: Request) {
	if (!env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${env.CRON_SECRET}`) {
		return json({ message: 'Nicht autorisiert.' }, { status: 401 });
	}
	const finalized = await finalizeDueContracts();
	return json({ finalized: finalized.length, ids: finalized.map(({ id }) => id) });
}

export const GET = ({ request }: { request: Request }) => run(request);
export const POST = ({ request }: { request: Request }) => run(request);

