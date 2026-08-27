export const OFFER_SERVICE_IDS = [
	'facilitators',
	'challenge-design',
	'demo-follow-up',
	'catering',
	'on-site',
	'matchmaking',
	'whiteboard',
	'timetable',
	'pitch-voting',
	'winner-posters',
	'winner-trophies'
] as const;

export type OfferServiceId = typeof OFFER_SERVICE_IDS[number];

export interface OfferService {
	id: OfferServiceId;
	label: string;
	description: string;
}

export const OFFER_SERVICES: readonly OfferService[] = [
	{ id: 'facilitators', label: 'Zwei Facilitators', description: 'Moderation und Begleitung Ihres Hackathons.' },
	{ id: 'challenge-design', label: 'Challenge Design', description: 'Gemeinsame Schärfung der relevanten Challenges.' },
	{ id: 'demo-follow-up', label: 'Demo Session & Follow-up', description: 'Präsentation der Ergebnisse und nächster Schritte.' },
	{ id: 'catering', label: 'Pizza & Cookies', description: 'Gemeinsames Catering für den Hackathontag.' },
	{ id: 'on-site', label: 'Bei Ihnen vor Ort', description: 'Durchführung in Ihren Räumen.' },
	{ id: 'matchmaking', label: 'Gebrandete Match-making Platform', description: 'Magischer Link, Profile und automatische, internationale Teamzusammenstellung.' },
	{ id: 'whiteboard', label: 'Gebrandetes kollaboratives Whiteboard', description: 'Gemeinsamer Raum für Projektideen während des Hackathons.' },
	{ id: 'timetable', label: 'Gebrandete Time Table View', description: 'Klarer Ablauf und Orientierung für alle Teilnehmenden.' },
	{ id: 'pitch-voting', label: 'Gebrandetes Pitch & Voting System', description: 'Screen-Recording-Upload, Pitch-Vorbereitung und Abstimmung.' },
	{ id: 'winner-posters', label: 'Siegerposter', description: 'Poster zur Auszeichnung der Gewinnerteams.' },
	{ id: 'winner-trophies', label: 'Siegerpokale', description: 'Pokale für die Gewinnerteams.' }
];

export interface OfferConfiguration {
	v: 1;
	companyName: string;
	contactName: string;
	contactEmail: string;
	offerTitle: string;
	issueDate: string;
	validUntil: string;
	netTotal: number | null;
	vatRate: number;
	notes: string;
	services: OfferServiceId[];
}

function isoDate(date: Date) {
	return date.toISOString().slice(0, 10);
}

export function defaultOfferConfiguration(now = new Date()): OfferConfiguration {
	const validUntil = new Date(now);
	validUntil.setDate(validUntil.getDate() + 30);
	return {
		v: 1,
		companyName: 'Hitachi Rail – Public',
		contactName: 'Lourdes Diaz Turó',
		contactEmail: 'lourdes.diazturo@hitachirail.com',
		offerTitle: 'Angebot: Internationaler Hackathon',
		issueDate: isoDate(now),
		validUntil: isoDate(validUntil),
		netTotal: null,
		vatRate: 19,
		notes: '',
		services: OFFER_SERVICE_IDS.slice()
	};
}

export function grossTotal(config: Pick<OfferConfiguration, 'netTotal' | 'vatRate'>) {
	return Math.round(Math.max(0, config.netTotal ?? 0) * (1 + Math.max(0, config.vatRate) / 100) * 100) / 100;
}

export function selectedOfferServices(config: Pick<OfferConfiguration, 'services'>) {
	const selected = new Set(config.services);
	return OFFER_SERVICES.filter((service) => selected.has(service.id));
}

export function isOfferConfiguration(value: unknown): value is OfferConfiguration {
	if (!value || typeof value !== 'object') return false;
	const config = value as Record<string, unknown>;
	const shortText = ['companyName', 'contactName', 'contactEmail', 'offerTitle', 'issueDate', 'validUntil'];
	return config.v === 1
		&& shortText.every((key) => typeof config[key] === 'string' && String(config[key]).length <= 200)
		&& typeof config.notes === 'string' && config.notes.length <= 1_000
		&& (config.netTotal === null || (typeof config.netTotal === 'number' && Number.isFinite(config.netTotal) && config.netTotal >= 0 && config.netTotal <= 10_000_000))
		&& typeof config.vatRate === 'number' && Number.isFinite(config.vatRate) && config.vatRate >= 0 && config.vatRate <= 100
		&& Array.isArray(config.services)
		&& config.services.every((service) => OFFER_SERVICE_IDS.includes(service as OfferServiceId));
}
