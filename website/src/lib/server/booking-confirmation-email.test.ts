import { describe, expect, test } from 'bun:test';
import { PDFDocument } from 'pdf-lib';
import type { BookingConfiguration } from '$lib/booking';
import {
	bookingDetailUrl,
	buildBookingConfirmationText,
	sendBookingConfirmationEmail
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

	test('sends both generated attachments through the Cloudflare REST API', async () => {
		let requestedUrl = '';
		let requestedInit: RequestInit | undefined;
		const result = await sendBookingConfirmationEmail(input, {
			accountId: 'account-123',
			apiToken: 'secret-token',
			fetch: async (url, init) => {
				requestedUrl = String(url);
				requestedInit = init;
				return Response.json({
					success: true,
					result: {
						delivered: [config.email],
						queued: [],
						permanent_bounces: [],
						message_id: 'message-123'
					}
				});
			}
		});

		expect(result).toEqual({ messageId: 'message-123', status: 'delivered' });
		expect(requestedUrl).toBe(
			'https://api.cloudflare.com/client/v4/accounts/account-123/email/sending/send'
		);
		expect(new Headers(requestedInit?.headers).get('authorization')).toBe('Bearer secret-token');
		const body = JSON.parse(String(requestedInit?.body));
		expect(body).toMatchObject({
			from: { address: 'go@all-in-agi.com', name: 'ALL IN AGI' },
			reply_to: { address: 'go@all-in-agi.com', name: 'ALL IN AGI' },
			to: { address: 'ada@example.com', name: 'Ada Beispiel' },
			subject: 'Buchungsbestätigung HAA-AAA-AAA',
			headers: { 'X-Booking-ID': 'HAA-AAA-AAA' }
		});
		expect(body.html).toBeUndefined();
		expect(body.attachments.map((attachment: { filename: string; type: string }) => ({
			filename: attachment.filename,
			type: attachment.type
		}))).toEqual([
			{
				filename: 'all-in-agi-prep-call-HAA-AAA-AAA.ics',
				type: 'text/calendar; charset=utf-8'
			},
			{
				filename: 'all-in-agi-hackathon-HAA-AAA-AAA.pdf',
				type: 'application/pdf'
			}
		]);
		const calendar = Buffer.from(body.attachments[0].content, 'base64').toString('utf8');
		expect(calendar).toContain('LOCATION:https://meet.example.com/booking-1');
		expect(calendar).toContain('UID:booking-1@all-in-agi.com');
		const pdfBytes = Buffer.from(body.attachments[1].content, 'base64');
		expect((await PDFDocument.load(pdfBytes)).getPageCount()).toBe(1);
	});

	test('accepts a queued response', async () => {
		const result = await sendBookingConfirmationEmail(input, {
			accountId: 'account-123',
			apiToken: 'secret-token',
			fetch: async () => Response.json({
				success: true,
				result: {
					delivered: [],
					queued: [config.email],
					permanent_bounces: [],
					message_id: 'message-queued'
				}
			})
		});
		expect(result.status).toBe('queued');
	});

	test('rejects missing credentials before making a request', async () => {
		await expect(sendBookingConfirmationEmail(input, {
			accountId: '',
			apiToken: '',
			fetch: async () => {
				throw new Error('must not be called');
			}
		})).rejects.toMatchObject({
			name: 'BookingConfirmationEmailError',
			providerCode: 'configuration_missing'
		});
	});

	test('reports authentication and permanent-bounce failures', async () => {
		await expect(sendBookingConfirmationEmail(input, {
			accountId: 'account-123',
			apiToken: 'bad-token',
			fetch: async () => Response.json({
				success: false,
				errors: [{ code: 10101, message: 'unauthorized' }],
				result: null
			}, { status: 401 })
		})).rejects.toMatchObject({ status: 401, providerCode: 10101 });

		await expect(sendBookingConfirmationEmail(input, {
			accountId: 'account-123',
			apiToken: 'secret-token',
			fetch: async () => Response.json({
				success: true,
				result: {
					delivered: [],
					queued: [],
					permanent_bounces: [config.email],
					message_id: 'message-bounced'
				}
			})
		})).rejects.toMatchObject({
			providerCode: 'delivery_not_accepted',
			messageId: 'message-bounced'
		});
	});

	test('reports oversized payloads and network failures safely', async () => {
		await expect(sendBookingConfirmationEmail(input, {
			accountId: 'account-123',
			apiToken: 'secret-token',
			maxMessageBytes: 1,
			fetch: async () => Response.json({})
		})).rejects.toMatchObject({ providerCode: 'message_too_big' });

		await expect(sendBookingConfirmationEmail(input, {
			accountId: 'account-123',
			apiToken: 'secret-token',
			fetch: async () => {
				throw new Error('private network detail');
			}
		})).rejects.toEqual(
			expect.objectContaining({
				providerCode: 'network_error'
			})
		);
	});
});
