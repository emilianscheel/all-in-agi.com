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
import { createZugferdXml, formatIban, formatInvoiceDate, formatInvoiceMoney, type InvoiceSnapshot } from './invoice';

function addressLines(address: InvoiceSnapshot['customer']['address']) {
	return [
		address.street,
		`${address.postalCode} ${address.city}`.trim(),
		address.country
	].filter(Boolean);
}

export async function createInvoicePdf(snapshot: InvoiceSnapshot) {
	const locale = snapshot.locale ?? 'de';
	const en = locale === 'en';
	const context = await createBrandPdf();
	const { pdf, page, regular, bold } = context;
	const { orange, ink, muted, line, surface } = context.colors;
	const split = snapshot.version === 2 || snapshot.version === 3;
	pdf.setTitle(`${en ? (split && snapshot.kind === 'down-payment' ? 'Deposit invoice' : split ? 'Final invoice' : 'Invoice') : (split && snapshot.kind === 'down-payment' ? 'Anzahlungsrechnung' : split ? 'Endrechnung' : 'Rechnung')} ${snapshot.invoiceNumber}`);
	pdf.setAuthor('Emilian Scheel, handelnd unter ALL IN AGI');
	pdf.setSubject('ZUGFeRD 2.3 / EN 16931 Hybridrechnung');
	pdf.setKeywords(['ZUGFeRD', 'EN 16931', 'Rechnung']);
	pdf.setCreator('ALL IN AGI');
	pdf.setProducer('ALL IN AGI');
	const invoiceTitle = en
		? (split ? (snapshot.kind === 'down-payment' ? 'Deposit invoice' : 'Final invoice') : 'Invoice')
		: (split ? (snapshot.kind === 'down-payment' ? 'Anzahlungsrechnung' : 'Endrechnung') : 'Rechnung');
	drawBrandChrome(context, `${invoiceTitle} ${snapshot.invoiceNumber}`);

	page.drawText(invoiceTitle, { x: LEFT, y: 724, font: bold, size: invoiceTitle.length > 14 ? 25 : 30, color: ink });
	page.drawText(safeText(snapshot.invoiceNumber), { x: LEFT, y: 698, font: regular, size: 12, color: orange });

	const metaLabelX = 360;
	const metaValueRight = RIGHT;
	for (const [index, [label, value]] of [
		[en ? 'INVOICE DATE' : 'RECHNUNGSDATUM', formatInvoiceDate(snapshot.issueDate, locale)],
		[en ? (split && snapshot.kind === 'down-payment' ? 'EXPECTED SERVICE DATE' : 'SERVICE DATE') : (split && snapshot.kind === 'down-payment' ? 'VORAUSS. LEISTUNGSDATUM' : 'LEISTUNGSDATUM'), snapshot.serviceDate ? formatInvoiceDate(snapshot.serviceDate, locale) : (en ? 'Date to be agreed' : 'Termin noch zu vereinbaren')],
		[en ? 'DUE DATE' : 'ZAHLBAR BIS', formatInvoiceDate(snapshot.dueDate, locale)]
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
	if (snapshot.customer.vatId) page.drawText(safeText(`${en ? 'VAT ID' : 'USt-IdNr.'}: ${snapshot.customer.vatId}`), { x: LEFT, y: customerTop - 72, font: regular, size: 7.5, color: muted });
	if (snapshot.customer.purchaseOrder) page.drawText(safeText(`${en ? 'Purchase order' : 'Bestellnummer'}: ${snapshot.customer.purchaseOrder}`), { x: LEFT, y: customerTop - 84, font: regular, size: 7.5, color: muted });

	page.drawText(en ? 'ISSUER' : 'AUSSTELLER', { x: 360, y: 628, font: bold, size: 6.8, color: muted });
	page.drawText(safeText(snapshot.seller.legalName), { x: 360, y: 612, font: bold, size: 9.5, color: ink });
	page.drawText(safeText(snapshot.seller.brandName), { x: 360, y: 598, font: regular, size: 9.5, color: ink });
	addressLines(snapshot.seller.address).forEach((value, index) => {
		page.drawText(safeText(value), { x: 360, y: 584 - index * 14, font: regular, size: 9.5, color: ink });
	});
	if (snapshot.seller.taxIdValue) {
		drawWrapped(
			page,
			snapshot.seller.taxIdLabel
				? `${snapshot.seller.taxIdLabel}: ${snapshot.seller.taxIdValue}`
				: snapshot.seller.taxIdValue,
			360,
			542,
			RIGHT - 360,
			regular,
			8.5,
			muted,
			2,
			11
		);
	}

	page.drawText(en ? 'Services' : 'Leistungsübersicht', { x: LEFT, y: 503, font: bold, size: 16, color: ink });
	page.drawLine({ start: { x: LEFT, y: 480 }, end: { x: RIGHT, y: 480 }, thickness: 1, color: line });
	page.drawText(en ? 'ITEM' : 'POSITION', { x: LEFT, y: 489, font: bold, size: 6.8, color: muted });
	drawRight(page, en ? 'NET' : 'NETTO', RIGHT, 489, bold, 6.8, muted);

	let rowY = 456;
	for (const item of snapshot.items) {
		drawWrapped(page, item.description, LEFT, rowY, 350, regular, 10, ink, 2, 12);
		drawRight(page, formatInvoiceMoney(item.netAmountCents, locale), RIGHT, rowY, regular, 10, ink);
		rowY -= 32;
	}
	page.drawLine({ start: { x: LEFT, y: rowY + 10 }, end: { x: RIGHT, y: rowY + 10 }, thickness: 1, color: line });

	const totals = [
		[en ? 'Net amount' : 'Nettobetrag', snapshot.netTotalCents, false],
		[`${en ? 'VAT' : 'Umsatzsteuer'} ${snapshot.vatRatePercent} %`, snapshot.vatAmountCents, false],
		[en ? 'Total amount' : 'Gesamtbetrag', snapshot.grossTotalCents, true]
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
			formatInvoiceMoney(amount, locale),
			RIGHT,
			totalY,
			emphasized ? bold : regular,
			emphasized ? 13 : 9.5,
			emphasized ? orange : ink
		);
		totalY -= emphasized ? 28 : 22;
	}

	drawRoundedCard(page, LEFT, 94, RIGHT - LEFT, 92, 14, surface);
	const paymentRight = RIGHT - 16;
	const valueSize = 8.4;
	const referenceLabel = en ? 'REFERENCE' : 'Verwendungszweck';
	const referenceValue = safeText(snapshot.invoiceNumber);
	const referenceWidth = Math.max(
		bold.widthOfTextAtSize(referenceLabel, 7),
		regular.widthOfTextAtSize(referenceValue, valueSize)
	);
	const transferNote = en
		? `Please transfer the total amount by ${formatInvoiceDate(snapshot.dueDate, locale)} without deduction.`
		: `Bitte überweisen Sie den Gesamtbetrag bis zum ${formatInvoiceDate(snapshot.dueDate, locale)} ohne Abzug.`;
	page.drawText(en ? 'PAYMENT' : 'ZAHLUNG', { x: 64, y: 164, font: bold, size: 7, color: muted });
	drawRight(page, referenceLabel, paymentRight, 164, bold, 7, muted);
	drawWrapped(page, transferNote, 64, 150, paymentRight - 64 - referenceWidth - 18, regular, 9.2, ink, 2, 11);
	drawRight(page, referenceValue, paymentRight, 150, regular, valueSize, ink);
	const paymentColumns = [
		[en ? 'ACCOUNT HOLDER' : 'Kontoinhaber', snapshot.payment.accountHolder],
		['IBAN', formatIban(snapshot.payment.iban)],
		['BIC', snapshot.payment.bic],
		[en ? 'BANK' : 'Bank', snapshot.payment.bank ?? '']
	].filter((entry): entry is [string, string] => Boolean(entry[1]));
	const columnGap = 12;
	const columnWidths = paymentColumns.map(([label, value]) => Math.max(
		bold.widthOfTextAtSize(label, 7),
		regular.widthOfTextAtSize(safeText(value), valueSize)
	));
	const used = columnWidths.reduce((sum, width) => sum + width, 0) + columnGap * Math.max(0, paymentColumns.length - 1);
	const extraGap = paymentColumns.length > 1 ? Math.max(0, paymentRight - 64 - used) / (paymentColumns.length - 1) : 0;
	let columnX = 64;
	for (const [index, [label, value]] of paymentColumns.entries()) {
		page.drawText(label, { x: columnX, y: 122, font: bold, size: 7, color: muted });
		page.drawText(safeText(value), { x: columnX, y: 108, font: regular, size: valueSize, color: ink });
		columnX += columnWidths[index] + columnGap + extraGap;
	}

	await pdf.attach(new TextEncoder().encode(createZugferdXml(snapshot)), 'factur-x.xml', {
		mimeType: 'application/xml',
		description: 'ZUGFeRD 2.3 EN16931 invoice data',
		creationDate: new Date(`${snapshot.issueDate}T00:00:00Z`),
		modificationDate: new Date(`${snapshot.issueDate}T00:00:00Z`)
	});

	return pdf.save();
}
