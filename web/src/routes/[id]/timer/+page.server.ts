import { error, redirect } from '@sveltejs/kit';
import { isHackathonId } from '$lib/public-id';
import { getPublicHackathonTimer } from '$lib/server/hackathons';

export async function load({ params }) {
	const canonicalId = params.id.toUpperCase();
	if (!isHackathonId(canonicalId)) error(404, 'Hackathon nicht gefunden');
	if (params.id !== canonicalId) redirect(308, `/${canonicalId}/timer`);
	const hackathon = await getPublicHackathonTimer(canonicalId);
	if (!hackathon) error(404, 'Hackathon nicht gefunden');
	return { hackathon };
}
