import { describe, expect, test } from 'bun:test';
import { EmailTransportError, sendEmailMessage } from './email-transport';

const message = {
	to: { address: 'ada@example.com', name: 'Ada Beispiel' },
	subject: 'Test',
	text: 'Plain text',
	html: '<p>Plain text</p>',
	headers: { 'X-Booking-ID': 'HAA-AAA-AAA' },
	attachments: [{ content: 'JVBERg==', filename: 'plan.pdf', type: 'application/pdf', disposition: 'attachment' as const }]
};
const credentials = { username: 'owner@icloud.com', password: 'test-password' };

describe('iCloud SMTP transport', () => {
	test('preserves sender, recipient, content, headers, and attachment bytes', async () => {
		let submitted: any;
		const result = await sendEmailMessage(message, {
			...credentials,
			sendMail: async (options) => {
				submitted = options;
				return { accepted: ['ada@example.com'], messageId: '<mail-1@icloud.com>' };
			}
		});
		expect(result).toEqual({ status: 'accepted', messageId: '<mail-1@icloud.com>' });
		expect(submitted).toMatchObject({
			from: { address: 'go@all-in-agi.com', name: 'Emilian von ALL IN AGI' },
			replyTo: { address: 'go@all-in-agi.com', name: 'Emilian von ALL IN AGI' },
			to: message.to,
			subject: message.subject,
			text: message.text,
			html: message.html,
			headers: message.headers
		});
		expect(submitted.attachments).toEqual([{
			filename: 'plan.pdf',
			content: Buffer.from([37, 80, 68, 70]),
			contentType: 'application/pdf',
			contentDisposition: 'attachment'
		}]);
	});

	test('requires credentials before sending', async () => {
		let called = false;
		await expect(sendEmailMessage(message, {
			username: '', password: '',
			sendMail: async () => { called = true; return { accepted: [] }; }
		})).rejects.toMatchObject({ stage: 'configuration', details: { providerCode: 'configuration_missing' } });
		expect(called).toBe(false);
	});

	test('does not claim delivery when SMTP rejects the recipient', async () => {
		await expect(sendEmailMessage(message, {
			...credentials,
			sendMail: async () => ({ accepted: [], rejected: ['ada@example.com'], messageId: 'mail-2' })
		})).rejects.toMatchObject({
			stage: 'provider',
			details: { providerCode: 'recipient_not_accepted', messageId: 'mail-2' }
		});
	});

	test('maps connection and authentication failures', async () => {
		for (const [code, stage] of [['ETIMEDOUT', 'network'], ['EAUTH', 'provider']] as const) {
			try {
				await sendEmailMessage(message, {
					...credentials,
					sendMail: async () => { throw Object.assign(new Error('SMTP failure'), { code, responseCode: 535 }); }
				});
				throw new Error('Expected SMTP failure');
			} catch (error) {
				expect(error).toBeInstanceOf(EmailTransportError);
				expect(error).toMatchObject({ stage, details: { providerCode: code, status: 535 } });
			}
		}
	});
});
