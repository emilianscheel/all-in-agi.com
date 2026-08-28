import {
    grossTotal,
    selectedOfferServices,
    type OfferConfiguration,
    type OfferServiceId,
} from "$lib/offer";
import {
    LEFT,
    PAGE_HEIGHT,
    RIGHT,
    createBrandPdf,
    drawBrandChrome,
    drawRight,
    drawRoundedCard,
    drawWrapped,
	loadGoogleSansRegular,
    safeText,
} from "$lib/booking-artifacts";
import awardSvg from "lucide-static/icons/award.svg?raw";
import badgeCheckSvg from "lucide-static/icons/badge-check.svg?raw";
import calendarClockSvg from "lucide-static/icons/calendar-clock.svg?raw";
import calendarDaysSvg from "lucide-static/icons/calendar-days.svg?raw";
import clockSvg from "lucide-static/icons/clock-3.svg?raw";
import codeSvg from "lucide-static/icons/code-2.svg?raw";
import contactSvg from "lucide-static/icons/contact-round.svg?raw";
import keySvg from "lucide-static/icons/key-round.svg?raw";
import lightbulbSvg from "lucide-static/icons/lightbulb.svg?raw";
import listChecksSvg from "lucide-static/icons/list-checks.svg?raw";
import mapPinSvg from "lucide-static/icons/map-pin.svg?raw";
import messageSvg from "lucide-static/icons/message-square-more.svg?raw";
import messagePlusSvg from "lucide-static/icons/message-square-plus.svg?raw";
import monitorSvg from "lucide-static/icons/monitor-play.svg?raw";
import panelsSvg from "lucide-static/icons/panels-top-left.svg?raw";
import presentationSvg from "lucide-static/icons/presentation.svg?raw";
import shieldSvg from "lucide-static/icons/shield-check.svg?raw";
import sparklesSvg from "lucide-static/icons/sparkles.svg?raw";
import trophySvg from "lucide-static/icons/trophy.svg?raw";
import usersSvg from "lucide-static/icons/users.svg?raw";
import videoSvg from "lucide-static/icons/video.svg?raw";
import voteSvg from "lucide-static/icons/vote.svg?raw";
import { type Color, type PDFDocument, type PDFFont, type PDFPage } from "pdf-lib";
import hitachiRailLogoAsset from "../../static/brand/hitachi-rail-logo.png?inline";

function formatMoney(value: number) {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
}

function formatDate(value: string) {
    if (!value) return "Offen";
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return "Offen";
    return new Intl.DateTimeFormat("de-DE", {
        dateStyle: "medium",
        timeZone: "Europe/Berlin",
    }).format(new Date(Date.UTC(year, month - 1, day)));
}

const LUCIDE_SVGS = {
    users: usersSvg,
    lightbulb: lightbulbSvg,
    presentation: presentationSvg,
    mapPin: mapPinSvg,
    calendar: calendarDaysSvg,
    clock: clockSvg,
    code: codeSvg,
    monitor: monitorSvg,
    video: videoSvg,
    badge: badgeCheckSvg,
    message: messageSvg,
    sparkles: sparklesSvg,
    panels: panelsSvg,
    calendarClock: calendarClockSvg,
    vote: voteSvg,
    award: awardSvg,
    trophy: trophySvg,
    contact: contactSvg,
    key: keySvg,
    listChecks: listChecksSvg,
    messagePlus: messagePlusSvg,
    shield: shieldSvg,
} as const;

// These are baseline distances. The extra leading makes the visible whitespace
// above and below a bold section heading feel even despite the glyph ascenders.
const SECTION_TITLE_TO_CONTENT_GAP = 38;

type LucideIconName = keyof typeof LUCIDE_SVGS;
let hitachiRailLogoBytes: Promise<Uint8Array> | undefined;

function decodeInlinePng(asset: string) {
	const comma = asset.indexOf(",");
	if (comma === -1) throw new Error("Invalid bundled client logo.");
	const encoded = asset.slice(comma + 1);
    if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(encoded, "base64"));
    const binary = atob(encoded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function loadHitachiRailLogo() {
	if (hitachiRailLogoAsset.startsWith("data:")) return decodeInlinePng(hitachiRailLogoAsset);
	if (typeof Bun !== "undefined") return new Uint8Array(await Bun.file(hitachiRailLogoAsset).arrayBuffer());
	const response = await fetch(hitachiRailLogoAsset);
	if (!response.ok) throw new Error("Client logo could not be loaded.");
	return new Uint8Array(await response.arrayBuffer());
}

async function drawClientLogo(config: OfferConfiguration, pdf: PDFDocument, page: PDFPage) {
    if (config.clientLogo !== "hitachi") return;
	hitachiRailLogoBytes ??= loadHitachiRailLogo();
	const logo = await pdf.embedPng(await hitachiRailLogoBytes);
	const width = 84.24;
    const height = width * (logo.height / logo.width);
    page.drawImage(logo, { x: RIGHT - width, y: 792 - height / 2, width, height });
}

const CLIENT_REQUIREMENTS = [
    { label: "Termin und gewünschtes Format", icon: "calendar" },
    { label: "Teilnehmendenzahl und -liste", icon: "users" },
    { label: "Challenges und relevanter Kontext", icon: "lightbulb" },
    { label: "IT-, Security- und Datenschutzvorgaben", icon: "shield" },
    { label: "Alle verantwortlichen Ansprechpersonen", icon: "contact" },
] as const satisfies readonly { label: string; icon: LucideIconName }[];
const NEXT_STEPS = [
    { label: "Weitere Anforderungen und Ideen für den Hackathon", icon: "messagePlus" },
    { label: "Zugang zu allen bei Ihnen vorhandenen KI-Tools", icon: "key" },
    { label: "Zugang zu Microsoft Teams", icon: "video" },
    { label: "Gemeinsame Abstimmung von Scope, Ablauf und Voraussetzungen", icon: "listChecks" },
] as const satisfies readonly { label: string; icon: LucideIconName }[];
const lucideIconPdfs = new Map<LucideIconName, Promise<Uint8Array>>();
const iconForService = {
    facilitators: "users",
	preparation: "listChecks",
    participants: "users",
    "challenge-design": "lightbulb",
    "demo-follow-up": "presentation",
    "on-site": "mapPin",
    "date-range": "calendar",
    duration: "clock",
    "project-work": "code",
    "pitch-preparation": "monitor",
    "remote-teams": "video",
    availability: "badge",
    "breakout-sessions": "message",
    introduction: "presentation",
    matchmaking: "sparkles",
    whiteboard: "panels",
    timetable: "calendarClock",
    "pitch-voting": "vote",
    "winner-posters": "award",
    "winner-trophies": "trophy",
} as const satisfies Record<OfferServiceId, LucideIconName>;

function graySvg(name: LucideIconName) {
    return LUCIDE_SVGS[name].replace('stroke="currentColor"', 'stroke="#85858b"');
}

async function renderLucideVectorPdf(name: LucideIconName) {
    // These browser-compatible libraries are loaded only when an offer PDF is rendered.
    const [
        { default: PDFKitDocument },
        { default: SVGtoPDF },
        googleSansRegular,
    ] = await Promise.all([
        import("pdfkit"),
        import("svg-to-pdfkit"),
        loadGoogleSansRegular(),
    ]);
    return new Promise<Uint8Array>((resolve, reject) => {
        const document = new PDFKitDocument({
            size: [24, 24],
            margin: 0,
            autoFirstPage: true,
            font: googleSansRegular,
        });
        const chunks: Uint8Array[] = [];
        document.on("data", (chunk: Uint8Array) => chunks.push(chunk));
        document.on("error", reject);
        document.on("end", () => {
            const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
            const bytes = new Uint8Array(length);
            let offset = 0;
            for (const chunk of chunks) {
                bytes.set(chunk, offset);
                offset += chunk.length;
            }
            resolve(bytes);
        });
        SVGtoPDF(document, graySvg(name), 0, 0, { width: 24, height: 24, assumePt: true });
        document.end();
    });
}

async function drawFeatureIcon(
    pdf: PDFDocument,
    page: PDFPage,
    name: LucideIconName,
    x: number,
    y: number,
) {
    const bytes =
        lucideIconPdfs.get(name) ??
        (lucideIconPdfs.set(name, renderLucideVectorPdf(name)), lucideIconPdfs.get(name)!);
    const [icon] = await pdf.embedPdf(await bytes);
    page.drawPage(icon, { x: x - 6, y: y - 6, width: 12, height: 12 });
}

async function drawListItem(
    pdf: PDFDocument,
    page: PDFPage,
    label: string,
    icon: LucideIconName,
    x: number,
    y: number,
    width: number,
    font: PDFFont,
    color: Color,
) {
    const lineHeight = 9.6;
    const lineCount = drawWrapped(
        page,
        label,
        x + 20,
        y + 4,
        width - 22,
        font,
        7.4,
        color,
        2,
        lineHeight,
    );
    // The icon follows the visual centre of the wrapped text block, not its first baseline.
    await drawFeatureIcon(pdf, page, icon, x + 7, y + 7 - ((lineCount - 1) * lineHeight) / 2);
}

export async function createOfferPdf(config: OfferConfiguration) {
    const context = await createBrandPdf();
    const { pdf, page, regular, bold, brandFont, colors } = context;
    const { ink, muted, surface } = colors;
    const services = selectedOfferServices(config);
    const amount = grossTotal(config);
    const netTotal = config.netTotal;
    const hasPrice = netTotal !== null && netTotal > 0;
    drawBrandChrome(context, `Angebot vom ${formatDate(config.issueDate)}`);
    await drawClientLogo(config, pdf, page);

    page.drawText(safeText(config.offerTitle || "Angebot"), {
        x: LEFT,
        y: 737,
        font: brandFont,
        size: 26,
        color: ink,
    });
    drawWrapped(page, config.companyName || "Ihr Unternehmen", LEFT, 705, 300, bold, 11.5, ink, 1);
    drawWrapped(
        page,
        [config.contactName, config.contactEmail].filter(Boolean).join(" · "),
        LEFT,
        689,
        380,
        regular,
        8.8,
        muted,
        1,
    );

    drawRoundedCard(page, LEFT, 630, RIGHT - LEFT, 38, 14, surface);
    page.drawText(hasPrice ? `${formatMoney(netTotal)} netto` : "Preis nach Vereinbarung", {
        x: LEFT + 18,
        y: 644,
        font: bold,
        size: 12.5,
        color: ink,
    });
    if (hasPrice)
        drawRight(
            page,
			`zzgl. ${formatMoney(amount - netTotal)} USt. (${config.vatRate}%) · ${formatMoney(amount)} brutto zahlbar`,
            RIGHT - 18,
            644,
            regular,
			8.6,
            muted,
        );

    let top = 592;
    if (config.notes.trim()) {
        drawWrapped(page, config.notes.trim(), LEFT, top, RIGHT - LEFT, regular, 9, muted, 2, 12);
        top -= 30;
    }

    page.drawText("Was wir anbieten", { x: LEFT, y: top, font: bold, size: 16, color: ink });
    top -= SECTION_TITLE_TO_CONTENT_GAP;
    const columnWidth = (RIGHT - LEFT - 18) / 2;
    const conciseServices = services.filter((service) => !service.description);
    const detailedServices = services.filter((service) => service.description);
    const rows = Math.max(1, Math.ceil(conciseServices.length / 2));
    for (let row = 0; row < rows; row += 1) {
        const y = top - row * 23;
        const leftService = conciseServices[row];
        const rightService = conciseServices[row + rows];
        if (leftService)
            await drawListItem(
                pdf,
                page,
                leftService.label,
                iconForService[leftService.id],
                LEFT,
                y,
                columnWidth,
                regular,
                ink,
            );
        if (rightService)
            await drawListItem(
                pdf,
                page,
                rightService.label,
                iconForService[rightService.id],
                LEFT + columnWidth + 18,
                y,
                columnWidth,
                regular,
                ink,
            );
    }
    top -= rows * 23 + 8;
    for (let row = 0; row < Math.ceil(detailedServices.length / 2); row += 1) {
        const y = top - row * 33;
        const leftService = detailedServices[row];
        const rightService = detailedServices[row + Math.ceil(detailedServices.length / 2)];
        if (leftService)
            await drawListItem(
                pdf,
                page,
                `${leftService.label}: ${leftService.description}`,
                iconForService[leftService.id],
                LEFT,
                y,
                columnWidth,
                regular,
                ink,
            );
        if (rightService)
            await drawListItem(
                pdf,
                page,
                `${rightService.label}: ${rightService.description}`,
                iconForService[rightService.id],
                LEFT + columnWidth + 18,
                y,
                columnWidth,
                regular,
                ink,
            );
    }
    top -= Math.ceil(detailedServices.length / 2) * 33 + 4;

    page.drawText("Was wir noch von Ihnen brauchen", {
        x: LEFT,
        y: top - 17,
        font: bold,
        size: 16,
        color: ink,
    });
    top -= 17 + SECTION_TITLE_TO_CONTENT_GAP;
    const needRows = Math.ceil(CLIENT_REQUIREMENTS.length / 2);
    for (let row = 0; row < needRows; row += 1) {
        const y = top - row * 22;
        const leftNeed = CLIENT_REQUIREMENTS[row];
        const rightNeed = CLIENT_REQUIREMENTS[row + needRows];
        if (leftNeed)
            await drawListItem(
                pdf,
                page,
                leftNeed.label,
                leftNeed.icon,
                LEFT,
                y,
                columnWidth,
                regular,
                ink,
            );
        if (rightNeed)
            await drawListItem(
                pdf,
                page,
                rightNeed.label,
                rightNeed.icon,
                LEFT + columnWidth + 18,
                y,
                columnWidth,
                regular,
                ink,
            );
    }
    top -= needRows * 22 + 8;
    page.drawText("Wie es weiter geht", { x: LEFT, y: top, font: bold, size: 16, color: ink });
    top -= SECTION_TITLE_TO_CONTENT_GAP;
    const nextRows = Math.ceil(NEXT_STEPS.length / 2);
    for (let row = 0; row < nextRows; row += 1) {
        const y = top - row * 22;
        const leftStep = NEXT_STEPS[row];
        const rightStep = NEXT_STEPS[row + nextRows];
        if (leftStep)
            await drawListItem(
                pdf,
                page,
                leftStep.label,
                leftStep.icon,
                LEFT,
                y,
                columnWidth,
                regular,
                ink,
            );
        if (rightStep)
            await drawListItem(
                pdf,
                page,
                rightStep.label,
                rightStep.icon,
                LEFT + columnWidth + 18,
                y,
                columnWidth,
                regular,
                ink,
            );
    }

    return pdf.save();
}
