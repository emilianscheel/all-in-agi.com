<script lang="ts">
	import { onMount } from 'svelte';
	import TimerPresentation from '$lib/TimerPresentation.svelte';
	import { deriveHackathonMilestones, formatRemainingTime, hackathonCountdownState } from '$lib/timer';

	let { data } = $props();
	let now = $state(Date.now());
	let milestones = $derived(deriveHackathonMilestones(data.hackathon));
	let timerState = $derived(hackathonCountdownState(milestones, now));
	let remaining = $derived(timerState.completed ? formatRemainingTime(now, now) : formatRemainingTime(timerState.target, now));

	onMount(() => {
		const interval = window.setInterval(() => (now = Date.now()), 1000);
		return () => window.clearInterval(interval);
	});
</script>

<svelte:head><title>Hackathon Timer {data.hackathon.id} — ALL IN AGI</title></svelte:head>

<TimerPresentation
	display={remaining.display}
	label={timerState.label}
	timeline={milestones}
	progress={timerState.progress}
	{now}
/>
