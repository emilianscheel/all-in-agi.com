import type { BookingConfiguration } from './booking';
import type { Locale } from './i18n';

export const LEGAL_DOCUMENT_VERSION = '2026-08-02.2';
export const LEGAL_DOCUMENT_STATUS = 'review-required' as const;

export type LegalModule = 'venue' | 'catering' | 'organizer_devices' | 'tool_accounts' | 'event_photos';

export interface LegalSection {
	id: string;
	title: string;
	paragraphs: string[];
	items?: string[];
	module?: LegalModule;
}

export interface LegalDocumentSnapshot {
	locale?: Locale;
	version: string;
	contentHash: string;
	modules: LegalModule[];
	content: string;
	capturedAt: string;
}

export const LEGAL_MODULES: ReadonlyArray<{ id: LegalModule; label: string; shortLabel: string }> = [
	{ id: 'catering', label: 'Pizza-Catering', shortLabel: 'Pizza-Catering' },
	{ id: 'tool_accounts', label: 'AI-Tool-Zugänge', shortLabel: 'AI-Tools' },
	{ id: 'event_photos', label: 'Eventfoto-Service', shortLabel: 'Eventfotos' }
];

export const BASE_LEGAL_SECTIONS: LegalSection[] = [
	{
		id: 'scope',
		title: '1. Anbieter, Geltungsbereich und Unternehmereigenschaft',
		paragraphs: [
			'Diese Allgemeinen Geschäftsbedingungen gelten für Verträge über B2B-Hackathons und damit zusammenhängende Leistungen von Emilian Scheel, handelnd unter ALL IN AGI, Moosdorfstraße 10, 12435 Berlin (nachfolgend „ALL IN AGI“).',
			'Das Angebot richtet sich ausschließlich an Unternehmer im Sinne des § 14 BGB, juristische Personen des öffentlichen Rechts und öffentlich-rechtliche Sondervermögen. Verbraucherverträge werden nicht geschlossen. Die buchende Person versichert, im Namen des angegebenen Unternehmens handeln und die erforderlichen Erklärungen abgeben zu dürfen.',
			'Der Standard-Hackathon ist eine geschlossene Firmenveranstaltung für volljährige, vom Kunden eingeladene Teilnehmende. Öffentliche Veranstaltungen, minderjährige Teilnehmende und die Bereitstellung von Alkohol bedürfen einer gesonderten schriftlichen Vereinbarung.'
		]
	},
	{
		id: 'formation',
		title: '2. Anfrage, Prep-Call und Vertragsschluss',
		paragraphs: [
			'Die Online-Konfiguration und Terminreservierung sind eine unverbindliche Anfrage und noch keine Annahme oder Buchungsbestätigung. Der angezeigte Preis ist die Kalkulationsgrundlage für den Prep-Call.',
			'Der Vertrag kommt zustande, sobald Kunde und ALL IN AGI im Prep-Call der konkret zusammengefassten Leistung mündlich zustimmen. ALL IN AGI dokumentiert die Namen der zustimmenden Personen, den Zeitpunkt, die Konfiguration, den Preis, die einbezogenen AGB-Module und die AGB-Version und übersendet diese Vertragsbestätigung unverzüglich in Textform.',
			'Beide Parteien können sich bis zum Ablauf von zwei Geschäftstagen nach der dokumentierten Zustimmung ohne Kosten durch eine formlose E-Mail vom Vertrag lösen. Geschäftstage sind Montag bis Freitag, ausgenommen gesetzliche Feiertage am Sitz von ALL IN AGI. Das vertragliche Lösungsrecht ist kein gesetzliches Verbraucher-Widerrufsrecht.'
		]
	},
	{
		id: 'services',
		title: '3. Leistungsumfang und Mitwirkung des Kunden',
		paragraphs: [
			'Maßgeblich sind die eingefrorene Leistungsbestätigung und die darin ausgewählten Module. Allgemeine Leistungsbeschreibungen, Präsentationen und Website-Inhalte werden nur Vertragsbestandteil, soweit die Leistungsbestätigung darauf Bezug nimmt.',
			'Der Kunde benennt rechtzeitig eine entscheidungsbefugte Kontaktperson, stellt die vereinbarten Zugänge, Informationen und eigenen Ressourcen bereit und informiert seine Teilnehmenden über Hausordnung, Sicherheitsvorgaben, zulässige Tool- und Gerätenutzung sowie den freiwilligen Umgang mit Fotoaufnahmen.',
			'Der Hackathon findet in den vom Kunden angegebenen Räumen statt. Der Kunde stellt ausreichend Platz für die Teams, stabiles WLAN, einen großen Screen sowie Kundengeräte mit Administratorrechten oder entsprechend berechtigte virtuelle Maschinen bereit.',
			'Änderungen an Termin, Teilnehmendenzahl, Veranstaltungsadresse, Demo-Setup oder Tools bedürfen einer dokumentierten Änderungsbestätigung. Preis- oder leistungsrelevante Änderungen ersetzen nicht stillschweigend die ursprüngliche Vereinbarung.'
		]
	},
	{
		id: 'payment',
		title: '4. Vergütung, Umsatzsteuer und Zahlung',
		paragraphs: [
			'Alle Preise verstehen sich netto zuzüglich der gesetzlich geschuldeten Umsatzsteuer. Die Leistungsbestätigung weist Nettoentgelt, Umsatzsteuer und Bruttobetrag aus.',
			'Nach Vertragsschluss werden 30 Prozent des Nettoentgelts zuzüglich Umsatzsteuer als Anzahlung mit einem Zahlungsziel von sieben Kalendertagen berechnet. Die Schlussrechnung wird nach der Veranstaltung unter Anrechnung der erhaltenen Anzahlung gestellt und ist innerhalb von 14 Kalendertagen ohne Abzug fällig.',
			'Bei Zahlungsverzug gelten die gesetzlichen Vorschriften. Verzugszinsen und die Verzugspauschale nach § 288 BGB werden nicht ohne vorherige Prüfung automatisiert erhoben. Aufrechnungs- und Zurückbehaltungsrechte bestehen nur mit unbestrittenen, rechtskräftig festgestellten oder aus demselben Vertragsverhältnis stammenden Ansprüchen.'
		]
	},
	{
		id: 'cancellation',
		title: '5. Stornierung durch den Kunden',
		paragraphs: [
			'Nach Ablauf des kostenlosen zweitägigen Lösungsrechts kann der Kunde den Auftrag in Textform stornieren. Maßgeblich ist der Zugang der Erklärung bei ALL IN AGI.',
			'Bei Zugang bis einschließlich 14 Kalendertage vor Veranstaltungsbeginn beträgt der pauschalierte Schadensersatz 1.000 Euro netto für die 15-Personen-Variante, 1.500 Euro netto für die 30-Personen-Variante oder 2.000 Euro netto für die 50-Personen-Variante.',
			'Bei späterem Zugang werden 100 Prozent des vereinbarten Nettoentgelts abzüglich ersparter Aufwendungen und Erlöse aus einer anderweitigen Verwendung der reservierten Ressourcen berechnet. Dem Kunden bleibt ausdrücklich der Nachweis gestattet, dass kein oder ein wesentlich geringerer Schaden entstanden ist. ALL IN AGI darf einen höheren konkret entstandenen Schaden nachweisen. Geleistete Anzahlungen werden angerechnet; Überschüsse werden erstattet.'
		]
	},
	{
		id: 'reschedule',
		title: '6. Terminänderung, Leistungshindernisse und höhere Gewalt',
		paragraphs: [
			'Terminverschiebungen werden nach Verfügbarkeit und unter Berücksichtigung bereits entstandener oder nicht stornierbarer Drittaufwendungen vereinbart. Ein Anspruch auf einen bestimmten Ersatztermin besteht nicht.',
			'ALL IN AGI darf namentlich angekündigte Moderierende durch fachlich geeignete Personen ersetzen. Wird eine wesentliche Leistung dauerhaft unmöglich, kann der Kunde hinsichtlich des betroffenen Leistungsteils zurücktreten; bereits gezahlte Beträge für nicht erbrachte Leistungen werden erstattet.',
			'Bei Ereignissen außerhalb des zumutbaren Einflussbereichs beider Parteien, insbesondere behördlichen Verboten, Ausfällen kritischer Infrastruktur oder Naturereignissen, stimmen die Parteien vorrangig einen Ersatztermin ab. Andernfalls werden erbrachte Leistungen und zuvor ausdrücklich freigegebene, nicht rückholbare Drittkosten abgerechnet; weitergehende gesetzliche Rechte bleiben unberührt.'
		]
	},
	{
		id: 'conduct',
		title: '7. Sicherheit, Verhalten und Ausschluss',
		paragraphs: [
			'Der Kunde sorgt dafür, dass seine Teilnehmenden Sicherheits-, Haus-, Geheimhaltungs- und Nutzungsregeln beachten. ALL IN AGI darf Personen bei konkreter Gefährdung, erheblicher Störung, rechtswidrigem Verhalten oder fortgesetztem Verstoß gegen Sicherheitsanweisungen von der weiteren Teilnahme ausschließen. Eine Erstattung erfolgt nur, soweit ALL IN AGI den Ausschluss zu vertreten hat.',
			'Notfälle und Schäden sind unverzüglich der benannten Veranstaltungsleitung zu melden. Gesetzliche Arbeitsschutz- und Unfallverhütungspflichten des jeweiligen Arbeitgebers bleiben unberührt.'
		]
	},
	{
		id: 'confidentiality',
		title: '8. Vertraulichkeit, Arbeitsergebnisse und Rechte Dritter',
		paragraphs: [
			'Beide Parteien behandeln als vertraulich gekennzeichnete oder erkennbar vertrauliche Informationen der anderen Partei vertraulich und verwenden sie nur zur Vertragsdurchführung. Die Verpflichtung gilt nicht für nachweislich öffentliche, rechtmäßig vorbekannte oder unabhängig entwickelte Informationen.',
			'Rechte an Konzepten, Quellcode, Daten und sonstigen Arbeitsergebnissen verbleiben beim jeweiligen Ersteller beziehungsweise Rechteinhaber. ALL IN AGI erhält nur die zur Durchführung erforderlichen, nicht ausschließlichen Nutzungsrechte. Eine weitergehende Rechteübertragung bedarf einer gesonderten Vereinbarung.',
			'Der Kunde verantwortet die Rechtmäßigkeit der von ihm eingebrachten Inhalte, Daten und Zugänge. Bedingungen von AI-Tools, Open-Source-Komponenten und sonstigen Drittanbietern gelten zusätzlich; ALL IN AGI garantiert keine Exklusivität, Schutzfähigkeit oder Fehlerfreiheit AI-generierter Ergebnisse.'
		]
	},
	{
		id: 'privacy',
		title: '9. Datenschutz und Fotoeinwilligungen',
		paragraphs: [
			'Personenbezogene Daten werden nach Maßgabe der Datenschutzerklärung verarbeitet. Soweit ALL IN AGI ausnahmsweise personenbezogene Daten im Auftrag des Kunden verarbeitet, schließen die Parteien vor Beginn eine gesonderte Vereinbarung nach Art. 28 DSGVO.',
			'Eine Veröffentlichung von Foto- oder Videoaufnahmen zu Marketingzwecken erfolgt nicht auf Grundlage dieser AGB. Sie setzt eine getrennte, freiwillige, nachweisbare und jederzeit für die Zukunft widerrufliche Einwilligung der abgebildeten Person voraus. Eine Teilnahme muss auch ohne Marketingeinwilligung möglich sein.'
		]
	},
	{
		id: 'liability',
		title: '10. Haftung',
		paragraphs: [
			'ALL IN AGI haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit, für Schäden aus der Verletzung von Leben, Körper oder Gesundheit, nach dem Produkthaftungsgesetz sowie im Umfang einer übernommenen Garantie.',
			'Bei leicht fahrlässiger Verletzung einer wesentlichen Vertragspflicht ist die Haftung auf den bei Vertragsschluss vorhersehbaren, vertragstypischen Schaden begrenzt. Wesentliche Vertragspflichten sind solche, deren Erfüllung die ordnungsgemäße Durchführung erst ermöglicht und auf deren Einhaltung die andere Partei regelmäßig vertrauen darf. Im Übrigen ist die Haftung für leichte Fahrlässigkeit ausgeschlossen.',
			'Diese Begrenzungen gelten entsprechend zugunsten der Mitarbeitenden, Erfüllungsgehilfen und gesetzlichen Vertreter von ALL IN AGI. Zwingende gesetzliche Haftung bleibt unberührt.'
		]
	},
	{
		id: 'closing',
		title: '11. Schlussbestimmungen',
		paragraphs: [
			'Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Ausschließlicher Gerichtsstand ist Berlin, soweit der Kunde Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen ist oder die Voraussetzungen des § 38 ZPO anderweitig vorliegen.',
			'Individuelle Vereinbarungen haben Vorrang. Änderungen und Ergänzungen sollen zu Nachweiszwecken in Textform dokumentiert werden. Die Unwirksamkeit einzelner Bestimmungen lässt die Wirksamkeit der übrigen Bestimmungen unberührt; an die Stelle unwirksamer Bestimmungen tritt die gesetzliche Regelung.'
		]
	}
];

export const MODULE_LEGAL_SECTIONS: LegalSection[] = [
	{
		id: 'module-catering', module: 'catering', title: 'Pizza-Catering',
		paragraphs: [
			'ALL IN AGI beschafft Pizza über geeignete gewerbliche Anbieter. Vorgesehen sind Margherita, Salami und vegetarische Sorten in einer zur bestätigten Teilnehmendenzahl passenden Menge. Lieferzeiten und geringfügige, zumutbare Sortimentsänderungen können vom Drittanbieter abhängen.',
			'Allergeninformationen für lose Lebensmittel werden vor Ausgabe zugänglich gemacht. Der Kunde übermittelt Ernährungswünsche möglichst als anonyme Mengen. Teilnehmende mit Allergien oder Unverträglichkeiten müssen die verfügbaren Angaben eigenverantwortlich prüfen und bei Zweifeln auf den Verzehr verzichten; eine Haftung für schuldhaft verursachte Gesundheitsverletzungen wird dadurch nicht ausgeschlossen.',
			'Eigene Mitarbeitende von ALL IN AGI übernehmen keine erlaubnis- oder belehrungspflichtige gewerbliche Lebensmittelhandhabung ohne die gesetzlich erforderlichen Nachweise.'
		]
	},
	{
		id: 'module-tools', module: 'tool_accounts', title: 'AI-Tool-Zugänge',
		paragraphs: [
			'ALL IN AGI stellt nur solche Zugänge bereit, deren Vertrags- und Lizenzbedingungen die vorgesehene Nutzung erlauben. Accounts werden, soweit der Anbieter dies verlangt, individuell zugeordnet; eine unzulässige gemeinsame Nutzung von Passwörtern findet nicht statt.',
			'Über bereitgestellte Tool-Zugänge dürfen ohne gesonderte Sicherheits- und Auftragsverarbeitungsvereinbarung keine personenbezogenen Daten, Produktivdaten, Geheimnisse oder vertraulicher Quellcode verarbeitet werden. Der Kunde sorgt für geeignete synthetische oder nicht vertrauliche Testdaten. Funktionen, Verfügbarkeit und Ausgaben der Drittanbieter können sich ändern und werden nicht als fehlerfrei oder für einen bestimmten Produktivzweck geeignet garantiert.'
		]
	},
	{
		id: 'module-photos', module: 'event_photos', title: 'Eventfoto-Service',
		paragraphs: [
			'Fotoaufnahmen und deren geschützte Bereitstellung an den Kunden beziehungsweise an Teilnehmende erfolgen nur im vereinbarten Umfang und auf einer tragfähigen Rechtsgrundlage. Der Kunde unterstützt einen klar erkennbaren No-Photo-Prozess; Personen ohne erforderliche Rechtsgrundlage werden nicht gezielt aufgenommen beziehungsweise vor einer Nutzung ausgesondert.',
			'Website-, Social-Media-, Werbe- oder Sales-Nutzung erfolgt nur für die konkret benannten Kanäle und Zwecke, in die die abgebildete Person getrennt eingewilligt hat. Ein Widerruf wirkt für die Zukunft und wird für kontrollierbare eigene Kanäle unverzüglich umgesetzt. Bereits rechtmäßig veröffentlichte Druckmedien und Weiterverbreitungen durch unabhängige Dritte können technisch nicht vollständig zurückgeholt werden.'
		]
	}
];

export const EN_BASE_LEGAL_SECTIONS: LegalSection[] = [
	{ id: 'scope', title: '1. Provider, scope, and business-customer status', paragraphs: ['These Terms and Conditions govern B2B hackathons and related services supplied by Emilian Scheel, trading as ALL IN AGI, Moosdorfstraße 10, 12435 Berlin, Germany (“ALL IN AGI”).', 'The offer is exclusively for entrepreneurs within Section 14 of the German Civil Code, legal entities under public law, and special funds under public law. The person submitting the request confirms that they are authorized to act for the named company.', 'The standard hackathon is a closed company event for adult participants invited by the customer. Public events, minors, and alcohol require a separate written agreement.'] },
	{ id: 'formation', title: '2. Request, preparation call, and contract formation', paragraphs: ['The online configuration and date reservation are a non-binding request, not an acceptance or booking confirmation. The displayed price is the basis for the preparation call.', 'A contract is formed when the customer and ALL IN AGI orally agree to the summarized services during the preparation call. ALL IN AGI records the approving parties, time, configuration, price, included modules, and Terms version, and promptly sends confirmation in text form.', 'Either party may withdraw without charge by informal email until two Berlin business days after the recorded agreement. This contractual exit right is not a statutory consumer right of withdrawal.'] },
	{ id: 'services', title: '3. Services and customer responsibilities', paragraphs: ['The frozen service confirmation and its selected modules define the scope. General website or presentation content is included only when the confirmation references it.', 'The customer provides an authorized contact, agreed access and information, suitable rooms, stable Wi-Fi, a large display, and customer devices with the required permissions.', 'Changes to date, attendance, address, demo setup, or tools require documented confirmation.'] },
	{ id: 'payment', title: '4. Fees, VAT, and payment', paragraphs: ['Prices are net plus legally applicable VAT. The service confirmation states net fee, VAT, and gross total.', 'After contract formation, 30 percent of the net fee plus VAT is invoiced with seven calendar days for payment. The final invoice is issued after the event, credits the deposit received, and is due within 14 calendar days.', 'German statutory rules apply to late payment, set-off, and retention.'] },
	{ id: 'cancellation', title: '5. Cancellation by the customer', paragraphs: ['After the free two-day exit period, the customer may cancel in text form.', 'For cancellation received at least 14 calendar days before the event, liquidated damages are €1,000 net for 15 participants, €1,500 net for 30 participants, or €2,000 net for 50 participants.', 'For later cancellation, 100 percent of the agreed net fee is payable less saved expenses and replacement revenue. The customer may prove lower damage; ALL IN AGI may prove higher actual damage. Deposits are credited and excess amounts refunded.'] },
	{ id: 'reschedule', title: '6. Rescheduling, impediments, and force majeure', paragraphs: ['Rescheduling is subject to availability and nonrecoverable third-party costs. There is no entitlement to a particular replacement date.', 'ALL IN AGI may replace named facilitators with suitably qualified people. If a material service becomes permanently impossible, the customer may withdraw from that portion and receives a refund for services not supplied.', 'For events beyond either party’s reasonable control, the parties first seek a replacement date; otherwise completed work and expressly approved nonrecoverable costs are settled.'] },
	{ id: 'conduct', title: '7. Safety, conduct, and exclusion', paragraphs: ['The customer ensures participants follow safety, premises, confidentiality, and usage rules. ALL IN AGI may exclude anyone creating a concrete danger, serious disruption, unlawful conduct, or repeated breach of safety instructions.', 'Emergencies and damage must be reported immediately. Mandatory occupational health and safety duties remain unaffected.'] },
	{ id: 'confidentiality', title: '8. Confidentiality, work product, and third-party rights', paragraphs: ['Both parties keep confidential information secret and use it only to perform the contract, subject to customary exceptions for public, previously known, or independently developed information.', 'Rights in concepts, source code, data, and other work remain with their respective creator or owner. ALL IN AGI receives only the non-exclusive rights required to deliver the event.', 'The customer is responsible for the legality of supplied content, data, and access. Third-party and open-source terms also apply; AI-generated results are not guaranteed to be exclusive, protectable, or error-free.'] },
	{ id: 'privacy', title: '9. Privacy and photo consent', paragraphs: ['Personal data is processed under the Privacy Notice. If ALL IN AGI processes personal data on the customer’s behalf, the parties enter into a separate agreement under Article 28 GDPR before processing begins.', 'Marketing publication of photos or videos requires separate, voluntary, documented consent that may be withdrawn prospectively. Participation must remain possible without marketing consent.'] },
	{ id: 'liability', title: '10. Liability', paragraphs: ['ALL IN AGI has unlimited liability for intent, gross negligence, injury to life, body or health, product liability, and guarantees.', 'For a slightly negligent breach of an essential contractual duty, liability is limited to foreseeable loss typical for this contract. Liability for other slight negligence is excluded to the extent permitted by law.', 'These limitations also benefit employees, agents, and legal representatives. Mandatory liability remains unaffected.'] },
	{ id: 'closing', title: '11. Final provisions', paragraphs: ['German law applies, excluding the UN Convention on Contracts for the International Sale of Goods. Berlin is the exclusive venue where legally permitted under Section 38 of the German Code of Civil Procedure.', 'Individual agreements prevail. Amendments should be recorded in text form for evidence. If a provision is invalid, the remaining provisions continue and statutory law replaces the invalid provision.'] }
];

export const EN_MODULE_LEGAL_SECTIONS: LegalSection[] = [
	{ id: 'module-catering', module: 'catering', title: 'Pizza catering', paragraphs: ['ALL IN AGI orders pizza from suitable commercial providers in quantities appropriate for the confirmed attendance. Delivery times and minor reasonable substitutions may depend on the provider.', 'Allergen information is made available. Participants with allergies or intolerances must review it and refrain from eating when uncertain; this does not exclude liability for culpably caused injury.'] },
	{ id: 'module-tools', module: 'tool_accounts', title: 'AI tool accounts', paragraphs: ['ALL IN AGI supplies only accounts whose terms permit the intended use. Individual assignment is used where required; passwords are not impermissibly shared.', 'No personal data, production data, secrets, or confidential source code may be processed through supplied accounts without a separate approved security and data-processing arrangement.'] },
	{ id: 'module-photos', module: 'event_photos', title: 'Event photography', paragraphs: ['Photos and protected delivery are limited to the agreed scope and require a valid legal basis. The customer supports a clear no-photo process.', 'Website, social, advertising, or sales use requires separate consent for the named channels and purposes. Prospective withdrawal is implemented promptly on controlled channels.'] }
];

export function legalVersion(locale: Locale = 'de') {
	return locale === 'en' ? `${LEGAL_DOCUMENT_VERSION}-en` : LEGAL_DOCUMENT_VERSION;
}

export function legalSections(locale: Locale = 'de') {
	return locale === 'en'
		? { base: EN_BASE_LEGAL_SECTIONS, modules: EN_MODULE_LEGAL_SECTIONS }
		: { base: BASE_LEGAL_SECTIONS, modules: MODULE_LEGAL_SECTIONS };
}

export function legalModulesForConfiguration(config: Pick<BookingConfiguration, 'venueProvided' | 'lunch' | 'deviceProvision' | 'toolProvision' | 'eventPhotos'>): LegalModule[] {
	return [
		'catering',
		...(config.toolProvision === 'needed' ? ['tool_accounts' as const] : []),
		...(config.eventPhotos ? ['event_photos' as const] : [])
	];
}

export function legalDocumentPlainText(modules: readonly LegalModule[] = LEGAL_MODULES.map(({ id }) => id), locale: Locale = 'de') {
	const selected = new Set(modules);
	const localized = legalSections(locale);
	const sections = [...localized.base, ...localized.modules.filter((section) => section.module && selected.has(section.module))];
	return [
		locale === 'en' ? 'TERMS AND CONDITIONS FOR AGENTIC ENGINEERING HACKATHONS' : 'ALLGEMEINE GESCHÄFTSBEDINGUNGEN FÜR AGENTIC ENGINEERING HACKATHONS',
		`Version ${legalVersion(locale)}`,
		'',
		...sections.flatMap((section) => [section.title, ...section.paragraphs, ...(section.items ?? []).map((item) => `- ${item}`), ''])
	].join('\n').trim();
}
