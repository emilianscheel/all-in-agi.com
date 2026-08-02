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

function adjustmentLabel(value: number) {
	if (!value) return 'Inklusive';
	return `${value > 0 ? '+' : '−'} ${formatPrice(Math.abs(value))}`;
}

function lunchLabel(config: BookingConfiguration) {
	switch (config.lunch) {
		case 'pizza': return 'Pizza';
		case 'custom': return config.customLunch.trim() || 'Custom Catering';
		case 'self-organized': return 'Selbstorganisiert';
		case 'none': return 'Ohne Lunch';
	}
}

export function bookingOverviewRows(
	config: BookingConfiguration,
	booking?: BookingResultSummary
): BookingOverviewRow[] {
	const price = getPrice(config.capacity, config.venueProvided, config.lunch, config.toolProvision);
	const toolLabels = selectedCodingToolLabels(config).join(', ') || 'Noch keine Tools ausgewählt';
	const toolsContext = config.toolProvision === 'needed'
		? 'Für den Tag benötigt'
		: config.toolProvision === 'existing'
			? 'Bereits vorhanden'
			: 'Noch offen';
	const prepCallStart = booking?.start || config.consultationSlot;

	return [
		{
			id: 'team',
			label: 'Team',
			value: `Bis ${config.capacity} Personen`,
			status: formatPrice(price.basePrice)
		},
		{
			id: 'location',
			label: 'Location',
			value: config.venueProvided ? 'Wir kommen zu Ihnen' : 'Location wird bestätigt',
			status: config.venueProvided ? 'Inklusive' : formatPrice(price.venueSurcharge)
		},
		{
			id: 'tools',
			label: 'Coding Tools',
			value: `${toolsContext}: ${toolLabels}`,
			status: adjustmentLabel(price.toolsAdjustment)
		},
		{
			id: 'equipment',
			label: 'Demo Setup',
			value: config.equipment === 'none' ? 'Provided by us' : 'Projector / Display',
			status: 'Inklusive'
		},
		{
			id: 'event-date',
			label: 'Event Date',
			value: formatEventTimeRange(config.eventStart, config.eventEnd),
			status: 'Geplant'
		},
		{
			id: 'prep-call',
			label: 'Prep Call',
			value: `${formatDate(prepCallStart, true)} Uhr`,
			status: 'Gebucht'
		},
		{
			id: 'lunch',
			label: 'Lunch',
			value: lunchLabel(config),
			status: adjustmentLabel(price.lunchAdjustment)
		},
		{
			id: 'winner-poster',
			label: 'Winner Poster',
			value: 'Auszeichnung für das Gewinnerteam',
			status: 'Inklusive'
		},
		{
			id: 'event-photos',
			label: 'Event-Fotos',
			value: 'Dokumentation des Tages',
			status: 'Inklusive'
		},
		{
			id: 'snacks',
			label: 'Snacks',
			value: 'Cookies',
			status: 'Inklusive'
		},
		{
			id: 'travel',
			label: 'Anreise',
			value: 'Innerhalb Deutschlands',
			status: 'Inklusive'
		},
		{
			id: 'total',
			label: 'Gesamt',
			value: 'Gesamt',
			status: `${formatPrice(price.totalPrice)} netto`,
			total: true
		}
	];
}
