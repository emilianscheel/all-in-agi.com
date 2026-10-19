import type { PDFFont } from 'pdf-lib';
import {
	LEFT,
	PAGE_HEIGHT,
	PAGE_WIDTH,
	RIGHT,
	createBrandPdf,
	drawBrandChrome,
	safeText
} from './booking-artifacts';

const CONTENT_TOP = 744;
const CONTENT_BOTTOM = 64;
const TEXT_WIDTH = RIGHT - LEFT;

export interface LegalPdfInput {
	content: string;
	version: string;
	hackathonId: string;
}

interface StyledLine {
	text: string;
	font: 'regular' | 'bold';
	size: number;
	color: 'ink' | 'orange';
	spaceBefore: number;
	lineHeight: number;
	kind: 'title' | 'version' | 'heading' | 'heading-rest' | 'body';
}

function splitOversizedWord(word: string, font: PDFFont, size: number, maxWidth: number) {
	const parts: string[] = [];
	let rest = word;
	while (font.widthOfTextAtSize(rest, size) > maxWidth && rest.length > 1) {
		let cut = 1;
		while (cut < rest.length && font.widthOfTextAtSize(rest.slice(0, cut + 1), size) <= maxWidth) cut += 1;
		parts.push(rest.slice(0, cut));
		rest = rest.slice(cut);
	}
	parts.push(rest);
	return parts;
}

function pdfSafeText(value: string) {
	return safeText(
		value
			.replaceAll('„', '"')
			.replaceAll('“', '"')
			.replaceAll('”', '"')
			.replaceAll('‚', "'")
			.replaceAll('‘', "'")
			.replaceAll('’', "'")
	);
}

function wrapLines(text: string, font: PDFFont, size: number, maxWidth: number) {
	const words = pdfSafeText(text).split(/\s+/).filter(Boolean);
	const lines: string[] = [];
	let current = '';
	for (const word of words) {
		if (font.widthOfTextAtSize(word, size) > maxWidth) {
			if (current) lines.push(current);
			const parts = splitOversizedWord(word, font, size, maxWidth);
			lines.push(...parts.slice(0, -1));
			current = parts.at(-1) ?? '';
			continue;
		}
		const next = current ? `${current} ${word}` : word;
		if (font.widthOfTextAtSize(next, size) <= maxWidth) {
			current = next;
		} else {
			if (current) lines.push(current);
			current = word;
		}
	}
	if (current) lines.push(current);
	return lines;
}

function pushWrapped(
	target: StyledLine[],
	text: string,
	font: PDFFont,
	style: Omit<StyledLine, 'text' | 'spaceBefore'> & { spaceBefore: number }
) {
	const wrapped = wrapLines(text, font, style.size, TEXT_WIDTH);
	wrapped.forEach((line, index) => {
		const continuation = index > 0;
		target.push({
			...style,
			text: line,
			spaceBefore: continuation ? 0 : style.spaceBefore,
			kind: continuation && style.kind === 'heading' ? 'heading-rest' : style.kind
		});
	});
}

export function legalPdfLines(content: string, regular: PDFFont, bold: PDFFont) {
	const blocks = content.trim().split(/\n{2,}/);
	const header = blocks[0]?.split('\n').map((line) => line.trim()).filter(Boolean) ?? [];
	const title = header[0] ?? 'Allgemeine Geschäftsbedingungen';
	const versionLine = header.slice(1).join(' ');
	const lines: StyledLine[] = [];
	pushWrapped(lines, title, bold, { font: 'bold', size: 18, color: 'ink', lineHeight: 22, kind: 'title', spaceBefore: 0 });
	if (versionLine) {
		pushWrapped(lines, versionLine, regular, { font: 'regular', size: 12, color: 'orange', lineHeight: 16, kind: 'version', spaceBefore: 10 });
	}
	for (const block of blocks.slice(1)) {
		const paragraphs = block.split('\n').map((line) => line.trim()).filter(Boolean);
		const [heading, ...body] = paragraphs;
		if (!heading) continue;
		pushWrapped(lines, heading, bold, { font: 'bold', size: 12, color: 'ink', lineHeight: 16, kind: 'heading', spaceBefore: 18 });
		body.forEach((paragraph, index) => {
			pushWrapped(lines, paragraph, regular, {
				font: 'regular', size: 10, color: 'ink', lineHeight: 14, kind: 'body', spaceBefore: index === 0 ? 6 : 8
			});
		});
	}
	return lines;
}

function packPages(lines: StyledLine[]) {
	const pages: StyledLine[][] = [];
	let page: StyledLine[] = [];
	let y = CONTENT_TOP;

	const startPage = () => {
		if (page.length === 0) return;
		pages.push(page);
		page = [];
		y = CONTENT_TOP;
	};

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		if (line.kind === 'heading' && page.length > 0) {
			let needed = line.spaceBefore + line.lineHeight;
			let bodyLines = 0;
			for (let follow = index + 1; follow < lines.length && bodyLines < 2; follow += 1) {
				const next = lines[follow];
				if (next.kind === 'heading' || next.kind === 'title') break;
				needed += next.spaceBefore + next.lineHeight;
				if (next.kind === 'body') bodyLines += 1;
			}
			if (y - needed < CONTENT_BOTTOM) startPage();
		}
		const space = page.length === 0 ? 0 : line.spaceBefore;
		if (y - (space + line.lineHeight) < CONTENT_BOTTOM && page.length > 0) startPage();
		const spaceBefore = page.length === 0 ? 0 : line.spaceBefore;
		page.push({ ...line, spaceBefore });
		y -= spaceBefore + line.lineHeight;
	}
	if (page.length > 0) pages.push(page);
	return pages.length > 0 ? pages : [[]];
}

export async function createLegalPdf(input: LegalPdfInput) {
	const context = await createBrandPdf();
	const { pdf, regular, bold, colors } = context;
	const lines = legalPdfLines(input.content, regular, bold);
	const pages = packPages(lines);
	const title = lines.find((line) => line.kind === 'title')?.text ?? 'Allgemeine Geschäftsbedingungen';
	pdf.setTitle(title);
	pdf.setAuthor('Emilian Scheel, handelnd unter ALL IN AGI');
	pdf.setCreator('ALL IN AGI');
	pdf.setProducer('ALL IN AGI');

	pages.forEach((pageLines, index) => {
		const page = index === 0 ? context.page : pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
		const footer = `AGB ${input.version} | ${input.hackathonId} | Seite ${index + 1} von ${pages.length}`;
		drawBrandChrome({ ...context, page }, footer);
		let y = CONTENT_TOP;
		for (const line of pageLines) {
			y -= line.spaceBefore;
			page.drawText(line.text, {
				x: LEFT,
				y,
				font: line.font === 'bold' ? bold : regular,
				size: line.size,
				color: line.color === 'orange' ? colors.orange : colors.ink
			});
			y -= line.lineHeight;
		}
	});

	return pdf.save();
}
