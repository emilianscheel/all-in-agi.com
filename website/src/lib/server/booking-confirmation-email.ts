import { createPlanPdf } from '$lib/booking-artifacts';
import type { BookingConfiguration } from '$lib/booking';
import { bookingOverviewRows } from '$lib/booking-overview';
import { createPrepCallIcs, type BookingResultSummary } from '$lib/booking-ics';
import { CONTACT_EMAIL } from '$lib/contact';

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';
const MAX_EMAIL_BYTES = 5 * 1024 * 1024;
const SITE_ORIGIN = 'https://all-in-agi.com';

export interface BookingConfirmationInput {
	id: string;
	config: BookingConfiguration;
	booking: BookingResultSummary;
}

export interface BookingConfirmationDependencies {
	fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
	accountId?: string;
	apiToken?: string;
	maxMessageBytes?: number;
	createPdf?: typeof createPlanPdf;
	createCalendar?: typeof createPrepCallIcs;
}

export type BookingConfirmationRecipientRole = 'customer' | 'organizer';
export type BookingConfirmationStage =
	| 'configuration'
	| 'attachments'
	| 'serialization'
	| 'network'
	| 'provider';

export type BookingConfirmationAttempt =
	| {
			role: BookingConfirmationRecipientRole;
			sent: true;
			status: 'delivered' | 'queued';
			messageId?: string;
	  }
	| {
			role: BookingConfirmationRecipientRole;
			sent: false;
			error: BookingConfirmationEmailError;
	  };

export interface BookingConfirmationReport {
	customer: BookingConfirmationAttempt;
	organizer: BookingConfirmationAttempt;
}

interface CloudflareEmailResponse {
	success?: boolean;
	errors?: Array<{ code?: number; message?: string }>;
	result?: {
		delivered?: string[];
		queued?: string[];
		permanent_bounces?: string[];
		message_id?: string;
	} | null;
}

interface PreparedBookingConfirmation {
	subject: string;
	text: string;
	headers: { 'X-Booking-ID': string };
	attachments: Array<{
		content: string;
		filename: string;
		type: string;
		disposition: 'attachment';
	}>;
}

interface BookingConfirmationErrorOptions {
	stage: BookingConfirmationStage;
	status?: number;
	providerCode?: number | string;
	messageId?: string;
	cause?: unknown;
}

export class BookingConfirmationEmailError extends Error {
	readonly stage: BookingConfirmationStage;
	readonly status?: number;
	readonly providerCode?: number | string;
	readonly messageId?: string;
	readonly causeName?: string;
	readonly causeMessage?: string;

	constructor(message: string, options: BookingConfirmationErrorOptions) {
		super(message);
		this.name = 'BookingConfirmationEmailError';
		this.stage = options.stage;
		this.status = options.status;
		this.providerCode = options.providerCode;
		this.messageId = options.messageId;
		if (options.cause instanceof Error) {
			this.causeName = options.cause.name;
			this.causeMessage = options.cause.message;
		}
	}
}

function bytesToBase64(bytes: Uint8Array) {
	if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');

	let binary = '';
	const chunkSize = 32_768;
	for (let offset = 0; offset < bytes.length; offset += chunkSize) {
		binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
	}
	return btoa(binary);
}

function failedAttempt(
	role: BookingConfirmationRecipientRole,
	error: BookingConfirmationEmailError
): BookingConfirmationAttempt {
	return { role, sent: false, error };
}

function failedReport(error: BookingConfirmationEmailError): BookingConfirmationReport {
	return {
		customer: failedAttempt('customer', error),
		organizer: failedAttempt('organizer', error)
	};
}

export function bookingDetailUrl(id: string) {
	return `${SITE_ORIGIN}/${encodeURIComponent(id)}`;
}

export function buildBookingConfirmationText(input: BookingConfirmationInput) {
	const rows = bookingOverviewRows(input.config, input.booking);
	const bullets = rows.map((row) => `- ${row.label}: ${row.value} — ${row.status}`);
	return [
		`Hallo ${input.config.contactName},`,
		'vielen Dank für Ihre Buchung. Ihr ALL IN AGI Hackathon ist bestätigt.',
		'',
		...bullets,
		'',
		bookingDetailUrl(input.id)
	].join('\n');
}

async function prepareBookingConfirmation(
	input: BookingConfirmationInput,
	dependencies: BookingConfirmationDependencies
): Promise<PreparedBookingConfirmation> {
	let pdf: Uint8Array;
	let calendar: string;
	try {
		pdf = await (dependencies.createPdf ?? createPlanPdf)(input.config, {
			includeContact: false,
			booking: input.booking,
			hackathonId: input.id
		});
		calendar = (dependencies.createCalendar ?? createPrepCallIcs)(input.config, input.booking);
	} catch (cause) {
		throw new BookingConfirmationEmailError(
			'Die Anhänge der Buchungsbestätigung konnten nicht erstellt werden.',
			{
				stage: 'attachments',
				providerCode: 'attachment_generation_failed',
				cause
			}
		);
	}

	try {
		return {
			subject: `Buchungsbestätigung ${input.id}`,
			text: buildBookingConfirmationText(input),
			headers: { 'X-Booking-ID': input.id },
			attachments: [
				{
					content: bytesToBase64(new TextEncoder().encode(calendar)),
					filename: `all-in-agi-prep-call-${input.id}.ics`,
					type: 'text/calendar; charset=utf-8',
					disposition: 'attachment'
				},
				{
					content: bytesToBase64(pdf),
					filename: `all-in-agi-hackathon-${input.id}.pdf`,
					type: 'application/pdf',
					disposition: 'attachment'
				}
			]
		};
	} catch (cause) {
		throw new BookingConfirmationEmailError(
			'Die Buchungsbestätigung konnte nicht serialisiert werden.',
			{
				stage: 'serialization',
				providerCode: 'attachment_encoding_failed',
				cause
			}
		);
	}
}

async function sendPreparedBookingConfirmation(
	role: BookingConfirmationRecipientRole,
	recipient: { address: string; name: string },
	prepared: PreparedBookingConfirmation,
	accountId: string,
	apiToken: string,
	dependencies: BookingConfirmationDependencies
): Promise<BookingConfirmationAttempt> {
	let serializedPayload: string;
	try {
		serializedPayload = JSON.stringify({
			from: { address: CONTACT_EMAIL, name: 'ALL IN AGI' },
			reply_to: { address: CONTACT_EMAIL, name: 'ALL IN AGI' },
			to: recipient,
			...prepared
		});
		const payloadBytes = new TextEncoder().encode(serializedPayload).byteLength;
		if (payloadBytes > (dependencies.maxMessageBytes ?? MAX_EMAIL_BYTES)) {
			throw new BookingConfirmationEmailError(
				'Die Buchungsbestätigung überschreitet die maximale Nachrichtengröße.',
				{
					stage: 'serialization',
					status: 400,
					providerCode: 'message_too_big'
				}
			);
		}
	} catch (cause) {
		if (cause instanceof BookingConfirmationEmailError) throw cause;
		throw new BookingConfirmationEmailError(
			'Die Buchungsbestätigung konnte nicht serialisiert werden.',
			{
				stage: 'serialization',
				providerCode: 'payload_serialization_failed',
				cause
			}
		);
	}

	const requestFetch = dependencies.fetch ?? globalThis.fetch;
	let response: Response;
	try {
		response = await requestFetch(
			`${CLOUDFLARE_API_BASE}/accounts/${encodeURIComponent(accountId)}/email/sending/send`,
			{
				method: 'POST',
				headers: {
					authorization: `Bearer ${apiToken}`,
					'content-type': 'application/json'
				},
				body: serializedPayload
			}
		);
	} catch (cause) {
		throw new BookingConfirmationEmailError(
			'Cloudflare Email Service ist nicht erreichbar.',
			{
				stage: 'network',
				providerCode: 'network_error',
				cause
			}
		);
	}

	let result: CloudflareEmailResponse = {};
	try {
		result = await response.json() as CloudflareEmailResponse;
	} catch {
		// Preserve the HTTP status even when an upstream error body is not JSON.
	}
	const providerError = result.errors?.[0];
	const delivered = result.result?.delivered?.includes(recipient.address) ?? false;
	const queued = result.result?.queued?.includes(recipient.address) ?? false;
	if (
		!response.ok
		|| result.success !== true
		|| (!delivered && !queued)
		|| (result.result?.permanent_bounces?.length ?? 0) > 0
	) {
		throw new BookingConfirmationEmailError(
			providerError?.message ?? 'Cloudflare hat die Buchungsbestätigung nicht angenommen.',
			{
				stage: 'provider',
				status: response.status,
				providerCode: providerError?.code ?? 'delivery_not_accepted',
				messageId: result.result?.message_id
			}
		);
	}

	return {
		role,
		sent: true,
		messageId: result.result?.message_id,
		status: delivered ? 'delivered' : 'queued'
	};
}

export async function sendBookingConfirmationEmails(
	input: BookingConfirmationInput,
	dependencies: BookingConfirmationDependencies = {}
): Promise<BookingConfirmationReport> {
	const accountId = dependencies.accountId ?? process.env.CLOUDFLARE_ACCOUNT_ID;
	const apiToken = dependencies.apiToken ?? process.env.CLOUDFLARE_EMAIL_API_TOKEN;
	if (!accountId || !apiToken) {
		return failedReport(
			new BookingConfirmationEmailError(
				'Cloudflare Email Service ist nicht vollständig konfiguriert.',
				{
					stage: 'configuration',
					providerCode: 'configuration_missing'
				}
			)
		);
	}

	let prepared: PreparedBookingConfirmation;
	try {
		prepared = await prepareBookingConfirmation(input, dependencies);
	} catch (error) {
		if (error instanceof BookingConfirmationEmailError) return failedReport(error);
		return failedReport(
			new BookingConfirmationEmailError(
				'Die Buchungsbestätigung konnte nicht vorbereitet werden.',
				{
					stage: 'attachments',
					providerCode: 'preparation_failed',
					cause: error
				}
			)
		);
	}

	const attempts = await Promise.allSettled([
		sendPreparedBookingConfirmation(
			'customer',
			{ address: input.config.email, name: input.config.contactName },
			prepared,
			accountId,
			apiToken,
			dependencies
		),
		sendPreparedBookingConfirmation(
			'organizer',
			{ address: CONTACT_EMAIL, name: 'ALL IN AGI' },
			prepared,
			accountId,
			apiToken,
			dependencies
		)
	]);

	const resolveAttempt = (
		role: BookingConfirmationRecipientRole,
		result: PromiseSettledResult<BookingConfirmationAttempt>
	): BookingConfirmationAttempt => {
		if (result.status === 'fulfilled') return result.value;
		const error = result.reason instanceof BookingConfirmationEmailError
			? result.reason
			: new BookingConfirmationEmailError(
					'Die Buchungsbestätigung ist unerwartet fehlgeschlagen.',
					{
						stage: 'provider',
						providerCode: 'unexpected_error',
						cause: result.reason
					}
				);
		return failedAttempt(role, error);
	};

	return {
		customer: resolveAttempt('customer', attempts[0]),
		organizer: resolveAttempt('organizer', attempts[1])
	};
}
