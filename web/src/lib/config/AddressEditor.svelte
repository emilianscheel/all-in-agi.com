<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { EventAddress } from '$lib/booking';
	import type { Locale } from '$lib/i18n';
	import { fetchAddressSuggestions } from '$lib/geocoding';
	import { normalizePhotonAddress, photonFeatureLabel, type PhotonFeature } from '$lib/photon';

	let {
		value,
		onchange,
		idPrefix = 'address',
		searchArea = false,
		locale = 'de'
	}: {
		value: EventAddress;
		onchange: (value: EventAddress) => void;
		idPrefix?: string;
		searchArea?: boolean;
		locale?: Locale;
	} = $props();

	let addressQuery = $state('');
	let suggestions = $state<Array<{ label: string; feature: PhotonFeature }>>([]);
	let searchStatus = $state<'idle' | 'loading' | 'empty' | 'error'>('idle');
	let abortController: AbortController | undefined;
	let debounce: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		addressQuery = value.label || [value.street, value.city].filter(Boolean).join(', ');
	});

	function patch(patchValue: Partial<EventAddress>) {
		onchange({ ...value, ...patchValue, country: 'Deutschland' });
	}

	function updateSuggestions() {
		if (debounce) clearTimeout(debounce);
		abortController?.abort();
		const query = addressQuery.trim();
		if (query.length < 3) {
			suggestions = [];
			searchStatus = 'idle';
			return;
		}
		debounce = setTimeout(() => searchAddress(query), 250);
	}

	async function searchAddress(query: string) {
		abortController?.abort();
		abortController = new AbortController();
		searchStatus = 'loading';
		try {
			const features = await fetchAddressSuggestions(fetch, query, locale, abortController.signal);
			suggestions = features
				.map((feature) => ({ label: photonFeatureLabel(feature), feature }))
				.filter((suggestion) => suggestion.label);
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
		onchange(normalizePhotonAddress(suggestion.feature));
	}

	onDestroy(() => {
		if (debounce) clearTimeout(debounce);
		abortController?.abort();
	});
</script>

<div class="field-grid">
	<div class="field full address-search-wrap">
		<label for={`${idPrefix}-search`}>{locale === 'en' ? (searchArea ? 'Preferred search area' : 'Search address') : (searchArea ? 'Gewünschtes Suchgebiet' : 'Adresse suchen')}</label>
		<input
			id={`${idPrefix}-search`}
			autocomplete="off"
			aria-describedby={searchStatus === 'idle' ? undefined : `${idPrefix}-search-status`}
			aria-autocomplete="list"
			aria-controls={`${idPrefix}-suggestions`}
			placeholder={locale === 'en' ? 'Street, city, or company' : 'Straße, Ort oder Unternehmen'}
			bind:value={addressQuery}
			oninput={updateSuggestions}
		/>
		{#if suggestions.length}
			<ul id={`${idPrefix}-suggestions`} class="suggestions">
				{#each suggestions as suggestion}<li><button type="button" onclick={() => selectSuggestion(suggestion)}>{suggestion.label}</button></li>{/each}
			</ul>
		{/if}
		{#if searchStatus !== 'idle'}
			<p id={`${idPrefix}-search-status`} class="helper" aria-live="polite">{locale === 'en' ? (searchStatus === 'loading' ? 'Searching addresses …' : searchStatus === 'empty' ? 'No matching address found. Please enter it manually below.' : 'Address search is unavailable. Please enter it manually below.') : (searchStatus === 'loading' ? 'Adressen werden gesucht …' : searchStatus === 'empty' ? 'Keine passende Adresse gefunden. Bitte unten manuell eingeben.' : 'Adresssuche derzeit nicht verfügbar. Bitte unten manuell eingeben.')}</p>
		{/if}
	</div>
	<div class="field full"><label for={`${idPrefix}-street`}>{locale === 'en' ? 'Street and number' : 'Straße und Hausnummer'}</label><input id={`${idPrefix}-street`} autocomplete="street-address" value={value.street} oninput={(event) => patch({ street: event.currentTarget.value, label: '' })} /></div>
	<div class="field"><label for={`${idPrefix}-postal`}>{locale === 'en' ? 'Postal code' : 'Postleitzahl'}</label><input id={`${idPrefix}-postal`} inputmode="numeric" autocomplete="postal-code" value={value.postalCode} oninput={(event) => patch({ postalCode: event.currentTarget.value, label: '' })} /></div>
	<div class="field"><label for={`${idPrefix}-city`}>{locale === 'en' ? 'City' : 'Ort'}</label><input id={`${idPrefix}-city`} autocomplete="address-level2" value={value.city} oninput={(event) => patch({ city: event.currentTarget.value, label: '' })} /></div>
</div>
