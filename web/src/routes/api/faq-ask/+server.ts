import { json } from '@sveltejs/kit';
import { streamText } from 'ai';
import { LOCALES, type Locale } from '$lib/i18n';
import { _llmsContent } from '../../llms.txt/+server';
import type { RequestHandler } from './$types';

const MAX_QUESTION_LENGTH = 500;
const MAX_HISTORY = 8;
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

## Knowledge base

${knowledge}`;
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

	const messages = [
		...history.flatMap((item) => [
			{ role: 'user' as const, content: item.question },
			{ role: 'assistant' as const, content: item.answer }
		]),
		{ role: 'user' as const, content: question }
	];

	try {
		const result = streamText({
			model: MODEL,
			system: buildSystemPrompt(locale, knowledge),
			messages
		});
		return result.toTextStreamResponse();
	} catch (error) {
		console.error('FAQ ask failed', error);
		return json(
			{
				error:
					locale === 'en'
						? 'Could not generate an answer right now.'
						: 'Antwort konnte gerade nicht erzeugt werden.'
			},
			{ status: 502 }
		);
	}
};
