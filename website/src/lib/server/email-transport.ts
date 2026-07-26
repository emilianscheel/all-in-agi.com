import { CONTACT_EMAIL } from '$lib/contact';

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';
const DEFAULT_MAX_EMAIL_BYTES = 5 * 1024 * 1024;

export type EmailTransportStage = 'configuration' | 'serialization' | 'network' | 'provider';

export class EmailTransportError extends Error {
	constructor(
		message: string,
		readonly stage: EmailTransportStage,
		readonly details: { status?: number; providerCode?: number | string; messageId?: string; cause?: unknown } = {}
	) {
		super(message);
		this.name = 'EmailTransportError';
	}
}

export interface EmailAttachment {
	content: string;
	filename: string;
	type: string;
	disposition: 'attachment';
}

export interface EmailMessage {
	to: { address: string; name: string };
	subject: string;
	text: string;
	html: string;
	headers?: Record<string, string>;
	attachments?: EmailAttachment[];
}

export interface EmailTransportDependencies {
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
	} | null;
}

export async function sendEmailMessage(message: EmailMessage, dependencies: EmailTransportDependencies = {}) {
	const accountId = dependencies.accountId ?? process.env.CLOUDFLARE_ACCOUNT_ID;
	const apiToken = dependencies.apiToken ?? process.env.CLOUDFLARE_EMAIL_API_TOKEN;
	if (!accountId || !apiToken) {
		throw new EmailTransportError('Cloudflare Email Service ist nicht vollständig konfiguriert.', 'configuration', {
			providerCode: 'configuration_missing'
		});
	}

	let body: string;
	try {
		body = JSON.stringify({
			from: { address: CONTACT_EMAIL, name: 'ALL IN AGI' },
			reply_to: { address: CONTACT_EMAIL, name: 'ALL IN AGI' },
			...message
		});
		if (new TextEncoder().encode(body).byteLength > (dependencies.maxMessageBytes ?? DEFAULT_MAX_EMAIL_BYTES)) {
			throw new EmailTransportError('Die E-Mail überschreitet die maximale Nachrichtengröße.', 'serialization', {
				status: 400,
				providerCode: 'message_too_big'
			});
		}
	} catch (cause) {
		if (cause instanceof EmailTransportError) throw cause;
		throw new EmailTransportError('Die E-Mail konnte nicht serialisiert werden.', 'serialization', {
			providerCode: 'payload_serialization_failed',
			cause
		});
	}

	let response: Response;
	try {
		response = await (dependencies.fetch ?? globalThis.fetch)(
			`${CLOUDFLARE_API_BASE}/accounts/${encodeURIComponent(accountId)}/email/sending/send`,
			{
				method: 'POST',
				headers: { authorization: `Bearer ${apiToken}`, 'content-type': 'application/json' },
				body
			}
		);
	} catch (cause) {
		throw new EmailTransportError('Cloudflare Email Service ist nicht erreichbar.', 'network', {
			providerCode: 'network_error',
			cause
		});
	}

	let result: CloudflareEmailResponse = {};
	try { result = await response.json() as CloudflareEmailResponse; }
	catch { /* Preserve the HTTP status when the upstream body is not JSON. */ }
	const delivered = (result.result?.delivered?.length ?? 0) > 0;
	const queued = (result.result?.queued?.length ?? 0) > 0;
	const bounced = (result.result?.permanent_bounces?.length ?? 0) > 0;
	const accepted = Boolean(result.result?.message_id);
	if (!response.ok || result.success !== true || (!delivered && !queued && !accepted) || bounced) {
		throw new EmailTransportError(
			result.errors?.[0]?.message ?? 'Cloudflare hat die E-Mail nicht angenommen.',
			'provider',
			{
				status: response.status,
				providerCode: result.errors?.[0]?.code ?? 'delivery_not_accepted',
				messageId: result.result?.message_id
			}
		);
	}
	return {
		messageId: result.result?.message_id,
		status: delivered ? 'delivered' as const : queued ? 'queued' as const : 'accepted' as const
	};
}

