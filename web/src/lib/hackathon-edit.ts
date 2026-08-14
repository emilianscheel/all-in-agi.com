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

function object(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HackathonUpdateError('Die Änderungen sind ungültig.');
	return value as Record<string, unknown>;
}

function string(value: unknown, label: string, max = 500) {
	if (typeof value !== 'string' || value.length > max) throw new HackathonUpdateError(`${label} ist ungültig.`);
	return value;
}

function parseAddress(value: unknown): EventAddress {
	const address = object(value);
	const latitude = address.latitude;
	const longitude = address.longitude;
	if (address.country !== 'Deutschland'
		|| (latitude !== undefined && (typeof latitude !== 'number' || !Number.isFinite(latitude)))
		|| (longitude !== undefined && (typeof longitude !== 'number' || !Number.isFinite(longitude)))) {
		throw new HackathonUpdateError('Die Veranstaltungsadresse ist ungültig.');
	}
	return {
		label: string(address.label, 'Die Adressbezeichnung'),
		street: string(address.street, 'Die Straße'),
		postalCode: string(address.postalCode, 'Die Postleitzahl'),
		city: string(address.city, 'Der Ort'),
		country: 'Deutschland',
		...(typeof latitude === 'number' ? { latitude } : {}),
		...(typeof longitude === 'number' ? { longitude } : {})
	};
}

function parseBilling(value: unknown): BillingDetails {
	const billing = object(value);
	const address = object(billing.address);
	if (address.country !== 'Deutschland') throw new HackathonUpdateError('Die Rechnungsanschrift ist ungültig.');
	return {
		companyName: string(billing.companyName, 'Der Rechnungsempfänger', 160),
		legalForm: string(billing.legalForm, 'Die Rechtsform', 80),
		contactName: string(billing.contactName, 'Der Rechnungskontakt', 160),
		email: string(billing.email, 'Die Rechnungs-E-Mail', 320),
		vatId: string(billing.vatId, 'Die USt-IdNr.', 40),
		purchaseOrder: string(billing.purchaseOrder, 'Die Bestellnummer', 120),
		address: {
			street: string(address.street, 'Die Rechnungsstraße', 200),
			postalCode: string(address.postalCode, 'Die Rechnungspostleitzahl', 20),
			city: string(address.city, 'Der Rechnungsort', 120),
			country: 'Deutschland'
		}
	};
}

export function parseHackathonUpdate(value: unknown): HackathonUpdate {
	const update = object(value);
	switch (update.section) {
		case 'capacity':
			if (![15, 30, 50].includes(update.capacity as number)) throw new HackathonUpdateError('Die Teamgröße ist ungültig.');
			return { section: update.section, capacity: update.capacity as Capacity };
		case 'venue':
			if (typeof update.venueProvided !== 'boolean') throw new HackathonUpdateError('Der Veranstaltungsort ist ungültig.');
			return { section: update.section, venueProvided: update.venueProvided };
		case 'tools': {
			if (!['existing', 'needed'].includes(update.toolProvision as string)) throw new HackathonUpdateError('Die Tool-Auswahl ist ungültig.');
			const validTools = new Set(CODING_TOOLS.map(({ id }) => id));
			if (!Array.isArray(update.codingTools) || update.codingTools.some((tool) => !validTools.has(tool as CodingTool))) {
				throw new HackathonUpdateError('Die Tool-Auswahl ist ungültig.');
			}
			return {
				section: update.section,
				toolProvision: update.toolProvision as ToolProvision,
				codingTools: update.codingTools as CodingTool[],
				customCodingTool: string(update.customCodingTool, 'Das individuelle Coding Tool')
			};
		}
		case 'equipment':
			if (!['projector', 'tv', 'none'].includes(update.equipment as string)) throw new HackathonUpdateError('Das Demo Setup ist ungültig.');
			return { section: update.section, equipment: update.equipment as Equipment };
		case 'devices':
			if (!['existing', 'needed'].includes(update.deviceProvision as string) || !Number.isInteger(update.deviceCount)) {
				throw new HackathonUpdateError('Die Geräteauswahl ist ungültig.');
			}
			return { section: update.section, deviceProvision: update.deviceProvision as DeviceProvision, deviceCount: update.deviceCount as number };
		case 'lunch':
			if (!['pizza', 'custom', 'none', 'self-organized'].includes(update.lunch as string)) throw new HackathonUpdateError('Die Lunch-Auswahl ist ungültig.');
			return { section: update.section, lunch: update.lunch as Lunch, customLunch: string(update.customLunch, 'Der Catering-Wunsch') };
		case 'address':
			return { section: update.section, address: parseAddress(update.address) };
		case 'event-time':
			return {
				section: update.section,
				eventStart: string(update.eventStart, 'Der Veranstaltungsbeginn', 64),
				eventEnd: string(update.eventEnd, 'Das Veranstaltungsende', 64)
			};
		case 'prep-call':
			return { section: update.section, consultationSlot: string(update.consultationSlot, 'Der Vorbereitungstermin', 64) };
		case 'company':
			return { section: update.section, companyName: string(update.companyName, 'Der Unternehmensname', 160) };
		case 'contact':
			return {
				section: update.section,
				contactName: string(update.contactName, 'Die Ansprechperson', 160),
				email: string(update.email, 'Die E-Mail-Adresse', 320),
				phone: string(update.phone, 'Die Telefonnummer', 80)
			};
		case 'billing':
			return { section: update.section, billing: parseBilling(update.billing) };
		case 'message':
			return { section: update.section, message: string(update.message, 'Ihre Nachricht') };
		default:
			throw new HackathonUpdateError('Der zu bearbeitende Bereich ist ungültig.');
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
