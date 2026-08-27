<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { onDestroy, onMount } from 'svelte';
	import { Check, Download, Mail, ReceiptEuro, Building2, CalendarDays, FileText } from 'lucide-svelte';
	import { OFFER_SERVICES, grossTotal, type OfferConfiguration, type OfferServiceId } from '$lib/offer';
	import { createOfferPdf } from '$lib/offer-artifacts';

	let { initialConfig }: { initialConfig: OfferConfiguration } = $props();
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
		} finally {
			generating = false;
		}
	}

	async function updateShareUrl() {
		tokenAbort?.abort();
		tokenAbort = new AbortController();
		try {
			const response = await fetch('/api/offer-token', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: serialisedConfig,
				signal: tokenAbort.signal
			});
			const result = await response.json() as { token?: string; message?: string };
			if (!response.ok || !result.token) throw new Error(result.message ?? 'Angebots-Link konnte nicht erstellt werden.');
			replaceState(`/offer/${result.token}`, {});
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
			<div class="offer-brand"><img src="/brand/all-in-agi-logo.png" alt="" width="512" height="512" /><span>ALL IN AGI</span></div>
			<div class="offer-intro"><p class="offer-eyebrow">Angebotseditor</p><h1>Ein Angebot, das sofort teilbar ist.</h1><p>Alle Änderungen werden verschlüsselt in der URL gespeichert.</p></div>

			<section class="offer-form-section" aria-labelledby="recipient-heading">
				<h2 id="recipient-heading"><Building2 size={16} />Empfänger</h2>
				<label>Unternehmen<input bind:value={config.companyName} maxlength="200" /></label>
				<label>Ansprechperson<input bind:value={config.contactName} maxlength="200" /></label>
				<label><Mail size={14} />E-Mail<input type="email" bind:value={config.contactEmail} maxlength="200" /></label>
			</section>

			<section class="offer-form-section" aria-labelledby="offer-heading">
				<h2 id="offer-heading"><FileText size={16} />Angebot</h2>
				<label>Titel<input bind:value={config.offerTitle} maxlength="200" /></label>
				<div class="offer-date-grid"><label>Ausgestellt am<input type="date" bind:value={config.issueDate} /></label><label>Gültig bis<input type="date" bind:value={config.validUntil} /></label></div>
				<label>Hinweise<textarea bind:value={config.notes} maxlength="1000" rows="3" placeholder="Optionale Hinweise für das Angebot"></textarea></label>
			</section>

			<section class="offer-form-section" aria-labelledby="price-heading">
				<h2 id="price-heading"><ReceiptEuro size={16} />Preis</h2>
				<div class="offer-price-grid"><label>Netto<input type="number" min="0" step="0.01" bind:value={config.netTotal} /></label><label>USt. %<input type="number" min="0" max="100" step="0.1" bind:value={config.vatRate} /></label></div>
				<p class="gross-total">Brutto <strong>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(gross)}</strong></p>
			</section>

			<section class="offer-form-section offer-services" aria-labelledby="services-heading">
				<h2 id="services-heading"><Check size={16} />Leistungen</h2>
				{#each OFFER_SERVICES as service}
					<label class:checked={config.services.includes(service.id)} class="offer-service"><input type="checkbox" checked={config.services.includes(service.id)} onchange={() => toggleService(service.id)} /><span class="offer-service-check"><Check size={12} /></span><span><b>{service.label}</b><small>{service.description}</small></span></label>
				{/each}
			</section>
			{#if urlError}<p class="offer-url-error" role="alert">{urlError}</p>{/if}
		</div>

		<div class="offer-download-wrap"><button type="button" class="offer-download" onclick={downloadPdf} disabled={!generatedBytes}><Download size={17} />{generating ? 'PDF wird aktualisiert …' : 'PDF herunterladen'}</button></div>
	</aside>

	<section class="offer-preview" aria-label="PDF-Vorschau">
		<div class="offer-preview-bar"><span><CalendarDays size={16} />Live PDF-Vorschau</span><span>{generating ? 'Wird aktualisiert …' : 'Aktuell'}</span></div>
		<div class="offer-paper">
			{#if previewUrl}<iframe title="Vorschau des Angebots als PDF" src={previewUrl}></iframe>{:else}<div class="offer-preview-loading">PDF wird erstellt …</div>{/if}
		</div>
	</section>
</div>

<style>
	.offer-builder { min-height: 100svh; display: grid; grid-template-columns: minmax(330px, 398px) minmax(0, 1fr); background: #ececef; color: #1d1d1f; }
	.offer-sidebar { position: sticky; top: 0; height: 100svh; display: grid; grid-template-rows: minmax(0, 1fr) auto; background: #fff; border-right: 1px solid #dedee3; }
	.offer-sidebar-scroll { overflow: auto; padding: 24px 24px 118px; }
	.offer-brand { display: inline-flex; align-items: center; gap: 7px; color: #2c2c30; font-family: 'Instrument Serif', Georgia, serif; font-size: 16px; letter-spacing: .06em; }
	.offer-brand img { width: 28px; height: 28px; object-fit: contain; }
	.offer-intro { padding: 37px 0 23px; border-bottom: 1px solid #e6e6ea; }
	.offer-eyebrow { margin: 0 0 8px; color: #ff4f18; font-size: 11px; font-weight: 700; letter-spacing: .11em; text-transform: uppercase; }
	.offer-intro h1 { margin: 0; max-width: 285px; font-size: 29px; line-height: 1; letter-spacing: -.05em; }
	.offer-intro p:last-child { margin: 12px 0 0; color: #6e6e73; font-size: 13px; line-height: 1.45; }
	.offer-form-section { padding: 22px 0; border-bottom: 1px solid #e6e6ea; }
	.offer-form-section h2 { display: flex; align-items: center; gap: 7px; margin: 0 0 13px; font-size: 14px; letter-spacing: -.02em; }
	.offer-form-section h2 :global(svg) { color: #ff4f18; }
	.offer-form-section > label, .offer-date-grid > label, .offer-price-grid > label { display: grid; gap: 6px; margin-top: 11px; color: #4e4e53; font-size: 11px; font-weight: 650; }
	.offer-form-section input, .offer-form-section textarea { width: 100%; border: 1px solid #d3d3d8; border-radius: 9px; padding: 9px 10px; background: #fff; color: #1d1d1f; font-size: 13px; font-weight: 400; outline: none; }
	.offer-form-section input:focus, .offer-form-section textarea:focus { border-color: #ff4f18; box-shadow: 0 0 0 3px rgba(255,79,24,.13); }
	.offer-form-section textarea { resize: vertical; }
	.offer-date-grid, .offer-price-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
	.gross-total { display: flex; justify-content: space-between; margin: 13px 0 0; padding: 10px 11px; border-radius: 9px; background: #f5f5f7; color: #606066; font-size: 12px; }
	.gross-total strong { color: #1d1d1f; }
	.offer-services { padding-bottom: 8px; }
	.offer-service { position: relative; display: grid; grid-template-columns: auto 1fr; gap: 9px; padding: 10px 0; cursor: pointer; }
	.offer-service input { position: absolute; opacity: 0; pointer-events: none; }
	.offer-service-check { width: 18px; height: 18px; display: grid; place-items: center; margin-top: 1px; border: 1px solid #b5b5bb; border-radius: 5px; color: transparent; }
	.offer-service.checked .offer-service-check { border-color: #ff4f18; background: #ff4f18; color: #fff; }
	.offer-service b { display: block; color: #252529; font-size: 12px; line-height: 1.25; }
	.offer-service small { display: block; margin-top: 3px; color: #74747a; font-size: 10px; line-height: 1.35; }
	.offer-url-error { margin: 16px 0 0; color: #9a2c0d; font-size: 12px; line-height: 1.4; }
	.offer-download-wrap { position: absolute; right: 0; bottom: 0; left: 0; padding: 16px 24px 22px; border-top: 1px solid #dedee3; background: rgba(255,255,255,.94); backdrop-filter: blur(12px); }
	.offer-download { width: 100%; display: inline-flex; justify-content: center; align-items: center; gap: 8px; min-height: 44px; border: 0; border-radius: 12px; background: #ff4f18; color: #fff; box-shadow: 0 7px 16px rgba(180,49,8,.2); font-size: 13px; font-weight: 700; }
	.offer-download:disabled { opacity: .55; cursor: not-allowed; }
	.offer-preview { min-width: 0; min-height: 100svh; padding: 30px; }
	.offer-preview-bar { display: flex; justify-content: space-between; max-width: 920px; margin: 0 auto 14px; color: #67676d; font-size: 12px; }
	.offer-preview-bar span { display: inline-flex; align-items: center; gap: 6px; }
	.offer-preview-bar span:last-child { color: #6e6e73; }
	.offer-paper { width: min(100%, 920px); height: calc(100svh - 94px); min-height: 620px; margin: 0 auto; overflow: hidden; border-radius: 13px; background: #fff; box-shadow: 0 18px 50px rgba(0,0,0,.12); }
	.offer-paper iframe { width: 100%; height: 100%; border: 0; }
	.offer-preview-loading { display: grid; width: 100%; height: 100%; place-items: center; color: #6e6e73; font-size: 14px; }
	@media (max-width: 820px) { .offer-builder { display: block; } .offer-sidebar { position: relative; height: auto; min-height: auto; border-right: 0; } .offer-sidebar-scroll { overflow: visible; padding-bottom: 92px; } .offer-download-wrap { position: sticky; } .offer-preview { min-height: auto; padding: 20px 14px; } .offer-paper { height: min(112vw, 760px); min-height: 470px; } }
	@media (max-width: 420px) { .offer-sidebar-scroll { padding: 20px 17px 90px; } .offer-date-grid, .offer-price-grid { grid-template-columns: 1fr; gap: 0; } .offer-preview { padding: 16px 8px; } .offer-paper { border-radius: 8px; } }
</style>
