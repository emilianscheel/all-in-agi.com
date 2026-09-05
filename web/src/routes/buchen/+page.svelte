<script lang="ts">
    import { browser } from "$app/environment";
    import { goto, replaceState } from "$app/navigation";
    import { onDestroy, onMount } from "svelte";
    import {
        Award,
        CalendarDays,
        Clock3,
        Code2,
        Cookie,
		LocateFixed,
		LoaderCircle,
        MapPin,
        Monitor,
        Pizza,
        Plane,
        ReceiptEuro,
        Users,
    } from "lucide-svelte";
    import {
        PROVIDED_CODING_TOOLS,
        formatDate,
        formatPrice,
        getPrice,
        selectedCodingToolLabels,
        validateInquiryConfiguration,
        type BookingConfiguration,
        type Capacity,
        type CodingTool,
        type Equipment,
        type EventAddress,
        type Lunch,
        type ToolProvision,
        type DeviceProvision,
    } from "$lib/booking";
    import { bookingOverviewRows, type BookingOverviewRowId } from "$lib/booking-overview";
    import { eventDateBounds } from "$lib/event-date";
    import { photonFeatureLabel, normalizePhotonAddress, type PhotonFeature } from "$lib/photon";
	import { addressAtCoordinates, fetchAddressSuggestions, reverseGeocode, type LocationCoordinates } from "$lib/geocoding";
    import AnimatedValue from "$lib/AnimatedValue.svelte";
    import EventDateTimeEditor from "$lib/EventDateTimeEditor.svelte";
    import { formatEventTimeRange } from "$lib/event-time";
    import type { SharedPlanV5 } from "$lib/shared-plan";
    import { reveal } from "$lib/motion";
    import MapPreview from "$lib/MapPreview.svelte";
    import SharePlanButton from "$lib/SharePlanButton.svelte";
    import AddressEditor from "$lib/config/AddressEditor.svelte";
    import ConfigOptionCards, { type OptionValues } from "$lib/config/ConfigOptionCards.svelte";
    import ContactFields from "$lib/config/ContactFields.svelte";
    import MessageField from "$lib/config/MessageField.svelte";
    import PrepCallEditor from "$lib/config/PrepCallEditor.svelte";
    import SeoHead from "$lib/SeoHead.svelte";
    import { trackAnalyticsEvent } from "$lib/analytics";
    import { page } from "$app/state";
    import { localizedPath, stripLocale, type Locale } from "$lib/i18n";

    let locale = $derived((page.data.locale ?? 'de') as Locale);

    let capacity = $state<Capacity>(15);
    const venueProvided = true;
    let equipment = $state<Equipment>("projector");
    const lunch: Lunch = "pizza";
    const customLunch = "";
    let toolProvision = $state<ToolProvision | null>(null);
    let codingTools = $state<CodingTool[]>([]);
    let customCodingTool = $state("");
    const deviceProvision: DeviceProvision = "existing";
    const deviceCount = 0;
    const eventPhotos = true;
    let companyName = $state("");
    let contactName = $state("");
    let email = $state("");
    let phone = $state("");
    let message = $state("");
    let eventStart = $state("");
    let eventEnd = $state("");
    let consultationSlot = $state("");
    let consultationMode = $state<"quick" | "custom">("quick");
    let customConsultationDate = $state("");
    let address = $state<EventAddress>({
        label: "",
        street: "",
        postalCode: "",
        city: "",
        country: "Deutschland",
    });
    let addressQuery = $state("");
    let suggestions = $state<Array<{ label: string; feature: PhotonFeature }>>([]);
    let searchStatus = $state<"idle" | "loading" | "empty" | "error">("idle");
    let addressAbort: AbortController | undefined;
	let locationAbort: AbortController | undefined;
    let addressDebounce: ReturnType<typeof setTimeout> | undefined;
	let locationLoading = $state(false);
	let locationMessage = $state("");
	let geolocationRequest = 0;
    let planAbort: AbortController | undefined;
    let planDebounce: ReturnType<typeof setTimeout> | undefined;
    let planHydrated = $state(false);
    let planToken = $state("");
    let planError = $state("");
    let slotsLoading = $state(true);
    let availabilityKey = $state(0);
    let eventSlotsLoading = $state(true);
    let eventAvailabilityKey = $state(0);
    let submitting = $state(false);
    let errors = $state<string[]>([]);
	const analyticsMilestones = new Set<string>();
    let eventCard: HTMLElement;
    let overviewCard: HTMLDivElement;
    let previewOpacity = $state(1);
    let mapHeight = $state<number | undefined>();
    let mapExpandedHeight = $state<number | undefined>();
    let previewFadeFrame: number | undefined;
    let reducedMotion: MediaQueryList | undefined;

    let price = $derived(getPrice(capacity, true, "pizza", toolProvision, "existing", 0));
    let equipmentLabel = $derived(equipment === "none" ? (locale === 'en' ? "Provided by us" : "Wird von uns gestellt") : "Projector / Display");
    let codingToolLabels = $derived(selectedCodingToolLabels({ codingTools, customCodingTool }));
    let toolsPreviewLabel = $derived(
        toolProvision ? codingToolLabels.join(", ") || (locale === 'en' ? "None selected yet" : "Noch keine ausgewählt") : (locale === 'en' ? "Not set" : "Noch offen"),
    );
    const lunchPreviewLabel = "Pizza";
    const LunchIcon = Pizza;
    let optionValues = $derived<OptionValues>({
        capacity,
        venueProvided,
        equipment,
        lunch,
        customLunch,
        toolProvision,
        codingTools,
        customCodingTool,
        deviceProvision,
        deviceCount,
    });
    let overviewRows = $derived(bookingOverviewRows(buildConfiguration()));

    const { min: minEventDate, max: maxEventDate } = eventDateBounds();

    function updateOptionValues(patch: Partial<OptionValues>) {
        if (patch.capacity !== undefined) capacity = patch.capacity;
        if (patch.equipment !== undefined) equipment = patch.equipment;
        if (patch.toolProvision !== undefined) toolProvision = patch.toolProvision;
        if (patch.codingTools !== undefined) codingTools = patch.codingTools;
        if (patch.customCodingTool !== undefined) customCodingTool = patch.customCodingTool;
    }

	function trackBookingMilestone(step: string) {
		if (!analyticsMilestones.size) trackAnalyticsEvent("booking_started");
		if (analyticsMilestones.has(step)) return;
		analyticsMilestones.add(step);
		trackAnalyticsEvent("booking_milestone", { step });
	}

    function updateSuggestions() {
        if (addressDebounce) clearTimeout(addressDebounce);
        addressAbort?.abort();
        const query = addressQuery.trim();
        if (query.length < 3) {
            suggestions = [];
            searchStatus = "idle";
            return;
        }
        addressDebounce = setTimeout(() => searchAddress(query), 250);
    }

    async function searchAddress(query: string) {
        addressAbort?.abort();
        addressAbort = new AbortController();
        searchStatus = "loading";
        try {
			const features = await fetchAddressSuggestions(fetch, query, locale, addressAbort.signal);
            suggestions = features
                .map((feature) => ({ label: photonFeatureLabel(feature), feature }))
                .filter((suggestion) => suggestion.label);
            searchStatus = suggestions.length ? "idle" : "empty";
        } catch (error) {
            if ((error as Error).name !== "AbortError") {
                suggestions = [];
                searchStatus = "error";
            }
        }
    }

    function selectSuggestion(suggestion: { label: string; feature: PhotonFeature }) {
		cancelLocationLookup();
        addressQuery = suggestion.label;
        suggestions = [];
        searchStatus = "idle";
        address = normalizePhotonAddress(suggestion.feature);
    }

	function addressLabel(value: EventAddress) {
		return value.label || [value.street, [value.postalCode, value.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
	}

	function updateAddress(value: EventAddress) {
		cancelLocationLookup();
		address = value;
		addressQuery = addressLabel(value);
	}

	function cancelLocationLookup() {
		geolocationRequest += 1;
		locationAbort?.abort();
		locationLoading = false;
		locationMessage = '';
	}

	async function selectCoordinates(coordinates: LocationCoordinates) {
		geolocationRequest += 1;
		locationAbort?.abort();
		const controller = new AbortController();
		locationAbort = controller;
		locationLoading = true;
		locationMessage = locale === 'en' ? 'Determining address …' : 'Adresse wird ermittelt …';
		suggestions = [];
		searchStatus = 'idle';
		address = addressAtCoordinates(coordinates);
		addressQuery = '';
		try {
			const resolved = await reverseGeocode(fetch, coordinates, locale, controller.signal);
			if (!resolved) throw new Error(locale === 'en' ? 'No German address was found for this location.' : 'Für diesen Standort wurde keine deutsche Adresse gefunden.');
			address = { ...resolved, ...coordinates };
			addressQuery = addressLabel(address);
			locationMessage = '';
			trackBookingMilestone("event_location");
		} catch (error) {
			if ((error as Error).name === 'AbortError') return;
			locationMessage = error instanceof Error ? error.message : (locale === 'en' ? 'The address could not be determined. Please enter it below.' : 'Die Adresse konnte nicht ermittelt werden. Bitte geben Sie sie unten ein.');
		} finally {
			if (!controller.signal.aborted) locationLoading = false;
		}
	}

	function useCurrentLocation() {
		if (!navigator.geolocation) {
			locationMessage = locale === 'en' ? 'Your browser does not support location access.' : 'Ihr Browser unterstützt keine Standortabfrage.';
			return;
		}
		locationLoading = true;
		locationMessage = locale === 'en' ? 'Requesting your location …' : 'Standort wird abgefragt …';
		const request = ++geolocationRequest;
		navigator.geolocation.getCurrentPosition(
			(position) => {
				if (request !== geolocationRequest) return;
				selectCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude });
			},
			(error) => {
				if (request !== geolocationRequest) return;
				locationLoading = false;
				locationMessage = error.code === error.PERMISSION_DENIED
					? (locale === 'en' ? 'Location access was denied. You can search or choose a point on the map.' : 'Der Standortzugriff wurde abgelehnt. Sie können suchen oder einen Punkt auf der Karte wählen.')
					: (locale === 'en' ? 'Your location could not be determined. Please try again.' : 'Ihr Standort konnte nicht ermittelt werden. Bitte versuchen Sie es erneut.');
			},
			{ enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
		);
	}

    function buildConfiguration(): BookingConfiguration {
        return {
			locale,
            capacity,
            venueProvided,
            equipment,
            lunch,
            customLunch: lunch === "custom" ? customLunch : "",
            toolProvision,
            codingTools,
            customCodingTool: codingTools.includes("custom") ? customCodingTool : "",
            deviceProvision,
            deviceCount,
            eventPhotos,
            companyName,
            contactName,
            email,
            phone,
            message,
            address,
            eventStart,
            eventEnd,
            consultationSlot,
        };
    }

    function overviewRow(id: BookingOverviewRowId) {
        return overviewRows.find((row) => row.id === id)!;
    }

    function buildSharedPlan(): SharedPlanV5 {
        return { v: 5, ...buildConfiguration(), consultationMode, customConsultationDate };
    }

    function applySharedPlan(plan: SharedPlanV5) {
        capacity = plan.capacity;
        equipment = plan.equipment;
        toolProvision = plan.toolProvision;
        codingTools =
            plan.toolProvision === "needed"
                ? plan.codingTools.filter((tool) => PROVIDED_CODING_TOOLS.includes(tool))
                : plan.codingTools;
        customCodingTool = plan.toolProvision === "needed" ? "" : plan.customCodingTool;
        companyName = plan.companyName;
        contactName = plan.contactName;
        email = plan.email;
        phone = plan.phone;
        message = plan.message;
        address = plan.address;
        addressQuery =
            plan.address.label ||
            [plan.address.street, plan.address.city].filter(Boolean).join(", ");
        eventStart = plan.eventStart;
        eventEnd = plan.eventEnd;
        consultationSlot = plan.consultationSlot;
        consultationMode = plan.consultationMode;
        customConsultationDate = plan.customConsultationDate;
    }

    async function encodePlan(plan = buildSharedPlan(), updateUrl = true) {
        if (!browser) return "";
        planAbort?.abort();
        planAbort = new AbortController();
        const response = await fetch("/api/plan-token", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(plan),
            signal: planAbort.signal,
        });
        const result = await response.json();
        if (!response.ok)
            throw new Error(result.message ?? "Plan-Link konnte nicht erstellt werden.");
        planToken = result.token;
		const path = localizedPath(locale, `/buchen/${planToken}`);
        if (updateUrl) replaceState(path, {});
        return `${location.origin}${path}`;
    }

    function schedulePlanUrl(plan: SharedPlanV5) {
        if (!browser || !planHydrated) return;
        if (planDebounce) clearTimeout(planDebounce);
        planDebounce = setTimeout(
            () =>
                encodePlan(plan).catch((error) => {
                    if ((error as Error).name !== "AbortError")
                        planError = (error as Error).message;
                }),
            400,
        );
    }

    async function hydratePlanFromUrl() {
		const token = stripLocale(location.pathname).pathname.match(/^\/go\/([^/]+)$/)?.[1]
			?? stripLocale(location.pathname).pathname.match(/^\/buchen\/([^/]+)$/)?.[1];
        if (!token) return;
        const response = await fetch(`/api/plan-token/${encodeURIComponent(token)}`);
        const result = await response.json();
        if (!response.ok) {
            planError = result.message ?? "Ungültiger Plan-Link.";
            return;
        }
        planToken = token;
        applySharedPlan(result.plan);
    }

    async function getShareUrl() {
        if (planDebounce) clearTimeout(planDebounce);
        return encodePlan(buildSharedPlan());
    }

    $effect(() => {
        schedulePlanUrl(buildSharedPlan());
    });

    async function submitBooking() {
        const config = buildConfiguration();
        errors = validateInquiryConfiguration(config);
        if (errors.length) return;
		trackAnalyticsEvent("booking_submission_valid");
        submitting = true;
        try {
            const response = await fetch("/api/book", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(config),
            });
            const result = await response.json();
            if (!response.ok) {
                if (response.status === 409 && result.field === "prep-call") {
                    consultationSlot = "";
                    customConsultationDate = "";
                    consultationMode = "quick";
                    availabilityKey += 1;
                }
                if (response.status === 409 && result.field === "hackathon") {
                    eventAvailabilityKey += 1;
                }
                throw new Error(result.message ?? "Die Buchung konnte nicht abgeschlossen werden.");
            }
            const planUrl = await getShareUrl();
            if (browser)
                sessionStorage.setItem(
                    "all-in-agi-booking",
                    JSON.stringify({
                        ...config,
                        ...price,
                        prepCallBooking: result.prepCallBooking,
                        hackathonBooking: result.hackathonBooking,
                        planUrl,
                        hackathonId: result.hackathonId,
                        detailUrl: result.detailUrl,
                    }),
                );
			trackAnalyticsEvent("booking_completed");
			await goto(localizedPath(locale, "/buchen/erfolg"));
        } catch (error) {
            errors = [
                error instanceof Error
                    ? error.message
                    : "Die Buchung konnte nicht abgeschlossen werden.",
            ];
        } finally {
            submitting = false;
        }
    }

    function updatePreviewFade() {
        previewFadeFrame = undefined;
        const expandedHeight = Math.max(646, Math.min(window.innerHeight - 100, 916));
        const collapsedHeight = Math.min(
            expandedHeight,
            Math.max(570, Math.min(window.innerHeight * 0.7, 720)) + 50,
        );
        const expansionStartScroll = 0;
        const expansionDistance = expandedHeight - collapsedHeight;
        const expansionEndScroll = expansionStartScroll + expansionDistance;
        const expansionProgress =
            expansionDistance === 0
                ? 1
                : Math.max(
                      0,
                      Math.min(
                          1,
                          (window.scrollY - expansionStartScroll) /
                              (expansionEndScroll - expansionStartScroll),
                      ),
                  );
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
        reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        window.addEventListener("scroll", schedulePreviewFade, { passive: true });
        window.addEventListener("resize", schedulePreviewFade, { passive: true });
        reducedMotion.addEventListener("change", schedulePreviewFade);
        schedulePreviewFade();
        await hydratePlanFromUrl();
        planHydrated = true;
        schedulePlanUrl(buildSharedPlan());
    });
    onDestroy(() => {
        if (!browser) return;
        if (addressDebounce) clearTimeout(addressDebounce);
        if (planDebounce) clearTimeout(planDebounce);
        if (previewFadeFrame !== undefined) cancelAnimationFrame(previewFadeFrame);
        window.removeEventListener("scroll", schedulePreviewFade);
        window.removeEventListener("resize", schedulePreviewFade);
        reducedMotion?.removeEventListener("change", schedulePreviewFade);
        addressAbort?.abort();
		locationAbort?.abort();
        planAbort?.abort();
    });
</script>

<SeoHead
	title={locale === 'en' ? 'Plan an Agentic Engineering Hackathon | ALL IN AGI' : 'Agentic Engineering Hackathon planen | ALL IN AGI'}
	description={locale === 'en' ? 'Configure your team size, location, equipment, and preferred date for a facilitated Agentic Engineering Hackathon.' : 'Konfigurieren Sie Teamgröße, Location, Ausstattung und Wunschtermin für Ihren moderierten Agentic Engineering Hackathon.'}
    path="/buchen"
	{locale}
/>

<div class="config-page">
    <header class="config-intro">
		<div use:reveal><h1>{locale === 'en' ? 'Plan a hackathon at your company' : 'Hackathon bei Ihnen planen'}</h1></div>
		<div class="price-pill">{locale === 'en' ? 'From €3,500 net · Travel included' : 'Ab 3.500 € netto · Anreise inklusive'}</div>
    </header>
    {#if planError}<div class="plan-error" role="alert">
			{planError} <a href={localizedPath(locale, '/buchen')}>{locale === 'en' ? 'Start a new plan' : 'Neuen Plan starten'}</a>
        </div>{/if}

    <div class="config-layout">
        <div
            class="preview-column"
            style={mapHeight === undefined || mapExpandedHeight === undefined
                ? undefined
                : `--map-height:${mapHeight}px;--map-expanded-height:${mapExpandedHeight}px`}
        >
			<MapPreview latitude={address.latitude} longitude={address.longitude} onlocationselect={selectCoordinates} {locale}>
                <div class="map-address-search">
                    <div class="field address-search-wrap">
                        <label class="visually-hidden" for="map-address-search"
							>{locale === 'en' ? 'Search address' : 'Adresse suchen'}</label
                        >
						<div class="map-search-control">
							<input
								id="map-address-search"
								autocomplete="off"
								aria-describedby={searchStatus === "idle" && !locationMessage ? undefined : "map-address-search-status"}
								aria-autocomplete="list"
								aria-controls="map-address-suggestions"
								placeholder={locale === 'en' ? 'Street, city, or company' : 'Straße, Ort oder Unternehmen'}
								bind:value={addressQuery}
								oninput={() => { cancelLocationLookup(); updateSuggestions(); }}
							/>
							<button
								type="button"
								class="map-location-button"
								disabled={locationLoading}
								aria-label={locale === 'en' ? 'Use my current location' : 'Meinen aktuellen Standort verwenden'}
								title={locale === 'en' ? 'Use my current location' : 'Meinen aktuellen Standort verwenden'}
								onclick={useCurrentLocation}
							><LocateFixed size={20} strokeWidth={2} aria-hidden="true" /></button
							>
						</div>
                        {#if suggestions.length}
                            <ul id="map-address-suggestions" class="suggestions">
                                {#each suggestions as suggestion}<li>
                                        <button
                                            type="button"
                                            onclick={() => selectSuggestion(suggestion)}
                                            >{suggestion.label}</button
                                        >
                                    </li>{/each}
                            </ul>
						{:else if searchStatus === "loading"}
							<div
								id="map-address-search-status"
								class="suggestions search-loading-card"
								role="status"
								aria-live="polite"
							>
								<LoaderCircle class="search-loading-icon" size={28} strokeWidth={1.8} aria-hidden="true" />
								<span class="visually-hidden">{locale === 'en' ? 'Searching addresses …' : 'Adressen werden gesucht …'}</span>
							</div>
                        {/if}
						{#if locationMessage || searchStatus === "empty" || searchStatus === "error"}
                            <p id="map-address-search-status" class="helper" aria-live="polite">
								{locationMessage || (locale === 'en'
									? (searchStatus === "empty" ? "No matching address found. Please enter it manually below." : "Address search is unavailable. Please enter it manually below.")
									: (searchStatus === "empty" ? "Keine passende Adresse gefunden. Bitte unten manuell eingeben." : "Adresssuche derzeit nicht verfügbar. Bitte unten manuell eingeben."))}
                            </p>
                        {/if}
                    </div>
                </div>
                <article
                    class="event-card"
                    bind:this={eventCard}
                    style:opacity={previewOpacity}
                    aria-label={locale === 'en' ? 'Configuration preview' : 'Konfigurationsvorschau'}
                    aria-hidden={previewOpacity <= 0.01}
                >
                    <div class="event-card-top">
						{#if companyName.trim()}<h2>{companyName.trim()}</h2>{/if}
                        <div class="event-card-price">
							<AnimatedValue value={formatPrice(price.totalPrice, locale)} />
                        </div>
                    </div>
                    <div class="event-details">
                        <div
                            class:event-detail-unselected={!eventStart}
                            class="event-detail"
                            aria-hidden={!eventStart}
                        >
                            <small>Event Date</small><b
                                ><AnimatedValue
									value={formatEventTimeRange(eventStart, eventEnd, locale)}
                                    active={Boolean(eventStart)}
                                /></b
                            >
                        </div>
                        <div class="event-detail">
                            <small>Team</small><b
								><AnimatedValue value={locale === 'en' ? `Up to ${capacity} people` : `Bis ${capacity} Personen`} /></b
                            >
                        </div>
                        <div class="event-detail">
                            <small>Location</small><b
                                ><AnimatedValue
									value={venueProvided ? (locale === 'en' ? 'Your venue' : "Eigener Raum") : (locale === 'en' ? 'Organized by us' : "Von uns organisiert")}
                                /></b
                            >
                        </div>
                        <div
                            class:event-detail-unselected={!toolProvision ||
                                !codingToolLabels.length}
                            class="event-detail"
                            aria-hidden={!toolProvision || !codingToolLabels.length}
                        >
                            <small>Tools</small><b
                                ><AnimatedValue
                                    value={toolsPreviewLabel}
                                    active={Boolean(toolProvision && codingToolLabels.length)}
                                /></b
                            >
                        </div>
                        <div class="event-detail">
							<small>Devices</small><b>{locale === 'en' ? 'Your devices' : 'Eigene Geräte'}</b>
                        </div>
                        <div class="event-detail">
                            <small>Screen</small><b><AnimatedValue value={equipmentLabel} /></b>
                        </div>
                        <div class="event-detail">
                            <small>Lunch</small><b><AnimatedValue value={lunchPreviewLabel} /></b>
                        </div>
                        <div
                            class:event-detail-unselected={!consultationSlot}
                            class="event-detail"
                            aria-hidden={!consultationSlot}
                        >
                            <small>Prep Call</small><b
                                ><AnimatedValue
                                    value={consultationSlot
										? `${formatDate(consultationSlot, true, locale)}${locale === 'en' ? '' : ' Uhr'}`
										: (locale === 'en' ? 'Not set' : "Noch offen")}
                                    active={Boolean(consultationSlot)}
                                /></b
                            >
                        </div>
                    </div>
                </article>
            </MapPreview>
        </div>

        <form
            class="config-form"
            onsubmit={(event) => {
                event.preventDefault();
                submitBooking();
            }}
            novalidate
        >
            <section class="config-section" use:reveal>
				<h2>{locale === 'en' ? 'Team size' : 'Teamgröße'}</h2>
                <ConfigOptionCards
                    kind="capacity"
					{locale}
                    values={optionValues}
                    onchange={(value) => { updateOptionValues(value); trackBookingMilestone("team_size"); }}
                />
            </section>

            <section class="config-section tools-section" use:reveal>
                <h2>Tools</h2>
                <ConfigOptionCards
                    kind="tools"
					{locale}
                    values={optionValues}
                    onchange={(value) => { updateOptionValues(value); trackBookingMilestone("tools"); }}
                />
            </section>

            <section class="config-section" use:reveal>
                <h2>Demo setup</h2>
                <ConfigOptionCards
                    kind="equipment"
					{locale}
                    values={optionValues}
                    onchange={(value) => { updateOptionValues(value); trackBookingMilestone("demo_setup"); }}
                />
            </section>

            <section class="config-section" use:reveal>
				<h2>{locale === 'en' ? 'Event address' : 'Veranstaltungsadresse'}</h2>
                <AddressEditor
                    value={address}
					onchange={(value) => { updateAddress(value); trackBookingMilestone("event_location"); }}
                    idPrefix="booking-address"
                    searchArea={false}
					{locale}
                />
            </section>

            <section class="config-section" use:reveal>
				<h2>{locale === 'en' ? 'Event date and time' : 'Veranstaltungsdatum und Uhrzeit'}</h2>
                {#key eventAvailabilityKey}
                    <EventDateTimeEditor
                        {eventStart}
                        {eventEnd}
                        minValue={minEventDate}
                        maxValue={maxEventDate}
						{locale}
                        onloadingchange={(value) => (eventSlotsLoading = value)}
                        onchange={(value) => { ({ eventStart, eventEnd } = value); trackBookingMilestone("event_schedule"); }}
                    />
                {/key}
            </section>

            <section class="config-section" use:reveal>
                <h2>{locale === 'en' ? 'Contact' : 'Kontakt'}</h2>
                <ContactFields
                    {companyName}
                    {contactName}
                    {email}
                    {phone}
                    onchange={(patch) => {
                        if (patch.companyName !== undefined) companyName = patch.companyName;
                        if (patch.contactName !== undefined) contactName = patch.contactName;
                        if (patch.email !== undefined) email = patch.email;
                        if (patch.phone !== undefined) phone = patch.phone;
						trackBookingMilestone("contact");
                    }}
                    idPrefix="booking-contact"
					{locale}
                />
            </section>

            <section class="config-section" use:reveal>
				<h2>{locale === 'en' ? '30-minute preparation call' : '30 Min. Vorbereitungsgespräch'}</h2>
                {#key availabilityKey}
                    <PrepCallEditor
                        value={consultationSlot}
                        mode={consultationMode}
                        customDate={customConsultationDate}
                        onchange={(value) => { consultationSlot = value; trackBookingMilestone("prep_call"); }}
                        onmodechange={(value) => (consultationMode = value)}
                        oncustomdatechange={(value) => (customConsultationDate = value)}
                        onloadingchange={(value) => (slotsLoading = value)}
                        clearUnavailableValue
						{locale}
                    />
                {/key}
            </section>

            <section class="config-section" use:reveal>
				<h2>{locale === 'en' ? 'Your message' : 'Ihre Nachricht'}</h2>
                <MessageField
                    value={message}
                    onchange={(value) => { message = value; trackBookingMilestone("message"); }}
                    id="booking-message"
					{locale}
                />
            </section>

            <section class="config-section" use:reveal>
                <div class="summary-box overview-box" bind:this={overviewCard}>
                    <div class="summary-row">
                        <Users size={18} aria-hidden="true" /><span
                            ><small>{overviewRow("team").label}</small><AnimatedValue
                                value={overviewRow("team").value}
                            /></span
                        ><b><AnimatedValue value={overviewRow("team").status} /></b>
                    </div>
                    <div class="summary-row">
                        <MapPin size={18} aria-hidden="true" /><span
                            ><small>{overviewRow("location").label}</small><AnimatedValue
                                value={overviewRow("location").value}
                            /></span
                        ><b><AnimatedValue value={overviewRow("location").status} /></b>
                    </div>
                    {#if toolProvision}<div class="summary-row">
                            <Code2 size={18} aria-hidden="true" /><span
                                ><small>{overviewRow("tools").label}</small><AnimatedValue
                                    value={overviewRow("tools").value}
                                /></span
                            ><b><AnimatedValue value={overviewRow("tools").status} /></b>
                        </div>{/if}
                    <div class="summary-row">
                        <Monitor size={18} aria-hidden="true" /><span
                            ><small>{overviewRow("equipment").label}</small><AnimatedValue
                                value={overviewRow("equipment").value}
                            /></span
                        ><b>{overviewRow("equipment").status}</b>
                    </div>
                    {#if eventStart}<div class="summary-row">
                            <CalendarDays size={18} aria-hidden="true" /><span
                                ><small>{overviewRow("event-date").label}</small><AnimatedValue
                                    value={overviewRow("event-date").value}
                                /></span
                            ><b>{overviewRow("event-date").status}</b>
                        </div>{/if}
                    {#if consultationSlot}<div class="summary-row">
                            <Clock3 size={18} aria-hidden="true" /><span
                                ><small>{overviewRow("prep-call").label}</small><AnimatedValue
                                    value={overviewRow("prep-call").value}
                                /></span
                            ><b>{overviewRow("prep-call").status}</b>
                        </div>{/if}
                    <div class="summary-row">
                        <LunchIcon size={18} aria-hidden="true" /><span
                            ><small>{overviewRow("lunch").label}</small><AnimatedValue
                                value={overviewRow("lunch").value}
                            /></span
                        ><b><AnimatedValue value={overviewRow("lunch").status} /></b>
                    </div>
                    <div class="summary-row">
                        <Award size={18} aria-hidden="true" /><span
                            ><small>{overviewRow("winner-poster").label}</small>{overviewRow(
                                "winner-poster",
                            ).value}</span
                        ><b>{overviewRow("winner-poster").status}</b>
                    </div>
                    <div class="summary-row">
                        <Cookie size={18} aria-hidden="true" /><span
                            ><small>{overviewRow("snacks").label}</small>{overviewRow("snacks")
                                .value}</span
                        ><b>{overviewRow("snacks").status}</b>
                    </div>
                    <div class="summary-row">
                        <Plane size={18} aria-hidden="true" /><span
                            ><small>{overviewRow("travel").label}</small>{overviewRow("travel")
                                .value}</span
                        ><b>{overviewRow("travel").status}</b>
                    </div>
                    <div class="summary-row total">
                        <ReceiptEuro size={20} aria-hidden="true" /><span
                            >{overviewRow("total").value}</span
                        ><b><AnimatedValue value={overviewRow("total").status} /></b>
                    </div>
                </div>
                {#if errors.length}<div class="error-box" role="alert">
                        <ul>
                            {#each errors as error}<li>{error}</li>{/each}
                        </ul>
                    </div>{/if}
                <div class="booking-submit-actions">
                    <button
                        class="button-primary"
                        type="submit"
                        disabled={submitting || slotsLoading || eventSlotsLoading}
						>{submitting ? (locale === 'en' ? 'Sending inquiry…' : "Anfrage wird gesendet …") : (locale === 'en' ? 'Reserve preparation call' : "Gespräch reservieren")}</button
                    >
					<SharePlanButton getUrl={getShareUrl} {locale} />
                </div>
            </section>
        </form>
    </div>
</div>
