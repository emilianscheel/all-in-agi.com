<script lang="ts">
	import { onMount } from 'svelte';
	import TimerPresentation from '$lib/TimerPresentation.svelte';
	import { formatBerlinClock } from '$lib/timer';

	let now = $state(Date.now());
	onMount(() => {
		const interval = window.setInterval(() => (now = Date.now()), 1000);
		return () => window.clearInterval(interval);
	});
</script>

<svelte:head><title>Clock — ALL IN AGI</title></svelte:head>

<TimerPresentation display={formatBerlinClock(now)} />
