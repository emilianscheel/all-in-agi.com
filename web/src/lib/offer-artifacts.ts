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
import { concatTransformationMatrix, popGraphicsState, pushGraphicsState, type Color, type PDFFont, type PDFPage } from 'pdf-lib';

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

const LUCIDE_PATHS = {
	users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M16 3.128a4 4 0 0 1 0 7.744', 'M22 21v-2a4 4 0 0 0-3-3.87'],
	lightbulb: ['M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5', 'M9 18h6', 'M10 22h4'],
	presentation: ['M2 3h20', 'M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3', 'm7 21 5-5 5 5'],
	mapPin: ['M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0'],
	calendar: ['M8 2v4', 'M16 2v4', 'M3 10h18', 'M8 14h.01', 'M12 14h.01', 'M16 14h.01', 'M8 18h.01', 'M12 18h.01', 'M16 18h.01'],
	clock: ['M12 6v6h4'],
	code: ['m16 18 6-6-6-6', 'm8 6-6 6 6 6'],
	monitor: ['M15.033 9.44a.647.647 0 0 1 0 1.12l-4.065 2.352a.645.645 0 0 1-.968-.56V7.648a.645.645 0 0 1 .967-.56z', 'M12 17v4', 'M8 21h8'],
	video: ['m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5'],
	badge: ['M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z', 'm9 12 2 2 4-4'],
	message: ['M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z', 'M12 11h.01', 'M16 11h.01', 'M8 11h.01'],
	sparkles: ['M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z', 'M20 2v4', 'M22 4h-4'],
	panels: ['M3 9h18', 'M9 21V9'],
	calendarClock: ['M16 14v2.2l1.6 1', 'M16 2v4', 'M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5', 'M3 10h5', 'M8 2v4'],
	vote: ['m9 12 2 2 4-4', 'M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z', 'M22 19H2'],
	award: ['m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526'],
	trophy: ['M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978', 'M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978', 'M18 9h1.5a1 1 0 0 0 0-5H18', 'M4 22h16', 'M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z', 'M6 9H4.5a1 1 0 0 1 0-5H6']
} as const;

function drawFeatureIcon(page: PDFPage, id: OfferServiceId | 'requirement' | 'next-step', x: number, y: number, color: Color) {
	const iconName = ({ facilitators: 'users', participants: 'users', 'challenge-design': 'lightbulb', 'demo-follow-up': 'presentation', 'on-site': 'mapPin', 'date-range': 'calendar', duration: 'clock', 'project-work': 'code', 'pitch-preparation': 'monitor', 'remote-teams': 'video', availability: 'badge', 'breakout-sessions': 'message', introduction: 'presentation', matchmaking: 'sparkles', whiteboard: 'panels', timetable: 'calendarClock', 'pitch-voting': 'vote', 'winner-posters': 'award', 'winner-trophies': 'trophy', requirement: 'badge', 'next-step': 'message' } as const)[id];
	const scale = .53;
	page.pushOperators(pushGraphicsState(), concatTransformationMatrix(scale, 0, 0, -scale, x - 12 * scale, y + 12 * scale));
	for (const path of LUCIDE_PATHS[iconName]) page.drawSvgPath(path, { x: 0, y: 0, borderColor: color, borderWidth: 1.85 });
	// Some Lucide icons include SVG circle/rect nodes in addition to paths. Keep
	// those primitives as vectors too, rather than substituting a generic mark.
	if (iconName === 'users') page.drawCircle({ x: 9, y: 7, size: 4, borderColor: color, borderWidth: 1.85 });
	if (iconName === 'mapPin') page.drawCircle({ x: 12, y: 10, size: 3, borderColor: color, borderWidth: 1.85 });
	if (iconName === 'calendar') page.drawRectangle({ x: 3, y: 4, width: 18, height: 18, borderColor: color, borderWidth: 1.85 });
	if (iconName === 'clock') page.drawCircle({ x: 12, y: 12, size: 10, borderColor: color, borderWidth: 1.85 });
	if (iconName === 'monitor') page.drawRectangle({ x: 2, y: 3, width: 20, height: 14, borderColor: color, borderWidth: 1.85 });
	if (iconName === 'video') page.drawRectangle({ x: 2, y: 6, width: 14, height: 12, borderColor: color, borderWidth: 1.85 });
	if (iconName === 'panels') page.drawRectangle({ x: 3, y: 3, width: 18, height: 18, borderColor: color, borderWidth: 1.85 });
	if (iconName === 'calendarClock') page.drawCircle({ x: 16, y: 16, size: 6, borderColor: color, borderWidth: 1.85 });
	if (iconName === 'award') page.drawCircle({ x: 12, y: 8, size: 6, borderColor: color, borderWidth: 1.85 });
	page.pushOperators(popGraphicsState());
}

function drawListItem(
	page: PDFPage,
	label: string,
	id: OfferServiceId | 'requirement' | 'next-step',
	x: number,
	y: number,
	width: number,
	font: PDFFont,
	color: Color,
	accent: Color
) {
	// `drawText` uses a baseline; raise the icon to the visual centre of a
	// single-line label instead of leaving its centre on that baseline.
	drawFeatureIcon(page, id, x + 7, y + 7, accent);
	drawWrapped(page, label, x + 20, y + 4, width - 22, font, 7.4, color, 2, 8.6);
}

export async function createOfferPdf(config: OfferConfiguration) {
	const context = await createBrandPdf();
	const { pdf, page, regular, bold, brandFont, colors } = context;
	const { orange, ink, muted, line, surface, white } = colors;
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
		if (leftService) drawListItem(page, leftService.label, leftService.id, LEFT, y, columnWidth, regular, ink, orange);
		if (rightService) drawListItem(page, rightService.label, rightService.id, LEFT + columnWidth + 18, y, columnWidth, regular, ink, orange);
	}
	top -= rows * 23 + 8;
	for (let row = 0; row < Math.ceil(detailedServices.length / 2); row += 1) {
		const y = top - row * 33;
		const leftService = detailedServices[row];
		const rightService = detailedServices[row + Math.ceil(detailedServices.length / 2)];
		if (leftService) drawListItem(page, `${leftService.label}: ${leftService.description}`, leftService.id, LEFT, y, columnWidth, regular, ink, orange);
		if (rightService) drawListItem(page, `${rightService.label}: ${rightService.description}`, rightService.id, LEFT + columnWidth + 18, y, columnWidth, regular, ink, orange);
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
		if (leftNeed) drawListItem(page, leftNeed, 'requirement', LEFT, y, columnWidth, regular, ink, orange);
		if (rightNeed) drawListItem(page, rightNeed, 'requirement', LEFT + columnWidth + 18, y, columnWidth, regular, ink, orange);
	}
	top -= needRows * 22 + 12;
	page.drawText('Wie es weiter geht', { x: LEFT, y: top, font: bold, size: 16, color: ink });
	top -= 22;
	const nextRows = Math.ceil(NEXT_STEPS.length / 2);
	for (let row = 0; row < nextRows; row += 1) {
		const y = top - row * 22;
		const leftStep = NEXT_STEPS[row];
		const rightStep = NEXT_STEPS[row + nextRows];
		if (leftStep) drawListItem(page, leftStep, 'next-step', LEFT, y, columnWidth, regular, ink, orange);
		if (rightStep) drawListItem(page, rightStep, 'next-step', LEFT + columnWidth + 18, y, columnWidth, regular, ink, orange);
	}

	return pdf.save();
}
