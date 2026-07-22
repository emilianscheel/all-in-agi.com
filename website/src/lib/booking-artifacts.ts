import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { formatPrice, getPrice, type BookingConfiguration } from './booking';

function safeText(value: unknown) {
	return String(value ?? '').replace(/[–—−]/g, '-').replace(/·/g, '-').replace(/[^\x20-\x7e\xa0-\xff€]/g, '?');
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number, maxLines = 2) {
	const words = safeText(text).split(/\s+/).filter(Boolean);
	const lines: string[] = [];
	let line = '';
	for (const word of words) {
		const next = line ? `${line} ${word}` : word;
		if (font.widthOfTextAtSize(next, size) <= maxWidth) line = next;
		else { if (line) lines.push(line); line = word; if (lines.length >= maxLines) break; }
	}
	if (line && lines.length < maxLines) lines.push(line);
	if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, -3)}...`;
	return lines;
}

function drawWrapped(page: PDFPage, text: string, x: number, y: number, maxWidth: number, font: PDFFont, size: number, color = rgb(.12, .12, .13), maxLines = 2) {
	const lines = wrap(text, font, size, maxWidth, maxLines);
	lines.forEach((line, index) => page.drawText(line, { x, y: y - index * (size + 3), font, size, color }));
	return lines.length;
}

function dateLabel(value: string, withTime = false) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'Noch offen';
	return new Intl.DateTimeFormat('de-DE', { dateStyle: withTime ? undefined : 'long', weekday: withTime ? 'short' : undefined, day: withTime ? '2-digit' : undefined, month: withTime ? 'short' : undefined, hour: withTime ? '2-digit' : undefined, minute: withTime ? '2-digit' : undefined, timeZone: 'Europe/Berlin' }).format(date);
}

export async function createPlanPdf(config: BookingConfiguration) {
	const pdf = await PDFDocument.create();
	const page = pdf.addPage([595.28, 841.89]);
	const regular = await pdf.embedFont(StandardFonts.Helvetica);
	const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
	const orange = rgb(1, .31, .094);
	const ink = rgb(.11, .11, .12);
	const muted = rgb(.43, .43, .45);
	const surface = rgb(.96, .96, .97);
	const price = getPrice(config.capacity, config.venueProvided, config.lunch);
	const left = 48;
	const right = 547;

	page.drawRectangle({ x: 0, y: 823, width: 595.28, height: 19, color: orange });
	page.drawText('WERKSPRUNG', { x: left, y: 780, font: bold, size: 11, color: orange });
	page.drawText('Agentic Engineering Hackathon', { x: left, y: 742, font: bold, size: 27, color: ink });
	drawWrapped(page, config.companyName, left, 716, 360, regular, 14, muted, 1);
	page.drawText(formatPrice(price.totalPrice), { x: right - bold.widthOfTextAtSize(formatPrice(price.totalPrice), 20), y: 716, font: bold, size: 20, color: ink });

	page.drawRectangle({ x: left, y: 562, width: 499, height: 125, color: surface });
	page.drawText('EVENT', { x: 66, y: 657, font: bold, size: 9, color: muted });
	page.drawText(dateLabel(config.preferredEventDate), { x: 66, y: 635, font: bold, size: 13, color: ink });
	page.drawText(`Bis ${config.capacity} Personen`, { x: 66, y: 612, font: regular, size: 11, color: ink });
	drawWrapped(page, `${config.address.street}, ${config.address.postalCode} ${config.address.city}`, 66, 589, 210, regular, 10, muted, 2);
	page.drawText('PREP CALL', { x: 324, y: 657, font: bold, size: 9, color: muted });
	page.drawText(dateLabel(config.consultationSlot, true), { x: 324, y: 635, font: bold, size: 13, color: ink });
	page.drawText('30 Minuten - Europe/Berlin', { x: 324, y: 612, font: regular, size: 10, color: muted });

	page.drawText('Konfiguration', { x: left, y: 526, font: bold, size: 17, color: ink });
	const lunchLabel = config.lunch === 'pizza' ? 'Pizza - inklusive' : config.lunch === 'none' ? 'No lunch - 500 EUR' : `${config.customLunch} - +500 EUR`;
	const rows = [
		['Location', config.venueProvided ? 'Eigene Location' : 'Von WERKSPRUNG organisiert'],
		['Demo Setup', config.equipment === 'projector' ? 'Projector' : config.equipment === 'tv' ? 'Display' : 'Screen wird mitgebracht'],
		['Lunch', lunchLabel],
		['Inklusive', 'Winner Poster, Event-Fotos, Cookies und Anreise in Deutschland']
	];
	let y = 495;
	for (const [label, value] of rows) {
		page.drawText(label, { x: left, y, font: bold, size: 10, color: muted });
		drawWrapped(page, value, 160, y, 380, regular, 11, ink, 2);
		y -= label === 'Inklusive' ? 42 : 31;
	}

	page.drawText('Kontakt', { x: left, y: 350, font: bold, size: 17, color: ink });
	page.drawRectangle({ x: left, y: 245, width: 499, height: 80, color: surface });
	drawWrapped(page, config.contactName, 66, 298, 210, bold, 12, ink, 1);
	drawWrapped(page, config.email, 66, 277, 210, regular, 10, muted, 1);
	drawWrapped(page, config.phone, 324, 298, 205, bold, 12, ink, 1);
	page.drawText('Ansprechperson für den Hackathon', { x: 324, y: 277, font: regular, size: 10, color: muted });

	page.drawLine({ start: { x: left, y: 206 }, end: { x: right, y: 206 }, thickness: 1, color: rgb(.88, .88, .9) });
	page.drawText('Preisübersicht', { x: left, y: 178, font: bold, size: 11, color: ink });
	page.drawText(`Basis ${formatPrice(price.basePrice)}  |  Location ${price.venueSurcharge ? `+${formatPrice(price.venueSurcharge)}` : 'inklusive'}  |  Lunch ${price.lunchAdjustment === 0 ? 'inklusive' : `${price.lunchAdjustment > 0 ? '+' : '-'}${formatPrice(Math.abs(price.lunchAdjustment))}`}`, { x: left, y: 157, font: regular, size: 10, color: muted });
	page.drawText(`Gesamt ${formatPrice(price.totalPrice)} netto`, { x: left, y: 124, font: bold, size: 18, color: orange });
	page.drawText(`Planungsstand ${new Intl.DateTimeFormat('de-DE').format(new Date())}`, { x: left, y: 54, font: regular, size: 9, color: muted });
	page.drawText('werksprung.de', { x: right - regular.widthOfTextAtSize('werksprung.de', 9), y: 54, font: regular, size: 9, color: muted });
	return pdf.save();
}
