import { localizedPath } from '$lib/i18n';
import { isOfferId } from '$lib/public-id';
import { listAttachableBookings } from '$lib/server/admin-bookings';
import { bookingForOffer, getOffer, listOfferSummaries } from '$lib/server/offers';
import { listClientLogos, listOfferServices } from '$lib/server/offer-catalog';
import { error, redirect } from '@sveltejs/kit';

export async function load({ locals, params }) {
	if (!locals.admin.authorized) redirect(303, localizedPath(locals.locale, '/dashboard'));
	const id = params.token.toUpperCase();
	if (!isOfferId(id)) error(404, locals.locale === 'en' ? 'Offer not found' : 'Angebot nicht gefunden');
	const offer = await getOffer(id);
	if (!offer) error(404, locals.locale === 'en' ? 'Offer not found' : 'Angebot nicht gefunden');
	const [offers, bookings, attached, logos, services] = await Promise.all([
		listOfferSummaries(),
		listAttachableBookings(),
		bookingForOffer(id),
		listClientLogos(),
		listOfferServices()
	]);
	const bookingChoices = attached && !bookings.some((booking) => booking.id === attached.id)
		? [attached, ...bookings]
		: bookings;
	return {
		offerId: offer.id,
		config: offer.config,
		offers,
		bookings: bookingChoices,
		hackathonId: attached?.id ?? null,
		logos,
		services
	};
}
