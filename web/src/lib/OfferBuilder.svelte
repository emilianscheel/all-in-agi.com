<script lang="ts">
	import { goto } from '$app/navigation';
	import { onDestroy, onMount } from 'svelte';
	import { Building2, Check, Download, FileText, ReceiptEuro } from 'lucide-svelte';
	import LucideMark from '$lib/LucideMark.svelte';
	import { LUCIDE_ICON_NAMES } from '$lib/lucide-icons';
	import { grossTotal, type ClientLogoRecord, type OfferCatalogService, type OfferConfiguration } from '$lib/offer';
	import { createOfferPdf, type OfferPdfMode } from '$lib/offer-artifacts';
	import { localizedPath, type Locale } from '$lib/i18n';
	import type { AttachableBooking, OfferSummary } from '$lib/server/offers';

	let {
		offerId,
		initialConfig,
		offers,
		bookings,
		hackathonId = null,
		logos,
		services,
		locale = 'de'
	}: {
		offerId: string;
		initialConfig: OfferConfiguration;
		offers: OfferSummary[];
		bookings: AttachableBooking[];
		hackathonId?: string | null;
		logos: ClientLogoRecord[];
		services: OfferCatalogService[];
		locale?: Locale;
	} = $props();
	// The parent only supplies the initial draft; the editor intentionally owns later changes.
	// svelte-ignore state_referenced_locally
	let config = $state<OfferConfiguration>(structuredClone(initialConfig));
	// svelte-ignore state_referenced_locally
	let attachedBookingId = $state(hackathonId ?? '');
	let previewUrl = $state('');
	let urlError = $state('');
	let previewMode = $state<OfferPdfMode>('offer');
	let generatedBytes = $state<Uint8Array | undefined>();
	let generatedMode = $state<OfferPdfMode>('offer');
	let savingBooking = $state(false);
	let uploadingLogo = $state(false);
	let addingService = $state(false);
	let serviceQuery = $state('');
	let newServiceLabel = $state('');
	let newServiceIcon = $state('sparkles');
	let iconQuery = $state('');
	let iconPickerOpen = $state(false);
	let extraLogos = $state<ClientLogoRecord[]>([]);
	let extraServices = $state<OfferCatalogService[]>([]);
	let mounted = false;
	let pdfTimer: ReturnType<typeof setTimeout> | undefined;
	let saveTimer: ReturnType<typeof setTimeout> | undefined;
	let saveAbort: AbortController | undefined;
	let lastPreviewUrl = '';
	let renderGeneration = 0;
	// svelte-ignore state_referenced_locally
	let savedSnapshot = JSON.stringify(initialConfig);
	let serialisedConfig = $derived(JSON.stringify(config));
	let gross = $derived(grossTotal(config));
	let logoCatalog = $derived.by(() => {
		const seen = new Set(logos.map((logo) => logo.id));
		return [...logos, ...extraLogos.filter((logo) => !seen.has(logo.id))];
	});
	let serviceCatalog = $derived.by(() => {
		const byId = new Map(services.map((service) => [service.id, service]));
		for (const service of extraServices) byId.set(service.id, service);
		return [...byId.values()].sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
	});
	let visibleServices = $derived(serviceCatalog.filter((service) => {
		const label = locale === 'en' ? service.labelEn : service.label;
		return label.toLowerCase().includes(serviceQuery.trim().toLowerCase());
	}));
	let iconMatches = $derived(LUCIDE_ICON_NAMES.filter((name) => name.includes(iconQuery.trim().toLowerCase())).slice(0, 48));

	function pdfBlob(bytes: Uint8Array) {
		const copy = new Uint8Array(bytes);
		return new Blob([copy.buffer as ArrayBuffer], { type: 'application/pdf' });
	}

	function toggleService(id: string) {
		config.services = config.services.includes(id)
			? config.services.filter((service) => service !== id)
			: [...config.services, id];
	}

	function pdfError(error: unknown) {
		const detail = error instanceof Error ? error.message : '';
		if (locale === 'en') return detail ? `The PDF could not be created: ${detail}` : 'The PDF could not be created.';
		return detail ? `PDF konnte nicht erstellt werden: ${detail}` : 'PDF konnte nicht erstellt werden.';
	}

	function saveError(error: unknown) {
		if (error instanceof Error && error.message) return error.message;
		return locale === 'en' ? 'The offer could not be saved.' : 'Das Angebot konnte nicht gespeichert werden.';
	}

	function choiceLabel(choice: OfferSummary) {
		const source = choice.id === offerId ? config : choice;
		const company = source.companyName.trim();
		const title = source.offerTitle.trim();
		if (company && title) return `${company} — ${title}`;
		if (company) return company;
		if (title) return title;
		return locale === 'en' ? 'New offer' : 'Neues Angebot';
	}

	async function renderPdf() {
		const generation = ++renderGeneration;
		const mode = previewMode;
		try {
			const logo = logoCatalog.find((item) => item.id === config.clientLogo);
			const bytes = await createOfferPdf(config, { mode, locale, services: serviceCatalog, logoSvg: logo?.svg });
			if (generation !== renderGeneration) return;
			generatedBytes = bytes;
			generatedMode = mode;
			const url = URL.createObjectURL(pdfBlob(bytes));
			previewUrl = url;
			if (lastPreviewUrl) URL.revokeObjectURL(lastPreviewUrl);
			lastPreviewUrl = url;
			urlError = '';
		} catch (error) {
			if (generation !== renderGeneration) return;
			generatedBytes = undefined;
			urlError = pdfError(error);
		}
	}

	function downloadPdf() {
		if (!generatedBytes) return;
		const suffix = generatedMode === 'scope' ? 'leistungsbeschreibung' : (locale === 'en' ? 'offer' : 'angebot');
		const link = document.createElement('a');
		link.href = URL.createObjectURL(pdfBlob(generatedBytes));
		const base = (config.companyName || 'all-in-agi').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'all-in-agi';
		link.download = `${base}-${suffix}.pdf`;
		document.body.append(link);
		link.click();
		link.remove();
		setTimeout(() => URL.revokeObjectURL(link.href), 0);
	}

	async function uploadLogo(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		if (!file.name.toLowerCase().endsWith('.svg') && file.type !== 'image/svg+xml') {
			urlError = locale === 'en' ? 'Only SVG logos can be uploaded.' : 'Es können nur SVG-Logos hochgeladen werden.';
			return;
		}
		uploadingLogo = true;
		try {
			const response = await fetch('/offer/logos', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					name: file.name.replace(/\.svg$/i, '').replace(/[_-]+/g, ' ').trim() || 'Logo',
					svg: await file.text()
				})
			});
			const result = await response.json() as ClientLogoRecord & { message?: string };
			if (!response.ok) throw new Error(result.message || (locale === 'en' ? 'The logo could not be uploaded.' : 'Das Logo konnte nicht hochgeladen werden.'));
			extraLogos = [...extraLogos, { id: result.id, name: result.name, svg: result.svg }];
			config.clientLogo = result.id;
			urlError = '';
		} catch (error) {
			urlError = error instanceof Error && error.message ? error.message : (locale === 'en' ? 'The logo could not be uploaded.' : 'Das Logo konnte nicht hochgeladen werden.');
		} finally {
			uploadingLogo = false;
		}
	}

	async function addService() {
		const label = newServiceLabel.trim();
		if (!label || addingService) return;
		addingService = true;
		try {
			const response = await fetch('/offer/services', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ label, icon: newServiceIcon })
			});
			const result = await response.json() as OfferCatalogService & { message?: string };
			if (!response.ok) throw new Error(result.message || (locale === 'en' ? 'The service could not be added.' : 'Die Leistung konnte nicht hinzugefügt werden.'));
			extraServices = [...extraServices, result];
			if (!config.services.includes(result.id)) config.services = [...config.services, result.id];
			newServiceLabel = '';
			iconPickerOpen = false;
			urlError = '';
		} catch (error) {
			urlError = error instanceof Error && error.message ? error.message : (locale === 'en' ? 'The service could not be added.' : 'Die Leistung konnte nicht hinzugefügt werden.');
		} finally {
			addingService = false;
		}
	}

	async function saveConfig() {
		const snapshot = serialisedConfig;
		if (snapshot === savedSnapshot) return;
		saveAbort?.abort();
		saveAbort = new AbortController();
		try {
			const response = await fetch(`/offer/${offerId}`, {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: snapshot,
				signal: saveAbort.signal
			});
			const result = await response.json() as { message?: string };
			if (!response.ok) throw new Error(result.message ?? saveError(undefined));
			savedSnapshot = snapshot;
			urlError = '';
		} catch (error) {
			if ((error as Error).name !== 'AbortError') urlError = saveError(error);
		}
	}

	async function flushSave() {
		if (saveTimer) clearTimeout(saveTimer);
		await saveConfig();
		return serialisedConfig === savedSnapshot;
	}

	async function chooseOffer(event: Event) {
		const value = (event.currentTarget as HTMLSelectElement).value;
		if (value === '__new__') {
			(event.currentTarget as HTMLSelectElement).value = offerId;
			if (!await flushSave()) return;
			try {
				const response = await fetch('/offer', { method: 'POST' });
				const result = await response.json() as { id?: string; message?: string };
				if (!response.ok || !result.id) throw new Error(result.message ?? saveError(undefined));
				await goto(localizedPath(locale, `/offer/${result.id}`));
			} catch (error) {
				urlError = saveError(error);
			}
			return;
		}
		if (value === offerId) return;
		if (!await flushSave()) {
			(event.currentTarget as HTMLSelectElement).value = offerId;
			return;
		}
		await goto(localizedPath(locale, `/offer/${value}`));
	}

	async function chooseBooking(event: Event) {
		const value = (event.currentTarget as HTMLSelectElement).value;
		const next = value || null;
		savingBooking = true;
		try {
			const response = await fetch(`/offer/${offerId}`, {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ hackathonId: next })
			});
			const result = await response.json() as { message?: string };
			if (!response.ok) throw new Error(result.message ?? (locale === 'en' ? 'The booking could not be attached.' : 'Die Buchung konnte nicht verknüpft werden.'));
			attachedBookingId = value;
			urlError = '';
		} catch (error) {
			(event.currentTarget as HTMLSelectElement).value = attachedBookingId;
			urlError = error instanceof Error ? error.message : (locale === 'en' ? 'The booking could not be attached.' : 'Die Buchung konnte nicht verknüpft werden.');
		} finally {
			savingBooking = false;
		}
	}

	$effect(() => {
		serialisedConfig;
		if (!mounted) return;
		if (saveTimer) clearTimeout(saveTimer);
		if (serialisedConfig !== savedSnapshot) saveTimer = setTimeout(() => void saveConfig(), 400);
	});

	$effect(() => {
		serialisedConfig;
		locale;
		previewMode;
		logoCatalog;
		serviceCatalog;
		if (!mounted) return;
		if (pdfTimer) clearTimeout(pdfTimer);
		pdfTimer = setTimeout(() => void renderPdf(), 120);
	});

	onMount(() => {
		mounted = true;
		void renderPdf();
	});

	onDestroy(() => {
		if (pdfTimer) clearTimeout(pdfTimer);
		if (saveTimer) clearTimeout(saveTimer);
		saveAbort?.abort();
		if (lastPreviewUrl) URL.revokeObjectURL(lastPreviewUrl);
	});
</script>

<div class="offer-builder">
	<aside class="offer-sidebar" aria-label={locale === 'en' ? 'Configure offer' : 'Angebot konfigurieren'}>
		<div class="offer-sidebar-scroll">
			<div class="offer-switchers">
				<label>{locale === 'en' ? 'Document' : 'Dokument'}
					<select value={offerId} onchange={chooseOffer}>
						{#each offers as offer (offer.id)}
							<option value={offer.id}>{choiceLabel(offer)}</option>
						{/each}
						<option value="__new__">{locale === 'en' ? 'Create new offer' : 'Neues Angebot erstellen'}</option>
					</select>
				</label>
				<label>{locale === 'en' ? 'Booking' : 'Buchung'}
					<select value={attachedBookingId} onchange={chooseBooking} disabled={savingBooking}>
						<option value="">{locale === 'en' ? 'No booking' : 'Keine Buchung'}</option>
						{#each bookings as booking (booking.id)}
							<option value={booking.id}>{booking.id} · {booking.companyName}</option>
						{/each}
					</select>
				</label>
				<label>{locale === 'en' ? 'Version' : 'Version'}
					<select bind:value={previewMode}>
						<option value="offer">{locale === 'en' ? 'Offer' : 'Angebot'}</option>
						<option value="scope">{locale === 'en' ? 'Statement of work' : 'Leistungsbeschreibung'}</option>
					</select>
				</label>
			</div>

			<section class="offer-form-section" aria-labelledby="recipient-heading">
				<h2 id="recipient-heading"><Building2 size={16} />{locale === 'en' ? 'Recipient' : 'Empfänger'}</h2>
				<label>{locale === 'en' ? 'Company' : 'Unternehmen'}<input bind:value={config.companyName} maxlength="200" /></label>
				<div class="offer-logo-field">
					<label>{locale === 'en' ? 'Client logo' : 'Kundenlogo'}
						<select bind:value={config.clientLogo}>
							<option value="none">{locale === 'en' ? 'No client logo' : 'Kein Kundenlogo'}</option>
							<option value="hitachi">Hitachi Rail</option>
							{#each logoCatalog as logo (logo.id)}
								<option value={logo.id}>{logo.name}</option>
							{/each}
						</select>
					</label>
					<label class="offer-logo-upload">
						{uploadingLogo ? '…' : (locale === 'en' ? 'Upload SVG' : 'SVG hochladen')}
						<input type="file" accept=".svg,image/svg+xml" onchange={uploadLogo} disabled={uploadingLogo} />
					</label>
				</div>
				<label>{locale === 'en' ? 'Contact person' : 'Ansprechperson'}<input bind:value={config.contactName} maxlength="200" /></label>
				<label>{locale === 'en' ? 'Email' : 'E-Mail'}<input type="email" bind:value={config.contactEmail} maxlength="200" /></label>
			</section>

			<section class="offer-form-section" aria-labelledby="offer-heading">
				<h2 id="offer-heading"><FileText size={16} />{locale === 'en' ? 'Offer' : 'Angebot'}</h2>
				<label>{locale === 'en' ? 'Title' : 'Titel'}<input bind:value={config.offerTitle} maxlength="200" /></label>
				<label>{locale === 'en' ? 'Issue date' : 'Ausgestellt am'}<input type="date" bind:value={config.issueDate} /></label>
				<label>{locale === 'en' ? 'Notes' : 'Hinweise'}<textarea bind:value={config.notes} maxlength="1000" rows="3" placeholder={locale === 'en' ? 'Optional notes for the offer' : 'Optionale Hinweise für das Angebot'}></textarea></label>
			</section>

			<section class="offer-form-section" aria-labelledby="price-heading">
				<h2 id="price-heading"><ReceiptEuro size={16} />{locale === 'en' ? 'Price' : 'Preis'}</h2>
				<div class="offer-price-grid"><label>{locale === 'en' ? 'Net' : 'Netto'}<input type="number" min="0" step="0.01" bind:value={config.netTotal} /></label><label>{locale === 'en' ? 'VAT %' : 'USt. %'}<input type="number" min="0" max="100" step="0.1" bind:value={config.vatRate} /></label></div>
				<p class="gross-total">{locale === 'en' ? 'Total (gross)' : 'Zahlbetrag (brutto)'} <strong>{new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'de-DE', { style: 'currency', currency: 'EUR' }).format(gross)}</strong></p>
			</section>

			<section class="offer-form-section offer-services" aria-labelledby="services-heading">
				<h2 id="services-heading"><Check size={16} />{locale === 'en' ? 'Services' : 'Leistungen'}</h2>
				<label class="offer-service-search">{locale === 'en' ? 'Search' : 'Suche'}<input type="search" bind:value={serviceQuery} /></label>
				{#each visibleServices as service (service.id)}
					{@const label = locale === 'en' ? service.labelEn : service.label}
					{@const description = locale === 'en' ? service.descriptionEn : service.description}
					<label class:checked={config.services.includes(service.id)} class="offer-service"><input type="checkbox" checked={config.services.includes(service.id)} onchange={() => toggleService(service.id)} /><span class="offer-service-check" aria-hidden="true"><Check size={16} strokeWidth={3} /></span><LucideMark name={service.icon} size={14} /><span><span class="offer-service-label">{label}</span>{#if description}<small>{description}</small>{/if}</span></label>
				{:else}
					<p class="offer-service-empty">{locale === 'en' ? 'No matching services' : 'Keine passenden Leistungen'}</p>
				{/each}
				<div class="offer-service-create">
					<input bind:value={newServiceLabel} maxlength="200" placeholder={locale === 'en' ? 'New service' : 'Neue Leistung'} />
					<button type="button" class="offer-icon-trigger" aria-expanded={iconPickerOpen} aria-label={locale === 'en' ? 'Choose icon' : 'Icon wählen'} onclick={() => iconPickerOpen = !iconPickerOpen}><LucideMark name={newServiceIcon} /></button>
					<button type="button" class="offer-service-add" onclick={addService} disabled={addingService || !newServiceLabel.trim()}>{locale === 'en' ? 'Add' : 'Hinzufügen'}</button>
				</div>
				{#if iconPickerOpen}
					<label class="offer-service-search">{locale === 'en' ? 'Icon' : 'Icon'}<input type="search" bind:value={iconQuery} placeholder={locale === 'en' ? 'Search icons' : 'Icons suchen'} /></label>
					<div class="offer-icon-grid">
						{#each iconMatches as name (name)}
							<button type="button" class:selected={newServiceIcon === name} aria-label={name} onclick={() => newServiceIcon = name}><LucideMark {name} /></button>
						{/each}
					</div>
				{/if}
			</section>
			{#if urlError}<p class="offer-url-error" role="alert">{urlError}</p>{/if}
		</div>
		<div class="offer-download-wrap">
			<button type="button" class="button-primary offer-download" onclick={downloadPdf} disabled={!generatedBytes}><Download size={18} aria-hidden="true" />{locale === 'en' ? 'Download PDF' : 'PDF herunterladen'}</button>
		</div>
	</aside>

	<section class="offer-preview" aria-label={previewMode === 'scope' ? (locale === 'en' ? 'Statement of work preview' : 'Vorschau der Leistungsbeschreibung') : (locale === 'en' ? 'Offer preview' : 'Angebotsvorschau')}>
		{#if previewUrl}<iframe title={previewMode === 'scope' ? (locale === 'en' ? 'Statement of work PDF preview' : 'Vorschau der Leistungsbeschreibung als PDF') : (locale === 'en' ? 'Offer PDF preview' : 'Vorschau des Angebots als PDF')} src={previewUrl}></iframe>{:else}<div class="offer-preview-loading">{locale === 'en' ? 'Creating PDF …' : 'PDF wird erstellt …'}</div>{/if}
	</section>
</div>

<style>
	.offer-builder { min-height: calc(100svh - 44px); display: grid; grid-template-columns: minmax(330px, 398px) minmax(0, 1fr); background: #fff; color: #1d1d1f; }
	.offer-sidebar { position: sticky; top: 44px; height: calc(100svh - 44px); display: flex; flex-direction: column; background: #f5f5f7; border-right: 1px solid #e4e4e8; }
	.offer-sidebar-scroll { flex: 1; min-height: 0; overflow: auto; scrollbar-width: none; padding: 24px; }
	.offer-sidebar-scroll::-webkit-scrollbar { display: none; }
	.offer-switchers { display: grid; gap: 12px; padding-bottom: 8px; }
	.offer-switchers label { display: grid; gap: 6px; color: #4e4e53; font-size: 11px; font-weight: 650; }
	.offer-form-section { padding: 20px 0; border-bottom: 1px solid #dfdfe4; }
	.offer-form-section h2 { display: flex; align-items: center; gap: 7px; margin: 0 0 13px; font-size: 14px; letter-spacing: -.02em; }
	.offer-form-section h2 :global(svg) { color: #ff4f18; }
	.offer-form-section > label, .offer-price-grid > label, .offer-logo-field > label, .offer-service-search { display: grid; gap: 6px; margin-top: 11px; color: #4e4e53; font-size: 11px; font-weight: 650; }
	.offer-sidebar :is(input, select, textarea):not([type='checkbox']) { width: 100%; box-sizing: border-box; border: 1px solid #d3d3d8; border-radius: 9px; background-color: #fff; color: #1d1d1f; font: inherit; font-size: 13px; font-weight: 400; line-height: 20px; outline: none; }
	.offer-sidebar :is(input, select):not([type='checkbox']) { height: 40px; padding: 0 10px; }
	.offer-sidebar select:not([type='checkbox']) { appearance: none; padding: 0 30px 0 10px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236e6e73' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; background-size: 14px; }
	.offer-sidebar textarea { height: auto; padding: 9px 10px; resize: vertical; }
	.offer-sidebar :is(input, select, textarea):not([type='checkbox']):focus { border-color: #ff4f18; box-shadow: 0 0 0 3px rgba(255,79,24,.13); }
	.offer-price-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
	.gross-total { display: flex; justify-content: space-between; margin: 13px 0 0; padding: 10px 11px; border-radius: 9px; background: #f5f5f7; color: #606066; font-size: 12px; }
	.gross-total strong { color: #1d1d1f; }
	.offer-services { padding-bottom: 7px; }
	.offer-service { position: relative; display: grid; grid-template-columns: auto auto 1fr; align-items: center; gap: 7px; padding: 6px 0; cursor: pointer; }
	.offer-service input { position: absolute; opacity: 0; pointer-events: none; }
	.offer-service-check { width: 20px; height: 20px; display: grid; place-items: center; border: 2px solid #ff4f18; border-radius: 6px; color: transparent; transition: background-color .15s ease, color .15s ease; }
	.offer-service.checked .offer-service-check { background: #ff4f18; color: #fff; }
	.offer-service:has(input:focus-visible) .offer-service-check { outline: 3px solid rgba(255,79,24,.22); outline-offset: 2px; }
	.offer-service-label { display: block; color: #252529; font-size: 12px; font-weight: 400; line-height: 1.25; }
	.offer-service small { display: block; margin-top: 3px; color: #74747a; font-size: 10px; line-height: 1.35; }
	.offer-logo-field { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; align-items: end; }
	.offer-logo-upload { position: relative; display: grid; place-items: center; height: 40px; padding: 0 12px; border: 1px solid #d3d3d8; border-radius: 9px; background: #fff; color: #1d1d1f; font-size: 12px; font-weight: 650; white-space: nowrap; cursor: pointer; }
	.offer-logo-upload input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
	.offer-service-empty { margin: 8px 0 0; color: #74747a; font-size: 12px; }
	.offer-service-create { display: grid; grid-template-columns: minmax(0, 1fr) 40px auto; gap: 8px; margin-top: 12px; }
	.offer-icon-trigger, .offer-service-add { height: 40px; border: 1px solid #d3d3d8; border-radius: 9px; background: #fff; color: #1d1d1f; cursor: pointer; }
	.offer-icon-trigger { display: grid; place-items: center; padding: 0; }
	.offer-service-add { padding: 0 12px; font: inherit; font-size: 12px; font-weight: 650; }
	.offer-service-add:disabled { opacity: .45; cursor: default; }
	.offer-icon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(32px, 1fr)); gap: 4px; margin-top: 8px; }
	.offer-icon-grid button { height: 32px; display: grid; place-items: center; border: 1px solid transparent; border-radius: 7px; background: #fff; color: #3a3a3e; cursor: pointer; }
	.offer-icon-grid button.selected, .offer-icon-trigger[aria-expanded='true'] { border-color: #ff4f18; color: #ff4f18; }
	.offer-url-error { margin: 16px 0 0; color: #9a2c0d; font-size: 12px; line-height: 1.4; }
	.offer-download-wrap { padding: 8px 24px 22px; }
	.offer-download { width: 100%; gap: 8px; }
	.offer-preview { min-width: 0; min-height: calc(100svh - 44px); background: #fff; }
	.offer-preview iframe { display: block; width: 100%; height: calc(100svh - 44px); border: 0; }
	.offer-preview-loading { display: grid; width: 100%; height: 100%; place-items: center; color: #6e6e73; font-size: 14px; }
	@media (max-width: 820px) { .offer-builder { display: block; } .offer-sidebar { position: relative; top: auto; height: auto; min-height: auto; border-right: 0; } .offer-sidebar-scroll { overflow: visible; flex: none; } .offer-preview { min-height: auto; } .offer-preview iframe { height: min(130vw, 850px); min-height: 520px; } }
	@media (max-width: 420px) { .offer-sidebar-scroll { padding: 20px 17px; } .offer-price-grid { grid-template-columns: 1fr; gap: 0; } }
</style>
