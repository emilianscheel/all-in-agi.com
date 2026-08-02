import fontkit from '@pdf-lib/fontkit';
import instrumentSerifAsset from '@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff?inline';
import QRCode from 'qrcode';
import {
	LineCapStyle,
	PDFDocument,
	StandardFonts,
	rgb,
	type Color,
	type PDFFont,
	type PDFImage,
	type PDFPage
} from 'pdf-lib';
import logoAsset from '../../static/brand/all-in-agi-logo.png?inline';
import { formatPrice, getPrice, type BookingConfiguration } from './booking';
import { bookingOverviewRows, type BookingOverviewRowId } from './booking-overview';
import type { BookingResultSummary } from './booking-ics';
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY } from './contact';
import { formatEventTimeRange } from './event-time';

export const PAGE_WIDTH = 595.28;
export const PAGE_HEIGHT = 841.89;
export const LEFT = 48;
export const RIGHT = PAGE_WIDTH - LEFT;
const SITE_ORIGIN = 'https://all-in-agi.com';

export function hackathonDetailUrl(id: string) {
	return `${SITE_ORIGIN}/${encodeURIComponent(id)}`;
}

export function safeText(value: unknown) {
	return String(value ?? '')
		.replace(/[–—−]/g, '-')
		.replace(/·/g, '-')
		.replace(/[^\x20-\x7e\xa0-\xff€]/g, '?');
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number, maxLines = 2) {
	const words = safeText(text).split(/\s+/).filter(Boolean);
	const lines: string[] = [];
	let line = '';
	for (const word of words) {
		const next = line ? `${line} ${word}` : word;
		if (font.widthOfTextAtSize(next, size) <= maxWidth) {
			line = next;
		} else {
			if (line) lines.push(line);
			line = word;
			if (lines.length >= maxLines) break;
		}
	}
	if (line && lines.length < maxLines) lines.push(line);
	if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
		let finalLine = lines[maxLines - 1];
		while (finalLine && font.widthOfTextAtSize(`${finalLine}...`, size) > maxWidth) {
			finalLine = finalLine.slice(0, -1);
		}
		lines[maxLines - 1] = `${finalLine.trimEnd()}...`;
	}
	return lines;
}

export function drawWrapped(
	page: PDFPage,
	text: string,
	x: number,
	y: number,
	maxWidth: number,
	font: PDFFont,
	size: number,
	color: Color,
	maxLines = 2,
	lineHeight = size + 2
) {
	const lines = wrap(text, font, size, maxWidth, maxLines);
	lines.forEach((line, index) => {
		page.drawText(line, { x, y: y - index * lineHeight, font, size, color });
	});
	return lines.length;
}

export function drawRight(
	page: PDFPage,
	text: string,
	right: number,
	y: number,
	font: PDFFont,
	size: number,
	color: Color
) {
	const normalized = safeText(text);
	page.drawText(normalized, {
		x: right - font.widthOfTextAtSize(normalized, size),
		y,
		font,
		size,
		color
	});
}

export function drawRoundedCard(
	page: PDFPage,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number,
	color: Color
) {
	const r = Math.min(radius, width / 2, height / 2);
	page.drawRectangle({ x: x + r, y, width: width - 2 * r, height, color });
	page.drawRectangle({ x, y: y + r, width, height: height - 2 * r, color });
	page.drawCircle({ x: x + r, y: y + r, size: r, color });
	page.drawCircle({ x: x + width - r, y: y + r, size: r, color });
	page.drawCircle({ x: x + r, y: y + height - r, size: r, color });
	page.drawCircle({ x: x + width - r, y: y + height - r, size: r, color });
}

function drawQrCode(page: PDFPage, value: string, x: number, y: number, size: number) {
	const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
	const quietZone = 4;
	const gridSize = qr.modules.size + quietZone * 2;
	const moduleSize = size / gridSize;
	page.drawRectangle({ x, y, width: size, height: size, color: rgb(1, 1, 1) });

	for (let row = 0; row < qr.modules.size; row += 1) {
		for (let column = 0; column < qr.modules.size; column += 1) {
			if (!qr.modules.get(row, column)) continue;
			page.drawRectangle({
				x: x + (column + quietZone) * moduleSize,
				y: y + (qr.modules.size - row - 1 + quietZone) * moduleSize,
				width: moduleSize + 0.02,
				height: moduleSize + 0.02,
				color: rgb(0.08, 0.08, 0.09)
			});
		}
	}
}

function drawOverviewIcon(
	page: PDFPage,
	id: BookingOverviewRowId,
	x: number,
	y: number,
	color: Color,
	surface: Color
) {
	const scale = 0.68;
	const px = (value: number) => x + value * scale;
	const py = (value: number) => y + (24 - value) * scale;
	const line = (x1: number, y1: number, x2: number, y2: number, thickness = 1.45) => {
		page.drawLine({
			start: { x: px(x1), y: py(y1) },
			end: { x: px(x2), y: py(y2) },
			thickness: thickness * scale,
			color,
			lineCap: LineCapStyle.Round
		});
	};
	const circle = (cx: number, cy: number, radius: number, fill?: Color) => {
		page.drawCircle({
			x: px(cx),
			y: py(cy),
			size: radius * scale,
			color: fill,
			borderColor: fill ? undefined : color,
			borderWidth: fill ? undefined : 1.45 * scale
		});
	};
	const rectangle = (rx: number, ry: number, width: number, height: number) => {
		page.drawRectangle({
			x: px(rx),
			y: py(ry + height),
			width: width * scale,
			height: height * scale,
			borderColor: color,
			borderWidth: 1.45 * scale
		});
	};

	switch (id) {
		case 'team':
			circle(9, 7, 3.2);
			circle(17.2, 8.2, 2.4);
			line(3.5, 20, 3.5, 18.2); line(3.5, 18.2, 5.6, 15.5); line(5.6, 15.5, 12.4, 15.5); line(12.4, 15.5, 14.5, 18.2); line(14.5, 18.2, 14.5, 20);
			line(15.8, 15.8, 19.3, 15.8); line(19.3, 15.8, 21, 18); line(21, 18, 21, 20);
			break;
		case 'location':
			circle(12, 9, 3);
			line(12, 22, 6.2, 13.7); line(6.2, 13.7, 5.5, 10); line(5.5, 10, 6.6, 6.4); line(6.6, 6.4, 9, 4.1);
			line(9, 4.1, 12, 3.2); line(12, 3.2, 15, 4.1); line(15, 4.1, 17.4, 6.4); line(17.4, 6.4, 18.5, 10); line(18.5, 10, 17.8, 13.7); line(17.8, 13.7, 12, 22);
			break;
		case 'tools':
			line(8, 9, 3.5, 12); line(3.5, 12, 8, 15); line(16, 9, 20.5, 12); line(20.5, 12, 16, 15); line(14, 5, 10, 19);
			break;
		case 'equipment':
			rectangle(3, 4, 18, 13); line(8, 21, 16, 21); line(12, 17, 12, 21);
			break;
		case 'event-date':
			rectangle(3, 5, 18, 16); line(3, 9, 21, 9); line(8, 3, 8, 7); line(16, 3, 16, 7); line(7, 13, 7.1, 13); line(12, 13, 12.1, 13); line(17, 13, 17.1, 13); line(7, 17, 7.1, 17); line(12, 17, 12.1, 17);
			break;
		case 'prep-call':
			circle(12, 12, 9); line(12, 7, 12, 12); line(12, 12, 16, 14);
			break;
		case 'lunch':
			line(4, 19.5, 20, 19.5); line(4, 19.5, 11.5, 4); line(11.5, 4, 20, 19.5); line(7.8, 12, 17.3, 12); circle(12.5, 15.5, 1.1); circle(13.2, 9, 1.1);
			break;
		case 'winner-poster':
			circle(12, 8.5, 5.3); line(8.5, 12.5, 7, 21); line(7, 21, 12, 18); line(15.5, 12.5, 17, 21); line(17, 21, 12, 18);
			break;
		case 'event-photos':
			rectangle(3, 7, 18, 13); rectangle(8, 4.5, 8, 2.5); circle(12, 13.5, 4); circle(18, 10, 0.8, color);
			break;
		case 'snacks':
			circle(11, 12, 8.5); circle(17.8, 5.2, 3.5, surface); circle(6.8, 9, 1, color); circle(12.5, 15.5, 1, color); circle(8.7, 17, 0.8, color); circle(15.5, 11.2, 0.8, color);
			break;
		case 'travel':
			line(3, 14, 21, 7); line(21, 7, 15.5, 19); line(15.5, 19, 12.5, 12); line(12.5, 12, 7.8, 19); line(7.8, 19, 8.2, 13); line(8.2, 13, 3, 14);
			break;
		case 'total':
			rectangle(5, 3, 14, 18); line(8, 8, 16, 8); line(8, 12, 14, 12); line(8, 16, 16, 16); line(8, 20, 13, 20);
			break;
	}
}

function longDateLabel(value: string, withTime = false) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'Noch offen';
	return new Intl.DateTimeFormat('de-DE', {
		weekday: withTime ? 'short' : undefined,
		day: '2-digit',
		month: withTime ? 'short' : 'long',
		year: withTime ? undefined : 'numeric',
		hour: withTime ? '2-digit' : undefined,
		minute: withTime ? '2-digit' : undefined,
		timeZone: 'Europe/Berlin'
	}).format(date);
}

let brandAssets: Promise<{ logo: Uint8Array; instrumentSerif: Uint8Array }> | undefined;

function decodeDataUrl(asset: string) {
	const comma = asset.indexOf(',');
	if (comma === -1) throw new Error('Invalid bundled PDF asset.');
	const metadata = asset.slice(0, comma);
	const encoded = asset.slice(comma + 1);
	if (!metadata.endsWith(';base64')) {
		return new TextEncoder().encode(decodeURIComponent(encoded));
	}
	if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(encoded, 'base64'));

	const binary = atob(encoded);
	return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function readBundledAsset(asset: string) {
	if (asset.startsWith('data:')) return decodeDataUrl(asset);
	if (typeof Bun !== 'undefined') {
		return new Uint8Array(await Bun.file(asset).arrayBuffer());
	}
	throw new Error('PDF asset was not bundled as an inline data URL.');
}

function loadBrandAssets() {
	brandAssets ??= Promise.all([
		readBundledAsset(logoAsset),
		readBundledAsset(instrumentSerifAsset)
	]).then(([logo, instrumentSerif]) => ({ logo, instrumentSerif }));
	return brandAssets;
}

export interface BrandPdfContext {
	pdf: PDFDocument;
	page: PDFPage;
	regular: PDFFont;
	bold: PDFFont;
	brandFont: PDFFont;
	logo: PDFImage;
	colors: {
		orange: Color;
		ink: Color;
		muted: Color;
		line: Color;
		surface: Color;
		white: Color;
	};
}

export async function createBrandPdf(): Promise<BrandPdfContext> {
	const pdf = await PDFDocument.create();
	pdf.registerFontkit(fontkit);
	const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
	const regular = await pdf.embedFont(StandardFonts.Helvetica);
	const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
	const assets = await loadBrandAssets();
	const brandFont = await pdf.embedFont(assets.instrumentSerif, { subset: true });
	const logo = await pdf.embedPng(assets.logo);
	return {
		pdf,
		page,
		regular,
		bold,
		brandFont,
		logo,
		colors: {
			orange: rgb(1, 0.31, 0.094),
			ink: rgb(0.11, 0.11, 0.12),
			muted: rgb(0.43, 0.43, 0.45),
			line: rgb(0.87, 0.87, 0.89),
			surface: rgb(0.96, 0.96, 0.97),
			white: rgb(1, 1, 1)
		}
	};
}

export function drawBrandChrome(context: BrandPdfContext, footerLeft: string) {
	const { page, regular, brandFont, logo, colors } = context;
	page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 10, width: PAGE_WIDTH, height: 10, color: colors.orange });
	page.drawImage(logo, { x: LEFT, y: 778, width: 28, height: 28 });
	page.drawText('ALL IN AGI', { x: LEFT + 38, y: 784, font: brandFont, size: 16.5, color: colors.ink });
	page.drawText(safeText(footerLeft), { x: LEFT, y: 38, font: regular, size: 8.5, color: colors.muted });
	const footerContact = `${CONTACT_PHONE_DISPLAY}  |  ${CONTACT_EMAIL}  |  all-in-agi.com`;
	drawRight(page, footerContact, RIGHT, 38, regular, 8.5, colors.muted);
}

export interface PlanPdfOptions {
	booking?: BookingResultSummary;
	hackathonId?: string;
	generatedAt?: Date;
}

export async function createPlanPdf(config: BookingConfiguration, options: PlanPdfOptions = {}) {
	const generatedAt = options.generatedAt ?? new Date();
	const context = await createBrandPdf();
	const { pdf, page, regular, bold } = context;
	const { orange, ink, muted, line, surface, white } = context.colors;
	const price = getPrice(config.capacity, config.venueProvided, config.lunch, config.toolProvision, config.deviceProvision, config.deviceCount);
	const rows = bookingOverviewRows(config, options.booking);
	const generatedLabel = `Planungsstand ${new Intl.DateTimeFormat('de-DE').format(generatedAt)}`;
	drawBrandChrome(context, generatedLabel);
	if (options.hackathonId) {
		const detailUrl = hackathonDetailUrl(options.hackathonId);
		drawQrCode(page, detailUrl, RIGHT - 68, 754, 68);
		drawRight(page, `all-in-agi.com/${options.hackathonId}`, RIGHT, 742, regular, 6.6, muted);
	}

	page.drawText('Agentic Engineering Hackathon', {
		x: LEFT,
		y: 744,
		font: bold,
		size: 25,
		color: ink
	});
	drawWrapped(page, config.companyName, LEFT, 719, 335, regular, 13, muted, 1);
	drawRight(page, `${formatPrice(price.totalPrice)} netto`, RIGHT, 719, bold, 17, orange);

	drawRoundedCard(page, LEFT, 612, RIGHT - LEFT, 82, 16, surface);
	page.drawText('EVENT', { x: 66, y: 670, font: bold, size: 7.5, color: muted });
	drawWrapped(page, formatEventTimeRange(config.eventStart, config.eventEnd), 66, 651, 208, bold, 10.5, ink, 2);
	drawWrapped(
		page,
		`${config.address.street}, ${config.address.postalCode} ${config.address.city}`,
		66,
		633,
		208,
		regular,
		9,
		muted,
		1
	);
	page.drawLine({
		start: { x: 297.64, y: 625 },
		end: { x: 297.64, y: 681 },
		thickness: 0.8,
		color: line
	});
	page.drawText('PREP CALL', { x: 319, y: 670, font: bold, size: 7.5, color: muted });
	drawWrapped(
		page,
		longDateLabel(options.booking?.start || config.consultationSlot, true),
		319,
		651,
		205,
		bold,
		12,
		ink,
		1
	);
	page.drawText('60 Minuten - Europe/Berlin', { x: 319, y: 633, font: regular, size: 9, color: muted });

	page.drawText('Ihre Übersicht', { x: LEFT, y: 580, font: bold, size: 16, color: ink });
	const cardTop = 558;
	const normalRowHeight = 35;
	const totalRowHeight = 43;
	const cardHeight = (rows.length - 1) * normalRowHeight + totalRowHeight;
	const cardBottom = cardTop - cardHeight;
	drawRoundedCard(page, LEFT, cardBottom, RIGHT - LEFT, cardHeight, 18, surface);

	let rowTop = cardTop;
	for (const row of rows) {
		const height = row.total ? totalRowHeight : normalRowHeight;
		const rowBottom = rowTop - height;
		const iconColor = row.total ? orange : muted;
		drawOverviewIcon(page, row.id, 65, rowBottom + (row.total ? 12 : 9), iconColor, surface);
		if (row.total) {
			page.drawText('Gesamt', { x: 91, y: rowBottom + 15, font: bold, size: 14, color: ink });
			drawRight(page, row.status, RIGHT - 18, rowBottom + 15, bold, 14, orange);
		} else {
			page.drawText(safeText(row.label).toUpperCase(), {
				x: 91,
				y: rowTop - 12,
				font: bold,
				size: 6.6,
				color: muted
			});
			drawWrapped(page, row.value, 91, rowTop - 26, 310, regular, 9.5, ink, 1);
			drawRight(page, row.status, RIGHT - 18, rowTop - 23, bold, 9.2, ink);
			page.drawLine({
				start: { x: 66, y: rowBottom },
				end: { x: RIGHT - 18, y: rowBottom },
				thickness: 0.65,
				color: line
			});
		}
		rowTop = rowBottom;
	}

	const supportY = 66;
	drawRoundedCard(page, LEFT, supportY, RIGHT - LEFT, 39, 12, white);
	page.drawText('KONTAKT', { x: 62, y: supportY + 25, font: bold, size: 6.3, color: muted });
	drawWrapped(page, config.contactName, 62, supportY + 11, 144, bold, 8.7, ink, 1);
	drawWrapped(page, config.email, 210, supportY + 11, 190, regular, 8.5, muted, 1);
	drawRight(page, config.phone, RIGHT - 14, supportY + 11, regular, 8.5, muted);

	return pdf.save();
}
