import { isValidEventTimeRange } from './event-time';

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

export interface BookingConfiguration {
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
	companyName: string;
	contactName: string;
	email: string;
	phone: string;
	message: string;
	address: EventAddress;
	eventStart: string;
	eventEnd: string;
	consultationSlot: string;
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
		eventStart: config.eventStart,
		eventEnd: config.eventEnd,
		venueProvided: String(config.venueProvided),
		equipment: config.equipment,
		lunch: config.lunch,
		customLunch: config.lunch === 'custom' ? config.customLunch : '',
		toolProvision: config.toolProvision ?? '',
		codingTools: selectedCodingToolLabels(config).join(', '),
		customCodingTool: config.codingTools.includes('custom') ? config.customCodingTool : '',
		deviceProvision: config.deviceProvision ?? '',
		deviceCount: String(config.deviceCount),
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

export function formatPrice(value: number) {
	return new Intl.NumberFormat('de-DE', {
		style: 'currency',
		currency: 'EUR',
		maximumFractionDigits: 0
	}).format(value);
}

export function formatDate(value: string, withTime = false) {
	if (!value) return 'Noch offen';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'Noch offen';
	return new Intl.DateTimeFormat('de-DE', {
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
	if (![15, 30, 50].includes(config.capacity)) errors.push('Bitte wählen Sie eine gültige Teamgröße.');
	if (typeof config.venueProvided !== 'boolean') errors.push('Bitte wählen Sie einen Veranstaltungsort.');
	if (!['projector', 'tv', 'none'].includes(config.equipment)) errors.push('Bitte wählen Sie ein gültiges Demo Setup.');
	if (!['pizza', 'custom', 'none', 'self-organized'].includes(config.lunch)) errors.push('Bitte wählen Sie eine gültige Lunch-Option.');
	if (!config.companyName.trim()) errors.push('Bitte geben Sie den Unternehmensnamen an.');
	if (!config.contactName.trim()) errors.push('Bitte geben Sie eine Ansprechperson an.');
	if (!/^\S+@\S+\.\S+$/.test(config.email)) errors.push('Bitte geben Sie eine gültige E-Mail-Adresse an.');
	if (config.phone.replace(/\D/g, '').length < 6) errors.push('Bitte geben Sie eine gültige Telefonnummer an.');
	if (typeof config.message !== 'string' || config.message.length > 500) errors.push('Ihre Nachricht darf maximal 500 Zeichen lang sein.');
	if (!config.address.street.trim() || !config.address.postalCode.trim() || !config.address.city.trim()) {
		errors.push('Bitte vervollständigen Sie die Veranstaltungsadresse.');
	}
	if (!isValidEventTimeRange(config.eventStart, config.eventEnd)) errors.push('Bitte wählen Sie einen verfügbaren zukünftigen Hackathon-Termin.');
	const consultationDate = new Date(config.consultationSlot);
	if (!config.consultationSlot || Number.isNaN(consultationDate.getTime()) || consultationDate <= new Date()) errors.push('Bitte wählen Sie einen zukünftigen Termin für das Erstgespräch.');
	if (config.lunch === 'custom' && !config.customLunch.trim()) errors.push('Bitte beschreiben Sie Ihren Catering-Wunsch.');
	if (!config.toolProvision || !['existing', 'needed'].includes(config.toolProvision)) {
		errors.push('Bitte wählen Sie aus, ob Coding Tools vorhanden sind.');
	}
	const codingTools = Array.isArray(config.codingTools) ? config.codingTools : [];
	const validCodingTools = new Set(CODING_TOOLS.map(({ id }) => id));
	if (!codingTools.length) errors.push('Bitte wählen Sie mindestens ein Coding Tool.');
	else if (codingTools.some((tool) => !validCodingTools.has(tool))) errors.push('Die Auswahl der Coding Tools ist ungültig.');
	else if (config.toolProvision === 'needed' && codingTools.some((tool) => !PROVIDED_CODING_TOOLS.includes(tool))) errors.push('Für den Tag können nur Codex, Cursor oder Claude Code bereitgestellt werden.');
	if (codingTools.includes('custom') && !config.customCodingTool?.trim()) errors.push('Bitte geben Sie das individuelle Coding Tool an.');
	if (!config.deviceProvision || !['existing', 'needed'].includes(config.deviceProvision)) {
		errors.push('Bitte wählen Sie aus, ob Geräte vorhanden sind.');
	} else if (!Number.isInteger(config.deviceCount)) {
		errors.push('Bitte geben Sie eine gültige ganze Geräteanzahl an.');
	} else if (config.deviceProvision === 'existing' && config.deviceCount !== 0) {
		errors.push('Bei eigenen Geräten muss die Geräteanzahl 0 sein.');
	} else if (config.deviceProvision === 'needed' && (config.deviceCount < 1 || config.deviceCount > config.capacity)) {
		errors.push(`Bitte wählen Sie zwischen 1 und ${config.capacity} Geräten.`);
	}
	return errors;
}
