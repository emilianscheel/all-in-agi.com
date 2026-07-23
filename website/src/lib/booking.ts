export type Capacity = 15 | 30 | 50;
export type Equipment = 'projector' | 'tv' | 'none';
export type Lunch = 'pizza' | 'custom' | 'none' | 'self-organized';
export type ToolProvision = 'existing' | 'needed';
export type CodingTool = 'github-copilot' | 'codex' | 'claude-code' | 'cursor' | 'devin' | 'opencode' | 'antigravity' | 'custom';

export const CODING_TOOLS: ReadonlyArray<{ id: CodingTool; label: string }> = [
	{ id: 'github-copilot', label: 'GitHub Copilot' },
	{ id: 'codex', label: 'Codex' },
	{ id: 'claude-code', label: 'Claude Code' },
	{ id: 'cursor', label: 'Cursor' },
	{ id: 'devin', label: 'Devin' },
	{ id: 'opencode', label: 'opencode' },
	{ id: 'antigravity', label: 'Antigravity' },
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
	companyName: string;
	contactName: string;
	email: string;
	phone: string;
	address: EventAddress;
	preferredEventDate: string;
	consultationSlot: string;
}

export const CAPACITY_PRICES: Record<Capacity, number> = {
	15: 4000,
	30: 5000,
	50: 6000
};

export const VENUE_SURCHARGE = 1000;
export const CUSTOM_LUNCH_SURCHARGE = 500;
export const NO_LUNCH_DISCOUNT = -500;
export const TOOLS_SURCHARGE = 500;

export function getPrice(capacity: Capacity, venueProvided: boolean, lunch: Lunch = 'pizza', toolProvision: ToolProvision | null = null) {
	const basePrice = CAPACITY_PRICES[capacity];
	const venueSurcharge = venueProvided ? 0 : VENUE_SURCHARGE;
	const lunchAdjustment = lunch === 'custom' ? CUSTOM_LUNCH_SURCHARGE : lunch === 'none' || lunch === 'self-organized' ? NO_LUNCH_DISCOUNT : 0;
	const toolsAdjustment = toolProvision === 'needed' ? TOOLS_SURCHARGE : 0;
	return { basePrice, venueSurcharge, lunchAdjustment, toolsAdjustment, totalPrice: basePrice + venueSurcharge + lunchAdjustment + toolsAdjustment };
}

export function selectedCodingToolLabels(config: Pick<BookingConfiguration, 'codingTools' | 'customCodingTool'>) {
	const selected = new Set(config.codingTools);
	return CODING_TOOLS
		.filter(({ id }) => selected.has(id))
		.map(({ id, label }) => id === 'custom' ? config.customCodingTool.trim() || label : label);
}

export function bookingMetadata(config: BookingConfiguration): Record<string, string> {
	const price = getPrice(config.capacity, config.venueProvided, config.lunch, config.toolProvision);
	return {
		company: config.companyName,
		capacity: String(config.capacity),
		preferredEventDate: config.preferredEventDate,
		venueProvided: String(config.venueProvided),
		equipment: config.equipment,
		lunch: config.lunch,
		customLunch: config.lunch === 'custom' ? config.customLunch : '',
		toolProvision: config.toolProvision ?? '',
		codingTools: selectedCodingToolLabels(config).join(', '),
		customCodingTool: config.codingTools.includes('custom') ? config.customCodingTool : '',
		address: [config.address.street, config.address.postalCode, config.address.city].join(', '),
		totalPrice: String(price.totalPrice)
	};
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
	if (!config.companyName.trim()) errors.push('Bitte geben Sie den Unternehmensnamen an.');
	if (!config.contactName.trim()) errors.push('Bitte geben Sie eine Ansprechperson an.');
	if (!/^\S+@\S+\.\S+$/.test(config.email)) errors.push('Bitte geben Sie eine gültige E-Mail-Adresse an.');
	if (config.phone.replace(/\D/g, '').length < 6) errors.push('Bitte geben Sie eine gültige Telefonnummer an.');
	if (!config.address.street.trim() || !config.address.postalCode.trim() || !config.address.city.trim()) {
		errors.push('Bitte vervollständigen Sie die Veranstaltungsadresse.');
	}
	if (!config.preferredEventDate || new Date(config.preferredEventDate) <= new Date()) {
		errors.push('Bitte wählen Sie einen zukünftigen Event-Wunschtermin.');
	}
	if (!config.consultationSlot) errors.push('Bitte wählen Sie einen Termin für das Erstgespräch.');
	if (config.lunch === 'custom' && !config.customLunch.trim()) errors.push('Bitte beschreiben Sie Ihren Catering-Wunsch.');
	if (!config.toolProvision || !['existing', 'needed'].includes(config.toolProvision)) {
		errors.push('Bitte wählen Sie aus, ob Coding Tools vorhanden sind.');
	}
	const codingTools = Array.isArray(config.codingTools) ? config.codingTools : [];
	const validCodingTools = new Set(CODING_TOOLS.map(({ id }) => id));
	if (!codingTools.length) errors.push('Bitte wählen Sie mindestens ein Coding Tool.');
	else if (codingTools.some((tool) => !validCodingTools.has(tool))) errors.push('Die Auswahl der Coding Tools ist ungültig.');
	if (codingTools.includes('custom') && !config.customCodingTool?.trim()) errors.push('Bitte geben Sie das individuelle Coding Tool an.');
	return errors;
}
