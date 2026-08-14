<script lang="ts">
	import { animate, type AnimationPlaybackControls } from 'motion';
	import { onDestroy, onMount } from 'svelte';

	let {
		value,
		active = true,
		className = ''
	}: {
		value: string;
		active?: boolean;
		className?: string;
	} = $props();

	let textNode: HTMLSpanElement;
	let strikeNode: HTMLSpanElement;
	let displayedValue = $state('');
	let announcedValue = $state('');
	let mounted = $state(false);
	let currentValue = '';
	let wasActive = false;
	let sequence = 0;
	let desiredValue = '';
	let controls: AnimationPlaybackControls[] = [];
	let reducedMotion: MediaQueryList | undefined;

	function stopAnimations() {
		for (const control of controls) control.stop();
		controls = [];
	}

	function resetVisuals() {
		if (textNode) {
			textNode.style.opacity = '1';
			textNode.style.color = '';
		}
		if (strikeNode) {
			strikeNode.style.transform = 'scaleX(0)';
			strikeNode.style.backgroundColor = '';
			strikeNode.style.opacity = '1';
		}
	}

	function completeImmediately() {
		sequence += 1;
		stopAnimations();
		resetVisuals();
		displayedValue = desiredValue;
		announcedValue = desiredValue;
		currentValue = desiredValue;
	}

	async function typeValue(nextValue: string, token: number) {
		const characters = Array.from(nextValue);
		displayedValue = '';
		resetVisuals();
		if (!characters.length) {
			announcedValue = nextValue;
			currentValue = nextValue;
			return;
		}
		const typing = animate(0, characters.length, {
			duration: Math.min(0.75, Math.max(0.28, characters.length * 0.035)),
			ease: 'linear',
			onUpdate: (latest) => {
				if (token !== sequence) return;
				displayedValue = characters.slice(0, Math.ceil(latest)).join('');
			}
		});
		controls = [typing];
		await typing.finished;
		if (token !== sequence) return;
		displayedValue = nextValue;
		announcedValue = nextValue;
		currentValue = nextValue;
		controls = [];
	}

	async function replaceValue(nextValue: string, typeOnly: boolean) {
		sequence += 1;
		const token = sequence;
		stopAnimations();
		resetVisuals();

		if (reducedMotion?.matches) {
			displayedValue = nextValue;
			announcedValue = nextValue;
			currentValue = nextValue;
			return;
		}
		if (typeOnly) {
			await typeValue(nextValue, token);
			return;
		}

		const currentColor = getComputedStyle(textNode).color;
		const mutedColor = getComputedStyle(document.documentElement).getPropertyValue('--replacement-muted').trim();
		const strike = animate(
			strikeNode,
			{ scaleX: [0, 1], backgroundColor: [currentColor, mutedColor] },
			{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }
		);
		const fade = animate(
			textNode,
			{ color: [currentColor, mutedColor] },
			{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }
		);
		controls = [strike, fade];
		await Promise.all([strike.finished, fade.finished]);
		if (token !== sequence) return;
		await typeValue(nextValue, token);
	}

	$effect(() => {
		const nextValue = value;
		const nextActive = active;
		desiredValue = nextValue;
		if (!mounted) {
			displayedValue = nextValue;
			announcedValue = nextValue;
			currentValue = nextValue;
			wasActive = nextActive;
			return;
		}
		if (!nextActive) {
			completeImmediately();
			wasActive = false;
			return;
		}
		if (nextValue !== currentValue || !wasActive) void replaceValue(nextValue, !wasActive);
		wasActive = true;
	});

	onMount(() => {
		mounted = true;
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
		reducedMotion.addEventListener('change', completeImmediately);
	});

	onDestroy(() => {
		sequence += 1;
		stopAnimations();
		reducedMotion?.removeEventListener('change', completeImmediately);
	});
</script>

<span class="animated-value {className}">
	<span class="animated-value-visual" aria-hidden="true">
		<span class="animated-value-text" bind:this={textNode}>{displayedValue}</span>
		<span class="animated-value-strike" bind:this={strikeNode}></span>
	</span>
	<span class="visually-hidden" aria-live="polite" aria-atomic="true">{announcedValue}</span>
</span>
