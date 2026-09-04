<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { onDestroy, onMount } from 'svelte';
	import { Building2, Check, Download, FileText, ReceiptEuro } from 'lucide-svelte';
	import { OFFER_CLIENT_LOGOS, OFFER_SERVICES, grossTotal, type OfferConfiguration, type OfferServiceId } from '$lib/offer';
	import { createOfferPdf } from '$lib/offer-artifacts';
	import { page } from '$app/state';
	import { localizedPath, switchLocalePath, type Locale } from '$lib/i18n';

	let { initialConfig, locale = 'de' }: { initialConfig: OfferConfiguration; locale?: Locale } = $props();
	// The parent only supplies the initial draft; the editor intentionally owns later changes.
	// svelte-ignore state_referenced_locally
	let config = $state<OfferConfiguration>(structuredClone(initialConfig));
	let previewUrl = $state('');
	let generating = $state(true);
	let urlError = $state('');
	let generatedBytes = $state<Uint8Array | undefined>();
	let mounted = false;
	let pdfTimer: ReturnType<typeof setTimeout> | undefined;
	let tokenTimer: ReturnType<typeof setTimeout> | undefined;
	let tokenAbort: AbortController | undefined;
	let lastPreviewUrl = '';
	let serialisedConfig = $derived(JSON.stringify(config));
	let gross = $derived(grossTotal(config));
	function pdfBlob(bytes: Uint8Array) {
		const copy = new Uint8Array(bytes);
		return new Blob([copy.buffer as ArrayBuffer], { type: 'application/pdf' });
	}

	function toggleService(id: OfferServiceId) {
		config.services = config.services.includes(id)
			? config.services.filter((service) => service !== id)
			: [...config.services, id];
	}

	async function renderPdf() {
		generating = true;
		try {
			const bytes = await createOfferPdf(config);
			generatedBytes = bytes;
			const url = URL.createObjectURL(pdfBlob(bytes));
			previewUrl = url;
			if (lastPreviewUrl) URL.revokeObjectURL(lastPreviewUrl);
			lastPreviewUrl = url;
			urlError = '';
		} catch (error) {
			urlError = error instanceof Error ? `PDF konnte nicht erstellt werden: ${error.message}` : 'PDF konnte nicht erstellt werden.';
		} finally {
			generating = false;
		}
	}

	async function updateShareUrl() {
		tokenAbort?.abort();
		tokenAbort = new AbortController();
		try {
			const response = await fetch('/offer/token', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: serialisedConfig,
				signal: tokenAbort.signal
			});
			const result = await response.json() as { token?: string; message?: string };
			if (!response.ok || !result.token) throw new Error(result.message ?? 'Angebots-Link konnte nicht erstellt werden.');
			replaceState(localizedPath(locale, `/offer/${result.token}`), {});
			urlError = '';
		} catch (error) {
			if ((error as Error).name !== 'AbortError') urlError = error instanceof Error ? error.message : 'Angebots-Link konnte nicht erstellt werden.';
		}
	}

	function downloadPdf() {
		if (!generatedBytes) return;
		const link = document.createElement('a');
		link.href = URL.createObjectURL(pdfBlob(generatedBytes));
		link.download = `${(config.companyName || 'all-in-agi-angebot').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()}-angebot.pdf`;
		document.body.append(link);
		link.click();
		link.remove();
		setTimeout(() => URL.revokeObjectURL(link.href), 0);
	}

	$effect(() => {
		serialisedConfig;
		if (!mounted) return;
		if (pdfTimer) clearTimeout(pdfTimer);
		if (tokenTimer) clearTimeout(tokenTimer);
		pdfTimer = setTimeout(() => void renderPdf(), 120);
		tokenTimer = setTimeout(() => void updateShareUrl(), 380);
	});

	onMount(() => {
		mounted = true;
		void renderPdf();
		void updateShareUrl();
	});

	onDestroy(() => {
		if (pdfTimer) clearTimeout(pdfTimer);
		if (tokenTimer) clearTimeout(tokenTimer);
		tokenAbort?.abort();
		if (lastPreviewUrl) URL.revokeObjectURL(lastPreviewUrl);
	});
</script>

<div class="offer-builder">
	<aside class="offer-sidebar" aria-label="Angebot konfigurieren">
		<div class="offer-sidebar-scroll">
			<div class="offer-top"><div class="offer-brand"><img src="/brand/all-in-agi-logo.png" alt="" width="512" height="512" /><span>ALL IN AGI</span></div><div class="offer-language"><a class:active={locale === 'de'} href={switchLocalePath(page.url, 'de')}>DE</a><a class:active={locale === 'en'} href={switchLocalePath(page.url, 'en')}>EN</a></div></div>

			<section class="offer-form-section" aria-labelledby="recipient-heading">
				<h2 id="recipient-heading"><Building2 size={16} />{locale === 'en' ? 'Recipient' : 'Empfänger'}</h2>
				<label>{locale === 'en' ? 'Company' : 'Unternehmen'}<input bind:value={config.companyName} maxlength="200" /></label>
				<label>{locale === 'en' ? 'Client logo' : 'Kundenlogo'}<select bind:value={config.clientLogo}>{#each OFFER_CLIENT_LOGOS as logo}<option value={logo.id}>{logo.label}</option>{/each}</select></label>
				<label>{locale === 'en' ? 'Contact person' : 'Ansprechperson'}<input bind:value={config.contactName} maxlength="200" /></label>
				<label>E-Mail<input type="email" bind:value={config.contactEmail} maxlength="200" /></label>
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
				{#each OFFER_SERVICES as service}
					<label class:checked={config.services.includes(service.id)} class="offer-service"><input type="checkbox" checked={config.services.includes(service.id)} onchange={() => toggleService(service.id)} /><span class="offer-service-check" aria-hidden="true"><Check size={16} strokeWidth={3} /></span><span><span class="offer-service-label">{service.label}</span>{#if service.description}<small>{service.description}</small>{/if}</span></label>
				{/each}
			</section>
			{#if urlError}<p class="offer-url-error" role="alert">{urlError}</p>{/if}
		</div>

		<div class="offer-download-wrap"><button type="button" class="offer-download" onclick={downloadPdf} disabled={!generatedBytes}><Download size={17} />{locale === 'en' ? (generating ? 'Updating PDF …' : 'Download PDF') : (generating ? 'PDF wird aktualisiert …' : 'PDF herunterladen')}</button></div>
	</aside>

	<section class="offer-preview" aria-label={locale === 'en' ? 'PDF preview' : 'PDF-Vorschau'}>
		{#if previewUrl}<iframe title={locale === 'en' ? 'Offer PDF preview' : 'Vorschau des Angebots als PDF'} src={previewUrl}></iframe>{:else}<div class="offer-preview-loading">{locale === 'en' ? 'Creating PDF …' : 'PDF wird erstellt …'}</div>{/if}
	</section>
</div>

<style>
	.offer-builder { min-height: 100svh; display: grid; grid-template-columns: minmax(330px, 398px) minmax(0, 1fr); background: #fff; color: #1d1d1f; }
	.offer-sidebar { position: sticky; top: 0; height: 100svh; display: grid; grid-template-rows: minmax(0, 1fr) auto; background: #f5f5f7; border-right: 1px solid #e4e4e8; }
	.offer-sidebar-scroll { overflow: auto; padding: 24px 24px 118px; }
	.offer-brand { display: inline-flex; align-items: center; gap: 7px; color: #2c2c30; font-family: 'Instrument Serif', Georgia, serif; font-size: 16px; letter-spacing: .06em; }
	.offer-brand img { width: 28px; height: 28px; object-fit: contain; }
	.offer-top { display: flex; align-items: center; justify-content: space-between; }
	.offer-language { display: flex; gap: 9px; font-size: 11px; } .offer-language a { color: #4e4e53; opacity: .45; } .offer-language a.active { opacity: 1; font-weight: 700; }
	.offer-form-section { padding: 20px 0; border-bottom: 1px solid #dfdfe4; }
	.offer-form-section h2 { display: flex; align-items: center; gap: 7px; margin: 0 0 13px; font-size: 14px; letter-spacing: -.02em; }
	.offer-form-section h2 :global(svg) { color: #ff4f18; }
	.offer-form-section > label, .offer-price-grid > label { display: grid; gap: 6px; margin-top: 11px; color: #4e4e53; font-size: 11px; font-weight: 650; }
	.offer-form-section input, .offer-form-section textarea, .offer-form-section select { width: 100%; border: 1px solid #d3d3d8; border-radius: 9px; padding: 9px 10px; background: #fff; color: #1d1d1f; font-size: 13px; font-weight: 400; outline: none; }
	.offer-form-section input:focus, .offer-form-section textarea:focus, .offer-form-section select:focus { border-color: #ff4f18; box-shadow: 0 0 0 3px rgba(255,79,24,.13); }
	.offer-form-section textarea { resize: vertical; }
	.offer-price-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
	.gross-total { display: flex; justify-content: space-between; margin: 13px 0 0; padding: 10px 11px; border-radius: 9px; background: #f5f5f7; color: #606066; font-size: 12px; }
	.gross-total strong { color: #1d1d1f; }
	.offer-services { padding-bottom: 7px; }
	.offer-service { position: relative; display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 7px; padding: 6px 0; cursor: pointer; }
	.offer-service input { position: absolute; opacity: 0; pointer-events: none; }
	.offer-service-check { width: 20px; height: 20px; display: grid; place-items: center; border: 2px solid #ff4f18; border-radius: 6px; color: transparent; transition: background-color .15s ease, color .15s ease; }
	.offer-service.checked .offer-service-check { background: #ff4f18; color: #fff; }
	.offer-service:has(input:focus-visible) .offer-service-check { outline: 3px solid rgba(255,79,24,.22); outline-offset: 2px; }
	.offer-service-label { display: block; color: #252529; font-size: 12px; font-weight: 400; line-height: 1.25; }
	.offer-service small { display: block; margin-top: 3px; color: #74747a; font-size: 10px; line-height: 1.35; }
	.offer-url-error { margin: 16px 0 0; color: #9a2c0d; font-size: 12px; line-height: 1.4; }
	.offer-download-wrap { position: absolute; right: 0; bottom: 0; left: 0; padding: 16px 24px 22px; border-top: 1px solid #dedee3; background: rgba(245,245,247,.94); backdrop-filter: blur(12px); }
	.offer-download { width: 100%; display: inline-flex; justify-content: center; align-items: center; gap: 8px; min-height: 44px; border: 0; border-radius: 12px; background: #ff4f18; color: #fff; box-shadow: 0 7px 16px rgba(180,49,8,.2); font-size: 13px; font-weight: 700; }
	.offer-download:disabled { opacity: .55; cursor: not-allowed; }
	.offer-preview { min-width: 0; min-height: 100svh; background: #fff; }
	.offer-preview iframe { display: block; width: 100%; height: 100svh; border: 0; }
	.offer-preview-loading { display: grid; width: 100%; height: 100%; place-items: center; color: #6e6e73; font-size: 14px; }
	@media (max-width: 820px) { .offer-builder { display: block; } .offer-sidebar { position: relative; height: auto; min-height: auto; border-right: 0; } .offer-sidebar-scroll { overflow: visible; padding-bottom: 92px; } .offer-download-wrap { position: sticky; } .offer-preview { min-height: auto; } .offer-preview iframe { height: min(130vw, 850px); min-height: 520px; } }
	@media (max-width: 420px) { .offer-sidebar-scroll { padding: 20px 17px 90px; } .offer-price-grid { grid-template-columns: 1fr; gap: 0; } }
</style>
