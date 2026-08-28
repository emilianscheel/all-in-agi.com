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
    { id: "hitachi", label: "Hitachi Rail" },
    { id: "none", label: "Kein Kundenlogo" },
] as const;

export type OfferClientLogoId = (typeof OFFER_CLIENT_LOGOS)[number]["id"];

export interface OfferService {
    id: OfferServiceId;
    label: string;
    description?: string;
}

export const OFFER_SERVICES: readonly OfferService[] = [
    { id: "facilitators", label: "Zwei Facilitators" },
    { id: "preparation", label: "4 Tage Vorbereitungstage Konzeption" },
    { id: "challenge-design", label: "Challenge Design" },
    { id: "demo-follow-up", label: "Demo Session" },
    { id: "on-site", label: "Wir begleiten das Event von Berlin aus oder bei Ihnen vor Ort" },
    { id: "date-range", label: "Januar oder Februar 2026" },
    { id: "duration", label: "2,5 Tage gesamt, 1 Tag à 10 h" },
    { id: "project-work", label: "2 Tage Projektarbeit" },
    { id: "pitch-preparation", label: "0,5 Tage Pitch und Projektpitches" },
    { id: "participants", label: "Bis zu 100 teilnehmende Personen" },
    { id: "remote-teams", label: "Vollkommen online über Microsoft Teams" },
    { id: "availability", label: "Während der Wettbewerbszeit jederzeit erreichbar" },
    { id: "breakout-sessions", label: "Proaktive Unterstützung in direkten Breakout-Sessions" },
    { id: "introduction", label: "30-minütige Einführungspräsentation am ersten Wettbewerbstag" },
    {
        id: "matchmaking",
        label: "Gebrandete Match-making Platform",
        description:
            "Magischer Link, Profile und automatische, internationale Teamzusammenstellung.",
    },
    {
        id: "whiteboard",
        label: "Gebrandetes kollaboratives Whiteboard",
        description: "Gemeinsamer Raum für Projektideen während des Hackathons.",
    },
    {
        id: "timetable",
        label: "Gebrandete Time Table View",
        description: "Klarer Ablauf und Orientierung für alle Teilnehmenden.",
    },
    {
        id: "pitch-voting",
        label: "Gebrandetes Pitch & Voting System",
        description: "Screen-Recording-Upload, Pitch-Vorbereitung und Abstimmung.",
    },
    {
        id: "winner-posters",
        label: "Siegerposter",
        description: "Poster zur Auszeichnung der Gewinnerteams.",
    },
    { id: "winner-trophies", label: "Siegerpokale", description: "Pokale für die Gewinnerteams." },
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
    clientLogo: OfferClientLogoId;
}

function isoDate(date: Date) {
    return date.toISOString().slice(0, 10);
}

export function defaultOfferConfiguration(now = new Date()): OfferConfiguration {
    return {
        v: 1,
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

export function selectedOfferServices(config: Pick<OfferConfiguration, "services">) {
    const selected = new Set(config.services);
    return OFFER_SERVICES.filter((service) => selected.has(service.id));
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
        config.services.every(
            (service) =>
                OFFER_SERVICE_IDS.includes(service as OfferServiceId) || service === "catering",
        ) &&
        OFFER_CLIENT_LOGOS.some((logo) => logo.id === config.clientLogo)
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
