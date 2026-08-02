import {
	LEFT,
	RIGHT,
	createBrandPdf,
	drawBrandChrome,
	drawRight,
	drawRoundedCard,
	drawWrapped,
	safeText
} from './booking-artifacts';
import { createZugferdXml, formatInvoiceDate, formatInvoiceMoney, type InvoiceSnapshot } from './invoice';

function addressLines(address: InvoiceSnapshot['customer']['address']) {
	return [
		address.street,
		`${address.postalCode} ${address.city}`.trim(),
		address.country
	].filter(Boolean);
}

export async function createInvoicePdf(snapshot: InvoiceSnapshot) {
	const context = await createBrandPdf();
	const { pdf, page, regular, bold } = context;
	const { orange, ink, muted, line, surface } = context.colors;
	pdf.setTitle(`${snapshot.version === 2 && snapshot.kind === 'down-payment' ? 'Anzahlungsrechnung' : snapshot.version === 2 ? 'Endrechnung' : 'Rechnung'} ${snapshot.invoiceNumber}`);
	pdf.setAuthor('Emilian Scheel, handelnd unter ALL IN AGI');
	pdf.setSubject('ZUGFeRD 2.3 / EN 16931 Hybridrechnung');
	pdf.setKeywords(['ZUGFeRD', 'EN 16931', 'Rechnung']);
	pdf.setCreator('ALL IN AGI');
	pdf.setProducer('ALL IN AGI');
	const invoiceTitle = snapshot.version === 2
		? snapshot.kind === 'down-payment' ? 'Anzahlungsrechnung' : 'Endrechnung'
		: 'Rechnung';
	drawBrandChrome(context, `${invoiceTitle} ${snapshot.invoiceNumber}`);

	page.drawText(invoiceTitle, { x: LEFT, y: 724, font: bold, size: invoiceTitle.length > 14 ? 25 : 30, color: ink });
	page.drawText(safeText(snapshot.invoiceNumber), { x: LEFT, y: 698, font: regular, size: 12, color: orange });

	const metaLabelX = 360;
	const metaValueRight = RIGHT;
	for (const [index, [label, value]] of [
		['RECHNUNGSDATUM', formatInvoiceDate(snapshot.issueDate)],
		[snapshot.version === 2 && snapshot.kind === 'down-payment' ? 'VORAUSS. LEISTUNGSDATUM' : 'LEISTUNGSDATUM', formatInvoiceDate(snapshot.serviceDate)],
		['ZAHLBAR BIS', formatInvoiceDate(snapshot.dueDate)]
	].entries()) {
		const y = 729 - index * 28;
		page.drawText(label, { x: metaLabelX, y, font: bold, size: 6.8, color: muted });
		drawRight(page, value, metaValueRight, y - 13, regular, 10, ink);
	}

	page.drawText(
		safeText(`${snapshot.seller.brandName} | ${snapshot.seller.address.street} | ${snapshot.seller.address.postalCode} ${snapshot.seller.address.city}`),
		{ x: LEFT, y: 650, font: regular, size: 6.5, color: muted }
	);
	const customerCompany = `${snapshot.customer.companyName}${snapshot.customer.legalForm ? ` ${snapshot.customer.legalForm}` : ''}`;
	const companyLines = drawWrapped(page, customerCompany, LEFT, 628, 250, bold, 13, ink, 2, 15);
	const customerTop = 612 - (companyLines - 1) * 15;
	page.drawText(safeText(snapshot.customer.contactName), { x: LEFT, y: customerTop, font: regular, size: 9.5, color: ink });
	addressLines(snapshot.customer.address).forEach((value, index) => {
		page.drawText(safeText(value), { x: LEFT, y: customerTop - 17 - index * 14, font: regular, size: 9.5, color: ink });
	});
	drawWrapped(page, snapshot.customer.email, LEFT, customerTop - 59, 250, regular, 9, muted, 2, 11);
	if (snapshot.customer.vatId) page.drawText(safeText(`USt-IdNr.: ${snapshot.customer.vatId}`), { x: LEFT, y: customerTop - 72, font: regular, size: 7.5, color: muted });
	if (snapshot.customer.purchaseOrder) page.drawText(safeText(`Bestellnummer: ${snapshot.customer.purchaseOrder}`), { x: LEFT, y: customerTop - 84, font: regular, size: 7.5, color: muted });

	page.drawText('AUSSTELLER', { x: 360, y: 628, font: bold, size: 6.8, color: muted });
	page.drawText(safeText(snapshot.seller.legalName), { x: 360, y: 612, font: bold, size: 9.5, color: ink });
	page.drawText(safeText(snapshot.seller.brandName), { x: 360, y: 598, font: regular, size: 9.5, color: ink });
	addressLines(snapshot.seller.address).forEach((value, index) => {
		page.drawText(safeText(value), { x: 360, y: 584 - index * 14, font: regular, size: 9.5, color: ink });
	});
	drawWrapped(
		page,
		`${snapshot.seller.taxIdLabel}: ${snapshot.seller.taxIdValue}`,
		360,
		542,
		RIGHT - 360,
		regular,
		8.5,
		muted,
		2,
		11
	);

	page.drawText('Leistungsübersicht', { x: LEFT, y: 503, font: bold, size: 16, color: ink });
	page.drawLine({ start: { x: LEFT, y: 480 }, end: { x: RIGHT, y: 480 }, thickness: 1, color: line });
	page.drawText('POSITION', { x: LEFT, y: 489, font: bold, size: 6.8, color: muted });
	drawRight(page, 'NETTO', RIGHT, 489, bold, 6.8, muted);

	let rowY = 456;
	for (const item of snapshot.items) {
		drawWrapped(page, item.description, LEFT, rowY, 350, regular, 10, ink, 2, 12);
		drawRight(page, formatInvoiceMoney(item.netAmountCents), RIGHT, rowY, regular, 10, ink);
		rowY -= 32;
	}
	page.drawLine({ start: { x: LEFT, y: rowY + 10 }, end: { x: RIGHT, y: rowY + 10 }, thickness: 1, color: line });

	const totals = [
		['Nettobetrag', snapshot.netTotalCents, false],
		[`Umsatzsteuer ${snapshot.vatRatePercent} %`, snapshot.vatAmountCents, false],
		['Gesamtbetrag', snapshot.grossTotalCents, true]
	] as const;
	let totalY = rowY - 10;
	for (const [label, amount, emphasized] of totals) {
		page.drawText(label, {
			x: 350,
			y: totalY,
			font: emphasized ? bold : regular,
			size: emphasized ? 13 : 9.5,
			color: emphasized ? ink : muted
		});
		drawRight(
			page,
			formatInvoiceMoney(amount),
			RIGHT,
			totalY,
			emphasized ? bold : regular,
			emphasized ? 13 : 9.5,
			emphasized ? orange : ink
		);
		totalY -= emphasized ? 28 : 22;
	}

	drawRoundedCard(page, LEFT, 94, RIGHT - LEFT, 92, 14, surface);
	page.drawText('ZAHLUNG', { x: 64, y: 164, font: bold, size: 7, color: muted });
	page.drawText(
		`Bitte überweisen Sie den Gesamtbetrag bis zum ${formatInvoiceDate(snapshot.dueDate)} ohne Abzug.`,
		{ x: 64, y: 146, font: regular, size: 9.2, color: ink }
	);
	page.drawText('Kontoinhaber', { x: 64, y: 122, font: bold, size: 7, color: muted });
	page.drawText(safeText(snapshot.payment.accountHolder), { x: 64, y: 108, font: regular, size: 8.8, color: ink });
	page.drawText('IBAN', { x: 230, y: 122, font: bold, size: 7, color: muted });
	page.drawText(safeText(snapshot.payment.iban), { x: 230, y: 108, font: regular, size: 8.8, color: ink });
	page.drawText('BIC', { x: 430, y: 122, font: bold, size: 7, color: muted });
	page.drawText(safeText(snapshot.payment.bic), { x: 430, y: 108, font: regular, size: 8.8, color: ink });

	await pdf.attach(new TextEncoder().encode(createZugferdXml(snapshot)), 'factur-x.xml', {
		mimeType: 'application/xml',
		description: 'ZUGFeRD 2.3 EN16931 invoice data',
		creationDate: new Date(`${snapshot.issueDate}T00:00:00Z`),
		modificationDate: new Date(`${snapshot.issueDate}T00:00:00Z`)
	});

	return pdf.save();
}
