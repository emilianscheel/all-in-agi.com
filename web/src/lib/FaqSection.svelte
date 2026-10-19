<script lang="ts">
	import { onMount } from 'svelte';
	import { Accordion } from 'bits-ui';
	import { ArrowUp } from 'lucide-svelte';
	import { reveal } from '$lib/motion';
	import { linkifyFaqAnswer } from '$lib/faq-rich-text';
	import type { Locale } from '$lib/i18n';

	export type FaqItem = { question: string; answer: string };

	let {
		locale,
		faqs
	}: {
		locale: Locale;
		faqs: FaqItem[];
	} = $props();

	const PENDING_VALUE = 'pending-faq';
	const MAX_HISTORY = 16;

	let userFaqs = $state<FaqItem[]>([]);
	let draft = $state('');
	let pending = $state<{ question: string; fullAnswer: string; displayedAnswer: string } | null>(
		null
	);
	let submitting = $state(false);
	let errorMessage = $state<string | null>(null);
	let openValues = $state<string[]>([]);
	let hydrated = $state(false);
	let typewriterTimer: ReturnType<typeof setInterval> | null = null;
	let placeholderTimer: ReturnType<typeof setInterval> | null = null;
	let placeholderFadeTimer: ReturnType<typeof setTimeout> | null = null;
	let askInput = $state<HTMLInputElement | null>(null);
	let placeholderOpacity = $state(0.45);
	let displayedPlaceholder = $state('');
	let lastAnimatedPlaceholder = $state<string | null>(null);

	let storageKey = $derived(`all-in-agi:user-faqs:${locale}`);
	let defaultPlaceholder = $derived(
		locale === 'en' ? 'Type in your question here' : 'Stelle hier deine Frage'
	);
	let continuePlaceholder = $derived(
		locale === 'en' ? 'Continue asking...' : 'Weiter fragen...'
	);
	let latestUserValue = $derived(
		userFaqs.length > 0 ? `user-faq-${userFaqs.length - 1}` : null
	);
	let targetPlaceholder = $derived(
		pending || (latestUserValue !== null && openValues.includes(latestUserValue))
			? continuePlaceholder
			: defaultPlaceholder
	);
	let title = $derived(locale === 'en' ? 'Frequently asked questions' : 'Häufige Fragen');
	let submitLabel = $derived(locale === 'en' ? 'Ask question' : 'Frage absenden');
	let allItems = $derived([...faqs, ...userFaqs]);

	onMount(() => {
		try {
			const raw = localStorage.getItem(storageKey);
			if (raw) {
				const parsed = JSON.parse(raw) as unknown;
				if (Array.isArray(parsed)) {
					userFaqs = parsed.filter(
						(item): item is FaqItem =>
							!!item &&
							typeof item === 'object' &&
							typeof (item as FaqItem).question === 'string' &&
							typeof (item as FaqItem).answer === 'string'
					);
				}
			}
		} catch {
			// ignore corrupt cache
		}
		displayedPlaceholder = targetPlaceholder;
		lastAnimatedPlaceholder = targetPlaceholder;
		hydrated = true;
	});

	$effect(() => {
		if (!hydrated) return;
		const key = storageKey;
		const items = userFaqs;
		try {
			localStorage.setItem(key, JSON.stringify(items));
		} catch {
			// ignore quota / private mode
		}
	});

	$effect(() => {
		return () => {
			if (typewriterTimer) clearInterval(typewriterTimer);
			if (placeholderTimer) clearInterval(placeholderTimer);
			if (placeholderFadeTimer) clearTimeout(placeholderFadeTimer);
		};
	});

	$effect(() => {
		if (!hydrated) return;
		const next = targetPlaceholder;
		if (next === lastAnimatedPlaceholder) return;
		animatePlaceholder(next);
	});

	function stopTypewriter() {
		if (typewriterTimer) {
			clearInterval(typewriterTimer);
			typewriterTimer = null;
		}
	}

	function stopPlaceholderAnimation() {
		if (placeholderTimer) {
			clearInterval(placeholderTimer);
			placeholderTimer = null;
		}
		if (placeholderFadeTimer) {
			clearTimeout(placeholderFadeTimer);
			placeholderFadeTimer = null;
		}
	}

	function animatePlaceholder(next: string) {
		stopPlaceholderAnimation();
		lastAnimatedPlaceholder = next;
		placeholderOpacity = 0;
		placeholderFadeTimer = setTimeout(() => {
			displayedPlaceholder = '';
			placeholderOpacity = 0.45;
			placeholderTimer = setInterval(() => {
				if (displayedPlaceholder.length >= next.length) {
					if (placeholderTimer) {
						clearInterval(placeholderTimer);
						placeholderTimer = null;
					}
					return;
				}
				const step = Math.min(2, next.length - displayedPlaceholder.length);
				displayedPlaceholder = next.slice(0, displayedPlaceholder.length + step);
			}, 18);
		}, 180);
	}

	function openOnlyAi(value: string) {
		openValues = openValues
			.filter((v) => !v.startsWith('user-faq-') && v !== PENDING_VALUE)
			.concat(value);
	}

	function startTypewriter() {
		stopTypewriter();
		typewriterTimer = setInterval(() => {
			if (!pending) {
				stopTypewriter();
				return;
			}
			const { fullAnswer, displayedAnswer } = pending;
			if (displayedAnswer.length >= fullAnswer.length) {
				if (!submitting && fullAnswer.length > 0) {
					finishPending();
				}
				return;
			}
			const step = Math.min(2, fullAnswer.length - displayedAnswer.length);
			pending = {
				...pending,
				displayedAnswer: fullAnswer.slice(0, displayedAnswer.length + step)
			};
		}, 18);
	}

	function finishPending() {
		if (!pending || !pending.fullAnswer) return;
		const item = { question: pending.question, answer: pending.fullAnswer };
		stopTypewriter();
		userFaqs = [...userFaqs, item];
		const userIndex = userFaqs.length - 1;
		openOnlyAi(`user-faq-${userIndex}`);
		pending = null;
		draft = '';
		queueMicrotask(() => askInput?.focus());
	}

	async function submitQuestion() {
		const question = draft.trim();
		if (!question || submitting || pending) return;

		errorMessage = null;
		submitting = true;
		pending = { question, fullAnswer: '', displayedAnswer: '' };
		draft = '';
		openOnlyAi(PENDING_VALUE);
		startTypewriter();

		try {
			const history = userFaqs.slice(-MAX_HISTORY);
			const response = await fetch('/api/faq-ask', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ question, history, locale })
			});

			if (!response.ok || !response.body) {
				const payload = await response.json().catch(() => null);
				throw new Error(
					typeof payload?.error === 'string'
						? payload.error
						: locale === 'en'
							? 'Could not generate an answer. Please try again.'
							: 'Antwort konnte nicht erzeugt werden. Bitte erneut versuchen.'
				);
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let full = '';
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				full += decoder.decode(value, { stream: true });
				if (pending) {
					pending = { ...pending, fullAnswer: full };
				}
			}
			full += decoder.decode();
			if (pending) {
				pending = { ...pending, fullAnswer: full.trim() || pending.fullAnswer };
			}
			if (pending && !pending.fullAnswer) {
				throw new Error(
					locale === 'en'
						? 'Received an empty answer. Please try again.'
						: 'Leere Antwort erhalten. Bitte erneut versuchen.'
				);
			}
		} catch (error) {
			stopTypewriter();
			pending = null;
			errorMessage =
				error instanceof Error
					? error.message
					: locale === 'en'
						? 'Something went wrong.'
						: 'Etwas ist schiefgelaufen.';
		} finally {
			submitting = false;
			if (pending && pending.displayedAnswer.length >= pending.fullAnswer.length) {
				finishPending();
			}
		}
	}

	function onAskKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			void submitQuestion();
		}
	}
</script>

<section>
	<div class="section-wrap faq-wrap">
		<div use:reveal>
			<h2 class="section-title">{title}</h2>
		</div>
		<Accordion.Root class="faq-list" type="multiple" bind:value={openValues}>
			{#each allItems as faq, index (index < faqs.length ? `static-${index}` : `user-${index - faqs.length}`)}
				{@const isUser = index >= faqs.length}
				{@const value = isUser ? `user-faq-${index - faqs.length}` : `faq-${index}`}
				<Accordion.Item class="faq-item" {value}>
					<Accordion.Header class="faq-header">
						<Accordion.Trigger class="faq-trigger"
							>{faq.question}<span class="faq-symbol" aria-hidden="true"></span
							></Accordion.Trigger
						>
					</Accordion.Header>
					<Accordion.Content class="faq-answer"
						><div>
							{#if isUser}
								<p class="faq-answer-body">{@html linkifyFaqAnswer(faq.answer)}</p>
							{:else}
								<p>{faq.answer}</p>
							{/if}
						</div></Accordion.Content
					>
				</Accordion.Item>
			{/each}

			{#if pending}
				<Accordion.Item class="faq-item" value={PENDING_VALUE}>
					<Accordion.Header class="faq-header">
						<Accordion.Trigger class="faq-trigger"
							>{pending.question}<span class="faq-symbol" aria-hidden="true"></span
							></Accordion.Trigger
						>
					</Accordion.Header>
					<Accordion.Content class="faq-answer"
						><div>
							<p class="faq-answer-body"
								>{@html linkifyFaqAnswer(pending.displayedAnswer)}<span
									class="faq-typewriter-caret"
									aria-hidden="true"
								></span></p
							>
						</div></Accordion.Content
					>
				</Accordion.Item>
			{/if}
		</Accordion.Root>

		{#if !pending}
			<form
				class="faq-item faq-ask-row"
				onsubmit={(event) => {
					event.preventDefault();
					void submitQuestion();
				}}
			>
				<label class="faq-ask-label">
					<span class="visually-hidden">{targetPlaceholder}</span>
					{#if !draft}
						<span
							class="faq-ask-placeholder"
							aria-hidden="true"
							style={`opacity: ${placeholderOpacity}`}
							>{displayedPlaceholder}</span
						>
					{/if}
					<input
						bind:this={askInput}
						class="faq-ask-input"
						type="text"
						bind:value={draft}
						autocomplete="off"
						maxlength={500}
						disabled={submitting}
						onkeydown={onAskKeydown}
					/>
				</label>
				<button
					class="faq-ask-submit"
					type="submit"
					disabled={submitting || !draft.trim()}
					aria-label={submitLabel}
				>
					<ArrowUp size={18} strokeWidth={1.8} aria-hidden="true" />
				</button>
			</form>
		{/if}

		{#if errorMessage}
			<p class="faq-ask-error" role="alert">{errorMessage}</p>
		{/if}
	</div>
</section>
