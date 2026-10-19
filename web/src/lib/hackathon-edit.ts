import {
	CODING_TOOLS,
	type BillingDetails,
	type BookingConfiguration,
	type Capacity,
	type CodingTool,
	type DeviceProvision,
	type Equipment,
	type EventAddress,
	type Lunch,
	type ToolProvision
} from './booking';
import type { Locale } from './i18n';
import { localeMessage } from './locale-message';

export type HackathonUpdate =
	| { section: 'capacity'; capacity: Capacity }
	| { section: 'venue'; venueProvided: boolean }
	| { section: 'tools'; toolProvision: ToolProvision; codingTools: CodingTool[]; customCodingTool: string }
	| { section: 'devices'; deviceProvision: DeviceProvision; deviceCount: number }
	| { section: 'equipment'; equipment: Equipment }
	| { section: 'lunch'; lunch: Lunch; customLunch: string }
	| { section: 'address'; address: EventAddress }
	| { section: 'event-time'; eventStart: string; eventEnd: string }
	| { section: 'prep-call'; consultationSlot: string }
	| { section: 'company'; companyName: string }
	| { section: 'contact'; contactName: string; email: string; phone: string }
	| { section: 'billing'; billing: BillingDetails }
	| { section: 'message'; message: string };

export class HackathonUpdateError extends Error {}

function object(value: unknown, locale: Locale): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HackathonUpdateError(localeMessage(locale, 'Die Änderungen sind ungültig.', 'The changes are invalid.'));
	return value as Record<string, unknown>;
}

function string(value: unknown, deLabel: string, enLabel: string, locale: Locale, max = 500) {
	if (typeof value !== 'string' || value.length > max) throw new HackathonUpdateError(localeMessage(locale, `${deLabel} ist ungültig.`, `${enLabel} is invalid.`));
	return value;
}

function parseAddress(value: unknown, locale: Locale): EventAddress {
	const address = object(value, locale);
	const latitude = address.latitude;
	const longitude = address.longitude;
	if (address.country !== 'Deutschland'
		|| (latitude !== undefined && (typeof latitude !== 'number' || !Number.isFinite(latitude)))
		|| (longitude !== undefined && (typeof longitude !== 'number' || !Number.isFinite(longitude)))) {
		throw new HackathonUpdateError(localeMessage(locale, 'Die Veranstaltungsadresse ist ungültig.', 'The event address is invalid.'));
	}
	return {
		label: string(address.label, 'Die Adressbezeichnung', 'The address label', locale),
		street: string(address.street, 'Die Straße', 'The street', locale),
		postalCode: string(address.postalCode, 'Die Postleitzahl', 'The postal code', locale),
		city: string(address.city, 'Der Ort', 'The city', locale),
		country: 'Deutschland',
		...(typeof latitude === 'number' ? { latitude } : {}),
		...(typeof longitude === 'number' ? { longitude } : {})
	};
}

function parseBilling(value: unknown, locale: Locale): BillingDetails {
	const billing = object(value, locale);
	const address = object(billing.address, locale);
	if (address.country !== 'Deutschland') throw new HackathonUpdateError(localeMessage(locale, 'Die Rechnungsanschrift ist ungültig.', 'The billing address is invalid.'));
	return {
		companyName: string(billing.companyName, 'Der Rechnungsempfänger', 'The billing recipient', locale, 160),
		legalForm: string(billing.legalForm, 'Die Rechtsform', 'The legal form', locale, 80),
		contactName: string(billing.contactName, 'Der Rechnungskontakt', 'The billing contact', locale, 160),
		email: string(billing.email, 'Die Rechnungs-E-Mail', 'The billing email', locale, 320),
		vatId: string(billing.vatId, 'Die USt-IdNr.', 'The VAT ID', locale, 40),
		purchaseOrder: string(billing.purchaseOrder, 'Die Bestellnummer', 'The purchase order', locale, 120),
		address: {
			street: string(address.street, 'Die Rechnungsstraße', 'The billing street', locale, 200),
			postalCode: string(address.postalCode, 'Die Rechnungspostleitzahl', 'The billing postal code', locale, 20),
			city: string(address.city, 'Der Rechnungsort', 'The billing city', locale, 120),
			country: 'Deutschland'
		}
	};
}

export function parseHackathonUpdate(value: unknown, locale: Locale = 'de'): HackathonUpdate {
	const update = object(value, locale);
	const invalid = (de: string, en: string) => new HackathonUpdateError(localeMessage(locale, de, en));
	switch (update.section) {
		case 'capacity':
			if (![15, 30, 50].includes(update.capacity as number)) throw invalid('Die Teamgröße ist ungültig.', 'The team size is invalid.');
			return { section: update.section, capacity: update.capacity as Capacity };
		case 'venue':
			if (typeof update.venueProvided !== 'boolean') throw invalid('Der Veranstaltungsort ist ungültig.', 'The event location is invalid.');
			return { section: update.section, venueProvided: update.venueProvided };
		case 'tools': {
			if (!['existing', 'needed'].includes(update.toolProvision as string)) throw invalid('Die Tool-Auswahl ist ungültig.', 'The tool selection is invalid.');
			const validTools = new Set(CODING_TOOLS.map(({ id }) => id));
			if (!Array.isArray(update.codingTools) || update.codingTools.some((tool) => !validTools.has(tool as CodingTool))) {
				throw invalid('Die Tool-Auswahl ist ungültig.', 'The tool selection is invalid.');
			}
			return {
				section: update.section,
				toolProvision: update.toolProvision as ToolProvision,
				codingTools: update.codingTools as CodingTool[],
				customCodingTool: string(update.customCodingTool, 'Das individuelle Coding Tool', 'The custom coding tool', locale)
			};
		}
		case 'equipment':
			if (!['projector', 'tv', 'none'].includes(update.equipment as string)) throw invalid('Das Demo Setup ist ungültig.', 'The demo setup is invalid.');
			return { section: update.section, equipment: update.equipment as Equipment };
		case 'devices':
			if (!['existing', 'needed'].includes(update.deviceProvision as string) || !Number.isInteger(update.deviceCount)) {
				throw invalid('Die Geräteauswahl ist ungültig.', 'The device selection is invalid.');
			}
			return { section: update.section, deviceProvision: update.deviceProvision as DeviceProvision, deviceCount: update.deviceCount as number };
		case 'lunch':
			if (!['pizza', 'custom', 'none', 'self-organized'].includes(update.lunch as string)) throw invalid('Die Lunch-Auswahl ist ungültig.', 'The lunch selection is invalid.');
			return { section: update.section, lunch: update.lunch as Lunch, customLunch: string(update.customLunch, 'Der Catering-Wunsch', 'The catering preference', locale) };
		case 'address':
			return { section: update.section, address: parseAddress(update.address, locale) };
		case 'event-time':
			return {
				section: update.section,
				eventStart: string(update.eventStart, 'Der Veranstaltungsbeginn', 'The event start', locale, 64),
				eventEnd: string(update.eventEnd, 'Das Veranstaltungsende', 'The event end', locale, 64)
			};
		case 'prep-call':
			return { section: update.section, consultationSlot: string(update.consultationSlot, 'Der Vorbereitungstermin', 'The preparation call', locale, 64) };
		case 'company':
			return { section: update.section, companyName: string(update.companyName, 'Der Unternehmensname', 'The company name', locale, 160) };
		case 'contact':
			return {
				section: update.section,
				contactName: string(update.contactName, 'Die Ansprechperson', 'The contact person', locale, 160),
				email: string(update.email, 'Die E-Mail-Adresse', 'The email address', locale, 320),
				phone: string(update.phone, 'Die Telefonnummer', 'The phone number', locale, 80)
			};
		case 'billing':
			return { section: update.section, billing: parseBilling(update.billing, locale) };
		case 'message':
			return { section: update.section, message: string(update.message, 'Ihre Nachricht', 'Your message', locale) };
		default:
			throw invalid('Der zu bearbeitende Bereich ist ungültig.', 'The section to edit is invalid.');
	}
}

export function applyHackathonUpdate(config: BookingConfiguration, update: HackathonUpdate): BookingConfiguration {
	switch (update.section) {
		case 'capacity': return { ...config, capacity: update.capacity, deviceCount: config.deviceProvision === 'needed' ? Math.min(config.deviceCount, update.capacity) : 0 };
		case 'venue': return { ...config, venueProvided: update.venueProvided };
		case 'tools': return { ...config, toolProvision: update.toolProvision, codingTools: update.codingTools, customCodingTool: update.customCodingTool };
		case 'devices': return { ...config, deviceProvision: update.deviceProvision, deviceCount: update.deviceProvision === 'needed' ? update.deviceCount : 0 };
		case 'equipment': return { ...config, equipment: update.equipment };
		case 'lunch': return { ...config, lunch: update.lunch, customLunch: update.lunch === 'custom' ? update.customLunch : '' };
		case 'address': return { ...config, address: update.address };
		case 'event-time': return { ...config, eventStart: update.eventStart, eventEnd: update.eventEnd };
		case 'prep-call': return { ...config, consultationSlot: update.consultationSlot };
		case 'company': return { ...config, companyName: update.companyName };
		case 'contact': return { ...config, contactName: update.contactName, email: update.email, phone: update.phone };
		case 'billing': return { ...config, billing: update.billing };
		case 'message': return { ...config, message: update.message };
	}
}
