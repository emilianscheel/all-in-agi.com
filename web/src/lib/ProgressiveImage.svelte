<script lang="ts">
	import { onMount } from 'svelte';

	type LoadingMode = 'eager' | 'lazy';

	type Props = {
		src: string;
		placeholderSrc: string;
		alt: string;
		width: number;
		height: number;
		loading?: LoadingMode;
		class?: string;
	};

	let {
		src,
		placeholderSrc,
		alt,
		width,
		height,
		loading = 'lazy',
		class: className = ''
	}: Props = $props();

	let imageElement: HTMLImageElement | undefined;
	let enhanced = $state(false);
	let loadedSrc = $state<string | null>(null);
	let loaded = $derived(loadedSrc === src);

	async function revealImage() {
		const element = imageElement;
		if (!element?.complete || element.naturalWidth === 0) return;

		const expectedCurrentSrc = element.currentSrc;
		const expectedSrc = src;
		try {
			await element.decode();
		} catch {
			// A completed image can still be displayed when decode() is unavailable or interrupted.
		}

		if (
			element === imageElement &&
			element.currentSrc === expectedCurrentSrc &&
			src === expectedSrc
		) {
			loadedSrc = expectedSrc;
		}
	}

	onMount(() => {
		if (imageElement?.complete && imageElement.naturalWidth > 0) loadedSrc = src;
		enhanced = true;
		if (!loaded) void revealImage();
	});
</script>

<div
	class={`progressive-image ${className}`}
	class:is-enhanced={enhanced}
	class:is-loaded={loaded}
	style:aspect-ratio={`${width} / ${height}`}
>
	<img
		class="progressive-image__placeholder"
		src={placeholderSrc}
		alt=""
		width={width}
		height={height}
		decoding="async"
		aria-hidden="true"
	/>
	<img
		bind:this={imageElement}
		class="progressive-image__full"
		{src}
		{alt}
		{width}
		{height}
		{loading}
		decoding="async"
		onload={revealImage}
	/>
</div>

<style>
	.progressive-image {
		position: relative;
		display: block;
		overflow: hidden;
		isolation: isolate;
		background: var(--surface);
	}

	.progressive-image :global(img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
	}

	.progressive-image__placeholder,
	.progressive-image__full {
		position: absolute;
		inset: 0;
	}

	.progressive-image__placeholder {
		z-index: 1;
		filter: blur(16px);
		transform: scale(1.08);
		transition: opacity .42s ease;
	}

	.progressive-image__full {
		z-index: 2;
		opacity: 1;
		filter: none;
		transform: scale(1);
	}

	.is-enhanced:not(.is-loaded) .progressive-image__full {
		opacity: 0;
		filter: blur(8px);
		transform: scale(1.012);
	}

	.is-enhanced .progressive-image__full {
		transition: opacity .38s ease, filter .42s ease, transform .42s ease;
	}

	.is-loaded .progressive-image__placeholder {
		opacity: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.progressive-image__placeholder,
		.is-enhanced .progressive-image__full {
			transition: none;
		}
	}
</style>
