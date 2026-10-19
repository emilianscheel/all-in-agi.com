import { describe, expect, mock, test } from 'bun:test';
import { askFaqQuestion } from './faq-ask-client';

function streamBody(text: string) {
	return new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(new TextEncoder().encode(text));
			controller.close();
		}
	});
}

describe('askFaqQuestion', () => {
	test('streams a successful answer', async () => {
		const chunks: string[] = [];
		const fetchMock = mock(async () =>
			new Response(streamBody('Hello from FAQ'), {
				status: 200,
				headers: { 'content-type': 'text/plain; charset=utf-8' }
			})
		);
		const original = globalThis.fetch;
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		try {
			const answer = await askFaqQuestion({
				question: 'What is ALL IN AGI?',
				locale: 'en',
				onChunk: (full) => chunks.push(full)
			});
			expect(answer).toBe('Hello from FAQ');
			expect(chunks.at(-1)).toBe('Hello from FAQ');
			expect(fetchMock).toHaveBeenCalledTimes(1);
			const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
			expect(JSON.parse(String(call[1].body))).toEqual({
				question: 'What is ALL IN AGI?',
				history: [],
				locale: 'en'
			});
		} finally {
			globalThis.fetch = original;
		}
	});

	test('throws API error messages', async () => {
		const fetchMock = mock(async () =>
			Response.json({ error: 'Gateway unavailable.' }, { status: 503 })
		);
		const original = globalThis.fetch;
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		try {
			await expect(
				askFaqQuestion({ question: 'Hi', locale: 'de' })
			).rejects.toThrow('Gateway unavailable.');
		} finally {
			globalThis.fetch = original;
		}
	});
});
