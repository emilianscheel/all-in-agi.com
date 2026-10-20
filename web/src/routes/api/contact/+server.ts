import { json } from '@sveltejs/kit';
import { LOCALES, type Locale } from '$lib/i18n';
import { getDb } from '$lib/server/db';
import { contactInquiries } from '$lib/server/db/schema';
import {
	sendContactInquiryEmails,
	type ContactInquiryPayload
} from '$lib/server/contact-inquiry-email';
import { EmailTransportError } from '$lib/server/email-transport';
import type { RequestHandler } from './$types';

const MAX_NAME = 120;
const MAX_EMAIL = 254;
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 5000;

function isLocale(value: unknown): value is Locale {
	return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

function trimField(value: unknown, max: number) {
	return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function isValidEmail(value: string) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export const POST: RequestHandler = async ({ request, locals }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body.' }, { status: 400 });
	}

	const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
	const name = trimField(record.name, MAX_NAME);
	const email = trimField(record.email, MAX_EMAIL);
	const subject = trimField(record.subject, MAX_SUBJECT);
	const message = trimField(record.message, MAX_MESSAGE);
	const locale: Locale = isLocale(record.locale)
		? record.locale
		: ((locals.locale ?? 'de') as Locale);

	const errors: string[] = [];
	if (!name) errors.push('name');
	if (!email || !isValidEmail(email)) errors.push('email');
	if (!subject) errors.push('subject');
	if (!message) errors.push('message');
	if (errors.length > 0) {
		return json(
			{
				error:
					locale === 'en'
						? 'Please fill in all fields with a valid email address.'
						: 'Bitte alle Felder mit einer gültigen E-Mail-Adresse ausfüllen.',
				errors
			},
			{ status: 400 }
		);
	}

	const payload: ContactInquiryPayload = { name, email, subject, message, locale };
	const id = crypto.randomUUID();

	try {
		const db = await getDb();
		await db.insert(contactInquiries).values({
			id,
			name,
			email,
			subject,
			message,
			locale
		});
	} catch (cause) {
		console.error('Failed to store contact inquiry', cause);
		return json(
			{
				error:
					locale === 'en'
						? 'Could not save your message right now.'
						: 'Nachricht konnte gerade nicht gespeichert werden.'
			},
			{ status: 500 }
		);
	}

	try {
		await sendContactInquiryEmails(payload);
	} catch (error) {
		if (error instanceof EmailTransportError) {
			const status =
				error.stage === 'configuration' ? 503 : error.stage === 'network' ? 502 : 500;
			return json(
				{
					error:
						locale === 'en'
							? 'Your message was saved, but email delivery failed. We will follow up manually.'
							: 'Ihre Nachricht wurde gespeichert, der E-Mail-Versand ist fehlgeschlagen. Wir melden uns manuell.',
					stage: error.stage
				},
				{ status }
			);
		}
		console.error('Failed to send contact inquiry emails', error);
		return json(
			{
				error:
					locale === 'en'
						? 'Your message was saved, but email delivery failed.'
						: 'Ihre Nachricht wurde gespeichert, der E-Mail-Versand ist fehlgeschlagen.'
			},
			{ status: 500 }
		);
	}

	return json({ ok: true, id }, { status: 201 });
};
