<script lang="ts">
	import { onMount } from 'svelte';
	import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-svelte';
	import { slides } from '$lib/slides';

	let index = $state(0);
	let fullscreen = $state(false);
	let slide = $derived(slides[index]);
	let last = slides.length - 1;

	function go(next: number) {
		index = Math.min(last, Math.max(0, next));
	}

	async function toggleFullscreen() {
		if (document.fullscreenElement) {
			await document.exitFullscreen();
			return;
		}
		await document.documentElement.requestFullscreen();
	}

	onMount(() => {
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

<section class="slides" aria-label="Folien">
	<p class="keyboard-hint">Pfeiltasten wechseln die Folie. F schaltet Vollbild.</p>
	<header>
		<img src="/brand/all-in-agi-logo.png" alt="" width="512" height="512" />
		<p>ALL IN AGI</p>
		<span>{index + 1} / {slides.length}</span>
	</header>
	<div class="stage" aria-live="polite">
		{#if slide.kind === 'intro'}
			<div class="intro">
				<p class="kicker">ALL IN AGI</p>
				<h1>{slide.title}</h1>
				<p class="lede">{slide.lede}</p>
			</div>
		{:else}
			<div class="content">
				<p class="kicker">{slide.kicker}</p>
				<h1>{slide.title}</h1>
				<ul>
					{#each slide.points as point}
						<li>
							<strong>{point.label}</strong>
							<span>{point.text}</span>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
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
		--slide-bg: #f5f1e8;
		--slide-ink: #151515;
		--slide-accent: #ff4f18;
		--slide-muted: #6f6c66;
		position: relative;
		display: grid;
		grid-template-rows: auto minmax(0, 1fr) auto;
		width: 100%;
		min-height: 100svh;
		overflow: hidden;
		background: var(--slide-bg);
		color: var(--slide-ink);
	}
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
		gap: 16px;
		padding: max(22px, env(safe-area-inset-top)) clamp(28px, 5vw, 88px) 18px;
	}
	header { border-bottom: 1px solid color-mix(in srgb, var(--slide-ink) 12%, transparent); }
	footer { justify-content: space-between; padding-top: 18px; padding-bottom: max(22px, env(safe-area-inset-bottom)); border-top: 1px solid color-mix(in srgb, var(--slide-ink) 12%, transparent); }
	header img { width: 36px; height: 36px; object-fit: contain; }
	header p { margin: 0; font-size: 15px; font-weight: 700; letter-spacing: .12em; }
	header span { margin-left: auto; font-variant-numeric: tabular-nums; font-weight: 650; color: var(--slide-muted); }
	.stage {
		width: min(1080px, 100%);
		margin: 0 auto;
		padding: clamp(36px, 7vh, 84px) clamp(28px, 5vw, 88px) 24px;
	}
	.intro { min-height: 100%; display: flex; flex-direction: column; justify-content: center; }
	.content { display: flex; flex-direction: column; }
	.kicker {
		margin: 0;
		color: var(--slide-accent);
		font-size: 15px;
		font-weight: 700;
		letter-spacing: .12em;
		text-transform: uppercase;
	}
	h1 {
		margin: 18px 0 0;
		max-width: 16ch;
		font-size: clamp(46px, 6vw, 84px);
		font-weight: 700;
		letter-spacing: -.045em;
		line-height: .96;
	}
	.lede {
		margin: 28px 0 0;
		max-width: 40rem;
		font-size: clamp(22px, 2.4vw, 32px);
		font-weight: 550;
		letter-spacing: -.02em;
		line-height: 1.3;
	}
	ul {
		margin: clamp(36px, 6vh, 64px) 0 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: 0;
		border-top: 1px solid color-mix(in srgb, var(--slide-ink) 14%, transparent);
	}
	li {
		display: grid;
		grid-template-columns: minmax(140px, 220px) minmax(0, 1fr);
		gap: 24px;
		align-items: baseline;
		padding: 22px 0;
		border-bottom: 1px solid color-mix(in srgb, var(--slide-ink) 14%, transparent);
	}
	li strong { font-size: clamp(18px, 1.6vw, 22px); letter-spacing: -.02em; }
	li span { font-size: clamp(18px, 1.7vw, 24px); line-height: 1.35; letter-spacing: -.02em; }
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
		h1 { font-size: clamp(38px, 11vw, 56px); }
		li { grid-template-columns: 1fr; gap: 6px; padding: 16px 0; }
		.dots { display: none; }
	}
</style>
