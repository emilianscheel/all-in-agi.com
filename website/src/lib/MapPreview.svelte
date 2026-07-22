<script lang="ts">
	import { onDestroy, onMount, type Snippet } from 'svelte';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';

	let { latitude, longitude, children }: { latitude?: number; longitude?: number; children?: Snippet } = $props();
	let container: HTMLDivElement;
	let map: MapLibreMap | undefined;
	let marker: MapLibreMarker | undefined;
	let readyTimeout: ReturnType<typeof setTimeout> | undefined;
	let status = $state<'loading' | 'ready' | 'error'>('loading');

	async function initialize() {
		try {
			const maplibregl = await import('maplibre-gl');
			const reveal = () => {
				if (readyTimeout) clearTimeout(readyTimeout);
				requestAnimationFrame(() => { map?.resize(); status = 'ready'; updatePosition(); });
			};
			map = new maplibregl.Map({ container, style: 'https://tiles.openfreemap.org/styles/positron', center: [10.4515, 51.1657], zoom: 5.2, attributionControl: false, maplibreLogo: false, pitchWithRotate: false, dragRotate: false });
			map.once('styledata', reveal);
			readyTimeout = setTimeout(() => { if (status === 'loading') status = 'error'; }, 10_000);
		} catch { status = 'error'; }
	}

	async function updatePosition() {
		if (!map || status !== 'ready' || latitude === undefined || longitude === undefined) return;
		const maplibregl = await import('maplibre-gl');
		marker?.remove();
		marker = new maplibregl.Marker({ color: '#ff4f18' }).setLngLat([longitude, latitude]).addTo(map);
		map.flyTo({ center: [longitude, latitude], zoom: 14, duration: 850 });
	}

	$effect(() => { latitude; longitude; updatePosition(); });
	onMount(initialize);
	onDestroy(() => { if (readyTimeout) clearTimeout(readyTimeout); marker?.remove(); map?.remove(); });
</script>

<div class="map-shell" aria-label="Vorschau des Veranstaltungsorts">
	<div class="map-canvas" bind:this={container}></div>
	{#if status !== 'ready'}
		<div class="map-status"><span class="map-status-icon">⌖</span>{status === 'loading' ? 'Kartenvorschau wird geladen …' : 'Kartenvorschau ist gerade nicht verfügbar'}</div>
	{/if}
	{@render children?.()}
</div>
