import type { EditorialPageContent, EditorialSource, GtmIconName } from '$lib/gtm-pages';
import { editorialPage, sourced } from './editorial-builders';

type IndustrySpec = {
	slug: string;
	title: string;
	seoTitle: string;
	footerLabel: string;
	icon: GtmIconName;
	description: string;
	dek: string;
	field: string;
	actors: string;
	problem: string;
	opportunity: string;
	publicSignal: string;
	publicSourceIds: string[];
	challenges: string[];
	data: string;
	security: string;
	outcome: string;
	sources: EditorialSource[];
	relatedSlugs: string[];
};

function blueprint(spec: IndustrySpec): EditorialPageContent {
	return editorialPage(
		{
			slug: spec.slug,
			group: 'Branchen-Blueprints',
			title: spec.title,
			seoTitle: spec.seoTitle,
			footerLabel: spec.footerLabel,
			icon: spec.icon,
			description: spec.description,
			dek: spec.dek,
			sources: spec.sources,
			relatedSlugs: spec.relatedSlugs
		},
		[
			{
				title: 'Blueprint, keine Kundenreferenz',
				paragraphs: [
					`Dieses Szenario zeigt, wie ein eintägiger Agentic Engineering Hackathon im Feld ${spec.field} aussehen kann. Es beschreibt keinen durchgeführten Kundenauftrag und behauptet keine erzielten Kennzahlen. Der Blueprint übersetzt typische Branchenbedingungen in einen realistischen, sicheren Build Day.`,
					`Die stärkste Besetzung verbindet ${spec.actors}. Diese Rollen betrachten denselben Workflow aus unterschiedlichen Richtungen: tatsächlicher Nutzerbedarf, technische Machbarkeit, Datenlage, Risiko und Anschlussfähigkeit. Der Hackathon verdichtet diese Perspektiven auf eine überprüfbare Demo.`
				]
			},
			{
				title: 'Der operative Engpass',
				paragraphs: [
					spec.problem,
					spec.opportunity,
					sourced(spec.publicSignal, ...spec.publicSourceIds)
				]
			},
			{
				title: 'Fünf geeignete Challenges',
				paragraphs: [
					'Eine gute Challenge besitzt einen konkreten Nutzer, einen begrenzten Eingang, einen sichtbaren Ablauf und eine Demo, die am selben Tag geprüft werden kann. Sie versucht nicht, einen gesamten Kernprozess zu automatisieren. Sie beantwortet eine relevante Machbarkeitsfrage.',
					'Die folgenden Beispiele sind Startpunkte für das Challenge Design. Im Sponsor Call werden sie an vorhandene Systeme, strategische Prioritäten und die Fähigkeiten der Teilnehmenden angepasst.'
				],
				bullets: spec.challenges
			},
			{
				title: 'Daten und Security werden vorbereitet',
				paragraphs: [
					`${spec.data} Für den Prototype reicht häufig ein begrenzter, repräsentativer Ausschnitt. Entscheidend ist nicht Datenmenge, sondern ob die Beispiele den Nutzerfluss und die schwierigen Ausnahmen glaubwürdig abbilden.`,
					`${spec.security} Der Event umgeht keine Freigabe. Er macht den erlaubten Pfad praktisch nutzbar und dokumentiert offen, welche Annahmen, Simulationen und menschlichen Entscheidungen im Prototype stecken.`
				]
			},
			{
				title: 'So läuft der Build Day',
				paragraphs: [
					'Vor dem Termin wählen Sponsor und Challenge Owner drei bis acht Aufgaben aus. Ein Setup-Check prüft Accounts, Geräte, Repositories, Beispielinformationen und Startbefehle. Am Morgen erhalten die Teams einen kurzen Tool-Impuls und schneiden danach Nutzerfluss, Eingaben und Demo-Ziel endgültig zu.',
					'Mindestens siebzig Prozent des Tages wird gebaut. Facilitator helfen bei Scope, Agenten-Workflow und Blockaden; Fachpersonen validieren Annahmen. Am Nachmittag stabilisieren die Teams den wichtigsten Pfad und zeigen beim Demo Day Funktion, Grenzen, verwendete Daten und einen sinnvollen nächsten Schritt.'
				]
			},
			{
				title: 'Was nach einem Tag belastbar ist',
				paragraphs: [
					`${spec.outcome} Belastbar bedeutet dabei nicht produktionsreif. Ein guter Prototype belegt einen Nutzerfluss, macht technischen und organisatorischen Aufwand sichtbar und erlaubt eine bessere Entscheidung über Weiterarbeit.`,
					'Jedes Ergebnis wird mit Funktionsstand, Nutzenhypothese, Risiken, Tool-Reibung und einem nächsten Eigentümer festgehalten. So wird aus dem Branchen-Blueprint keine Show, sondern ein kleiner Activation Pilot, der Capability und konkrete Chancen gleichzeitig sichtbar macht.',
					`Für ${spec.field} ist auch ein negatives Ergebnis wertvoll. Wenn Quellen nicht verlässlich verbunden werden können, eine Ausnahme zu viel Domänenurteil verlangt oder die Integration den Nutzen übersteigt, weiß der Sponsor das nach einem begrenzten Versuch statt nach einem langen Projekt.`,
					'Weitergeführt wird nur, was einen erkennbaren Nutzerwert, einen verantwortlichen Owner und einen realistischen technischen Pfad besitzt. Alles andere bleibt dokumentiertes Lernen. Diese Konsequenz schützt das Unternehmen davor, einen überzeugenden Demo-Moment mit einer belastbaren Produktentscheidung zu verwechseln.'
				]
			}
		],
		{ blueprint: true }
	);
}

export const industryPages: EditorialPageContent[] = [
	blueprint({
		slug: 'ki-hackathon-sensorik-automatisierung',
		title: 'Die Maschine kennt den Fehler.',
		seoTitle: 'KI-Hackathon für Sensorik und Automatisierung',
		footerLabel: 'Sensorik & Automatisierung',
		icon: 'RadioTower',
		description: 'Blueprint für einen KI-Hackathon in Sensorik und Automatisierung: Diagnose, Inbetriebnahme, Servicewissen und Engineering Changes.',
		dek: 'Sensoren liefern Signale. Der Engpass liegt oft darin, aus Signal, Dokumentation und Erfahrung schnell eine verantwortbare nächste Handlung zu machen.',
		field: 'Sensorik und industrielle Automatisierung',
		actors: 'Applikationsengineering, Software, Service, Produktmanagement und erfahrene Anlagen- oder Prozessexperten',
		problem: 'Fehlerbilder entstehen an der Schnittstelle von Hardware, Konfiguration, Umgebung und Software. Informationen liegen in Messwerten, Handbüchern, Tickets und im Erfahrungswissen einzelner Personen. Die Suche nach dem nächsten sinnvollen Prüfschritt dauert deshalb häufig länger als die eigentliche technische Korrektur.',
		opportunity: 'Coding Agents können diese Quellen nicht magisch vereinheitlichen. Sie können aber einen begrenzten Diagnosefluss prototypisieren, technische Dokumente zugänglich machen, Konfigurationen erklären und aus einem Fehlerfall nachvollziehbare Prüfungen vorbereiten. Der Mensch behält die Entscheidung über Eingriff und Freigabe.',
		publicSignal: 'Öffentliche Beispiele von Phoenix Contact und SICK zeigen, dass industrielle Unternehmen bereits in Software, Machine Learning und digitale Fabrikprozesse investieren. Der Blueprint leitet daraus keine Kundenbeziehung ab; er nutzt die Veröffentlichungen als Beleg für die Relevanz des Problemraums.',
		publicSourceIds: ['phoenix', 'sick'],
		challenges: [
			'Ein Diagnose-Assistent, der synthetische Sensorwerte mit Fehlercodes und freigegebenen Handbuchstellen verbindet.',
			'Ein Inbetriebnahme-Guide, der eine Konfiguration prüft, offene Parameter markiert und den nächsten Test vorbereitet.',
			'Ein Engineering-Change-Explorer, der betroffene Schnittstellen, Tests und Dokumente für eine kleine Änderung sammelt.',
			'Ein Support-Ticket-Workflow, der aus Freitext einen reproduzierbaren Fall und gezielte Rückfragen erzeugt.',
			'Ein interner Navigator für Produktvarianten, Beispielcode und technische Freigaben mit sichtbaren Quellen.'
		],
		data: 'Geeignet sind synthetische Messreihen, freigegebene Fehlercodes, anonymisierte Supportfälle und begrenzte Dokumentenausschnitte.',
		security: 'Produktionsnetze, echte Kundensysteme und autonome Maschinenaktionen bleiben außerhalb des Scopes; Zugriffe erfolgen nur in einer abgestimmten Entwicklungs- oder Sandbox-Umgebung.',
		outcome: 'Nach einem Tag kann ein Team zeigen, ob relevante Signale und Wissensquellen in einem hilfreichen Diagnose- oder Engineering-Flow zusammenkommen.',
		sources: [
			{ id: 'phoenix', label: 'MLnext in der Digital Factory', publisher: 'Phoenix Contact', url: 'https://www.phoenixcontact.com/de-de/industrien/applikationen/mlnext' },
			{ id: 'sick', label: 'Geschäftsbericht 2025', publisher: 'SICK', url: 'https://tools.sick.com/annual-report/SICK_Geschaeftsbericht_2025_EN.pdf' }
		],
		relatedSlugs: ['ki-hackathon-industrie', 'hackathon-maschinenbau-automatisierung', 'security-konformer-ki-hackathon']
	}),
	blueprint({
		slug: 'ki-hackathon-intralogistik', title: 'Der Ausnahmefall ist der Use Case.',
		seoTitle: 'KI-Hackathon für Intralogistik und Warehouse Automation', footerLabel: 'Intralogistik & Warehouse', icon: 'Warehouse',
		description: 'Blueprint für einen KI-Hackathon in Intralogistik und Warehouse Automation: Ausnahmen, Flottenwissen und operative Entscheidungen.',
		dek: 'Der Normalfall ist bereits automatisiert. Wert entsteht dort, wo Lieferungen, Bestände, Anlagen und Menschen vom geplanten Ablauf abweichen.',
		field: 'Intralogistik und Warehouse Automation',
		actors: 'Warehouse Operations, Software Engineering, Service, Produktmanagement und Automatisierungstechnik',
		problem: 'In einem Lager laufen viele standardisierte Bewegungen zuverlässig. Zeit verlieren Teams an Ausnahmen: eine Palette fehlt, ein Auftrag hängt, ein Fahrzeug meldet einen widersprüchlichen Zustand oder mehrere Systeme beschreiben denselben Vorgang unterschiedlich. Die Lösung braucht technischen und operativen Kontext.',
		opportunity: 'Ein Agent kann Ereignisse bündeln, passende Betriebsanweisungen finden und einen prüfbaren Handlungsvorschlag vorbereiten. Er sollte keine physische Aktion autonom auslösen. Der interessante Prototype ist ein klarer Mensch-in-der-Schleife-Workflow, der Ausnahmen schneller verständlich macht.',
		publicSignal: 'Jungheinrich und Körber veröffentlichen umfangreiche digitale Produkt- und Softwareaktivitäten rund um Intralogistik. Diese öffentlichen Signale zeigen einen softwareintensiven Markt; sie sind keine Aussage über eine Zusammenarbeit mit ALL IN AGI.',
		publicSourceIds: ['jungheinrich', 'koerber'],
		challenges: [
			'Ein Exception Cockpit, das synthetische Lagerereignisse priorisiert und relevante Kontextinformationen zusammenführt.',
			'Ein Flotten-Support-Assistent, der Fehlerbild, Handbuch und bekannte Prüfsequenzen mit Quellen anzeigt.',
			'Ein Auftrags-Trace, der einen hängenden Workflow systemübergreifend als verständliche Ereigniskette darstellt.',
			'Ein Schichtübergabe-Generator, der offene Ausnahmen, Entscheidungen und nächste Owner strukturiert zusammenfasst.',
			'Ein Konfigurations-Prototyp für eine begrenzte Warehouse-Regel mit Simulation und menschlicher Freigabe.'
		],
		data: 'Synthetische Aufträge, Fahrzeugzustände, Lagerplätze und Ereignisfolgen können typische Ausnahmen realistisch abbilden, ohne Kundendaten zu verwenden.',
		security: 'Der Prototype bleibt von Steuerungs- und Produktionssystemen getrennt; APIs können simuliert und alle vorgeschlagenen Aktionen als nicht ausführbare Empfehlungen dargestellt werden.',
		outcome: 'Der Demo Day kann zeigen, ob ein Ausnahmefall schneller erklärt, priorisiert und an die richtige Person übergeben wird und welche Daten für einen Pilot fehlen.',
		sources: [
			{ id: 'jungheinrich', label: 'Smarte Produkte und digitale Innovationen', publisher: 'Jungheinrich', url: 'https://www.jungheinrich.com/en/newsroom/jungheinrich-blog/lydia-schneider-ueber-smarte-produkte-und-digitale-innovationen-2185390' },
			{ id: 'koerber', label: 'Supply Chain Software', publisher: 'Körber', url: 'https://www.koerber-supplychain.com/' }
		],
		relatedSlugs: ['ki-hackathon-logistik-handel', 'hackathon-unternehmen-hamburg', 'ki-hackathon-digital-commerce']
	}),
	blueprint({
		slug: 'ki-hackathon-robotik', title: 'Roboter brauchen bessere Kollegen.',
		seoTitle: 'KI-Hackathon für Robotik und industrielle Software', footerLabel: 'Robotik & Software', icon: 'CircuitBoard',
		description: 'Blueprint für einen KI-Hackathon in Robotik und industrieller Software: Konfiguration, Simulation, Dokumentation und sichere Freigaben.',
		dek: 'Mehr Autonomie in der Maschine erhöht den Wert guter menschlicher Werkzeuge: für Konfiguration, Diagnose, Simulation und nachvollziehbare Entscheidungen.',
		field: 'Robotik und industrielle Software',
		actors: 'Robotics Engineering, Applikation, Simulation, Service, Safety und Product',
		problem: 'Roboteranwendungen verbinden Mechanik, Elektrik, Software, Umgebungswissen und Sicherheitsanforderungen. Kleine Änderungen können viele Abhängigkeiten berühren. Wertvolles Wissen steckt in Projektdateien, Dokumentation, Beispielprogrammen und den Köpfen erfahrener Integratoren.',
		opportunity: 'Coding Agents eignen sich hier zunächst als Kollegen für Menschen: Sie können Konfiguration erklären, Beispielcode finden, Simulationen vorbereiten und Prüfpfade strukturieren. Ein Hackathon testet diese Unterstützung außerhalb einer produktiven Anlage und mit klaren Grenzen für physische Aktionen.',
		publicSignal: 'KUKA bündelt Software, digitale Services, Machine Learning und künstliche Intelligenz in einem eigenen Digitalbereich. Diese öffentlich beschriebene Richtung belegt den wachsenden Softwareanteil der Robotik, ohne einen Kundenstatus zu implizieren.',
		publicSourceIds: ['kuka'],
		challenges: [
			'Ein Application-Setup-Assistent, der aus einer Zellenbeschreibung offene Parameter und passende Beispiele ableitet.',
			'Ein Simulator-Workflow, der eine begrenzte Änderung vorbereitet und erwartete Zustände dokumentiert.',
			'Ein Code-Navigator für Roboterprogramme, Schnittstellen und freigegebene interne Bibliotheken.',
			'Ein Service-Prototyp, der Fehlercode, Anlagenkontext und sichere nächste Diagnoseaktionen verbindet.',
			'Ein Safety-Review-Canvas, das Annahmen, menschliche Freigaben und noch zu prüfende Risiken sichtbar macht.'
		],
		data: 'Verwendet werden isolierte Beispielprojekte, simulierte Zustände, freigegebene Dokumente und synthetische Anlagenbeschreibungen.',
		security: 'Kein Team steuert während des Hackathons eine produktive Zelle autonom; Safety-Logik, reale Bewegungen und Deployment bleiben in den etablierten Freigabeprozessen.',
		outcome: 'Ein sinnvoller Prototype zeigt, ob Engineers eine Roboteranwendung schneller verstehen oder vorbereiten können und an welchen Stellen Erfahrung und Safety-Prüfung unverzichtbar bleiben.',
		sources: [
			{ id: 'kuka', label: 'KUKA Digital', publisher: 'KUKA', url: 'https://www.kuka.com/en-de/kuka-digital' },
			{ id: 'festo', label: 'Digitale Transformation', publisher: 'Festo', url: 'https://www.festo.com/de/de/e/loesungen/digitale-transformation-id_253122/' }
		],
		relatedSlugs: ['hackathon-maschinenbau-automatisierung', 'ki-hackathon-industrie', 'coding-agent-tests-verifikation']
	}),
	blueprint({
		slug: 'ki-hackathon-steuersoftware', title: 'Steuersoftware ist ein Wissenssystem.',
		seoTitle: 'KI-Hackathon für Steuer-, Kanzlei- und Business-Software', footerLabel: 'Steuer- & Business-Software', icon: 'Calculator',
		description: 'Blueprint für einen KI-Hackathon in Steuer- und Business-Software: Regelwissen, Legacy-Code, Support und nachvollziehbare Quellen.',
		dek: 'Die Oberfläche ist nur die Spitze. Darunter liegen Regeln, Fristen, Ausnahmen, historische Entscheidungen und das Vertrauen professioneller Nutzer.',
		field: 'Steuer-, Kanzlei- und Business-Software',
		actors: 'Software Engineering, Tax- oder Accounting-Fachlichkeit, Product, Support, Quality und Governance',
		problem: 'Business-Software bildet langlebige Regeln und anspruchsvolle Ausnahmen ab. Änderungen müssen fachlich korrekt, technisch kompatibel und für Nutzer erklärbar sein. Gleichzeitig bremsen gewachsene Codebasen, verteilte Dokumentation und komplexe Supportfälle die Weiterentwicklung.',
		opportunity: 'Coding Agents können Regel- und Codekontext verbinden, Testfälle vorbereiten, Supportinformationen strukturieren und begrenzte Modernisierungsschritte unterstützen. Der Wert entsteht nur, wenn Quellen und Annahmen sichtbar bleiben und fachliche Freigabe nicht durch Modellplausibilität ersetzt wird.',
		publicSignal: 'DATEV veröffentlicht Forschung und Praxis zur Nutzung von KI in Softwareentwicklung und Qualität. Das zeigt die Relevanz des Feldes bei einem anspruchsvollen deutschen Softwareanbieter; der Blueprint beschreibt ausdrücklich kein ALL-IN-AGI-Projekt bei DATEV.',
		publicSourceIds: ['datev'],
		challenges: [
			'Ein Regel-Navigator über freigegebene Fachinformationen mit Quellen, Gültigkeitsstand und offenen Fragen.',
			'Ein Supportfall-zu-Testfall-Workflow, der einen anonymisierten Nutzerfall technisch reproduzierbar macht.',
			'Ein Legacy-Modul-Explorer, der fachliche Abhängigkeiten und vorhandene Tests für eine kleine Änderung darstellt.',
			'Ein Migrations-Prototyp für eine klar begrenzte Schnittstelle mit Regressionstests und Review-Notiz.',
			'Ein Onboarding-Assistent, der neue Engineers durch System, Domänenbegriffe und erste sichere Aufgabe führt.'
		],
		data: 'Synthetische Mandanten, fiktive Belege, anonymisierte Supportfälle und klar datierte Regelausschnitte schaffen einen realistischen, aber sicheren Arbeitsraum.',
		security: 'Personenbezogene Finanz- und Mandantendaten bleiben ausgeschlossen; Ergebnisse markieren Quellen, Gültigkeitsstände und jede Stelle, die fachliche Prüfung verlangt.',
		outcome: 'Nach einem Tag lässt sich beurteilen, ob ein eng geschnittener Wissens- oder Engineering-Workflow schneller und nachvollziehbarer wird, ohne fachliche Verantwortung zu verschieben.',
		sources: [
			{ id: 'datev', label: 'Mit KI Qualität und Effizienz in der Softwareentwicklung steigern', publisher: 'DATEV', url: 'https://www.datev.de/web/de/berufsgruppenuebergreifend/presse/presseinformationen/meldungen-2025/mit-ki-qualitaet-und-effizienz-in-der-softwareentwicklung-steigern' },
			{ id: 'nist', label: 'AI Risk Management Framework', publisher: 'NIST', url: 'https://www.nist.gov/itl/ai-risk-management-framework' }
		],
		relatedSlugs: ['hackathon-softwareunternehmen', 'legacy-modernisierung-coding-agents', 'ki-hackathon-banken-versicherungen']
	}),
	blueprint({
		slug: 'ki-hackathon-digital-commerce', title: 'Der Warenkorb ist nicht das Produkt.',
		seoTitle: 'KI-Hackathon für E-Commerce und digitale Marktplätze', footerLabel: 'Commerce & Marktplätze', icon: 'ShoppingCart',
		description: 'Blueprint für einen KI-Hackathon in E-Commerce und digitalen Marktplätzen: Suche, Service, Händler-Workflows und Plattformprozesse.',
		dek: 'Digitale Commerce-Produkte gewinnen nicht nur im Checkout. Suche, Vertrauen, Händlerarbeit, Support und operative Ausnahmen entscheiden über die Erfahrung.',
		field: 'E-Commerce und digitalen Marktplätzen',
		actors: 'Product, Engineering, Search oder Data, Customer Service, Marketplace Operations und Category Management',
		problem: 'Ein Marktplatz verbindet Kundenintention, Angebotsdaten, Händlerprozesse, Suche, Vertrauen und Service. Reibung entsteht häufig zwischen Systemen: unvollständige Inhalte, unklare Rückfragen, widersprüchliche Signale oder Fälle, die nicht in den Standardprozess passen.',
		opportunity: 'Agentische Workflows können Kontext sammeln, Inhalte vorbereiten, Ausnahmen strukturieren und Produktideen schnell als Nutzerfluss zeigen. Sie dürfen dabei weder unkontrolliert veröffentlichen noch Entscheidungen über Kunden oder Händler ohne nachvollziehbare Regeln automatisieren.',
		publicSignal: 'Otto Group und Scout24 beschreiben öffentlich erhebliche Technologie-, Daten- und KI-Aktivitäten. Diese Signale zeigen, dass Commerce und Marktplätze softwareintensive KI-Anwendungsfelder sind; sie stellen keine Referenz oder Zusammenarbeit mit ALL IN AGI dar.',
		publicSourceIds: ['otto', 'scout'],
		challenges: [
			'Ein Search-Intent-Prototyp, der komplexe Nutzerwünsche in prüfbare Filter und Rückfragen übersetzt.',
			'Ein Händler-Onboarding-Workflow, der fiktive Angebotsdaten prüft und fehlende Informationen verständlich anfordert.',
			'Ein Service-Assistent, der einen synthetischen Kundenfall systemübergreifend zusammenfasst und Antwortoptionen vorbereitet.',
			'Ein Product-Feedback-Lab, das anonymisierte Signale clustert und daraus einen testbaren Nutzerfluss baut.',
			'Ein Operations-Cockpit für simulierte Ausnahmen mit Priorisierung, Quellen und menschlicher Entscheidung.'
		],
		data: 'Fiktive Nutzerprofile, synthetische Katalogdaten, anonymisierte Feedback-Beispiele und simulierte Plattformereignisse reichen für belastbare Produktfragen.',
		security: 'Veröffentlichungen, Preisänderungen, Kundenkommunikation und Händlermaßnahmen bleiben deaktiviert oder benötigen explizite menschliche Freigabe.',
		outcome: 'Ein Prototype kann zeigen, ob ein konkreter Commerce-Workflow verständlicher, schneller oder konsistenter wird und welche Produkt- und Datenarbeit für einen Pilot nötig wäre.',
		sources: [
			{ id: 'otto', label: 'Agentic Commerce: ready for take-off', publisher: 'Otto Group', url: 'https://www.ottogroup.com/en/stories/story/agentic-commerce-ready-for-takeoff.php' },
			{ id: 'scout', label: 'Management Board and Leadership Team', publisher: 'Scout24', url: 'https://www.scout24.com/en/company/management-board-and-leadership-team' }
		],
		relatedSlugs: ['ki-hackathon-logistik-handel', 'hackathon-softwareunternehmen', 'hackathon-unternehmen-hamburg']
	})
];
