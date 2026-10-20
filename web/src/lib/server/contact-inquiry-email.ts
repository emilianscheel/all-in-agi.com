import { CONTACT_EMAIL, CONTACT_SENDER_NAME } from '$lib/contact';
import type { Locale } from '$lib/i18n';
import { sendEmailMessage, type EmailTransportDependencies } from './email-transport';

export type ContactInquiryPayload = {
	name: string;
	email: string;
	subject: string;
	message: string;
	locale: Locale;
};

function escapeHtml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function replyFooter(locale: Locale) {
	return locale === 'en'
		? 'Just reply to this email for any further questions or wishes'
		: 'Antworten Sie einfach auf diese E-Mail bei weiteren Fragen oder Wünschen';
}

export function buildContactInquiryText(message: string, locale: Locale) {
	return `${message}\n\n - \n\n${replyFooter(locale)}`;
}

export function buildContactInquiryHtml(message: string, locale: Locale) {
	const paragraphs = message
		.split(/\n{2,}/)
		.map((block) => block.trim())
		.filter(Boolean)
		.map((block) => `<p>${escapeHtml(block).replaceAll('\n', '<br>')}</p>`)
		.join('');
	return `${paragraphs}<p> - </p><p>${escapeHtml(replyFooter(locale))}</p>`;
}

export async function sendContactInquiryEmails(
	payload: ContactInquiryPayload,
	dependencies: EmailTransportDependencies = {}
) {
	const text = buildContactInquiryText(payload.message, payload.locale);
	const html = buildContactInquiryHtml(payload.message, payload.locale);
	const clientSubjectPrefix = payload.locale === 'en' ? 'Your inquiry: ' : 'Ihre Anfrage: ';

	const toUs = await sendEmailMessage(
		{
			to: { address: CONTACT_EMAIL, name: CONTACT_SENDER_NAME },
			replyTo: { address: payload.email, name: payload.name },
			subject: `Neue Anfrage: ${payload.subject}`,
			text,
			html
		},
		dependencies
	);

	const toClient = await sendEmailMessage(
		{
			to: { address: payload.email, name: payload.name },
			replyTo: { address: CONTACT_EMAIL, name: CONTACT_SENDER_NAME },
			subject: `${clientSubjectPrefix}${payload.subject}`,
			text,
			html
		},
		dependencies
	);

	return { toUs, toClient };
}
