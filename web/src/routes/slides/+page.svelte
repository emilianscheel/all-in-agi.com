<script lang="ts">
	import { onMount } from 'svelte';
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { orderSlides, type Slide } from '$lib/slides/parse';
	import type { PageData } from './$types';

	const orderStorageKey = 'all-in-agi.slides.order';

	let { data }: { data: PageData } = $props();
	let savedOrder = $state<string[]>([]);
	let slides = $derived(orderSlides(data.slides, savedOrder));

	let presenting = $state(false);
	let index = $state(0);
	let slide = $derived(slides[index]);
	let last = $derived(slides.length - 1);
	let draggingId = $state<string | null>(null);
	let dropTargetId = $state<string | null>(null);
	let suppressClick = false;

	onMount(() => {
		try {
			const stored = JSON.parse(localStorage.getItem(orderStorageKey) ?? '[]');
			if (Array.isArray(stored)) savedOrder = stored.filter((id) => typeof id === 'string');
		} catch { /* Keep the file order when storage is unreadable. */ }
	});

	function persist(ids: string[]) {
		savedOrder = ids;
		try { localStorage.setItem(orderStorageKey, JSON.stringify(ids)); } catch { /* The order still applies for this view. */ }
	}

	function start(at = 0) {
		if (suppressClick) return;
		index = at;
		presenting = true;
	}

	function close() {
		presenting = false;
	}

	function go(next: number) {
		index = Math.min(last, Math.max(0, next));
	}

	function move(fromId: string, toId: string) {
		if (fromId === toId) return;
		const ids = slides.map((item) => item.id);
		const from = ids.indexOf(fromId);
		const to = ids.indexOf(toId);
		if (from < 0 || to < 0) return;
		const [moved] = ids.splice(from, 1);
		ids.splice(to, 0, moved);
		persist(ids);
	}

	function onDragStart(event: DragEvent, id: string) {
		draggingId = id;
		suppressClick = true;
		event.dataTransfer?.setData('text/plain', id);
		if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
	}

	function onDragOver(event: DragEvent, id: string) {
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
		if (draggingId && draggingId !== id) dropTargetId = id;
	}

	function onDrop(event: DragEvent, id: string) {
		event.preventDefault();
		const fromId = event.dataTransfer?.getData('text/plain') || draggingId;
		if (fromId) move(fromId, id);
		draggingId = null;
		dropTargetId = null;
	}

	function onDragEnd() {
		draggingId = null;
		dropTargetId = null;
		window.setTimeout(() => { suppressClick = false; }, 0);
	}

	function onKey(event: KeyboardEvent) {
		if (!presenting) return;
		if (event.key === 'Escape') close();
		else if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') {
			event.preventDefault();
			go(index + 1);
		} else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
			event.preventDefault();
			go(index - 1);
		}
	}

	function titleOf(item: Slide) {
		return item.title;
	}
</script>

<svelte:head>
	<title>Slides — ALL IN AGI</title>
</svelte:head>

<svelte:window onkeydown={onKey} />

<div class="dashboard-page">
	<div class="dashboard-heading">
		<h1>Slides</h1>
		<button class="button-primary" type="button" onclick={() => start(0)}>Präsentation starten</button>
	</div>
		<div class="slide-grid">
		{#each slides as item, itemIndex (item.id)}
			<button
				type="button"
				class="slide-card"
				class:dragging={draggingId === item.id}
				class:drop-target={dropTargetId === item.id}
				draggable="true"
				onclick={() => start(itemIndex)}
				ondragstart={(event) => onDragStart(event, item.id)}
				ondragover={(event) => onDragOver(event, item.id)}
				ondrop={(event) => onDrop(event, item.id)}
				ondragend={onDragEnd}
				aria-label={`${titleOf(item)}. Ziehen, um die Reihenfolge zu ändern.`}
			>
				<span class="slide-number">{itemIndex + 1}</span>
				<p class="kicker">{item.kicker}</p>
				<strong>{item.title}</strong>
				<ul>
					{#each item.points as point}
						<li>{point}</li>
					{/each}
				</ul>
			</button>
		{/each}
	</div>
</div>

{#if presenting && slide}
	<section class="deck" aria-label="Präsentation">
		<header>
			<img src="/brand/all-in-agi-logo.png" alt="" width="512" height="512" />
			<p>ALL IN AGI</p>
			<span>{index + 1} / {slides.length}</span>
		</header>
		<div class="stage">
			<p class="deck-kicker">{slide.kicker}</p>
			<h2>{slide.title}</h2>
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
			<button class="deck-exit" type="button" onclick={close}>Beenden</button>
			<button type="button" onclick={() => go(index + 1)} disabled={index === last} aria-label="Nächste Folie">
				<ChevronRight size={22} aria-hidden="true" />
			</button>
		</footer>
	</section>
{/if}

<style>
	.slide-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 16px;
	}
	.slide-card {
		position: relative;
		width: 100%;
		min-height: 220px;
		padding: 22px 20px 18px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		overflow: hidden;
		border: 1px solid color-mix(in srgb, #151515 10%, transparent);
		border-radius: 18px;
		background: #f5f1e8;
		color: #151515;
		text-align: left;
		cursor: grab;
	}
	.slide-card:active, .slide-card.dragging { cursor: grabbing; }
	.slide-card.dragging { opacity: .45; }
	.slide-card.drop-target { outline: 2px solid #ff4f18; outline-offset: 3px; }
	.slide-number {
		position: absolute;
		top: 14px;
		right: 16px;
		color: #6f6c66;
		font-size: 12px;
		font-weight: 650;
		font-variant-numeric: tabular-nums;
	}
	.kicker, .deck-kicker {
		margin: 0;
		color: #ff4f18;
		font-weight: 700;
		letter-spacing: .12em;
		text-transform: uppercase;
	}
	.kicker { font-size: 11px; }
	.slide-card strong {
		margin-top: 10px;
		max-width: 16ch;
		font-size: 26px;
		line-height: 1.05;
		letter-spacing: -.03em;
	}
	.slide-card ul, .deck ul {
		margin: 16px 0 0;
		padding: 0;
		list-style: none;
	}
	.slide-card li, .deck li {
		display: flex;
		gap: 10px;
		align-items: flex-start;
	}
	.slide-card li { margin-top: 8px; font-size: 13px; line-height: 1.35; }
	.slide-card li::before, .deck li::before {
		content: '';
		flex: 0 0 auto;
		width: 7px;
		height: 7px;
		margin-top: .45em;
		border-radius: 50%;
		background: #ff4f18;
	}
	.deck {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: grid;
		grid-template-rows: auto minmax(0, 1fr) auto;
		background: #f5f1e8;
		color: #151515;
	}
	.deck header, .deck footer {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: max(22px, env(safe-area-inset-top)) clamp(28px, 5vw, 88px) 18px;
	}
	.deck footer { justify-content: space-between; padding-bottom: max(22px, env(safe-area-inset-bottom)); }
	.deck header img { width: 36px; height: 36px; object-fit: contain; }
	.deck header p { margin: 0; font-size: 15px; font-weight: 700; letter-spacing: .12em; }
	.deck header span { margin-left: auto; color: #6f6c66; font-weight: 650; font-variant-numeric: tabular-nums; }
	.stage { width: min(980px, 100%); margin: 0 auto; padding: clamp(28px, 6vh, 72px) clamp(28px, 5vw, 88px); display: flex; flex-direction: column; justify-content: center; }
	.deck-kicker { font-size: 15px; }
	.deck h2 {
		margin: 16px 0 0;
		max-width: 14ch;
		font-size: clamp(48px, 6vw, 84px);
		line-height: .96;
		letter-spacing: -.045em;
	}
	.deck li { margin-top: 22px; font-size: clamp(20px, 2.2vw, 28px); line-height: 1.35; letter-spacing: -.02em; }
	.deck footer button {
		width: 48px;
		height: 48px;
		padding: 0;
		display: grid;
		place-items: center;
		border: 1px solid color-mix(in srgb, #151515 18%, transparent);
		border-radius: 50%;
		background: transparent;
		color: inherit;
		cursor: pointer;
	}
	.deck footer button:disabled { opacity: .35; cursor: not-allowed; }
	.deck-exit { width: auto !important; min-width: 120px; padding: 0 18px !important; border-radius: 999px !important; font: inherit; font-size: 15px; font-weight: 650; }
	@media (max-width: 800px) {
		.slide-grid { grid-template-columns: 1fr; }
	}
</style>
