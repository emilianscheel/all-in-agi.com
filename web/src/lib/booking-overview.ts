import {
	formatDate,
	formatPrice,
	getPrice,
	selectedCodingToolLabels,
	type BookingConfiguration
} from './booking';
import type { BookingResultSummary } from './booking-ics';
import { formatEventTimeRange } from './event-time';

export type BookingOverviewRowId =
	| 'team'
	| 'location'
	| 'tools'
	| 'devices'
	| 'equipment'
	| 'event-date'
	| 'prep-call'
	| 'lunch'
	| 'winner-poster'
	| 'event-photos'
	| 'snacks'
	| 'travel'
	| 'total';

export interface BookingOverviewRow {
	id: BookingOverviewRowId;
	label: string;
	value: string;
	status: string;
	total?: boolean;
}

function adjustmentLabel(value: number, locale: 'de' | 'en') {
	if (!value) return locale === 'en' ? 'Included' : 'Inklusive';
	return `${value > 0 ? '+' : '−'} ${formatPrice(Math.abs(value), locale)}`;
}

function lunchLabel(config: BookingConfiguration) {
	const locale = config.locale ?? 'de';
	switch (config.lunch) {
		case 'pizza': return 'Pizza';
		case 'custom': return config.customLunch.trim() || 'Custom Catering';
		case 'self-organized': return locale === 'en' ? 'Self-organized' : 'Selbstorganisiert';
		case 'none': return locale === 'en' ? 'No lunch' : 'Ohne Lunch';
	}
}

export function bookingOverviewRows(
	config: BookingConfiguration,
	booking?: BookingResultSummary
): BookingOverviewRow[] {
	const price = getPrice(config.capacity, config.venueProvided, config.lunch, config.toolProvision, config.deviceProvision, config.deviceCount);
	const locale = config.locale ?? 'de';
	const en = locale === 'en';
	const toolLabels = selectedCodingToolLabels(config).join(', ') || (en ? 'No tools selected yet' : 'Noch keine Tools ausgewählt');
	const toolsContext = config.toolProvision === 'needed'
		? (en ? 'Needed for the day' : 'Für den Tag benötigt')
		: config.toolProvision === 'existing'
			? (en ? 'Already available' : 'Bereits vorhanden')
			: (en ? 'Not set' : 'Noch offen');
	const prepCallStart = booking?.start || config.consultationSlot;

	return [
		{
			id: 'team',
			label: 'Team',
			value: en ? `Up to ${config.capacity} people` : `Bis ${config.capacity} Personen`,
			status: formatPrice(price.basePrice, locale)
		},
		{
			id: 'location',
			label: 'Location',
			value: config.venueProvided ? (en ? 'We come to you' : 'Wir kommen zu Ihnen') : (en ? 'Location to be confirmed' : 'Location wird bestätigt'),
			status: config.venueProvided ? (en ? 'Included' : 'Inklusive') : formatPrice(price.venueSurcharge, locale)
		},
		{
			id: 'tools',
			label: 'Coding Tools',
			value: `${toolsContext}: ${toolLabels}`,
			status: adjustmentLabel(price.toolsAdjustment, locale)
		},
		{
			id: 'devices',
			label: 'Devices',
			value: config.deviceProvision === 'needed'
				? (en ? `${config.deviceCount} ${config.deviceCount === 1 ? 'device' : 'devices'} for the day` : `${config.deviceCount} ${config.deviceCount === 1 ? 'Gerät' : 'Geräte'} für den Tag`)
				: config.deviceProvision === 'existing' ? (en ? 'Company laptops or personal devices' : 'Unternehmenslaptops oder private Geräte') : (en ? 'Not set' : 'Noch offen'),
			status: adjustmentLabel(price.devicesAdjustment, locale)
		},
		{
			id: 'equipment',
			label: 'Demo Setup',
			value: config.equipment === 'none' ? 'Provided by us' : 'Projector / Display',
			status: en ? 'Included' : 'Inklusive'
		},
		{
			id: 'event-date',
			label: 'Event Date',
			value: formatEventTimeRange(config.eventStart, config.eventEnd, locale),
			status: config.eventStart ? (en ? 'Planned' : 'Geplant') : (en ? 'Open' : 'Offen')
		},
		{
			id: 'prep-call',
			label: 'Prep Call',
			value: `${formatDate(prepCallStart, true, locale)}${en ? '' : ' Uhr'}`,
			status: en ? 'Booked' : 'Gebucht'
		},
		{
			id: 'lunch',
			label: 'Lunch',
			value: lunchLabel(config),
			status: adjustmentLabel(price.lunchAdjustment, locale)
		},
		{
			id: 'winner-poster',
			label: 'Winner Poster',
			value: en ? 'Award for the winning team' : 'Auszeichnung für das Gewinnerteam',
			status: en ? 'Included' : 'Inklusive'
		},
		{
			id: 'event-photos',
			label: en ? 'Event photos' : 'Event-Fotos',
			value: config.eventPhotos ? (en ? 'Documentation of the day' : 'Dokumentation des Tages') : (en ? 'Not requested' : 'Nicht gewünscht'),
			status: config.eventPhotos ? (en ? 'Included' : 'Inklusive') : (en ? 'Not selected' : 'Abgewählt')
		},
		{
			id: 'snacks',
			label: 'Snacks',
			value: 'Cookies',
			status: en ? 'Included' : 'Inklusive'
		},
		{
			id: 'travel',
			label: en ? 'Travel' : 'Anreise',
			value: en ? 'Within Germany' : 'Innerhalb Deutschlands',
			status: en ? 'Included' : 'Inklusive'
		},
		{
			id: 'total',
			label: en ? 'Total' : 'Gesamt',
			value: en ? 'Total' : 'Gesamt',
			status: `${formatPrice(price.totalPrice, locale)} ${en ? 'net' : 'netto'}`,
			total: true
		}
	];
}
