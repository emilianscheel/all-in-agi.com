import { isHackathonId } from '$lib/public-id';
import { getPublicHackathon } from '$lib/server/hackathons';
import { error, redirect } from '@sveltejs/kit';

export async function load({ params }) {
	const canonicalId = params.id.toUpperCase();
	if (!isHackathonId(canonicalId)) error(404, 'Hackathon nicht gefunden');
	if (params.id !== canonicalId) redirect(308, `/${canonicalId}`);
	const hackathon = await getPublicHackathon(canonicalId);
	if (!hackathon) error(404, 'Hackathon nicht gefunden');
	return { hackathon };
}
