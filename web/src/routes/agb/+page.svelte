<script lang="ts">
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import { Check, Download, Printer } from 'lucide-svelte';
	import SeoHead from '$lib/SeoHead.svelte';
	import {
		LEGAL_MODULES,
		legalSections,
		type LegalModule
	} from '$lib/legal';
	import { localizedPath, type Locale } from '$lib/i18n';
	let locale = $derived((page.data.locale ?? 'de') as Locale);
	let sections = $derived(legalSections(locale));

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

</script>

<SeoHead
	title={locale === 'en' ? 'Terms and Conditions | ALL IN AGI' : 'Allgemeine Geschäftsbedingungen | ALL IN AGI'}
	description={locale === 'en' ? 'Terms and service conditions for ALL IN AGI hackathons.' : 'Allgemeine Geschäftsbedingungen und Leistungsbedingungen für Hackathons von ALL IN AGI.'}
	path="/agb"
	{locale}
/>

<div class="simple-page legal-page">
	<article class="simple-card legal-card">
		<header class="legal-heading">
			<h1>{locale === 'en' ? 'Terms and Conditions' : 'Allgemeine Geschäftsbedingungen'}</h1>
			<p>{locale === 'en' ? 'Terms and Conditions for Agentic Engineering Hackathons supplied by Emilian Scheel, trading as ALL IN AGI.' : 'Allgemeine Geschäftsbedingungen für Agentic Engineering Hackathons von Emilian Scheel, handelnd unter ALL IN AGI.'}</p>
		</header>

		<section class="legal-filter" aria-label="Angezeigte Leistungsbedingungen">
			<div class="coding-tool-list">
				{#each LEGAL_MODULES as module}
					<label class="coding-tool-option">
						<input type="checkbox" checked={selected.includes(module.id)} onchange={() => toggle(module.id)} />
						<span class="round-checkbox" aria-hidden="true">{#if selected.includes(module.id)}<Check size={18} strokeWidth={2.4} />{/if}</span>
						<span class="coding-tool-label">{locale === 'en' ? ({ venue: 'Venue', catering: 'Pizza catering', organizer_devices: 'Organizer devices', tool_accounts: 'AI tool accounts', event_photos: 'Event photography' } as const)[module.id] : module.label}</span>
					</label>
				{/each}
			</div>
		</section>

		<div class="legal-actions" aria-label="Dokumentaktionen">
			<button type="button" onclick={() => window.print()}><Printer size={17} />{locale === 'en' ? 'Print / save as PDF' : 'Drucken / als PDF sichern'}</button>
			<a href={localizedPath(locale, '/agb.txt')} download><Download size={17} />{locale === 'en' ? 'Download full text' : 'Volltext herunterladen'}</a>
		</div>

		<section class="legal-content" aria-label="Allgemeine Geschäftsbedingungen">
			{#each sections.base as section}
				<section id={section.id} class="legal-section"><h2>{section.title}</h2>{#each section.paragraphs as paragraph}<p>{paragraph}</p>{/each}</section>
			{/each}
			{#each sections.modules.filter((section) => section.module && selected.includes(section.module)) as section}
				<section id={section.id} class="legal-section legal-module-section"><h2>{section.title}</h2>{#each section.paragraphs as paragraph}<p>{paragraph}</p>{/each}</section>
			{/each}
		</section>
	</article>
</div>

<style>
	.legal-card { max-width: 960px; }
	.legal-heading h1 { overflow-wrap: anywhere; hyphens: auto; }
	.legal-heading > p { max-width: 760px; }
	.legal-filter { margin: 34px 0 24px; }
	.legal-actions { display: flex; flex-wrap: wrap; gap: 10px; margin: 24px 0 42px; }
	.legal-actions button, .legal-actions a { display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; border: 1px solid var(--line); border-radius: 999px; background: var(--card); color: var(--ink); font: inherit; font-weight: 700; text-decoration: none; cursor: pointer; }
	.legal-section { scroll-margin-top: 90px; }
	.legal-section h2 { margin-top: 42px; }
	.legal-section p { color: var(--muted); }
	.legal-module-section { margin-top: 40px; }
	@media print { :global(.site-header), :global(.site-footer), :global(.skip-link), .legal-filter, .legal-actions { display: none !important; } .legal-page { padding: 0; background: white; } .legal-card { max-width: none; padding: 0; } .legal-module-section { break-inside: avoid; } }
</style>
