import { describe, expect, test } from 'bun:test';
import { PDFDocument } from 'pdf-lib';
import { legalDocumentPlainText } from './legal';
import { createLegalPdf } from './legal-pdf';

describe('AGB PDF', () => {
	test('renders the frozen terms across multiple branded pages', async () => {
		const content = legalDocumentPlainText();
		const bytes = await createLegalPdf({
			content,
			version: '2026-10-19.1',
			hackathonId: 'H23-1D9-GX2'
		});
		const pdf = await PDFDocument.load(bytes);
		expect(pdf.getPageCount()).toBeGreaterThan(1);
		expect(bytes.length).toBeGreaterThan(10_000);
		expect(pdf.getTitle()).toContain('ALLGEMEINE GESCHÄFTSBEDINGUNGEN');
		expect(pdf.getAuthor()).toBe('Emilian Scheel, handelnd unter ALL IN AGI');
	});
});
