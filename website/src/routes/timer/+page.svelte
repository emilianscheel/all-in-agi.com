<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { Square } from 'lucide-svelte';
	import TimerPresentation from '$lib/TimerPresentation.svelte';
	import { berlinInputsFromIso } from '$lib/event-time';
	import { formatRemainingTime, resolveBerlinTargetTime } from '$lib/timer';

	const targetStorageKey = 'all-in-agi.timer.target';
	let now = $state(Date.now());
	let target = $state('');
	let targetTime = $state('');
	let editing = $state(true);
	let input: HTMLInputElement | undefined;
	let remaining = $derived(target ? formatRemainingTime(target, now) : null);

	async function editTarget() {
		if (target) targetTime = berlinInputsFromIso(target).time;
		editing = true;
		await tick();
		input?.focus();
	}

	async function stopTimer() {
		target = '';
		targetTime = '';
		editing = true;
		try { localStorage.removeItem(targetStorageKey); } catch { /* The editor still resets without persistence. */ }
		await tick();
		input?.focus();
	}

	function startTimer() {
		const resolved = resolveBerlinTargetTime(targetTime, new Date(now));
		if (!resolved) return;
		target = resolved;
		editing = false;
		try { localStorage.setItem(targetStorageKey, resolved); } catch { /* The timer still works without persistence. */ }
	}

	onMount(() => {
		try {
			const stored = localStorage.getItem(targetStorageKey) ?? '';
			if (stored && !Number.isNaN(new Date(stored).getTime())) {
				target = stored;
				targetTime = berlinInputsFromIso(stored).time;
				editing = false;
			}
		} catch { /* Start with the editor when storage is unavailable. */ }
		if (editing) tick().then(() => input?.focus());
		const interval = window.setInterval(() => (now = Date.now()), 1000);
		return () => window.clearInterval(interval);
	});
</script>

<svelte:head><title>Timer — ALL IN AGI</title></svelte:head>

<TimerPresentation
	display={editing ? '' : remaining?.display ?? '00:00 h'}
	label={editing ? '' : remaining?.completed ? 'Timer beendet' : `Bis ${targetTime} Uhr`}
	onescape={editTarget}
>
	{#snippet controls()}
		{#if !editing}
			<button class="stop-button" type="button" aria-label="Timer stoppen" title="Timer stoppen" onclick={stopTimer}>
				<Square size={22} strokeWidth={2.4} aria-hidden="true" />
			</button>
		{/if}
	{/snippet}
	<div class="timer-editor">
		<label for="timer-target">Zielzeit</label>
		<input
			bind:this={input}
			id="timer-target"
			type="time"
			value={targetTime}
			oninput={(event) => (targetTime = event.currentTarget.value)}
		/>
		<button type="button" disabled={!targetTime} onclick={startTimer}>Timer starten</button>
	</div>
</TimerPresentation>

<style>
	.timer-editor { width: min(360px, calc(100vw - 40px)); text-align: left; }
	.timer-editor label { display: block; margin: 0 0 10px; font-size: 14px; font-weight: 650; letter-spacing: .02em; }
	.timer-editor input {
		width: 100%;
		min-height: 76px;
		padding: 14px 20px;
		border: 1px solid currentColor;
		border-radius: 18px;
		background: transparent;
		color: inherit;
		font-size: 34px;
		font-weight: 650;
		font-variant-numeric: tabular-nums;
		outline: none;
		color-scheme: light;
	}
	.timer-editor input:focus { outline: 3px solid color-mix(in srgb, currentColor 35%, transparent); outline-offset: 3px; }
	.timer-editor button {
		width: 100%;
		min-height: 52px;
		margin-top: 14px;
		padding: 12px 20px;
		border: 1px solid var(--timer-ink, #ff4f18);
		border-radius: 999px;
		background: var(--timer-ink, #ff4f18);
		color: var(--timer-bg, #fff);
		font-size: 17px;
		font-weight: 650;
		transition: opacity .2s ease, transform .2s ease;
	}
	.timer-editor button:hover:not(:disabled) { transform: translateY(-1px); }
	.timer-editor button:disabled { opacity: .35; cursor: not-allowed; }
	.stop-button {
		width: 48px;
		height: 48px;
		padding: 0;
		display: grid;
		place-items: center;
		border: 0;
		border-radius: 50%;
		background: color-mix(in srgb, var(--timer-bg, #fff) 86%, transparent);
		color: var(--timer-ink, #ff4f18);
		backdrop-filter: blur(16px);
		transition: background-color .2s ease;
	}
	.stop-button:hover { background: var(--timer-bg, #fff); }
</style>
