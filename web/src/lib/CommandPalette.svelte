<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { Command, Dialog } from 'bits-ui';
	import { animate, type AnimationPlaybackControls } from 'motion';
	import { Sparkles } from 'lucide-svelte';
	import { animateContentHeight } from '$lib/animateContentHeight';
	import { askFaqQuestion } from '$lib/faq-ask-client';
	import { getCommandPalettePages } from '$lib/command-palette-pages';
	import { linkifyFaqAnswer } from '$lib/faq-rich-text';
	import { ui, type Locale } from '$lib/i18n';

	let { locale }: { locale: Locale } = $props();

	type ChatMessage = {
		id: string;
		role: 'user' | 'assistant';
		content: string;
		displayed: string;
		error?: boolean;
		visible?: boolean;
	};

	const AI_VALUE = 'action:ask-ai';
	const EASE = [0.22, 1, 0.36, 1] as const;
	const MAX_HISTORY = 16;

	let open = $state(false);
	let closing = $state(false);
	let query = $state('');
	let filteredCount = $state(0);
	let messages = $state<ChatMessage[]>([]);
	let aiLoading = $state(false);
	let overlayEl = $state<HTMLElement | null>(null);
	let panelEl = $state<HTMLElement | null>(null);
	let inputEl = $state<HTMLElement | null>(null);
	let chatEl = $state<HTMLElement | null>(null);
	let flyEl = $state<HTMLElement | null>(null);
	let fly = $state<{ text: string; left: number; top: number; width: number } | null>(null);
	let abortController: AbortController | null = null;
	let typewriterTimer: ReturnType<typeof setInterval> | null = null;
	let overlayAnimation: AnimationPlaybackControls | undefined;
	let panelAnimation: AnimationPlaybackControls | undefined;
	let messageId = 0;

	let copy = $derived(ui[locale]);
	let pages = $derived(getCommandPalettePages(locale));
	let chatMode = $derived(messages.length > 0);
	let aiKeywords = $derived(
		locale === 'en'
			? ['ask', 'ai', 'faq', 'question', 'help', 'search', 'anything']
			: ['frage', 'ki', 'faq', 'ai', 'hilfe', 'suchen', 'ask', 'alles']
	);

	function nextId(prefix: string) {
		messageId += 1;
		return `${prefix}-${messageId}`;
	}

	function reducedMotion() {
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	function stopAnimations() {
		overlayAnimation?.stop();
		panelAnimation?.stop();
		overlayAnimation = undefined;
		panelAnimation = undefined;
	}

	function stopTypewriter() {
		if (typewriterTimer) {
			clearInterval(typewriterTimer);
			typewriterTimer = null;
		}
	}

	function patchMessage(id: string, patch: Partial<ChatMessage>) {
		messages = messages.map((message) => (message.id === id ? { ...message, ...patch } : message));
	}

	function startTypewriter(assistantId: string) {
		stopTypewriter();
		typewriterTimer = setInterval(() => {
			const message = messages.find((entry) => entry.id === assistantId);
			if (!message) {
				stopTypewriter();
				return;
			}
			if (reducedMotion()) {
				if (message.displayed !== message.content) {
					patchMessage(assistantId, { displayed: message.content });
					void scrollChatToBottom();
				}
				if (!aiLoading && message.displayed.length >= message.content.length) {
					stopTypewriter();
				}
				return;
			}
			if (message.displayed.length >= message.content.length) {
				if (!aiLoading) stopTypewriter();
				return;
			}
			const step = Math.min(2, message.content.length - message.displayed.length);
			patchMessage(assistantId, {
				displayed: message.content.slice(0, message.displayed.length + step)
			});
			void scrollChatToBottom();
		}, 18);
	}

	function historyForRequest(excludeAssistantId?: string) {
		const pairs: { question: string; answer: string }[] = [];
		for (let index = 0; index < messages.length; index += 1) {
			const current = messages[index];
			const next = messages[index + 1];
			if (current?.role !== 'user' || next?.role !== 'assistant') continue;
			if (next.id === excludeAssistantId) continue;
			if (!current.content.trim() || !next.content.trim() || next.error) continue;
			pairs.push({ question: current.content, answer: next.content });
		}
		return pairs.slice(-MAX_HISTORY);
	}

	function resetChat() {
		abortController?.abort();
		abortController = null;
		stopTypewriter();
		messages = [];
		aiLoading = false;
		fly = null;
	}

	function resetPalette() {
		query = '';
		filteredCount = 0;
		resetChat();
	}

	async function scrollChatToBottom() {
		await tick();
		if (!chatEl) return;
		chatEl.scrollTop = chatEl.scrollHeight;
	}

	async function playOpen() {
		await tick();
		if (!overlayEl || !panelEl) return;
		stopAnimations();
		if (reducedMotion()) {
			overlayEl.style.opacity = '1';
			panelEl.style.opacity = '1';
			panelEl.style.transform = 'scale(1)';
			return;
		}
		overlayEl.style.opacity = '0';
		panelEl.style.opacity = '0';
		panelEl.style.transform = 'scale(1.04)';
		overlayAnimation = animate(overlayEl, { opacity: [0, 1] }, { duration: 0.22 });
		panelAnimation = animate(
			panelEl,
			{ opacity: [0, 1], transform: ['scale(1.04)', 'scale(1)'] },
			{ duration: 0.26, ease: EASE }
		);
	}

	async function playClose(): Promise<void> {
		if (!overlayEl || !panelEl || reducedMotion()) return;
		stopAnimations();
		await Promise.all([
			animate(overlayEl, { opacity: [1, 0] }, { duration: 0.2 }).finished,
			animate(
				panelEl,
				{ opacity: [1, 0], transform: ['scale(1)', 'scale(1.04)'] },
				{ duration: 0.22, ease: EASE }
			).finished
		]);
	}

	async function openPalette() {
		if (open || closing) return;
		open = true;
		await playOpen();
	}

	async function closePalette() {
		if (!open || closing) return;
		closing = true;
		try {
			await playClose();
		} finally {
			open = false;
			closing = false;
			resetPalette();
			stopAnimations();
		}
	}

	function onOpenChange(next: boolean) {
		if (next) {
			void openPalette();
		} else {
			void closePalette();
		}
	}

	async function navigateTo(href: string) {
		await closePalette();
		await goto(href);
	}

	async function flyQuestionToMessage(text: string, origin: DOMRect, messageIdValue: string) {
		if (reducedMotion()) {
			patchMessage(messageIdValue, { visible: true });
			return;
		}

		fly = {
			text,
			left: origin.left,
			top: origin.top,
			width: Math.max(origin.width, 120)
		};
		await tick();
		const destEl = chatEl?.querySelector(`[data-msg-id="${messageIdValue}"]`);
		if (!(destEl instanceof HTMLElement) || !flyEl) {
			fly = null;
			patchMessage(messageIdValue, { visible: true });
			return;
		}

		const dest = destEl.getBoundingClientRect();
		const flyRect = flyEl.getBoundingClientRect();
		const targetLeft = dest.right - flyRect.width;
		const targetTop = dest.top;

		await animate(
			flyEl,
			{
				left: [origin.left, targetLeft],
				top: [origin.top, targetTop],
				fontSize: ['16px', '14px']
			},
			{ duration: 0.34, ease: EASE }
		).finished;

		fly = null;
		patchMessage(messageIdValue, { visible: true });
	}

	async function startAi(questionText?: string) {
		const question = (questionText ?? query).trim();
		if (!question || aiLoading) return;

		const origin = (inputEl ?? document.activeElement) instanceof HTMLElement
			? (inputEl ?? (document.activeElement as HTMLElement)).getBoundingClientRect()
			: new DOMRect(0, 0, 0, 0);

		query = '';
		abortController?.abort();
		abortController = new AbortController();
		stopTypewriter();

		const userId = nextId('user');
		const assistantId = nextId('assistant');
		messages = [
			...messages,
			{
				id: userId,
				role: 'user',
				content: question,
				displayed: question,
				visible: false
			},
			{
				id: assistantId,
				role: 'assistant',
				content: '',
				displayed: '',
				visible: true
			}
		];
		aiLoading = true;
		await tick();
		await scrollChatToBottom();
		await flyQuestionToMessage(question, origin, userId);
		startTypewriter(assistantId);
		await scrollChatToBottom();

		try {
			await askFaqQuestion({
				question,
				locale,
				history: historyForRequest(assistantId),
				signal: abortController.signal,
				onChunk: (full) => {
					patchMessage(assistantId, { content: full });
				}
			});
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return;
			stopTypewriter();
			patchMessage(assistantId, {
				content: '',
				displayed: error instanceof Error ? error.message : copy.cmdkError,
				error: true
			});
		} finally {
			aiLoading = false;
			const assistant = messages.find((message) => message.id === assistantId);
			if (assistant && assistant.displayed.length >= assistant.content.length) {
				stopTypewriter();
			}
			await scrollChatToBottom();
			queueMicrotask(() => inputEl?.focus());
		}
	}

	function onInputKeydown(event: KeyboardEvent) {
		if (event.key !== 'Enter') return;
		if (aiLoading) {
			event.preventDefault();
			return;
		}
		if (chatMode) {
			if (!query.trim()) return;
			event.preventDefault();
			event.stopPropagation();
			void startAi(query);
			return;
		}
		if (filteredCount > 0) return;
		if (!query.trim()) return;
		event.preventDefault();
		event.stopPropagation();
		void startAi(query);
	}

	onMount(() => {
		const onKeydown = (event: KeyboardEvent) => {
			if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return;
			event.preventDefault();
			if (open) void closePalette();
			else void openPalette();
		};
		window.addEventListener('keydown', onKeydown);
		return () => {
			window.removeEventListener('keydown', onKeydown);
			abortController?.abort();
			stopTypewriter();
			stopAnimations();
		};
	});
</script>

<Dialog.Root {open} onOpenChange={onOpenChange}>
	<Dialog.Portal>
		<Dialog.Overlay bind:ref={overlayEl} class="cmdk-overlay" />
		<Dialog.Content class="cmdk-panel">
			<div class="cmdk-panel-inner" bind:this={panelEl} use:animateContentHeight>
				<div class="cmdk-panel-content">
					<Dialog.Title class="cmdk-sr-only">{copy.cmdkLabel}</Dialog.Title>
					<Dialog.Description class="cmdk-sr-only">{copy.cmdkPlaceholder}</Dialog.Description>

					<Command.Root
						class="cmdk-root"
						label={copy.cmdkLabel}
						loop
						shouldFilter={!chatMode}
						onStateChange={(state) => {
							filteredCount = state.filtered.count;
						}}
					>
						<div class="cmdk-input-row">
							<Command.Input
								bind:ref={inputEl}
								class="cmdk-input"
								placeholder={chatMode ? copy.cmdkContinue : copy.cmdkPlaceholder}
								bind:value={query}
								onkeydown={onInputKeydown}
							/>
							<kbd class="cmdk-kbd">esc</kbd>
						</div>
						<Command.List class="cmdk-list">
							{#if chatMode}
								<div class="cmdk-chat" bind:this={chatEl}>
									{#each messages as message (message.id)}
										{#if message.role === 'user'}
											<p
												class="cmdk-chat-user"
												class:cmdk-chat-pending={!message.visible}
												data-msg-id={message.id}
											>
												{message.content}
											</p>
										{:else if message.error}
											<p class="cmdk-chat-assistant cmdk-ai-error" data-msg-id={message.id}>
												{message.displayed}
											</p>
										{:else if aiLoading && message.displayed.length === 0 && message.content.length === 0}
											<p class="cmdk-chat-assistant cmdk-ai-status" data-msg-id={message.id}>
												{copy.cmdkThinking}
											</p>
										{:else}
											<div
												class="cmdk-chat-assistant faq-answer-body"
												data-msg-id={message.id}
											>
												{@html linkifyFaqAnswer(message.displayed)}{#if message.displayed.length < message.content.length || (aiLoading && message.id === messages[messages.length - 1]?.id)}<span
														class="cmdk-ai-caret"
														aria-hidden="true"
													></span
													>{/if}
											</div>
										{/if}
									{/each}
								</div>
							{:else}
								<Command.Viewport class="cmdk-viewport">
									<Command.Empty class="cmdk-empty">
										<p>
											{#if copy.cmdkEmptyBefore}{copy.cmdkEmptyBefore}{' '}{/if}<kbd
												class="cmdk-kbd">{copy.cmdkEmptyKey}</kbd
											>{#if copy.cmdkEmptyAfter}{' '}{copy.cmdkEmptyAfter}{/if}
										</p>
									</Command.Empty>

									<Command.Item
										class="cmdk-item"
										value={AI_VALUE}
										keywords={aiKeywords}
										onSelect={() => void startAi()}
									>
										<span class="cmdk-item-icon" aria-hidden="true">
											<Sparkles size={16} strokeWidth={1.8} />
										</span>
										<span class="cmdk-item-title">{copy.cmdkAskAi}</span>
									</Command.Item>

									{#each pages as page (page.id)}
										{@const Icon = page.icon}
										<Command.Item
											class="cmdk-item"
											value={page.id}
											keywords={[page.title, page.path, ...page.keywords]}
											onSelect={() => void navigateTo(page.href)}
										>
											<span class="cmdk-item-icon" aria-hidden="true">
												<Icon size={16} strokeWidth={1.8} />
											</span>
											<span class="cmdk-item-title">{page.title}</span>
										</Command.Item>
									{/each}
								</Command.Viewport>
							{/if}
						</Command.List>
					</Command.Root>
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

{#if fly}
	<p
		bind:this={flyEl}
		class="cmdk-fly"
		style={`left:${fly.left}px;top:${fly.top}px;width:${fly.width}px`}
	>
		{fly.text}
	</p>
{/if}
