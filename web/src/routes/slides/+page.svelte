<script lang="ts">
	import { slides, type Slide } from '$lib/slides';

	let selected = $state<number | null>(null);
	let openSlide = $derived(selected === null ? null : slides[selected]);

	function open(index: number) {
		selected = index;
	}

	function close() {
		selected = null;
	}

	function onKey(event: KeyboardEvent) {
		if (event.key === 'Escape') close();
	}

	function titleOf(slide: Slide) {
		return slide.title;
	}
</script>

<svelte:head>
	<title>Slides — ALL IN AGI</title>
</svelte:head>

<svelte:window onkeydown={onKey} />

<div class="dashboard-page">
	<div class="dashboard-heading">
		<h1>Slides</h1>
	</div>
	<div class="slide-grid">
		{#each slides as slide, index}
			<button type="button" class="slide-card" onclick={() => open(index)} aria-label={titleOf(slide)}>
				<span class="slide-number">{index + 1}</span>
				{#if slide.kind === 'intro'}
					<p class="kicker">ALL IN AGI</p>
					<strong>{slide.title}</strong>
					<em>{slide.lede}</em>
				{:else}
					<p class="kicker">{slide.kicker}</p>
					<strong>{slide.title}</strong>
					<ul>
						{#each slide.points as point}
							<li><b>{point.label}</b><span>{point.text}</span></li>
						{/each}
					</ul>
				{/if}
			</button>
		{/each}
	</div>
</div>

{#if openSlide}
	<button class="slide-backdrop" type="button" aria-label="Schließen" onclick={close}></button>
	<div class="slide-open" role="dialog" aria-modal="true" aria-label={titleOf(openSlide)}>
		<button class="slide-close" type="button" onclick={close}>Schließen</button>
		{#if openSlide.kind === 'intro'}
			<p class="open-kicker">ALL IN AGI</p>
			<h2>{openSlide.title}</h2>
			<p class="open-lede">{openSlide.lede}</p>
		{:else}
			<p class="open-kicker">{openSlide.kicker}</p>
			<h2>{openSlide.title}</h2>
			<ul>
				{#each openSlide.points as point}
					<li><b>{point.label}</b><span>{point.text}</span></li>
				{/each}
			</ul>
		{/if}
	</div>
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
		aspect-ratio: 16 / 10;
		padding: 18px 16px 14px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		overflow: hidden;
		border: 1px solid color-mix(in srgb, #151515 10%, transparent);
		border-radius: 18px;
		background: #f5f1e8;
		color: #151515;
		text-align: left;
		cursor: pointer;
	}
	.slide-card:hover { transform: translateY(-1px); }
	.slide-number {
		position: absolute;
		top: 12px;
		right: 14px;
		color: #6f6c66;
		font-size: 12px;
		font-weight: 650;
		font-variant-numeric: tabular-nums;
	}
	.kicker {
		margin: 0;
		color: #ff4f18;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: .12em;
		text-transform: uppercase;
	}
	.slide-card strong {
		margin-top: 8px;
		font-size: 18px;
		line-height: 1.05;
		letter-spacing: -.03em;
	}
	.slide-card em {
		margin-top: 8px;
		font-style: normal;
		font-size: 12px;
		line-height: 1.3;
	}
	.slide-card ul {
		width: 100%;
		margin: 10px 0 0;
		padding: 0;
		list-style: none;
		border-top: 1px solid color-mix(in srgb, #151515 12%, transparent);
	}
	.slide-card li {
		display: grid;
		grid-template-columns: 72px minmax(0, 1fr);
		gap: 8px;
		padding: 5px 0;
		border-bottom: 1px solid color-mix(in srgb, #151515 12%, transparent);
		font-size: 10px;
		line-height: 1.25;
	}
	.slide-card li span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.slide-backdrop {
		position: fixed;
		inset: 0;
		z-index: 40;
		width: 100%;
		height: 100%;
		border: 0;
		border-radius: 0;
		background: color-mix(in srgb, #151515 45%, transparent);
		cursor: pointer;
	}
	.slide-open {
		position: fixed;
		z-index: 41;
		left: 50%;
		top: 50%;
		width: min(860px, calc(100vw - 32px));
		max-height: calc(100svh - 48px);
		overflow: auto;
		padding: 36px 40px 32px;
		transform: translate(-50%, -50%);
		border-radius: 24px;
		background: #f5f1e8;
		color: #151515;
	}
	.slide-close {
		position: absolute;
		top: 16px;
		right: 16px;
		min-height: 34px;
		padding: 6px 12px;
		border: 1px solid color-mix(in srgb, #151515 16%, transparent);
		border-radius: 999px;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: 13px;
		cursor: pointer;
	}
	.open-kicker {
		margin: 0;
		color: #ff4f18;
		font-size: 13px;
		font-weight: 700;
		letter-spacing: .12em;
		text-transform: uppercase;
	}
	.slide-open h2 {
		margin: 12px 0 0;
		max-width: 16ch;
		font-size: clamp(36px, 5vw, 60px);
		line-height: .96;
		letter-spacing: -.04em;
	}
	.open-lede { margin: 18px 0 0; font-size: 22px; }
	.slide-open ul {
		margin: 28px 0 0;
		padding: 0;
		list-style: none;
		border-top: 1px solid color-mix(in srgb, #151515 14%, transparent);
	}
	.slide-open li {
		display: grid;
		grid-template-columns: minmax(120px, 180px) minmax(0, 1fr);
		gap: 18px;
		padding: 14px 0;
		border-bottom: 1px solid color-mix(in srgb, #151515 14%, transparent);
		font-size: 16px;
		line-height: 1.35;
	}
	@media (max-width: 900px) {
		.slide-grid { grid-template-columns: 1fr 1fr; }
	}
	@media (max-width: 640px) {
		.slide-grid { grid-template-columns: 1fr; }
		.slide-open li { grid-template-columns: 1fr; gap: 4px; }
	}
</style>
