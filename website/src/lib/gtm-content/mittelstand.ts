import type { EditorialPageContent, EditorialSource, GtmIconName } from '$lib/gtm-pages';
import { editorialPage, sourced } from './editorial-builders';

type RegionSpec = {
	slug: string;
	title: string;
	seoTitle: string;
	footerLabel: string;
	icon: GtmIconName;
	description: string;
	dek: string;
	region: string;
	strength: string;
	thesis: string;
	publicContext: string;
	publicSourceIds: string[];
	challenges: string[];
	participants: string;
	localAngle: string;
	sources: EditorialSource[];
	relatedSlugs: string[];
};

function regionPage(spec: RegionSpec): EditorialPageContent {
	return editorialPage(
		{
			slug: spec.slug,
			group: 'Mittelstand',
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
				title: 'Die regionale These',
				paragraphs: [
					spec.thesis,
					`${spec.region} besitzt ${spec.strength}. Diese Ausgangslage ist wichtiger als ein abstraktes „KI-Potenzial“. Wo Produkte, Prozesse und erfahrene Fachkräfte bereits vorhanden sind, kann Agentic Engineering unmittelbar an realer Wertschöpfung ansetzen.`
				]
			},
			{
				title: 'Stärke braucht eine höhere Taktzahl',
				paragraphs: [
					sourced(spec.publicContext, ...spec.publicSourceIds),
					'Öffentliche Cluster- und Unternehmensinformationen belegen keine automatische KI-Reife jedes Betriebs. Sie zeigen aber eine Dichte an Domänen, technischen Teams und Partnern, in der praxisnahe Aktivierung besonders sinnvoll ist. Der Engpass liegt häufig zwischen strategischem Interesse und dem ersten gemeinsam bewerteten Prototype.',
					`${spec.localAngle} Ein regionaler Ansatz erleichtert zudem Austausch, Empfehlungen und wiederholte Formate, ohne jedes Unternehmen in dasselbe Programm zu pressen.`
				]
			},
			{
				title: 'Was Teams an einem Tag bauen können',
				paragraphs: [
					'Geeignete Challenges liegen nah an vorhandenen Produkten und Arbeitsabläufen. Sie haben einen klaren Nutzer, nutzen freigegebene oder synthetische Informationen und enden mit einer sichtbaren Demo. Ein Hackathon ist kein Ideenwettbewerb ohne Anschluss, sondern ein begrenzter Activation Pilot.',
					'Die konkrete Auswahl erfolgt mit Challenge Ownern aus dem Unternehmen. So bleiben regionale Schlagworte draußen und die tatsächliche Arbeit drinnen.'
				],
				bullets: spec.challenges
			},
			{
				title: 'Wer im Raum sein sollte',
				paragraphs: [
					`${spec.participants} Der Sponsor muss nah genug am Bereich sein, um 15 bis 50 Teilnehmende, freigegebene Tools und drei bis acht relevante Challenges zusammenzubringen. Gleichzeitig sollte er den Demo Day besuchen und für starke Ergebnisse einen nächsten Schritt ermöglichen können.`,
					'Nicht alle Personen müssen programmieren. Engineers verantworten den technischen Pfad; Product und Fachbereich schärfen Nutzer, Regeln und Nutzen; Security oder Tool Owner definieren vorab den erlaubten Rahmen. Gerade diese Mischung übersetzt tiefes Mittelstandswissen in einen testbaren digitalen Ablauf.'
				]
			},
			{
				title: 'Sicher bauen, nicht abstrakt warten',
				paragraphs: [
					'Vor dem Termin werden Accounts, Modelle, Repositories, Datenklassen und externe Dienste geprüft. Sensible Kunden-, Maschinen- oder Personendaten sind keine Voraussetzung. Repräsentative Dokumente, simulierte Ereignisse und synthetische Datensätze können den entscheidenden Nutzerfluss realistisch genug machen.',
					'Der Prototype bleibt außerhalb produktiver Systeme. Er zeigt, welche Integration später nötig wäre, wo ein Mensch entscheiden muss und welche Annahmen noch nicht geprüft sind. Diese Grenze beschleunigt den Tag, weil Teams nicht gleichzeitig experimentieren und eine Produktionsfreigabe verhandeln.'
				]
			},
			{
				title: 'Vom regionalen Event zur Weltmarkt-Fähigkeit',
				paragraphs: [
					'Nach dem Demo Day erhält jeder Prototype einen Funktionsstand, eine Nutzenhypothese, bekannte Grenzen und einen nächsten Eigentümer. Innerhalb von zehn Arbeitstagen wird entschieden, was weitergebaut, vorbereitet oder bewusst beendet wird. So bleibt die Energie nicht im Eventraum zurück.',
					'Ein einzelner Hackathon macht kein Unternehmen zum Weltmarktführer. Er trainiert jedoch eine Fähigkeit, die Weltmarktführer brauchen: neue Werkzeuge schnell mit eigenem Domänenwissen verbinden, Ergebnisse ehrlich prüfen und gute Ansätze konsequent weiterführen.',
					`Für ${spec.region} kann daraus mehr als ein einzelner Termin entstehen. Erfolgreiche Teams teilen ihre Arbeitsmuster intern, weitere Bereiche übernehmen passende Challenges und regionale Partner verbreiten belastbare Erfahrungen statt allgemeiner Technologieversprechen.`,
					'Entscheidend bleibt die Reihenfolge: zuerst ein klarer betrieblicher Nutzen, dann ein funktionierender Prototype, danach Belege und erst anschließend Skalierung. So wird regionale Ambition nicht zur Kampagne ohne Substanz, sondern zu einer Kette kleiner, beobachtbarer Fortschritte.'
				]
			}
		]
	);
}

export const mittelstandPages: EditorialPageContent[] = [
	regionPage({
		slug: 'ki-fuer-den-mittelstand', title: 'Mittelstand zum Weltmarktführer.',
		seoTitle: 'KI für den deutschen Mittelstand: Vom Pilot zum Weltmarktführer', footerLabel: 'KI für den Mittelstand', icon: 'Crown',
		description: 'KI für den deutschen Mittelstand praktisch machen: Domänenwissen, Coding Agents und echte Challenges in einem sicheren Build Day verbinden.',
		dek: 'Der Mittelstand muss nicht wie Silicon Valley werden. Er muss seine eigene Expertise schneller in Software, Services und neue Arbeitsweisen übersetzen.',
		region: 'Der deutsche Mittelstand',
		strength: 'tiefe Kundennähe, spezialisiertes Prozesswissen, langlebige Produkte und Menschen, die technische Ausnahmen wirklich verstehen',
		thesis: 'Deutschlands nächste Weltmarktführer entstehen nicht durch die breiteste KI-Strategie. Sie entstehen dort, wo ein spezialisiertes Unternehmen sein Wissen schneller als der Wettbewerb in bessere Produkte, Engineering-Workflows und Services übersetzt. Coding Agents können diese Taktzahl erhöhen, wenn sie praktisch und kontrolliert eingeführt werden.',
		publicContext: 'Mittelstand-Digital unterstützt kleine und mittlere Unternehmen beim praxisnahen Technologietransfer. KfW Research untersucht Digitalisierung und Innovation im Mittelstand. Beide Perspektiven zeigen: Zugang zu Wissen ist wichtig, doch Umsetzungskapazität im einzelnen Betrieb bleibt entscheidend.',
		publicSourceIds: ['mittelstand-digital', 'kfw'],
		challenges: [
			'Ein Service-Assistent über freigegebene Handbücher, Fehlercodes und typische Diagnosewege.',
			'Ein Angebots- oder Konfigurationsflow, der Regeln sichtbar macht und offene Angaben gezielt abfragt.',
			'Ein Legacy-Explorer, der einen begrenzten Codebereich erklärt und fehlende Tests vorbereitet.',
			'Ein interner Wissensnavigator für Engineering, Vertrieb oder Inbetriebnahme mit Quellen.',
			'Ein Product-Prototype für eine lange bekannte Kundenreibe, die im Tagesgeschäft liegen bleibt.'
		],
		participants: 'Besonders wertvoll ist die Verbindung aus Geschäftsführung oder Bereichsleitung, erfahrenen Fachpersonen, Software- oder Automatisierungsengineering und jüngeren Buildern.',
		localAngle: 'Für Mittelständler zählt kein standardisierter Konzern-Rollout, sondern ein enger Scope, kurze Vorbereitung und ein Ergebnis, das zur eigenen Wertschöpfung passt.',
		sources: [
			{ id: 'mittelstand-digital', label: 'Mittelstand-Digital', publisher: 'Bundesministerium für Wirtschaft und Energie', url: 'https://www.mittelstand-digital.de/' },
			{ id: 'kfw', label: 'KfW-Mittelstandspanel', publisher: 'KfW Research', url: 'https://www.kfw.de/%C3%9Cber-die-KfW/Newsroom/Aktuelles/KfW-Mittelstandspanel.html' }
		],
		relatedSlugs: ['ki-hackathon-industrie', 'ki-adoption-engineering', 'deutschland-hat-ein-umsetzungsproblem']
	}),
	regionPage({
		slug: 'ki-hackathon-ostdeutschland', title: 'Hightech Ostdeutschland.',
		seoTitle: 'KI-Hackathon in Ostdeutschland für Industrie und Mittelstand', footerLabel: 'Hightech Ostdeutschland', icon: 'MapPinned',
		description: 'KI-Hackathon in Ostdeutschland für Industrie und Mittelstand: Mikroelektronik, Optik, Maschinenbau und Software praktisch verbinden.',
		dek: 'Ostdeutschland ist kein Aufholgebiet für Technologie. Zwischen Mikroelektronik, Optik, Energie, Maschinenbau und Forschung entsteht bereits industrielle Zukunft.',
		region: 'Ostdeutschland',
		strength: 'international relevante Mikroelektronik, Optik und Photonik, Maschinenbau, Energietechnik, Forschungseinrichtungen und wachsende Softwarekompetenz',
		thesis: 'Hightech Ostdeutschland braucht keine Erzählung vom späten Anschluss. Die Region besitzt industrielle und wissenschaftliche Assets, die im KI-Zeitalter zentral werden. Die nächste Aufgabe ist, diese Stärke häufiger in anwendbare agentische Workflows und sichtbare Prototypen zu übersetzen.',
		publicContext: 'Silicon Saxony beschreibt ein großes europäisches Mikroelektronik- und Digitalcluster; OptoNet vernetzt die Photonik in Thüringen. Diese Cluster stehen exemplarisch für technische Dichte und spezialisierte Wertschöpfung in den östlichen Bundesländern.',
		publicSourceIds: ['silicon-saxony', 'optonet'],
		challenges: [
			'Ein Engineering-Navigator für Prozesswissen, Spezifikationen und freigegebene technische Dokumentation.',
			'Ein Wartungs- oder Diagnoseflow für synthetische Anlagen- und Sensordaten.',
			'Ein Quality-Assistent, der Messprotokolle strukturiert und offene Prüfungen sichtbar macht.',
			'Ein Software-Migrations-Prototyp für einen begrenzten industriellen oder wissenschaftlichen Codebereich.',
			'Ein Transfer-Prototype, der Forschungsergebnisse für einen konkreten betrieblichen Nutzerfluss zugänglich macht.'
		],
		participants: 'Je nach Standort gehören Produktions- und Prozessexperten, Forschungs- oder Entwicklungsingenieurswesen, Softwareteams, Qualität und technische Produktverantwortliche an einen Tisch.',
		localAngle: 'Formate können bei einem Unternehmen vor Ort oder gemeinsam mit einem regionalen Cluster organisiert werden; die Challenge-Ownership bleibt bei den beteiligten Betrieben.',
		sources: [
			{ id: 'silicon-saxony', label: 'Silicon Saxony', publisher: 'Silicon Saxony e. V.', url: 'https://silicon-saxony.de/' },
			{ id: 'optonet', label: 'OptoNet Photoniknetzwerk Thüringen', publisher: 'OptoNet e. V.', url: 'https://optonet-jena.de/' }
		],
		relatedSlugs: ['ki-hackathon-industrie', 'ki-hackathon-sensorik-automatisierung', 'hackathon-unternehmen-berlin']
	}),
	regionPage({
		slug: 'ki-hackathon-ostwestfalen-lippe', title: 'Ostwestfalen baut die Fabrik der Zukunft.',
		seoTitle: 'KI-Hackathon in Ostwestfalen-Lippe für Industrieunternehmen', footerLabel: 'Hightech Ostwestfalen-Lippe', icon: 'Building2',
		description: 'KI-Hackathon in Ostwestfalen-Lippe für Industrieunternehmen: Automatisierung, Maschinenbau und Hidden Champions mit Coding Agents aktivieren.',
		dek: 'Die Fabrik der Zukunft entsteht nicht in einer Keynote. Sie entsteht, wenn Automatisierer, Maschinenbauer und Softwareteams reale Abläufe neu bauen.',
		region: 'Ostwestfalen-Lippe',
		strength: 'eine außergewöhnliche Konzentration aus industrieller Automation, Elektrotechnik, Maschinenbau, Möbel- und Lebensmitteltechnik sowie anwendungsnaher Forschung',
		thesis: 'OWL besitzt viele Unternehmen, die globale Nischen nicht durch Lautstärke, sondern durch Engineering-Tiefe führen. Genau diese Kultur kann bei Agentic Engineering gewinnen: reale Systeme verstehen, pragmatisch testen und funktionierende Lösungen konsequent industrialisieren.',
		publicContext: 'Das Technologie-Netzwerk it’s OWL verbindet Unternehmen und Forschung rund um intelligente technische Systeme. Öffentliche Aktivitäten von Phoenix Contact, WAGO und weiteren regionalen Firmen unterstreichen die Bedeutung von Automation, Software und digitaler Fabrik.',
		publicSourceIds: ['its-owl', 'phoenix'],
		challenges: [
			'Ein Konfigurationsassistent für ein klar begrenztes Automatisierungsprodukt mit Regeln und Unsicherheiten.',
			'Ein Service-Workflow über freigegebene Fehlercodes, Handbücher und synthetische Maschinendaten.',
			'Ein Engineering-Change-Explorer für Abhängigkeiten, Dokumente und notwendige Tests.',
			'Ein interner API- und Bibliotheksnavigator für industrielle Softwareteams.',
			'Ein Angebots-zu-Konfiguration-Prototype für eine ausgewählte Produktfamilie.'
		],
		participants: 'Geeignet sind Software- und Entwicklungsleitung, Digital Factory, Service, Produktmanagement, Applikation und Toolchain-Verantwortliche aus einem konkreten Geschäftsbereich.',
		localAngle: 'Die räumliche Nähe vieler spezialisierter Unternehmen bietet zusätzlich Chancen für Cluster-Editionen und Partnerformate, sobald erste betriebliche Events belastbare Belege liefern.',
		sources: [
			{ id: 'its-owl', label: 'Technologie-Netzwerk it’s OWL', publisher: 'it’s OWL Clustermanagement GmbH', url: 'https://www.its-owl.de/' },
			{ id: 'phoenix', label: 'Digital Factory', publisher: 'Phoenix Contact', url: 'https://www.phoenixcontact.com/de-de/industrien/digital-factory/produktivitaet-steigern-digitale-fabrik' }
		],
		relatedSlugs: ['ki-hackathon-sensorik-automatisierung', 'hackathon-maschinenbau-automatisierung', 'ki-hackathon-industrie']
	}),
	regionPage({
		slug: 'ki-hackathon-nuernberg-franken', title: 'Nürnberg denkt in Systemen.',
		seoTitle: 'KI-Hackathon in Nürnberg und Franken für Unternehmen', footerLabel: 'Hightech Nürnberg & Franken', icon: 'Cpu',
		description: 'KI-Hackathon in Nürnberg und Franken für Software, Automation und Industrie: aus Systemwissen und realen Challenges Prototypen bauen.',
		dek: 'Enterprise Software, Automation und Industrie funktionieren in Systemen. Die Region kann genau dieses Denken in agentische Produkte und Arbeitsweisen übersetzen.',
		region: 'Nürnberg und Franken',
		strength: 'Enterprise- und Business-Software, Automation, Elektronik, industrielle Fertigung, Forschung und eine breite technische Dienstleistungslandschaft',
		thesis: 'Die Metropolregion muss KI nicht als fremde Consumer-Technologie behandeln. Ihre Unternehmen beherrschen komplexe Regeln, langlebige Systeme und industrielle Schnittstellen. Das sind ideale Ausgangspunkte für Agenten, die nicht nur Text erzeugen, sondern in überprüfbaren Workflows arbeiten.',
		publicContext: 'Die Europäische Metropolregion Nürnberg und die Wirtschaftsförderung Nürnberg beschreiben eine vielfältige Wirtschafts- und Forschungslandschaft. DATEV veröffentlicht zugleich konkrete Forschung zu KI in Softwareentwicklung und Qualität.',
		publicSourceIds: ['metropolregion', 'datev'],
		challenges: [
			'Ein Regel- oder Prozessnavigator für Business-Software mit Quellen und Gültigkeitsstand.',
			'Ein Testgenerierungs-Workflow für einen abgegrenzten Legacy-Bereich.',
			'Ein Inbetriebnahme- oder Konfigurationsassistent auf Basis freigegebener technischer Unterlagen.',
			'Ein Supportfall-zu-Reproduktion-Prototyp für Software- oder Industrieprodukte.',
			'Ein Developer-Onboarding-Flow für komplexe Repositories, APIs und interne Werkzeuge.'
		],
		participants: 'Ein starker Build Day kombiniert Software Engineering, Product, Fachlichkeit, Qualität, Support und bei industriellen Fällen Automatisierungs- oder Servicekompetenz.',
		localAngle: 'Der Fokus liegt auf einem Unternehmen oder Geschäftsbereich; regionale Netzwerke können später als Multiplikatoren für Erfahrungsaustausch und weitere Events dienen.',
		sources: [
			{ id: 'metropolregion', label: 'Europäische Metropolregion Nürnberg', publisher: 'Metropolregion Nürnberg', url: 'https://www.metropolregionnuernberg.de/' },
			{ id: 'datev', label: 'Mit KI Qualität und Effizienz in der Softwareentwicklung steigern', publisher: 'DATEV', url: 'https://www.datev.de/web/de/berufsgruppenuebergreifend/presse/presseinformationen/meldungen-2025/mit-ki-qualitaet-und-effizienz-in-der-softwareentwicklung-steigern' }
		],
		relatedSlugs: ['ki-hackathon-steuersoftware', 'hackathon-softwareunternehmen', 'legacy-modernisierung-coding-agents']
	}),
	regionPage({
		slug: 'ki-hackathon-ruhrgebiet', title: 'Das Ruhrgebiet hat die nächste Schicht.',
		seoTitle: 'KI-Hackathon im Ruhrgebiet für Industrie und Mittelstand', footerLabel: 'Hightech Ruhrgebiet', icon: 'Pickaxe',
		description: 'KI-Hackathon im Ruhrgebiet für Industrie und Mittelstand: Transformation, Service, Energie und digitale Plattformen praktisch beschleunigen.',
		dek: 'Strukturwandel ist hier kein Zukunftswort. Das Ruhrgebiet weiß, wie Arbeit, Industrie und Technologie sich neu erfinden müssen.',
		region: 'Das Ruhrgebiet',
		strength: 'Industrie, Energie, Logistik, technische Services, Hochschulen und digitale Unternehmen in einer eng verbundenen Metropole',
		thesis: 'Die nächste Schicht im Ruhrgebiet ist nicht die Ablösung von Industrie durch Software. Sie ist die Verbindung beider Welten: Domänenwissen aus Anlagen, Netzen, Logistik und Service wird mit agentischen Werkzeugen schneller zugänglich und in neue Abläufe übersetzt.',
		publicContext: 'Business Metropole Ruhr positioniert die Region als Wirtschafts- und Innovationsraum; der ruhrHUB vernetzt digitale Akteure. Öffentliche Profile regionaler Industrieunternehmen zeigen zusätzlich die Breite von Sensorik bis Energie und Logistik.',
		publicSourceIds: ['business-ruhr', 'ruhrhub'],
		challenges: [
			'Ein Service-Copilot über freigegebene Anlagenunterlagen, Fehlerbilder und sichere Diagnosepfade.',
			'Ein Logistik-Exception-Workflow, der simulierte Ereignisse priorisiert und nächste Owner findet.',
			'Ein Wissensnavigator für technische Richtlinien, Schichtübergaben oder Instandhaltung.',
			'Ein Engineering-Prototype für Testgenerierung, Legacy-Verständnis oder Schnittstellenmodernisierung.',
			'Ein Energie- oder Nachhaltigkeits-Cockpit mit synthetischen Messwerten und nachvollziehbaren Annahmen.'
		],
		participants: 'Je nach Challenge arbeiten Betrieb, Instandhaltung, Service, Engineering, IT, Product und Transformation gemeinsam; ein konkreter Bereich bleibt verantwortlich.',
		localAngle: 'Die polyzentrische Region eignet sich für Events direkt in Unternehmen und später für gemeinsame Formate mit Industrie- und Digitalnetzwerken.',
		sources: [
			{ id: 'business-ruhr', label: 'Wirtschaftsmetropole Ruhr', publisher: 'Business Metropole Ruhr', url: 'https://www.business.ruhr/' },
			{ id: 'ruhrhub', label: 'Digital Innovation Hub', publisher: 'ruhrHUB', url: 'https://ruhrhub.de/' }
		],
		relatedSlugs: ['ki-hackathon-industrie', 'ki-hackathon-intralogistik', 'ki-hackathon-sensorik-automatisierung']
	})
];
