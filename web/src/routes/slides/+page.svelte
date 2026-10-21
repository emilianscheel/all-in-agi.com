<script lang="ts">
	import { onMount } from 'svelte';
	import { ChevronLeft, ChevronRight, X } from 'lucide-svelte';
	import { orderSlides, visibleSlides, type Slide } from '$lib/slides/parse';
	import type { PageData } from './$types';

	const orderStorageKey = 'all-in-agi.slides.order';
	const hiddenStorageKey = 'all-in-agi.slides.hidden';

	let { data }: { data: PageData } = $props();
	let savedOrder = $state<string[]>([]);
	let hiddenIds = $state<string[]>([]);
	let ordered = $derived(orderSlides(data.slides, savedOrder));
	let slides = $derived(visibleSlides(data.slides, savedOrder, hiddenIds));
	let hiddenSlides = $derived(ordered.filter((slide) => hiddenIds.includes(slide.id)));

	let presenting = $state(false);
	let index = $state(0);
	let slide = $derived(slides[index]);
	let last = $derived(slides.length - 1);
	let draggingId = $state<string | null>(null);
	let dropTargetId = $state<string | null>(null);
	let suppressClick = false;

	function readIds(key: string) {
		try {
			const stored = JSON.parse(localStorage.getItem(key) ?? '[]');
			if (Array.isArray(stored)) return stored.filter((id) => typeof id === 'string');
		} catch { /* Keep the file order when storage is unreadable. */ }
		return [];
	}

	onMount(() => {
		savedOrder = readIds(orderStorageKey);
		hiddenIds = readIds(hiddenStorageKey);
	});

	function persist(ids: string[]) {
		savedOrder = ids;
		try { localStorage.setItem(orderStorageKey, JSON.stringify(ids)); } catch { /* The order still applies for this view. */ }
	}

	function persistHidden(ids: string[]) {
		hiddenIds = ids;
		try { localStorage.setItem(hiddenStorageKey, JSON.stringify(ids)); } catch { /* The slide stays hidden for this view. */ }
	}

	function remove(id: string) {
		suppressClick = true;
		if (!hiddenIds.includes(id)) persistHidden([...hiddenIds, id]);
		if (presenting && slides.length <= 1) presenting = false;
		window.setTimeout(() => { suppressClick = false; }, 0);
	}

	function restore(id: string) {
		persistHidden(hiddenIds.filter((item) => item !== id));
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
		const ids = ordered.map((item) => item.id);
		const from = ids.indexOf(fromId);
		const to = ids.indexOf(toId);
		if (from < 0 || to < 0) return;
		const [moved] = ids.splice(from, 1);
		ids.splice(to, 0, moved);
		persist(ids);
	}

	function onDragStart(event: DragEvent, id: string) {
		if (event.target instanceof Element && event.target.closest('.slide-remove')) {
			event.preventDefault();
			return;
		}
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
		<button class="button-primary" type="button" onclick={() => start(0)} disabled={slides.length === 0}>Präsentation starten</button>
	</div>
		<div class="slide-grid">
		{#each slides as item, itemIndex (item.id)}
			<div
				class="slide-card"
				class:dragging={draggingId === item.id}
				class:drop-target={dropTargetId === item.id}
				draggable="true"
				ondragstart={(event) => onDragStart(event, item.id)}
				ondragover={(event) => onDragOver(event, item.id)}
				ondrop={(event) => onDrop(event, item.id)}
				ondragend={onDragEnd}
			>
				<button
					type="button"
					class="slide-open"
					onclick={() => start(itemIndex)}
					aria-label={`${titleOf(item)}. Ziehen, um die Reihenfolge zu ändern.`}
				>
					<span class="slide-number">{itemIndex + 1}</span>
					<strong>{item.title}</strong>
					<ul>
						{#each item.points as point}
							<li>{point}</li>
						{/each}
					</ul>
				</button>
				<button
					type="button"
					class="slide-remove"
					aria-label={`${titleOf(item)} entfernen`}
					onclick={(event) => { event.stopPropagation(); remove(item.id); }}
					ondragstart={(event) => { event.preventDefault(); event.stopPropagation(); }}
				>
					<X size={14} aria-hidden="true" />
				</button>
			</div>
		{/each}
	</div>
	{#if hiddenSlides.length > 0}
		<div class="restore-row">
			{#each hiddenSlides as item (item.id)}
				<button type="button" class="restore" onclick={() => restore(item.id)}>{item.title} wieder einblenden</button>
			{/each}
		</div>
	{/if}
</div>

{#if presenting && slide}
	<section class="deck" aria-label="Präsentation">
		<header>
			<img src="/brand/all-in-agi-logo.png" alt="" width="512" height="512" />
			<p>ALL IN AGI</p>
			<span>{index + 1} / {slides.length}</span>
		</header>
		<div class="stage">
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
	.slide-card { position: relative; }
	.slide-open {
		position: relative;
		width: 100%;
		min-height: 220px;
		padding: 22px 20px 18px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		border: 1px solid color-mix(in srgb, #151515 10%, transparent);
		border-radius: 18px;
		background: #f5f1e8;
		color: #151515;
		font: inherit;
		text-align: left;
		cursor: grab;
	}
	.slide-card:active .slide-open, .slide-card.dragging .slide-open { cursor: grabbing; }
	.slide-card.dragging { opacity: .45; }
	.slide-card.drop-target .slide-open { outline: 2px solid #ff4f18; outline-offset: 3px; }
	.slide-remove {
		position: absolute;
		top: 10px;
		right: 10px;
		z-index: 1;
		width: 28px;
		height: 28px;
		padding: 0;
		display: grid;
		place-items: center;
		border: 0;
		border-radius: 50%;
		background: #151515;
		color: #f5f1e8;
		cursor: pointer;
		opacity: 0;
		pointer-events: none;
	}
	.slide-card:hover .slide-remove,
	.slide-card:focus-within .slide-remove { opacity: 1; pointer-events: auto; }
	.slide-card:hover .slide-number,
	.slide-card:focus-within .slide-number { opacity: 0; }
	.restore-row { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-top: 16px; }
	.restore {
		padding: 0;
		border: 0;
		background: transparent;
		color: #6f6c66;
		font: inherit;
		font-size: 13px;
		text-decoration: underline;
		cursor: pointer;
	}
	.slide-number {
		position: absolute;
		top: 14px;
		right: 16px;
		color: #6f6c66;
		font-size: 12px;
		font-weight: 650;
		font-variant-numeric: tabular-nums;
	}
	.slide-card strong {
		max-width: 100%;
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
	.stage {
		width: 100%;
		margin: 0;
		padding: 12px clamp(28px, 5vw, 88px) 28px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: flex-start;
		overflow: auto;
	}
	.deck h2 {
		position: sticky;
		top: 0;
		z-index: 1;
		width: 100%;
		margin: 0;
		padding-bottom: 8px;
		max-width: none;
		background: #f5f1e8;
		font-size: clamp(40px, 4.4vw, 68px);
		line-height: 1.02;
		letter-spacing: -.045em;
	}
	.deck ul { width: 100%; max-width: none; }
	.deck li { margin-top: 22px; max-width: none; font-size: clamp(20px, 2.2vw, 28px); line-height: 1.35; letter-spacing: -.02em; }
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
	@media (hover: none) {
		.slide-remove { opacity: 1; pointer-events: auto; }
		.slide-number { right: 46px; opacity: 1; }
	}
</style>
