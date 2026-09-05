import { isDeferredEventTime, isValidEventTimeRange } from './event-time';
import type { Locale } from './i18n';

export type Capacity = 15 | 30 | 50;
export type Equipment = 'projector' | 'tv' | 'none';
export type Lunch = 'pizza' | 'custom' | 'none' | 'self-organized';
export type ToolProvision = 'existing' | 'needed';
export type DeviceProvision = 'existing' | 'needed';
export type CodingTool = 'github-copilot' | 'codex' | 'claude-code' | 'cursor' | 'devin' | 'opencode' | 'antigravity' | 'custom';
export const PROVIDED_CODING_TOOLS: CodingTool[] = ['codex', 'cursor', 'claude-code'];

export const CODING_TOOLS: ReadonlyArray<{ id: CodingTool; label: string; icon?: string }> = [
	{ id: 'github-copilot', label: 'GitHub Copilot', icon: '/images/coding-tools/github-copilot.png' },
	{ id: 'codex', label: 'Codex', icon: '/images/coding-tools/codex.png' },
	{ id: 'claude-code', label: 'Claude Code', icon: '/images/coding-tools/claude-code.png' },
	{ id: 'cursor', label: 'Cursor', icon: '/images/coding-tools/cursor.png' },
	{ id: 'devin', label: 'Devin', icon: '/images/coding-tools/devin.png' },
	{ id: 'opencode', label: 'opencode', icon: '/images/coding-tools/opencode.png' },
	{ id: 'antigravity', label: 'Antigravity', icon: '/images/coding-tools/antigravity.png' },
	{ id: 'custom', label: 'Custom' }
];

export interface EventAddress {
	label: string;
	street: string;
	postalCode: string;
	city: string;
	country: 'Deutschland';
	latitude?: number;
	longitude?: number;
}

export interface BillingDetails {
	companyName: string;
	legalForm: string;
	contactName: string;
	email: string;
	vatId: string;
	purchaseOrder: string;
	address: {
		street: string;
		postalCode: string;
		city: string;
		country: 'Deutschland';
	};
}

export interface BookingConfiguration {
	locale?: Locale;
	capacity: Capacity;
	venueProvided: boolean;
	equipment: Equipment;
	lunch: Lunch;
	customLunch: string;
	toolProvision: ToolProvision | null;
	codingTools: CodingTool[];
	customCodingTool: string;
	deviceProvision: DeviceProvision | null;
	deviceCount: number;
	eventPhotos?: boolean;
	companyName: string;
	contactName: string;
	email: string;
	phone: string;
	message: string;
	address: EventAddress;
	eventStart: string | null;
	eventEnd: string | null;
	consultationSlot: string;
	billing?: BillingDetails;
	businessCustomerConfirmed?: boolean;
	authorityConfirmed?: boolean;
}

export const CAPACITY_PRICES: Record<Capacity, number> = {
	15: 4000,
	30: 5000,
	50: 6000
};

export const VENUE_SURCHARGES: Record<Capacity, number> = {
	15: 500,
	30: 1000,
	50: 1500
};
export const CUSTOM_LUNCH_SURCHARGE = 500;
export const NO_LUNCH_DISCOUNT = -500;
export const TOOLS_SURCHARGES: Record<Capacity, number> = {
	15: 500,
	30: 1000,
	50: 1500
};
export const DEVICE_PRICE = 150;

export const STANDARD_HACKATHON_OPTIONS = {
	venueProvided: true,
	lunch: 'pizza',
	customLunch: '',
	deviceProvision: 'existing',
	deviceCount: 0,
	eventPhotos: true
} as const;

export function getPrice(
	capacity: Capacity,
	venueProvided: boolean,
	lunch: Lunch = 'pizza',
	toolProvision: ToolProvision | null = null,
	deviceProvision: DeviceProvision | null = null,
	deviceCount = 0
) {
	const basePrice = CAPACITY_PRICES[capacity];
	const venueSurcharge = venueProvided ? 0 : VENUE_SURCHARGES[capacity];
	const lunchAdjustment = lunch === 'custom' ? CUSTOM_LUNCH_SURCHARGE : lunch === 'none' || lunch === 'self-organized' ? NO_LUNCH_DISCOUNT : 0;
	const toolsAdjustment = toolProvision === 'needed' ? TOOLS_SURCHARGES[capacity] : 0;
	const devicesAdjustment = deviceProvision === 'needed' ? deviceCount * DEVICE_PRICE : 0;
	return { basePrice, venueSurcharge, lunchAdjustment, toolsAdjustment, devicesAdjustment, totalPrice: basePrice + venueSurcharge + lunchAdjustment + toolsAdjustment + devicesAdjustment };
}

export function selectedCodingToolLabels(config: Pick<BookingConfiguration, 'codingTools' | 'customCodingTool'>) {
	const selected = new Set(config.codingTools);
	return CODING_TOOLS
		.filter(({ id }) => selected.has(id))
		.map(({ id, label }) => id === 'custom' ? config.customCodingTool.trim() || label : label);
}

export function bookingMetadata(config: BookingConfiguration): Record<string, string> {
	const price = getPrice(config.capacity, config.venueProvided, config.lunch, config.toolProvision, config.deviceProvision, config.deviceCount);
	return {
		company: config.companyName,
		capacity: String(config.capacity),
		eventStart: config.eventStart ?? 'to_be_scheduled',
		eventEnd: config.eventEnd ?? 'to_be_scheduled',
		venueProvided: String(config.venueProvided),
		equipment: config.equipment,
		lunch: config.lunch,
		customLunch: config.lunch === 'custom' ? config.customLunch : '',
		toolProvision: config.toolProvision ?? '',
		codingTools: selectedCodingToolLabels(config).join(', '),
		customCodingTool: config.codingTools.includes('custom') ? config.customCodingTool : '',
		deviceProvision: config.deviceProvision ?? '',
		deviceCount: String(config.deviceCount),
		eventPhotos: String(config.eventPhotos),
		address: [config.address.street, config.address.postalCode, config.address.city].join(', '),
		message: config.message.trim(),
		totalPrice: String(price.totalPrice)
	};
}

export function hackathonCalendarLocation(config: BookingConfiguration) {
	return config.venueProvided
		? [config.address.street, `${config.address.postalCode} ${config.address.city}`, config.address.country].filter(Boolean).join(', ')
		: undefined;
}

export function formatPrice(value: number, locale: Locale = 'de') {
	return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'de-DE', {
		style: 'currency',
		currency: 'EUR',
		maximumFractionDigits: 0
	}).format(value);
}

export function formatDate(value: string, withTime = false, locale: Locale = 'de') {
	if (!value) return locale === 'en' ? 'Not set' : 'Noch offen';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return locale === 'en' ? 'Not set' : 'Noch offen';
	return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'de-DE', {
		weekday: 'short',
		day: '2-digit',
		month: 'short',
		year: withTime ? undefined : 'numeric',
		hour: withTime ? '2-digit' : undefined,
		minute: withTime ? '2-digit' : undefined,
		timeZone: 'Europe/Berlin'
	}).format(date);
}

export function validateConfiguration(config: BookingConfiguration) {
	const errors: string[] = [];
	const en = config.locale === 'en';
	const message = (de: string, english: string) => en ? english : de;
	if (config.locale !== undefined && config.locale !== 'de' && config.locale !== 'en') errors.push(message('Die Spracheinstellung ist ungültig.', 'The language setting is invalid.'));
	if (![15, 30, 50].includes(config.capacity)) errors.push(message('Bitte wählen Sie eine gültige Teamgröße.', 'Please select a valid team size.'));
	if (typeof config.venueProvided !== 'boolean') errors.push(message('Bitte wählen Sie einen Veranstaltungsort.', 'Please select an event location.'));
	if (!['projector', 'tv', 'none'].includes(config.equipment)) errors.push(message('Bitte wählen Sie ein gültiges Demo Setup.', 'Please select a valid demo setup.'));
	if (!['pizza', 'custom', 'none', 'self-organized'].includes(config.lunch)) errors.push(message('Bitte wählen Sie eine gültige Lunch-Option.', 'Please select a valid lunch option.'));
	if (!config.companyName.trim()) errors.push(message('Bitte geben Sie den Unternehmensnamen an.', 'Please enter the company name.'));
	if (!config.contactName.trim()) errors.push(message('Bitte geben Sie eine Ansprechperson an.', 'Please enter a contact person.'));
	if (!/^\S+@\S+\.\S+$/.test(config.email)) errors.push(message('Bitte geben Sie eine gültige E-Mail-Adresse an.', 'Please enter a valid email address.'));
	if (config.phone.replace(/\D/g, '').length < 6) errors.push(message('Bitte geben Sie eine gültige Telefonnummer an.', 'Please enter a valid phone number.'));
	if (typeof config.message !== 'string' || config.message.length > 500) errors.push(message('Ihre Nachricht darf maximal 500 Zeichen lang sein.', 'Your message may contain no more than 500 characters.'));
	if (!config.address.street.trim() || !config.address.postalCode.trim() || !config.address.city.trim()) {
		errors.push(message('Bitte vervollständigen Sie die Veranstaltungsadresse.', 'Please complete the event address.'));
	}
	if (typeof config.eventPhotos !== 'boolean') errors.push(message('Die Fotoeinstellung ist ungültig.', 'The event photography setting is invalid.'));
	if (!isDeferredEventTime(config.eventStart, config.eventEnd) && !isValidEventTimeRange(config.eventStart, config.eventEnd)) errors.push(message('Bitte wählen Sie einen verfügbaren Hackathon-Termin oder „Später festlegen“.', 'Please select an available hackathon date or “Choose later”.'));
	const consultationDate = new Date(config.consultationSlot);
	if (!config.consultationSlot || Number.isNaN(consultationDate.getTime()) || consultationDate <= new Date()) errors.push(message('Bitte wählen Sie einen zukünftigen Termin für das Erstgespräch.', 'Please select a future preparation call time.'));
	if (config.lunch === 'custom' && !config.customLunch.trim()) errors.push(message('Bitte beschreiben Sie Ihren Catering-Wunsch.', 'Please describe your catering preference.'));
	if (!config.toolProvision || !['existing', 'needed'].includes(config.toolProvision)) {
		errors.push(message('Bitte wählen Sie aus, ob Coding Tools vorhanden sind.', 'Please specify whether coding tools are available.'));
	}
	const codingTools = Array.isArray(config.codingTools) ? config.codingTools : [];
	const validCodingTools = new Set(CODING_TOOLS.map(({ id }) => id));
	if (!codingTools.length) errors.push(message('Bitte wählen Sie mindestens ein Coding Tool.', 'Please select at least one coding tool.'));
	else if (codingTools.some((tool) => !validCodingTools.has(tool))) errors.push(message('Die Auswahl der Coding Tools ist ungültig.', 'The coding tool selection is invalid.'));
	else if (config.toolProvision === 'needed' && codingTools.some((tool) => !PROVIDED_CODING_TOOLS.includes(tool))) errors.push(message('Für den Tag können nur Codex, Cursor oder Claude Code bereitgestellt werden.', 'Only Codex, Cursor, or Claude Code can be provided for the event day.'));
	if (codingTools.includes('custom') && !config.customCodingTool?.trim()) errors.push(message('Bitte geben Sie das individuelle Coding Tool an.', 'Please enter the custom coding tool.'));
	if (!config.deviceProvision || !['existing', 'needed'].includes(config.deviceProvision)) {
		errors.push(message('Bitte wählen Sie aus, ob Geräte vorhanden sind.', 'Please specify whether devices are available.'));
	} else if (!Number.isInteger(config.deviceCount)) {
		errors.push(message('Bitte geben Sie eine gültige ganze Geräteanzahl an.', 'Please enter a valid whole number of devices.'));
	} else if (config.deviceProvision === 'existing' && config.deviceCount !== 0) {
		errors.push(message('Bei eigenen Geräten muss die Geräteanzahl 0 sein.', 'The device count must be zero when using your own devices.'));
	} else if (config.deviceProvision === 'needed' && (config.deviceCount < 1 || config.deviceCount > config.capacity)) {
		errors.push(message(`Bitte wählen Sie zwischen 1 und ${config.capacity} Geräten.`, `Please select between 1 and ${config.capacity} devices.`));
	}
	return errors;
}

export function validateBillingDetails(billing: BillingDetails | null | undefined, locale: Locale = 'de') {
	const errors: string[] = [];
	const en = locale === 'en';
	if (!billing?.companyName?.trim() || !billing.contactName?.trim()) errors.push(en ? 'Please complete the billing details.' : 'Bitte vervollständigen Sie die Rechnungsdaten.');
	if (!/^\S+@\S+\.\S+$/.test(billing?.email ?? '')) errors.push(en ? 'Please enter a valid billing email address.' : 'Bitte geben Sie eine gültige Rechnungs-E-Mail-Adresse an.');
	if (!billing?.address?.street?.trim() || !billing.address.postalCode?.trim() || !billing.address.city?.trim()) {
		errors.push(en ? 'Please complete the billing address.' : 'Bitte vervollständigen Sie die Rechnungsanschrift.');
	}
	return errors;
}

export function validateInquiryConfiguration(config: BookingConfiguration) {
	const errors = validateConfiguration(config);
	const en = config.locale === 'en';
	if (config.venueProvided !== STANDARD_HACKATHON_OPTIONS.venueProvided) errors.push(en ? 'Hackathons take place exclusively at the customer’s premises.' : 'Hackathons finden ausschließlich in den Räumen des Kunden statt.');
	if (config.lunch !== STANDARD_HACKATHON_OPTIONS.lunch || config.customLunch !== '') errors.push(en ? 'The standard offer includes pizza catering only.' : 'Im Standardangebot ist ausschließlich Pizza-Catering vorgesehen.');
	if (config.deviceProvision !== STANDARD_HACKATHON_OPTIONS.deviceProvision || config.deviceCount !== 0) errors.push(en ? 'The hackathon uses customer-provided devices only.' : 'Für den Hackathon werden ausschließlich Kundengeräte verwendet.');
	if (config.eventPhotos !== STANDARD_HACKATHON_OPTIONS.eventPhotos) errors.push(en ? 'Event photography is part of the standard offer.' : 'Der Eventfoto-Service ist Bestandteil des Standardangebots.');
	return errors;
}

export function validateContractReadiness(config: BookingConfiguration) {
	return [...validateConfiguration(config), ...validateBillingDetails(config.billing, config.locale)];
}
