<script lang="ts">
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import { Check, Download, Printer } from 'lucide-svelte';
	import SeoHead from '$lib/SeoHead.svelte';
	import {
		BASE_LEGAL_SECTIONS,
		LEGAL_DOCUMENT_STATUS,
		LEGAL_DOCUMENT_VERSION,
		LEGAL_MODULES,
		MODULE_LEGAL_SECTIONS,
		type LegalModule
	} from '$lib/legal';

	const parameterName = 'module';
	let initializedFromUrl = false;
	let selected = $state<LegalModule[]>(LEGAL_MODULES.map(({ id }) => id));

	$effect(() => {
		if (initializedFromUrl) return;
		const requested = page.url.searchParams.getAll(parameterName).filter((value): value is LegalModule =>
			LEGAL_MODULES.some(({ id }) => id === value)
		);
		if (page.url.searchParams.get('selection') === 'custom' || page.url.searchParams.has(parameterName)) selected = requested;
		initializedFromUrl = true;
	});

	function updateUrl(next: LegalModule[]) {
		const url = new URL(page.url);
		url.searchParams.delete(parameterName);
		url.searchParams.set('selection', 'custom');
		for (const module of next) url.searchParams.append(parameterName, module);
		replaceState(`${url.pathname}${url.search}`, {});
	}

	function toggle(module: LegalModule) {
		selected = selected.includes(module) ? selected.filter((value) => value !== module) : [...selected, module];
		updateUrl(selected);
	}

	function showAll() {
		selected = LEGAL_MODULES.map(({ id }) => id);
		const url = new URL(page.url);
		url.searchParams.delete('selection');
		url.searchParams.delete(parameterName);
		replaceState(url.pathname, {});
	}
</script>

<SeoHead
	title="B2B-AGB für Hackathons | ALL IN AGI"
	description="Allgemeine Geschäftsbedingungen und optionale Leistungsbedingungen für B2B-Hackathons von ALL IN AGI."
	path="/agb"
/>

<div class="simple-page legal-page">
	<article class="simple-card legal-card">
		<header class="legal-heading">
			<p class="legal-kicker">Version {LEGAL_DOCUMENT_VERSION}</p>
			<h1>B2B-AGB</h1>
			<p>Allgemeine Geschäftsbedingungen für Agentic Engineering Hackathons von Emilian Scheel, handelnd unter ALL IN AGI.</p>
			{#if LEGAL_DOCUMENT_STATUS === 'review-required'}
				<p class="legal-review-note"><strong>Transparenzhinweis:</strong> Diese Fassung ist bis zur dokumentierten anwaltlichen, steuerlichen und versicherungsfachlichen Freigabe als Entwurf gekennzeichnet.</p>
			{/if}
		</header>

		<section class="legal-filter" aria-labelledby="legal-filter-title">
			<div class="legal-filter-heading">
				<div><h2 id="legal-filter-title">Leistungsmodule anzeigen</h2><p>Die Auswahl filtert nur die Ansicht. Sie ist keine Einwilligung und ändert den Vertrag nicht.</p></div>
				<button type="button" class="text-button" onclick={showAll}>Vollständige Fassung</button>
			</div>
			<div class="legal-module-options">
				{#each LEGAL_MODULES as module}
					<label class="coding-tool-option legal-module-option">
						<input type="checkbox" checked={selected.includes(module.id)} onchange={() => toggle(module.id)} />
						<span class="round-checkbox" aria-hidden="true">{#if selected.includes(module.id)}<Check size={18} strokeWidth={2.4} />{/if}</span>
						<span class="coding-tool-label">{module.label}</span>
					</label>
				{/each}
			</div>
		</section>

		<div class="legal-actions" aria-label="Dokumentaktionen">
			<button type="button" onclick={() => window.print()}><Printer size={17} />Drucken / als PDF sichern</button>
			<a href="/agb.txt" download><Download size={17} />Volltext herunterladen</a>
		</div>

		<section class="legal-content" aria-label="Allgemeine Geschäftsbedingungen">
			{#each BASE_LEGAL_SECTIONS as section}
				<section id={section.id} class="legal-section"><h2>{section.title}</h2>{#each section.paragraphs as paragraph}<p>{paragraph}</p>{/each}</section>
			{/each}
			{#each MODULE_LEGAL_SECTIONS.filter((section) => section.module && selected.includes(section.module)) as section}
				<section id={section.id} class="legal-section legal-module-section"><h2>{section.title}</h2>{#each section.paragraphs as paragraph}<p>{paragraph}</p>{/each}</section>
			{/each}
		</section>
	</article>
</div>

<style>
	.legal-card { max-width: 960px; }
	.legal-heading > p { max-width: 760px; }
	.legal-kicker { margin: 0 0 10px; color: var(--orange) !important; font-weight: 750; letter-spacing: .08em; text-transform: uppercase; }
	.legal-review-note { padding: 14px 16px; border: 1px solid color-mix(in srgb, var(--orange) 45%, var(--line)); border-radius: 14px; background: color-mix(in srgb, var(--orange) 7%, var(--card)); color: var(--ink) !important; }
	.legal-filter { margin: 38px 0 24px; padding: 22px; border: 1px solid var(--line); border-radius: 20px; background: var(--surface); }
	.legal-filter-heading { display: flex; justify-content: space-between; align-items: start; gap: 20px; }
	.legal-filter h2 { margin: 0; }
	.legal-filter p { margin: 7px 0 0; }
	.text-button { border: 0; padding: 8px 0; background: transparent; color: var(--link); font: inherit; font-weight: 700; cursor: pointer; white-space: nowrap; }
	.legal-module-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 20px; }
	.legal-module-option { min-height: 52px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 14px; background: var(--card); }
	.legal-actions { display: flex; flex-wrap: wrap; gap: 10px; margin: 24px 0 42px; }
	.legal-actions button, .legal-actions a { display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; border: 1px solid var(--line); border-radius: 999px; background: var(--card); color: var(--ink); font: inherit; font-weight: 700; text-decoration: none; cursor: pointer; }
	.legal-section { scroll-margin-top: 90px; }
	.legal-section h2 { margin-top: 42px; }
	.legal-section p { color: var(--muted); }
	.legal-module-section { margin-top: 40px; padding: 8px 24px 24px; border: 1px solid color-mix(in srgb, var(--orange) 35%, var(--line)); border-radius: 20px; background: color-mix(in srgb, var(--orange) 4%, var(--card)); }
	@media (max-width: 700px) { .legal-module-options { grid-template-columns: 1fr; } .legal-filter-heading { display: block; } }
	@media print { :global(.site-header), :global(.site-footer), :global(.skip-link), .legal-filter, .legal-actions, .legal-review-note { display: none !important; } .legal-page { padding: 0; background: white; } .legal-card { max-width: none; padding: 0; } .legal-module-section { break-inside: avoid; } }
</style>
