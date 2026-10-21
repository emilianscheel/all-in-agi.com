<script lang="ts">
	import { onMount } from 'svelte';
	import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-svelte';
	import { slides } from '$lib/slides';

	const themes = ['light', 'orange', 'black'] as const;
	const themeStorageKey = 'all-in-agi.slides.theme';
	let index = $state(0);
	let fullscreen = $state(false);
	let theme = $state<(typeof themes)[number]>('light');
	let slide = $derived(slides[index]);
	let last = slides.length - 1;

	function go(next: number) {
		index = Math.min(last, Math.max(0, next));
	}

	function cycleTheme() {
		theme = themes[(themes.indexOf(theme) + 1) % themes.length];
		try { localStorage.setItem(themeStorageKey, theme); } catch { /* Storage can be unavailable in private contexts. */ }
	}

	async function toggleFullscreen() {
		if (document.fullscreenElement) {
			await document.exitFullscreen();
			return;
		}
		await document.documentElement.requestFullscreen();
	}

	onMount(() => {
		try {
			const stored = localStorage.getItem(themeStorageKey);
			if (themes.includes(stored as (typeof themes)[number])) theme = stored as (typeof themes)[number];
		} catch { /* Use the default theme when storage is unavailable. */ }

		function onKey(event: KeyboardEvent) {
			const target = event.target;
			if (target instanceof HTMLElement && target.closest("input, textarea, select, [contenteditable='true']")) return;
			if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') {
				event.preventDefault();
				go(index + 1);
			} else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
				event.preventDefault();
				go(index - 1);
			} else if (event.key === 'Home') {
				event.preventDefault();
				go(0);
			} else if (event.key === 'End') {
				event.preventDefault();
				go(last);
			} else if (event.key === 'Enter' && !event.repeat) {
				event.preventDefault();
				cycleTheme();
			} else if (event.key === 'f' || event.key === 'F') {
				event.preventDefault();
				void toggleFullscreen();
			}
		}
		function onFullscreen() {
			fullscreen = Boolean(document.fullscreenElement);
		}
		window.addEventListener('keydown', onKey);
		document.addEventListener('fullscreenchange', onFullscreen);
		return () => {
			window.removeEventListener('keydown', onKey);
			document.removeEventListener('fullscreenchange', onFullscreen);
		};
	});
</script>

<svelte:head>
	<title>Slides — ALL IN AGI</title>
	<meta name="robots" content="noindex, nofollow, noarchive" />
</svelte:head>

<section class={`slides theme-${theme}`} aria-label="Folien">
	<p class="keyboard-hint">Pfeiltasten wechseln die Folie. Enter wechselt das Farbschema. F schaltet Vollbild.</p>
	<header>
		<img src="/brand/all-in-agi-logo.png" alt="ALL IN AGI" width="512" height="512" />
		<p>{index + 1} / {slides.length}</p>
	</header>
	<div class="slide" aria-live="polite">
		<p class="kicker">{slide.kicker}</p>
		<h1>{slide.title}</h1>
		<ul>
			{#each slide.points as point}
				<li>{point}</li>
			{/each}
		</ul>
	</div>
	<footer>
		<button type="button" onclick={() => go(index - 1)} disabled={index === 0} aria-label="Vorherige Folie">
			<ChevronLeft size={22} aria-hidden="true" />
		</button>
		<div class="dots" role="tablist" aria-label="Folien">
			{#each slides as item, itemIndex}
				<button
					type="button"
					role="tab"
					aria-selected={itemIndex === index}
					aria-label={item.title}
					class:active={itemIndex === index}
					onclick={() => go(itemIndex)}
				></button>
			{/each}
		</div>
		<div class="actions">
			<button type="button" onclick={() => void toggleFullscreen()} aria-label={fullscreen ? 'Vollbild beenden' : 'Vollbild'}>
				{#if fullscreen}<Minimize2 size={18} aria-hidden="true" />{:else}<Maximize2 size={18} aria-hidden="true" />{/if}
			</button>
			<button type="button" onclick={() => go(index + 1)} disabled={index === last} aria-label="Nächste Folie">
				<ChevronRight size={22} aria-hidden="true" />
			</button>
		</div>
	</footer>
</section>

<style>
	.slides {
		--slide-bg: #fff;
		--slide-ink: #151515;
		--slide-accent: #ff4f18;
		--slide-muted: color-mix(in srgb, var(--slide-ink) 62%, transparent);
		position: relative;
		display: grid;
		grid-template-rows: auto minmax(0, 1fr) auto;
		width: 100%;
		min-height: 100svh;
		overflow: hidden;
		background: var(--slide-bg);
		color: var(--slide-ink);
		transition: background-color .22s ease, color .22s ease;
	}
	.theme-orange { --slide-bg: #ff4f18; --slide-ink: #fff; --slide-accent: #fff; }
	.theme-black { --slide-bg: #151515; --slide-ink: #fff; --slide-accent: #ff4f18; }
	.keyboard-hint {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	header, footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: max(24px, env(safe-area-inset-top)) clamp(24px, 4vw, 72px) 20px;
	}
	footer { padding-top: 20px; padding-bottom: max(24px, env(safe-area-inset-bottom)); }
	header img {
		width: 42px;
		height: 42px;
		object-fit: contain;
		filter: brightness(0);
	}
	.theme-orange header img, .theme-black header img { filter: brightness(0) invert(1); }
	header p { margin: 0; font-variant-numeric: tabular-nums; font-weight: 650; color: var(--slide-muted); }
	.slide {
		width: min(1100px, 100%);
		margin: 0 auto;
		padding: 0 clamp(24px, 4vw, 72px);
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
	.kicker {
		margin: 0;
		color: var(--slide-accent);
		font-size: clamp(14px, 1.4vw, 18px);
		font-weight: 700;
		letter-spacing: .08em;
		text-transform: uppercase;
	}
	h1 {
		margin: 16px 0 0;
		max-width: 16ch;
		font-size: clamp(48px, 7vw, 92px);
		font-weight: 700;
		letter-spacing: -.045em;
		line-height: .95;
	}
	ul {
		margin: clamp(28px, 4vh, 48px) 0 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: clamp(14px, 2vh, 22px);
	}
	li {
		display: flex;
		gap: 16px;
		max-width: 42ch;
		font-size: clamp(20px, 2.4vw, 32px);
		font-weight: 550;
		letter-spacing: -.02em;
		line-height: 1.25;
	}
	li::before {
		content: '';
		flex: 0 0 auto;
		width: 10px;
		height: 10px;
		margin-top: .45em;
		border-radius: 50%;
		background: var(--slide-accent);
	}
	.dots { display: flex; align-items: center; justify-content: center; gap: 8px; min-width: 0; }
	.actions { display: flex; align-items: center; gap: 8px; }
	button {
		width: 48px;
		height: 48px;
		padding: 0;
		display: grid;
		place-items: center;
		border: 1px solid color-mix(in srgb, var(--slide-ink) 18%, transparent);
		border-radius: 50%;
		background: transparent;
		color: inherit;
		cursor: pointer;
	}
	button:hover:not(:disabled) { background: color-mix(in srgb, var(--slide-ink) 8%, transparent); }
	button:disabled { opacity: .35; cursor: not-allowed; }
	.dots button { width: 10px; height: 10px; border: 0; background: color-mix(in srgb, var(--slide-ink) 28%, transparent); }
	.dots button.active { width: 32px; border-radius: 999px; background: var(--slide-accent); }
	@media (max-width: 700px) {
		h1 { font-size: clamp(40px, 12vw, 64px); }
		li { font-size: 20px; }
		.dots { display: none; }
	}
	@media (prefers-reduced-motion: reduce) {
		.slides { transition: none; }
	}
</style>
