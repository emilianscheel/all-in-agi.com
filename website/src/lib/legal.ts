import type { BookingConfiguration } from './booking';

export const LEGAL_DOCUMENT_VERSION = '2026-08-02';
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
	version: string;
	contentHash: string;
	modules: LegalModule[];
	content: string;
	capturedAt: string;
}

export const LEGAL_MODULES: ReadonlyArray<{ id: LegalModule; label: string; shortLabel: string }> = [
	{ id: 'venue', label: 'Location durch ALL IN AGI', shortLabel: 'Location' },
	{ id: 'catering', label: 'Catering durch ALL IN AGI', shortLabel: 'Catering' },
	{ id: 'organizer_devices', label: 'Veranstaltergeräte', shortLabel: 'Geräte' },
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
			'Änderungen an Termin, Teilnehmendenzahl, Location, Catering, Geräten oder Tools bedürfen einer dokumentierten Änderungsbestätigung. Preis- oder leistungsrelevante Änderungen ersetzen nicht stillschweigend die ursprüngliche Vereinbarung.'
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
			'Bei Zugang bis einschließlich 14 Kalendertage vor Veranstaltungsbeginn beträgt der pauschalierte Schadensersatz 1.000 Euro netto für die 15-Personen-Variante, 1.500 Euro netto für die 30-Personen-Variante oder 2.000 Euro netto für die 50-Personen-Variante. Wurden Veranstaltergeräte gebucht, kommen 500 Euro netto hinzu.',
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
		id: 'module-venue', module: 'venue', title: 'Zusatzmodul: Location durch ALL IN AGI',
		paragraphs: [
			'ALL IN AGI organisiert die in der Leistungsbestätigung beschriebene Location als eigener Vertragspartner des Kunden. Die endgültige Location steht unter dem Vorbehalt der dokumentierten Verfügbarkeit und Eignung. Wesentliche Abweichungen bei Ort, Kapazität oder Ausstattung bedürfen der Zustimmung des Kunden.',
			'ALL IN AGI prüft vor Bestätigung insbesondere die zulässige Veranstaltungs- und Drittnutzung, Kapazität, Brandschutzvorgaben, Fluchtwege, Hausordnung, Zugänglichkeit, Rückgabe- und Schlüsselpflichten sowie einen gegebenenfalls verlangten Versicherungsnachweis. Bei angemieteten Räumen muss die erforderliche Erlaubnis zur Überlassung an den Kunden und seine Teilnehmenden vorliegen.',
			'Der Kunde haftet nach den gesetzlichen Vorschriften für schuldhaft von ihm oder seinen Teilnehmenden verursachte Schäden. Normale Abnutzung ist kein Schaden. Zustand und außergewöhnliche Schäden werden nachvollziehbar dokumentiert.'
		]
	},
	{
		id: 'module-catering', module: 'catering', title: 'Zusatzmodul: Catering durch ALL IN AGI',
		paragraphs: [
			'ALL IN AGI beschafft Speisen und alkoholfreie Getränke über geeignete gewerbliche Anbieter. Art und Umfang ergeben sich aus der Leistungsbestätigung. Lieferzeiten und geringfügige, zumutbare Sortimentsänderungen können vom Drittanbieter abhängen.',
			'Allergeninformationen für lose Lebensmittel werden vor Ausgabe zugänglich gemacht. Der Kunde übermittelt Ernährungswünsche möglichst als anonyme Mengen. Teilnehmende mit Allergien oder Unverträglichkeiten müssen die verfügbaren Angaben eigenverantwortlich prüfen und bei Zweifeln auf den Verzehr verzichten; eine Haftung für schuldhaft verursachte Gesundheitsverletzungen wird dadurch nicht ausgeschlossen.',
			'Eigene Mitarbeitende von ALL IN AGI übernehmen keine erlaubnis- oder belehrungspflichtige gewerbliche Lebensmittelhandhabung ohne die gesetzlich erforderlichen Nachweise.'
		]
	},
	{
		id: 'module-devices', module: 'organizer_devices', title: 'Zusatzmodul: Veranstaltergeräte',
		paragraphs: [
			'Anzahl, Seriennummern, Zubehör, Zustand sowie Ausgabe und Rückgabe werden in einem Übergabeprotokoll festgehalten. Die Geräte dürfen nur während des vereinbarten Zeitraums, für den Hackathon und entsprechend der Nutzungs- und Sicherheitsregeln verwendet und nicht an unbeteiligte Dritte weitergegeben werden.',
			'Es dürfen ausschließlich synthetische oder nicht vertrauliche Daten verarbeitet werden. Personenbezogene Daten, Produktivdaten, Geschäftsgeheimnisse, Zugangsdaten und vertraulicher Quellcode sind ohne gesonderte schriftliche Sicherheits- und Auftragsverarbeitungsvereinbarung unzulässig. Lokale Daten und Sitzungen werden nach Rückgabe nach dem dokumentierten Löschprozess entfernt.',
			'Verlust, Diebstahl und Schäden sind unverzüglich zu melden. Die Haftung richtet sich nach Verschulden und nachgewiesenem Schaden; bei wirtschaftlichem Totalschaden ist grundsätzlich der Zeitwert maßgeblich. Normale Abnutzung wird nicht berechnet. Bei gemieteten Geräten stellt ALL IN AGI vor Ausgabe sicher, dass Weitergabe, Versicherung und Softwarelizenzierung gestattet sind.'
		]
	},
	{
		id: 'module-tools', module: 'tool_accounts', title: 'Zusatzmodul: AI-Tool-Zugänge',
		paragraphs: [
			'ALL IN AGI stellt nur solche Zugänge bereit, deren Vertrags- und Lizenzbedingungen die vorgesehene Nutzung erlauben. Accounts werden, soweit der Anbieter dies verlangt, individuell zugeordnet; eine unzulässige gemeinsame Nutzung von Passwörtern findet nicht statt.',
			'Für bereitgestellte Tool-Zugänge gelten dieselben Beschränkungen für personenbezogene Daten, Produktivdaten, Geheimnisse und vertraulichen Quellcode wie für Veranstaltergeräte. Der Kunde sorgt für geeignete Testdaten. Funktionen, Verfügbarkeit und Ausgaben der Drittanbieter können sich ändern und werden nicht als fehlerfrei oder für einen bestimmten Produktivzweck geeignet garantiert.'
		]
	},
	{
		id: 'module-photos', module: 'event_photos', title: 'Zusatzmodul: Eventfoto-Service',
		paragraphs: [
			'Fotoaufnahmen und deren geschützte Bereitstellung an den Kunden beziehungsweise an Teilnehmende erfolgen nur im vereinbarten Umfang und auf einer tragfähigen Rechtsgrundlage. Der Kunde unterstützt einen klar erkennbaren No-Photo-Prozess; Personen ohne erforderliche Rechtsgrundlage werden nicht gezielt aufgenommen beziehungsweise vor einer Nutzung ausgesondert.',
			'Website-, Social-Media-, Werbe- oder Sales-Nutzung erfolgt nur für die konkret benannten Kanäle und Zwecke, in die die abgebildete Person getrennt eingewilligt hat. Ein Widerruf wirkt für die Zukunft und wird für kontrollierbare eigene Kanäle unverzüglich umgesetzt. Bereits rechtmäßig veröffentlichte Druckmedien und Weiterverbreitungen durch unabhängige Dritte können technisch nicht vollständig zurückgeholt werden.'
		]
	}
];

export function legalModulesForConfiguration(config: Pick<BookingConfiguration, 'venueProvided' | 'lunch' | 'deviceProvision' | 'toolProvision' | 'eventPhotos'>): LegalModule[] {
	return [
		...(!config.venueProvided ? ['venue' as const] : []),
		...(config.lunch === 'pizza' || config.lunch === 'custom' ? ['catering' as const] : []),
		...(config.deviceProvision === 'needed' ? ['organizer_devices' as const] : []),
		...(config.toolProvision === 'needed' ? ['tool_accounts' as const] : []),
		...(config.eventPhotos ? ['event_photos' as const] : [])
	];
}

export function legalDocumentPlainText(modules: readonly LegalModule[] = LEGAL_MODULES.map(({ id }) => id)) {
	const selected = new Set(modules);
	const sections = [...BASE_LEGAL_SECTIONS, ...MODULE_LEGAL_SECTIONS.filter((section) => section.module && selected.has(section.module))];
	return [
		'B2B-AGB FÜR AGENTIC ENGINEERING HACKATHONS',
		`Version ${LEGAL_DOCUMENT_VERSION}`,
		'',
		...sections.flatMap((section) => [section.title, ...section.paragraphs, ...(section.items ?? []).map((item) => `- ${item}`), ''])
	].join('\n').trim();
}
