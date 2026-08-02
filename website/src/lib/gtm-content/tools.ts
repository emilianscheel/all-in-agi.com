import type { EditorialPageContent } from '$lib/gtm-pages';
import { editorialPage, sourced } from './editorial-builders';

export const toolPages: EditorialPageContent[] = [
	editorialPage(
		{
			slug: 'codex-best-practices',
			group: 'Tools',
			title: 'Hör auf zu prompten.',
			seoTitle: 'Codex Best Practices für Engineering-Teams',
			footerLabel: 'Codex Best Practices',
			icon: 'Terminal',
			description:
				'Codex Best Practices für Engineering-Teams: mit gutem Repository-Kontext, klaren Grenzen, Tests und Review zu belastbaren Ergebnissen.',
			dek:
				'Der nächste magische Prompt wird Ihr Team nicht retten. Codex wird dann stark, wenn Ziel, Umgebung und Qualitätsmaßstab stark sind.',
			sources: [
				{ id: 'openai-best', label: 'Best practices', publisher: 'OpenAI', url: 'https://learn.chatgpt.com/guides/best-practices' },
				{ id: 'openai-use', label: 'How OpenAI uses Codex', publisher: 'OpenAI', url: 'https://openai.com/business/guides-and-resources/how-openai-uses-codex/' },
				{ id: 'openai-harness', label: 'Harness engineering: leveraging Codex in an agent-first world', publisher: 'OpenAI', url: 'https://openai.com/index/harness-engineering/' }
			],
			relatedSlugs: ['developer-experience-ai-tools', 'coding-agent-rollout-hackathon', 'coding-agent-tests-verifikation']
		},
		[
			{
				title: 'Die kurze Antwort',
				paragraphs: [
					sourced('Gute Codex-Arbeit beginnt nicht mit einer besonders cleveren Formulierung. Sie beginnt mit einem klaren Ziel, den relevanten Dateien, den technischen und organisatorischen Grenzen sowie einer überprüfbaren Definition von fertig. Genau diese vier Elemente nennt OpenAI als robusten Ausgangspunkt für anspruchsvollere Aufgaben in größeren Codebasen.', 'openai-best'),
					'Ein Prompt kann kurz sein, wenn das Repository bereits verständlich ist. Fehlen dagegen Build-Befehle, Architekturhinweise, Testdaten und klare Zuständigkeiten, muss der Agent raten. Das Problem ist dann nicht Sprachkunst, sondern ein Arbeitsumfeld, das weder Menschen noch Maschinen zuverlässig durchschauen.'
				]
			},
			{
				title: 'Kontext schlägt Prompt-Lyrik',
				paragraphs: [
					'Geben Sie Codex die kleinste vollständige Karte der Aufgabe: betroffene Komponente, gewünschtes Verhalten, bekannte Fehler, relevante Beispiele und Bereiche, die unverändert bleiben müssen. Verweisen Sie auf echte Dateien und Kommandos. Eine lange Geschichte ohne diese Anker erzeugt mehr Text, aber nicht mehr Orientierung.',
					sourced('Dauerhafte Regeln gehören in eine kurze, gepflegte AGENTS.md oder in eng zugeschnittene wiederverwendbare Workflows. OpenAI empfiehlt dort Repository-Struktur, Start-, Build- und Testbefehle, Konventionen, Verbote und die Definition von fertig festzuhalten. Je näher eine Regel an ihrem Geltungsbereich liegt, desto hilfreicher wird sie.', 'openai-best')
				]
			},
			{
				title: 'Der zuverlässige Agenten-Loop',
				paragraphs: [
					'Ein belastbarer Loop besteht aus Erkunden, Planen, Ändern, Prüfen und Review. Lassen Sie Codex zuerst die tatsächliche Implementierung und vorhandene Tests lesen. Bei komplexen Änderungen sollte der Plan offene Annahmen sichtbar machen. Erst danach folgt der Patch; anschließend laufen die engsten relevanten Tests und eine Diff-Prüfung.',
					sourced('OpenAI beschreibt Codex intern nicht nur als Codegenerator, sondern als Werkzeug für Aufgaben über den gesamten Entwicklungszyklus. Der entscheidende organisatorische Schritt besteht darin, Feedback-Loops, ausführbare Werkzeuge und überprüfbare Artefakte so bereitzustellen, dass ein Agent selbst erkennen kann, ob seine Arbeit trägt.', 'openai-use', 'openai-harness')
				],
				bullets: [
					'Ziel als beobachtbare Verhaltensänderung formulieren, nicht als Dateiliste.',
					'Relevante Architektur, Fehlermeldungen und Beispiele direkt verlinken.',
					'Explizit benennen, was nicht geändert oder veröffentlicht werden darf.',
					'Tests, Typecheck und Review als Teil der Aufgabe verlangen.',
					'Den finalen Diff gegen Ziel und Grenzen prüfen lassen.'
				]
			},
			{
				title: 'Was Teams systematisch lernen müssen',
				paragraphs: [
					'Einzelne Engineers finden schnell persönliche Tricks. Ein Unternehmen braucht jedoch gemeinsame Muster: Welche Aufgaben eignen sich? Welche Kontexte dürfen verwendet werden? Welche Kommandos sind sicher? Wann reicht ein Test und wann braucht es einen erfahrenen Reviewer? Diese Fragen lassen sich nicht durch eine zentrale Prompt-Sammlung beantworten.',
					'Gute Adoption misst deshalb nicht die Zahl der verschickten Prompts. Sie misst, ob Teams reale Änderungen schneller verstehen, sauber prüfen und verantwortungsvoll übernehmen können. Wiederkehrende Fehler werden in Repository-Regeln, Skills oder Tooling übersetzt. So wächst nicht nur die Agentenleistung, sondern auch die Qualität der Entwicklungsumgebung.'
				]
			},
			{
				title: 'Ein Build Day macht Best Practices sichtbar',
				paragraphs: [
					'In einem Agentic Engineering Hackathon arbeiten mehrere Teams gleichzeitig an begrenzten Aufgaben aus derselben Organisation. Dadurch wird innerhalb eines Tages sichtbar, welche Repositories agentenfreundlich sind, wo Kontext fehlt, welche Tests Vertrauen schaffen und welche Regeln im Alltag unklar bleiben.',
					'Das Ergebnis ist mehr als eine Demo. Es ist eine kleine Betriebsanleitung aus beobachteter Praxis: funktionierende Aufgabenmuster, konkrete Tool-Reibung, verbesserbare Qualitätschecks und interne Builder, die den Workflow weitertragen. Der beste Codex-Tipp ist am Ende kein Satz. Es ist ein System, das gute Arbeit erkennbar macht.',
					'Für den Einstieg genügt ein Repository, dessen Maintainer erreichbar sind, und eine Aufgabe, die heute wirklich Zeit kostet. Lassen Sie ein Team den vorhandenen Weg dokumentieren, einen Agenten-Workflow bauen und anschließend ehrlich vergleichen, wo Geschwindigkeit gewonnen und wo zusätzliche Prüfung notwendig wurde.',
					'Nach dem Tag sollten zwei Dinge in die normale Arbeit zurückfließen: mindestens eine konkrete Verbesserung der Entwicklungsumgebung und ein wiederverwendbares Aufgabenmuster. Dadurch wird Codex nicht zum Sonderprojekt der Innovationsabteilung, sondern zu einem überprüften Werkzeug innerhalb der bestehenden Engineering-Verantwortung.'
				]
			}
		]
	),
	editorialPage(
		{
			slug: 'claude-code-best-practices',
			group: 'Tools',
			title: 'CLAUDE.md ist kein Roman.',
			seoTitle: 'Claude Code Best Practices für Unternehmen',
			footerLabel: 'Claude Code Best Practices',
			icon: 'FileText',
			description:
				'Claude Code Best Practices für Unternehmen: knappe Projektregeln, kontrollierte Autonomie, gute Kontextpflege und überprüfbare Workflows.',
			dek:
				'Eine längere Anweisungsdatei ist nicht automatisch eine bessere. Entscheidend ist, ob Claude die richtigen Regeln im richtigen Moment anwenden kann.',
			sources: [
				{ id: 'anthropic-best', label: 'Claude Code: Best practices for agentic coding', publisher: 'Anthropic', url: 'https://www.anthropic.com/engineering/claude-code-best-practices' },
				{ id: 'anthropic-sandbox', label: 'Making Claude Code more secure and autonomous with sandboxing', publisher: 'Anthropic', url: 'https://www.anthropic.com/engineering/claude-code-sandboxing' },
				{ id: 'anthropic-practice', label: 'How Claude Code is used in practice', publisher: 'Anthropic', url: 'https://www.anthropic.com/research/claude-code-expertise' }
			],
			relatedSlugs: ['security-konformer-ki-hackathon', 'developer-experience-ai-tools', 'vibe-coding-im-unternehmen']
		},
		[
			{ title: 'Die kurze Antwort', paragraphs: [
				sourced('Claude Code profitiert von einer CLAUDE.md, die echte Arbeitsbedingungen beschreibt: wichtige Befehle, zentrale Dateien, Stilregeln, Testwege, Repository-Etikette und Besonderheiten der Entwicklungsumgebung. Anthropic empfiehlt diese Datei als automatisch geladenen Kontext, nicht als Ablage für jede denkbare Erklärung.', 'anthropic-best'),
				'Eine gute Regel ist kurz genug, um gelesen und konkret genug, um überprüft zu werden. „Schreibe sauberen Code“ hilft kaum. „Führe vor dem Abschluss den Paket-Test und den Typecheck aus; ändere keine generierten Dateien“ verändert Verhalten. Was nur für eine einzelne Aufgabe gilt, gehört in den Auftrag und nicht dauerhaft in die Projektdatei.'
			] },
			{ title: 'Kontext wird kuratiert, nicht gesammelt', paragraphs: [
				'Coding Agents können große Repositories durchsuchen. Das bedeutet nicht, dass sie jedes Dokument zu Beginn benötigen. Zu viel Kontext kann widersprüchliche Regeln, veraltete Annahmen und unnötige Nebenpfade in den Arbeitsraum ziehen. Teams sollten deshalb den stabilen Kern dokumentieren und Detailwissen dort lassen, wo es auffindbar und aktuell bleibt.',
				'Die beste CLAUDE.md erklärt, wie Claude selbst Wahrheit finden kann: welche Tests gelten, wo Architekturentscheidungen liegen, wie lokale Services gestartet werden und welche Quelle bei Konflikten Vorrang hat. Damit wird die Datei zum Wegweiser. Die eigentliche Expertise bleibt in Code, Tests, Schemas und gepflegter Dokumentation.'
			] },
			{ title: 'Autonomie braucht einen sicheren Arbeitsraum', paragraphs: [
				sourced('Anthropic beschreibt Dateisystem- und Netzwerkgrenzen als zwei zentrale Schutzschichten für autonomere Arbeit. Ein klarer Sandbox-Rahmen reduziert wiederholte Erlaubnisfragen, ohne dem Agenten pauschal Zugriff auf sensible Verzeichnisse oder beliebige externe Ziele zu geben.', 'anthropic-sandbox'),
				'Unternehmen sollten deshalb nicht zwischen vollständiger Blockade und grenzenlosem Zugriff wählen. Ein geeigneter Workflow definiert erlaubte Repositories, ungefährliche Kommandos, Netzwerkziele, Geheimniszugriff und Handlungen, die immer eine menschliche Freigabe benötigen. Innerhalb dieses Rahmens kann Claude flüssig arbeiten; außerhalb stoppt der Prozess bewusst.'
			], bullets: [
				'Kleine, überprüfbare Aufgaben mit eindeutigem Ziel wählen.',
				'CLAUDE.md auf dauerhafte Regeln und echte Befehle begrenzen.',
				'Erst erkunden und planen lassen, bevor mehrere Dateien geändert werden.',
				'Gefährliche oder externe Aktionen durch Berechtigungen begrenzen.',
				'Tests und Diff-Review als Abschlussbedingung festlegen.'
			] },
			{ title: 'Expertise entsteht im Dialog mit dem Ergebnis', paragraphs: [
				sourced('Anthropic hat Hunderttausende Claude-Code-Sitzungen untersucht, um Nutzungsmuster und den Aufbau interaktiver Agentic-Coding-Expertise zu verstehen. Für Unternehmen ist daran wichtig: Können entsteht nicht durch eine einmalige Feature-Schulung, sondern durch wiederholte Aufgaben, Feedback und Anpassung der Umgebung.', 'anthropic-practice'),
				'Erfahrene Nutzer erkennen früh, wann der Scope zu groß ist, wann zusätzliche Quellen fehlen und wann ein Ergebnis nur plausibel klingt. Dieses Urteil sollte im Team sichtbar werden. Gemeinsame Reviews, kurze Retrospektiven und dokumentierte Fehlversuche sind wertvoller als eine Sammlung vermeintlich perfekter Prompts.'
			] },
			{ title: 'Vom persönlichen Setup zur Team-Praxis', paragraphs: [
				'Ein Agentic Engineering Hackathon bringt diese Lernschleifen in einen gemeinsamen Raum. Teams arbeiten mit derselben freigegebenen Umgebung an unterschiedlichen echten Challenges und vergleichen am Demo Day nicht nur Oberflächen, sondern auch Kontext, Tests, Grenzen und verworfene Ansätze.',
				'Danach kann die Organisation ihre CLAUDE.md, Sandbox-Regeln und wiederverwendbaren Workflows aus realer Reibung verbessern. Das Ziel ist nicht, Claude mit immer mehr Text zu kontrollieren. Das Ziel ist eine Umgebung, in der Menschen und Agenten schneller zu überprüfbaren Ergebnissen kommen.',
				'Ein guter erster Bereich besitzt aktive Maintainer, ausführbare Tests und genug offene Arbeit, um verschiedene Aufgabentypen zu vergleichen. Vermeiden Sie den sensibelsten Kernprozess ebenso wie eine künstliche Demo ohne Bezug zum Alltag. Der mittlere, repräsentative Scope liefert die ehrlichsten Erkenntnisse.',
				'Im Follow-up werden nicht alle Experimente standardisiert. Das Team übernimmt nur Regeln, die ein beobachtetes Problem lösen, und dokumentiert, welche Berechtigungen oder Quellen vor einem breiteren Rollout fehlen. So bleibt die Projektdatei schlank und die Lernkurve des Unternehmens wächst trotzdem.'
			] }
		]
	),
	editorialPage(
		{
			slug: 'coding-agents-vergleich-unternehmen', group: 'Tools', title: 'Das beste Coding-Tool gibt es nicht.',
			seoTitle: 'Codex, Claude Code oder Cursor? Coding Agents im Vergleich', footerLabel: 'Coding Agents im Vergleich', icon: 'GitCompareArrows',
			description: 'Codex, Claude Code oder Cursor im Unternehmen vergleichen: anhand echter Aufgaben, Governance, Integration und überprüfbarer Ergebnisse.',
			dek: 'Eine allgemeine Bestenliste beantwortet die falsche Frage. Das beste Tool ist das, das in Ihrem System zuverlässig Wert erzeugt.',
			sources: [
				{ id: 'openai-codex', label: 'Codex', publisher: 'OpenAI', url: 'https://openai.com/codex/' },
				{ id: 'anthropic-best', label: 'Claude Code: Best practices for agentic coding', publisher: 'Anthropic', url: 'https://www.anthropic.com/engineering/claude-code-best-practices' },
				{ id: 'cursor-rules', label: 'Rules', publisher: 'Cursor', url: 'https://docs.cursor.com/context/rules' }
			],
			relatedSlugs: ['coding-agent-rollout-hackathon', 'security-konformer-ki-hackathon', 'codex-best-practices']
		},
		[
			{ title: 'Die kurze Antwort', paragraphs: [
				'Codex, Claude Code und Cursor können alle überzeugende Demos produzieren. Ein Unternehmen sollte daraus keine universelle Rangliste ableiten. Die relevante Entscheidung lautet: Welches Werkzeug löst unsere wiederkehrenden Aufgaben in der freigegebenen Umgebung mit vertretbarem Review-Aufwand?',
				'Bewerten Sie deshalb nicht nur die erste Codeausgabe. Messen Sie, wie das Tool ein unbekanntes Repository erkundet, Regeln berücksichtigt, Tests ausführt, mit Fehlern umgeht, Änderungen erklärt und sich in vorhandene Entwicklungsabläufe einfügt. Genau dort entstehen die Kosten oder die echte Beschleunigung.'
			] },
			{ title: 'Capabilities sind nur der Anfang', paragraphs: [
				sourced('OpenAI beschreibt Codex als Agenten für Aufgaben über den Softwarelebenszyklus hinweg. Anthropic positioniert Claude Code als flexibles, skriptbares Werkzeug, das Kontext selbst erschließt. Cursor verankert dauerhafte Projektanweisungen über Regeln im Editor-Kontext. Diese Produktphilosophien überschneiden sich, setzen aber unterschiedliche Schwerpunkte.', 'openai-codex', 'anthropic-best', 'cursor-rules'),
				'Für Teams zählt, ob diese Schwerpunkte zum Arbeitsmodell passen. Ein Terminal-zentriertes Platform-Team bewertet anders als ein Produktteam mit starkem Editor-Workflow. Eine regulierte Organisation gewichtet Datenpfade, Logging und Administration höher als ein kleines internes Prototyping-Team.'
			] },
			{ title: 'Die Scorecard für einen ehrlichen Vergleich', paragraphs: [
				'Ein belastbarer Vergleich verwendet dieselben drei bis fünf Aufgaben, dieselben Ausgangsdaten und dieselben Qualitätskriterien. Dazu gehören mindestens ein kleiner Feature-Change, eine Debugging-Aufgabe, eine Testverbesserung und ein Workflow mit Dokumentation oder externem Kontext. Die Aufgaben sollten repräsentativ, aber nicht produktionskritisch sein.',
				'Bewertet werden Ergebnisqualität, Zeit bis zum überprüfbaren Stand, notwendige menschliche Korrekturen, Kontextaufwand, Tool-Reibung und Einhaltung der Grenzen. Modellgefühl und persönliche Vorliebe dürfen anschließend diskutiert werden, ersetzen aber nicht die beobachteten Daten.'
			], bullets: [
				'Passt das Tool zu IDE, CLI, CI und Repository-Struktur?',
				'Kann es die relevanten Tests und internen Werkzeuge ausführen?',
				'Sind Datenwege, Berechtigungen und Protokollierung akzeptabel?',
				'Wie viel Review benötigt ein typisches Ergebnis?',
				'Können Teams erfolgreiche Muster wiederverwenden und teilen?'
			] },
			{ title: 'Warum ein Pilot mehr sagt als eine Demo', paragraphs: [
				'Herstellerdemos zeigen den optimalen Pfad. Ein interner Pilot zeigt die eigene Realität: monorepo-spezifische Befehle, Legacy-Abhängigkeiten, Proxy-Regeln, Dokumentationslücken und unterschiedliche Erfahrungsniveaus. Diese Reibung ist keine Störung des Tests, sondern sein wertvollstes Ergebnis.',
				'Vermeiden Sie dennoch einen künstlichen Wettbewerb um die spektakulärste Oberfläche. Das Ziel ist eine Tool- und Arbeitsentscheidung, nicht ein Siegerfoto. Manchmal ist ein Werkzeug für Produktentwicklung geeignet und ein anderes für isolierte Analysen. Ein Portfolio kann sinnvoller sein als ein erzwungener Standard.'
			] },
			{ title: 'Der Hackathon als Live-Evaluation', paragraphs: [
				'In einem moderierten Build Day arbeiten mehrere gemischte Teams mit freigegebenen Werkzeugen an realen Unternehmens-Challenges. Ein gemeinsames Challenge Canvas und dieselbe Demo-Definition machen Unterschiede sichtbar, ohne Produktionssysteme oder sensible Daten zu riskieren.',
				'Am Ende stehen Prototypen, eine ausgefüllte Scorecard und konkrete nächste Entscheidungen: welches Tool für welchen Bereich, welche Zugänge fehlen, welche Regeln müssen geschärft werden und wer führt die Adoption weiter. Das beste Tool wird nicht behauptet. Es wird im eigenen Kontext beobachtet.',
				'Wiederholen Sie die Evaluation nach wichtigen Änderungen an Modellen, Richtlinien oder Entwicklungsumgebung mit denselben Kernaufgaben. Eine einmalige Auswahl darf nicht zur ewigen Wahrheit werden. Gleichzeitig sollte das Unternehmen nicht jede Woche einem neuen Ranking folgen, sondern stabile Arbeitsdaten aufbauen.',
				'Für die Beschaffung ist diese Evidenz besonders nützlich: Statt abstrakter Feature-Listen erhält sie einen begründeten Bedarf nach Nutzergruppe, erforderlichen Kontrollen und erwartbarem Betriebsaufwand. Engineering gewinnt damit nicht automatisch sein Lieblingswerkzeug, aber eine deutlich bessere Entscheidungsgrundlage.'
			] }
		]
	),
	editorialPage(
		{
			slug: 'coding-agent-tests-verifikation', group: 'Tools', title: 'Der beste Prompt ist ein grüner Test.',
			seoTitle: 'Coding Agents mit Tests und Reviews zuverlässig einsetzen', footerLabel: 'Tests für Coding Agents', icon: 'TestTubeDiagonal',
			description: 'Coding Agents mit Tests, Typechecks und Review-Loops zuverlässig einsetzen: So wird aus plausibler Ausgabe überprüfbare Engineering-Arbeit.',
			dek: 'Plausibler Code ist kein Ergebnis. Erst ein ausführbarer Beweis macht aus Agenten-Ausgabe einen verantwortbaren Beitrag.',
			sources: [
				{ id: 'openai-best', label: 'Best practices', publisher: 'OpenAI', url: 'https://learn.chatgpt.com/guides/best-practices' },
				{ id: 'openai-harness', label: 'Harness engineering', publisher: 'OpenAI', url: 'https://openai.com/index/harness-engineering/' },
				{ id: 'nist-ssdf', label: 'Secure Software Development Framework', publisher: 'NIST', url: 'https://csrc.nist.gov/Projects/ssdf' }
			],
			relatedSlugs: ['codex-best-practices', 'legacy-modernisierung-coding-agents', 'security-konformer-ki-hackathon']
		},
		[
			{ title: 'Die kurze Antwort', paragraphs: [
				'Coding Agents sind besonders überzeugend, wenn ein Problem schnell lösbar aussieht. Genau dann entsteht die Gefahr, Lesbarkeit mit Korrektheit zu verwechseln. Ein grüner Test ist kein vollständiger Beweis, aber er zwingt die Aufgabe in eine Form, die Maschine und Mensch wiederholen können.',
				sourced('OpenAI empfiehlt, Änderungen nicht bei der Generierung enden zu lassen: relevante Tests, Linting, Typprüfung, Verhaltensabgleich und Diff-Review gehören in denselben Arbeitsauftrag. Verifikation ist damit kein nachgelagerter Qualitätsservice, sondern Teil des Agenten-Loops.', 'openai-best')
			] },
			{ title: 'Definieren Sie fertig vor dem Start', paragraphs: [
				'Ein Agent kann nur auf ein Ziel zulaufen, das beobachtbar ist. „Verbessere den Checkout“ lässt viele Interpretationen offen. „Die Rabattberechnung behandelt den leeren Warenkorb, alle vorhandenen Tests bleiben grün und ein neuer Regressionstest bildet den Fehler nach“ liefert eine prüfbare Grenze.',
				'Diese Definition sollte fachliche und technische Kriterien verbinden. Product beschreibt das gewünschte Verhalten, Engineering die Qualitätschecks, Security verbotene Datenwege oder Aktionen. Der Agent erhält dadurch nicht mehr Bürokratie, sondern weniger Raum für teure, plausibel klingende Annahmen.'
			] },
			{ title: 'Eine Leiter aus Beweisen', paragraphs: [
				'Beginnen Sie mit dem engsten Signal: reproduziert ein Test den Fehler? Danach folgen Komponenten- oder Integrationstests, Typecheck, Linting und gegebenenfalls ein manueller Nutzerfluss. Nicht jede Aufgabe braucht jede Stufe. Entscheidend ist, dass das Team bewusst festlegt, welcher Beweis für die Änderung angemessen ist.',
				sourced('Harness Engineering beschreibt eine agentenfreundliche Umgebung als System aus klarer Architektur, ausführbaren Werkzeugen und Feedback-Loops. Fehlen diese Rückmeldungen, bleibt der Agent auf Textwahrscheinlichkeit angewiesen. Gute Tests werden damit zu Infrastruktur für höhere Autonomie.', 'openai-harness')
			], bullets: [
				'Den Fehler zuerst reproduzierbar machen.',
				'Happy Path und relevante Grenzfälle abdecken.',
				'Generierte Tests gegen die Anforderung reviewen.',
				'Nicht nur Teststatus, sondern auch Diff und Logs prüfen.',
				'Fehlende Prüfbarkeit als Ergebnis dokumentieren.'
			] },
			{ title: 'Tests können ebenfalls falsch sein', paragraphs: [
				'Ein Agent kann einen Test so verändern, dass er grün wird, ohne das Problem zu lösen. Er kann Assertions abschwächen, Mocks überdehnen oder nur seine eigene Implementierung bestätigen. Deshalb sollte die Aufgabenbeschreibung schützenswerte Tests, gewünschte Beobachtungen und verbotene Abkürzungen benennen.',
				sourced('Sichere Softwareentwicklung bleibt auch mit Agenten ein Prozess aus Rollen, Prüfungen und nachvollziehbaren Artefakten. Der NIST Secure Software Development Framework liefert dafür einen herstellerneutralen Referenzrahmen; Coding Agents ändern die Geschwindigkeit einzelner Schritte, nicht die Verantwortung für den gesamten Prozess.', 'nist-ssdf')
			] },
			{ title: 'Ein Hackathon prüft die Prüfbarkeit', paragraphs: [
				'Bei einem Agentic Engineering Hackathon können Teams gezielt Challenges wählen, die unterschiedliche Qualitätswege benötigen: einen Legacy-Bug, eine neue interne Oberfläche, eine Dokumentationssuche und einen API-Workflow. Jede Demo zeigt nicht nur Funktion, sondern auch den Beweisweg.',
				'Das macht einen oft übersehenen Engpass sichtbar. Vielleicht ist der Agent schnell, aber die Testumgebung langsam. Vielleicht fehlen realistische Fixtures oder lokale Startbefehle. Solche Erkenntnisse sind unmittelbar verwertbar. Der grüne Test ist dann nicht die Ziellinie, sondern der erste gemeinsame Qualitätsstandard.',
				'Beginnen Sie nach dem Event mit den Engpässen, die mehrere Teams getroffen haben. Ein fehlender Seed-Befehl, unzuverlässige Fixtures oder ein zehnminütiger Typecheck sind klassische Verbesserungen, von denen menschliche und agentische Arbeit gleichermaßen profitiert. Verifikation wird so zum Produktivitätsprojekt.',
				'Erst wenn diese Basis stabil ist, lohnt sich mehr Autonomie. Ein Agent, der selbstständig viele Änderungen erzeugt, aber kein schnelles und glaubwürdiges Feedback erhält, skaliert Unsicherheit. Ein Agent mit engem Scope und guter Beweiskette kann dagegen schrittweise größere Verantwortung übernehmen.'
			] }
		]
	),
	editorialPage(
		{
			slug: 'vibe-coding-im-unternehmen', group: 'Tools', title: 'Vibe Coding skaliert nicht.',
			seoTitle: 'Vibe Coding im Unternehmen: Vom Experiment zum Engineering', footerLabel: 'Vibe Coding im Unternehmen', icon: 'Workflow',
			description: 'Vibe Coding im Unternehmen verantwortungsvoll nutzen: persönliche Geschwindigkeit in gemeinsame Engineering-Praxis und sichere Adoption übersetzen.',
			dek: 'Der schnelle persönliche Prototyp ist wertvoll. Zum Unternehmensprozess wird er erst durch Ownership, Standards und überprüfbare Übergaben.',
			sources: [
				{ id: 'openai-harness', label: 'Harness engineering', publisher: 'OpenAI', url: 'https://openai.com/index/harness-engineering/' },
				{ id: 'anthropic-practice', label: 'How Claude Code is used in practice', publisher: 'Anthropic', url: 'https://www.anthropic.com/research/claude-code-expertise' },
				{ id: 'dora', label: 'DORA research program', publisher: 'Google Cloud', url: 'https://dora.dev/research/' }
			],
			relatedSlugs: ['coding-agent-rollout-hackathon', 'interne-ai-champions', 'coding-agents-vergleich-unternehmen']
		},
		[
			{ title: 'Die kurze Antwort', paragraphs: [
				'Vibe Coding senkt die Distanz zwischen Idee und laufendem Prototype. Das ist ein echter Fortschritt. Es skaliert jedoch nicht automatisch von einer Person zu einem Produktteam, weil Unternehmen nicht nur Code benötigen, sondern nachvollziehbare Entscheidungen, Wartbarkeit, Sicherheit und jemanden, der das Ergebnis besitzt.',
				'Die falsche Reaktion wäre, spontane Experimente zu verbieten. Die bessere Reaktion ist eine klare Übergabegrenze: Bis hierhin darf schnell ausprobiert werden; ab hier gelten Repository, Review, Tests, Datenregeln und Produktverantwortung. Geschwindigkeit bleibt erhalten, ohne die Folgekosten unsichtbar zu machen.'
			] },
			{ title: 'Der Prototype ist nicht das Produkt', paragraphs: [
				'Ein Prototype beantwortet eine Frage: Kann dieser Nutzerfluss funktionieren? Er muss nicht skalieren, jede Ausnahme behandeln oder in die Zielarchitektur passen. Ein Produkt beantwortet zusätzliche Fragen zu Betrieb, Zugriff, Support, Datenschutz, Monitoring und langfristiger Änderung. Wer beide Stufen verwechselt, verkauft Lernfortschritt als Produktionsreife.',
				'Gerade Coding Agents machen diese Verwechslung leicht, weil sie in kurzer Zeit viel sichtbare Oberfläche erzeugen. Teams sollten deshalb jede Demo mit bekannten Grenzen, simulierten Komponenten, verwendeten Daten und einem verantwortlichen nächsten Schritt präsentieren. Ehrlichkeit macht den Prototype stärker, nicht schwächer.'
			] },
			{ title: 'Was tatsächlich skaliert', paragraphs: [
				sourced('OpenAI beschreibt den Übergang zu agentenorientierter Entwicklung als Arbeit an Umgebungen, Spezifikationen und Feedback-Loops. Nicht die Menge erzeugten Codes ist der zentrale Hebel, sondern die Fähigkeit des Systems, Agenten zu führen und Ergebnisse zuverlässig zu prüfen.', 'openai-harness'),
				sourced('Auch Nutzungsforschung zu Claude Code betrachtet Agentic Coding als interaktive Praxis, in der Menschen Aufgaben schneiden, Rückmeldungen geben und das Ergebnis steuern. Daraus folgt für Unternehmen: Skalierbar sind wiederholbare Arbeitsmuster, nicht die individuelle Begeisterung einer einzelnen Person.', 'anthropic-practice')
			], bullets: [
				'Ein klarer Prototype-Scope mit Nutzer und Testfrage.',
				'Gemeinsame Regeln für Code, Daten und externe Dienste.',
				'Review durch Personen mit Domänen- und Systemwissen.',
				'Ausführbare Checks statt rein visueller Akzeptanz.',
				'Ein benannter Owner für jeden weitergeführten Ansatz.'
			] },
			{ title: 'Produktivität ohne Qualitätsblindheit', paragraphs: [
				sourced('DORA untersucht Software Delivery seit Jahren als Zusammenspiel von Geschwindigkeit, Stabilität und organisatorischen Bedingungen. Coding Agents ändern Werkzeuge und Takt, aber nicht die Notwendigkeit, Lieferfähigkeit zusammen mit Qualität und Erholung von Fehlern zu betrachten.', 'dora'),
				'Ein gutes Rollout-Dashboard zählt deshalb nicht nur aktive Lizenzen oder generierte Zeilen. Es betrachtet Durchlaufzeit für geeignete Aufgaben, Review-Aufwand, Fehlerbilder, wiederverwendete Workflows und die Zahl der Prototypen mit echtem nächsten Eigentümer. Nur so wird aus Aktivität belastbare Capability.'
			] },
			{ title: 'Der Build Day als sichere Beschleunigung', paragraphs: [
				'Ein Hackathon schafft bewusst einen Raum für hohe Geschwindigkeit. Die Teams dürfen Ideen eng schneiden, synthetische Daten nutzen und mutige Prototypen bauen. Gleichzeitig sind Umgebung, Challenge Owner, Demo-Kriterien und Grenzen vorab festgelegt. Das verbindet die Energie des Vibe Codings mit der Disziplin guter Produktarbeit.',
				'Am Ende wird nicht behauptet, zwanzig Experimente seien produktionsreif. Das Unternehmen sieht, welche Workflows funktionieren, welche Builder andere befähigen können und welche Ideen einen nächsten Engineering-Sprint verdienen. Vibe Coding skaliert nicht. Eine lernende Organisation kann es.',
				'Diese Organisation schafft bewusst zwei Geschwindigkeiten: einen geschützten Raum für schnelle Exploration und einen klaren Übergang in verantwortete Produktentwicklung. Builder wissen dadurch, wann sie frei ausprobieren dürfen und welche Belege sie liefern müssen, sobald andere Menschen oder Systeme vom Ergebnis abhängen.',
				'Der wichtigste Skalierungseffekt ist kulturell. Teams lernen, unfertige Ideen früher zu zeigen, Fehler nicht zu verstecken und gute Agenten-Workflows gemeinsam zu verbessern. Das erhält die Energie des Experimentierens, ohne Wartbarkeit und Verantwortung als Problem der späteren Kolleginnen und Kollegen abzuladen.'
			] }
		]
	)
];
