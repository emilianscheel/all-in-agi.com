import { grossTotal, selectedOfferServices, type OfferConfiguration } from '$lib/offer';
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
import { rgb, type Color, type PDFFont, type PDFPage } from 'pdf-lib';

const CLIENT_REQUIREMENTS = [
	'Termin und gewünschtes Format',
	'Teilnehmendenzahl und -liste',
	'Challenges und relevanter Kontext',
	'IT-, Security- und Datenschutzvorgaben',
	'Zugänge zu vereinbarten Tools und Daten',
	'Stabiles WLAN und Präsentationssetup',
	'Verantwortliche Ansprechperson'
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

function drawCheck(page: PDFPage, x: number, y: number, color: Color) {
	page.drawCircle({ x, y, size: 6, color });
	page.drawLine({ start: { x: x - 2.4, y }, end: { x: x - .5, y: y - 2.1 }, thickness: 1.1, color: rgb(1, 1, 1) });
	page.drawLine({ start: { x: x - .5, y: y - 2.1 }, end: { x: x + 3.1, y: y + 2.5 }, thickness: 1.1, color: rgb(1, 1, 1) });
}

function drawListItem(
	page: PDFPage,
	label: string,
	x: number,
	y: number,
	width: number,
	font: PDFFont,
	color: Color,
	accent: Color
) {
	drawCheck(page, x + 6, y + 2, accent);
	drawWrapped(page, label, x + 19, y + 5, width - 22, font, 8.4, color, 2, 10);
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

	drawRoundedCard(page, LEFT, 626, RIGHT - LEFT, 52, 14, surface);
	page.drawText('INVESTITION', { x: LEFT + 18, y: 660, font: bold, size: 6.8, color: muted });
	page.drawText(hasPrice ? `${formatMoney(netTotal)} netto` : 'Preis nach Vereinbarung', { x: LEFT + 18, y: 641, font: bold, size: 12.5, color: ink });
	if (hasPrice) drawRight(page, `${formatMoney(amount)} brutto · ${config.vatRate}% USt.`, RIGHT - 18, 641, regular, 9.4, muted);
	drawRight(page, `Gültig bis ${formatDate(config.validUntil)}`, RIGHT - 18, 660, bold, 7.3, muted);

	let top = 596;
	if (config.notes.trim()) {
		drawWrapped(page, config.notes.trim(), LEFT, top, RIGHT - LEFT, regular, 9, muted, 2, 12);
		top -= 34;
	}

	page.drawText('Was wir anbieten', { x: LEFT, y: top, font: bold, size: 16, color: ink });
	top -= 22;
	const columnWidth = (RIGHT - LEFT - 18) / 2;
	const rows = Math.max(1, Math.ceil(services.length / 2));
	for (let row = 0; row < rows; row += 1) {
		const y = top - row * 31;
		const leftService = services[row];
		const rightService = services[row + rows];
		if (leftService) drawListItem(page, leftService.label, LEFT, y, columnWidth, regular, ink, orange);
		if (rightService) drawListItem(page, rightService.label, LEFT + columnWidth + 18, y, columnWidth, regular, ink, orange);
	}
	top -= rows * 31 + 14;

	page.drawLine({ start: { x: LEFT, y: top + 4 }, end: { x: RIGHT, y: top + 4 }, thickness: .7, color: line });
	page.drawText('Was wir noch von Ihnen brauchen', { x: LEFT, y: top - 17, font: bold, size: 16, color: ink });
	top -= 39;
	const needRows = Math.ceil(CLIENT_REQUIREMENTS.length / 2);
	for (let row = 0; row < needRows; row += 1) {
		const y = top - row * 28;
		const leftNeed = CLIENT_REQUIREMENTS[row];
		const rightNeed = CLIENT_REQUIREMENTS[row + needRows];
		if (leftNeed) drawListItem(page, leftNeed, LEFT, y, columnWidth, regular, ink, orange);
		if (rightNeed) drawListItem(page, rightNeed, LEFT + columnWidth + 18, y, columnWidth, regular, ink, orange);
	}

	drawRoundedCard(page, LEFT, 65, RIGHT - LEFT, 39, 12, white);
	page.drawText('NÄCHSTER SCHRITT', { x: LEFT + 14, y: 90, font: bold, size: 6.5, color: muted });
	drawWrapped(page, 'Gemeinsam schärfen wir Scope, Ablauf und die Voraussetzungen im nächsten Gespräch.', LEFT + 14, 76, 330, regular, 8.6, ink, 1);
	return pdf.save();
}
