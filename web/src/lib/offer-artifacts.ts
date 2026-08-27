import { grossTotal, selectedOfferServices, type OfferConfiguration, type OfferServiceId } from '$lib/offer';
import {
	LEFT,
	PAGE_HEIGHT,
	RIGHT,
	createBrandPdf,
	drawBrandChrome,
	drawRight,
	drawRoundedCard,
	drawWrapped,
	safeText
} from '$lib/booking-artifacts';
import awardSvg from 'lucide-static/icons/award.svg?raw';
import badgeCheckSvg from 'lucide-static/icons/badge-check.svg?raw';
import calendarClockSvg from 'lucide-static/icons/calendar-clock.svg?raw';
import calendarDaysSvg from 'lucide-static/icons/calendar-days.svg?raw';
import clockSvg from 'lucide-static/icons/clock-3.svg?raw';
import codeSvg from 'lucide-static/icons/code-2.svg?raw';
import lightbulbSvg from 'lucide-static/icons/lightbulb.svg?raw';
import mapPinSvg from 'lucide-static/icons/map-pin.svg?raw';
import messageSvg from 'lucide-static/icons/message-square-more.svg?raw';
import monitorSvg from 'lucide-static/icons/monitor-play.svg?raw';
import panelsSvg from 'lucide-static/icons/panels-top-left.svg?raw';
import presentationSvg from 'lucide-static/icons/presentation.svg?raw';
import sparklesSvg from 'lucide-static/icons/sparkles.svg?raw';
import trophySvg from 'lucide-static/icons/trophy.svg?raw';
import usersSvg from 'lucide-static/icons/users.svg?raw';
import videoSvg from 'lucide-static/icons/video.svg?raw';
import voteSvg from 'lucide-static/icons/vote.svg?raw';
import { type Color, type PDFDocument, type PDFFont, type PDFPage } from 'pdf-lib';

const CLIENT_REQUIREMENTS = [
	'Termin und gewünschtes Format',
	'Teilnehmendenzahl und -liste',
	'Challenges und relevanter Kontext',
	'IT-, Security- und Datenschutzvorgaben',
	'Verantwortliche Ansprechperson'
];

const NEXT_STEPS = [
	'Weitere Anforderungen und Ideen für den Hackathon über Teams sammeln',
	'Zugang zu allen bei Ihnen vorhandenen KI-Tools',
	'Zugang zu Microsoft Teams',
	'Gemeinsame Abstimmung von Scope, Ablauf und Voraussetzungen'
];

function formatMoney(value: number) {
	return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
}

function formatDate(value: string) {
	if (!value) return 'Offen';
	const [year, month, day] = value.split('-').map(Number);
	if (!year || !month || !day) return 'Offen';
	return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeZone: 'Europe/Berlin' }).format(new Date(Date.UTC(year, month - 1, day)));
}

const LUCIDE_SVGS = {
	users: usersSvg, lightbulb: lightbulbSvg, presentation: presentationSvg, mapPin: mapPinSvg,
	calendar: calendarDaysSvg, clock: clockSvg, code: codeSvg, monitor: monitorSvg, video: videoSvg,
	badge: badgeCheckSvg, message: messageSvg, sparkles: sparklesSvg, panels: panelsSvg,
	calendarClock: calendarClockSvg, vote: voteSvg, award: awardSvg, trophy: trophySvg
} as const;

type LucideIconName = keyof typeof LUCIDE_SVGS;
const lucideIconPdfs = new Map<LucideIconName, Promise<Uint8Array>>();
const iconForService = ({ facilitators: 'users', participants: 'users', 'challenge-design': 'lightbulb', 'demo-follow-up': 'presentation', 'on-site': 'mapPin', 'date-range': 'calendar', duration: 'clock', 'project-work': 'code', 'pitch-preparation': 'monitor', 'remote-teams': 'video', availability: 'badge', 'breakout-sessions': 'message', introduction: 'presentation', matchmaking: 'sparkles', whiteboard: 'panels', timetable: 'calendarClock', 'pitch-voting': 'vote', 'winner-posters': 'award', 'winner-trophies': 'trophy', requirement: 'badge', 'next-step': 'message' } as const) satisfies Record<OfferServiceId | 'requirement' | 'next-step', LucideIconName>;

function orangeSvg(name: LucideIconName) {
	return LUCIDE_SVGS[name].replace('stroke="currentColor"', 'stroke="#ff4f18"');
}

async function renderLucideVectorPdf(name: LucideIconName) {
	// These browser-compatible libraries are loaded only when an offer PDF is rendered.
	const [{ default: PDFKitDocument }, { default: SVGtoPDF }] = await Promise.all([
		import('pdfkit'),
		import('svg-to-pdfkit')
	]);
	return new Promise<Uint8Array>((resolve, reject) => {
		const document = new PDFKitDocument({ size: [24, 24], margin: 0, autoFirstPage: true });
		const chunks: Uint8Array[] = [];
		document.on('data', (chunk: Uint8Array) => chunks.push(chunk));
		document.on('error', reject);
		document.on('end', () => {
			const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
			const bytes = new Uint8Array(length);
			let offset = 0;
			for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
			resolve(bytes);
		});
		SVGtoPDF(document, orangeSvg(name), 0, 0, { width: 24, height: 24, assumePt: true });
		document.end();
	});
}

async function drawFeatureIcon(pdf: PDFDocument, page: PDFPage, id: OfferServiceId | 'requirement' | 'next-step', x: number, y: number) {
	const name = iconForService[id];
	const bytes = lucideIconPdfs.get(name) ?? (lucideIconPdfs.set(name, renderLucideVectorPdf(name)), lucideIconPdfs.get(name)!);
	const [icon] = await pdf.embedPdf(await bytes);
	page.drawPage(icon, { x: x - 6, y: y - 6, width: 12, height: 12 });
}

async function drawListItem(
	pdf: PDFDocument,
	page: PDFPage,
	label: string,
	id: OfferServiceId | 'requirement' | 'next-step',
	x: number,
	y: number,
	width: number,
	font: PDFFont,
	color: Color
) {
	// `drawText` uses a baseline; raise the icon to the visual centre of a
	// single-line label instead of leaving its centre on that baseline.
	await drawFeatureIcon(pdf, page, id, x + 7, y + 7);
	drawWrapped(page, label, x + 20, y + 4, width - 22, font, 7.4, color, 2, 8.6);
}

export async function createOfferPdf(config: OfferConfiguration) {
	const context = await createBrandPdf();
	const { pdf, page, regular, bold, brandFont, colors } = context;
	const { ink, muted, line, surface } = colors;
	const services = selectedOfferServices(config);
	const amount = grossTotal(config);
	const netTotal = config.netTotal;
	const hasPrice = netTotal !== null && netTotal > 0;
	drawBrandChrome(context, `Angebot vom ${formatDate(config.issueDate)}`);

	page.drawText(safeText(config.offerTitle || 'Angebot'), { x: LEFT, y: 737, font: brandFont, size: 26, color: ink });
	drawWrapped(page, config.companyName || 'Ihr Unternehmen', LEFT, 712, 300, bold, 11.5, ink, 1);
	drawWrapped(page, [config.contactName, config.contactEmail].filter(Boolean).join(' · '), LEFT, 696, 380, regular, 8.8, muted, 1);

	drawRoundedCard(page, LEFT, 630, RIGHT - LEFT, 38, 14, surface);
	page.drawText(hasPrice ? `${formatMoney(netTotal)} netto` : 'Preis nach Vereinbarung', { x: LEFT + 18, y: 644, font: bold, size: 12.5, color: ink });
	if (hasPrice) drawRight(page, `${formatMoney(amount)} brutto · ${config.vatRate}% USt.`, RIGHT - 18, 644, regular, 9.4, muted);

	let top = 604;
	if (config.notes.trim()) {
		drawWrapped(page, config.notes.trim(), LEFT, top, RIGHT - LEFT, regular, 9, muted, 2, 12);
		top -= 34;
	}

	page.drawText('Was wir anbieten', { x: LEFT, y: top, font: bold, size: 16, color: ink });
	top -= 22;
	const columnWidth = (RIGHT - LEFT - 18) / 2;
	const conciseServices = services.filter((service) => !service.description);
	const detailedServices = services.filter((service) => service.description);
	const rows = Math.max(1, Math.ceil(conciseServices.length / 2));
	for (let row = 0; row < rows; row += 1) {
		const y = top - row * 23;
		const leftService = conciseServices[row];
		const rightService = conciseServices[row + rows];
		if (leftService) await drawListItem(pdf, page, leftService.label, leftService.id, LEFT, y, columnWidth, regular, ink);
		if (rightService) await drawListItem(pdf, page, rightService.label, rightService.id, LEFT + columnWidth + 18, y, columnWidth, regular, ink);
	}
	top -= rows * 23 + 8;
	for (let row = 0; row < Math.ceil(detailedServices.length / 2); row += 1) {
		const y = top - row * 33;
		const leftService = detailedServices[row];
		const rightService = detailedServices[row + Math.ceil(detailedServices.length / 2)];
		if (leftService) await drawListItem(pdf, page, `${leftService.label}: ${leftService.description}`, leftService.id, LEFT, y, columnWidth, regular, ink);
		if (rightService) await drawListItem(pdf, page, `${rightService.label}: ${rightService.description}`, rightService.id, LEFT + columnWidth + 18, y, columnWidth, regular, ink);
	}
	top -= Math.ceil(detailedServices.length / 2) * 33 + 8;

	page.drawLine({ start: { x: LEFT, y: top + 4 }, end: { x: RIGHT, y: top + 4 }, thickness: .7, color: line });
	page.drawText('Was wir noch von Ihnen brauchen', { x: LEFT, y: top - 17, font: bold, size: 16, color: ink });
	top -= 39;
	const needRows = Math.ceil(CLIENT_REQUIREMENTS.length / 2);
	for (let row = 0; row < needRows; row += 1) {
		const y = top - row * 22;
		const leftNeed = CLIENT_REQUIREMENTS[row];
		const rightNeed = CLIENT_REQUIREMENTS[row + needRows];
		if (leftNeed) await drawListItem(pdf, page, leftNeed, 'requirement', LEFT, y, columnWidth, regular, ink);
		if (rightNeed) await drawListItem(pdf, page, rightNeed, 'requirement', LEFT + columnWidth + 18, y, columnWidth, regular, ink);
	}
	top -= needRows * 22 + 12;
	page.drawText('Wie es weiter geht', { x: LEFT, y: top, font: bold, size: 16, color: ink });
	top -= 22;
	const nextRows = Math.ceil(NEXT_STEPS.length / 2);
	for (let row = 0; row < nextRows; row += 1) {
		const y = top - row * 22;
		const leftStep = NEXT_STEPS[row];
		const rightStep = NEXT_STEPS[row + nextRows];
		if (leftStep) await drawListItem(pdf, page, leftStep, 'next-step', LEFT, y, columnWidth, regular, ink);
		if (rightStep) await drawListItem(pdf, page, rightStep, 'next-step', LEFT + columnWidth + 18, y, columnWidth, regular, ink);
	}

	return pdf.save();
}
