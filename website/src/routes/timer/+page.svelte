<script lang="ts">
	import { onMount, tick } from 'svelte';
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

	function chooseTarget(value: string) {
		targetTime = value;
		const resolved = resolveBerlinTargetTime(value, new Date(now));
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

<svelte:head><title>Timer — ALL-IN-AGI</title></svelte:head>

<TimerPresentation
	display={editing ? '' : remaining?.display ?? '00:00 h'}
	label={editing ? '' : remaining?.completed ? 'Timer beendet' : `Bis ${targetTime} Uhr`}
	onescape={editTarget}
>
	<div class="timer-editor">
		<label for="timer-target">Zielzeit</label>
		<input
			bind:this={input}
			id="timer-target"
			type="time"
			value={targetTime}
			oninput={(event) => chooseTarget(event.currentTarget.value)}
		/>
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
</style>
