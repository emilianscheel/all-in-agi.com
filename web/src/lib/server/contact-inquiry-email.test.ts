import { describe, expect, test } from 'bun:test';
import {
	buildContactInquiryHtml,
	buildContactInquiryText,
	sendContactInquiryEmails
} from './contact-inquiry-email';

describe('contact inquiry emails', () => {
	test('dumps the message and appends the reply footer', () => {
		expect(buildContactInquiryText('Hello\nthere', 'en')).toBe(
			'Hello\nthere\n\n - \n\nJust reply to this email for any further questions or wishes'
		);
		expect(buildContactInquiryText('Hallo', 'de')).toContain(
			'Antworten Sie einfach auf diese E-Mail bei weiteren Fragen oder Wünschen'
		);
		expect(buildContactInquiryHtml('Hello\n\nWorld', 'en')).toContain('<p>Hello</p>');
		expect(buildContactInquiryHtml('Hello\n\nWorld', 'en')).toContain('<p>World</p>');
		expect(buildContactInquiryHtml('Hello', 'en')).toContain(
			'Just reply to this email for any further questions or wishes'
		);
	});

	test('sends internal and client emails with swapped replyTo', async () => {
		const submitted: Array<{ to: { address: string }; subject: string; replyTo: unknown }> = [];
		await sendContactInquiryEmails(
			{
				name: 'Ada',
				email: 'ada@example.com',
				subject: 'Hackathon',
				message: 'Please call me.',
				locale: 'de'
			},
			{
				username: 'owner@icloud.com',
				password: 'test-password',
				sendMail: async (options) => {
					const to = options.to as { address: string };
					submitted.push({
						to,
						subject: String(options.subject),
						replyTo: options.replyTo
					});
					return {
						accepted: [to.address],
						messageId: `<mail-${submitted.length}@icloud.com>`
					};
				}
			}
		);

		expect(submitted).toHaveLength(2);
		expect(submitted[0]).toMatchObject({
			to: { address: 'go@all-in-agi.com' },
			subject: 'Neue Anfrage: Hackathon',
			replyTo: { address: 'ada@example.com', name: 'Ada' }
		});
		expect(submitted[1]).toMatchObject({
			to: { address: 'ada@example.com' },
			subject: 'Ihre Anfrage: Hackathon',
			replyTo: { address: 'go@all-in-agi.com', name: 'Emilian von ALL IN AGI' }
		});
	});
});
