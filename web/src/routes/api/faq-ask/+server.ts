import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { createGateway, generateText } from 'ai';
import { LOCALES, type Locale } from '$lib/i18n';
import { _llmsContent } from '../../llms.txt/+server';
import type { RequestHandler } from './$types';

const MAX_QUESTION_LENGTH = 500;
const MAX_HISTORY = 16;
const MODEL = 'openai/gpt-6-luna';

type HistoryItem = { question: string; answer: string };

function isLocale(value: unknown): value is Locale {
	return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

function normalizeHistory(value: unknown): HistoryItem[] {
	if (!Array.isArray(value)) return [];
	const items: HistoryItem[] = [];
	for (const entry of value.slice(-MAX_HISTORY)) {
		if (
			entry &&
			typeof entry === 'object' &&
			typeof (entry as HistoryItem).question === 'string' &&
			typeof (entry as HistoryItem).answer === 'string'
		) {
			const question = (entry as HistoryItem).question.trim();
			const answer = (entry as HistoryItem).answer.trim();
			if (question && answer) {
				items.push({
					question: question.slice(0, MAX_QUESTION_LENGTH),
					answer: answer.slice(0, 4000)
				});
			}
		}
	}
	return items;
}

function buildSystemPrompt(locale: Locale, knowledge: string) {
	const language = locale === 'en' ? 'English' : 'German';
	return `You are the FAQ assistant for ALL IN AGI on all-in-agi.com.
Answer visitor questions about ALL IN AGI services, hackathons, booking, pricing, tools, logistics, and contact.
Use only the knowledge below. If something is unknown, say so briefly and point to go@all-in-agi.com or the booking page.
Write in ${language}. Keep answers concise (2–5 short sentences), plain prose suitable for an FAQ accordion — no markdown headings, no bullet lists unless essential, no fluff.
Emails and phone numbers may be written plainly; for booking or other pages you may use a markdown link like [Plan a hackathon](https://all-in-agi.com/...).

## Knowledge base

${knowledge}`;
}

function failureMessage(locale: Locale) {
	return locale === 'en'
		? 'Could not generate an answer right now.'
		: 'Antwort konnte gerade nicht erzeugt werden.';
}

export const POST: RequestHandler = async ({ request, locals }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body.' }, { status: 400 });
	}

	const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
	const question =
		typeof record.question === 'string' ? record.question.trim().slice(0, MAX_QUESTION_LENGTH) : '';
	if (!question) {
		return json({ error: 'Question is required.' }, { status: 400 });
	}

	const locale: Locale = isLocale(record.locale)
		? record.locale
		: ((locals.locale ?? 'de') as Locale);
	const history = normalizeHistory(record.history);
	const knowledge = _llmsContent[locale](locale);
	const apiKey = env.AI_GATEWAY_API_KEY?.trim();

	// SvelteKit private env is not always mirrored onto process.env for the AI SDK default gateway.
	if (!apiKey && !env.VERCEL_OIDC_TOKEN) {
		console.error(
			'FAQ ask missing AI_GATEWAY_API_KEY (add it to web/.env and restart the dev server)'
		);
		return json(
			{
				error:
					locale === 'en'
						? 'AI Gateway is not configured. Set AI_GATEWAY_API_KEY and restart the server.'
						: 'AI Gateway ist nicht konfiguriert. AI_GATEWAY_API_KEY setzen und Server neu starten.'
			},
			{ status: 503 }
		);
	}

	const gateway = createGateway(apiKey ? { apiKey } : undefined);
	const messages = [
		...history.flatMap((item) => [
			{ role: 'user' as const, content: item.question },
			{ role: 'assistant' as const, content: item.answer }
		]),
		{ role: 'user' as const, content: question }
	];

	try {
		const { text } = await generateText({
			model: gateway(MODEL),
			system: buildSystemPrompt(locale, knowledge),
			messages
		});
		const answer = text.trim();
		if (!answer) {
			return json({ error: failureMessage(locale) }, { status: 502 });
		}
		return new Response(answer, {
			headers: { 'content-type': 'text/plain; charset=utf-8' }
		});
	} catch (error) {
		console.error('FAQ ask failed', error);
		return json({ error: failureMessage(locale) }, { status: 502 });
	}
};
