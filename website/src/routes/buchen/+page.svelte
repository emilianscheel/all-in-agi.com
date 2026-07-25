<script lang="ts">
	import { browser } from '$app/environment';
	import { goto, replaceState } from '$app/navigation';
	import { onDestroy, onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { Apple, Award, Beef, CakeSlice, CalendarDays, Camera, Check, Clock3, Code2, Coffee, Cookie, Drumstick, Fish, IceCreamBowl, MapPin, Monitor, Pizza, Plane, ReceiptEuro, Salad, Sandwich, Soup, Utensils, UtensilsCrossed, Users } from 'lucide-svelte';
	import { CAPACITY_PRICES, CODING_TOOLS, PROVIDED_CODING_TOOLS, formatDate, formatPrice, getPrice, selectedCodingToolLabels, validateConfiguration, type BookingConfiguration, type Capacity, type CodingTool, type Equipment, type EventAddress, type Lunch, type ToolProvision } from '$lib/booking';
	import { photonFeatureLabel, normalizePhotonAddress, type PhotonFeature } from '$lib/photon';
	import { eventDateBounds } from '$lib/event-date';
	import AnimatedValue from '$lib/AnimatedValue.svelte';
	import EventDateCalendar from '$lib/EventDateCalendar.svelte';
	import PrepCallTimePicker from '$lib/PrepCallTimePicker.svelte';
	import { lunchIconKind } from '$lib/lunch-icon';
	import { availablePrepCallDates, normalizeAvailabilitySlots, prepCallDateBounds, prepCallSlotsForDate } from '$lib/prep-call';
	import type { SharedPlanV2 } from '$lib/shared-plan';
	import { reveal } from '$lib/motion';
	import MapPreview from '$lib/MapPreview.svelte';
	import SharePlanButton from '$lib/SharePlanButton.svelte';

	let capacity = $state<Capacity>(15);
	let venueProvided = $state(true);
	let equipment = $state<Equipment>('projector');
	let lunch = $state<Lunch>('pizza');
	let customLunch = $state('');
	let toolProvision = $state<ToolProvision | null>(null);
	let codingTools = $state<CodingTool[]>([]);
	let customCodingTool = $state('');
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
	let eventCard: HTMLElement;
	let overviewCard: HTMLDivElement;
	let previewOpacity = $state(1);
	let mapHeight = $state<number | undefined>();
	let mapExpandedHeight = $state<number | undefined>();
	let previewFadeFrame: number | undefined;
	let reducedMotion: MediaQueryList | undefined;
	let debouncedCustomLunch = $state('');
	let customLunchDebounce: ReturnType<typeof setTimeout> | undefined;

	let price = $derived(getPrice(capacity, venueProvided, lunch, toolProvision));
	let eventAddressLabel = $derived([address.street, [address.postalCode, address.city].filter(Boolean).join(' ')].filter(Boolean).join(', '));
	let equipmentLabel = $derived(equipment === 'none' ? 'Provided by us' : 'Projector / Display');
	let codingToolLabels = $derived(selectedCodingToolLabels({ codingTools, customCodingTool }));
	let toolsPreviewLabel = $derived(toolProvision ? codingToolLabels.join(', ') || 'Noch keine ausgewählt' : 'Noch offen');
	let lunchPreviewLabel = $derived(lunch === 'pizza' ? 'Pizza' : lunch === 'custom' ? debouncedCustomLunch || 'Custom Catering' : lunch === 'self-organized' ? 'Selbstorganisiert' : 'Ohne Lunch');
	let selectedLunchIconKind = $derived(lunchIconKind(lunch, debouncedCustomLunch));
	let LunchIcon = $derived({
		pizza: Pizza,
		'utensils-crossed': UtensilsCrossed,
		utensils: Utensils,
		soup: Soup,
		salad: Salad,
		sandwich: Sandwich,
		fish: Fish,
		beef: Beef,
		drumstick: Drumstick,
		cake: CakeSlice,
		'ice-cream': IceCreamBowl,
		coffee: Coffee,
		apple: Apple
	}[selectedLunchIconKind]);
	let visibleCodingTools = $derived(toolProvision === 'needed'
		? PROVIDED_CODING_TOOLS.map((id) => CODING_TOOLS.find((tool) => tool.id === id)!)
		: CODING_TOOLS);
	let prepCallDates = $derived(availablePrepCallDates(slots));
	let customConsultationSlots = $derived(prepCallSlotsForDate(slots, customConsultationDate));

	const { min: minEventDate, max: maxEventDate } = eventDateBounds();
	const { min: minPrepCallDate, max: maxPrepCallDate } = prepCallDateBounds();

	$effect(() => {
		const nextCustomLunch = customLunch.trim();
		if (customLunchDebounce) clearTimeout(customLunchDebounce);
		customLunchDebounce = setTimeout(() => {
			debouncedCustomLunch = nextCustomLunch;
		}, 280);
	});

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

	function toggleCodingTool(tool: CodingTool) {
		codingTools = codingTools.includes(tool) ? codingTools.filter((selected) => selected !== tool) : [...codingTools, tool];
	}

	function selectToolProvision(provision: ToolProvision) {
		toolProvision = provision;
		if (provision === 'needed') {
			codingTools = codingTools.filter((tool) => PROVIDED_CODING_TOOLS.includes(tool));
			customCodingTool = '';
		}
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
		return {
			capacity,
			venueProvided,
			equipment,
			lunch,
			customLunch: lunch === 'custom' ? customLunch : '',
			toolProvision,
			codingTools,
			customCodingTool: codingTools.includes('custom') ? customCodingTool : '',
			companyName,
			contactName,
			email,
			phone,
			address,
			preferredEventDate,
			consultationSlot
		};
	}

	function buildSharedPlan(): SharedPlanV2 {
		return { v: 2, ...buildConfiguration(), consultationMode, customConsultationDate };
	}

	function applySharedPlan(plan: SharedPlanV2) {
		capacity = plan.capacity; venueProvided = plan.venueProvided; equipment = plan.equipment; lunch = plan.lunch; customLunch = plan.customLunch;
		toolProvision = plan.toolProvision; codingTools = plan.toolProvision === 'needed' ? plan.codingTools.filter((tool) => PROVIDED_CODING_TOOLS.includes(tool)) : plan.codingTools; customCodingTool = plan.toolProvision === 'needed' ? '' : plan.customCodingTool;
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

	function schedulePlanUrl(plan: SharedPlanV2) {
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
			if (browser) sessionStorage.setItem('all-in-agi-booking', JSON.stringify({
				...config,
				...price,
				booking: result,
				planUrl,
				hackathonId: result.hackathonId,
				detailUrl: result.detailUrl
			}));
			await goto('/buchen/erfolg');
		} catch (error) { errors = [error instanceof Error ? error.message : 'Die Buchung konnte nicht abgeschlossen werden.']; }
		finally { submitting = false; }
	}

	function updatePreviewFade() {
		previewFadeFrame = undefined;
		const expandedHeight = Math.max(646, Math.min(window.innerHeight - 100, 916));
		const collapsedHeight = Math.min(expandedHeight, Math.max(570, Math.min(window.innerHeight * 0.7, 720)) + 50);
		const expansionStartScroll = 0;
		const expansionDistance = expandedHeight - collapsedHeight;
		const expansionEndScroll = expansionStartScroll + expansionDistance;
		const expansionProgress = expansionDistance === 0
			? 1
			: Math.max(0, Math.min(1, (window.scrollY - expansionStartScroll) / (expansionEndScroll - expansionStartScroll)));
		const easedExpansion = expansionProgress * expansionProgress * (3 - 2 * expansionProgress);
		mapExpandedHeight = expandedHeight;
		mapHeight = collapsedHeight + (expandedHeight - collapsedHeight) * easedExpansion;

		if (!overviewCard) return;
		const overviewTop = overviewCard.getBoundingClientRect().top;
		const fadeStart = window.innerHeight;
		const fadeEnd = window.innerHeight * 0.62;
		if (reducedMotion?.matches) {
			previewOpacity = overviewTop < fadeStart ? 0 : 1;
			return;
		}
		const progress = (fadeStart - overviewTop) / (fadeStart - fadeEnd);
		previewOpacity = Math.max(0, Math.min(1, 1 - progress));
	}

	function schedulePreviewFade() {
		if (previewFadeFrame !== undefined) return;
		previewFadeFrame = requestAnimationFrame(updatePreviewFade);
	}

	onMount(async () => {
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
		window.addEventListener('scroll', schedulePreviewFade, { passive: true });
		window.addEventListener('resize', schedulePreviewFade, { passive: true });
		reducedMotion.addEventListener('change', schedulePreviewFade);
		schedulePreviewFade();
		await hydratePlanFromUrl();
		planHydrated = true;
		await loadAvailability();
		schedulePlanUrl(buildSharedPlan());
	});
	onDestroy(() => {
		if (!browser) return;
		if (addressDebounce) clearTimeout(addressDebounce);
		if (planDebounce) clearTimeout(planDebounce);
		if (customLunchDebounce) clearTimeout(customLunchDebounce);
		if (previewFadeFrame !== undefined) cancelAnimationFrame(previewFadeFrame);
		window.removeEventListener('scroll', schedulePreviewFade);
		window.removeEventListener('resize', schedulePreviewFade);
		reducedMotion?.removeEventListener('change', schedulePreviewFade);
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
			<div
				class="preview-column"
				style={mapHeight === undefined || mapExpandedHeight === undefined
					? undefined
					: `--map-height:${mapHeight}px;--map-expanded-height:${mapExpandedHeight}px`}
			>
				<MapPreview latitude={address.latitude} longitude={address.longitude}>
					<div class="map-address-search">
						<div class="field address-search-wrap">
							<label class="visually-hidden" for="map-address-search">Adresse suchen</label>
							<input
								id="map-address-search"
								autocomplete="off"
								aria-describedby={searchStatus === 'idle' ? undefined : 'map-address-search-status'}
								aria-autocomplete="list"
								aria-controls="map-address-suggestions"
								placeholder="Straße, Ort oder Unternehmen"
								bind:value={addressQuery}
								oninput={updateSuggestions}
							/>
							{#if suggestions.length}
								<ul id="map-address-suggestions" class="suggestions">
									{#each suggestions as suggestion}<li><button type="button" onclick={() => selectSuggestion(suggestion)}>{suggestion.label}</button></li>{/each}
								</ul>
							{/if}
							{#if searchStatus !== 'idle'}
								<p id="map-address-search-status" class="helper" aria-live="polite">{searchStatus === 'loading' ? 'Adressen werden gesucht …' : searchStatus === 'empty' ? 'Keine passende Adresse gefunden. Bitte unten manuell eingeben.' : 'Adresssuche derzeit nicht verfügbar. Bitte unten manuell eingeben.'}</p>
							{/if}
						</div>
					</div>
					<article
						class="event-card"
					bind:this={eventCard}
					style:opacity={previewOpacity}
					aria-label="Konfigurationsvorschau"
					aria-hidden={previewOpacity <= 0.01}
				>
					<div class="event-card-top"><h2>{companyName.trim() || 'Ihr Hackathon'}</h2><div class="event-card-price"><AnimatedValue value={formatPrice(price.totalPrice)} /></div></div>
					{#if eventAddressLabel}<p class="event-address">{eventAddressLabel}</p>{/if}
					<div class="event-details">
						<div class:event-detail-unselected={!preferredEventDate} class="event-detail" aria-hidden={!preferredEventDate}><small>Event Date</small><b><AnimatedValue value={formatDate(preferredEventDate)} active={Boolean(preferredEventDate)} /></b></div>
						<div class="event-detail"><small>Team</small><b><AnimatedValue value={`Bis ${capacity} Personen`} /></b></div>
						<div class="event-detail"><small>Location</small><b><AnimatedValue value={venueProvided ? 'Eigener Raum' : 'Von uns organisiert'} /></b></div>
						<div class:event-detail-unselected={!toolProvision || !codingToolLabels.length} class="event-detail" aria-hidden={!toolProvision || !codingToolLabels.length}><small>Tools</small><b><AnimatedValue value={toolsPreviewLabel} active={Boolean(toolProvision && codingToolLabels.length)} /></b></div>
						<div class="event-detail"><small>Screen</small><b><AnimatedValue value={equipmentLabel} /></b></div>
						<div class="event-detail"><small>Lunch</small><b><AnimatedValue value={lunchPreviewLabel} /></b></div>
						<div class:event-detail-unselected={!consultationSlot} class="event-detail" aria-hidden={!consultationSlot}><small>Prep Call</small><b><AnimatedValue value={consultationSlot ? `${formatDate(consultationSlot, true)} Uhr` : 'Noch offen'} active={Boolean(consultationSlot)} /></b></div>
					</div>
				</article>
			</MapPreview>
		</div>

		<form class="config-form" onsubmit={(event) => { event.preventDefault(); submitBooking(); }} novalidate>
			<section class="config-section" use:reveal>
				<h2>Teamgröße</h2>
				<div class="option-grid three">
					{#each [15, 30, 50] as size}<label class:selected={capacity === size} class="choice"><input type="radio" name="capacity" value={size} checked={capacity === size} onchange={() => (capacity = size as Capacity)} /><b>{size} Personen</b><small>{size === 15 ? 'Kompaktes Team' : size === 30 ? 'Mehrere Build-Teams' : 'Großer Demo Day'}</small><span class="choice-price">{formatPrice(CAPACITY_PRICES[size as Capacity])}</span></label>{/each}
				</div>
			</section>

			<section class="config-section" use:reveal><h2>Veranstaltungsort</h2><div class="option-grid">
				<label class:selected={venueProvided} class="choice"><input type="radio" name="venue" checked={venueProvided} onchange={() => (venueProvided = true)} /><b>Eigener Conference Room</b><small>Platz für Teams, stabiles WLAN, großer Screen.</small><span class="choice-price">Inklusive</span></label>
				<label class:selected={!venueProvided} class="choice"><input type="radio" name="venue" checked={!venueProvided} onchange={() => (venueProvided = false)} /><b>Location organisieren lassen</b><small>Passender Raum nahe Ihrer Wunschadresse.</small><span class="choice-price">+ 1.000 €</span></label>
			</div></section>

			<section class="config-section tools-section" use:reveal><h2>Tools</h2>
				<div class="option-grid tools-mode-grid">
					<label class:selected={toolProvision === 'existing'} class="choice"><input type="radio" name="tool-provision" checked={toolProvision === 'existing'} onchange={() => selectToolProvision('existing')} /><b>Wir haben Agentic Coding Tools</b><span class="choice-price">Inklusive</span></label>
					<label class:selected={toolProvision === 'needed'} class="choice"><input type="radio" name="tool-provision" checked={toolProvision === 'needed'} onchange={() => selectToolProvision('needed')} /><b>Wir brauchen welche für den Tag</b><span class="choice-price">+ 500 €</span></label>
				</div>
				{#if toolProvision}
					<div class:has-custom-tool={codingTools.includes('custom')} class="coding-tools" transition:slide={{ duration: 300 }}>
						<p>{toolProvision === 'needed' ? 'Welche Tools sollen wir mitbringen?' : 'Welche Coding Tools werden eingesetzt?'}</p>
						<div class="coding-tool-list">
							{#each visibleCodingTools as tool}
								<label class="coding-tool-option">
									<input type="checkbox" checked={codingTools.includes(tool.id)} onchange={() => toggleCodingTool(tool.id)} />
									<span class="round-checkbox" aria-hidden="true">{#if codingTools.includes(tool.id)}<Check size={18} strokeWidth={2.4} />{/if}</span>
									<span class="coding-tool-label">{tool.label}</span>
									{#if tool.icon}<img class="coding-tool-icon" src={tool.icon} alt="" width="30" height="30" loading="lazy" decoding="async" aria-hidden="true" />{/if}
								</label>
							{/each}
						</div>
						{#if codingTools.includes('custom')}
							<div class="custom-tool" transition:slide={{ duration: 280 }}>
								<div class="field"><label for="custom-coding-tool">Individuelles Coding Tool</label><input id="custom-coding-tool" maxlength="160" placeholder="z. B. internes Agent Framework" bind:value={customCodingTool} /></div>
							</div>
						{/if}
					</div>
				{/if}
			</section>

			<section class="config-section" use:reveal><h2>Demo setup</h2><div class="option-grid demo-setup-grid">
				<label class:selected={equipment !== 'none'} class="choice"><input type="radio" name="equipment" checked={equipment !== 'none'} onchange={() => (equipment = 'projector')} /><b>Projector / Display</b><small>Großer Screen vorhanden.</small></label>
				<label class:selected={equipment === 'none'} class="choice"><input type="radio" name="equipment" checked={equipment === 'none'} onchange={() => (equipment = 'none')} /><b>Kein Screen</b><small>Bringen wir mit.</small></label>
			</div></section>

			<section class="config-section" use:reveal><h2>Mittagessen</h2>
				<div class="option-grid lunch-grid">
					<label class:selected={lunch === 'pizza'} class="choice"><input type="radio" name="lunch" checked={lunch === 'pizza'} onchange={() => (lunch = 'pizza')} /><b>Pizza</b><small>Der Hackathon-Klassiker.</small><span class="choice-price">Inklusive</span></label>
					<label class:selected={lunch === 'custom'} class="choice"><input type="radio" name="lunch" checked={lunch === 'custom'} onchange={() => (lunch = 'custom')} /><b>Custom</b><small>Catering nach Wunsch.</small><span class="choice-price">+ 500 €</span></label>
					<label class:selected={lunch === 'none'} class="choice"><input type="radio" name="lunch" checked={lunch === 'none'} onchange={() => (lunch = 'none')} /><b>No lunch</b><small>Ohne Mahlzeit.</small><span class="choice-price">− 500 €</span></label>
					<label class:selected={lunch === 'self-organized'} class="choice"><input type="radio" name="lunch" checked={lunch === 'self-organized'} onchange={() => (lunch = 'self-organized')} /><b>Selbstorganisiert</b><small>Sie kümmern sich um das Essen.</small><span class="choice-price">− 500 €</span></label>
				</div>
				{#if lunch === 'custom'}<div class="custom-lunch" transition:slide={{ duration: 300 }}><div class="field"><label for="custom-lunch">Catering-Wunsch</label><input id="custom-lunch" maxlength="160" placeholder="z. B. vegetarische Bowls oder Buffet" bind:value={customLunch} /></div></div>{/if}
				<p class="section-note">{lunch === 'none' ? 'Keine Mahlzeit eingeplant.' : lunch === 'self-organized' ? 'Das Catering wird von Ihnen organisiert.' : 'Wir organisieren das Catering für Sie.'}</p>
			</section>

			<section class="config-section" use:reveal>
				<h2>Veranstaltungsadresse</h2>
				<div class="field-grid">
					<div class="field full address-search-wrap"><label for="address-search">Adresse suchen</label><input id="address-search" autocomplete="off" aria-describedby={searchStatus === 'idle' ? undefined : 'address-search-status'} aria-autocomplete="list" aria-controls="address-suggestions" placeholder="Straße, Ort oder Unternehmen" bind:value={addressQuery} oninput={updateSuggestions} />{#if suggestions.length}<ul id="address-suggestions" class="suggestions">{#each suggestions as suggestion}<li><button type="button" onclick={() => selectSuggestion(suggestion)}>{suggestion.label}</button></li>{/each}</ul>{/if}{#if searchStatus !== 'idle'}<p id="address-search-status" class="helper" aria-live="polite">{searchStatus === 'loading' ? 'Adressen werden gesucht …' : searchStatus === 'empty' ? 'Keine passende Adresse gefunden. Bitte unten manuell eingeben.' : 'Adresssuche derzeit nicht verfügbar. Bitte unten manuell eingeben.'}</p>{/if}</div>
					<div class="field full"><label for="street">Straße und Hausnummer</label><input id="street" autocomplete="street-address" bind:value={address.street} /></div>
					<div class="field"><label for="postal">Postleitzahl</label><input id="postal" inputmode="numeric" autocomplete="postal-code" bind:value={address.postalCode} /></div>
					<div class="field"><label for="city">Ort</label><input id="city" autocomplete="address-level2" bind:value={address.city} /></div>
				</div>
			</section>

			<section class="config-section" use:reveal><h2>Veranstaltungsdatum</h2><EventDateCalendar value={preferredEventDate} minValue={minEventDate} maxValue={maxEventDate} onchange={(date) => (preferredEventDate = date)} /></section>

			<section class="config-section" use:reveal><h2>Kontakt</h2><div class="field-grid">
				<div class="field full"><label for="company">Unternehmen</label><input id="company" autocomplete="organization" bind:value={companyName} /></div>
				<div class="field full"><label for="contact">Ansprechperson</label><input id="contact" autocomplete="name" bind:value={contactName} /></div>
				<div class="field full"><label for="email">E-Mail-Adresse</label><input id="email" type="email" autocomplete="email" bind:value={email} /></div>
				<div class="field full"><label for="phone">Telefonnummer</label><input id="phone" type="tel" autocomplete="tel" bind:value={phone} /></div>
			</div></section>

			<section class="config-section" use:reveal><h2>60 Min. Vorbereitungsgespräch</h2>
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

			<section class="config-section" use:reveal><div class="summary-box overview-box" bind:this={overviewCard}>
				<div class="summary-row"><Users size={18} aria-hidden="true" /><span><small>Team</small><AnimatedValue value={`Bis ${capacity} Personen`} /></span><b><AnimatedValue value={formatPrice(price.basePrice)} /></b></div>
				<div class="summary-row"><MapPin size={18} aria-hidden="true" /><span><small>Location</small><AnimatedValue value={venueProvided ? 'Wir kommen zu Ihnen' : 'Location organisiert'} /></span><b><AnimatedValue value={venueProvided ? 'Inklusive' : formatPrice(price.venueSurcharge)} /></b></div>
				{#if toolProvision}<div class="summary-row"><Code2 size={18} aria-hidden="true" /><span><small>{toolProvision === 'needed' ? 'Wir brauchen Tools für den Tag' : 'Wir haben bereits Tools'}</small><AnimatedValue value={codingToolLabels.join(', ') || 'Noch keine Tools ausgewählt'} /></span><b><AnimatedValue value={price.toolsAdjustment ? `+ ${formatPrice(price.toolsAdjustment)}` : 'Inklusive'} /></b></div>{/if}
				<div class="summary-row"><Monitor size={18} aria-hidden="true" /><span><small>Demo Setup</small><AnimatedValue value={equipmentLabel} /></span><b>Inklusive</b></div>
				{#if preferredEventDate}<div class="summary-row"><CalendarDays size={18} aria-hidden="true" /><span><small>Event Date</small><AnimatedValue value={formatDate(preferredEventDate)} /></span><b>Geplant</b></div>{/if}
				{#if consultationSlot}<div class="summary-row"><Clock3 size={18} aria-hidden="true" /><span><small>Prep Call</small><AnimatedValue value={`${formatDate(consultationSlot, true)} Uhr`} /></span><b>Gebucht</b></div>{/if}
				<div class="summary-row"><LunchIcon size={18} aria-hidden="true" /><span><small>Lunch</small><AnimatedValue value={lunchPreviewLabel} /></span><b><AnimatedValue value={price.lunchAdjustment ? `${price.lunchAdjustment > 0 ? '+' : '−'} ${formatPrice(Math.abs(price.lunchAdjustment))}` : 'Inklusive'} /></b></div>
				<div class="summary-row"><Award size={18} aria-hidden="true" /><span><small>Winner Poster</small>Auszeichnung für das Gewinnerteam</span><b>Inklusive</b></div>
				<div class="summary-row"><Camera size={18} aria-hidden="true" /><span><small>Event-Fotos</small>Dokumentation des Tages</span><b>Inklusive</b></div>
				<div class="summary-row"><Cookie size={18} aria-hidden="true" /><span><small>Snacks</small>Cookies</span><b>Inklusive</b></div>
				<div class="summary-row"><Plane size={18} aria-hidden="true" /><span><small>Anreise</small>Innerhalb Deutschlands</span><b>Inklusive</b></div>
				<div class="summary-row total"><ReceiptEuro size={20} aria-hidden="true" /><span>Gesamt</span><b><AnimatedValue value={`${formatPrice(price.totalPrice)} netto`} /></b></div>
			</div>
			{#if errors.length}<div class="error-box" role="alert"><ul>{#each errors as error}<li>{error}</li>{/each}</ul></div>{/if}
			<button class="button-primary" style="width:100%;margin-top:18px" type="submit" disabled={submitting || slotsLoading}>{submitting ? 'Wird gebucht …' : 'Erstgespräch buchen'}</button>
			<SharePlanButton getUrl={getShareUrl} />
			</section>
		</form>
	</div>
</div>
