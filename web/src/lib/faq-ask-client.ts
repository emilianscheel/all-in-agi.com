import type { Locale } from '$lib/i18n';

export type FaqAskHistoryItem = { question: string; answer: string };

export type FaqAskParams = {
	question: string;
	locale: Locale;
	history?: FaqAskHistoryItem[];
	signal?: AbortSignal;
	onChunk?: (fullText: string) => void;
};

function defaultErrorMessage(locale: Locale) {
	return locale === 'en'
		? 'Could not generate an answer. Please try again.'
		: 'Antwort konnte nicht erzeugt werden. Bitte erneut versuchen.';
}

function emptyAnswerMessage(locale: Locale) {
	return locale === 'en'
		? 'Received an empty answer. Please try again.'
		: 'Leere Antwort erhalten. Bitte erneut versuchen.';
}

/**
 * Calls POST /api/faq-ask and streams the plain-text answer.
 * Invokes onChunk with the cumulative text as chunks arrive.
 */
export async function askFaqQuestion(params: FaqAskParams): Promise<string> {
	const { question, locale, history = [], signal, onChunk } = params;

	const response = await fetch('/api/faq-ask', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ question, history, locale }),
		signal
	});

	if (!response.ok || !response.body) {
		const payload = await response.json().catch(() => null);
		throw new Error(
			typeof payload?.error === 'string' ? payload.error : defaultErrorMessage(locale)
		);
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let full = '';
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		full += decoder.decode(value, { stream: true });
		onChunk?.(full);
	}
	full += decoder.decode();
	const answer = full.trim();
	if (!answer) {
		throw new Error(emptyAnswerMessage(locale));
	}
	onChunk?.(answer);
	return answer;
}
