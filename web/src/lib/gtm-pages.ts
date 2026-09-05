import type { GtmHeroKey } from '$lib/gtm-images';
import { editorialPageContent } from '$lib/gtm-content';
import type { Locale } from '$lib/i18n';

export const GTM_GROUPS = [
	'Standorte',
	'Hackathon-Branchen',
	'Ziele',
	'Formate',
	'Tools',
	'Gesellschaft',
	'Branchen-Blueprints',
	'Mittelstand'
] as const;

export type GtmGroup = (typeof GTM_GROUPS)[number];

export const GTM_ICON_NAMES = [
	'MapPin',
	'Anchor',
	'Mountain',
	'CarFront',
	'Landmark',
	'Factory',
	'Code2',
	'Truck',
	'ShieldCheck',
	'Cog',
	'Rocket',
	'Bot',
	'Gauge',
	'Route',
	'UsersRound',
	'Trophy',
	'CalendarDays',
	'Lightbulb',
	'RefreshCw',
	'LockKeyhole',
	'Terminal',
	'FileText',
	'GitCompareArrows',
	'TestTubeDiagonal',
	'Workflow',
	'UserRoundCheck',
	'Clock3',
	'Flag',
	'BriefcaseBusiness',
	'Globe',
	'RadioTower',
	'Warehouse',
	'CircuitBoard',
	'Calculator',
	'ShoppingCart',
	'Crown',
	'MapPinned',
	'Building2',
	'Cpu',
	'Pickaxe'
] as const;

export type GtmIconName = (typeof GTM_ICON_NAMES)[number];

export type GtmPageBase = {
	slug: string;
	group: GtmGroup;
	title: string;
	footerLabel: string;
	icon: GtmIconName;
	publishedAt: string;
	heroImage: GtmHeroKey;
	description: string;
};

export type GtmOfferPage = GtmPageBase & {
	kind: 'offer';
	lead: [string, string];
	relevanceTitle: string;
	relevance: [string, string];
	challenges: [string, string, string, string, string];
	audienceTitle: string;
	audienceIntro: string;
	audience: [string, string, string, string];
	security: [string, string];
	outcome: [string, string];
};

export type EditorialParagraph = {
	text: string;
	sourceIds?: string[];
};

export type EditorialSection = {
	title: string;
	paragraphs: EditorialParagraph[];
	bullets?: EditorialParagraph[];
};

export type EditorialSource = {
	id: string;
	label: string;
	publisher: string;
	url: string;
};

export type EditorialGtmPage = GtmPageBase & {
	kind: 'editorial';
	seoTitle: string;
	dek: string;
	sections: EditorialSection[];
	sources: EditorialSource[];
	relatedSlugs: string[];
	dateModified?: string;
	blueprint?: boolean;
};

export type GtmPage = GtmOfferPage | EditorialGtmPage;

type GtmPageContent = Omit<GtmOfferPage, 'kind' | 'publishedAt' | 'heroImage'>;
export type EditorialPageContent = Omit<EditorialGtmPage, 'heroImage'>;

export const GTM_PUBLICATION_DATE = '2026-07-29';

const gtmPageContent: GtmPageContent[] = [
	{
		slug: 'hackathon-unternehmen-berlin',
		group: 'Standorte',
		title: 'Hackathon für Unternehmen in Berlin',
		footerLabel: 'Hackathon in Berlin',
		icon: 'MapPin',
		description:
			'Agentic Engineering Hackathon für Berliner Unternehmen: reale Challenges, aktuelle Coding Agents und Working Prototypes an einem Tag.',
		lead: [
			'Berlin hat viele Teams, die digitale Produkte, Plattformen und interne Software bereits mit hohem Tempo entwickeln. Trotzdem bleibt der Einsatz von Coding Agents häufig individuell: Einige Engineers nutzen die Werkzeuge täglich, andere haben nur eine Lizenz erhalten, und Product oder Fachbereiche sehen noch nicht, was damit praktisch möglich ist.',
			'Ein Agentic Engineering Hackathon schafft einen gemeinsamen Startpunkt. 15 bis 50 Personen arbeiten vor Ort an echten Herausforderungen aus dem Unternehmen, in kleinen gemischten Teams und ausschließlich mit dem vereinbarten Tool- und Daten-Setup. Am Nachmittag stehen funktionierende Prototypen auf der Bühne statt weiterer Strategiefolien.'
		],
		relevanceTitle: 'Ein Build Day für Berlins Produkt- und Engineering-Teams',
		relevance: [
			'Das Format passt besonders zu Softwareunternehmen, digitalen Marktplätzen, Commerce-Teams, Corporate Ventures und internen Plattformorganisationen. Gerade dort treffen starke Engineering-Kompetenz, kurze Produktzyklen und viele mögliche AI-Anwendungen aufeinander. Der Engpass ist selten die Idee, sondern die koordinierte Umsetzung über Rollen und Teams hinweg.',
			'Vor dem Event werden drei bis acht Challenges mit ihren fachlichen Eigentümern zugeschnitten. Jede Challenge bekommt einen klaren Nutzer, einen begrenzten Workflow und ein überprüfbares Demo-Ziel. So entsteht kein beliebiger Ideenwettbewerb, sondern ein kontrollierter Aktivierungstag für bereits vorhandene AI- und Produktambitionen.'
		],
		challenges: [
			'Ein Issue-to-Reproduction-Agent, der Fehlerberichte strukturiert und einen nachvollziehbaren Testfall vorbereitet.',
			'Ein interner Navigator für APIs, Architekturentscheidungen und technische Dokumentation mit verlinkten Quellen.',
			'Ein Prototyp, der Produktfeedback clustert und daraus überprüfbare Lösungsansätze für ein Product-Team ableitet.',
			'Ein Support-Workflow, der aus Tickets relevante Kontextinformationen, Antwortentwürfe und nächste Schritte zusammenstellt.',
			'Ein Developer-Onboarding-Assistent, der neue Teammitglieder durch Repository, Tooling und erste Änderungen führt.'
		],
		audienceTitle: 'Für wen der Berliner Hackathon geeignet ist',
		audienceIntro:
			'Der beste Sponsor sitzt nah genug an den Teams, um konkrete Challenges und 15 bis 30 Builder zusammenzubringen, und hat zugleich die Verantwortung, aus AI-Strategie sichtbare Anwendung zu machen.',
		audience: [
			'VP oder Head of Engineering mit einem klar abgegrenzten Produkt- oder Plattformbereich.',
			'CTO- oder CDO-Office mit einem laufenden AI-Programm und Bedarf an belastbaren Prototypen.',
			'Developer Experience, Engineering Enablement oder interne Academy nach einem Tool-Rollout.',
			'Product-, Innovation- und Fachverantwortliche, die gemeinsam mit Engineers reale Workflows testen wollen.'
		],
		security: [
			'Das Tool-Setup wird nicht am Eventtag improvisiert. Im Prep Call werden Accounts, Repositories, Datenklassen, erlaubte Modelle und die Nutzung von Quellcode geklärt. Wenn produktive Daten nicht genutzt werden dürfen, wird die Challenge mit synthetischen oder de-identifizierten Beispielen vorbereitet.',
			'ALL IN AGI arbeitet innerhalb der Regeln des Unternehmens. Es werden keine nicht freigegebenen Accounts vorausgesetzt und keine produktiven Agenten in Live-Prozesse eingebaut. Ziel ist ein sicherer, sichtbarer Prototyp mit dokumentierten Grenzen und einem verantwortlichen nächsten Schritt.'
		],
		outcome: [
			'Der Demo Day zeigt, welche Workflows mit dem vorhandenen Tool-Stack funktionieren, wo Zugänge oder Governance bremsen und welche Teams das Thema weiterführen können. Neben den Prototypen entsteht eine priorisierte Follow-up-Liste mit Eigentümern statt einer Sammlung unverbindlicher Ideen.',
			'Für Berliner Unternehmen ist der Tag damit zugleich Capability Building und Produktentdeckung: Die Beteiligten lernen durch Bauen, Führungskräfte sehen konkrete Ergebnisse und das Unternehmen erhält eine kleine, belastbare Grundlage für die nächste Investitionsentscheidung.'
		]
	},
	{
		slug: 'hackathon-unternehmen-hamburg',
		group: 'Standorte',
		title: 'Hackathon für Unternehmen in Hamburg',
		footerLabel: 'Hackathon in Hamburg',
		icon: 'Anchor',
		description:
			'Agentic Engineering Hackathon in Hamburg für Logistik, Handel und Software: echte Workflows werden in einem Tag zu Working Prototypes.',
		lead: [
			'Hamburger Unternehmen verbinden digitale Produkte häufig mit komplexen operativen Abläufen: Lieferketten, Lager, Handel, Mobilität, Kundenservice und konzernweite IT müssen zuverlässig zusammenspielen. Coding Agents eröffnen neue Wege, diese Prozesse schneller zu untersuchen und Prototypen näher an der tatsächlichen Arbeit zu bauen.',
			'Der Hackathon bringt Engineering, Product und Domänenwissen für einen Tag an einen Tisch. Die Teams arbeiten nicht an generischen Übungen, sondern an vorher ausgewählten Abläufen aus dem Unternehmen. Aktuelle AI Coding Tools helfen beim Verstehen, Strukturieren und Bauen; die fachliche Entscheidung bleibt bei den Menschen im Raum.'
		],
		relevanceTitle: 'Von operativer Ausnahme zum testbaren Workflow',
		relevance: [
			'In Logistik und Handel liegen interessante AI-Chancen oft in den Ausnahmen: eine verspätete Lieferung, unvollständige Lieferantendaten, widersprüchliche Bestände oder ein Kundenfall, der mehrere Systeme berührt. Solche Probleme sind für einen Build Day geeignet, wenn der Ausschnitt eng genug gewählt und mit sicheren Beispieldaten beschrieben wird.',
			'Vor dem Termin entwickeln Challenge Owner gemeinsam mit ALL IN AGI einen klaren User Flow. Dadurch wissen die Builder, welche Entscheidung unterstützt werden soll, welche Eingaben verfügbar sind und was die Demo am Ende tatsächlich zeigen muss. Der Event wird so zu einem Aktivierungspilot und nicht zu einer losgelösten Hackathon-Show.'
		],
		challenges: [
			'Ein Assistent für Liefer- oder Warehouse-Ausnahmen, der Ereignisse bündelt und prüfbare Handlungsoptionen vorbereitet.',
			'Ein Supplier-Onboarding-Prototyp, der Dokumente auf Vollständigkeit prüft und offene Angaben transparent markiert.',
			'Ein Workflow für Retourengründe, der Muster sichtbar macht und nächste Bearbeitungsschritte vorschlägt.',
			'Ein interner Navigator für Betriebsanweisungen, Servicewissen und technische Dokumentation mit Quellenbezug.',
			'Ein Prototyp, der synthetische Logistikereignisse in ein verständliches operatives Lagebild übersetzt.'
		],
		audienceTitle: 'Geeignete Teams und Sponsoren',
		audienceIntro:
			'Besonders wirksam ist der Tag für einen einzelnen Geschäftsbereich mit einem Sponsor, der den Demo Day besucht und für erfolgreiche Prototypen eine Weiterarbeit ermöglichen kann.',
		audience: [
			'Digital- und Product-Leads in Logistik, Supply Chain, Commerce oder Customer Operations.',
			'Engineering-Leads für operative Plattformen, interne Systeme und Datenprodukte.',
			'Innovationsteams mit Zugang zu fachlichen Challenge Ownern und realistischen Testdaten.',
			'Fachverantwortliche aus Lager, Service, Einkauf oder Retouren gemeinsam mit Software- und Datenteams.'
		],
		security: [
			'Betriebs-, Lieferanten- und Kundendaten bleiben im vereinbarten Rahmen. Vorab wird festgelegt, ob vorhandene Sandbox-Daten verwendet werden können oder synthetische Ereignisse, Dokumente und Stammdaten vorbereitet werden. Auch Zugriffe auf interne Dokumentation werden auf die freigegebenen Quellen begrenzt.',
			'Die Demo behauptet keine Produktionsreife. Sie zeigt einen funktionierenden Nutzerfluss, dokumentiert technische Annahmen und macht menschliche Freigaben sichtbar. Damit kann Security den Prototyp bewerten, ohne dass ein Experiment unkontrolliert in operative Prozesse eingreift.'
		],
		outcome: [
			'Am Ende stehen mehrere live demonstrierbare Workflows sowie Erkenntnisse darüber, welche Daten, APIs und Freigaben für eine Weiterentwicklung fehlen. Das Outcome Memo hält Prototype, Nutzenhypothese, Tool-Reibung und nächsten Eigentümer fest.',
			'So wird aus einem einzelnen Tag eine belastbare Entscheidungshilfe: Welche Idee verdient einen nächsten Sprint, welche braucht zuerst bessere Daten und welche sollte bewusst nicht weiterverfolgt werden?'
		]
	},
	{
		slug: 'hackathon-unternehmen-muenchen',
		group: 'Standorte',
		title: 'Hackathon für Unternehmen in München',
		footerLabel: 'Hackathon in München',
		icon: 'Mountain',
		description:
			'Agentic Engineering Hackathon für Münchner Unternehmen aus Software und Industrie – mit freigegebenen Tools und realen Challenges.',
		lead: [
			'Unternehmen im Raum München entwickeln komplexe Softwareprodukte, industrielle Systeme und digitale Services. Viele Teams evaluieren bereits Coding Agents oder haben erste Lizenzen ausgerollt. Der Unterschied zwischen einem Tool im Portfolio und einer wirksamen Arbeitsweise zeigt sich jedoch erst an echten Aufgaben.',
			'Ein moderierter Agentic Engineering Hackathon verdichtet diese Lernphase auf einen Tag. Gemischte Teams wählen einen begrenzten Unternehmens-Workflow, bauen mit den freigegebenen Werkzeugen und präsentieren einen funktionierenden Prototyp. Das Format schafft gemeinsame Erfahrung, ohne eine unternehmensweite Transformation zu versprechen.'
		],
		relevanceTitle: 'Komplexität in einen klaren Prototype schneiden',
		relevance: [
			'Enterprise Software und Industrieprodukte bringen umfangreiche Domänenmodelle, gewachsene Codebasen und hohe Qualitätsanforderungen mit. Genau deshalb beginnt der Hackathon nicht mit spontanen Ideen. In der Vorbereitung werden Nutzer, vorhandene Systeme, Datenzugänge, Risiken und eine realistische Grenze für den Tag festgelegt.',
			'Der interessante Lerneffekt entsteht an den Schnittstellen: Wenn Engineers, Product Manager und Domänenexperten denselben Workflow modellieren, wird schnell sichtbar, welche Teile sich mit Coding Agents beschleunigen lassen und wo menschliche Entscheidung, Fachwissen oder Systemintegration unverzichtbar bleiben.'
		],
		challenges: [
			'Ein Migration Assistant, der einen begrenzten Teil einer älteren Codebasis erklärt und einen überprüfbaren Änderungsvorschlag vorbereitet.',
			'Ein Engineering-Workflow für Testgenerierung, der Anforderungen in nachvollziehbare Testfälle und offene Fragen übersetzt.',
			'Ein Konfigurationsassistent für ein komplexes Produkt mit klaren Regeln und sichtbaren Unsicherheiten.',
			'Ein Service-Prototyp, der technische Dokumente und Fehlercodes für einen konkreten Nutzerfall zusammenführt.',
			'Ein interner API-Navigator, der passende Schnittstellen findet, Beispiele erzeugt und direkt zu den Quellen verlinkt.'
		],
		audienceTitle: 'Wann sich der Tag lohnt',
		audienceIntro:
			'Der Hackathon ist besonders geeignet, wenn ein Bereich bereits einen Tool-Pfad besitzt, die Nutzung aber uneinheitlich ist oder noch keine gemeinsam bewerteten Unternehmens-Cases entstanden sind.',
		audience: [
			'CTO-, CDO- und Digital-Offices mit einem klar abgegrenzten Pilotbereich.',
			'VPs und Heads of Engineering in Enterprise Software, Plattformen oder industrieller Entwicklung.',
			'Engineering Enablement und Developer Experience nach Einführung eines Coding-Agent-Werkzeugs.',
			'Product- und Domänenverantwortliche, die Prototypen gemeinsam mit technischen Teams validieren wollen.'
		],
		security: [
			'Vor dem Event wird geklärt, welche Modelle, Erweiterungen, Repositories und Datenklassen verwendet werden dürfen. Proprietärer Quellcode wird nur in ausdrücklich freigegebenen Umgebungen genutzt. Alternativ kann eine repräsentative Sandbox oder ein isolierter Code-Ausschnitt vorbereitet werden.',
			'Jede Challenge enthält eine Prototype Boundary: keine Produktion, keine autonomen Änderungen an Live-Systemen und keine Verarbeitung nicht freigegebener Daten. Diese Grenze beschleunigt die Arbeit, weil das Team nicht während des Build Sprints über grundlegende Regeln verhandeln muss.'
		],
		outcome: [
			'Der Tag endet mit sichtbaren Demos, einer kurzen Machbarkeitsnotiz und einer Liste konkreter Folgeentscheidungen. Dabei zählt nicht nur, was funktioniert hat. Auch fehlende Dokumentation, unklare Zugänge oder ungeeignete Tool-Konfigurationen sind wertvolle Ergebnisse für die weitere Adoption.',
			'Das Unternehmen erhält damit eine gemeinsame Referenz für Engineering, Product und Führung: keine abstrakte Bewertung von AI, sondern beobachtete Leistung an den eigenen Arbeitsabläufen.'
		]
	},
	{
		slug: 'hackathon-unternehmen-stuttgart',
		group: 'Standorte',
		title: 'Hackathon für Unternehmen in Stuttgart',
		footerLabel: 'Hackathon in Stuttgart',
		icon: 'CarFront',
		description:
			'Agentic Engineering Hackathon für Stuttgarter Industrie-, Automotive- und Softwareteams: sicher bauen, live demonstrieren, weiterarbeiten.',
		lead: [
			'In Stuttgart und der umliegenden Industrieregion treffen Softwareentwicklung, Produktion, Automotive, Maschinenbau und technischer Service aufeinander. Coding Agents können in diesen Umgebungen mehr leisten als Code vervollständigen: Sie helfen, Wissen zugänglich zu machen, Tests vorzubereiten und komplexe Workflows schnell als Prototyp sichtbar zu machen.',
			'Der ALL IN AGI Hackathon ist ein kompakter Activation Pilot für einen klar abgegrenzten Bereich. 15 bis 50 Personen bauen einen Tag lang an realen Challenges. Engineering, Product und Fachbereiche arbeiten gemeinsam; der Demo Day macht Ergebnis, Grenzen und nächste Schritte für den Sponsor sichtbar.'
		],
		relevanceTitle: 'Engineering-Wissen praktisch aktivieren',
		relevance: [
			'Industrielle Organisationen verfügen über viel wertvolles Wissen, das über Code, Dokumentation, Servicefälle und erfahrene Mitarbeitende verteilt ist. Ein Hackathon kann dieses Wissen nicht ersetzen. Er kann aber zeigen, wie moderne Werkzeuge einen konkreten Zugriffspfad verbessern und welche Voraussetzungen dafür fehlen.',
			'Die Challenges werden deshalb entlang echter Nutzer ausgewählt: Entwicklerinnen, Inbetriebnehmer, Service-Techniker, Produktmanager oder interne Plattformteams. Ein begrenzter Workflow und vorbereitete Testdaten sorgen dafür, dass innerhalb eines Tages ein ehrlicher, vorführbarer Stand entsteht.'
		],
		challenges: [
			'Ein Testgenerierungs-Prototyp für einen abgegrenzten Legacy-Bereich mit nachvollziehbarer Abdeckung und Review-Schritt.',
			'Ein Engineering Change Explorer, der Abhängigkeiten einer Änderung sichtbar macht und offene Prüfungen sammelt.',
			'Ein Assistent für Inbetriebnahme oder Konfiguration auf Basis freigegebener technischer Unterlagen.',
			'Ein Service-Workflow, der Fehlerbild, relevante Handbücher und mögliche nächste Diagnoseaktionen zusammenstellt.',
			'Ein internes Entwicklerwerkzeug, das wiederkehrende Repository- oder Dokumentationsaufgaben beschleunigt.'
		],
		audienceTitle: 'Passende Teilnehmer und Verantwortliche',
		audienceIntro:
			'Ein starker Event kombiniert die Personen, die den technischen Weg kennen, mit denjenigen, die Nutzen, Risiko und spätere Umsetzung verantworten.',
		audience: [
			'Leitung Softwareentwicklung, Digital Engineering oder technische Plattformen.',
			'Product Owner und Fachverantwortliche aus Engineering, Produktion, Service oder Qualität.',
			'Developer Experience, Toolchain- und Engineering-Enablement-Teams.',
			'IT-Security- oder Data-Governance-Ansprechpartner in der Vorbereitung, nicht als nachträgliche Freigabestelle.'
		],
		security: [
			'Quellcode, technische Dokumente und Maschinendaten werden nur im abgestimmten Bereich verwendet. Bei sensiblen Informationen arbeitet das Team mit synthetischen Fehlerbildern, freigegebenen Ausschnitten oder einer isolierten Entwicklungsumgebung. Die Verantwortung für Accounts und Zugänge bleibt beim Unternehmen.',
			'Der Prototyp erhält sichtbare Grenzen und menschliche Prüfschritte. Er wird nicht als produktionsfertiges System verkauft. Dadurch kann der Demo Day offen zeigen, was bereits funktioniert und welche Qualitäts-, Integrations- oder Governance-Arbeit vor einem Piloteinsatz notwendig wäre.'
		],
		outcome: [
			'Neben den Demos entsteht eine kleine Prototype-Inventur: Nutzerproblem, verwendete Daten, aktueller Funktionsstand, bekannte Risiken und ein benannter nächster Eigentümer. Diese Struktur verhindert, dass gute Ergebnisse nach dem Event in einem Ordner verschwinden.',
			'Für den Sponsor wird sichtbar, wo Coding Agents heute konkrete Hebel bieten, welche Teams interne Champions werden können und wo zuerst Tooling oder Wissenszugang verbessert werden sollte.'
		]
	},
	{
		slug: 'hackathon-unternehmen-frankfurt',
		group: 'Standorte',
		title: 'Hackathon für Unternehmen in Frankfurt am Main',
		footerLabel: 'Hackathon in Frankfurt',
		icon: 'Landmark',
		description:
			'Security-konformer Agentic Engineering Hackathon in Frankfurt für Finance, Insurance und regulierte Unternehmensbereiche.',
		lead: [
			'Frankfurter Unternehmen aus Finanzwirtschaft, Versicherungen, Software und unternehmenskritischer IT müssen Innovation und Kontrolle gleichzeitig beherrschen. Bei Coding Agents entscheidet deshalb nicht nur die technische Fähigkeit, sondern auch der Umgang mit Daten, Nachvollziehbarkeit und menschlicher Freigabe.',
			'Ein Agentic Engineering Hackathon bietet einen begrenzten Rahmen, um genau diese Fragen praktisch zu testen. Die Teams bauen mit freigegebenen Accounts und synthetischen oder de-identifizierten Daten. Der Schwerpunkt liegt auf sichtbaren Nutzerflüssen und überprüfbaren Zwischenschritten, nicht auf autonomen Entscheidungen in produktiven Prozessen.'
		],
		relevanceTitle: 'Governance wird Teil der Challenge',
		relevance: [
			'In regulierten Bereichen ist Security kein Programmpunkt am Ende, sondern eine Designbedingung. Schon bei der Challenge-Auswahl wird festgelegt, welche Datenklasse zulässig ist, wo ein Mensch entscheiden muss, welche Quellen angezeigt werden und wie sich ein Ergebnis prüfen lässt.',
			'Diese Klarheit macht den Tag produktiver. Builder können innerhalb der gesetzten Grenzen arbeiten, während Risiko- und Fachverantwortliche am Demo Day nicht nur eine Oberfläche sehen, sondern auch Annahmen, Kontrollpunkte und offene Fragen bewerten können.'
		],
		challenges: [
			'Ein Prozessnavigator über synthetische Richtlinien und Arbeitsanweisungen mit klarer Quellenanzeige.',
			'Ein Case-Triage-Prototyp, der Informationen strukturiert, Unsicherheiten markiert und die Entscheidung beim Menschen lässt.',
			'Ein Workflow zur Sammlung von Compliance-Evidenz aus freigegebenen Beispieldokumenten.',
			'Ein Testgenerator für einen abgegrenzten Bereich gewachsener Regel- oder Abrechnungssysteme.',
			'Ein Berater- oder Sachbearbeiter-Briefing auf Basis de-identifizierter Fälle und kontrollierter Wissensquellen.'
		],
		audienceTitle: 'Für regulierte Teams mit einem realistischen Sandbox-Pfad',
		audienceIntro:
			'Das Format setzt kein fertiges unternehmensweites AI-Regelwerk voraus. Es braucht aber einen Sponsor, einen zulässigen Tool-Pfad und die Bereitschaft, einen kleinen Workflow sauber zu begrenzen.',
		audience: [
			'Engineering- und Digital-Leads in Banken, Versicherungen, Fintech oder Corporate IT.',
			'Innovationsteams mit fachlichen Eigentümern für Prozess, Compliance und Daten.',
			'Developer Experience oder Platform Engineering nach Freigabe eines Coding-Agent-Tools.',
			'Fachbereiche, Security und Engineering, die einen konkreten Fall gemeinsam statt nacheinander bewerten wollen.'
		],
		security: [
			'Im Prep Call werden Datenklassen, Modellzugriff, Logging, Quellcode-Regeln, Dokumentenquellen und Verantwortlichkeiten festgehalten. Kann kein realistischer Sandbox- oder Synthetic-Data-Pfad geschaffen werden, wird die Challenge nicht für den Event eingeplant.',
			'Die Teams dokumentieren, wo ein Mensch freigibt, welche Aussage aus welcher Quelle kommt und welche Teile nur simuliert sind. Der Hackathon liefert keine regulatorische Freigabe, aber einen deutlich besseren Gegenstand für die anschließende Security- und Machbarkeitsbewertung.'
		],
		outcome: [
			'Der Demo Day zeigt nicht nur, ob ein Workflow technisch möglich ist. Er macht sichtbar, welche Kontrollen funktionieren, welche Daten fehlen und welche Risiken vor einer Weiterentwicklung gelöst werden müssen.',
			'Damit entsteht eine belastbare Brücke zwischen AI-Ambition und Governance: ein kleiner, beobachtbarer Pilot mit realen Eigentümern, dokumentierten Grenzen und einem klaren nächsten Entscheidungspunkt.'
		]
	},
	{
		slug: 'ki-hackathon-industrie',
		group: 'Hackathon-Branchen',
		title: 'KI-Hackathon für Industrieunternehmen',
		footerLabel: 'KI-Hackathon für Industrie',
		icon: 'Factory',
		description:
			'KI-Hackathon für Industrieunternehmen: Engineering-, Service- und Produktionsworkflows mit Coding Agents prototypisch umsetzen.',
		lead: [
			'Industrieunternehmen verfügen über hochspezialisierte Prozesse, technische Dokumentation und gewachsene Softwaresysteme. Gleichzeitig sollen AI-Initiativen schneller zu sichtbaren Ergebnissen führen. Ein KI-Hackathon verbindet diese beiden Welten, indem Teams einen begrenzten Arbeitsablauf aus dem eigenen Unternehmen in einen funktionierenden Prototyp übersetzen.',
			'ALL IN AGI setzt dabei auf Agentic Engineering statt allgemeiner AI-Schulung. Mindestens 70 Prozent des Tages werden gebaut. Engineers arbeiten mit Produkt-, Service- und Domänenexpertinnen zusammen und verwenden nur die Werkzeuge, Repositories und Datenklassen, die vorab mit dem Unternehmen vereinbart wurden.'
		],
		relevanceTitle: 'Echte industrielle Challenges statt Demo-Datensätze',
		relevance: [
			'Der Wert liegt nicht in einer spektakulären Oberfläche, sondern in der Verbindung von Nutzerproblem und technischem Pfad. Eine Challenge kann aus Engineering, Inbetriebnahme, Qualität, Service oder interner IT kommen. Entscheidend sind ein fachlicher Eigentümer, ein klarer Nutzer und eine Demo, die am Ende des Tages überprüft werden kann.',
			'In der Vorbereitung wird die Aufgabe so geschnitten, dass sie ambitioniert, aber nicht beliebig ist. Das Team arbeitet beispielsweise mit synthetischen Maschinendaten, freigegebenen Handbuchauszügen oder einem isolierten Codebereich. So bleibt der Event nah an der Realität, ohne Produktionssysteme zu gefährden.'
		],
		challenges: [
			'Ein Service-Techniker-Assistent über freigegebene Handbücher, Fehlercodes und definierte Diagnosepfade.',
			'Ein Prototype für Maschinenkonfiguration oder Inbetriebnahme mit sichtbaren Regeln und menschlicher Bestätigung.',
			'Ein Engineering Change Explorer, der Auswirkungen einer Änderung über ausgewählte Komponenten nachvollziehbar macht.',
			'Eine Anomalie-Triage auf Basis synthetischer Shopfloor-Ereignisse mit begründeten nächsten Prüfschritten.',
			'Testgenerierung und Legacy-Code-Erklärung für einen eng begrenzten, fachlich relevanten Softwarebereich.'
		],
		audienceTitle: 'Die richtige Teamzusammensetzung',
		audienceIntro:
			'Die stärksten Industrie-Hackathons sind weder reine IT-Events noch Fachbereichsworkshops. Sie kombinieren Menschen, die das Problem täglich erleben, mit denjenigen, die einen sicheren Prototype bauen können.',
		audience: [
			'Software-, Automation-, Data- und Platform-Engineers aus einem gemeinsamen Produkt- oder Prozessbereich.',
			'Product Owner, Service- und Engineering-Verantwortliche als Challenge Owner.',
			'Digitalisierung, Innovation oder Engineering Enablement als operativer Event Owner.',
			'IT-Security und Governance früh in der Vorbereitung, damit am Tag selbst gebaut werden kann.'
		],
		security: [
			'Vorab werden Tool-Ownership, Accounts, Quellcode-Nutzung, Datenklassen und technische Zugänge festgelegt. Sensible Betriebs- oder Kundendaten sind keine Voraussetzung. Repräsentative synthetische Daten und begrenzte Dokumentenausschnitte reichen häufig aus, um einen Nutzerfluss sinnvoll zu testen.',
			'Der Event endet nicht mit einem autonomen Agenten im Live-System. Er liefert einen Prototype, eine Machbarkeitsnotiz und offene Integrations- oder Qualitätsfragen. Diese Ehrlichkeit schützt den Betrieb und macht die Ergebnisse für eine spätere Entscheidung brauchbar.'
		],
		outcome: [
			'Ein erfolgreicher Tag produziert mehrere Demos, neue interne Builder und eine priorisierte Liste von Folgearbeiten. Der Sponsor sieht, welche Idee einen Sprint verdient und welche zunächst an Datenzugang, Dokumentation oder Tool-Freigabe scheitert.',
			'Für Industrieunternehmen entsteht so ein überschaubarer Aktivierungspilot: klein genug für einen einzelnen Bereich, konkret genug für eine Investitionsentscheidung und nah genug am Arbeitsalltag, um echte Adoption auszulösen.'
		]
	},
	{
		slug: 'hackathon-softwareunternehmen',
		group: 'Hackathon-Branchen',
		title: 'Agentic Engineering Hackathon für Softwareunternehmen',
		footerLabel: 'Hackathon für Softwareteams',
		icon: 'Code2',
		description:
			'Agentic Engineering Hackathon für Softwareunternehmen: Coding Agents an echten Produkt-, Support- und Plattform-Challenges einsetzen.',
		lead: [
			'Softwareunternehmen kennen Coding Agents meist bereits. Einzelne Engineers arbeiten täglich damit, andere testen vorsichtig, und viele Product- oder Support-Teams erleben den Nutzen nur indirekt. Ein Agentic Engineering Hackathon richtet den Blick deshalb nicht auf die Bedienung eines Tools, sondern auf gemeinsame Arbeitsweisen und echte Produktprobleme.',
			'An einem Tag bauen 15 bis 50 Personen mehrere Working Prototypes. Die Challenges stammen aus Product Engineering, Plattform, Support, Migration oder Developer Experience. Der enge Zeitrahmen erzwingt klare Nutzerflüsse und liefert sichtbare Erkenntnisse über Tooling, Codebasis und Teamzusammenarbeit.'
		],
		relevanceTitle: 'Von individueller Produktivität zu koordinierter Adoption',
		relevance: [
			'Eine Lizenz ist noch keine Adoption. Wenn nur einzelne Personen gute Prompts oder Agent-Workflows kennen, bleibt das Wissen schwer übertragbar. Im Hackathon arbeiten Engineers mit Product und Domänenrollen zusammen, erklären ihre Vorgehensweise und machen funktionierende Muster für andere Teams sichtbar.',
			'Der Event ist zugleich ein Test der internen Umgebung. Welche Repositories lassen sich gut erschließen? Wo fehlen Dokumentation oder sichere Zugänge? Welche Aufgaben profitieren von einem Agenten, und wo ist direkte menschliche Arbeit schneller? Der Demo Day macht diese Antworten konkret.'
		],
		challenges: [
			'Ein Issue-to-Reproduction-Agent, der Logs, Fehlerbericht und Codekontext in einen überprüfbaren Testfall übersetzt.',
			'Ein Migration Assistant für einen begrenzten Framework-, API- oder Datenmodellwechsel.',
			'Ein Support-Ticket-to-Test-Workflow, der aus einem Kundenfall eine reproduzierbare Qualitätsprüfung vorbereitet.',
			'Ein interner API- und Dokumentationsnavigator mit Beispielcode und direkten Quellenverweisen.',
			'Ein Developer-Onboarding-Prototyp, der Repository-Struktur, lokale Einrichtung und erste sichere Änderung verbindet.'
		],
		audienceTitle: 'Für produktnahe Softwareorganisationen',
		audienceIntro:
			'Der größte Effekt entsteht in einem Bereich, der reale Backlog-Themen, einen verantwortlichen Engineering Lead und mehrere Rollen für einen Tag zusammenbringen kann.',
		audience: [
			'VP oder Head of Engineering mit Verantwortung für mehrere Teams oder eine Plattform.',
			'Developer Experience und Engineering Enablement nach einem Copilot-, Cursor-, Claude- oder Codex-Rollout.',
			'Product- und Support-Leads mit wiederkehrenden Workflows und klaren Nutzerproblemen.',
			'Staff Engineers und interne AI Champions, die gute Praktiken verbreiten und Tool-Reibung sichtbar machen wollen.'
		],
		security: [
			'Der Tool-Stack wird vorab festgelegt. Unternehmenscode wird nur mit freigegebenen Accounts, Modellen und Erweiterungen genutzt. Wenn ein Repository nicht geeignet ist, kann die Challenge mit einem isolierten Modul, einer Sandbox oder repräsentativem Beispielcode vorbereitet werden.',
			'Pull Requests oder Prototypen aus dem Event durchlaufen weiterhin normale Reviews, Tests und Sicherheitsprozesse. Der Hackathon verkürzt die Entdeckung und das Lernen, ersetzt aber weder Engineering-Qualität noch die Verantwortung des Produktteams.'
		],
		outcome: [
			'Die Demos liefern konkrete Muster für zukünftige Agent-Workflows und zeigen zugleich die Grenzen der aktuellen Toolchain. Das Follow-up ordnet jeden Prototype einem Owner, einer offenen Frage und einem nächsten Schritt zu.',
			'So wird aus einem Tool-Rollout eine beobachtbare Veränderung: mehr Menschen können mit Coding Agents bauen, Product und Engineering teilen ein gemeinsames Bild und die Organisation weiß, welche Prototypen weiterverfolgt werden sollten.'
		]
	},
	{
		slug: 'ki-hackathon-logistik-handel',
		group: 'Hackathon-Branchen',
		title: 'KI-Hackathon für Logistik und Handel',
		footerLabel: 'KI-Hackathon für Logistik',
		icon: 'Truck',
		description:
			'KI-Hackathon für Logistik und Handel: operative Ausnahmen, Lieferanten- und Serviceprozesse als sichere Prototypen bauen.',
		lead: [
			'Logistik und Handel bestehen aus vielen miteinander verbundenen Entscheidungen. Lieferungen ändern sich, Bestände widersprechen sich, Retouren brauchen Kontext und Kundenservice springt zwischen Systemen. AI kann diese Arbeit unterstützen, wenn der konkrete Workflow verstanden und die Verantwortung sauber begrenzt ist.',
			'Der ALL IN AGI Hackathon bringt operative Fachkenntnis und technische Umsetzung für einen Tag zusammen. Teams wählen reale, eng geschnittene Challenges und bauen mit aktuellen Coding Agents einen vorführbaren Nutzerfluss. Synthetische Ereignisse und sichere Beispieldaten ermöglichen Praxisnähe ohne Zugriff auf sensible Live-Daten.'
		],
		relevanceTitle: 'Ausnahmen sichtbar und bearbeitbar machen',
		relevance: [
			'Viele operative Prozesse funktionieren im Normalfall bereits gut. Zeit verloren geht dort, wo Daten fehlen, Regeln kollidieren oder ein Fall mehrere Systeme berührt. Diese Ausnahmen sind ein guter Ausgangspunkt für einen Prototype, weil Nutzer, Eingaben und gewünschte Entscheidung konkret beschrieben werden können.',
			'Im Challenge Design wird festgelegt, was der Prototyp leisten soll: Informationen sammeln, Optionen erklären, Dokumente prüfen oder einen nächsten Schritt vorbereiten. Vollautomatische Entscheidungen sind kein Ziel des Tages. Der Mensch bleibt sichtbar im Prozess und kann das Ergebnis am Demo Day fachlich bewerten.'
		],
		challenges: [
			'Ein Delivery-Exception-Workflow, der Ereignisse bündelt und begründete nächste Schritte für die Disposition vorbereitet.',
			'Ein Supplier-Onboarding-Assistent, der Unterlagen strukturiert und fehlende Angaben transparent macht.',
			'Ein Retouren-Prototyp, der Gründe clustert und passende Bearbeitungsoptionen für einen konkreten Fall vorschlägt.',
			'Ein Customer-Service-Briefing, das freigegebene Informationen aus mehreren Quellen zu einer Übersicht verbindet.',
			'Ein operatives Dashboard, das aus synthetischen Warehouse-Ereignissen ein verständliches Lagebild generiert.'
		],
		audienceTitle: 'Fachbereich und Engineering in einem Team',
		audienceIntro:
			'Die Challenge Owner kommen aus dem operativen Alltag; die Builder aus Product, Software, Data und Automation. Diese Mischung verhindert sowohl technisch beeindruckende Lösungen ohne Nutzer als auch Ideen ohne realistischen Umsetzungspfad.',
		audience: [
			'Digital Product, E-Commerce, Supply Chain oder Warehouse Technology.',
			'Engineering- und Data-Teams für operative Plattformen und interne Systeme.',
			'Operations, Customer Service, Einkauf oder Retouren als fachliche Challenge Owner.',
			'Innovation und Transformation als Sponsor eines klar abgegrenzten Bereichspiloten.'
		],
		security: [
			'Kunden-, Lieferanten- und Bewegungsdaten werden nur im freigegebenen Setup verwendet. Für den Build Day können typische Fälle mit synthetischen IDs, Dokumenten und Ereignisfolgen vorbereitet werden. Das reicht, um Logik, Nutzerführung und Datenbedarf realistisch zu prüfen.',
			'Jeder Prototype dokumentiert, welche Systeme nur simuliert sind, welche Informationen fehlen und wo ein menschlicher Freigabeschritt notwendig ist. Eine spätere produktive Integration bleibt ein eigenes Vorhaben mit normalen Security- und Qualitätsprüfungen.'
		],
		outcome: [
			'Der Event liefert nicht nur Ideen, sondern benutzbare Demos und eine Liste konkreter Integrationsfragen. Teams erkennen, welche operativen Daten tatsächlich benötigt werden und wo bestehende Prozesse zuerst vereinfacht werden sollten.',
			'Für Entscheider entsteht eine schnelle, kostentransparente Grundlage: Welche Challenge zeigt genug Nutzen und Machbarkeit für einen nächsten Sprint, und welche wird bewusst nicht weiterverfolgt?'
		]
	},
	{
		slug: 'ki-hackathon-banken-versicherungen',
		group: 'Hackathon-Branchen',
		title: 'KI-Hackathon für Banken und Versicherungen',
		footerLabel: 'KI-Hackathon für Finance',
		icon: 'ShieldCheck',
		description:
			'KI-Hackathon für Banken und Versicherungen mit synthetischen Daten, freigegebenen Tools und nachvollziehbaren Human-in-the-Loop-Prototypen.',
		lead: [
			'Banken und Versicherungen müssen neue AI-Arbeitsweisen unter besonders klaren Bedingungen erproben. Daten dürfen nicht unkontrolliert fließen, Entscheidungen müssen nachvollziehbar bleiben und Fachlichkeit lässt sich nicht durch eine überzeugende Demo ersetzen. Genau deshalb braucht ein Hackathon hier mehr Vorbereitung und weniger Show.',
			'ALL IN AGI gestaltet einen eintägigen Activation Pilot in der genehmigten Umgebung des Unternehmens. Teams aus Engineering, Product, Fachbereich und Governance bauen an synthetischen oder de-identifizierten Fällen. Das Ergebnis sind überprüfbare Workflows mit sichtbaren Quellen, Unsicherheiten und menschlichen Entscheidungen.'
		],
		relevanceTitle: 'Sicher experimentieren, bevor groß investiert wird',
		relevance: [
			'Ein kleiner Prototype kann eine wichtige Frage früh beantworten: Ist der Workflow technisch und fachlich plausibel, welche Daten wären notwendig und wo liegen die echten Kontrollpunkte? Diese Evidenz ist wertvoller als eine abstrakte Diskussion über allgemeine Agentenfähigkeiten.',
			'Die Challenge wird vorab mit einem fachlichen Owner begrenzt. Sie erhält einen Nutzer, freigegebene Beispielunterlagen, eine klare Prototype Boundary und eine Demo-Frage. So kann das Team innerhalb eines Tages bauen, ohne regulatorische oder produktive Freigaben vorzutäuschen.'
		],
		challenges: [
			'Ein Policy- oder Prozessnavigator über synthetische Dokumente mit Quellenanzeige und klarer Unsicherheitsmarkierung.',
			'Eine Claims- oder Case-Triage, die Informationen strukturiert und eine menschliche Entscheidung vorbereitet.',
			'Ein Workflow zur Sammlung von Compliance-Evidenz aus definierten Beispieldokumenten und Kontrollpunkten.',
			'Testgenerierung für einen begrenzten Bereich gewachsener Regelwerke oder Legacy-Anwendungen.',
			'Ein Beratungs-Briefing auf Basis de-identifizierter Fälle mit freigegebenen Wissensquellen.'
		],
		audienceTitle: 'Voraussetzungen für einen sinnvollen Finance-Hackathon',
		audienceIntro:
			'Der Event ist kein Weg um Governance herum. Er funktioniert, wenn ein Bereich einen zulässigen Sandbox-Pfad und reale fachliche Eigentümer bereitstellen kann.',
		audience: [
			'Engineering-, Digital- oder Product-Leads mit Verantwortung für einen klaren Prozessbereich.',
			'Fachliche Challenge Owner aus Operations, Schaden, Beratung, Compliance oder interner IT.',
			'AI Enablement und Innovation als Organisatoren des sicheren Experimentierraums.',
			'Security, Datenschutz und Governance in der Vorbereitung der Regeln und Datenklassen.'
		],
		security: [
			'Tool-Zugriff, Logging, Accounts, Datenklassen, Dokumentenquellen und Quellcode-Nutzung werden vor dem Termin dokumentiert. Wo echte Daten nicht zulässig sind, werden repräsentative synthetische Fälle vorbereitet. Ohne freigegebenen Arbeitsraum findet die Challenge nicht statt.',
			'Jede Demo zeigt, wo der Mensch prüft oder entscheidet. Aussagen werden, soweit möglich, mit Quellen verbunden; nicht verfügbare Systeme werden sichtbar simuliert. Der Prototyp ist ein Bewertungsgegenstand, keine fachliche oder regulatorische Freigabe.'
		],
		outcome: [
			'Nach dem Demo Day liegen mehrere konkrete Workflows, dokumentierte Risiken und priorisierte nächste Schritte vor. Auch ein negatives Ergebnis ist nützlich, wenn es früh zeigt, dass Datenqualität, Prozessdesign oder Tool-Freigaben noch nicht ausreichen.',
			'Das Format macht AI-Adoption damit kontrollierbar: ein kleiner Bereich, ein Tag, ein transparenter Rahmen und eine klare Entscheidung darüber, was weiter geprüft wird.'
		]
	},
	{
		slug: 'hackathon-maschinenbau-automatisierung',
		group: 'Hackathon-Branchen',
		title: 'Hackathon für Maschinenbau und Automatisierung',
		footerLabel: 'Hackathon für Maschinenbau',
		icon: 'Cog',
		description:
			'Agentic Engineering Hackathon für Maschinenbau und Automatisierung: Konfiguration, Inbetriebnahme und Service als Prototypen.',
		lead: [
			'Maschinenbau und Automatisierung verbinden Software, Hardware, technische Dokumentation und tiefes Erfahrungswissen. Neue Coding Agents können Teams beim Verstehen und Bauen unterstützen, doch ihr Wert zeigt sich erst an einem konkreten Engineering- oder Serviceprozess.',
			'Ein eintägiger Hackathon schafft dafür einen kontrollierten Test. Engineers, Produktverantwortliche und Domänenexperten bauen gemeinsam mit freigegebenen Werkzeugen. Die Challenge bleibt klein genug für einen Working Prototype und relevant genug, um am Ende eine echte Weiterführungsentscheidung zu treffen.'
		],
		relevanceTitle: 'Komplexe Produktlogik verständlich prototypisieren',
		relevance: [
			'Viele interessante Workflows liegen zwischen Systemen und Rollen: von der Anforderung zur Konfiguration, vom Fehlerbild zur Diagnose oder von einer Änderung zu ihren technischen Auswirkungen. Ein Prototype kann diese Kette sichtbar machen, ohne die vollständige Produktlandschaft integrieren zu müssen.',
			'Im Challenge Design werden Regeln, Nutzer, Datenquellen und Erfolgstest festgelegt. Die Teams wissen dadurch, was am Nachmittag funktionieren soll und welche Teile bewusst simuliert bleiben. Das reduziert Scope-Diskussionen und schafft mehr Zeit für tatsächliches Bauen.'
		],
		challenges: [
			'Ein Konfigurationsassistent, der Anforderungen in zulässige Produktoptionen und offene Rückfragen übersetzt.',
			'Ein Inbetriebnahme-Workflow auf Basis freigegebener Anleitungen, Parameter und typischer Fehlerbilder.',
			'Ein Service-Techniker-Assistent mit nachvollziehbarer Verbindung zu Handbüchern und Fehlercodes.',
			'Ein Change-Impact-Explorer für ausgewählte Softwaremodule, Schnittstellen oder technische Komponenten.',
			'Ein Test- und Dokumentationsprototyp für einen begrenzten Bereich der Steuerungs- oder Engineering-Software.'
		],
		audienceTitle: 'Teams mit Produkt- und Systemwissen',
		audienceIntro:
			'Der Hackathon nutzt vorhandene Expertise. Er ist besonders wirksam, wenn erfahrene Domänenpersonen nicht nur eine Aufgabe abgeben, sondern den Nutzerfluss und die Demo gemeinsam mit den Buildern prüfen.',
		audience: [
			'Software-, Systems- und Automation-Engineering aus einem gemeinsamen Produktbereich.',
			'Produktmanagement, Application Engineering, Inbetriebnahme oder technischer Service.',
			'R&D-, Digital- und Plattformverantwortliche als Sponsor und Follow-up-Owner.',
			'Toolchain, Developer Experience und Security für ein verlässliches Arbeits-Setup.'
		],
		security: [
			'Technische Unterlagen, Quellcode und Maschinendaten werden auf freigegebene Ausschnitte begrenzt. Synthetische Parameter, simulierte Telemetrie und repräsentative Fehlerfälle können den Workflow ausreichend realistisch machen, ohne Schutzrechte oder Kundendaten zu gefährden.',
			'Der Demo Day trennt klar zwischen funktionierendem Nutzerfluss und später notwendiger Produktintegration. Safety, Echtzeitfähigkeit, vollständige Validierung und Hardwaretests bleiben außerhalb eines eintägigen Prototyps und werden als nächste Arbeitspakete dokumentiert.'
		],
		outcome: [
			'Das Unternehmen erhält mehrere sichtbare Prototypen und eine bessere Einschätzung, welche Teile des Engineering-Prozesses heute von Coding Agents profitieren. Gleichzeitig werden Wissenslücken, fehlende Schnittstellen und Tool-Reibung konkret.',
			'Das Ergebnis ist kein Innovationsfeuerwerk ohne Anschluss, sondern eine sortierte Liste aus weiterführbaren Prototypen, verantwortlichen Personen und bewusst verworfenen Ansätzen.'
		]
	},
	{
		slug: 'ki-adoption-engineering',
		group: 'Ziele',
		title: 'KI-Adoption im Engineering beschleunigen',
		footerLabel: 'KI-Adoption im Engineering',
		icon: 'Rocket',
		description:
			'KI-Adoption im Engineering durch einen praktischen Build Day beschleunigen: reale Challenges, gemeinsame Tool-Praxis und sichtbare Ergebnisse.',
		lead: [
			'Viele Engineering-Organisationen haben AI Coding Tools bereits freigegeben oder befinden sich in einer Evaluation. Trotzdem bleibt die Nutzung ungleich verteilt. Einige Engineers entwickeln neue Arbeitsweisen, andere warten ab, und Product oder Führung können schwer beurteilen, wo das Tool tatsächlich einen Unterschied macht.',
			'Ein Agentic Engineering Hackathon verwandelt Tool-Zugang in gemeinsame Praxis. Teams arbeiten einen Tag lang an echten Unternehmens-Challenges, vergleichen Vorgehensweisen und demonstrieren funktionierende Prototypen. Die Adoption wird damit nicht über Teilnahme oder Lizenzzahlen gemessen, sondern über beobachtbares Bauen.'
		],
		relevanceTitle: 'Eine Lizenz ist noch keine veränderte Arbeitsweise',
		relevance: [
			'Individuelle Experimente sind wichtig, verbreiten sich aber selten von selbst. Erfolgreiche Nutzung hängt von Repository-Kontext, Aufgabenwahl, Reviews, Sicherheitsregeln und der Zusammenarbeit mit Product und Fachbereichen ab. Genau diese Bedingungen werden im Hackathon gemeinsam erlebt.',
			'Der Event schafft einen konzentrierten Lernzyklus: Challenge verstehen, Agent einsetzen, Ergebnis prüfen, Vorgehensweise anpassen und am Nachmittag öffentlich erklären. Dadurch werden gute Muster sichtbar und Hindernisse konkret, ohne dass das Unternehmen eine abstrakte Adoption-Kampagne starten muss.'
		],
		challenges: [
			'Ein wiederkehrendes Engineering-Ticket mit einem Agenten vom Problemverständnis bis zum überprüfbaren Testfall bearbeiten.',
			'Eine kleine Legacy-Änderung erklären, planen und mit bestehenden Qualitätsregeln absichern.',
			'Interne APIs und Dokumentation für einen konkreten Produkt-Workflow schneller erschließen.',
			'Support- oder Produktfeedback in reproduzierbare technische Aufgaben übersetzen.',
			'Ein Developer-Onboarding-Erlebnis bauen, das gute Agent-Praxis direkt im Repository vermittelt.'
		],
		audienceTitle: 'Für Organisationen zwischen Freigabe und Skalierung',
		audienceIntro:
			'Der Build Day eignet sich, wenn ein Tool-Pfad existiert, aber noch kein gemeinsames Bild über sinnvolle Nutzung, Qualitätsgrenzen und wirksame Teampraktiken entstanden ist.',
		audience: [
			'VPs und Heads of Engineering, die Nutzung und Ergebnisse über mehrere Teams hinweg verbessern wollen.',
			'Developer Experience und Engineering Enablement als operative Eigentümer des Tool-Rollouts.',
			'Staff Engineers und frühe AI Champions, die Wissen praktisch weitergeben können.',
			'Product- und Domänenrollen, die reale Challenges und Bewertungskriterien in die Teams bringen.'
		],
		security: [
			'Adoption darf nicht bedeuten, Regeln zu überspringen. Im Prep Call werden freigegebene Modelle, Accounts, Erweiterungen, Repositories und Datenklassen festgelegt. Teams erhalten ein Setup, in dem sie schnell arbeiten können, ohne über Grundsatzfragen während des Sprints zu verhandeln.',
			'Alle Ergebnisse bleiben Prototypen und durchlaufen vor einer Weiterverwendung die normalen Reviews. Gemessen werden praktische Tool-Nutzung, demonstrierte Workflows, Reibungspunkte und benannte nächste Eigentümer – nicht die Menge automatisch erzeugten Codes.'
		],
		outcome: [
			'Der Sponsor sieht nach einem Tag, welche Teams das Werkzeug souverän einsetzen, welche Aufgaben geeignet sind und wo Tooling, Dokumentation oder Governance noch bremsen. Diese Beobachtungen können die nächste Phase des Rollouts gezielt steuern.',
			'Gleichzeitig entstehen interne Builder, die nicht nur über AI sprechen, sondern eine konkrete Vorgehensweise und einen sichtbaren Prototype mit ihren Kolleginnen und Kollegen teilen können.'
		]
	},
	{
		slug: 'coding-agent-rollout-hackathon',
		group: 'Ziele',
		title: 'Coding-Agent-Rollout mit einem Hackathon',
		footerLabel: 'Coding-Agent-Rollout',
		icon: 'Bot',
		description:
			'Coding-Agent-Rollout durch einen eintägigen Hackathon aktivieren: Teams bauen mit dem freigegebenen Tool an realen Unternehmens-Challenges.',
		lead: [
			'Ein Coding-Agent-Rollout löst zunächst ein Zugangsproblem: Accounts, Lizenzen und technische Freigaben werden verfügbar. Ob daraus eine neue Arbeitsweise entsteht, entscheidet sich jedoch in den Teams. Ohne gemeinsame Aufgaben und sichtbare Beispiele bleibt die Nutzung häufig punktuell oder auf wenige Enthusiasten begrenzt.',
			'Der Hackathon setzt direkt nach oder während des Rollouts an. 15 bis 50 Personen nutzen das freigegebene Werkzeug in realen, vorbereiteten Challenges. Statt einer Feature-Tour erleben die Teilnehmenden, wie sie Kontext geben, Ergebnisse prüfen, Grenzen erkennen und Product- oder Domänenwissen in den Build-Prozess einbeziehen.'
		],
		relevanceTitle: 'Den Rollout an Arbeit statt an Funktionen erklären',
		relevance: [
			'Herstellerdemos zeigen, was ein Tool theoretisch kann. Interne Adoption braucht dagegen Beispiele aus den eigenen Repositories, Systemen und Qualitätsanforderungen. Ein Build Day erzeugt diese Referenzen in kurzer Zeit und macht sie für mehrere Teams gleichzeitig sichtbar.',
			'In der Vorbereitung werden Setup und Challenges getrennt geprüft. Ein kurzer technischer Test stellt sicher, dass Accounts, Erweiterungen und Zugriffe funktionieren. Challenge Owner definieren parallel Nutzerproblem und Demo-Ziel. Dadurch wird der Eventtag nicht von Installation oder unklarem Scope verbraucht.'
		],
		challenges: [
			'Ein reales Backlog-Thema mit dem neuen Agenten analysieren, in Schritte zerlegen und als überprüfbaren Prototype umsetzen.',
			'Eine bestehende Testlücke schließen und dabei Qualität, Review und Agent-Kontext dokumentieren.',
			'Ein internes Tool für wiederkehrende Engineering- oder Dokumentationsarbeit prototypisieren.',
			'Eine kleine Migration oder API-Änderung mit agentengestützter Planung und nachvollziehbaren Tests bearbeiten.',
			'Ein gemeinsames Muster für Repository-Navigation, sichere Kontextübergabe und Ergebnisprüfung entwickeln.'
		],
		audienceTitle: 'Wer den Rollout in Nutzung übersetzt',
		audienceIntro:
			'Der operative Owner sollte Zugriff auf Teams, Tool-Administration und reale Aufgaben haben. Ein C-Level-Sponsor kann unterstützen, aber die Umsetzung gehört nah an Engineering und Developer Experience.',
		audience: [
			'Engineering Enablement, Developer Experience oder Platform Engineering als Rollout Owner.',
			'Engineering Leads mit Teams unterschiedlicher Erfahrung und Nutzungstiefe.',
			'Frühe Power User als Coaches innerhalb der Build-Teams.',
			'Product- und Fachrollen, damit nicht nur technische Spielzeuge entstehen.'
		],
		security: [
			'Verwendet wird genau das Tool, das das Unternehmen freigegeben hat. Accounts, Modelloptionen, Telemetrie, Repository-Zugriff und Datenklassen werden nicht stillschweigend erweitert. Für sensible Bereiche werden isolierte Module oder Sandbox-Challenges vorbereitet.',
			'Der Hackathon ersetzt keine Richtlinie und keine Schulung zu verbindlichen Regeln. Er macht diese Regeln praktisch anwendbar und zeigt, wo sie unklar, technisch schwer umsetzbar oder für bestimmte Workflows noch unvollständig sind.'
		],
		outcome: [
			'Nach dem Event besitzt die Organisation mehrere interne Beispiele, dokumentierte Tool-Hürden und eine Gruppe aktiver Builder. Der Rollout kann anschließend anhand tatsächlicher Aufgaben weiterentwickelt werden, statt nur über Nutzungsstatistiken zu berichten.',
			'Jeder Prototype erhält einen nächsten Eigentümer. So bleibt der Tag nicht isoliert, sondern liefert konkrete Kandidaten für Folgesprints, interne Demos oder verbesserte Enablement-Materialien.'
		]
	},
	{
		slug: 'developer-experience-ai-tools',
		group: 'Ziele',
		title: 'Developer Experience mit AI Coding Tools',
		footerLabel: 'Developer Experience mit AI',
		icon: 'Gauge',
		description:
			'Developer Experience mit AI Coding Tools verbessern: Reibung in Toolchain, Dokumentation und Onboarding in einem Hackathon sichtbar machen.',
		lead: [
			'AI Coding Tools versprechen schnellere Entwicklung, treffen aber auf die tatsächliche Developer Experience eines Unternehmens: lokale Setups, Berechtigungen, Dokumentation, Build-Zeiten, Tests und gewachsene Plattformen. Wenn dieser Kontext schwer zugänglich ist, kann auch ein leistungsfähiger Agent nur begrenzt helfen.',
			'Ein Agentic Engineering Hackathon nutzt reale Challenges, um diese Reibung sichtbar zu machen. Teams bauen nicht nur Produktfunktionen, sondern können gezielt interne Werkzeuge, Navigationshilfen und Onboarding-Flows prototypisieren. Die Ergebnisse zeigen, welche Verbesserungen sowohl Menschen als auch Agenten produktiver machen.'
		],
		relevanceTitle: 'AI verstärkt gute und schlechte Plattformbedingungen',
		relevance: [
			'Ein Agent benötigt klare Quellen, ausführbare Tests und verständliche Grenzen. Fehlen diese Grundlagen, entstehen falsche Annahmen und lange Korrekturschleifen. Der Hackathon macht solche Probleme innerhalb weniger Stunden konkret, weil mehrere Teams gleichzeitig versuchen, reale Aufgaben im bestehenden Umfeld zu lösen.',
			'Developer Experience erhält damit qualitatives Feedback, das über eine Tool-Umfrage hinausgeht. Beobachtet werden Setup-Zeit, fehlender Kontext, wiederkehrende manuelle Schritte, Review-Aufwand und die Fähigkeit, Ergebnisse zuverlässig zu prüfen.'
		],
		challenges: [
			'Ein Repository-Navigator, der Architektur, Ownership und relevante Einstiegspunkte für eine Aufgabe erklärt.',
			'Ein Developer-Onboarding-Assistent, der Setup, erste Änderung und Qualitätsprüfung in einem Flow verbindet.',
			'Ein interner API-Katalog mit kontextbezogenen Beispielen und direkten Links zur verbindlichen Dokumentation.',
			'Ein Workflow, der aus einem Supportfall reproduzierbare Entwicklungs- und Testschritte erzeugt.',
			'Ein Tool, das wiederkehrende lokale oder CI-Probleme strukturiert und nachvollziehbare Diagnosepfade anbietet.'
		],
		audienceTitle: 'Für Plattform- und Enablement-Teams',
		audienceIntro:
			'Der Event passt, wenn Developer Experience nicht nur Tool-Beschaffung verantwortet, sondern konkrete Reibung in der täglichen Softwareentwicklung reduzieren will.',
		audience: [
			'Developer Experience, Platform Engineering und interne Developer-Portal-Teams.',
			'Engineering Enablement und Staff Engineers mit organisationsweitem Blick.',
			'Produktteams als Nutzer und ehrliche Tester der neuen Prototypen.',
			'Security und Toolchain Owner für freigegebene Agent- und Repository-Zugriffe.'
		],
		security: [
			'Interne Dokumentation und Quellcode bleiben in der genehmigten Umgebung. Der Prep Call klärt, welche Quellen ein Agent sehen darf, wie Zugriffe protokolliert werden und welche Beispiel-Repositories sich für den Event eignen.',
			'Prototypen markieren veraltete oder unsichere Informationen nicht als Wahrheit. Quellenverweise, Review-Schritte und klare Zuständigkeiten gehören zum Nutzerfluss. So verbessert die Lösung nicht nur Geschwindigkeit, sondern auch Vertrauen und Wartbarkeit.'
		],
		outcome: [
			'Der Demo Day liefert sichtbare Developer-Experience-Prototypen und eine priorisierte Reibungsliste. Manche Probleme werden direkt lösbar sein, andere zeigen strukturelle Lücken in Dokumentation, Plattform oder Ownership.',
			'Das Ergebnis unterstützt eine nüchterne Roadmap: Welche kleine Verbesserung hilft vielen Teams, welche Agent-Practice sollte standardisiert werden und welche Tool-Erwartung passt nicht zur aktuellen Umgebung?'
		]
	},
	{
		slug: 'ki-strategie-working-prototype',
		group: 'Ziele',
		title: 'Von der KI-Strategie zum Working Prototype',
		footerLabel: 'KI-Strategie als Prototype',
		icon: 'Route',
		description:
			'Von der KI-Strategie zum Working Prototype: Ein eintägiger Activation Pilot macht Use Cases, Grenzen und nächste Schritte sichtbar.',
		lead: [
			'Eine KI-Strategie schafft Richtung, Prioritäten und Leitplanken. Für einzelne Teams bleibt trotzdem die Frage: Was bedeutet das in unserem Produkt, unserem Prozess und unserer Tool-Umgebung? Ohne eine praktische Übersetzung sammeln sich Use Cases, während konkrete Erfahrung und belastbare Entscheidungen fehlen.',
			'Der ALL IN AGI Hackathon ist eine kleine Brücke zwischen Strategie und Umsetzung. Ein abgegrenzter Unternehmensbereich wählt drei bis acht reale Challenges, baut einen Tag lang mit freigegebenen Coding Agents und zeigt die Ergebnisse im Demo Day. Dadurch wird aus allgemeiner Ambition beobachtbare Evidenz.'
		],
		relevanceTitle: 'Use Cases durch Bauen qualifizieren',
		relevance: [
			'Listen bewerten Ideen meist anhand angenommener Wirkung und Machbarkeit. Ein Prototype ergänzt diese Perspektive um tatsächliche Erfahrung: Welche Daten sind verfügbar, wie gut versteht das Tool den Kontext, wo braucht es menschliche Entscheidungen und wie reagiert ein Nutzer auf den Workflow?',
			'Der enge Zeitrahmen verhindert ein verdecktes Großprojekt. Jede Challenge bekommt eine klar definierte Grenze, einen User Flow und ein Demo-Kriterium. Es geht nicht darum, Produktion in einen Tag zu pressen, sondern die nächste Investitionsentscheidung besser zu machen.'
		],
		challenges: [
			'Eine priorisierte Strategie-Idee als klick- oder ausführbaren End-to-End-Nutzerfluss darstellen.',
			'Ein internes Wissens- oder Dokumentationsproblem mit Quellen, Grenzen und Review-Schritt prototypisieren.',
			'Einen manuellen Produkt- oder Operations-Workflow in unterstützbare und bewusst menschliche Schritte zerlegen.',
			'Einen Engineering-Use-Case mit dem vorhandenen Tool-Stack praktisch testen und Tool-Reibung dokumentieren.',
			'Eine verworfene oder unsichere Idee bewusst als Test formulieren, damit der Demo Day eine klare Entscheidung ermöglicht.'
		],
		audienceTitle: 'Für Strategie Owner mit einem konkreten Pilotbereich',
		audienceIntro:
			'Der Hackathon wirkt am besten, wenn die Strategie bereits eine Richtung setzt und ein operativer Sponsor bereit ist, einen begrenzten Bereich mit echten Mitarbeitenden und Challenges zu öffnen.',
		audience: [
			'CTO-, CIO- oder CDO-Office als Sponsor der strategischen Richtung.',
			'Engineering-, Product- oder Digital-Leads als Eigentümer des Pilotbereichs.',
			'Innovation und Transformation für Challenge Design und Ergebnisdokumentation.',
			'Fachliche Owner, Engineers und Security als gemeinsames Bewertungsteam.'
		],
		security: [
			'Strategische Priorität hebt bestehende Regeln nicht auf. Vor dem Event werden Tools, Datenklassen, Repositories und zulässige Quellen abgestimmt. Falls ein priorisierter Use Case keinen sicheren Testpfad besitzt, wird er angepasst oder bewusst nicht für diesen Tag gewählt.',
			'Die Demos zeigen Annahmen und simulierte Integrationen offen. Jeder Prototype erhält eine Machbarkeitsnotiz, bekannte Risiken und einen nächsten Entscheidungspunkt. Das verhindert, dass eine überzeugende Oberfläche mit Produktionsreife verwechselt wird.'
		],
		outcome: [
			'Der Sponsor erhält eine kleine Portfolio-Sicht: Welche strategische Idee ist technisch und organisatorisch anschlussfähig, welche braucht Vorarbeit und welche liefert derzeit zu wenig Nutzen? Diese Evidenz kann die Roadmap präzisieren.',
			'Gleichzeitig erlebt das Team die Strategie nicht als abstrakte Vorgabe, sondern als konkrete Bauaufgabe. Das schafft interne Builder, gemeinsame Sprache und sichtbare Verantwortung für die nächsten Schritte.'
		]
	},
	{
		slug: 'interne-ai-champions',
		group: 'Ziele',
		title: 'Interne AI Champions aufbauen',
		footerLabel: 'Interne AI Champions',
		icon: 'UsersRound',
		description:
			'Interne AI Champions durch gemeinsames Bauen entwickeln: Coding-Agent-Praxis, reale Challenges und sichtbare Ergebnisse für weitere Teams.',
		lead: [
			'AI Champions entstehen nicht allein durch Ernennung oder Teilnahme an einer Schulung. Sie brauchen praktische Erfahrung, glaubwürdige Beispiele aus dem Unternehmen und die Fähigkeit, anderen Teams sowohl Nutzen als auch Grenzen zu erklären. Ein Hackathon schafft dafür einen konzentrierten Erfahrungsraum.',
			'Erfahrene Nutzerinnen, neugierige Engineers, Product-Verantwortliche und Domänenexperten bauen gemeinsam. Frühe Power User geben nicht nur Tipps, sondern arbeiten an denselben Challenges wie ihre Kolleginnen und Kollegen. Am Demo Day zeigen die Teams Ergebnis, Vorgehensweise und offene Fragen.'
		],
		relevanceTitle: 'Champions brauchen Belege aus dem eigenen Kontext',
		relevance: [
			'Externe Best Practices helfen nur begrenzt, wenn Repository, Daten, Review-Kultur und Security-Regeln anders aussehen. Interne Champions werden glaubwürdig, wenn sie einen realen Workflow im eigenen Setup gebaut und die auftretenden Probleme selbst gelöst haben.',
			'Der Event verbindet Wissenstransfer mit konkreter Lieferung. Gute Agent-Praktiken werden im Team sichtbar, während fachliche Owner prüfen, ob der Prototype tatsächlich ein Problem löst. Dadurch entsteht keine isolierte Community, sondern ein Netzwerk mit Bezug zur Arbeit.'
		],
		challenges: [
			'Ein gemeinsamer Engineering-Workflow, an dem mehrere Agent-Strategien ausprobiert und verglichen werden.',
			'Ein interner Navigator, den Champions später als greifbares Beispiel in weiteren Teams demonstrieren können.',
			'Ein Product-Prototype, der zeigt, wie Engineering und Fachbereich mit Coding Agents zusammenarbeiten.',
			'Ein sicherer Legacy- oder Testgenerierungsfall mit dokumentierten Review- und Qualitätsmustern.',
			'Ein Developer-Onboarding-Flow, der neue Nutzer direkt zu freigegebenen Tools und guten Praktiken führt.'
		],
		audienceTitle: 'Eine bewusste Mischung aus Erfahrung und Reichweite',
		audienceIntro:
			'Nicht alle Teilnehmenden müssen Champions werden. Sinnvoll ist eine Gruppe, die technische Glaubwürdigkeit, Kommunikationsstärke und Verbindung zu mehreren Produkt- oder Fachbereichen vereint.',
		audience: [
			'Staff Engineers, Tech Leads und frühe Power User mit Interesse an Enablement.',
			'Developer Experience oder Engineering Enablement als dauerhafter organisatorischer Anker.',
			'Product- und Domänenpersonen, die AI-Workflows fachlich erklären und bewerten können.',
			'Engineering-Leads, die nach dem Event Zeit für Demos, Austausch und Folgesprints ermöglichen.'
		],
		security: [
			'Champions dürfen nicht zu informellen Ausnahmen von Security-Regeln werden. Der Hackathon vermittelt praktische Nutzung innerhalb des freigegebenen Tool- und Datenrahmens und dokumentiert Fragen, die zentral geklärt werden müssen.',
			'Alle Ergebnisse behalten normale Review- und Freigabeprozesse. Die Champions lernen damit auch, wann ein Agent ungeeignet ist, wie Unsicherheit kommuniziert wird und welche Informationen nicht in ein Modell gehören.'
		],
		outcome: [
			'Nach dem Tag gibt es mehrere Personen mit gemeinsamer Praxiserfahrung, konkrete Demos für interne Kommunikation und eine Liste wiederverwendbarer Muster. Die Champions können auf etwas zeigen, statt nur abstrakt für neue Tools zu werben.',
			'Das Follow-up benennt, welche Prototypen weiterlaufen, wer eine interne Demo übernimmt und welche Tool- oder Governance-Fragen vor einer breiteren Adoption geklärt werden müssen.'
		]
	},
	{
		slug: 'interner-ki-hackathon',
		group: 'Formate',
		title: 'Interner KI-Hackathon für Unternehmen',
		footerLabel: 'Interner KI-Hackathon',
		icon: 'Trophy',
		description:
			'Interner KI-Hackathon für Unternehmen: 15–50 Personen bauen an realen Challenges und demonstrieren Working Prototypes am selben Tag.',
		lead: [
			'Ein interner KI-Hackathon kann weit mehr sein als ein Team-Event. Richtig vorbereitet wird er zu einem Activation Pilot: Mitarbeitende wenden freigegebene Coding Agents auf echte Unternehmensprobleme an, bauen funktionierende Prototypen und erzeugen eine konkrete Liste für die Weiterarbeit.',
			'ALL IN AGI übernimmt Challenge Design, Ablauf und Facilitation für 15 bis 50 Personen. Der Tag besteht zu mindestens 70 Prozent aus Build-Zeit. Engineering, Product und Fachbereiche arbeiten in gemischten Teams; der Abschluss ist ein Demo Day mit sichtbaren Ergebnissen statt Teilnahmezertifikaten.'
		],
		relevanceTitle: 'Was einen wirksamen internen Hackathon ausmacht',
		relevance: [
			'Der wichtigste Unterschied liegt vor dem Event. Challenges benötigen einen Nutzer, einen fachlichen Owner, verfügbare Beispielinformationen und eine Grenze, die in einem Tag erreichbar ist. Ohne diese Vorbereitung entstehen oft kreative, aber anschlusslose Spielzeuge.',
			'Der zweite Unterschied liegt nach der Demo. Jeder Prototype wird mit Nutzenhypothese, Funktionsstand, offenen Risiken und einem nächsten Eigentümer festgehalten. Dadurch kann der Sponsor entscheiden, welche Ergebnisse einen Folgesprint erhalten und welche als Lernexperiment abgeschlossen sind.'
		],
		challenges: [
			'Ein interner Wissensnavigator für eine klar begrenzte Dokumenten- oder API-Landschaft.',
			'Ein Product-Workflow von Kundenproblem oder Feedback bis zu einem testbaren Lösungsprototyp.',
			'Ein Engineering Assistant für Tests, Migration, Reproduktion oder Developer Onboarding.',
			'Ein operativer Workflow aus Service, Logistik oder Fachbereich mit synthetischen Beispieldaten.',
			'Ein branchenspezifischer Assistent mit sichtbaren Quellen, Grenzen und menschlicher Entscheidung.'
		],
		audienceTitle: 'Teilnehmer, Sponsor und Challenge Owner',
		audienceIntro:
			'Ein interner Hackathon braucht nicht fünfzig Engineers. Verschiedene Rollen sorgen dafür, dass Probleme richtig verstanden, Prototypen gebaut und Ergebnisse fachlich bewertet werden.',
		audience: [
			'15 bis 50 Builder aus Engineering, Product, Data, Digital und Fachbereichen.',
			'Drei bis acht Challenge Owner, die vorab Scope und Erfolgskriterium vorbereiten.',
			'Ein operativer Sponsor, der den Demo Day besucht und Follow-up-Entscheidungen treffen kann.',
			'Security- und Tool-Ansprechpartner für ein verlässliches Setup vor dem Termin.'
		],
		security: [
			'Im Prep Call werden Tools, Accounts, Datenklassen, Repositories, Foto- oder Aufzeichnungsregeln und technische Zugänge geklärt. Synthetische Daten sind der Standard, wenn reale Informationen nicht eindeutig freigegeben sind.',
			'Der Event produziert Prototypen, keine Produktionssysteme. Diese Grenze wird allen Teams kommuniziert und in den Demos sichtbar gemacht. Erfolgreiche Ideen gehen anschließend durch die normalen fachlichen, technischen und rechtlichen Prüfungen.'
		],
		outcome: [
			'Der Tag endet mit mehreren Working Prototypes, einer Prototype-Inventur und benannten nächsten Schritten. Zusätzlich wird sichtbar, wie gut die Tool-Umgebung funktioniert und welche internen Builder weitere Teams unterstützen können.',
			'Für den Sponsor ist das Format transparent: fester Umfang, klarer Tag, sichtbare Ergebnisse und keine Behauptung, dass ein eintägiger Prototype bereits ROI oder Produktionsreife belegt.'
		]
	},
	{
		slug: 'hack-week-coding-agents',
		group: 'Formate',
		title: 'Hack Week mit Coding Agents',
		footerLabel: 'Hack Week mit Coding Agents',
		icon: 'CalendarDays',
		description:
			'Hack Week mit Coding Agents durch einen fokussierten Build Day starten oder verdichten – mit realen Challenges und einem gemeinsamen Demo Day.',
		lead: [
			'Hack Weeks geben Teams Raum außerhalb des normalen Backlogs. Coding Agents können diese Zeit besonders produktiv machen, wenn Teilnehmende schnell vom Problem zu einem testbaren Nutzerfluss kommen. Ohne gemeinsame Leitplanken besteht jedoch die Gefahr, dass Setup, Scope und Toolfragen den größten Teil der Woche verbrauchen.',
			'ALL IN AGI kann einen fokussierten Agentic Engineering Day als Auftakt oder Kern einer internen Hack Week gestalten. Challenge Owner bereiten reale Aufgaben vor, Builder erhalten ein getestetes Setup und der Demo Day bewertet Nutzerwert, Funktion, Lernen und einen realistischen nächsten Schritt.'
		],
		relevanceTitle: 'Eine gemeinsame Startlinie für autonome Teams',
		relevance: [
			'Eine Hack Week lebt von Freiheit, aber Freiheit braucht einen guten Ausgangspunkt. Ein kurzer gemeinsamer Kickoff zeigt aktuelle Tool-Practice und die Grenzen des Unternehmens-Setups. Danach verbringen die Teams den Großteil der Zeit mit Bauen statt mit Präsentationen.',
			'Der vorbereitete Challenge Canvas verhindert übergroße Vorhaben. Er beschreibt Problem, Nutzer, aktuellen Workflow, verfügbare Daten, Risiko, Prototype Boundary und Erfolgstest. Teams können kreativ lösen, ohne das eigentliche Ziel aus den Augen zu verlieren.'
		],
		challenges: [
			'Ein Product-Prototype aus einem lange bekannten Kundenproblem, das im normalen Backlog keinen Raum findet.',
			'Ein internes Developer Tool für wiederkehrende Setup-, Dokumentations- oder Diagnosearbeit.',
			'Ein Migration Assistant oder Testgenerator für einen begrenzten Bereich technischer Schulden.',
			'Ein cross-funktionaler Workflow, der Fachwissen und Engineering in einem nutzbaren Ablauf verbindet.',
			'Ein Experiment mit einem neuen Coding Agent innerhalb klar definierter Security- und Datenregeln.'
		],
		audienceTitle: 'Als Auftakt, Fokus-Tag oder Abschluss',
		audienceIntro:
			'Das eintägige Format kann allein stehen oder in eine längere Hack Week eingebettet werden. Wichtig ist ein gemeinsamer Moment für Vorbereitung, Build-Practice und Ergebnisentscheidung.',
		audience: [
			'Engineering- und Product-Organisationen mit einer bestehenden Hack-Week- oder Innovation-Week-Tradition.',
			'Developer Experience und interne Communities als Organisatoren des Tool-Setups.',
			'Challenge Owner aus Produkt, Plattform und Fachbereichen.',
			'Führungskräfte als Demo-Day-Publikum und Eigentümer der anschließenden Entscheidungen.'
		],
		security: [
			'Auch in einer Hack Week gelten die vereinbarten Accounts, Repositories und Datenklassen. Ein Setup-Test vorab reduziert spontane Workarounds und sorgt dafür, dass alle Teams denselben freigegebenen Ausgangspunkt haben.',
			'Bei längerer Laufzeit werden Zwischenstände weiterhin als Prototypen behandelt. Produktive Deployments, externe Veröffentlichungen oder die Nutzung echter Kundendaten benötigen separate Freigaben und sind nicht automatisch Teil des Formats.'
		],
		outcome: [
			'Der gemeinsame Demo Day sorgt für einen klaren Endpunkt und macht teamübergreifendes Lernen sichtbar. Jedes Team zeigt nicht nur das Ergebnis, sondern auch Tool-Friktion, verworfene Ansätze und den nächsten realistischen Schritt.',
			'Die Organisation erhält damit mehr als eine Sammlung von Projekten: Sie bekommt vergleichbare Prototype-Steckbriefe und kann Ressourcen für die besten Anschlussvorhaben bewusst vergeben.'
		]
	},
	{
		slug: 'ai-innovation-day',
		group: 'Formate',
		title: 'AI Innovation Day für Unternehmen',
		footerLabel: 'AI Innovation Day',
		icon: 'Lightbulb',
		description:
			'AI Innovation Day für Unternehmen: ein strukturierter Build Day von der realen Challenge zum funktionierenden Prototype und Demo Day.',
		lead: [
			'Ein AI Innovation Day sollte mehr liefern als Inspiration. Wenn Mitarbeitende den Tag mit neuen Begriffen, aber ohne eigene Erfahrung verlassen, bleibt der Abstand zwischen Strategie und Alltag bestehen. ALL IN AGI gestaltet den Tag deshalb als Agentic Engineering Hackathon mit klarer Build-Priorität.',
			'Nach einer kurzen Live Demo arbeiten gemischte Teams an ausgewählten Unternehmens-Challenges. Engineers, Product und Fachbereiche entwickeln einen Nutzerfluss, bauen mit aktuellen Coding Agents und präsentieren am Nachmittag einen Working Prototype. Die Innovation wird dadurch konkret und überprüfbar.'
		],
		relevanceTitle: 'Inspiration entsteht durch ein sichtbares Ergebnis',
		relevance: [
			'Die kurze Zeit zwingt zu einer ehrlichen Frage: Welcher kleinste Workflow zeigt, ob eine Idee nützlich und technisch plausibel ist? Diese Fokussierung hilft besonders Unternehmen mit vielen AI-Ideen, aber wenig gemeinsamer Umsetzungserfahrung.',
			'Der Tag kann mit einem strategischen Impuls beginnen, bleibt aber kein Konferenzformat. Mindestens 70 Prozent sind praktische Arbeit. Facilitator unterstützen bei Scope, Tool-Nutzung und Blockaden, während Challenge Owner die fachliche Richtung halten.'
		],
		challenges: [
			'Ein Kunden- oder Mitarbeiterworkflow, der eine konkrete Informations- oder Entscheidungslücke schließt.',
			'Ein Product-Prototype aus wiederkehrendem Feedback oder einer bekannten Prozesshürde.',
			'Ein Engineering Assistant für interne Dokumentation, Tests, Migration oder Onboarding.',
			'Ein branchenspezifischer Service- oder Operations-Flow mit repräsentativen Beispieldaten.',
			'Ein sicherer Agent-Workflow, der Quellen, Unsicherheiten und menschliche Freigabe bewusst zeigt.'
		],
		audienceTitle: 'Innovation mit operativer Anschlussfähigkeit',
		audienceIntro:
			'Der Tag richtet sich an einen Bereich, der nicht nur Ideen sammeln, sondern mehrere Ansätze unter realistischen Bedingungen testen und anschließend priorisieren möchte.',
		audience: [
			'CTO-, CDO- oder Innovation-Office als Sponsor und Demo-Day-Jury.',
			'Engineering, Product und Data als technische Builder.',
			'Fachbereiche und Domänenexpertinnen als Challenge Owner und Nutzervertretung.',
			'Security- und Tool-Verantwortliche für einen klaren Arbeitsrahmen.'
		],
		security: [
			'Der Innovation Day nutzt keine beliebigen öffentlichen Accounts. Werkzeuge, Daten, Repositories und Zugänge werden vorab abgestimmt. Wo notwendig, werden synthetische Daten und simulierte Schnittstellen vorbereitet.',
			'Die Präsentation trennt Prototype und Produktionsversprechen. Teams benennen, was wirklich funktioniert, was nur simuliert ist und welche Prüfung als Nächstes notwendig wäre. Diese Transparenz macht Innovation für Entscheider wertvoller.'
		],
		outcome: [
			'Am Ende stehen mehrere Demos, eine vergleichbare Bewertung und eine priorisierte Follow-up-Liste. Der Sponsor kann sehen, welche Idee Nutzerwert, technische Machbarkeit und einen verantwortlichen Owner verbindet.',
			'Der AI Innovation Day wird so zu einem kleinen Portfolio-Experiment: schnell, sichtbar und begrenzt, aber mit genügend Struktur, damit gute Ergebnisse nicht nach dem Applaus verschwinden.'
		]
	},
	{
		slug: 'legacy-modernisierung-coding-agents',
		group: 'Formate',
		title: 'Legacy-Modernisierung mit Coding Agents',
		footerLabel: 'Legacy-Modernisierung',
		icon: 'RefreshCw',
		description:
			'Legacy-Modernisierung mit Coding Agents praktisch testen: Code erklären, Tests erzeugen und einen begrenzten Migrationsschritt prototypisieren.',
		lead: [
			'Legacy-Modernisierung ist selten nur eine technische Übersetzungsaufgabe. Gewachsene Systeme enthalten implizites Fachwissen, unvollständige Tests und Abhängigkeiten, die nicht in einer einzelnen Dokumentation stehen. Coding Agents können beim Erschließen helfen, müssen aber an überprüfbaren, begrenzten Aufgaben getestet werden.',
			'Ein Agentic Engineering Hackathon schafft einen sicheren Rahmen für diesen Test. Das Team wählt einen kleinen Code- oder Regelbereich, bereitet die notwendige Umgebung vor und baut einen nachvollziehbaren Prototype. Ziel ist Evidenz über Nutzen und Grenzen, nicht die Behauptung, ein Agent modernisiere ein gesamtes System an einem Tag.'
		],
		relevanceTitle: 'Kleine Modernisierungsschritte sichtbar machen',
		relevance: [
			'Ein geeigneter Scope kann eine Schnittstelle, ein Modul, ein Testproblem oder eine wiederkehrende Analyseaufgabe sein. Der Agent unterstützt beim Verstehen, Planen oder Erzeugen. Engineers prüfen Annahmen, führen Tests aus und dokumentieren, welcher Kontext für ein verlässliches Ergebnis notwendig war.',
			'Der Build Day bringt erfahrene Systemkenner mit Engineers zusammen, die moderne Tool-Practice einbringen. Dadurch wird implizites Wissen nicht einfach ersetzt, sondern in einen überprüfbaren Workflow übersetzt, der später wiederholt oder verbessert werden kann.'
		],
		challenges: [
			'Ein abgegrenztes Modul erklären und seine fachlichen sowie technischen Abhängigkeiten nachvollziehbar darstellen.',
			'Fehlende Tests für einen bekannten Legacy-Workflow erzeugen, ausführen und gemeinsam reviewen.',
			'Eine kleine API-, Framework- oder Sprachmigration planen und als überprüfbaren Code-Prototyp umsetzen.',
			'Einen Supportfall in reproduzierbare Schritte und relevante Stellen der älteren Codebasis übersetzen.',
			'Ein Onboarding-Werkzeug für Entwickler bauen, die erstmals an einem gewachsenen System arbeiten.'
		],
		audienceTitle: 'Für Teams mit zugänglichem Systemwissen',
		audienceIntro:
			'Ein Hackathon ist sinnvoll, wenn ein begrenzter Bereich, lauffähige Tests oder ein realistischer Ersatz und mindestens eine erfahrene Person für fachliche Rückfragen verfügbar sind.',
		audience: [
			'Engineering Leads mit Verantwortung für Modernisierung oder technische Schulden.',
			'Erfahrene Maintainer und Domänenexpertinnen als Challenge Owner.',
			'Platform-, Quality- und Developer-Experience-Teams für Tooling und Tests.',
			'Product-Verantwortliche, die Nutzen und Risiko eines nächsten Modernisierungsschritts bewerten.'
		],
		security: [
			'Proprietärer Code wird ausschließlich in der freigegebenen Umgebung verwendet. Vorab wird geprüft, welche Agent-Modelle und Erweiterungen auf das Repository zugreifen dürfen. Alternativ kann ein isolierter, repräsentativer Codeausschnitt vorbereitet werden.',
			'Agent-generierte Änderungen werden nicht ungeprüft übernommen. Tests, Review und Systemwissen bleiben verbindlich. Der Prototype dokumentiert Unsicherheiten, fehlenden Kontext und Bereiche, die für einen produktiven Migrationsplan weiter analysiert werden müssen.'
		],
		outcome: [
			'Der Tag liefert einen sichtbaren Modernisierungs-Prototyp und eine realistische Einschätzung der Agent-Unterstützung. Vielleicht beschleunigt das Tool Testgenerierung deutlich, während fachliche Abhängigkeiten weiterhin intensive menschliche Arbeit erfordern – genau diese Differenzierung ist wertvoll.',
			'Das Follow-up hält wiederverwendbare Prompts oder Workflows, notwendige Qualitätsprüfungen und den nächsten kleinen Schritt fest. So entsteht Fortschritt ohne unrealistisches Big-Bang-Versprechen.'
		]
	},
	{
		slug: 'security-konformer-ki-hackathon',
		group: 'Formate',
		title: 'Security-konformer KI-Hackathon',
		footerLabel: 'Security-konformer Hackathon',
		icon: 'LockKeyhole',
		description:
			'Security-konformer KI-Hackathon mit freigegebenen Tools, klaren Datenklassen, synthetischen Daten und dokumentierten Prototype-Grenzen.',
		lead: [
			'Security wird bei AI-Projekten oft als Gegensatz zu Geschwindigkeit dargestellt. Für einen guten Hackathon ist sie das Gegenteil: Klare Regeln vor dem Termin verhindern Improvisation, unsichere Accounts und lange Diskussionen während der Build-Zeit. Teams können schneller arbeiten, weil der erlaubte Rahmen feststeht.',
			'ALL IN AGI plant den Event gemeinsam mit Sponsor, Tool Owner und den relevanten Security-Ansprechpersonen. Verwendet werden nur vereinbarte Modelle, Accounts, Repositories und Datenklassen. Wo echte Informationen nicht notwendig oder nicht zulässig sind, bauen die Teams mit synthetischen oder de-identifizierten Beispielen.'
		],
		relevanceTitle: 'Security als Designbedingung des Prototyps',
		relevance: [
			'Jede Challenge beschreibt nicht nur Nutzer und Demo-Ziel, sondern auch Datenquelle, Risiko, menschliche Kontrollpunkte und Prototype Boundary. Damit wird Governance Teil des Nutzerflusses. Ein Ergebnis kann beispielsweise Quellen anzeigen, Unsicherheit markieren oder eine Entscheidung ausdrücklich beim Menschen lassen.',
			'Der Event ist kein Versuch, produktive Freigaben vorwegzunehmen. Er schafft einen konkreten Gegenstand, den Security, Fachbereich und Engineering gemeinsam bewerten können. Das ist häufig hilfreicher als eine abstrakte Diskussion über alle theoretisch möglichen Agenten.'
		],
		challenges: [
			'Ein Wissensnavigator mit freigegebenen Dokumenten, Quellenlinks und sichtbarer Unsicherheitsbehandlung.',
			'Ein Triage-Workflow, der Informationen vorbereitet, aber die Entscheidung nachvollziehbar beim Menschen belässt.',
			'Ein Engineering Assistant in einem isolierten Repository mit klaren Review- und Testschritten.',
			'Ein Compliance-Evidence-Prototyp auf Basis synthetischer Dokumente und definierter Kontrollpunkte.',
			'Ein operativer Workflow mit simulierten Schnittstellen und transparent gekennzeichneten Datenannahmen.'
		],
		audienceTitle: 'Gemeinsame Vorbereitung statt spätes Veto',
		audienceIntro:
			'Der Sponsor bringt den geschäftlichen Anlass, Engineering den technischen Pfad und Security die verbindlichen Grenzen ein. Diese Rollen werden vor dem Tag zusammengeführt.',
		audience: [
			'IT-Security, Datenschutz oder AI Governance als Mitgestalter des erlaubten Setups.',
			'Engineering- und Platform-Teams als Verantwortliche für Accounts, Repositories und Tooling.',
			'Fachliche Challenge Owner für Nutzer, Datenbedarf und menschliche Entscheidung.',
			'CTO-, CDO- oder Digital-Leads als Sponsor für Demo Day und Follow-up.'
		],
		security: [
			'Der Setup-Check dokumentiert Tool-Ownership, Modelloptionen, Datenklassen, Quellcode-Regeln, Logging, externe Dienste und Verantwortlichkeiten. Kann eine Challenge diese Bedingungen nicht erfüllen, wird sie angepasst oder aus dem Event genommen.',
			'Nach dem Tag werden Testdaten, temporäre Zugänge und Prototype-Artefakte entsprechend der Vereinbarung behandelt. Produktionszugriff, autonome Aktionen und die Verarbeitung nicht freigegebener Daten gehören ausdrücklich nicht zum Leistungsversprechen.'
		],
		outcome: [
			'Der Demo Day zeigt neben der Funktion auch Kontrollpunkte und Grenzen. Security erhält dadurch konkrete Erkenntnisse über Tool-Verhalten und Integrationsbedarf, während Engineering sieht, welche Leitplanken praktikabel oder noch unklar sind.',
			'Das Unternehmen gewinnt sichere Praxiserfahrung, mehrere bewertbare Prototypen und eine Liste der Freigaben oder technischen Maßnahmen, die vor einer Weiterentwicklung notwendig wären.'
		]
	}
];

const GTM_HERO_BY_SLUG: Record<string, GtmHeroKey> = {
	'hackathon-unternehmen-berlin': 'berlin',
	'hackathon-unternehmen-hamburg': 'hamburg',
	'hackathon-unternehmen-muenchen': 'munich',
	'hackathon-unternehmen-stuttgart': 'stuttgart',
	'hackathon-unternehmen-frankfurt': 'frankfurt',
	'ki-hackathon-industrie': 'industry',
	'hackathon-softwareunternehmen': 'engineering',
	'ki-hackathon-logistik-handel': 'logistics',
	'ki-hackathon-banken-versicherungen': 'finance',
	'hackathon-maschinenbau-automatisierung': 'machinery',
	'ki-adoption-engineering': 'adoption',
	'coding-agent-rollout-hackathon': 'engineering',
	'developer-experience-ai-tools': 'engineering',
	'ki-strategie-working-prototype': 'adoption',
	'interne-ai-champions': 'adoption',
	'interner-ki-hackathon': 'event',
	'hack-week-coding-agents': 'event',
	'ai-innovation-day': 'adoption',
	'legacy-modernisierung-coding-agents': 'engineering',
	'security-konformer-ki-hackathon': 'engineering',
	'codex-best-practices': 'event',
	'claude-code-best-practices': 'berlin',
	'coding-agents-vergleich-unternehmen': 'industry',
	'coding-agent-tests-verifikation': 'engineering',
	'vibe-coding-im-unternehmen': 'hamburg',
	'wird-ki-uns-ersetzen': 'machinery',
	'san-francisco-lebt-in-der-zukunft': 'adoption',
	'deutschland-hat-ein-umsetzungsproblem': 'munich',
	'ki-produktivitaet-ohne-stellenabbau': 'logistics',
	'europas-chance-mit-ki': 'stuttgart',
	'ki-hackathon-sensorik-automatisierung': 'finance',
	'ki-hackathon-intralogistik': 'frankfurt',
	'ki-hackathon-robotik': 'event',
	'ki-hackathon-steuersoftware': 'berlin',
	'ki-hackathon-digital-commerce': 'industry',
	'ki-fuer-den-mittelstand': 'engineering',
	'ki-hackathon-ostdeutschland': 'hamburg',
	'ki-hackathon-ostwestfalen-lippe': 'machinery',
	'ki-hackathon-nuernberg-franken': 'adoption',
	'ki-hackathon-ruhrgebiet': 'munich'
};

const offerPages: GtmOfferPage[] = gtmPageContent.map((page) => {
	const heroImage = GTM_HERO_BY_SLUG[page.slug];
	if (!heroImage) throw new Error(`Missing hero image for GTM page: ${page.slug}`);

	return {
		...page,
		kind: 'offer',
		publishedAt: GTM_PUBLICATION_DATE,
		heroImage
	};
});

const editorialPages: EditorialGtmPage[] = editorialPageContent.map((page) => {
	const heroImage = GTM_HERO_BY_SLUG[page.slug];
	if (!heroImage) throw new Error(`Missing hero image for GTM page: ${page.slug}`);

	return { ...page, heroImage };
});

export const gtmPages: GtmPage[] = [...offerPages, ...editorialPages];

export const gtmPaths = gtmPages.map((page) => `/${page.slug}` as const);

const gtmPageBySlug = new Map(gtmPages.map((page) => [page.slug, page]));

const ENGLISH_TITLES: Record<string, string> = {
	'hackathon-unternehmen-berlin': 'Company Hackathon in Berlin',
	'hackathon-unternehmen-hamburg': 'Company Hackathon in Hamburg',
	'hackathon-unternehmen-muenchen': 'Company Hackathon in Munich',
	'hackathon-unternehmen-stuttgart': 'Company Hackathon in Stuttgart',
	'hackathon-unternehmen-frankfurt': 'Company Hackathon in Frankfurt',
	'ki-hackathon-industrie': 'AI Hackathon for Industrial Companies',
	'hackathon-softwareunternehmen': 'Agentic Engineering Hackathon for Software Companies',
	'ki-hackathon-logistik-handel': 'AI Hackathon for Logistics and Retail',
	'ki-hackathon-banken-versicherungen': 'AI Hackathon for Banking and Insurance',
	'hackathon-maschinenbau-automatisierung': 'Hackathon for Mechanical Engineering and Automation',
	'ki-adoption-engineering': 'Accelerating AI Adoption in Engineering',
	'coding-agent-rollout-hackathon': 'Rolling Out Coding Agents with a Hackathon',
	'developer-experience-ai-tools': 'Developer Experience with AI Coding Tools',
	'ki-strategie-working-prototype': 'From AI Strategy to a Working Prototype',
	'interne-ai-champions': 'Building Internal AI Champions',
	'interner-ki-hackathon': 'Internal AI Hackathon for Companies',
	'hack-week-coding-agents': 'Hack Week with Coding Agents',
	'ai-innovation-day': 'AI Innovation Day for Companies',
	'legacy-modernisierung-coding-agents': 'Legacy Modernization with Coding Agents',
	'security-konformer-ki-hackathon': 'A Security-Compliant AI Hackathon',
	'codex-best-practices': 'Stop Prompting. Start Engineering.',
	'claude-code-best-practices': 'CLAUDE.md Is Not a Novel.',
	'coding-agents-vergleich-unternehmen': 'There Is No Single Best Coding Tool.',
	'coding-agent-tests-verifikation': 'The Best Prompt Is a Green Test.',
	'vibe-coding-im-unternehmen': 'Vibe Coding Does Not Scale.',
	'wird-ki-uns-ersetzen': 'AI Will Not Replace Us.',
	'san-francisco-lebt-in-der-zukunft': 'San Francisco Is Already Living in 2028.',
	'deutschland-hat-ein-umsetzungsproblem': 'Germany Has an Implementation Problem.',
	'ki-produktivitaet-ohne-stellenabbau': 'Productivity Is Not the Same as Layoffs.',
	'europas-chance-mit-ki': 'Europe Does Not Need to Build the Largest Model.',
	'ki-hackathon-sensorik-automatisierung': 'The Machine Knows the Failure.',
	'ki-hackathon-intralogistik': 'The Exception Is the Use Case.',
	'ki-hackathon-robotik': 'Robots Need Better Coworkers.',
	'ki-hackathon-steuersoftware': 'Tax Software Is a Knowledge System.',
	'ki-hackathon-digital-commerce': 'The Shopping Cart Is Not the Product.',
	'ki-fuer-den-mittelstand': 'From German Mittelstand to Global AI Leader.',
	'ki-hackathon-ostdeutschland': 'High-Tech Eastern Germany.',
	'ki-hackathon-ostwestfalen-lippe': 'East Westphalia Is Building the Factory of the Future.',
	'ki-hackathon-nuernberg-franken': 'Nuremberg Thinks in Systems.',
	'ki-hackathon-ruhrgebiet': 'The Ruhr Region Is Ready for Its Next Shift.'
};

const ENGLISH_FOOTER_LABELS: Record<string, string> = {
	'hackathon-softwareunternehmen': 'Agentic Hackathon for Software Teams',
	'hackathon-maschinenbau-automatisierung': 'Mechanical Engineering & Automation Hackathon',
	'ki-hackathon-ostwestfalen-lippe': 'East Westphalia Builds the Factory of Tomorrow.'
};

function englishPage(page: GtmPage): GtmPage {
	const title = ENGLISH_TITLES[page.slug] ?? page.title;
	const footerLabel = ENGLISH_FOOTER_LABELS[page.slug] ?? title;
	const description = `${title}: a practical ALL IN AGI perspective on turning real company workflows into secure, testable prototypes with modern coding agents.`;
	if (page.kind === 'offer') {
		return {
			...page, title, footerLabel, description,
			lead: [
				`${title} brings engineering, product, and domain experts together around work that matters to the business. Instead of discussing AI in the abstract, small cross-functional teams use approved tools and realistic test data to build demonstrable workflows in a focused day.`,
				`The format is prepared with the sponsor and challenge owners. Each challenge has a clear user, a narrow boundary, and a visible success test, so the day produces evidence rather than a collection of disconnected ideas.`
			],
			relevanceTitle: 'A focused build day for real company workflows',
			relevance: [
				`Coding agents become useful when teams apply them to their own systems, constraints, and quality standards. The hackathon creates a shared reference point across roles and makes both opportunities and limitations visible.`,
				`Preparation covers accounts, repositories, data classes, security rules, and the expected demo. Participants can spend the event building because the most important operating decisions have already been made.`
			],
			challenges: [
				'Build an internal knowledge navigator that answers with links to approved sources.',
				'Turn a recurring operational exception into a reviewable assistant workflow.',
				'Create a coding-agent workflow that explains a bounded code area and proposes tested changes.',
				'Prototype a product or service flow with transparent human approval points.',
				'Convert an unclear manual handoff into a traceable, demonstrable process.'
			],
			audienceTitle: 'Who should participate',
			audienceIntro: 'The strongest group combines people who understand the workflow with people who can build and sponsor what happens next.',
			audience: [
				'Engineering and platform leaders introducing coding agents.',
				'Product and domain owners responsible for concrete workflows.',
				'Developer experience, enablement, and internal academy teams.',
				'Innovation and digital teams with access to real challenge owners.'
			],
			security: [
				'Approved models, accounts, repositories, and data classes are agreed before the event. When production information cannot be used, teams work with synthetic or de-identified examples.',
				'The result is a prototype, not an autonomous production deployment. Assumptions, human controls, and known limitations remain visible in every final demonstration.'
			],
			outcome: [
				'The day ends with working demonstrations and a concise record of value hypotheses, technical friction, missing access, and accountable next owners.',
				'Teams leave with practical experience and leaders gain concrete evidence for deciding which ideas deserve another sprint, which need groundwork, and which should stop.'
			]
		};
	}
	const sections: EditorialSection[] = [
		{ title: 'The practical thesis', paragraphs: [{ text: `${title} is not primarily a story about model capability. It is about whether organizations can connect capable tools to real work, clear ownership, and observable quality. Teams learn faster when they replace broad predictions with a bounded workflow and a result that colleagues can inspect.` }, { text: 'Coding agents can reduce the cost of exploring software, documentation, and operational processes. They do not remove the need for domain judgment, security boundaries, or engineering review. Those constraints are part of the design, not obstacles to be hidden.' }] },
		{ title: 'Why implementation is the bottleneck', paragraphs: [{ text: 'Most established companies already have ideas and tool licenses. Progress slows at the interfaces between access, data, architecture, product ownership, and risk. A focused build format makes those dependencies concrete while the relevant people are in the room.' }, { text: 'A useful prototype has a named user, known inputs, an explicit boundary, and a visible success test. This discipline prevents a polished demo from being mistaken for production readiness and gives decision-makers evidence they can compare.' }] },
		{ title: 'How to run the experiment', paragraphs: [{ text: 'Select a small number of workflows before the event. Confirm approved accounts and realistic data, then form mixed teams of engineers, product leaders, and domain experts. Spend most of the day building, with short checkpoints for scope, evidence, and security.' }, { text: 'Every team should demonstrate the workflow live and explain what remains manual, uncertain, or unverified. A failed assumption is still valuable when it is documented early and prevents a much larger investment.' }] },
		{ title: 'What responsible adoption looks like', paragraphs: [{ text: 'Responsible adoption keeps humans accountable for decisions and makes sources, tests, permissions, and failure modes visible. It starts inside the company’s approved environment and avoids sensitive production data unless its use has been explicitly cleared.' }, { text: 'The goal is not to deploy autonomous agents in one day. It is to understand where the tools create leverage, what controls are required, and whether the organization can support a reliable next iteration.' }] },
		{ title: 'From demonstration to decision', paragraphs: [{ text: 'After the demo, record the functional state, value hypothesis, known limits, tool friction, and next owner for each prototype. Continue only the ideas with a credible user and a concrete path to better evidence.' }, { text: 'This turns an AI event into capability building and product discovery. Participants gain direct experience, sponsors see actual behavior instead of slides, and the company gets a grounded basis for its next investment decision.' }] }
	];
	return { ...page, title, footerLabel, description, seoTitle: title, dek: description, sections };
}

export function getGtmPage(slug: string, locale: Locale = 'de') {
	const page = gtmPageBySlug.get(slug);
	if (!page) throw new Error(`Unknown GTM page: ${slug}`);
	return locale === 'en' ? englishPage(page) : page;
}

export function gtmPagesForGroup(group: GtmGroup, locale: Locale = 'de') {
	const pages = gtmPages.filter((page) => page.group === group);
	return locale === 'en' ? pages.map(englishPage) : pages;
}
