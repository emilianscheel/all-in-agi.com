import { describe, expect, test } from 'bun:test';
import { PDFDocument } from 'pdf-lib';
import type { BookingConfiguration } from '$lib/booking';
import {
	bookingDetailUrl,
	buildBookingConfirmationText,
	sendBookingConfirmationEmails
} from './booking-confirmation-email';

const config: BookingConfiguration = {
	capacity: 15,
	venueProvided: true,
	equipment: 'projector',
	lunch: 'pizza',
	customLunch: '',
	toolProvision: 'existing',
	codingTools: ['codex'],
	customCodingTool: '',
	companyName: 'Musterwerke GmbH',
	contactName: 'Ada Beispiel',
	email: 'ada@example.com',
	phone: '+49 30 123456',
	message: '',
	address: {
		label: 'Musterstraße 1, 10115 Berlin',
		street: 'Musterstraße 1',
		postalCode: '10115',
		city: 'Berlin',
		country: 'Deutschland'
	},
	preferredEventDate: '2099-06-20',
	consultationSlot: '2099-05-10T10:00:00.000Z'
};

const input = {
	id: 'HAA-AAA-AAA',
	config,
	booking: {
		start: '2099-05-10T10:00:00.000Z',
		end: '2099-05-10T11:00:00.000Z',
		uid: 'booking-1',
		icsUid: 'booking-1@all-in-agi.com',
		title: 'ALL-IN-AGI Prep Call',
		meetingUrl: 'https://meet.example.com/booking-1'
	}
};

function acceptedResponse(address: string, status: 'delivered' | 'queued' = 'delivered') {
	return Response.json({
		success: true,
		result: {
			delivered: status === 'delivered' ? [address] : [],
			queued: status === 'queued' ? [address] : [],
			permanent_bounces: [],
			message_id: `message-${address}`
		}
	});
}

describe('booking confirmation email', () => {
	test('builds the exact plain-text confirmation structure', () => {
		const text = buildBookingConfirmationText(input);
		expect(text.split('\n').slice(0, 2)).toEqual([
			'Hallo Ada Beispiel,',
			'vielen Dank für Ihre Buchung. Ihr ALL IN AGI Hackathon ist bestätigt.'
		]);
		expect(text).toContain('- Coding Tools: Bereits vorhanden: Codex — Inklusive');
		expect(text).toContain('- Gesamt: Gesamt — 4.000 € netto');
		expect(text.endsWith('https://all-in-agi.com/HAA-AAA-AAA')).toBe(true);
		expect(bookingDetailUrl(input.id)).toBe('https://all-in-agi.com/HAA-AAA-AAA');
	});

	test('sends customer and organizer copies with the same generated attachments', async () => {
		const requests: Array<{ url: string; init?: RequestInit }> = [];
		const result = await sendBookingConfirmationEmails(input, {
			accountId: 'account-123',
			apiToken: 'secret-token',
			fetch: async (url, init) => {
				requests.push({ url: String(url), init });
				const body = JSON.parse(String(init?.body));
				return acceptedResponse(body.to.address);
			}
		});

		expect(result.customer).toMatchObject({
			role: 'customer',
			sent: true,
			status: 'delivered'
		});
		expect(result.organizer).toMatchObject({
			role: 'organizer',
			sent: true,
			status: 'delivered'
		});
		expect(requests).toHaveLength(2);
		for (const request of requests) {
			expect(request.url).toBe(
				'https://api.cloudflare.com/client/v4/accounts/account-123/email/sending/send'
			);
			expect(new Headers(request.init?.headers).get('authorization')).toBe('Bearer secret-token');
		}

		const bodies = requests.map((request) => JSON.parse(String(request.init?.body)));
		const customerBody = bodies.find((body) => body.to.address === config.email);
		const organizerBody = bodies.find((body) => body.to.address === 'go@all-in-agi.com');
		expect(customerBody).toMatchObject({
			from: { address: 'go@all-in-agi.com', name: 'ALL IN AGI' },
			reply_to: { address: 'go@all-in-agi.com', name: 'ALL IN AGI' },
			to: { address: 'ada@example.com', name: 'Ada Beispiel' },
			subject: 'Buchungsbestätigung HAA-AAA-AAA',
			headers: { 'X-Booking-ID': 'HAA-AAA-AAA' }
		});
		expect(organizerBody.to).toEqual({ address: 'go@all-in-agi.com', name: 'ALL IN AGI' });
		expect(organizerBody.text).toBe(customerBody.text);
		expect(organizerBody.subject).toBe(customerBody.subject);
		expect(organizerBody.attachments).toEqual(customerBody.attachments);
		expect(customerBody.html).toBeUndefined();
		expect(customerBody.attachments.map(
			(attachment: { filename: string; type: string }) => ({
				filename: attachment.filename,
				type: attachment.type
			})
		)).toEqual([
			{
				filename: 'all-in-agi-prep-call-HAA-AAA-AAA.ics',
				type: 'text/calendar; charset=utf-8'
			},
			{
				filename: 'all-in-agi-hackathon-HAA-AAA-AAA.pdf',
				type: 'application/pdf'
			}
		]);
		const calendar = Buffer.from(customerBody.attachments[0].content, 'base64').toString('utf8');
		expect(calendar).toContain('LOCATION:https://meet.example.com/booking-1');
		expect(calendar).toContain('UID:booking-1@all-in-agi.com');
		const pdfBytes = Buffer.from(customerBody.attachments[1].content, 'base64');
		expect((await PDFDocument.load(pdfBytes)).getPageCount()).toBe(1);
	});

	test('accepts queued responses for both recipients', async () => {
		const result = await sendBookingConfirmationEmails(input, {
			accountId: 'account-123',
			apiToken: 'secret-token',
			fetch: async (_url, init) => {
				const body = JSON.parse(String(init?.body));
				return acceptedResponse(body.to.address, 'queued');
			}
		});
		expect(result.customer).toMatchObject({ sent: true, status: 'queued' });
		expect(result.organizer).toMatchObject({ sent: true, status: 'queued' });
	});

	test('reports missing credentials without making a request', async () => {
		let fetchCalled = false;
		const result = await sendBookingConfirmationEmails(input, {
			accountId: '',
			apiToken: '',
			fetch: async () => {
				fetchCalled = true;
				return Response.json({});
			}
		});
		expect(fetchCalled).toBe(false);
		expect(result.customer).toMatchObject({
			sent: false,
			error: {
				stage: 'configuration',
				providerCode: 'configuration_missing'
			}
		});
		expect(result.organizer).toMatchObject({
			sent: false,
			error: { stage: 'configuration' }
		});
	});

	test('reports attachment preparation failures with the original cause', async () => {
		let fetchCalled = false;
		const result = await sendBookingConfirmationEmails(input, {
			accountId: 'account-123',
			apiToken: 'secret-token',
			createPdf: async () => {
				throw new Error('font asset missing');
			},
			fetch: async () => {
				fetchCalled = true;
				return Response.json({});
			}
		});
		expect(fetchCalled).toBe(false);
		expect(result.customer).toMatchObject({
			sent: false,
			error: {
				stage: 'attachments',
				providerCode: 'attachment_generation_failed',
				causeName: 'Error',
				causeMessage: 'font asset missing'
			}
		});
		expect(result.organizer).toMatchObject({
			sent: false,
			error: { stage: 'attachments' }
		});
	});

	test('keeps recipient delivery attempts independent', async () => {
		const result = await sendBookingConfirmationEmails(input, {
			accountId: 'account-123',
			apiToken: 'secret-token',
			fetch: async (_url, init) => {
				const body = JSON.parse(String(init?.body));
				if (body.to.address === 'go@all-in-agi.com') {
					return Response.json({
						success: false,
						errors: [{ code: 10101, message: 'unauthorized' }],
						result: null
					}, { status: 401 });
				}
				return acceptedResponse(body.to.address);
			}
		});
		expect(result.customer).toMatchObject({ sent: true, status: 'delivered' });
		expect(result.organizer).toMatchObject({
			sent: false,
			error: { stage: 'provider', status: 401, providerCode: 10101 }
		});
	});

	test('reports permanent bounces as provider failures', async () => {
		const result = await sendBookingConfirmationEmails(input, {
			accountId: 'account-123',
			apiToken: 'secret-token',
			fetch: async (_url, init) => {
				const body = JSON.parse(String(init?.body));
				return Response.json({
					success: true,
					result: {
						delivered: [],
						queued: [],
						permanent_bounces: [body.to.address],
						message_id: 'message-bounced'
					}
				});
			}
		});
		expect(result.customer).toMatchObject({
			sent: false,
			error: {
				stage: 'provider',
				providerCode: 'delivery_not_accepted',
				messageId: 'message-bounced'
			}
		});
		expect(result.organizer).toMatchObject({ sent: false, error: { stage: 'provider' } });
	});

	test('reports oversized payloads and network failures by stage', async () => {
		const oversized = await sendBookingConfirmationEmails(input, {
			accountId: 'account-123',
			apiToken: 'secret-token',
			maxMessageBytes: 1,
			fetch: async () => Response.json({})
		});
		expect(oversized.customer).toMatchObject({
			sent: false,
			error: { stage: 'serialization', providerCode: 'message_too_big' }
		});
		expect(oversized.organizer).toMatchObject({
			sent: false,
			error: { stage: 'serialization', providerCode: 'message_too_big' }
		});

		const network = await sendBookingConfirmationEmails(input, {
			accountId: 'account-123',
			apiToken: 'secret-token',
			fetch: async () => {
				throw new TypeError('fetch failed');
			}
		});
		expect(network.customer).toMatchObject({
			sent: false,
			error: {
				stage: 'network',
				providerCode: 'network_error',
				causeName: 'TypeError',
				causeMessage: 'fetch failed'
			}
		});
		expect(network.organizer).toMatchObject({ sent: false, error: { stage: 'network' } });
	});
});
