import { createPlanPdf, hackathonDetailUrl } from '$lib/booking-artifacts';
import type { BookingConfiguration } from '$lib/booking';
import { bookingOverviewRows } from '$lib/booking-overview';
import { createPrepCallIcs, type BookingResultSummary } from '$lib/booking-ics';
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from '$lib/contact';

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';
const MAX_EMAIL_BYTES = 5 * 1024 * 1024;

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
			status: 'delivered' | 'queued' | 'accepted';
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
	html: string;
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

function normalizeConfirmationError(error: unknown) {
	return error instanceof BookingConfirmationEmailError
		? error
		: new BookingConfirmationEmailError(
				'Die Buchungsbestätigung ist unerwartet fehlgeschlagen.',
				{
					stage: 'provider',
					providerCode: 'unexpected_error',
					cause: error
				}
			);
}

export function bookingDetailUrl(id: string) {
	return hackathonDetailUrl(id);
}

function rowText(row: ReturnType<typeof bookingOverviewRows>[number]) {
	return `- ${row.label}: ${row.value}${row.status === 'Inklusive' ? '' : ` — ${row.status}`}`;
}

function escapeHtml(value: string) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

export function buildBookingConfirmationText(
	input: BookingConfirmationInput,
	role: BookingConfirmationRecipientRole = 'customer'
) {
	const rows = bookingOverviewRows(input.config, input.booking);
	const customer = role === 'customer';
	const content = [
		customer ? `Hallo ${input.config.contactName},` : 'Hallo ALL IN AGI,',
		'',
		customer
			? 'Vielen Dank für Ihre Buchung. Ihr Agentic Engineering Hackathon ist bestätigt.'
			: 'Es wurde ein neuer Hackathon gebucht.',
		'',
		...rows.map(rowText),
		'',
		`Buchung verwalten: ${bookingDetailUrl(input.id)}`
	];

	if (customer) {
		content.push(
			'',
			'Bei Fragen oder Änderungswünschen können Sie uns gerne jederzeit kontaktieren.',
			`Telefon: ${CONTACT_PHONE_DISPLAY} (tel:${CONTACT_PHONE_HREF})`,
			`E-Mail: ${CONTACT_EMAIL} (mailto:${CONTACT_EMAIL})`,
			'',
			'Wir freuen uns auf Sie!'
		);
	}

	// Keep two blank lines between the body and the mail client's attachment area.
	return `${content.join('\n')}\n\n\n`;
}

export function buildBookingConfirmationHtml(
	input: BookingConfirmationInput,
	role: BookingConfirmationRecipientRole = 'customer'
) {
	const customer = role === 'customer';
	const rows = bookingOverviewRows(input.config, input.booking);
	const detailUrl = escapeHtml(bookingDetailUrl(input.id));
	const options = rows.map((row) => {
		const status = row.status === 'Inklusive'
			? ''
			: `<span style="color:#5f6368;"> — ${escapeHtml(row.status)}</span>`;
		return `<tr><td style="padding:6px 16px 6px 0;vertical-align:top;">${escapeHtml(row.label)}</td><td style="padding:6px 0;vertical-align:top;"><strong>${escapeHtml(row.value)}</strong>${status}</td></tr>`;
	}).join('');
	const contact = customer
		? `<p style="margin:24px 0 8px;">Bei Fragen oder Änderungswünschen können Sie uns gerne jederzeit kontaktieren.</p>
			<p style="margin:0;"><a href="tel:${escapeHtml(CONTACT_PHONE_HREF)}">${escapeHtml(CONTACT_PHONE_DISPLAY)}</a><br><a href="mailto:${escapeHtml(CONTACT_EMAIL)}">${escapeHtml(CONTACT_EMAIL)}</a></p>
			<p style="margin:24px 0 0;">Wir freuen uns auf Sie!</p>`
		: '';

	return `<!doctype html>
<html lang="de">
<body style="margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#171717;">
	<p style="margin:0 0 16px;">${customer ? `Hallo ${escapeHtml(input.config.contactName)},` : 'Hallo ALL IN AGI,'}</p>
	<p style="margin:0 0 20px;">${customer ? 'Vielen Dank für Ihre Buchung. Ihr Agentic Engineering Hackathon ist bestätigt.' : 'Es wurde ein neuer Hackathon gebucht.'}</p>
	<table role="presentation" style="border-collapse:collapse;margin:0 0 20px;">${options}</table>
	<p style="margin:0;"><a href="${detailUrl}">Buchung verwalten</a></p>
	${contact}
	<div style="height:2.5em;line-height:1.25em;" aria-hidden="true">&nbsp;</div>
</body>
</html>`;
}

async function prepareBookingConfirmation(
	input: BookingConfirmationInput,
	dependencies: BookingConfirmationDependencies,
	role: BookingConfirmationRecipientRole
): Promise<PreparedBookingConfirmation> {
	let pdf: Uint8Array;
	let calendar: string;
	try {
		pdf = await (dependencies.createPdf ?? createPlanPdf)(input.config, {
			booking: input.booking,
			hackathonId: input.id
		});
		calendar = (dependencies.createCalendar ?? createPrepCallIcs)(
			input.config,
			input.booking,
			bookingDetailUrl(input.id)
		);
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
			subject: role === 'customer'
				? `Buchungsbestätigung Hackathon ${input.id}`
				: `Neue Buchung Hackathon ${input.id}`,
			text: buildBookingConfirmationText(input, role),
			html: buildBookingConfirmationHtml(input, role),
			headers: { 'X-Booking-ID': input.id },
			attachments: [
				{
					content: bytesToBase64(new TextEncoder().encode(calendar)),
					filename: 'Vorbereitungsgespräch.ics',
					type: 'text/calendar; charset=utf-8',
					disposition: 'attachment'
				},
				{
					content: bytesToBase64(pdf),
					filename: 'Hackathon.pdf',
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
	// Each request contains exactly one recipient. Cloudflare can return the mailbox
	// with its display name, so comparing the status entry to the bare address is
	// unnecessarily strict. A message ID is also evidence that Cloudflare accepted
	// the message when the immediate delivery arrays are still empty.
	const delivered = (result.result?.delivered?.length ?? 0) > 0;
	const queued = (result.result?.queued?.length ?? 0) > 0;
	const permanentlyBounced = (result.result?.permanent_bounces?.length ?? 0) > 0;
	const accepted = Boolean(result.result?.message_id);
	if (
		!response.ok
		|| result.success !== true
		|| (!delivered && !queued && !accepted)
		|| permanentlyBounced
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
		status: delivered ? 'delivered' : queued ? 'queued' : 'accepted'
	};
}

export async function sendCustomerBookingConfirmationEmail(
	input: BookingConfirmationInput,
	dependencies: BookingConfirmationDependencies = {}
): Promise<BookingConfirmationAttempt> {
	const accountId = dependencies.accountId ?? process.env.CLOUDFLARE_ACCOUNT_ID;
	const apiToken = dependencies.apiToken ?? process.env.CLOUDFLARE_EMAIL_API_TOKEN;
	if (!accountId || !apiToken) {
		return failedAttempt(
			'customer',
			new BookingConfirmationEmailError(
				'Cloudflare Email Service ist nicht vollständig konfiguriert.',
				{
					stage: 'configuration',
					providerCode: 'configuration_missing'
				}
			)
		);
	}

	try {
		const prepared = await prepareBookingConfirmation(input, dependencies, 'customer');
		return await sendPreparedBookingConfirmation(
			'customer',
			{ address: input.config.email, name: input.config.contactName },
			prepared,
			accountId,
			apiToken,
			dependencies
		);
	} catch (error) {
		return failedAttempt('customer', normalizeConfirmationError(error));
	}
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

	let customerPrepared: PreparedBookingConfirmation;
	let organizerPrepared: PreparedBookingConfirmation;
	try {
		customerPrepared = await prepareBookingConfirmation(input, dependencies, 'customer');
		organizerPrepared = {
			...customerPrepared,
			subject: `Neue Buchung Hackathon ${input.id}`,
			text: buildBookingConfirmationText(input, 'organizer'),
			html: buildBookingConfirmationHtml(input, 'organizer')
		};
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
			customerPrepared,
			accountId,
			apiToken,
			dependencies
		),
		sendPreparedBookingConfirmation(
			'organizer',
			{ address: CONTACT_EMAIL, name: 'ALL IN AGI' },
			organizerPrepared,
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
		return failedAttempt(role, normalizeConfirmationError(result.reason));
	};

	return {
		customer: resolveAttempt('customer', attempts[0]),
		organizer: resolveAttempt('organizer', attempts[1])
	};
}
