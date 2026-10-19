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

	const AI_VALUE = 'action:ask-ai';
	const EASE = [0.22, 1, 0.36, 1] as const;

	let open = $state(false);
	let closing = $state(false);
	let query = $state('');
	let filteredCount = $state(0);
	let aiFullAnswer = $state('');
	let aiDisplayedAnswer = $state('');
	let aiLoading = $state(false);
	let aiError = $state<string | null>(null);
	let overlayEl = $state<HTMLElement | null>(null);
	let panelEl = $state<HTMLElement | null>(null);
	let abortController: AbortController | null = null;
	let typewriterTimer: ReturnType<typeof setInterval> | null = null;
	let overlayAnimation: AnimationPlaybackControls | undefined;
	let panelAnimation: AnimationPlaybackControls | undefined;

	let copy = $derived(ui[locale]);
	let pages = $derived(getCommandPalettePages(locale));
	let showingAnswer = $derived(
		aiLoading || aiDisplayedAnswer.length > 0 || aiFullAnswer.length > 0 || !!aiError
	);
	let aiKeywords = $derived(
		locale === 'en'
			? ['ask', 'ai', 'faq', 'question', 'help', 'search']
			: ['frage', 'ki', 'faq', 'ai', 'hilfe', 'suchen', 'ask']
	);

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

	function startTypewriter() {
		stopTypewriter();
		if (reducedMotion()) {
			aiDisplayedAnswer = aiFullAnswer;
			return;
		}
		typewriterTimer = setInterval(() => {
			if (aiDisplayedAnswer.length >= aiFullAnswer.length) {
				if (!aiLoading) stopTypewriter();
				return;
			}
			const step = Math.min(2, aiFullAnswer.length - aiDisplayedAnswer.length);
			aiDisplayedAnswer = aiFullAnswer.slice(0, aiDisplayedAnswer.length + step);
		}, 18);
	}

	function resetAi() {
		abortController?.abort();
		abortController = null;
		stopTypewriter();
		aiFullAnswer = '';
		aiDisplayedAnswer = '';
		aiLoading = false;
		aiError = null;
	}

	function resetPalette() {
		query = '';
		filteredCount = 0;
		resetAi();
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

	async function startAi(questionText?: string) {
		const question = (questionText ?? query).trim();
		if (!question || aiLoading) return;

		abortController?.abort();
		abortController = new AbortController();
		stopTypewriter();
		aiFullAnswer = '';
		aiDisplayedAnswer = '';
		aiError = null;
		aiLoading = true;
		startTypewriter();

		try {
			await askFaqQuestion({
				question,
				locale,
				history: [],
				signal: abortController.signal,
				onChunk: (full) => {
					aiFullAnswer = full;
				}
			});
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return;
			stopTypewriter();
			aiFullAnswer = '';
			aiDisplayedAnswer = '';
			aiError = error instanceof Error ? error.message : copy.cmdkError;
		} finally {
			aiLoading = false;
			if (aiDisplayedAnswer.length >= aiFullAnswer.length) {
				stopTypewriter();
			}
		}
	}

	function onQueryInput() {
		if (showingAnswer) resetAi();
	}

	function onInputKeydown(event: KeyboardEvent) {
		if (event.key !== 'Enter') return;
		if (showingAnswer && !aiLoading) return;
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
						shouldFilter={!showingAnswer}
						onStateChange={(state) => {
							filteredCount = state.filtered.count;
						}}
					>
						<div class="cmdk-input-row">
							<Command.Input
								class="cmdk-input"
								placeholder={copy.cmdkPlaceholder}
								bind:value={query}
								oninput={onQueryInput}
								onkeydown={onInputKeydown}
							/>
							<kbd class="cmdk-kbd">esc</kbd>
						</div>
						<Command.List class="cmdk-list">
							<Command.Viewport class="cmdk-viewport">
								{#if showingAnswer}
									<div class="cmdk-answer">
										{#if aiError}
											<p class="cmdk-ai-error">{aiError}</p>
										{:else if aiLoading && !aiDisplayedAnswer}
											<p class="cmdk-ai-status">{copy.cmdkThinking}</p>
										{:else}
											<div class="cmdk-ai-answer faq-answer-body">
												{@html linkifyFaqAnswer(aiDisplayedAnswer)}{#if aiLoading || aiDisplayedAnswer.length < aiFullAnswer.length}<span
														class="cmdk-ai-caret"
														aria-hidden="true"
													></span
													>{/if}
											</div>
										{/if}
									</div>
								{:else}
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
								{/if}
							</Command.Viewport>
						</Command.List>
					</Command.Root>
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
