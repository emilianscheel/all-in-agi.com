import fontkit from '@pdf-lib/fontkit';
import instrumentSansUrl from '@fontsource/instrument-sans/files/instrument-sans-latin-500-normal.woff';
import {
	PDFDocument,
	StandardFonts,
	rgb,
	type Color,
	type PDFFont,
	type PDFPage
} from 'pdf-lib';
import logoUrl from '../../static/brand/all-in-agi-logo.png';
import { formatPrice, getPrice, type BookingConfiguration } from './booking';
import { bookingOverviewRows } from './booking-overview';
import type { BookingResultSummary } from './booking-ics';
import { CONTACT_EMAIL } from './contact';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const LEFT = 48;
const RIGHT = PAGE_WIDTH - LEFT;

function safeText(value: unknown) {
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

function drawWrapped(
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

function drawRight(
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

function drawRoundedCard(
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

let brandAssets: Promise<{ logo: Uint8Array; instrumentSans: Uint8Array }> | undefined;

async function readAsset(asset: string) {
	if (typeof Bun !== 'undefined') {
		return Bun.file(asset).arrayBuffer();
	}
	const { read } = await import('$app/server');
	return read(asset).arrayBuffer();
}

function loadBrandAssets() {
	brandAssets ??= Promise.all([
		readAsset(logoUrl),
		readAsset(instrumentSansUrl)
	]).then(([logo, instrumentSans]) => ({
		logo: new Uint8Array(logo),
		instrumentSans: new Uint8Array(instrumentSans)
	}));
	return brandAssets;
}

export interface PlanPdfOptions {
	includeContact?: boolean;
	booking?: BookingResultSummary;
	hackathonId?: string;
	generatedAt?: Date;
}

export async function createPlanPdf(config: BookingConfiguration, options: PlanPdfOptions = {}) {
	const includeContact = options.includeContact ?? true;
	const generatedAt = options.generatedAt ?? new Date();
	const pdf = await PDFDocument.create();
	pdf.registerFontkit(fontkit);
	const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
	const regular = await pdf.embedFont(StandardFonts.Helvetica);
	const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
	const assets = await loadBrandAssets();
	const brandFont = await pdf.embedFont(assets.instrumentSans, { subset: true });
	const logo = await pdf.embedPng(assets.logo);

	const orange = rgb(1, 0.31, 0.094);
	const ink = rgb(0.11, 0.11, 0.12);
	const muted = rgb(0.43, 0.43, 0.45);
	const line = rgb(0.87, 0.87, 0.89);
	const surface = rgb(0.96, 0.96, 0.97);
	const white = rgb(1, 1, 1);
	const price = getPrice(config.capacity, config.venueProvided, config.lunch, config.toolProvision);
	const rows = bookingOverviewRows(config, options.booking);

	page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 10, width: PAGE_WIDTH, height: 10, color: orange });

	page.drawImage(logo, { x: LEFT, y: 778, width: 28, height: 28 });
	page.drawText('ALL IN AGI', { x: LEFT + 38, y: 786, font: brandFont, size: 12.5, color: ink });
	if (options.hackathonId) {
		drawRight(page, options.hackathonId, RIGHT, 786, bold, 9, muted);
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
	drawWrapped(page, longDateLabel(config.preferredEventDate), 66, 651, 208, bold, 12, ink, 1);
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
		if (row.total) {
			page.drawText('Gesamt', { x: 66, y: rowBottom + 15, font: bold, size: 14, color: ink });
			drawRight(page, row.status, RIGHT - 18, rowBottom + 15, bold, 14, orange);
		} else {
			page.drawText(safeText(row.label).toUpperCase(), {
				x: 66,
				y: rowTop - 12,
				font: bold,
				size: 6.6,
				color: muted
			});
			drawWrapped(page, row.value, 66, rowTop - 26, 335, regular, 9.5, ink, 1);
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

	const supportY = 72;
	drawRoundedCard(page, LEFT, supportY, RIGHT - LEFT, 31, 12, white);
	if (includeContact) {
		drawWrapped(page, config.contactName, 62, supportY + 12, 165, bold, 8.7, ink, 1);
		drawWrapped(page, config.email, 225, supportY + 12, 185, regular, 8.5, muted, 1);
		drawRight(page, config.phone, RIGHT - 14, supportY + 12, regular, 8.5, muted);
	} else {
		page.drawText('GETEILTER PLAN', { x: 62, y: supportY + 12, font: bold, size: 7, color: muted });
		page.drawText('Kontaktdaten sind aus Datenschutzgründen ausgeblendet.', {
			x: 145,
			y: supportY + 11,
			font: regular,
			size: 8.5,
			color: muted
		});
	}

	const generatedLabel = `Planungsstand ${new Intl.DateTimeFormat('de-DE').format(generatedAt)}`;
	page.drawText(generatedLabel, { x: LEFT, y: 38, font: regular, size: 8.5, color: muted });
	const footerContact = `${CONTACT_EMAIL}  |  all-in-agi.com`;
	drawRight(page, footerContact, RIGHT, 38, regular, 8.5, muted);

	return pdf.save();
}
