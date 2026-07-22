<script lang="ts">
	import { browser } from '$app/environment';
	import { goto, replaceState } from '$app/navigation';
	import { onDestroy, onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { Award, CalendarDays, Camera, Cookie, MapPin, Monitor, Pizza, Plane, ReceiptEuro, Users, Clock3 } from 'lucide-svelte';
	import { CAPACITY_PRICES, formatDate, formatPrice, getPrice, validateConfiguration, type BookingConfiguration, type Capacity, type Equipment, type EventAddress, type Lunch } from '$lib/booking';
	import { photonFeatureLabel, normalizePhotonAddress, type PhotonFeature } from '$lib/photon';
	import { eventDateBounds } from '$lib/event-date';
	import EventDateCalendar from '$lib/EventDateCalendar.svelte';
	import PrepCallTimePicker from '$lib/PrepCallTimePicker.svelte';
	import { availablePrepCallDates, normalizeAvailabilitySlots, prepCallDateBounds, prepCallSlotsForDate } from '$lib/prep-call';
	import type { SharedPlanV1 } from '$lib/shared-plan';
	import { reveal } from '$lib/motion';
	import MapPreview from '$lib/MapPreview.svelte';
	import SharePlanButton from '$lib/SharePlanButton.svelte';

	let capacity = $state<Capacity>(15);
	let venueProvided = $state(true);
	let equipment = $state<Equipment>('projector');
	let lunch = $state<Lunch>('pizza');
	let customLunch = $state('');
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
	let addressAbort: AbortController | undefined;
	let addressDebounce: ReturnType<typeof setTimeout> | undefined;
	let planAbort: AbortController | undefined;
	let planDebounce: ReturnType<typeof setTimeout> | undefined;
	let planHydrated = $state(false);
	let planToken = $state('');
	let planError = $state('');
	let slots = $state<string[]>([]);
	let slotsLoading = $state(true);
	let demoMode = $state(false);
	let submitting = $state(false);
	let errors = $state<string[]>([]);

	let price = $derived(getPrice(capacity, venueProvided, lunch));
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
	}

	function buildConfiguration(): BookingConfiguration {
		return { capacity, venueProvided, equipment, lunch, customLunch: lunch === 'custom' ? customLunch : '', companyName, contactName, email, phone, address, preferredEventDate, consultationSlot };
	}

	function buildSharedPlan(): SharedPlanV1 {
		return { v: 1, ...buildConfiguration(), consultationMode, customConsultationDate };
	}

	function applySharedPlan(plan: SharedPlanV1) {
		capacity = plan.capacity; venueProvided = plan.venueProvided; equipment = plan.equipment; lunch = plan.lunch; customLunch = plan.customLunch;
		companyName = plan.companyName; contactName = plan.contactName; email = plan.email; phone = plan.phone; address = plan.address;
		addressQuery = plan.address.label || [plan.address.street, plan.address.city].filter(Boolean).join(', ');
		preferredEventDate = plan.preferredEventDate; consultationSlot = plan.consultationSlot; consultationMode = plan.consultationMode; customConsultationDate = plan.customConsultationDate;
	}

	async function encodePlan(plan = buildSharedPlan(), updateUrl = true) {
		if (!browser) return '';
		planAbort?.abort(); planAbort = new AbortController();
		const response = await fetch('/api/plan-token', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(plan), signal: planAbort.signal });
		const result = await response.json();
		if (!response.ok) throw new Error(result.message ?? 'Plan-Link konnte nicht erstellt werden.');
		planToken = result.token;
		const path = `/buchen/${planToken}`;
		if (updateUrl) replaceState(path, {});
		return `${location.origin}${path}`;
	}

	function schedulePlanUrl(plan: SharedPlanV1) {
		if (!browser || !planHydrated) return;
		if (planDebounce) clearTimeout(planDebounce);
		planDebounce = setTimeout(() => encodePlan(plan).catch((error) => { if ((error as Error).name !== 'AbortError') planError = (error as Error).message; }), 400);
	}

	async function hydratePlanFromUrl() {
		const token = location.pathname.match(/^\/buchen\/([^/]+)$/)?.[1];
		if (!token) return;
		const response = await fetch(`/api/plan-token/${encodeURIComponent(token)}`);
		const result = await response.json();
		if (!response.ok) { planError = result.message ?? 'Ungültiger Plan-Link.'; return; }
		planToken = token; applySharedPlan(result.plan);
	}

	async function getShareUrl() {
		if (planDebounce) clearTimeout(planDebounce);
		return encodePlan(buildSharedPlan());
	}

	$effect(() => { schedulePlanUrl(buildSharedPlan()); });

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
			const planUrl = await getShareUrl();
			if (browser) sessionStorage.setItem('werksprung-booking', JSON.stringify({ ...config, ...price, booking: result, planUrl }));
			await goto('/buchen/erfolg');
		} catch (error) { errors = [error instanceof Error ? error.message : 'Die Buchung konnte nicht abgeschlossen werden.']; }
		finally { submitting = false; }
	}

	onMount(async () => { await hydratePlanFromUrl(); planHydrated = true; await loadAvailability(); schedulePlanUrl(buildSharedPlan()); });
	onDestroy(() => {
		if (addressDebounce) clearTimeout(addressDebounce);
		if (planDebounce) clearTimeout(planDebounce);
		addressAbort?.abort();
		planAbort?.abort();
	});
</script>

<svelte:head><title>Hackathon planen — Agentic Engineering Hackathon</title><meta name="description" content="Planen Sie Teamgröße, Location und Wunschtermin für Ihren Agentic Engineering Hackathon." /><meta name="robots" content="noindex,nofollow" /></svelte:head>

<div class="config-page">
	<header class="config-intro">
		<div use:reveal><h1>Hackathon planen</h1></div>
		<div class="price-pill">Ab 3.500 € netto · Anreise inklusive</div>
	</header>
	{#if planError}<div class="plan-error" role="alert">{planError} <a href="/buchen">Neuen Plan starten</a></div>{/if}

	<div class="config-layout">
		<div class="preview-column">
			<MapPreview latitude={address.latitude} longitude={address.longitude}>
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
			</MapPreview>
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

			<section class="config-section" use:reveal><h2>Lunch</h2>
				<div class="option-grid three">
					<label class:selected={lunch === 'pizza'} class="choice"><input type="radio" name="lunch" checked={lunch === 'pizza'} onchange={() => (lunch = 'pizza')} /><b>Pizza</b><small>Der Hackathon-Klassiker.</small><span class="choice-price">Inklusive</span></label>
					<label class:selected={lunch === 'custom'} class="choice"><input type="radio" name="lunch" checked={lunch === 'custom'} onchange={() => (lunch = 'custom')} /><b>Custom</b><small>Catering nach Wunsch.</small><span class="choice-price">+ 500 €</span></label>
					<label class:selected={lunch === 'none'} class="choice"><input type="radio" name="lunch" checked={lunch === 'none'} onchange={() => (lunch = 'none')} /><b>No lunch</b><small>Ohne Catering.</small><span class="choice-price">− 500 €</span></label>
				</div>
				{#if lunch === 'custom'}<div class="custom-lunch" transition:slide={{ duration: 300 }}><div class="field"><label for="custom-lunch">Catering-Wunsch</label><input id="custom-lunch" maxlength="160" placeholder="z. B. vegetarische Bowls oder Buffet" bind:value={customLunch} /></div></div>{/if}
				<p class="section-note">{lunch === 'none' ? 'Kein Catering eingeplant.' : 'Wir organisieren das Catering für Sie.'}</p>
			</section>

			<section class="config-section" use:reveal>
				<h2>Event address</h2>
				<div class="field-grid">
					<div class="field full address-search-wrap"><label for="address-search">Adresse suchen</label><input id="address-search" autocomplete="off" aria-describedby={searchStatus === 'idle' ? undefined : 'address-search-status'} aria-autocomplete="list" aria-controls="address-suggestions" placeholder="Straße, Ort oder Unternehmen" bind:value={addressQuery} oninput={updateSuggestions} />{#if suggestions.length}<ul id="address-suggestions" class="suggestions">{#each suggestions as suggestion}<li><button type="button" onclick={() => selectSuggestion(suggestion)}>{suggestion.label}</button></li>{/each}</ul>{/if}{#if searchStatus !== 'idle'}<p id="address-search-status" class="helper" aria-live="polite">{searchStatus === 'loading' ? 'Adressen werden gesucht …' : searchStatus === 'empty' ? 'Keine passende Adresse gefunden. Bitte unten manuell eingeben.' : 'Adresssuche derzeit nicht verfügbar. Bitte unten manuell eingeben.'}</p>{/if}</div>
					<div class="field full"><label for="street">Straße und Hausnummer</label><input id="street" autocomplete="street-address" bind:value={address.street} /></div>
					<div class="field"><label for="postal">Postleitzahl</label><input id="postal" inputmode="numeric" autocomplete="postal-code" bind:value={address.postalCode} /></div>
					<div class="field"><label for="city">Ort</label><input id="city" autocomplete="address-level2" bind:value={address.city} /></div>
				</div>
			</section>

			<section class="config-section" use:reveal><h2>Event date</h2><EventDateCalendar value={preferredEventDate} minValue={minEventDate} maxValue={maxEventDate} onchange={(date) => (preferredEventDate = date)} /></section>

			<section class="config-section" use:reveal><h2>Kontakt</h2><div class="field-grid">
				<div class="field full"><label for="company">Unternehmen</label><input id="company" autocomplete="organization" bind:value={companyName} /></div>
				<div class="field full"><label for="contact">Ansprechperson</label><input id="contact" autocomplete="name" bind:value={contactName} /></div>
				<div class="field full"><label for="email">E-Mail-Adresse</label><input id="email" type="email" autocomplete="email" bind:value={email} /></div>
				<div class="field full"><label for="phone">Telefonnummer</label><input id="phone" type="tel" autocomplete="tel" bind:value={phone} /></div>
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
							{#if customConsultationDate}<div transition:slide={{ duration: 280 }}><PrepCallTimePicker date={customConsultationDate} slots={customConsultationSlots} value={consultationSlot} onchange={(slot) => (consultationSlot = slot)} /></div>{/if}
						</div>
					{/if}
				{/if}
			</section>

			<section class="config-section" use:reveal><div class="summary-box overview-box">
				<div class="summary-row"><Users size={18} aria-hidden="true" /><span><small>Team</small>Bis {capacity} Personen</span><b>{formatPrice(price.basePrice)}</b></div>
				<div class="summary-row"><MapPin size={18} aria-hidden="true" /><span><small>Location</small>{venueProvided ? 'Wir kommen zu Ihnen' : 'Location organisiert'}</span><b>{venueProvided ? 'Inklusive' : formatPrice(price.venueSurcharge)}</b></div>
				<div class="summary-row"><Monitor size={18} aria-hidden="true" /><span><small>Demo Setup</small>{equipmentLabel}</span><b>Inklusive</b></div>
				{#if preferredEventDate}<div class="summary-row"><CalendarDays size={18} aria-hidden="true" /><span><small>Event Date</small>{formatDate(preferredEventDate)}</span><b>Geplant</b></div>{/if}
				{#if consultationSlot}<div class="summary-row"><Clock3 size={18} aria-hidden="true" /><span><small>Prep Call</small>{formatDate(consultationSlot, true)} Uhr</span><b>Gebucht</b></div>{/if}
				<div class="summary-row"><Pizza size={18} aria-hidden="true" /><span><small>Lunch</small>{lunch === 'pizza' ? 'Pizza' : lunch === 'custom' ? customLunch || 'Custom Catering' : 'No lunch'}</span><b>{price.lunchAdjustment ? `${price.lunchAdjustment > 0 ? '+' : '−'} ${formatPrice(Math.abs(price.lunchAdjustment))}` : 'Inklusive'}</b></div>
				<div class="summary-row"><Award size={18} aria-hidden="true" /><span><small>Winner Poster</small>Auszeichnung für das Gewinnerteam</span><b>Inklusive</b></div>
				<div class="summary-row"><Camera size={18} aria-hidden="true" /><span><small>Event-Fotos</small>Dokumentation des Tages</span><b>Inklusive</b></div>
				<div class="summary-row"><Cookie size={18} aria-hidden="true" /><span><small>Snacks</small>Cookies</span><b>Inklusive</b></div>
				<div class="summary-row"><Plane size={18} aria-hidden="true" /><span><small>Anreise</small>Innerhalb Deutschlands</span><b>Inklusive</b></div>
				<div class="summary-row total"><ReceiptEuro size={20} aria-hidden="true" /><span>Gesamt</span><b>{formatPrice(price.totalPrice)} netto</b></div>
			</div>
			{#if errors.length}<div class="error-box" role="alert"><ul>{#each errors as error}<li>{error}</li>{/each}</ul></div>{/if}
			<button class="button-primary" style="width:100%;margin-top:18px" type="submit" disabled={submitting || slotsLoading}>{submitting ? 'Wird gebucht …' : 'Erstgespräch buchen'}</button>
			<SharePlanButton getUrl={getShareUrl} />
			</section>
		</form>
	</div>
</div>
