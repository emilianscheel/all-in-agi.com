import { CONTACT_EMAIL } from '$lib/contact';
import nodemailer, { type SendMailOptions } from 'nodemailer';

const DEFAULT_MAX_EMAIL_BYTES = 5 * 1024 * 1024;
const SMTP_HOST = 'smtp.mail.me.com';
const SMTP_PORT = 587;

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

interface EmailMessageBase {
	to: { address: string; name: string };
	subject: string;
	headers?: Record<string, string>;
	attachments?: EmailAttachment[];
}

export type EmailMessage = EmailMessageBase & (
	| { text: string; html?: string }
	| { text?: string; html: string }
);

interface SmtpSubmission {
	messageId?: string;
	accepted?: string[];
	rejected?: string[];
}

export interface EmailTransportDependencies {
	username?: string;
	password?: string;
	sendMail?: (options: SendMailOptions) => Promise<SmtpSubmission>;
	maxMessageBytes?: number;
}

function smtpError(error: unknown): EmailTransportError {
	const cause = error as { code?: string; responseCode?: number } | null;
	const code = cause?.code;
	const stage: EmailTransportStage = code && ['ECONNECTION', 'ETIMEDOUT', 'ESOCKET', 'EDNS'].includes(code)
		? 'network'
		: 'provider';
	return new EmailTransportError(
		stage === 'network' ? 'iCloud Mail ist nicht erreichbar.' : 'iCloud Mail hat die E-Mail nicht angenommen.',
		stage,
		{ status: cause?.responseCode, providerCode: code ?? 'smtp_error', cause: error }
	);
}

export async function sendEmailMessage(message: EmailMessage, dependencies: EmailTransportDependencies = {}) {
	const username = dependencies.username ?? process.env.ICLOUD_SMTP_USERNAME;
	const password = dependencies.password ?? process.env.APPLE_APP_SPECIFIC_PASSWORD;
	if (!username?.trim() || !password?.trim()) {
		throw new EmailTransportError('iCloud SMTP ist nicht vollständig konfiguriert.', 'configuration', {
			providerCode: 'configuration_missing'
		});
	}

	let options: SendMailOptions;
	try {
		const size = Buffer.byteLength(JSON.stringify(message), 'utf8');
		if (size > (dependencies.maxMessageBytes ?? DEFAULT_MAX_EMAIL_BYTES)) {
			throw new EmailTransportError('Die E-Mail überschreitet die maximale Nachrichtengröße.', 'serialization', {
				status: 400,
				providerCode: 'message_too_big'
			});
		}
		options = {
			from: { address: CONTACT_EMAIL, name: 'ALL IN AGI' },
			replyTo: { address: CONTACT_EMAIL, name: 'ALL IN AGI' },
			to: message.to,
			subject: message.subject,
			text: message.text,
			html: message.html,
			headers: message.headers,
			attachments: message.attachments?.map((attachment) => ({
				filename: attachment.filename,
				content: Buffer.from(attachment.content, 'base64'),
				contentType: attachment.type,
				contentDisposition: attachment.disposition
			}))
		};
	} catch (cause) {
		if (cause instanceof EmailTransportError) throw cause;
		throw new EmailTransportError('Die E-Mail konnte nicht vorbereitet werden.', 'serialization', {
			providerCode: 'payload_serialization_failed', cause
		});
	}

	let result: SmtpSubmission;
	try {
		const transport = dependencies.sendMail ? null : nodemailer.createTransport({
			host: SMTP_HOST,
			port: SMTP_PORT,
			secure: false,
			requireTLS: true,
			auth: { user: username, pass: password },
			connectionTimeout: 10_000,
			greetingTimeout: 10_000,
			socketTimeout: 20_000
		});
		result = await (dependencies.sendMail
			? dependencies.sendMail(options)
			: transport!.sendMail(options));
	} catch (error) {
		throw smtpError(error);
	}

	if (!result.accepted?.some((address) => address.toLowerCase() === message.to.address.toLowerCase())) {
		throw new EmailTransportError('iCloud Mail hat den Empfänger nicht angenommen.', 'provider', {
			providerCode: 'recipient_not_accepted', messageId: result.messageId
		});
	}
	return { messageId: result.messageId, status: 'accepted' as const };
}
