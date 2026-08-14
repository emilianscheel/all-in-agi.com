<script lang="ts">
	import SeoHead from '$lib/SeoHead.svelte';
	import { CONTACT_EMAIL } from '$lib/contact';
</script>

<SeoHead title="Teilnehmerinformation und Fotoeinwilligung | ALL IN AGI" description="Datenschutzinformation für Hackathon-Teilnehmende und freiwillige, granulare Fotoeinwilligung." path="/teilnehmer-datenschutz" />

<div class="simple-page"><article class="simple-card participant-card">
	<h1>Information für Teilnehmende</h1>
	<p class="document-meta">Datenschutzinformation nach Art. 13 DSGVO · Stand 2. August 2026</p>
	<h2>Verantwortlicher und Kontakt</h2>
	<p>Emilian Scheel, handelnd unter ALL IN AGI, Moosdorfstraße 10, 12435 Berlin · <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
	<h2>Eventdurchführung</h2>
	<p>Für Organisation, Zugang, Sicherheit, Kommunikation und Dokumentation des geschlossenen Firmen-Hackathons werden nur die hierfür erforderlichen Kontaktdaten, Rollen, Veranstaltungsdaten und gegebenenfalls Geräteübergaben verarbeitet. Rechtsgrundlagen sind Art. 6 Abs. 1 lit. b oder lit. f DSGVO. Soweit der Arbeitgeber die Daten bereitstellt, dient dies der Durchführung der beauftragten Firmenveranstaltung.</p>
	<p>Empfänger können der beauftragende Arbeitgeber, notwendige Event-, Location-, Catering-, Hosting- und Kommunikationsdienstleister sowie Behörden bei gesetzlicher Verpflichtung sein. Daten werden gelöscht, wenn Zweck und gesetzliche Nachweisfristen entfallen. Es bestehen die in der allgemeinen <a href="/datenschutz">Datenschutzerklärung</a> beschriebenen Betroffenenrechte.</p>

	<section class="consent-form">
		<h2>Freiwillige Fotoeinwilligung</h2>
		<p>Die folgenden Entscheidungen sind unabhängig voneinander. Nicht angekreuzte Zwecke sind nicht erlaubt. Eine Verweigerung hat keine Nachteile für die Teilnahme.</p>
		<div class="consent-identity"><span>Name:</span><span></span><span>Event/Datum:</span><span></span></div>
		{#each [
			['capture', 'Aufnahme', 'Ich willige ein, während des Events fotografiert beziehungsweise gefilmt zu werden.'],
			['delivery', 'Geschützte Bereitstellung', 'Ich willige in die Bereitstellung ausgewählter Aufnahmen an das beauftragende Unternehmen und die Teilnehmenden ein.'],
			['website', 'Website', 'Ich willige in die Veröffentlichung ausgewählter Aufnahmen auf all-in-agi.com ein.'],
			['social', 'Social Media', 'Ich willige in die Veröffentlichung auf den vor dem Event benannten ALL-IN-AGI-Kanälen ein. Benannte Kanäle: ____________________.'],
			['sales', 'Werbe- und Sales-Unterlagen', 'Ich willige in die Verwendung in digitalen Präsentationen, Angeboten und Referenzunterlagen von ALL IN AGI ein.']
		] as option}
			<div class="consent-option"><span class="empty-box" aria-hidden="true"></span><div><strong>{option[1]}</strong><p>{option[2]}</p></div></div>
		{/each}
		<p>Die Einwilligung kann jederzeit mit Wirkung für die Zukunft per E-Mail an {CONTACT_EMAIL} widerrufen werden. Bei Online-Veröffentlichungen können weltweiter Abruf und Weiterverbreitung durch unabhängige Dritte nicht vollständig ausgeschlossen werden.</p>
		<div class="signature-lines"><span>Ort, Datum</span><span>Unterschrift</span></div>
	</section>
</article></div>

<style>
	.document-meta { color: var(--orange) !important; font-weight: 700; }
	.participant-card a { color: var(--link); }
	.consent-form { margin-top: 44px; padding-top: 10px; border-top: 2px solid var(--line); }
	.consent-identity { display: grid; grid-template-columns: auto 1fr auto 1fr; gap: 12px; margin: 28px 0; }
	.consent-identity span:nth-child(even) { border-bottom: 1px solid var(--ink); }
	.consent-option { display: grid; grid-template-columns: 28px 1fr; gap: 12px; margin: 18px 0; }
	.consent-option p { margin: 3px 0; }
	.empty-box { width: 24px; height: 24px; border: 1.5px solid var(--ink); border-radius: 6px; }
	.signature-lines { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 56px; }
	.signature-lines span { padding-top: 8px; border-top: 1px solid var(--ink); color: var(--muted); }
	@media print { :global(.site-header), :global(.site-footer), :global(.skip-link) { display: none !important; } .simple-page { padding: 0; background: white; } .simple-card { max-width: none; padding: 0; } }
</style>

