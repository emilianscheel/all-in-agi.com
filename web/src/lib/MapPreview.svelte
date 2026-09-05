<script lang="ts">
	import { onDestroy, onMount, type Snippet } from 'svelte';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import type { Map as MapLibreMap, MapStyleImageMissingEvent, Marker as MapLibreMarker } from 'maplibre-gl';

	let {
		latitude,
		longitude,
		children,
		locale = 'de',
		onlocationselect
	}: {
		latitude?: number;
		longitude?: number;
		children?: Snippet;
		locale?: 'de' | 'en';
		onlocationselect?: (coordinates: { latitude: number; longitude: number }) => void;
	} = $props();
	let shell: HTMLDivElement;
	let container: HTMLDivElement;
	let map: MapLibreMap | undefined;
	let marker: MapLibreMarker | undefined;
	let readyTimeout: ReturnType<typeof setTimeout> | undefined;
	let colorScheme: MediaQueryList | undefined;
	let desktopPointer: MediaQueryList | undefined;
	let resizeObserver: ResizeObserver | undefined;
	let status = $state<'loading' | 'ready' | 'error'>('loading');
	const mapStyle = (dark: boolean) => `https://tiles.openfreemap.org/styles/${dark ? 'dark' : 'positron'}`;

	function updateMapTheme(event: MediaQueryListEvent) {
		if (!map) return;
		map.setStyle(mapStyle(event.matches));
		map.once('styledata', () => requestAnimationFrame(() => { map?.resize(); updatePosition(); }));
	}

	function provideMissingStyleImage(event: MapStyleImageMissingEvent) {
		if (!map || map.hasImage(event.id)) return;
		map.addImage(event.id, { width: 1, height: 1, data: new Uint8Array([0, 0, 0, 0]) });
	}

	function selectMapLocation(event: { lngLat: { lat: number; lng: number } }) {
		if (!desktopPointer?.matches || !onlocationselect) return;
		onlocationselect({ latitude: event.lngLat.lat, longitude: event.lngLat.lng });
	}

	function cameraPadding() {
		if (!shell || !container) return { top: 0, right: 0, bottom: 0, left: 0 };
		const shellRect = shell.getBoundingClientRect();
		const searchRect = shell.querySelector<HTMLElement>('.map-search-control')?.getBoundingClientRect();
		const cardRect = shell.querySelector<HTMLElement>('.event-card')?.getBoundingClientRect();
		const gap = 16;
		const top = searchRect ? Math.max(0, searchRect.bottom - shellRect.top + gap) : 0;
		const visibleBottom = cardRect
			? Math.min(shell.clientHeight, Math.max(0, cardRect.top - shellRect.top - gap))
			: shell.clientHeight;
		const bottom = Math.max(0, container.clientHeight - visibleBottom);

		return { top, right: 0, bottom, left: 0 };
	}

	function centerPosition(duration = 0) {
		if (!map || status !== 'ready' || latitude === undefined || longitude === undefined) return;
		map.flyTo({
			center: [longitude, latitude],
			zoom: 14,
			padding: cameraPadding(),
			duration
		});
	}

	async function initialize() {
		try {
			const maplibregl = await import('maplibre-gl');
			const reveal = () => {
				if (readyTimeout) clearTimeout(readyTimeout);
				requestAnimationFrame(() => { map?.resize(); status = 'ready'; updatePosition(); });
			};
			colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
			desktopPointer = window.matchMedia('(min-width: 901px) and (pointer: fine)');
			colorScheme.addEventListener('change', updateMapTheme);
			map = new maplibregl.Map({
				container,
				style: mapStyle(colorScheme.matches),
				center: [10.4515, 51.1657],
				zoom: 5.2,
				attributionControl: false,
				maplibreLogo: false,
				pitchWithRotate: false,
				dragRotate: false,
				scrollZoom: true
			});
			map.on('styleimagemissing', provideMissingStyleImage);
			map.on('click', selectMapLocation);
			map.once('styledata', reveal);
			resizeObserver = new ResizeObserver(() => {
				map?.resize();
				centerPosition();
			});
			resizeObserver.observe(container);
			resizeObserver.observe(shell);
			const searchControl = shell.querySelector<HTMLElement>('.map-search-control');
			const eventCard = shell.querySelector<HTMLElement>('.event-card');
			if (searchControl) resizeObserver.observe(searchControl);
			if (eventCard) resizeObserver.observe(eventCard);
			readyTimeout = setTimeout(() => { if (status === 'loading') status = 'error'; }, 10_000);
		} catch { status = 'error'; }
	}

	async function updatePosition() {
		if (!map || status !== 'ready' || latitude === undefined || longitude === undefined) return;
		const maplibregl = await import('maplibre-gl');
		marker?.remove();
		marker = new maplibregl.Marker({ color: '#ff4f18' }).setLngLat([longitude, latitude]).addTo(map);
		centerPosition(850);
	}

	$effect(() => { latitude; longitude; updatePosition(); });
	onMount(initialize);
	onDestroy(() => { if (readyTimeout) clearTimeout(readyTimeout); resizeObserver?.disconnect(); colorScheme?.removeEventListener('change', updateMapTheme); map?.off('styleimagemissing', provideMissingStyleImage); map?.off('click', selectMapLocation); marker?.remove(); map?.remove(); });
</script>

<div bind:this={shell} class="map-shell" aria-label={locale === 'en' ? 'Event location preview' : 'Vorschau des Veranstaltungsorts'}>
	<div class="map-canvas" bind:this={container}></div>
	{#if status !== 'ready'}
		<div class="map-status"><span class="map-status-icon">⌖</span>{status === 'loading' ? (locale === 'en' ? 'Loading map preview…' : 'Kartenvorschau wird geladen …') : (locale === 'en' ? 'The map preview is currently unavailable' : 'Kartenvorschau ist gerade nicht verfügbar')}</div>
	{/if}
	{@render children?.()}
</div>
