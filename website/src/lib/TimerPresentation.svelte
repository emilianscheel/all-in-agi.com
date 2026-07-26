<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { formatBerlinTimelineTime, type TimerMilestone } from '$lib/timer';

	let {
		display = '',
		label = '',
		timeline = [],
		progress = 0,
		now = Date.now(),
		onescape,
		controls,
		children
	}: {
		display?: string;
		label?: string;
		timeline?: TimerMilestone[];
		progress?: number;
		now?: number;
		onescape?: () => void;
		controls?: Snippet;
		children?: Snippet;
	} = $props();

	const themeStorageKey = 'all-in-agi.timer.theme';
	const themes = ['light', 'orange', 'black'] as const;
	let theme = $state<(typeof themes)[number]>('light');
	let nextMilestoneId = $derived(timeline.find((milestone) => new Date(milestone.at).getTime() > now)?.id);

	function cycleTheme() {
		const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
		theme = themes[nextIndex];
		try { localStorage.setItem(themeStorageKey, theme); } catch { /* Storage can be unavailable in private contexts. */ }
	}

	onMount(() => {
		try {
			const stored = localStorage.getItem(themeStorageKey);
			if (themes.includes(stored as (typeof themes)[number])) theme = stored as (typeof themes)[number];
		} catch { /* Use the default theme when storage is unavailable. */ }
		function handleKeydown(event: KeyboardEvent) {
			if (event.key === 'Enter' && !event.repeat) {
				event.preventDefault();
				cycleTheme();
			} else if (event.key === 'Escape' && onescape) {
				event.preventDefault();
				onescape();
			}
		}
		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});
</script>

<section class={`timer-presentation theme-${theme}`} class:with-timeline={timeline.length > 0} aria-label="Timer">
	<p class="keyboard-hint">Enter wechselt das Farbschema{onescape ? ', Escape bearbeitet die Zielzeit' : ''}.</p>
	{#if controls}<div class="timer-controls">{@render controls()}</div>{/if}
	<div class="timer-center">
		{#if display}
			<div class="timer-value" class:long-display={display.includes('Tag')} aria-live="polite" aria-atomic="true">{display}</div>
			{#if label}<p class="timer-label">{label}</p>{/if}
		{:else if children}
			{@render children()}
		{/if}
	</div>

	{#if timeline.length}
		<div class="timeline-wrap" aria-label="Tagesablauf">
			<div class="timeline-scroll">
				<div class="timeline" style={`--timeline-progress: ${Math.max(0, Math.min(1, progress)) * 100}%; --event-count: ${timeline.length}; --edge-space: ${50 / timeline.length}%`}>
					<div class="timeline-line" aria-hidden="true"><span></span></div>
					{#each timeline as milestone}
						{@const milestoneTime = new Date(milestone.at).getTime()}
						<div
							class="timeline-event"
							class:completed={milestoneTime <= now}
							class:current={milestone.id === nextMilestoneId}
						>
							<span class="timeline-dot" aria-hidden="true"></span>
							<time datetime={milestone.at}>{formatBerlinTimelineTime(milestone.at)}</time>
							<strong>{milestone.label}</strong>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</section>

<style>
	.timer-presentation {
		--timer-bg: #fff;
		--timer-ink: #ff4f18;
		--timer-soft: color-mix(in srgb, var(--timer-ink) 28%, transparent);
		position: relative;
		width: 100%;
		min-height: 100svh;
		overflow: hidden;
		background: var(--timer-bg);
		color: var(--timer-ink);
		transition: background-color .22s ease, color .22s ease;
	}
	.theme-orange { --timer-bg: #ff4f18; --timer-ink: #fff; }
	.theme-black { --timer-bg: #000; --timer-ink: #ff5f2d; }
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
	.timer-controls { position: absolute; z-index: 2; top: max(20px, env(safe-area-inset-top)); right: 20px; }
	.timer-center {
		min-height: 100svh;
		padding: 8vh 4vw;
		display: grid;
		place-content: center;
		justify-items: center;
		text-align: center;
	}
	.with-timeline .timer-center { padding-bottom: clamp(190px, 24vh, 270px); }
	.timer-value {
		font-size: clamp(74px, 15vw, 250px);
		font-weight: 700;
		line-height: .86;
		letter-spacing: -.075em;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}
	.timer-value.long-display { font-size: clamp(50px, 9vw, 150px); }
	.timer-label {
		margin: clamp(24px, 4vh, 44px) 0 0;
		font-size: clamp(18px, 2.3vw, 34px);
		font-weight: 650;
		letter-spacing: -.025em;
	}
	.timeline-wrap {
		position: absolute;
		left: 0;
		right: 0;
		bottom: max(28px, env(safe-area-inset-bottom));
		padding: 0 clamp(24px, 4vw, 72px);
	}
	.timeline-scroll { overflow-x: auto; padding: 8px 2px; scrollbar-width: none; }
	.timeline-scroll::-webkit-scrollbar { display: none; }
	.timeline {
		position: relative;
		min-width: 720px;
		display: grid;
		grid-template-columns: repeat(var(--event-count, 5), minmax(110px, 1fr));
	}
	.timeline-line {
		position: absolute;
		left: var(--edge-space);
		right: var(--edge-space);
		top: 8px;
		height: 3px;
		background: var(--timer-soft);
	}
	.timeline-line span { display: block; width: var(--timeline-progress); height: 100%; background: currentColor; transition: width .4s ease; }
	.timeline-event { position: relative; min-width: 0; padding: 31px 10px 0; text-align: center; opacity: .48; }
	.timeline-event.completed, .timeline-event.current { opacity: 1; }
	.timeline-dot {
		position: absolute;
		top: 0;
		left: 50%;
		width: 19px;
		height: 19px;
		border: 3px solid currentColor;
		border-radius: 50%;
		background: var(--timer-bg);
		transform: translateX(-50%);
		transition: background-color .22s ease, transform .22s ease;
	}
	.timeline-event.completed .timeline-dot { background: currentColor; }
	.timeline-event.current .timeline-dot { transform: translateX(-50%) scale(1.25); }
	.timeline-event time { display: block; font-size: 14px; font-variant-numeric: tabular-nums; }
	.timeline-event strong { display: block; margin-top: 7px; overflow-wrap: anywhere; font-size: clamp(13px, 1.3vw, 18px); line-height: 1.2; }
	@media (max-width: 700px) {
		.timer-value { font-size: clamp(58px, 19vw, 112px); }
		.timer-value.long-display { font-size: clamp(36px, 9vw, 64px); }
		.with-timeline .timer-center { padding-bottom: 180px; }
		.timeline-wrap { bottom: max(16px, env(safe-area-inset-bottom)); padding: 0 14px; }
		.timeline { min-width: 620px; }
	}
	@media (prefers-reduced-motion: reduce) {
		.timer-presentation, .timeline-line span, .timeline-dot { transition: none; }
	}
</style>
