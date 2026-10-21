<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { ArrowLeft, ChevronLeft, ChevronRight, Plus, X } from 'lucide-svelte';
	import { orderSlides, parseEditorDocument, type Slide } from '$lib/slides/parse';
	import type { PageData } from './$types';

	const orderStorageKey = 'all-in-agi.slides.order';

	let { data }: { data: PageData } = $props();
	let catalog = $state<Slide[]>(untrack(() => data.slides.map((slide) => ({ ...slide, points: [...slide.points] }))));
	let savedOrder = $state<string[]>([]);
	let slides = $derived(orderSlides(catalog, savedOrder));

	let presenting = $state(false);
	let index = $state(0);
	let slide = $derived(slides[index]);
	let last = $derived(slides.length - 1);
	let draggingId = $state<string | null>(null);
	let dropTargetId = $state<string | null>(null);
	let suppressClick = false;
	let adding = $state(false);
	let removingId = $state<string | null>(null);
	let editingId = $state<string | null>(null);
	let draft = $state('');
	let lastValid = $state<{ title: string; points: string[] } | null>(null);
	let draftError = $state('');
	let saveState = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	let saveTimer: ReturnType<typeof setTimeout> | undefined;
	let editingSlide = $derived(catalog.find((item) => item.id === editingId) ?? null);
	let draftPreview = $derived(lastValid);
	let saveLabel = $derived(
		draftError ? draftError
		: saveState === 'saving' ? 'Speichert…'
		: saveState === 'saved' ? 'Gespeichert'
		: saveState === 'error' ? 'Speichern fehlgeschlagen'
		: 'Erste Zeile ist der Titel. Jeder Satz beginnt mit „- “.'
	);

	function readIds(key: string) {
		try {
			const stored = JSON.parse(localStorage.getItem(key) ?? '[]');
			if (Array.isArray(stored)) return stored.filter((id) => typeof id === 'string');
		} catch { /* Keep the file order when storage is unreadable. */ }
		return [];
	}

	onMount(() => {
		savedOrder = readIds(orderStorageKey);
	});

	function persist(ids: string[]) {
		savedOrder = ids;
		try { localStorage.setItem(orderStorageKey, JSON.stringify(ids)); } catch { /* The order still applies for this view. */ }
	}

	async function remove(id: string) {
		if (removingId) return;
		suppressClick = true;
		removingId = id;
		try {
			const response = await fetch(`/api/admin/slides/${encodeURIComponent(id)}`, { method: 'DELETE' });
			if (!response.ok) return;
			catalog = catalog.filter((slide) => slide.id !== id);
			if (editingId === id) editingId = null;
			if (presenting && slides.length === 0) presenting = false;
		} finally {
			removingId = null;
			window.setTimeout(() => { suppressClick = false; }, 0);
		}
	}

	async function addSlide() {
		if (adding) return;
		adding = true;
		try {
			const response = await fetch('/api/admin/slides', { method: 'POST' });
			if (!response.ok) return;
			const created = await response.json() as Slide;
			catalog = [...catalog, { ...created, points: [...created.points] }];
			openEditor(created.id);
		} finally {
			adding = false;
		}
	}

	function openEditor(id: string) {
		if (suppressClick) return;
		const item = catalog.find((slide) => slide.id === id);
		if (!item) return;
		window.clearTimeout(saveTimer);
		editingId = id;
		draft = item.source;
		lastValid = { title: item.title, points: [...item.points] };
		draftError = '';
		saveState = 'idle';
	}

	function onDraftInput(event: Event) {
		draft = (event.currentTarget as HTMLTextAreaElement).value;
		if (!editingId) return;
		try {
			const parsed = parseEditorDocument(draft, editingId);
			lastValid = { title: parsed.title, points: [...parsed.points] };
			draftError = '';
			saveState = 'saving';
			window.clearTimeout(saveTimer);
			saveTimer = window.setTimeout(() => { void saveDraft(); }, 500);
		} catch (error) {
			window.clearTimeout(saveTimer);
			draftError = error instanceof Error ? error.message.replace(`${editingId}: `, '') : 'Der Text ist noch nicht gültig.';
			saveState = 'idle';
		}
	}

	async function saveDraft() {
		const id = editingId;
		const source = draft;
		if (!id) return false;
		let parsed: ReturnType<typeof parseEditorDocument>;
		try {
			parsed = parseEditorDocument(source, id);
		} catch {
			return false;
		}
		const response = await fetch(`/api/admin/slides/${encodeURIComponent(id)}`, {
			method: 'PUT',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ source })
		});
		if (!response.ok) {
			if (editingId === id && draft === source) saveState = 'error';
			return false;
		}
		if (editingId === id && draft !== source) return true;
		catalog = catalog.map((slide) => slide.id === id ? { ...slide, title: parsed.title, points: parsed.points, source } : slide);
		if (editingId === id) saveState = 'saved';
		return true;
	}

	async function back() {
		window.clearTimeout(saveTimer);
		if (!editingId) return;
		try {
			parseEditorDocument(draft, editingId);
		} catch (error) {
			draftError = error instanceof Error ? error.message.replace(`${editingId}: `, '') : 'Der Text ist noch nicht gültig.';
			return;
		}
		const saved = await saveDraft();
		if (saved) editingId = null;
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
		<div class="heading-title">
			{#if editingSlide}
				<button class="editor-back" type="button" onclick={back} aria-label="Zurück">
					<ArrowLeft size={20} aria-hidden="true" />
				</button>
			{/if}
			<h1>Slides</h1>
		</div>
		<button class="button-primary" type="button" onclick={() => start(0)} disabled={slides.length === 0}>Präsentation starten</button>
	</div>
	{#if editingSlide && draftPreview}
		<div class="editor">
			<textarea id="slide-source" aria-label="Folientext" value={draft} oninput={onDraftInput} spellcheck="true"></textarea>
			<div class="editor-slide" aria-label="Vorschau">
				<h2>{draftPreview.title}</h2>
				<ul>
					{#each draftPreview.points as point}
						<li>{point}</li>
					{/each}
				</ul>
			</div>
		</div>
		<p class="editor-status" class:invalid={draftError !== '' || saveState === 'error'}>{saveLabel}</p>
	{:else}
		<div class="slide-grid">
		{#each slides as item, itemIndex (item.id)}
			<div
				class="slide-card"
				role="group"
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
					onclick={() => openEditor(item.id)}
					aria-label={`${titleOf(item)} bearbeiten. Ziehen, um die Reihenfolge zu ändern.`}
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
					aria-label={`${titleOf(item)} löschen`}
					disabled={removingId === item.id}
					onclick={(event) => { event.stopPropagation(); void remove(item.id); }}
					ondragstart={(event) => { event.preventDefault(); event.stopPropagation(); }}
				>
					<X size={14} aria-hidden="true" />
				</button>
			</div>
		{/each}
			<button class="slide-add" type="button" onclick={addSlide} disabled={adding} aria-label="Folie hinzufügen">
				<Plus size={28} aria-hidden="true" />
			</button>
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
		grid-auto-rows: 1fr;
		gap: 16px;
	}
	.slide-card { position: relative; height: 100%; }
	.slide-add {
		width: 100%;
		height: 100%;
		min-height: 220px;
		display: grid;
		place-items: center;
		border: 1px dashed color-mix(in srgb, #151515 28%, transparent);
		border-radius: 18px;
		background: transparent;
		color: #151515;
		cursor: pointer;
	}
	.slide-add:hover { background: color-mix(in srgb, #151515 4%, transparent); }
	.slide-add:disabled { opacity: .45; cursor: wait; }
	.slide-open {
		position: relative;
		width: 100%;
		height: 100%;
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
	.slide-remove:disabled { cursor: wait; }
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
	.heading-title { display: flex; align-items: center; gap: 16px; }
	.editor-back {
		width: 36px;
		height: 36px;
		padding: 0;
		display: grid;
		place-items: center;
		border: 0;
		border-radius: 50%;
		background: transparent;
		color: #151515;
		cursor: pointer;
	}
	.editor-back:hover { background: color-mix(in srgb, #151515 8%, transparent); }
	.dashboard-page:has(.editor) {
		display: flex;
		flex-direction: column;
		height: calc(100dvh - 44px);
		padding-bottom: 24px;
		overflow: hidden;
	}
	.editor {
		display: grid;
		grid-template-columns: minmax(280px, 0.85fr) minmax(0, 1.15fr);
		grid-template-rows: minmax(0, 1fr);
		flex: 1;
		min-height: 0;
		gap: 20px;
		align-items: stretch;
	}
	.editor textarea {
		width: 100%;
		height: 100%;
		min-height: 0;
		overflow: auto;
		padding: 18px;
		border: 1px solid color-mix(in srgb, #151515 16%, transparent);
		border-radius: 18px;
		background: white;
		color: #151515;
		font: inherit;
		font-size: 16px;
		line-height: 1.45;
		resize: none;
	}
	.editor-status { margin: 10px 0 0; color: #6f6c66; font-size: 13px; }
	.editor-status.invalid { color: #9a2600; }
	.editor-slide {
		min-width: 0;
		height: 100%;
		min-height: 0;
		overflow: auto;
		padding: 28px 32px;
		border-radius: 18px;
		background: #f5f1e8;
		color: #151515;
	}
	.editor-slide h2 {
		margin: 0;
		font-size: clamp(36px, 4vw, 64px);
		line-height: 1.02;
		letter-spacing: -.045em;
	}
	.editor-slide ul { margin: 20px 0 0; padding: 0; list-style: none; }
	.editor-slide li {
		display: flex;
		gap: 12px;
		align-items: flex-start;
		margin-top: 18px;
		font-size: clamp(18px, 1.8vw, 26px);
		line-height: 1.35;
		letter-spacing: -.02em;
	}
	.editor-slide li::before {
		content: '';
		flex: 0 0 auto;
		width: 7px;
		height: 7px;
		margin-top: .5em;
		border-radius: 50%;
		background: #ff4f18;
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
		.slide-grid, .editor { grid-template-columns: 1fr; }
	}
	@media (hover: none) {
		.slide-remove { opacity: 1; pointer-events: auto; }
		.slide-number { right: 46px; opacity: 1; }
	}
</style>
