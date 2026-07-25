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
}

interface CloudflareEmailResponse {
	success?: boolean;
	errors?: Array<{ code?: number; message?: string }>;
	result?: {
		delivered?: string[];
		queued?: string[];
		permanent_bounces?: string[];
		message_id?: string;
	};
}

export class BookingConfirmationEmailError extends Error {
	constructor(
		message: string,
		public readonly status?: number,
		public readonly providerCode?: number | string,
		public readonly messageId?: string
	) {
		super(message);
		this.name = 'BookingConfirmationEmailError';
	}
}

function bytesToBase64(bytes: Uint8Array) {
	return Buffer.from(bytes).toString('base64');
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

export async function sendBookingConfirmationEmail(
	input: BookingConfirmationInput,
	dependencies: BookingConfirmationDependencies = {}
) {
	const accountId = dependencies.accountId ?? process.env.CLOUDFLARE_ACCOUNT_ID;
	const apiToken = dependencies.apiToken ?? process.env.CLOUDFLARE_EMAIL_API_TOKEN;
	if (!accountId || !apiToken) {
		throw new BookingConfirmationEmailError(
			'Cloudflare Email Service ist nicht vollständig konfiguriert.',
			undefined,
			'configuration_missing'
		);
	}

	const pdf = await createPlanPdf(input.config, {
		includeContact: false,
		booking: input.booking,
		hackathonId: input.id
	});
	const calendar = createPrepCallIcs(input.config, input.booking);
	const payload = {
		from: { address: CONTACT_EMAIL, name: 'ALL IN AGI' },
		reply_to: { address: CONTACT_EMAIL, name: 'ALL IN AGI' },
		to: { address: input.config.email, name: input.config.contactName },
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
	const serializedPayload = JSON.stringify(payload);
	const payloadBytes = new TextEncoder().encode(serializedPayload).byteLength;
	if (payloadBytes > (dependencies.maxMessageBytes ?? MAX_EMAIL_BYTES)) {
		throw new BookingConfirmationEmailError(
			'Die Buchungsbestätigung überschreitet die maximale Nachrichtengröße.',
			400,
			'message_too_big'
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
	} catch {
		throw new BookingConfirmationEmailError(
			'Cloudflare Email Service ist nicht erreichbar.',
			undefined,
			'network_error'
		);
	}

	let result: CloudflareEmailResponse = {};
	try {
		result = await response.json() as CloudflareEmailResponse;
	} catch {
		// Preserve the HTTP status even when an upstream error body is not JSON.
	}
	const providerError = result.errors?.[0];
	const accepted = result.result?.delivered?.includes(input.config.email)
		|| result.result?.queued?.includes(input.config.email);
	if (
		!response.ok
		|| result.success !== true
		|| !accepted
		|| (result.result?.permanent_bounces?.length ?? 0) > 0
	) {
		throw new BookingConfirmationEmailError(
			providerError?.message ?? 'Cloudflare hat die Buchungsbestätigung nicht angenommen.',
			response.status,
			providerError?.code ?? 'delivery_not_accepted',
			result.result?.message_id
		);
	}

	return {
		messageId: result.result?.message_id,
		status: result.result?.delivered?.includes(input.config.email) ? 'delivered' as const : 'queued' as const
	};
}
