import { isClientLogoId } from '$lib/public-id';

export const OFFER_SERVICE_IDS = [
    "facilitators",
    "preparation",
    "challenge-design",
    "demo-follow-up",
    "on-site",
    "date-range",
    "duration",
    "project-work",
    "pitch-preparation",
    "participants",
    "remote-teams",
    "availability",
    "breakout-sessions",
    "introduction",
    "matchmaking",
    "whiteboard",
    "timetable",
    "pitch-voting",
    "winner-posters",
    "winner-trophies",
] as const;

export type OfferServiceId = (typeof OFFER_SERVICE_IDS)[number];

export const OFFER_CLIENT_LOGOS = [
    { id: "hitachi", label: "Hitachi Rail", labelEn: "Hitachi Rail" },
    { id: "none", label: "Kein Kundenlogo", labelEn: "No client logo" },
] as const;

export type OfferClientLogoId = (typeof OFFER_CLIENT_LOGOS)[number]["id"];

const OFFER_SERVICE_ID_PATTERN = /^[A-Za-z0-9-]{1,40}$/;

export interface OfferService {
    id: OfferServiceId;
    label: string;
    labelEn: string;
    description?: string;
    descriptionEn?: string;
}

export const OFFER_SERVICES: readonly OfferService[] = [
    { id: "facilitators", label: "Zwei Facilitators", labelEn: "Two facilitators" },
    { id: "preparation", label: "4 Tage Vorbereitungstage Konzeption", labelEn: "4 days of preparation (concepting)" },
    { id: "challenge-design", label: "Challenge Design", labelEn: "Challenge Design" },
    { id: "demo-follow-up", label: "Demo Session", labelEn: "Demo session" },
    { id: "on-site", label: "Wir begleiten das Event von Berlin aus oder bei Ihnen vor Ort", labelEn: "We accompany the event from Berlin or on-site at your location" },
    { id: "date-range", label: "Januar oder Februar 2026", labelEn: "January or February 2026" },
    { id: "duration", label: "2,5 Tage gesamt, 1 Tag à 10 h", labelEn: "2.5 days total, 1 day at 10 h" },
    { id: "project-work", label: "2 Tage Projektarbeit", labelEn: "2 days of project work" },
    { id: "pitch-preparation", label: "0,5 Tage Pitch und Projektpitches", labelEn: "0.5 day for pitch and project pitches" },
    { id: "participants", label: "Bis zu 100 teilnehmende Personen", labelEn: "Up to 100 participants" },
    { id: "remote-teams", label: "Vollkommen online über Microsoft Teams", labelEn: "Fully online via Microsoft Teams" },
    { id: "availability", label: "Während der Wettbewerbszeit jederzeit erreichbar", labelEn: "Reachable at all times during the competition period" },
    { id: "breakout-sessions", label: "Proaktive Unterstützung in direkten Breakout-Sessions", labelEn: "Proactive support in live breakout sessions" },
    { id: "introduction", label: "30-minütige Einführungspräsentation am ersten Wettbewerbstag", labelEn: "30-minute introductory presentation on the first competition day" },
    {
        id: "matchmaking",
        label: "Gebrandete Match-making Platform",
        labelEn: "Branded matchmaking platform",
        description: "Magischer Link, Profile und automatische, internationale Teamzusammenstellung.",
        descriptionEn: "Magic link, profiles, and automatic international team formation.",
    },
    {
        id: "whiteboard",
        label: "Gebrandetes kollaboratives Whiteboard",
        labelEn: "Branded collaborative whiteboard",
        description: "Gemeinsamer Raum für Projektideen während des Hackathons.",
        descriptionEn: "Shared space for project ideas during the hackathon.",
    },
    {
        id: "timetable",
        label: "Gebrandete Time Table View",
        labelEn: "Branded timetable view",
        description: "Klarer Ablauf und Orientierung für alle Teilnehmenden.",
        descriptionEn: "Clear agenda and orientation for all participants.",
    },
    {
        id: "pitch-voting",
        label: "Gebrandetes Pitch & Voting System",
        labelEn: "Branded pitch & voting system",
        description: "Screen-Recording-Upload, Pitch-Vorbereitung und Abstimmung.",
        descriptionEn: "Screen-recording upload, pitch preparation, and voting.",
    },
    {
        id: "winner-posters",
        label: "Siegerposter",
        labelEn: "Winning posters",
        description: "Poster zur Auszeichnung der Gewinnerteams.",
        descriptionEn: "Posters to recognize the winning teams.",
    },
    {
        id: "winner-trophies",
        label: "Siegerpokale",
        labelEn: "Winning trophies",
        description: "Pokale für die Gewinnerteams.",
        descriptionEn: "Trophies for the winning teams.",
    },
];

export const OFFER_SERVICE_ICONS = {
	facilitators: "users",
	preparation: "list-checks",
	participants: "users",
	"challenge-design": "lightbulb",
	"demo-follow-up": "presentation",
	"on-site": "map-pin",
	"date-range": "calendar-days",
	duration: "clock-3",
	"project-work": "code-2",
	"pitch-preparation": "monitor-play",
	"remote-teams": "video",
	availability: "badge-check",
	"breakout-sessions": "message-square-more",
	introduction: "presentation",
	matchmaking: "sparkles",
	whiteboard: "panels-top-left",
	timetable: "calendar-clock",
	"pitch-voting": "vote",
	"winner-posters": "award",
	"winner-trophies": "trophy",
} as const satisfies Record<OfferServiceId, string>;

export interface ClientLogoRecord {
	id: string;
	name: string;
	svg: string;
}

export interface OfferCatalogService {
	id: string;
	label: string;
	labelEn: string;
	description?: string;
	descriptionEn?: string;
	icon: string;
	sortOrder: number;
}

export interface OfferConfiguration {
	locale?: 'de' | 'en';
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
    services: string[];
    clientLogo: string;
}

function isoDate(date: Date) {
    return date.toISOString().slice(0, 10);
}

export function defaultOfferConfiguration(now = new Date()): OfferConfiguration {
    return {
		v: 1,
		locale: 'de',
        companyName: "Hitachi Rail",
        contactName: "Lourdes Diaz Turó",
        contactEmail: "lourdes.diazturo@hitachirail.com",
        offerTitle: "Angebot: Internationaler Hackathon",
        issueDate: isoDate(now),
        validUntil: "",
        netTotal: 14_500,
        vatRate: 19,
        notes: "",
        services: OFFER_SERVICE_IDS.slice(),
        clientLogo: "hitachi",
    };
}

export function grossTotal(config: Pick<OfferConfiguration, "netTotal" | "vatRate">) {
    return (
        Math.round(
            Math.max(0, config.netTotal ?? 0) * (1 + Math.max(0, config.vatRate) / 100) * 100,
        ) / 100
    );
}

export function selectedOfferServices(
	config: Pick<OfferConfiguration, "services">,
	catalog: readonly OfferCatalogService[] = [],
) {
	const byId = new Map<string, OfferService | OfferCatalogService>(OFFER_SERVICES.map((service) => [service.id, service]));
	for (const service of catalog) byId.set(service.id, service);
	const staticOrder = new Map(OFFER_SERVICES.map((service, index) => [service.id, index]));
	return config.services.flatMap((id) => {
		const service = byId.get(id);
		return service ? [service] : [];
	}).sort((a, b) => {
		const aOrder = "sortOrder" in a ? a.sortOrder : staticOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER;
		const bOrder = "sortOrder" in b ? b.sortOrder : staticOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER;
		return aOrder - bOrder;
	});
}

export function isClientLogoChoice(value: unknown): value is string {
	return value === "none" || value === "hitachi" || (typeof value === "string" && isClientLogoId(value));
}

export function isOfferConfiguration(value: unknown): value is OfferConfiguration {
    if (!value || typeof value !== "object") return false;
    const config = value as Record<string, unknown>;
    const shortText = [
        "companyName",
        "contactName",
        "contactEmail",
        "offerTitle",
        "issueDate",
        "validUntil",
    ];
	return (
		config.v === 1 &&
		(config.locale === undefined || config.locale === 'de' || config.locale === 'en') &&
        shortText.every(
            (key) => typeof config[key] === "string" && String(config[key]).length <= 200,
        ) &&
        typeof config.notes === "string" &&
        config.notes.length <= 1_000 &&
        (config.netTotal === null ||
            (typeof config.netTotal === "number" &&
                Number.isFinite(config.netTotal) &&
                config.netTotal >= 0 &&
                config.netTotal <= 10_000_000)) &&
        typeof config.vatRate === "number" &&
        Number.isFinite(config.vatRate) &&
        config.vatRate >= 0 &&
        config.vatRate <= 100 &&
        Array.isArray(config.services) &&
        config.services.length <= 100 &&
        config.services.every((service) => typeof service === "string" && OFFER_SERVICE_ID_PATTERN.test(service)) &&
        isClientLogoChoice(config.clientLogo)
    );
}

export function normalizeOfferConfiguration(value: unknown): OfferConfiguration | null {
    if (!value || typeof value !== "object") return null;
    const config = value as Record<string, unknown>;
    if (config.clientLogo === undefined)
        return isLegacyOfferConfiguration(config)
            ? ({ ...config, clientLogo: "hitachi" } as OfferConfiguration)
            : null;
    return isOfferConfiguration(config) ? config : null;
}

function isLegacyOfferConfiguration(config: Record<string, unknown>) {
    const { clientLogo: _clientLogo, ...legacyConfig } = config;
    return isOfferConfiguration({ ...legacyConfig, clientLogo: "hitachi" });
}
