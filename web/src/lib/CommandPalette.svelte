<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { Command, Dialog } from 'bits-ui';
	import { animate, type AnimationPlaybackControls } from 'motion';
	import { ArrowLeft, Sparkles } from 'lucide-svelte';
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
	let mode = $state<'search' | 'ai'>('search');
	let aiQuestion = $state('');
	let aiAnswer = $state('');
	let aiLoading = $state(false);
	let aiError = $state<string | null>(null);
	let overlayEl = $state<HTMLElement | null>(null);
	let panelEl = $state<HTMLElement | null>(null);
	let abortController: AbortController | null = null;
	let overlayAnimation: AnimationPlaybackControls | undefined;
	let panelAnimation: AnimationPlaybackControls | undefined;

	let copy = $derived(ui[locale]);
	let pages = $derived(getCommandPalettePages(locale));
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

	function resetAi() {
		abortController?.abort();
		abortController = null;
		mode = 'search';
		aiQuestion = '';
		aiAnswer = '';
		aiLoading = false;
		aiError = null;
	}

	function resetPalette() {
		query = '';
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
		if (!question) {
			mode = 'ai';
			aiQuestion = '';
			aiAnswer = '';
			aiError =
				locale === 'en'
					? 'Type a question first, then ask AI.'
					: 'Bitte zuerst eine Frage eingeben.';
			return;
		}

		mode = 'ai';
		aiQuestion = question;
		aiAnswer = '';
		aiError = null;
		aiLoading = true;
		abortController?.abort();
		abortController = new AbortController();

		try {
			await askFaqQuestion({
				question,
				locale,
				history: [],
				signal: abortController.signal,
				onChunk: (full) => {
					aiAnswer = full;
				}
			});
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return;
			aiError = error instanceof Error ? error.message : copy.cmdkError;
		} finally {
			aiLoading = false;
		}
	}

	function backToSearch() {
		abortController?.abort();
		abortController = null;
		mode = 'search';
		aiAnswer = '';
		aiError = null;
		aiLoading = false;
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
			stopAnimations();
		};
	});
</script>

<Dialog.Root {open} onOpenChange={onOpenChange}>
	<Dialog.Portal>
		<Dialog.Overlay bind:ref={overlayEl} class="cmdk-overlay" />
		<Dialog.Content
			class="cmdk-panel"
			onOpenAutoFocus={(event) => {
				if (mode === 'ai') event.preventDefault();
			}}
		>
			<div class="cmdk-panel-inner" bind:this={panelEl}>
				<Dialog.Title class="cmdk-sr-only">{copy.cmdkLabel}</Dialog.Title>
				<Dialog.Description class="cmdk-sr-only">{copy.cmdkPlaceholder}</Dialog.Description>

				{#if mode === 'ai'}
					<div class="cmdk-ai">
						<button class="cmdk-ai-back" type="button" onclick={backToSearch}>
							<ArrowLeft size={16} strokeWidth={1.8} aria-hidden="true" />
							{copy.cmdkBack}
						</button>
						{#if aiQuestion}
							<p class="cmdk-ai-question">{aiQuestion}</p>
						{/if}
						{#if aiLoading && !aiAnswer}
							<p class="cmdk-ai-status">{copy.cmdkThinking}</p>
						{:else if aiError}
							<p class="cmdk-ai-error">{aiError}</p>
						{:else if aiAnswer}
							<div class="cmdk-ai-answer faq-answer-body">
								{@html linkifyFaqAnswer(aiAnswer)}
							</div>
							{#if aiLoading}
								<span class="cmdk-ai-caret" aria-hidden="true"></span>
							{/if}
						{/if}
					</div>
				{:else}
					<Command.Root class="cmdk-root" label={copy.cmdkLabel} loop>
						<div class="cmdk-input-row">
							<Command.Input
								class="cmdk-input"
								placeholder={copy.cmdkPlaceholder}
								bind:value={query}
							/>
							<kbd class="cmdk-kbd">esc</kbd>
						</div>
						<Command.List class="cmdk-list">
							<Command.Viewport class="cmdk-viewport">
								<Command.Empty class="cmdk-empty">
									<p>{copy.cmdkEmpty}</p>
									{#if query.trim()}
										<button
											class="cmdk-empty-ai"
											type="button"
											onclick={() => void startAi(query)}
										>
											<Sparkles size={16} strokeWidth={1.8} aria-hidden="true" />
											<span
												>{copy.cmdkAskAbout}
												“{query.trim()}”</span
											>
										</button>
									{/if}
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
						</Command.List>
					</Command.Root>
				{/if}
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
