<script lang="ts">
    import { browser } from "$app/environment";
    import { goto, replaceState } from "$app/navigation";
    import { onDestroy, onMount } from "svelte";
    import {
        Apple,
        Award,
        Beef,
        CakeSlice,
        CalendarDays,
        Camera,
        Clock3,
        Code2,
        Coffee,
        Cookie,
        Drumstick,
        Fish,
        IceCreamBowl,
		Laptop,
        MapPin,
        Monitor,
        Pizza,
        Plane,
        ReceiptEuro,
        Salad,
        Sandwich,
        Soup,
        Utensils,
        UtensilsCrossed,
        Users,
    } from "lucide-svelte";
    import {
        PROVIDED_CODING_TOOLS,
        formatDate,
        formatPrice,
        getPrice,
        selectedCodingToolLabels,
        validateConfiguration,
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
    import { photonFeatureLabel, normalizePhotonAddress, type PhotonFeature } from "$lib/photon";
    import { eventDateBounds } from "$lib/event-date";
    import AnimatedValue from "$lib/AnimatedValue.svelte";
    import EventDateTimeEditor from "$lib/EventDateTimeEditor.svelte";
    import { formatEventTimeRange } from "$lib/event-time";
    import { lunchIconKind } from "$lib/lunch-icon";
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

    let capacity = $state<Capacity>(15);
    let venueProvided = $state(true);
    let equipment = $state<Equipment>("projector");
    let lunch = $state<Lunch>("pizza");
    let customLunch = $state("");
    let toolProvision = $state<ToolProvision | null>(null);
    let codingTools = $state<CodingTool[]>([]);
    let customCodingTool = $state("");
    let deviceProvision = $state<DeviceProvision | null>(null);
    let deviceCount = $state(0);
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
    let addressDebounce: ReturnType<typeof setTimeout> | undefined;
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
    let eventCard: HTMLElement;
    let overviewCard: HTMLDivElement;
    let previewOpacity = $state(1);
    let mapHeight = $state<number | undefined>();
    let mapExpandedHeight = $state<number | undefined>();
    let previewFadeFrame: number | undefined;
    let reducedMotion: MediaQueryList | undefined;
    let debouncedCustomLunch = $state("");
    let customLunchDebounce: ReturnType<typeof setTimeout> | undefined;

    let price = $derived(getPrice(capacity, venueProvided, lunch, toolProvision, deviceProvision, deviceCount));
    let eventAddressLabel = $derived(
        [address.street, [address.postalCode, address.city].filter(Boolean).join(" ")]
            .filter(Boolean)
            .join(", "),
    );
    let equipmentLabel = $derived(equipment === "none" ? "Provided by us" : "Projector / Display");
    let codingToolLabels = $derived(selectedCodingToolLabels({ codingTools, customCodingTool }));
    let toolsPreviewLabel = $derived(
        toolProvision ? codingToolLabels.join(", ") || "Noch keine ausgewählt" : "Noch offen",
    );
    let lunchPreviewLabel = $derived(
        lunch === "pizza"
            ? "Pizza"
            : lunch === "custom"
              ? debouncedCustomLunch || "Custom Catering"
              : lunch === "self-organized"
                ? "Selbstorganisiert"
                : "Ohne Lunch",
    );
    let selectedLunchIconKind = $derived(lunchIconKind(lunch, debouncedCustomLunch));
    let LunchIcon = $derived(
        {
            pizza: Pizza,
            "utensils-crossed": UtensilsCrossed,
            utensils: Utensils,
            soup: Soup,
            salad: Salad,
            sandwich: Sandwich,
            fish: Fish,
            beef: Beef,
            drumstick: Drumstick,
            cake: CakeSlice,
            "ice-cream": IceCreamBowl,
            coffee: Coffee,
            apple: Apple,
        }[selectedLunchIconKind],
    );
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

    $effect(() => {
        const nextCustomLunch = customLunch.trim();
        if (customLunchDebounce) clearTimeout(customLunchDebounce);
        customLunchDebounce = setTimeout(() => {
            debouncedCustomLunch = nextCustomLunch;
        }, 280);
    });

    function updateOptionValues(patch: Partial<OptionValues>) {
        if (patch.capacity !== undefined) {
			capacity = patch.capacity;
			if (deviceProvision === 'needed' && deviceCount > capacity) deviceCount = capacity;
		}
        if (patch.venueProvided !== undefined) venueProvided = patch.venueProvided;
        if (patch.equipment !== undefined) equipment = patch.equipment;
        if (patch.lunch !== undefined) lunch = patch.lunch;
        if (patch.customLunch !== undefined) customLunch = patch.customLunch;
        if (patch.toolProvision !== undefined) toolProvision = patch.toolProvision;
        if (patch.codingTools !== undefined) codingTools = patch.codingTools;
        if (patch.customCodingTool !== undefined) customCodingTool = patch.customCodingTool;
		if (patch.deviceProvision !== undefined) deviceProvision = patch.deviceProvision;
		if (patch.deviceCount !== undefined) deviceCount = patch.deviceCount;
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
            const params = new URLSearchParams({
                q: query,
                countrycode: "DE",
                lang: "de",
                limit: "5",
            });
            const response = await fetch(`https://photon.komoot.io/api?${params}`, {
                signal: addressAbort.signal,
            });
            if (!response.ok) throw new Error("Adresssuche nicht verfügbar");
            const result = (await response.json()) as { features?: PhotonFeature[] };
            suggestions = (result.features ?? [])
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
        addressQuery = suggestion.label;
        suggestions = [];
        searchStatus = "idle";
        address = normalizePhotonAddress(suggestion.feature);
    }

    function buildConfiguration(): BookingConfiguration {
        return {
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
        venueProvided = plan.venueProvided;
        equipment = plan.equipment;
        lunch = plan.lunch;
        customLunch = plan.customLunch;
        toolProvision = plan.toolProvision;
        codingTools =
            plan.toolProvision === "needed"
                ? plan.codingTools.filter((tool) => PROVIDED_CODING_TOOLS.includes(tool))
                : plan.codingTools;
        customCodingTool = plan.toolProvision === "needed" ? "" : plan.customCodingTool;
		deviceProvision = plan.deviceProvision;
		deviceCount = plan.deviceCount;
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
        const path = `/buchen/${planToken}`;
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
        const token = location.pathname.match(/^\/buchen\/([^/]+)$/)?.[1];
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
        errors = validateConfiguration(config);
        if (errors.length) return;
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
            await goto("/buchen/erfolg");
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
        if (customLunchDebounce) clearTimeout(customLunchDebounce);
        if (previewFadeFrame !== undefined) cancelAnimationFrame(previewFadeFrame);
        window.removeEventListener("scroll", schedulePreviewFade);
        window.removeEventListener("resize", schedulePreviewFade);
        reducedMotion?.removeEventListener("change", schedulePreviewFade);
        addressAbort?.abort();
        planAbort?.abort();
    });
</script>

<SeoHead
    title="Agentic Engineering Hackathon planen | ALL IN AGI"
    description="Konfigurieren Sie Teamgröße, Location, Ausstattung und Wunschtermin für Ihren moderierten Agentic Engineering Hackathon."
    path="/buchen"
/>

<div class="config-page">
    <header class="config-intro">
        <div use:reveal><h1>Hackathon bei Ihnen planen</h1></div>
        <div class="price-pill">Ab 3.500 € netto · Anreise inklusive</div>
    </header>
    {#if planError}<div class="plan-error" role="alert">
            {planError} <a href="/buchen">Neuen Plan starten</a>
        </div>{/if}

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
                        <label class="visually-hidden" for="map-address-search"
                            >Adresse suchen</label
                        >
                        <input
                            id="map-address-search"
                            autocomplete="off"
                            aria-describedby={searchStatus === "idle"
                                ? undefined
                                : "map-address-search-status"}
                            aria-autocomplete="list"
                            aria-controls="map-address-suggestions"
                            placeholder="Straße, Ort oder Unternehmen"
                            bind:value={addressQuery}
                            oninput={updateSuggestions}
                        />
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
                        {/if}
                        {#if searchStatus !== "idle"}
                            <p id="map-address-search-status" class="helper" aria-live="polite">
                                {searchStatus === "loading"
                                    ? "Adressen werden gesucht …"
                                    : searchStatus === "empty"
                                      ? "Keine passende Adresse gefunden. Bitte unten manuell eingeben."
                                      : "Adresssuche derzeit nicht verfügbar. Bitte unten manuell eingeben."}
                            </p>
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
                    <div class="event-card-top">
                        <h2>{companyName.trim() || "Ihr Hackathon"}</h2>
                        <div class="event-card-price">
                            <AnimatedValue value={formatPrice(price.totalPrice)} />
                        </div>
                    </div>
                    {#if eventAddressLabel}<p class="event-address">{eventAddressLabel}</p>{/if}
                    <div class="event-details">
                        <div
                            class:event-detail-unselected={!eventStart}
                            class="event-detail"
                            aria-hidden={!eventStart}
                        >
                            <small>Event Date</small><b
                                ><AnimatedValue
                                    value={formatEventTimeRange(eventStart, eventEnd)}
                                    active={Boolean(eventStart)}
                                /></b
                            >
                        </div>
                        <div class="event-detail">
                            <small>Team</small><b
                                ><AnimatedValue value={`Bis ${capacity} Personen`} /></b
                            >
                        </div>
                        <div class="event-detail">
                            <small>Location</small><b
                                ><AnimatedValue
                                    value={venueProvided ? "Eigener Raum" : "Von uns organisiert"}
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
						<div class:event-detail-unselected={!deviceProvision} class="event-detail" aria-hidden={!deviceProvision}>
							<small>Devices</small><b><AnimatedValue value={deviceProvision === 'needed' ? `${deviceCount} ${deviceCount === 1 ? 'Gerät' : 'Geräte'}` : 'Eigene Geräte'} active={Boolean(deviceProvision)} /></b>
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
                                        ? `${formatDate(consultationSlot, true)} Uhr`
                                        : "Noch offen"}
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
                <h2>Teamgröße</h2>
                <ConfigOptionCards
                    kind="capacity"
                    values={optionValues}
                    onchange={updateOptionValues}
                />
            </section>

            <section class="config-section" use:reveal>
                <h2>Veranstaltungsort</h2>
                <ConfigOptionCards
                    kind="venue"
                    values={optionValues}
                    onchange={updateOptionValues}
                />
            </section>

            <section class="config-section tools-section" use:reveal>
                <h2>Tools</h2>
                <ConfigOptionCards
                    kind="tools"
                    values={optionValues}
                    onchange={updateOptionValues}
                />
            </section>

			<section class="config-section" use:reveal>
				<h2>Devices</h2>
				<ConfigOptionCards kind="devices" values={optionValues} onchange={updateOptionValues} />
			</section>

            <section class="config-section" use:reveal>
                <h2>Demo setup</h2>
                <ConfigOptionCards
                    kind="equipment"
                    values={optionValues}
                    onchange={updateOptionValues}
                />
            </section>

            <section class="config-section" use:reveal>
                <h2>Mittagessen</h2>
                <ConfigOptionCards
                    kind="lunch"
                    values={optionValues}
                    onchange={updateOptionValues}
                />
            </section>

            <section class="config-section" use:reveal>
				<h2>{venueProvided ? 'Veranstaltungsadresse' : 'Gewünschtes Suchgebiet'}</h2>
                <AddressEditor
                    value={address}
                    onchange={(value) => (address = value)}
                    idPrefix="booking-address"
					searchArea={!venueProvided}
                />
            </section>

            <section class="config-section" use:reveal>
                <h2>Veranstaltungsdatum und Uhrzeit</h2>
                {#key eventAvailabilityKey}
                    <EventDateTimeEditor
                        {eventStart}
                        {eventEnd}
                        minValue={minEventDate}
                        maxValue={maxEventDate}
                        onloadingchange={(value) => (eventSlotsLoading = value)}
                        onchange={(value) => ({ eventStart, eventEnd } = value)}
                    />
                {/key}
            </section>

            <section class="config-section" use:reveal>
                <h2>Kontakt</h2>
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
                    }}
                    idPrefix="booking-contact"
                />
            </section>

            <section class="config-section" use:reveal>
                <h2>60 Min. Vorbereitungsgespräch</h2>
                {#key availabilityKey}
                    <PrepCallEditor
                        value={consultationSlot}
                        mode={consultationMode}
                        customDate={customConsultationDate}
                        onchange={(value) => (consultationSlot = value)}
                        onmodechange={(value) => (consultationMode = value)}
                        oncustomdatechange={(value) => (customConsultationDate = value)}
                        onloadingchange={(value) => (slotsLoading = value)}
                        clearUnavailableValue
                    />
                {/key}
            </section>

            <section class="config-section" use:reveal>
                <h2>Ihre Nachricht</h2>
                <MessageField
                    value={message}
                    onchange={(value) => (message = value)}
                    id="booking-message"
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
					{#if deviceProvision}<div class="summary-row">
						<Laptop size={18} aria-hidden="true" /><span><small>{overviewRow("devices").label}</small><AnimatedValue value={overviewRow("devices").value} /></span><b><AnimatedValue value={overviewRow("devices").status} /></b>
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
                        <Camera size={18} aria-hidden="true" /><span
                            ><small>{overviewRow("event-photos").label}</small>{overviewRow(
                                "event-photos",
                            ).value}</span
                        ><b>{overviewRow("event-photos").status}</b>
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
                        >{submitting ? "Wird gebucht …" : "Hackathon und Prep Call buchen"}</button
                    >
                    <SharePlanButton getUrl={getShareUrl} />
                </div>
            </section>
        </form>
    </div>
</div>
