<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { env } from '$env/dynamic/public';
	import { onMount } from 'svelte';
	import { CAPACITY_PRICES, formatDate, formatPrice, getPrice, validateConfiguration, type BookingConfiguration, type Capacity, type Equipment, type EventAddress } from '$lib/booking';
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
	let address = $state<EventAddress>({ label: '', street: '', postalCode: '', city: '', country: 'Deutschland' });
	let addressQuery = $state('');
	let suggestions = $state<Array<{ label: string; raw: unknown }>>([]);
	let mapStatus = $state<'missing-token' | 'loading' | 'ready' | 'error'>('loading');
	let map: any = $state();
	let mapSearch: any = $state();
	let mapMarker: any = $state();
	let addressAbort: AbortController | undefined;
	let slots = $state<string[]>([]);
	let slotsLoading = $state(true);
	let demoMode = $state(false);
	let submitting = $state(false);
	let errors = $state<string[]>([]);

	let price = $derived(getPrice(capacity, venueProvided));
	let eventAddressLabel = $derived([address.street, [address.postalCode, address.city].filter(Boolean).join(' ')].filter(Boolean).join(', '));
	let equipmentLabel = $derived(equipment === 'projector' ? 'Projector' : equipment === 'tv' ? 'Display' : 'Provided by us');

	const tomorrow = new Date(Date.now() + 86_400_000);
	const minEventDate = tomorrow.toISOString().slice(0, 10);
	const maxDateObject = new Date();
	maxDateObject.setFullYear(maxDateObject.getFullYear() + 1);
	const maxEventDate = maxDateObject.toISOString().slice(0, 10);

	async function loadAvailability() {
		slotsLoading = true;
		try {
			const start = new Date().toISOString().slice(0, 10);
			const endDate = new Date();
			endDate.setDate(endDate.getDate() + 45);
			const response = await fetch(`/api/availability?start=${start}&end=${endDate.toISOString().slice(0, 10)}&tz=Europe/Berlin`);
			const result = await response.json();
			if (!response.ok) throw new Error(result.message ?? 'Verfügbarkeit konnte nicht geladen werden.');
			slots = result.slots;
			demoMode = Boolean(result.demo);
		} catch (error) {
			slots = [];
			errors = [error instanceof Error ? error.message : 'Verfügbarkeit konnte nicht geladen werden.'];
		} finally {
			slotsLoading = false;
		}
	}

	function loadMapKit() {
		const token = env.PUBLIC_MAPKIT_TOKEN;
		if (!token) return void (mapStatus = 'missing-token');
		if ((window as any).mapkit) return initializeMapKit(token);
		mapStatus = 'loading';
		const script = document.createElement('script');
		script.src = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js';
		script.crossOrigin = 'anonymous';
		script.async = true;
		script.onload = () => initializeMapKit(token);
		script.onerror = () => (mapStatus = 'error');
		document.head.appendChild(script);
	}

	function initializeMapKit(token: string) {
		try {
			const mk = (window as any).mapkit;
			if (!mk) throw new Error('MapKit nicht verfügbar');
			mk.init({ authorizationCallback: (done: (value: string) => void) => done(token), language: 'de' });
			map = new mk.Map('mapkit-map', { showsCompass: mk.FeatureVisibility?.Hidden, showsZoomControl: false, showsMapTypeControl: false, isRotationEnabled: false, colorScheme: mk.Map.ColorSchemes?.Light });
			mapSearch = new mk.Search({ includePointsOfInterest: false, includeAddresses: true, limitToCountries: 'DE' });
			mapStatus = 'ready';
		} catch { mapStatus = 'error'; }
	}

	async function updateSuggestions() {
		if (!mapSearch || addressQuery.trim().length < 3) return void (suggestions = []);
		addressAbort?.abort();
		addressAbort = new AbortController();
		try {
			const response = await mapSearch.autocomplete(addressQuery, { limitToCountries: 'DE', includePointsOfInterest: false, signal: addressAbort.signal });
			suggestions = (response.results ?? []).slice(0, 5).map((result: any) => ({ label: (result.displayLines ?? []).join(', '), raw: result }));
		} catch (error) { if ((error as Error).name !== 'AbortError') suggestions = []; }
	}

	async function selectSuggestion(suggestion: { label: string; raw: unknown }) {
		addressQuery = suggestion.label;
		suggestions = [];
		try {
			const response = await mapSearch.search(suggestion.raw, { limitToCountries: 'DE' });
			const place = response.places?.[0];
			if (!place) return;
			const formatted = place.formattedAddress ?? suggestion.label;
			address = {
				label: formatted,
				street: [place.address?.thoroughfare, place.address?.subThoroughfare].filter(Boolean).join(' ') || formatted.split(',')[0] || '',
				postalCode: place.address?.postCode ?? place.address?.postalCode ?? '',
				city: place.address?.locality ?? place.address?.postTown ?? '',
				country: 'Deutschland', latitude: place.coordinate?.latitude, longitude: place.coordinate?.longitude
			};
			if (map && place.coordinate) {
				const mk = (window as any).mapkit;
				if (mapMarker) map.removeAnnotation(mapMarker);
				mapMarker = new mk.MarkerAnnotation(place.coordinate, { color: '#111111', title: companyName || 'WERKSPRUNG' });
				map.addAnnotation(mapMarker);
				map.setCenterAnimated(place.coordinate);
				map.setCameraDistanceAnimated(5500);
			}
		} catch { mapStatus = 'error'; }
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
				if (response.status === 409) { consultationSlot = ''; await loadAvailability(); }
				throw new Error(result.message ?? 'Die Buchung konnte nicht abgeschlossen werden.');
			}
			if (browser) sessionStorage.setItem('werksprung-booking', JSON.stringify({ ...config, ...price, booking: result }));
			await goto('/buchen/erfolg');
		} catch (error) { errors = [error instanceof Error ? error.message : 'Die Buchung konnte nicht abgeschlossen werden.']; }
		finally { submitting = false; }
	}

	onMount(() => { loadAvailability(); loadMapKit(); });
</script>

<svelte:head><title>AI Coding Hackathon planen — WERKSPRUNG</title><meta name="description" content="Planen Sie Teamgröße, Location und Wunschtermin für Ihren WERKSPRUNG AI Coding Hackathon." /></svelte:head>

<div class="config-page">
	<header class="config-intro">
		<div use:reveal><h1>Hackathon planen</h1></div>
		<div class="price-pill">Ab 3.000 € netto · Anreise inklusive</div>
	</header>

	<div class="config-layout">
		<div class="preview-column">
			<div class="map-shell" aria-label="Vorschau des Veranstaltungsorts">
				<div id="mapkit-map"></div>
				{#if mapStatus !== 'ready'}
					<div class="map-status">
						<span class="map-status-icon">⌖</span>
						{mapStatus === 'loading' ? 'Apple Maps wird geladen …' : mapStatus === 'missing-token' ? 'Apple Maps · Token lokal ergänzen' : 'Apple Maps ist gerade nicht verfügbar'}
					</div>
				{/if}
				<article class="event-card" aria-live="polite">
					<div class="event-card-top"><div><p class="tiny">WERKSPRUNG · AI Coding Hackathon</p><h2>{companyName || 'Ihr Unternehmen'}</h2></div><div class="event-card-price">{formatPrice(price.totalPrice)}</div></div>
					<p class="event-address">{eventAddressLabel || 'Event Location auswählen'}</p>
					<div class="event-details">
						<div class="event-detail"><small>Event Date</small><b>{formatDate(preferredEventDate)}</b></div>
						<div class="event-detail"><small>Team</small><b>Bis {capacity} Personen</b></div>
						<div class="event-detail"><small>Location</small><b>{venueProvided ? 'Eigener Raum' : 'Von uns organisiert'}</b></div>
						<div class="event-detail"><small>Screen</small><b>{equipmentLabel}</b></div>
					</div>
				</article>
			</div>
		</div>

		<form class="config-form" onsubmit={(event) => { event.preventDefault(); submitBooking(); }} novalidate>
			<section class="config-section" use:reveal>
				<h2>Team size.</h2>
				<div class="option-grid three">
					{#each [15, 30, 50] as size}<label class:selected={capacity === size} class="choice"><input type="radio" name="capacity" value={size} checked={capacity === size} onchange={() => (capacity = size as Capacity)} /><b>{size} Personen</b><small>{size === 15 ? 'Kompaktes Team' : size === 30 ? 'Mehrere Build-Teams' : 'Großer Demo Day'}</small><span class="choice-price">{formatPrice(CAPACITY_PRICES[size as Capacity])}</span></label>{/each}
				</div>
			</section>

			<section class="config-section" use:reveal><h2>Location.</h2><div class="option-grid">
				<label class:selected={venueProvided} class="choice"><input type="radio" name="venue" checked={venueProvided} onchange={() => (venueProvided = true)} /><b>Eigener Conference Room</b><small>Platz für Teams, stabiles WLAN, großer Screen.</small><span class="choice-price">Inklusive</span></label>
				<label class:selected={!venueProvided} class="choice"><input type="radio" name="venue" checked={!venueProvided} onchange={() => (venueProvided = false)} /><b>Location organisieren lassen</b><small>Passender Raum nahe Ihrer Wunschadresse.</small><span class="choice-price">+ 1.000 €</span></label>
			</div></section>

			<section class="config-section" use:reveal><h2>Demo setup.</h2><div class="option-grid three">
				<label class:selected={equipment === 'projector'} class="choice"><input type="radio" name="equipment" checked={equipment === 'projector'} onchange={() => (equipment = 'projector')} /><b>Projector</b><small>Vorhanden.</small></label>
				<label class:selected={equipment === 'tv'} class="choice"><input type="radio" name="equipment" checked={equipment === 'tv'} onchange={() => (equipment = 'tv')} /><b>Display</b><small>Großer Screen.</small></label>
				<label class:selected={equipment === 'none'} class="choice"><input type="radio" name="equipment" checked={equipment === 'none'} onchange={() => (equipment = 'none')} /><b>Kein Screen</b><small>Bringen wir mit.</small></label>
			</div></section>

			<section class="config-section" use:reveal>
				<h2>Event address.</h2>
				<div class="field-grid">
					<div class="field full address-search-wrap"><label for="address-search">Search with Apple Maps</label><input id="address-search" autocomplete="off" placeholder="Straße, Ort oder Unternehmen" bind:value={addressQuery} oninput={updateSuggestions} />{#if suggestions.length}<ul class="suggestions">{#each suggestions as suggestion}<li><button type="button" onclick={() => selectSuggestion(suggestion)}>{suggestion.label}</button></li>{/each}</ul>{/if}</div>
					<div class="field full"><label for="street">Straße und Hausnummer</label><input id="street" autocomplete="street-address" bind:value={address.street} /></div>
					<div class="field"><label for="postal">Postleitzahl</label><input id="postal" inputmode="numeric" autocomplete="postal-code" bind:value={address.postalCode} /></div>
					<div class="field"><label for="city">Ort</label><input id="city" autocomplete="address-level2" bind:value={address.city} /></div>
				</div>
			</section>

			<section class="config-section" use:reveal><h2>Event date.</h2><div class="field"><label for="event-date">Wunschtermin</label><input id="event-date" type="date" min={minEventDate} max={maxEventDate} bind:value={preferredEventDate} /></div></section>

			<section class="config-section" use:reveal><h2>Kontakt.</h2><div class="field-grid">
				<div class="field full"><label for="company">Unternehmen</label><input id="company" autocomplete="organization" bind:value={companyName} /></div>
				<div class="field full"><label for="contact">Ansprechperson</label><input id="contact" autocomplete="name" bind:value={contactName} /></div>
				<div class="field"><label for="email">E-Mail-Adresse</label><input id="email" type="email" autocomplete="email" bind:value={email} /></div>
				<div class="field"><label for="phone">Telefonnummer</label><input id="phone" type="tel" autocomplete="tel" bind:value={phone} /></div>
			</div></section>

			<section class="config-section" use:reveal><h2>30 min Prep Call.</h2>
				{#if slotsLoading}<p class="slot-status">Freie Termine werden geladen …</p>{:else if slots.length === 0}<p class="slot-status">Aktuell sind keine Termine verfügbar. Bitte versuchen Sie es später erneut.</p><button class="button-secondary" type="button" onclick={loadAvailability}>Neu laden</button>{:else}<div class="slots">{#each slots as slot}<button type="button" class:selected={consultationSlot === slot} class="slot" onclick={() => (consultationSlot = slot)}>{formatDate(slot, true)} Uhr</button>{/each}</div>{/if}
			</section>

			<section class="config-section" use:reveal><div class="summary-box">
				<div class="summary-row"><span>AI Coding Hackathon · {capacity} Personen</span><b>{formatPrice(price.basePrice)}</b></div>
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
