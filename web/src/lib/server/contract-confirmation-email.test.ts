import { describe, expect, test } from 'bun:test';
import { legalDocumentPlainText } from '$lib/legal';
import type { HackathonRecord } from './hackathons';
import {
	contractConfirmationHtml,
	contractConfirmationText,
	sendContractConfirmationEmail
} from './contract-confirmation-email';

const record = {
	id: 'H23-1D9-GX2',
	contactName: 'Ada <Beispiel>',
	contactEmail: 'ada@example.com',
	companyName: 'Karpfenteich',
	billing: { companyName: 'Karpfenteich & Söhne' },
	capacity: 15,
	totalPrice: 4000,
	eventStart: '2026-10-19T07:00:00.000Z',
	legalVersion: '2026-10-19.1',
	legalContentHash: 'abc123',
	legalModules: ['catering', 'event_photos'],
	legalSnapshot: {
		locale: 'de',
		version: '2026-10-19.1',
		contentHash: 'abc123',
		modules: ['catering', 'event_photos'],
		content: legalDocumentPlainText(['catering', 'event_photos']),
		capturedAt: '2026-10-19T12:32:00.000Z'
	},
	customerAgreementName: 'TestKunde',
	organizerAgreementName: 'Emilian Scheel',
	oralAgreementAt: '2026-10-19T12:32:00.000Z',
	exitDeadline: '2026-10-21T12:32:00.000Z'
} as HackathonRecord;

describe('contract confirmation email', () => {
	test('uses display labels, a bold detail list, and the shared signature', () => {
		const text = contractConfirmationText(record);
		expect(text).toContain('vielen Dank, dass Sie sich für ein Hackathon von ALL IN AGI entschieden haben. Der Vertrag ist mit der mündlichen Zustimmung zustande gekommen.');
		expect(text).not.toContain('B2B-Vertrag');
		expect(text).not.toContain('Preparation Call');
		expect(text).toContain('- Hackathon: H23-1D9-GX2');
		expect(text).not.toContain('Hackathon-ID');
		expect(text).toContain('- Kunde: Karpfenteich & Söhne');
		expect(text).toContain('- Zustimmung Kunde: TestKunde');
		expect(text).not.toContain('Zustimmung ALL IN AGI');
		expect(text).not.toContain('AGB-Prüfsumme');
		expect(text).not.toContain('abc123');
		expect(text).toContain('- Module: Pizza-Catering, Eventfoto-Service');
		expect(text).toContain('30 % Anzahlung mit 14 Tagen Zahlungsziel');
		expect(text).toContain('Viele Grüße\nEmilian Scheel\n\nall-in-agi.com (https://all-in-agi.com)\ngo@all-in-agi.com\n0152 57 25 7750');

		const html = contractConfirmationHtml(record);
		expect(html).toContain('Hallo Ada &lt;Beispiel&gt;,');
		expect(html).toContain('<strong>Hackathon:</strong> H23-1D9-GX2');
		expect(html).toContain('<strong>Kunde:</strong> Karpfenteich &amp; Söhne');
		expect(html).toContain('<strong>Module:</strong> Pizza-Catering, Eventfoto-Service');
		expect(html).toContain('<a href="https://all-in-agi.com">all-in-agi.com</a>');
		expect(html).toContain('<a href="mailto:go@all-in-agi.com">go@all-in-agi.com</a>');
		expect(html).toContain('<a href="tel:+4915257257750">0152 57 25 7750</a>');
		expect(html).not.toContain('AGB-Prüfsumme');
		expect(html).not.toContain('Zustimmung ALL IN AGI');
		expect(html).not.toMatch(/<!doctype|<html|<body/i);
	});

	test('attaches only the branded AGB pdf', async () => {
		let pdfInput: { content: string; version: string; hackathonId: string } | undefined;
		const submissions: any[] = [];
		await sendContractConfirmationEmail(record, {
			username: 'owner@icloud.com',
			password: 'test-password',
			createPdf: async (input) => {
				pdfInput = input;
				return new TextEncoder().encode('%PDF-agb');
			},
			sendMail: async (options) => {
				submissions.push(options);
				return { accepted: ['ada@example.com'], messageId: '<contract@icloud.com>' };
			}
		});

		expect(pdfInput).toEqual({
			content: record.legalSnapshot!.content,
			version: '2026-10-19.1',
			hackathonId: 'H23-1D9-GX2'
		});
		expect(submissions).toHaveLength(1);
		expect(submissions[0].attachments.map((attachment: { filename: string }) => attachment.filename)).toEqual([
			'AGB-2026-10-19.1-H23-1D9-GX2.pdf'
		]);
		expect(submissions[0].html).toContain('<strong>Hackathon:</strong> H23-1D9-GX2');
		expect(submissions[0].from).toEqual({ address: 'go@all-in-agi.com', name: 'Emilian von ALL IN AGI' });
	});
});
