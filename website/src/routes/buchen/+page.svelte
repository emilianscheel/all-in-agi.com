<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { onDestroy, onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
	import { CAPACITY_PRICES, formatDate, formatPrice, getPrice, validateConfiguration, type BookingConfiguration, type Capacity, type Equipment, type EventAddress } from '$lib/booking';
	import { photonFeatureLabel, normalizePhotonAddress, type PhotonFeature } from '$lib/photon';
	import { eventDateBounds } from '$lib/event-date';
	import EventDateCalendar from '$lib/EventDateCalendar.svelte';
	import PrepCallTimePicker from '$lib/PrepCallTimePicker.svelte';
	import { availablePrepCallDates, normalizeAvailabilitySlots, prepCallDateBounds, prepCallSlotsForDate } from '$lib/prep-call';
	import { reveal } from '$lib/motion';

	let capacity = $state<Capacity>(15);
	let venueProvided = $state(true);
	let equipment = $state<Equipment>('projector');
	let companyName = $state('');
	let contactName = $state('');
	let email = $state('');
	let phone = $state('');
	let preferredEventDate = $state('');
	let consultationSlot = $state('');
	let consultationMode = $state<'quick' | 'custom'>('quick');
	let customConsultationDate = $state('');
	let address = $state<EventAddress>({ label: '', street: '', postalCode: '', city: '', country: 'Deutschland' });
	let addressQuery = $state('');
	let suggestions = $state<Array<{ label: string; feature: PhotonFeature }>>([]);
	let searchStatus = $state<'idle' | 'loading' | 'empty' | 'error'>('idle');
	let mapStatus = $state<'loading' | 'ready' | 'error'>('loading');
	let mapContainer: HTMLDivElement;
	let map: MapLibreMap | undefined;
	let mapMarker: MapLibreMarker | undefined;
	let addressAbort: AbortController | undefined;
	let addressDebounce: ReturnType<typeof setTimeout> | undefined;
	let mapReadyTimeout: ReturnType<typeof setTimeout> | undefined;
	let slots = $state<string[]>([]);
	let slotsLoading = $state(true);
	let demoMode = $state(false);
	let submitting = $state(false);
	let errors = $state<string[]>([]);

	let price = $derived(getPrice(capacity, venueProvided));
	let eventAddressLabel = $derived([address.street, [address.postalCode, address.city].filter(Boolean).join(' ')].filter(Boolean).join(', '));
	let equipmentLabel = $derived(equipment === 'projector' ? 'Projector' : equipment === 'tv' ? 'Display' : 'Provided by us');
	let prepCallDates = $derived(availablePrepCallDates(slots));
	let customConsultationSlots = $derived(prepCallSlotsForDate(slots, customConsultationDate));

	const { min: minEventDate, max: maxEventDate } = eventDateBounds();
	const { min: minPrepCallDate, max: maxPrepCallDate } = prepCallDateBounds();

	async function loadAvailability() {
		slotsLoading = true;
		try {
			const start = new Date().toISOString().slice(0, 10);
			const endDate = new Date();
			endDate.setDate(endDate.getDate() + 45);
			const response = await fetch(`/api/availability?start=${start}&end=${endDate.toISOString().slice(0, 10)}&tz=Europe/Berlin`);
			const result = await response.json();
			if (!response.ok) throw new Error(result.message ?? 'Verfügbarkeit konnte nicht geladen werden.');
			slots = normalizeAvailabilitySlots(Array.isArray(result.slots) ? result.slots : []);
			if (consultationSlot && !slots.includes(consultationSlot)) consultationSlot = '';
			if (customConsultationDate && !availablePrepCallDates(slots).includes(customConsultationDate)) customConsultationDate = '';
			demoMode = Boolean(result.demo);
		} catch (error) {
			slots = [];
			errors = [error instanceof Error ? error.message : 'Verfügbarkeit konnte nicht geladen werden.'];
		} finally {
			slotsLoading = false;
		}
	}

	async function initializeMap() {
		try {
			const maplibregl = await import('maplibre-gl');
			const revealMap = () => {
				if (mapStatus !== 'loading') return;
				if (mapReadyTimeout) clearTimeout(mapReadyTimeout);
				requestAnimationFrame(() => {
					map?.resize();
					mapStatus = 'ready';
				});
			};
			map = new maplibregl.Map({
				container: mapContainer,
				style: 'https://tiles.openfreemap.org/styles/positron',
				center: [10.4515, 51.1657],
				zoom: 5.2,
				attributionControl: false,
				maplibreLogo: false,
				pitchWithRotate: false,
				dragRotate: false
			});
			map.once('styledata', revealMap);
			mapReadyTimeout = setTimeout(() => {
				if (mapStatus === 'loading') mapStatus = 'error';
			}, 10000);
		} catch { mapStatus = 'error'; }
	}

	function selectQuickSlot(slot: string) {
		consultationMode = 'quick';
		customConsultationDate = '';
		consultationSlot = slot;
	}

	function selectCustomMode() {
		if (consultationMode === 'custom') return;
		consultationMode = 'custom';
		consultationSlot = '';
	}

	function selectCustomDate(date: string) {
		customConsultationDate = date;
		consultationSlot = '';
	}

	function updateSuggestions() {
		if (addressDebounce) clearTimeout(addressDebounce);
		addressAbort?.abort();
		const query = addressQuery.trim();
		if (query.length < 3) {
			suggestions = [];
			searchStatus = 'idle';
			return;
		}
		addressDebounce = setTimeout(() => searchAddress(query), 250);
	}

	async function searchAddress(query: string) {
		addressAbort?.abort();
		addressAbort = new AbortController();
		searchStatus = 'loading';
		try {
			const params = new URLSearchParams({
				q: query,
				countrycode: 'DE',
				lang: 'de',
				limit: '5'
			});
			const response = await fetch(`https://photon.komoot.io/api?${params}`, { signal: addressAbort.signal });
			if (!response.ok) throw new Error('Adresssuche nicht verfügbar');
			const result = await response.json() as { features?: PhotonFeature[] };
			suggestions = (result.features ?? []).map((feature) => ({ label: photonFeatureLabel(feature), feature })).filter((suggestion) => suggestion.label);
			searchStatus = suggestions.length ? 'idle' : 'empty';
		} catch (error) {
			if ((error as Error).name !== 'AbortError') {
				suggestions = [];
				searchStatus = 'error';
			}
		}
	}

	function selectSuggestion(suggestion: { label: string; feature: PhotonFeature }) {
		addressQuery = suggestion.label;
		suggestions = [];
		searchStatus = 'idle';
		address = normalizePhotonAddress(suggestion.feature);
		if (!map || address.longitude === undefined || address.latitude === undefined) return;
		import('maplibre-gl').then((maplibregl) => {
			mapMarker?.remove();
			mapMarker = new maplibregl.Marker({ color: '#ff4f18' }).setLngLat([address.longitude!, address.latitude!]).addTo(map!);
			map?.flyTo({ center: [address.longitude!, address.latitude!], zoom: 14, duration: 850 });
		});
	}

	function buildConfiguration(): BookingConfiguration {
		return { capacity, venueProvided, equipment, companyName, contactName, email, phone, address, preferredEventDate, consultationSlot };
	}

	async function submitBooking() {
		const config = buildConfiguration();
		errors = validateConfiguration(config);
		if (errors.length) return;
		submitting = true;
		try {
			const response = await fetch('/api/book', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(config) });
			const result = await response.json();
			if (!response.ok) {
				if (response.status === 409) { consultationSlot = ''; customConsultationDate = ''; consultationMode = 'quick'; await loadAvailability(); }
				throw new Error(result.message ?? 'Die Buchung konnte nicht abgeschlossen werden.');
			}
			if (browser) sessionStorage.setItem('werksprung-booking', JSON.stringify({ ...config, ...price, booking: result }));
			await goto('/buchen/erfolg');
		} catch (error) { errors = [error instanceof Error ? error.message : 'Die Buchung konnte nicht abgeschlossen werden.']; }
		finally { submitting = false; }
	}

	onMount(() => { loadAvailability(); initializeMap(); });
	onDestroy(() => {
		if (addressDebounce) clearTimeout(addressDebounce);
		if (mapReadyTimeout) clearTimeout(mapReadyTimeout);
		addressAbort?.abort();
		mapMarker?.remove();
		map?.remove();
	});
</script>

<svelte:head><title>Hackathon planen — Agentic Engineering Hackathon</title><meta name="description" content="Planen Sie Teamgröße, Location und Wunschtermin für Ihren Agentic Engineering Hackathon." /></svelte:head>

<div class="config-page">
	<header class="config-intro">
		<div use:reveal><h1>Hackathon planen</h1></div>
		<div class="price-pill">Ab 3.000 € netto · Anreise inklusive</div>
	</header>

	<div class="config-layout">
		<div class="preview-column">
			<div class="map-shell" aria-label="Vorschau des Veranstaltungsorts">
				<div class="map-canvas" bind:this={mapContainer}></div>
				{#if mapStatus !== 'ready'}
					<div class="map-status">
						<span class="map-status-icon">⌖</span>
						{mapStatus === 'loading' ? 'Kartenvorschau wird geladen …' : 'Kartenvorschau ist gerade nicht verfügbar'}
					</div>
				{/if}
				<article class="event-card" aria-live="polite">
					<div class="event-card-top">{#if companyName.trim()}<h2>{companyName}</h2>{/if}<div class="event-card-price">{formatPrice(price.totalPrice)}</div></div>
					{#if eventAddressLabel}<p class="event-address">{eventAddressLabel}</p>{/if}
					<div class="event-details">
						{#if preferredEventDate}<div class="event-detail"><small>Event Date</small><b>{formatDate(preferredEventDate)}</b></div>{/if}
						<div class="event-detail"><small>Team</small><b>Bis {capacity} Personen</b></div>
						<div class="event-detail"><small>Location</small><b>{venueProvided ? 'Eigener Raum' : 'Von uns organisiert'}</b></div>
						<div class="event-detail"><small>Screen</small><b>{equipmentLabel}</b></div>
					</div>
				</article>
			</div>
		</div>

		<form class="config-form" onsubmit={(event) => { event.preventDefault(); submitBooking(); }} novalidate>
			<section class="config-section" use:reveal>
				<h2>Team size</h2>
				<div class="option-grid three">
					{#each [15, 30, 50] as size}<label class:selected={capacity === size} class="choice"><input type="radio" name="capacity" value={size} checked={capacity === size} onchange={() => (capacity = size as Capacity)} /><b>{size} Personen</b><small>{size === 15 ? 'Kompaktes Team' : size === 30 ? 'Mehrere Build-Teams' : 'Großer Demo Day'}</small><span class="choice-price">{formatPrice(CAPACITY_PRICES[size as Capacity])}</span></label>{/each}
				</div>
			</section>

			<section class="config-section" use:reveal><h2>Location</h2><div class="option-grid">
				<label class:selected={venueProvided} class="choice"><input type="radio" name="venue" checked={venueProvided} onchange={() => (venueProvided = true)} /><b>Eigener Conference Room</b><small>Platz für Teams, stabiles WLAN, großer Screen.</small><span class="choice-price">Inklusive</span></label>
				<label class:selected={!venueProvided} class="choice"><input type="radio" name="venue" checked={!venueProvided} onchange={() => (venueProvided = false)} /><b>Location organisieren lassen</b><small>Passender Raum nahe Ihrer Wunschadresse.</small><span class="choice-price">+ 1.000 €</span></label>
			</div></section>

			<section class="config-section" use:reveal><h2>Demo setup</h2><div class="option-grid three">
				<label class:selected={equipment === 'projector'} class="choice"><input type="radio" name="equipment" checked={equipment === 'projector'} onchange={() => (equipment = 'projector')} /><b>Projector</b><small>Vorhanden.</small></label>
				<label class:selected={equipment === 'tv'} class="choice"><input type="radio" name="equipment" checked={equipment === 'tv'} onchange={() => (equipment = 'tv')} /><b>Display</b><small>Großer Screen.</small></label>
				<label class:selected={equipment === 'none'} class="choice"><input type="radio" name="equipment" checked={equipment === 'none'} onchange={() => (equipment = 'none')} /><b>Kein Screen</b><small>Bringen wir mit.</small></label>
			</div></section>

			<section class="config-section" use:reveal>
				<h2>Event address</h2>
				<div class="field-grid">
					<div class="field full address-search-wrap"><label for="address-search">Adresse suchen</label><input id="address-search" autocomplete="off" aria-describedby="address-search-status" aria-autocomplete="list" aria-controls="address-suggestions" placeholder="Straße, Ort oder Unternehmen" bind:value={addressQuery} oninput={updateSuggestions} />{#if suggestions.length}<ul id="address-suggestions" class="suggestions">{#each suggestions as suggestion}<li><button type="button" onclick={() => selectSuggestion(suggestion)}>{suggestion.label}</button></li>{/each}</ul>{/if}<p id="address-search-status" class="helper" aria-live="polite">{searchStatus === 'loading' ? 'Adressen werden gesucht …' : searchStatus === 'empty' ? 'Keine passende Adresse gefunden. Bitte unten manuell eingeben.' : searchStatus === 'error' ? 'Adresssuche derzeit nicht verfügbar. Bitte unten manuell eingeben.' : 'Optionale Suche mit manueller Eingabe als Fallback.'}</p></div>
					<div class="field full"><label for="street">Straße und Hausnummer</label><input id="street" autocomplete="street-address" bind:value={address.street} /></div>
					<div class="field"><label for="postal">Postleitzahl</label><input id="postal" inputmode="numeric" autocomplete="postal-code" bind:value={address.postalCode} /></div>
					<div class="field"><label for="city">Ort</label><input id="city" autocomplete="address-level2" bind:value={address.city} /></div>
				</div>
			</section>

			<section class="config-section" use:reveal><h2>Event date</h2><EventDateCalendar value={preferredEventDate} minValue={minEventDate} maxValue={maxEventDate} onchange={(date) => (preferredEventDate = date)} /></section>

			<section class="config-section" use:reveal><h2>Kontakt</h2><div class="field-grid">
				<div class="field full"><label for="company">Unternehmen</label><input id="company" autocomplete="organization" bind:value={companyName} /></div>
				<div class="field full"><label for="contact">Ansprechperson</label><input id="contact" autocomplete="name" bind:value={contactName} /></div>
				<div class="field"><label for="email">E-Mail-Adresse</label><input id="email" type="email" autocomplete="email" bind:value={email} /></div>
				<div class="field"><label for="phone">Telefonnummer</label><input id="phone" type="tel" autocomplete="tel" bind:value={phone} /></div>
			</div></section>

			<section class="config-section" use:reveal><h2>30 min Prep Call</h2>
				{#if slotsLoading}
					<p class="slot-status">Freie Termine werden geladen …</p>
				{:else if slots.length === 0}
					<p class="slot-status">Aktuell sind keine Termine verfügbar. Bitte versuchen Sie es später erneut.</p>
					<button class="button-secondary" type="button" onclick={loadAvailability}>Neu laden</button>
				{:else}
					<div class="slots">
						{#each slots.slice(0, -1).slice(0, 15) as slot}<button type="button" class:selected={consultationMode === 'quick' && consultationSlot === slot} class="slot" aria-pressed={consultationMode === 'quick' && consultationSlot === slot} onclick={() => selectQuickSlot(slot)}>{formatDate(slot, true)} Uhr</button>{/each}
						<button type="button" class:selected={consultationMode === 'custom'} class="slot custom-slot" aria-pressed={consultationMode === 'custom'} onclick={selectCustomMode}>Custom</button>
					</div>
					{#if consultationMode === 'custom'}
						<div class="custom-prep-call" transition:slide={{ duration: 320 }}>
							<EventDateCalendar
								value={customConsultationDate}
								minValue={minPrepCallDate}
								maxValue={maxPrepCallDate}
								availableDates={prepCallDates}
								calendarLabel="Datum für den Prep Call"
								emptyText="Bitte wählen Sie einen verfügbaren Tag."
								onchange={selectCustomDate}
							/>
							<PrepCallTimePicker date={customConsultationDate} slots={customConsultationSlots} value={consultationSlot} onchange={(slot) => (consultationSlot = slot)} />
						</div>
					{/if}
				{/if}
			</section>

			<section class="config-section" use:reveal><div class="summary-box">
				<div class="summary-row"><span>Agentic Engineering Hackathon · {capacity} Personen</span><b>{formatPrice(price.basePrice)}</b></div>
				<div class="summary-row"><span>{venueProvided ? 'Eigene Location' : 'Location organisiert'}</span><b>{price.venueSurcharge ? formatPrice(price.venueSurcharge) : 'Inklusive'}</b></div>
				<div class="summary-row"><span>Travel & Demo Setup</span><b>Inklusive</b></div>
				<div class="summary-row total"><span>Gesamt</span><b>{formatPrice(price.totalPrice)} netto</b></div>
			</div>
			{#if errors.length}<div class="error-box" role="alert"><ul>{#each errors as error}<li>{error}</li>{/each}</ul></div>{/if}
			<button class="button-primary" style="width:100%;margin-top:18px" type="submit" disabled={submitting || slotsLoading}>{submitting ? 'Wird gebucht …' : 'Erstgespräch buchen'}</button>
			</section>
		</form>
	</div>
</div>
