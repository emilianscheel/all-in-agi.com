export type Capacity = 15 | 30 | 50;
export type Equipment = 'projector' | 'tv' | 'none';
export type Lunch = 'pizza' | 'custom' | 'none';

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

export function getPrice(capacity: Capacity, venueProvided: boolean, lunch: Lunch = 'pizza') {
	const basePrice = CAPACITY_PRICES[capacity];
	const venueSurcharge = venueProvided ? 0 : VENUE_SURCHARGE;
	const lunchAdjustment = lunch === 'custom' ? CUSTOM_LUNCH_SURCHARGE : lunch === 'none' ? NO_LUNCH_DISCOUNT : 0;
	return { basePrice, venueSurcharge, lunchAdjustment, totalPrice: basePrice + venueSurcharge + lunchAdjustment };
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
	return errors;
}
