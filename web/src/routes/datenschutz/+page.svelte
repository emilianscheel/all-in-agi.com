<script lang="ts">
	import { CONTACT_EMAIL } from '$lib/contact';
	import SeoHead from '$lib/SeoHead.svelte';
	import { openCookieSettings } from '$lib/analytics';
	import { page } from '$app/state';
	import { localizedPath, type Locale } from '$lib/i18n';
	let locale = $derived((page.data.locale ?? 'de') as Locale);
	const englishSections = [
		['1. Controller', `Emilian Scheel, trading as ALL IN AGI, Moosdorfstraße 10, 12435 Berlin, Germany. Contact: ${CONTACT_EMAIL}.`],
		['2. Website and technical delivery', 'When you visit this website, technically necessary connection and security data is processed, including IP address, time, requested resource, status code, and browser information. The legal basis is Article 6(1)(f) GDPR: our legitimate interest in operating the website securely and reliably. The site is hosted by Vercel Inc.; contractual and booking data is stored in a Neon PostgreSQL database in Frankfurt. Applicable data-processing terms, standard contractual clauses, and transfer assessments are used.'],
		['3. Hackathon requests and contracts', 'We process company and contact data, event address, dates, configuration, communications, authority confirmations, and contract evidence to handle requests and perform contracts under Article 6(1)(b) GDPR and for traceable B2B communication and legal defense under Article 6(1)(f). Unsuccessful inquiries are normally deleted six months after the last contact; contract records remain for applicable limitation and retention periods.'],
		['4. Scheduling with Cal.com', 'We use Cal.com to show availability and reserve preparation calls and hackathon dates. Necessary contact, schedule, and event data is transferred. Cal.com may process data in the United States under the applicable contractual safeguards.'],
		['5. Maps, location access, and address search', 'Maps use MapLibre GL and tiles from OpenFreeMap. Address search and coordinates selected through browser location access or the map are sent through our server to the public Photon service operated by komoot and based on OpenStreetMap data. The providers receive technically necessary connection data. Location access is optional, requires browser permission, and can be denied; addresses can always be entered manually.'],
		['6. Email delivery', 'Transactional email is sent through Cloudflare Email Service. Recipient, name, booking or contract details, attachments, time, delivery status, and technical message identifiers are processed under Article 6(1)(b) and (f) GDPR.'],
		['7. Invoices and payment records', 'We process billing address, contacts, email, optional VAT ID and purchase order, services, and payment data for invoicing and accounting under Article 6(1)(b) and (c) GDPR. Tax-relevant invoices and structured originals are generally retained for eight years.'],
		['8. Participants, devices, and security data', 'Participant lists are collected only where required for access, safety, or an agreed service. Dietary requirements should be provided as anonymous totals. Personal data, production data, trade secrets, and confidential source code may not be used on supplied devices or accounts without a separate agreement.'],
		['9. Photos and video', 'Capture, protected delivery, and publication are separate purposes. Marketing publication requires voluntary, documented consent under Article 6(1)(a) and Article 7 GDPR and Section 22 KUG. Consent can be withdrawn prospectively and participation remains possible without marketing consent.'],
		['10. Google Analytics', 'With your consent, we use Google Analytics 4 to measure reach and improve the website and booking flow. Usage, device, browser, approximate location, referrer, and interaction data may be processed under Article 6(1)(a) GDPR and Section 25(1) TDDDG. Google Ireland Limited is the provider; transfers to the United States may occur under its safeguards. Event data is retained for 14 months. Google Signals, advertising links, remarketing, personalized ads, and user-provided data collection are disabled. Analytics cookies are set only after consent.'],
		['11. Recipients and international transfers', 'Access is limited to staff and service providers who require data for delivery, hosting, scheduling, email, or accounting, and authorities where legally required. Processors are contracted under Article 28 GDPR. Third-country transfers require an adequacy decision or safeguards such as standard contractual clauses and a documented risk assessment.'],
		['12. Your rights', 'Subject to GDPR requirements, you may request access, correction, deletion, restriction, portability, or object to processing. Consent can be withdrawn prospectively. You may complain to a supervisory authority, including the Berlin Commissioner for Data Protection and Freedom of Information.'],
		['13. Required information and automated decisions', 'Required request and billing information is necessary to handle the request or contract; without it, services may not be available. We do not make solely automated decisions with legal or similarly significant effects.']
	] as const;
</script>

<SeoHead title={locale === 'en' ? 'Privacy Notice | ALL IN AGI' : 'Datenschutz | ALL IN AGI'} description={locale === 'en' ? 'Privacy information for the ALL IN AGI website, hackathon requests, contracts, and events.' : 'Datenschutzhinweise für Website, Hackathon-Anfragen, Verträge und Events bei ALL IN AGI.'} path="/datenschutz" {locale} />

{#if locale === 'en'}
<div class="simple-page"><article class="simple-card privacy-card">
	<h1>Privacy Notice</h1><p class="document-meta">Last updated: September 5, 2026</p>
	{#each englishSections as section, index}<h2 id={index === 9 ? 'google-analytics' : undefined}>{section[0]}</h2><p>{section[1]}</p>{/each}
	<p>You can withdraw analytics consent at any time: <button class="privacy-button" type="button" onclick={openCookieSettings}>open cookie settings</button>.</p>
</article></div>
{:else}
<div class="simple-page"><article class="simple-card privacy-card">
	<h1>Datenschutz</h1>
	<p class="document-meta">Stand: 5. September 2026</p>

	<h2>1. Verantwortlicher</h2>
	<p>Emilian Scheel, handelnd unter ALL IN AGI<br />Moosdorfstraße 10, 12435 Berlin<br /><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>

	<h2>2. Website und technische Bereitstellung</h2>
	<p>Beim Aufruf der Website werden technisch erforderliche Verbindungs- und Sicherheitsdaten verarbeitet, insbesondere IP-Adresse, Zeitpunkt, angeforderte Ressource, Statuscode sowie Browserinformationen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Das berechtigte Interesse besteht im sicheren und zuverlässigen Betrieb der Website.</p>
	<p>Die Website wird bei Vercel Inc. betrieben. Soweit Vercel als Auftragsverarbeiter tätig ist, gelten die vereinbarten Datenschutzbedingungen und Standardvertragsklauseln. Eine Verarbeitung in den USA kann nicht ausgeschlossen werden. Vertrags- und Buchungsdaten werden in einer Neon-PostgreSQL-Datenbank in der Region Frankfurt gespeichert. Die produktive Nutzung setzt die dokumentierten Auftragsverarbeitungsvereinbarungen und Transferprüfung voraus.</p>

	<h2>3. Hackathon-Anfragen und Vertrag</h2>
	<p>Für Anfrage, Prep-Call, Vertragsdurchführung und Betreuung verarbeiten wir Unternehmens- und Kontaktdaten, Veranstaltungsadresse, Termin- und Konfigurationsdaten, Kommunikationsinhalte, eine Bestätigung der Vertretungsbefugnis sowie Vertrags- und AGB-Nachweise. Rechtsgrundlagen sind Art. 6 Abs. 1 lit. b DSGVO für vorvertragliche und vertragliche Maßnahmen sowie Art. 6 Abs. 1 lit. f DSGVO für eine nachvollziehbare B2B-Kommunikation und Rechtsverteidigung.</p>
	<p>Nicht zum Vertrag führende Anfragen werden grundsätzlich sechs Monate nach dem letzten Kontakt gelöscht. Vertrags- und Kommunikationsdaten werden bis zum Ablauf einschlägiger Verjährungs- und Aufbewahrungsfristen gespeichert.</p>

	<h2>4. Terminbuchung mit Cal.com</h2>
	<p>Zur Anzeige verfügbarer Termine und zur Reservierung des Prep-Calls und Hackathontags nutzen wir Cal.com. Dabei werden die für die Terminbuchung erforderlichen Kontakt-, Termin- und Veranstaltungsdaten übermittelt. Cal.com kann Daten in den USA verarbeiten. Die produktive Nutzung erfolgt nur auf Grundlage der einschlägigen Datenschutzvereinbarungen und Transfermechanismen.</p>

	<h2>5. Karten, Standortabfrage und Adresssuche</h2>
	<p>Für die Kartendarstellung werden MapLibre GL und Kartenkacheln von OpenFreeMap verwendet. Adresssuchen sowie Koordinaten aus der optionalen Browser-Standortabfrage oder einer Auswahl auf der Karte werden über unseren Server an den öffentlichen Photon-Dienst von komoot übermittelt, der auf OpenStreetMap-Daten basiert. Die Anbieter erhalten dabei technisch erforderliche Verbindungsdaten. Die Standortabfrage erfordert Ihre Browserfreigabe und kann abgelehnt werden; eine Adresse kann jederzeit manuell eingegeben werden.</p>

	<h2>6. E-Mail-Versand</h2>
	<p>Transaktions-E-Mails werden über Cloudflare Email Service versandt. Verarbeitet werden Empfängeradresse, Name, Buchungs-/Vertragsdaten, Anhänge, Versandzeitpunkt, Zustellstatus und technische Nachrichtenkennungen. Rechtsgrundlagen sind Art. 6 Abs. 1 lit. b und lit. f DSGVO.</p>

	<h2>7. Rechnungen und Zahlungsnachweise</h2>
	<p>Für Rechnungsstellung, Anzahlungen, Schlussrechnungen und Mahnwesen verarbeiten wir Rechnungsanschrift, Ansprechpartner, E-Mail-Adresse, optionale USt-IdNr. und Bestellnummer, Leistungs- und Zahlungsdaten. Rechtsgrundlagen sind Art. 6 Abs. 1 lit. b und c DSGVO. Steuerlich relevante Rechnungen und strukturierte Originaldateien werden grundsätzlich acht Jahre aufbewahrt.</p>

	<h2>8. Teilnehmende, Geräte und Sicherheitsdaten</h2>
	<p>Teilnehmerlisten werden nur erhoben, soweit sie für Zugang, Sicherheit oder eine ausdrücklich vereinbarte Leistung erforderlich sind. Ernährungswünsche sollen als anonyme Mengen verarbeitet werden. Auf bereitgestellten Geräten und Tool-Zugängen sind personenbezogene Daten, Produktivdaten, Geschäftsgeheimnisse und vertraulicher Quellcode ohne gesonderte Vereinbarung untersagt. Geräteprotokolle werden nach Rückgabe beziehungsweise Abschluss eines Schadensfalls nach dem dokumentierten Löschkonzept entfernt.</p>

	<h2>9. Foto- und Videoaufnahmen</h2>
	<p>Aufnahme, geschützte Bereitstellung und Veröffentlichung sind getrennte Verarbeitungszwecke. Marketingveröffentlichungen erfolgen nur aufgrund einer freiwilligen, nachweisbaren Einwilligung nach Art. 6 Abs. 1 lit. a und Art. 7 DSGVO sowie § 22 KUG. Die Einwilligung kann jederzeit mit Wirkung für die Zukunft widerrufen werden. Eine Teilnahme ohne Marketingeinwilligung bleibt möglich. Weitere Informationen enthält die <a href={localizedPath(locale, '/teilnehmer-datenschutz')}>Teilnehmerinformation und Fotoeinwilligung</a>.</p>

	<h2 id="google-analytics">10. Google Analytics</h2>
	<p>Mit Ihrer Einwilligung verwenden wir Google Analytics 4 zur Reichweitenmessung und zur Verbesserung unserer Website und des Buchungsprozesses. Dabei werden insbesondere Nutzungs-, Geräte-, Browser-, ungefähre Standort-, Referrer- und Interaktionsdaten verarbeitet. Rechtsgrundlage sind Ihre Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG.</p>
	<p>Anbieter ist Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland. Eine Verarbeitung durch Google in den USA kann nicht ausgeschlossen werden und erfolgt nach den von Google vorgesehenen Transfermechanismen. Die in Analytics gespeicherten Ereignisdaten bewahren wir für 14 Monate auf. Google Signals, Google-Ads-Verknüpfungen, Remarketing, personalisierte Werbung und die Übermittlung nutzerbereitgestellter Daten sind deaktiviert. Wir übermitteln weder Kontakt-, Adress- oder Buchungsdaten noch Inhalte freier Texte an Google Analytics.</p>
	<p>Die Analyse-Cookies werden erst nach Ihrer Zustimmung gesetzt. Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen: <button class="privacy-button" type="button" onclick={openCookieSettings}>Cookie-Einstellungen öffnen</button>.</p>

	<h2>11. Empfänger und internationale Übermittlungen</h2>
	<p>Empfänger sind nur solche Beschäftigten und Dienstleister, die die Daten für Durchführung, Hosting, Terminierung, E-Mail oder Abrechnung benötigen, sowie Behörden bei gesetzlicher Verpflichtung. Für Auftragsverarbeiter werden Vereinbarungen nach Art. 28 DSGVO eingesetzt. Übermittlungen in Drittländer erfolgen nur bei Angemessenheitsbeschluss oder geeigneten Garantien, insbesondere Standardvertragsklauseln, und dokumentierter Risikoprüfung.</p>

	<h2>12. Ihre Rechte</h2>
	<p>Betroffene Personen haben nach Maßgabe der DSGVO Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch. Einwilligungen können jederzeit für die Zukunft widerrufen werden. Außerdem besteht ein Beschwerderecht bei einer Datenschutzaufsichtsbehörde, insbesondere bei der Berliner Beauftragten für Datenschutz und Informationsfreiheit.</p>

	<h2>13. Erforderlichkeit und automatisierte Entscheidungen</h2>
	<p>Pflichtangaben im Anfrage- und Rechnungsprozess sind für Bearbeitung beziehungsweise Vertrag erforderlich; ohne sie kann die Leistung gegebenenfalls nicht angeboten werden. Eine ausschließlich automatisierte Entscheidung mit rechtlicher oder ähnlich erheblicher Wirkung findet nicht statt.</p>
</article></div>
{/if}

<style>
	.document-meta { color: var(--orange) !important; font-weight: 700; }
	.privacy-card a { color: var(--link); }
	.privacy-card h2 { scroll-margin-top: 90px; }
	.privacy-button { padding: 0; border: 0; background: transparent; color: var(--link); font: inherit; text-decoration: underline; text-underline-offset: 2px; cursor: pointer; }
</style>
