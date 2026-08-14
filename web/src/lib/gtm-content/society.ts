import type { EditorialPageContent } from '$lib/gtm-pages';
import { editorialPage, sourced } from './editorial-builders';

export const societyPages: EditorialPageContent[] = [
	editorialPage(
		{
			slug: 'wird-ki-uns-ersetzen', group: 'Gesellschaft', title: 'KI ersetzt uns nicht.',
			seoTitle: 'Wird KI uns ersetzen? Warum Arbeit sich verändert', footerLabel: 'Wird KI uns ersetzen?', icon: 'UserRoundCheck',
			description: 'Wird KI uns ersetzen? Eine nüchterne These über Aufgaben, Verantwortung, Fachkräftemangel und die Arbeit in KI-gestützten Unternehmen.',
			dek: 'Nein, Menschen verschwinden nicht aus der Arbeit. Aber Aufgaben, Karrierewege und die Verteilung von Verantwortung verändern sich tiefgreifend.',
			sources: [
				{ id: 'ifo', label: 'Erste Unternehmen sehen KI als Alternative zu Qualifikation und Berufserfahrung', publisher: 'ifo Institut', url: 'https://www.ifo.de/fakten/2026-06-12/erste-unternehmen-sehen-kuenstliche-intelligenz-als-alternative-zu-qualifikation' },
				{ id: 'bitkom-chief', label: '3 von 10 sagen: KI könnte meinen Chef ersetzen', publisher: 'Bitkom', url: 'https://www.bitkom.org/Presse/Presseinformation/3-von-10-sagen-KI-koennte-Chef-ersetzen' },
				{ id: 'oecd', label: 'AI and the labour market', publisher: 'OECD', url: 'https://www.oecd.org/en/topics/sub-issues/ai-and-the-labour-market.html' }
			],
			relatedSlugs: ['ki-produktivitaet-ohne-stellenabbau', 'interne-ai-champions', 'ki-fuer-den-mittelstand']
		},
		[
			{ title: 'Die These in drei Sätzen', paragraphs: [
				'KI ersetzt nicht „den Menschen“ als geschlossene Einheit. Sie übernimmt Teile von Recherche, Übersetzung, Analyse, Dokumentation und Softwarearbeit und verändert dadurch, wie viele Personen eine Organisation für bestimmte Ergebnisse benötigt. Gleichzeitig wächst der Wert derjenigen, die Probleme auswählen, Kontext liefern, Ergebnisse prüfen und Verantwortung übernehmen.',
				'Das ist kein bequemes „Alles bleibt wie es ist“. Einzelne Stellen können verschwinden, Einstiegsaufgaben können knapper werden und Lohnmacht kann sich verschieben. Die produktive Frage lautet deshalb nicht, ob KI uns ersetzt, sondern wer die neue Arbeit gestaltet und wer nur auf die Folgen reagiert.'
			] },
			{ title: 'Berufe bestehen aus Aufgaben', paragraphs: [
				sourced('Die OECD betrachtet die Wirkung von KI auf dem Arbeitsmarkt über Aufgaben, Exposition, Fähigkeiten und Arbeitsplatzqualität. Dieser Blick ist nützlicher als eine Liste vermeintlich sicherer oder verlorener Berufe: Innerhalb derselben Rolle können einige Tätigkeiten automatisierbar und andere wichtiger werden.', 'oecd'),
				'Eine Service-Mitarbeiterin kann Fallinformationen schneller zusammentragen und mehr Zeit für schwierige Kundensituationen gewinnen. Ein Engineer kann Boilerplate delegieren, muss aber Architektur, Tests und Betrieb stärker beherrschen. Eine Fachperson kann Regeln als Prototyp ausdrücken, bleibt jedoch für Ausnahmen und Folgen verantwortlich.'
			] },
			{ title: 'Der Arbeitsmarkt wird trotzdem ungemütlich', paragraphs: [
				sourced('Eine ifo-Umfrage von 2026 zeigt, dass Unternehmen bei bestimmten Qualifikations- und Erfahrungskomponenten bereits Ersetzbarkeit durch KI sehen. Zugleich hält mehr als die Hälfte der KI-einsetzenden Unternehmen den Ersatz akademischer Arbeitskraft durch KI-unterstützte, geringer qualifizierte Beschäftigte für schwer oder unmöglich. Das Bild ist widersprüchlich, nicht apokalyptisch.', 'ifo'),
				'Widersprüchlichkeit schützt niemanden automatisch. Wenn Routineaufgaben schneller werden, verändern sich Teamgrößen, Erwartungen und Einstiegswege. Unternehmen müssen neue Lernpfade schaffen, damit Nachwuchs nicht genau die Aufgaben verliert, an denen früher Urteilskraft entstand. Beschäftigte brauchen Zugang zu Werkzeugen und Praxis, nicht nur abstrakte Appelle zur Weiterbildung.'
			] },
			{ title: 'Verantwortung wird wertvoller', paragraphs: [
				sourced('Bitkom verbindet die Debatte über ersetzbare Führung mit dem deutschen Fachkräftemangel und fordert gezielte Qualifizierung sowie Transparenz darüber, welche Aufgaben sich verändern. Das verweist auf einen Kernpunkt: KI kann Vorschläge erzeugen, aber Organisationen müssen Verantwortung weiterhin zurechnen.', 'bitkom-chief'),
				'Je leichter Inhalte, Code und Analysen produziert werden, desto knapper werden gute Auswahl und glaubwürdige Freigabe. Wer darf eine Entscheidung treffen? Welche Quelle trägt? Welche Nebenwirkung akzeptiert das Unternehmen? Diese Fragen sind keine Restarbeit für Menschen. Sie werden zum Zentrum einer produktiven Arbeitsteilung mit Agenten.'
			], bullets: [
				'Nicht Rollen, sondern konkrete Aufgaben und Entscheidungen kartieren.',
				'Automatisierte Geschwindigkeit mit Review und Ownership verbinden.',
				'Junioren an Problemverständnis und Verifikation beteiligen.',
				'Produktivitätsgewinne sichtbar in Capability investieren.',
				'Beschäftigte früh praktisch statt erst nach dem Rollout einbinden.'
			] },
			{ title: 'Bauen nimmt der Debatte die Abstraktion', paragraphs: [
				'In einem internen Hackathon erleben Mitarbeitende an realen, begrenzten Challenges, was ein Agent heute tatsächlich übernimmt und wo Fachwissen unverzichtbar bleibt. Das ist ehrlicher als eine Keynote über ferne Superintelligenz und hilfreicher als ein Tool-Rollout ohne gemeinsame Erfahrung.',
				'Der Demo Day zeigt nicht nur Möglichkeiten. Er zeigt Fehler, fehlenden Kontext, neue Rollen und sinnvolle Kontrollpunkte. So entsteht eine handlungsfähige Position: KI ersetzt uns nicht als Gesellschaft. Aber Unternehmen und Menschen, die mit ihr bauen lernen, werden Arbeit anders verteilen als jene, die nur über sie reden.',
				'Führung sollte diese Erfahrung mit einer offenen Frage verbinden: Welche Arbeit wollen wir durch den Gewinn besser machen? Wenn die Antwort nur „dieselbe Leistung mit weniger Menschen“ lautet, bleibt ein großer Teil des Potenzials ungenutzt und die Akzeptanz sinkt. Qualität, Innovation und bessere Dienste sind ebenso legitime Ziele.',
				'Für Beschäftigte ist praktische Beteiligung kein Wohlfühlprogramm. Wer den Workflow mitgestaltet, kann Risiken früher benennen, neues Urteil entwickeln und die künftige Rolle beeinflussen. Das garantiert keine unveränderte Stelle. Es ist aber deutlich stärker als die Hoffnung, Technologie werde an der eigenen Abteilung vorbeiziehen.'
			] }
		]
	),
	editorialPage(
		{
			slug: 'san-francisco-lebt-in-der-zukunft', group: 'Gesellschaft', title: 'San Francisco lebt schon 2028.',
			seoTitle: 'San Francisco und die KI-Zukunft: Was Deutschland lernen kann', footerLabel: 'San Francisco lebt 2028', icon: 'Clock3',
			description: 'Was deutsche Unternehmen von San Franciscos KI-Ökosystem lernen können: Geschwindigkeit, Talentdichte, Praxis und schnellere Feedback-Loops.',
			dek: 'Die Bay Area besitzt keine Zeitmaschine. Sie verkürzt nur den Weg zwischen Idee, Werkzeug, Nutzerfeedback und der nächsten Version radikal.',
			sources: [
				{ id: 'stanford-index', label: 'AI Index Report', publisher: 'Stanford Institute for Human-Centered AI', url: 'https://hai.stanford.edu/ai-index' },
				{ id: 'sf-ai', label: 'Generative AI guidelines', publisher: 'City and County of San Francisco', url: 'https://www.sf.gov/resource--2023--generative-ai-guidelines' },
				{ id: 'startup-genome', label: 'Silicon Valley ecosystem', publisher: 'Startup Genome', url: 'https://startupgenome.com/ecosystems/silicon-valley' }
			],
			relatedSlugs: ['deutschland-hat-ein-umsetzungsproblem', 'europas-chance-mit-ki', 'ai-innovation-day']
		},
		[
			{ title: 'Die These in drei Sätzen', paragraphs: [
				'San Francisco wirkt wie Zukunft, weil neue Modelle, Produkte und Arbeitsweisen dort nicht nur angekündigt, sondern sofort in dichten sozialen und wirtschaftlichen Netzwerken ausprobiert werden. Ein Gespräch am Morgen kann am Nachmittag zu einem Prototype und wenige Tage später zu echtem Nutzerfeedback führen. Der Vorsprung entsteht aus komprimierten Lernschleifen.',
				'Deutschland muss diese Stadt weder kopieren noch romantisieren. Hohe Kosten, soziale Spannungen und technologische Monokultur gehören ebenfalls zur Realität. Lernen sollten wir den kulturellen Standard, unfertige Dinge früh zu testen und Erkenntnisse schneller in die nächste Handlung zu übersetzen.'
			] },
			{ title: 'Dichte verändert die Geschwindigkeit', paragraphs: [
				sourced('Der Stanford AI Index dokumentiert jährlich die globale Entwicklung von Forschung, Investitionen, Anwendung und gesellschaftlichen Folgen künstlicher Intelligenz. Die Bay Area profitiert dabei von einer außergewöhnlichen Nähe zwischen Spitzenforschung, Kapital, Infrastruktur, erfahrenen Gründern und frühen Unternehmenskunden.', 'stanford-index'),
				'Diese Dichte erzeugt zufällige Kollisionen: ein Engineer kennt jemanden aus einem Modelllabor, eine Produktperson trifft einen Pilotkunden, ein Investor kann technische Annahmen einordnen. Digitale Kommunikation ersetzt diese Nähe nicht vollständig. Sie kann aber die Lektion übertragen: Bringen Sie Entscheidung, Domänenwissen und Umsetzung in denselben Raum.'
			] },
			{ title: 'Die Zukunft ist ein Arbeitsmodus', paragraphs: [
				'In der Bay Area ist ein neues Werkzeug selten zuerst ein Schulungsthema. Es wird an einer Aufgabe getestet. Der Prototype darf scheitern, solange die Lernschleife kurz bleibt. Deutsche Organisationen behandeln neue Technologien dagegen oft zunächst als Strategie-, Beschaffungs- oder Governance-Objekt und verschieben die praktische Erfahrung ans Ende.',
				sourced('Auch die Stadt San Francisco veröffentlicht Leitlinien für den verantwortungsvollen Einsatz generativer KI. Das widerlegt die einfache Gegenüberstellung von amerikanischer Geschwindigkeit und europäischer Kontrolle: Schnelle Adoption braucht Regeln, aber Regeln können parallel zur konkreten Anwendung entstehen.', 'sf-ai')
			] },
			{ title: 'Was Deutschland nicht kopieren sollte', paragraphs: [
				sourced('Ökosystem-Rankings beschreiben Silicon Valley weiterhin als weltweit außergewöhnlichen Startup-Standort. Ein Ranking ist jedoch keine Blaupause für jedes Unternehmen. Deutsche Stärke liegt nicht in der maximalen Zahl ähnlicher Startups, sondern in tiefem Branchenwissen, langfristigen Kundenbeziehungen und komplexen physischen Systemen.', 'startup-genome'),
				'Der falsche Import wäre eine Sprache aus Hype, Moonshots und künstlicher Dringlichkeit. Der richtige Import ist eine höhere Taktzahl überprüfbarer Versuche. Ein Maschinenbauer muss nicht wie ein Consumer-Startup auftreten. Er kann aber eine Service-Challenge in einem Tag prototypisieren statt sechs Monate über eine allgemeine KI-Roadmap zu diskutieren.'
			], bullets: [
				'Entscheider, Nutzer und Builder früh zusammenbringen.',
				'Kleine Prototypen als Lerninstrument legitimieren.',
				'Governance an konkreten Datenflüssen entwickeln.',
				'Erkenntnisse innerhalb von Tagen statt Quartalen weitergeben.',
				'Deutsche Domänenstärke mit höherer Umsetzungsgeschwindigkeit verbinden.'
			] },
			{ title: 'Ein Tag Zeitverschiebung', paragraphs: [
				'Ein Agentic Engineering Hackathon simuliert nicht San Francisco. Er importiert eine nützliche Eigenschaft des Ökosystems: hohe Dichte für einen begrenzten Zeitraum. Engineering, Product, Fachbereich, aktuelle Tools und ein entscheidungsfähiger Sponsor treffen auf vorbereitete Challenges und einen festen Demo-Termin.',
				'Nach acht Stunden ist nicht die Zukunft fertig. Aber das Team hat seine eigene Gegenwart beschleunigt: Annahmen wurden sichtbar, Prototypen laufen, Builder kennen die Werkzeuge und nächste Eigentümer sind benannt. Zukunft fühlt sich oft nicht wie Science-Fiction an. Sie fühlt sich wie eine kürzere Feedback-Schleife an.',
				'Der Transfer gelingt, wenn der Tag keine amerikanische Kulisse imitiert. Deutsche Teams sollten ihre strengsten realen Bedingungen mitbringen: vorhandene IT, Sicherheitsregeln, komplexe Produkte und kritische Fachpersonen. Gerade unter diesen Grenzen zeigt sich, ob die neue Geschwindigkeit mehr als eine Demo trägt.',
				'Ein Unternehmen kann diese Dichte regelmäßig wiederholen: monatliche Build Days, offene Demo-Slots und kurze Retrospektiven zu Tooling und Governance. Damit wird Zukunft nicht zu einer Reise, von der Führungskräfte begeistert zurückkehren. Sie wird zu einer lokalen Arbeitsroutine.'
			] }
		]
	),
	editorialPage(
		{
			slug: 'deutschland-hat-ein-umsetzungsproblem', group: 'Gesellschaft', title: 'Deutschland hat kein Erkenntnisproblem.',
			seoTitle: 'KI in Deutschland: Vom Wissen ins Bauen', footerLabel: 'Deutschlands Umsetzungsproblem', icon: 'Flag',
			description: 'Deutschland kennt die Bedeutung von KI. Der Engpass liegt zwischen Strategie, Freigabe und praktischer Anwendung in realen Unternehmen.',
			dek: 'Wir brauchen nicht noch eine Erklärung, warum KI wichtig ist. Wir brauchen mehr Teams, die unter realen Bedingungen belastbare Dinge bauen.',
			sources: [
				{ id: 'celonis', label: 'The enterprise AI reality check', publisher: 'Celonis', url: 'https://www.celonis.com/de/news/press/the-enterprise-ai-reality-check-high-ambitions-meet-operational-barriers' },
				{ id: 'bitkom-study', label: 'Künstliche Intelligenz in Deutschland 2026', publisher: 'Bitkom', url: 'https://www.bitkom.org/sites/main/files/2026-06/bitkom-studienbericht-ki-bevoelkerung.pdf' },
				{ id: 'mittelstand-digital', label: 'Mittelstand-Digital', publisher: 'Bundesministerium für Wirtschaft und Energie', url: 'https://www.mittelstand-digital.de/' }
			],
			relatedSlugs: ['ki-strategie-working-prototype', 'ki-adoption-engineering', 'ki-fuer-den-mittelstand']
		},
		[
			{ title: 'Die These in drei Sätzen', paragraphs: [
				'Deutsche Führungskräfte wissen, dass KI wichtig ist. Unternehmen kaufen Lizenzen, gründen Programme und formulieren Leitlinien. Trotzdem bleibt zwischen offizieller Ambition und dem Arbeitsalltag vieler Teams eine Lücke, weil konkrete Aufgaben, sichere Umgebungen und gemeinsame Praxis fehlen.',
				'Das ist kein Wissensdefizit, sondern ein Koordinationsproblem. Security wartet auf einen belastbaren Use Case, der Fachbereich auf technische Kapazität und Engineering auf klare Priorität. Wer diesen Kreis mit einem kleinen, sichtbaren Pilot durchbricht, lernt mehr als durch die nächste allgemeine Strategiepräsentation.'
			] },
			{ title: 'Ambition ist reichlich vorhanden', paragraphs: [
				sourced('Celonis berichtete 2026 von hohen Ambitionen auf dem Weg zum „agentic enterprise“, während die tatsächliche Nutzung in DACH deutlich zurücklag. Fehlende Expertise wurde als zentrales Hindernis genannt. Solche Zahlen messen nicht jedes Unternehmen exakt, zeigen aber den strukturellen Abstand zwischen Wollen und Können.', 'celonis'),
				'Eine Lizenz löst diesen Abstand nicht. Mitarbeitende müssen Aufgaben schneiden, Datenklassen verstehen, Ergebnisse prüfen und aus einem Prototype eine Weiterführungsentscheidung ableiten. Das sind praktische Organisationsfähigkeiten. Sie entstehen nur begrenzt in Selbstlernmodulen, weil sie Zusammenarbeit und reale Systeme betreffen.'
			] },
			{ title: 'Vorsicht ist nicht das Problem', paragraphs: [
				sourced('Die öffentliche Debatte zeigt zugleich hohe Erwartungen und Vorbehalte gegenüber KI. Bitkom dokumentiert Einstellungen von Erwerbstätigen und Bevölkerung; die Spannbreite reicht von Produktivitätsoptimismus bis zur Sorge um Kontrolle und Arbeitsplatz. Unternehmen müssen beide Seiten ernst nehmen.', 'bitkom-study'),
				'Deutsche Governance kann ein Wettbewerbsvorteil sein, wenn sie schnell konkret wird. Ein erlaubter Modellzugang, definierte Datenklassen, synthetische Testdaten und menschliche Freigabepunkte geben Teams Handlungssicherheit. Problematisch wird Vorsicht erst, wenn Regeln abstrakt bleiben und dadurch weder Risiko noch Nutzen praktisch geprüft werden.'
			] },
			{ title: 'Transfer braucht einen Ort', paragraphs: [
				sourced('Programme wie Mittelstand-Digital zeigen, dass Wissenstransfer und praxisnahe Unterstützung politisch längst als Schlüssel für kleine und mittlere Unternehmen erkannt sind. Der nächste Schritt ist, allgemeines Wissen in eigene Workflows, Repositories und Produkte zu übersetzen.', 'mittelstand-digital'),
				'Ein Transferformat braucht Fachpersonen, Builder, echte Beispiele und einen Termin, an dem eine Entscheidung sichtbar wird. Ohne diesen Ort bleibt KI entweder Sache einzelner Enthusiasten oder ein Programm des zentralen Transformationsteams. Beides reicht nicht, um eine breite interne Fähigkeit aufzubauen.'
			], bullets: [
				'Einen Bereich statt das ganze Unternehmen aktivieren.',
				'Drei bis acht echte, begrenzte Challenges vorbereiten.',
				'Freigegebene Tools und Daten vor dem Start testen.',
				'Den Sponsor zum Demo Day in die Verantwortung nehmen.',
				'Jeden weiterführbaren Prototype einem Owner zuordnen.'
			] },
			{ title: 'Vom Reden ins Bauen', paragraphs: [
				'Ein eintägiger Hackathon ist keine KI-Transformation. Genau darin liegt seine Stärke. Er ist klein genug, um gekauft, vorbereitet und verantwortet zu werden, aber groß genug, um mehrere Teams gleichzeitig aus der Zuschauerrolle zu holen. Das Ergebnis ist beobachtete Evidenz statt weiterer Grundsatzpositionen.',
				'Deutschland muss nicht erst überzeugt werden. Es muss häufiger die Distanz zwischen einer Entscheidung und dem ersten belastbaren Prototype verkürzen. Wer zwanzig solcher Lernräume in echten Unternehmen schafft, verändert mehr als jemand, der die zwanzigste Studie über die Bedeutung von KI veröffentlicht.',
				'Nach dem ersten Tag zählt die organisatorische Reaktion. Werden Zugangsprobleme beseitigt? Bekommt ein starker Prototype einen Owner und einen kleinen Folgesprint? Dürfen interne Builder ihre Muster teilen? Ohne diese Entscheidungen wird auch der beste Event zum isolierten Beweis, dass das Unternehmen theoretisch schneller sein könnte.',
				'Umsetzung ist deshalb keine Eigenschaft einzelner besonders motivierter Mitarbeitender. Sie ist ein Führungssystem aus Priorität, Freiraum, Grenzen und Anschluss. Der Hackathon kann dieses System nicht ersetzen, aber er macht innerhalb eines Tages sichtbar, wo es bereits funktioniert und wo es blockiert.'
			] }
		]
	),
	editorialPage(
		{
			slug: 'ki-produktivitaet-ohne-stellenabbau', group: 'Gesellschaft', title: 'Produktivität ist kein Stellenabbau.',
			seoTitle: 'KI und Produktivität: Mehr schaffen statt nur Stellen abbauen', footerLabel: 'Produktivität ohne Stellenabbau', icon: 'BriefcaseBusiness',
			description: 'KI-Produktivität muss nicht primär Stellenabbau bedeuten. Unternehmen können gewonnene Kapazität in Qualität, Innovation und Wachstum investieren.',
			dek: 'Wer jede gesparte Stunde sofort aus dem Unternehmen entfernt, spart vielleicht Kosten und verliert gleichzeitig seine Zukunftskapazität.',
			sources: [
				{ id: 'oecd-productivity', label: 'Artificial intelligence and productivity', publisher: 'OECD', url: 'https://www.oecd.org/en/topics/sub-issues/artificial-intelligence-and-productivity.html' },
				{ id: 'ifo', label: 'Erste Unternehmen sehen KI als Alternative zu Qualifikation und Berufserfahrung', publisher: 'ifo Institut', url: 'https://www.ifo.de/fakten/2026-06-12/erste-unternehmen-sehen-kuenstliche-intelligenz-als-alternative-zu-qualifikation' },
				{ id: 'bitkom-chief', label: '3 von 10 sagen: KI könnte meinen Chef ersetzen', publisher: 'Bitkom', url: 'https://www.bitkom.org/Presse/Presseinformation/3-von-10-sagen-KI-koennte-Chef-ersetzen' }
			],
			relatedSlugs: ['wird-ki-uns-ersetzen', 'ki-adoption-engineering', 'interne-ai-champions']
		},
		[
			{ title: 'Die These in drei Sätzen', paragraphs: [
				'Produktivität beschreibt, wie viel Wert mit vorhandenen Ressourcen entsteht. Sie schreibt nicht vor, ob ein Unternehmen die gewonnene Zeit in niedrigere Kosten, höhere Qualität, neue Produkte oder bessere Kundenbetreuung investiert. Stellenabbau ist eine Managemententscheidung, kein Naturgesetz der Technologie.',
				'Das bedeutet nicht, dass es keine Verdrängung geben wird. In einigen Bereichen sinkt der Bedarf an bestimmten Tätigkeiten. Aber gerade der deutsche Mittelstand mit Fachkräftemangel und langem Innovationsstau hat eine zweite Option: dieselben Teams können mehr liegengebliebene Verbesserung, Dokumentation, Modernisierung und Produktideen umsetzen.'
			] },
			{ title: 'Die gesparte Stunde braucht ein Ziel', paragraphs: [
				sourced('Die OECD untersucht KI-Produktivität als Zusammenspiel aus Technologie, ergänzenden Investitionen, Fähigkeiten und organisatorischer Veränderung. Ein Tool allein erzeugt keinen stabilen Produktivitätssprung; Unternehmen müssen Prozesse und Kompetenzen so verändern, dass gewonnene Kapazität tatsächlich wirksam wird.', 'oecd-productivity'),
				'Ohne Ziel füllt sich freie Zeit mit mehr Output derselben Art: mehr Tickets, mehr Folien, mehr Code, mehr Kommunikation. Das kann lokale Kennzahlen verbessern und dennoch keine neue Kundenwirkung erzeugen. Führung sollte deshalb vor einem Rollout entscheiden, welche Engpässe mit zusätzlicher Kapazität gelöst werden sollen.'
			] },
			{ title: 'Vier Alternativen zum reinen Kostenschnitt', paragraphs: [
				'Erstens kann Qualität steigen: mehr Tests, bessere Dokumentation, schnellere Fehleranalyse. Zweitens kann Innovation zurückkehren: Ideen, die im Backlog nie Priorität erhielten, werden prototypisch geprüft. Drittens kann Service persönlicher werden, weil Routinevorbereitung schneller geht. Viertens kann Wissen zugänglicher werden, ohne erfahrene Personen zu jedem Standardfall zu unterbrechen.',
				'Diese Optionen sind nicht automatisch sozial oder wirtschaftlich besser. Sie müssen gemessen und verantwortet werden. Ein Unternehmen kann beispielsweise festlegen, dass ein Teil nachgewiesener Zeitgewinne in Modernisierung und Lernen fließt. So wird Produktivität zu einer Investitionsquelle statt nur zu einer Kürzungslogik.'
			], bullets: [
				'Qualitätsarbeit erledigen, die bisher ständig verschoben wurde.',
				'Kleine Produktideen schneller am Nutzer testen.',
				'Wissenszugang und Onboarding verbessern.',
				'Fachkräfte von repetitiver Vorbereitung entlasten.',
				'Mitarbeitende an der Verteilung des Gewinns beteiligen.'
			] },
			{ title: 'Die Verteilungsfrage bleibt real', paragraphs: [
				sourced('ifo zeigt, dass Unternehmen bereits über Ersetzbarkeit von Qualifikation und Erfahrung durch KI nachdenken. Bitkom weist gleichzeitig auf demografisch bedingten Arbeitskräftemangel und die Notwendigkeit gezielter Qualifizierung hin. Beide Entwicklungen können gleichzeitig wahr sein.', 'ifo', 'bitkom-chief'),
				'Wenn Organisationen nur reduzieren, tragen Beschäftigte das Anpassungsrisiko, während Eigentümer den Produktivitätsgewinn erhalten. Wenn sie befähigen und wachsen, können neue Aufgaben und bessere Leistungen entstehen. Politik und Mitbestimmung setzen Rahmen; die konkrete Verteilung entscheidet sich jedoch auch in jeder Abteilung und jedem Rollout.'
			] },
			{ title: 'Prototypen machen den Gewinn konkret', paragraphs: [
				'Ein Agentic Engineering Hackathon kann vor einer großen Produktivitätsbehauptung zeigen, wo Zeit tatsächlich gewonnen wird. Teams bauen an realen Workflows, dokumentieren bisherigen Aufwand, Tool-Reibung und Qualitätsgrenzen und benennen, was sie mit der frei werdenden Kapazität tun würden.',
				'Dadurch wird aus „KI macht uns effizienter“ eine überprüfbare Entscheidung. Vielleicht spart ein Assistent Recherche, während Review gleich aufwendig bleibt. Vielleicht öffnet ein schneller Prototype einen neuen Service. Produktivität ist dann nicht weniger Mensch. Sie ist mehr bewusst gestaltete Möglichkeit.',
				'Eine gute Nachmessung fragt vier Wochen später nicht nur, ob das Tool weiter benutzt wird. Sie fragt, welche Aufgabe schneller oder besser geworden ist, wohin die gewonnene Zeit floss und ob Qualitäts- oder Belastungsprobleme entstanden. Erst diese Verteilung macht die wirtschaftliche und menschliche Wirkung sichtbar.',
				'Unternehmen sollten solche Ergebnisse mit Teams und Mitbestimmung besprechen, bevor Effizienzannahmen zu Personalplänen werden. Transparenz nimmt schwierigen Entscheidungen nicht ihre Härte. Sie verhindert aber, dass eine Technologie als scheinbar objektive Begründung für Ziele dient, die das Management selbst gewählt hat.'
			] }
		]
	),
	editorialPage(
		{
			slug: 'europas-chance-mit-ki', group: 'Gesellschaft', title: 'Europa muss nicht das größte Modell bauen.',
			seoTitle: 'Europas KI-Chance: Industrie, Anwendung und Umsetzung', footerLabel: 'Europas KI-Chance', icon: 'Globe',
			description: 'Europas KI-Chance liegt nicht nur in größeren Modellen, sondern in Industrie, Domänenwissen, vertrauenswürdiger Anwendung und schneller Umsetzung.',
			dek: 'Das Basismodell ist wichtig. Europas unverwechselbarer Hebel liegt jedoch dort, wo Maschinen, Regeln, Software und erfahrene Menschen zusammenarbeiten.',
			sources: [
				{ id: 'eu-ai', label: 'AI Continent Action Plan', publisher: 'European Commission', url: 'https://digital-strategy.ec.europa.eu/en/policies/ai-continent-action-plan' },
				{ id: 'eu-apply', label: 'Apply AI Strategy', publisher: 'European Commission', url: 'https://digital-strategy.ec.europa.eu/en/policies/apply-ai' },
				{ id: 'eib', label: 'Artificial intelligence', publisher: 'European Investment Bank', url: 'https://www.eib.org/en/projects/sectors/innovation-digital-and-human-capital/artificial-intelligence' }
			],
			relatedSlugs: ['ki-fuer-den-mittelstand', 'deutschland-hat-ein-umsetzungsproblem', 'ki-hackathon-industrie']
		},
		[
			{ title: 'Die These in drei Sätzen', paragraphs: [
				'Europa braucht leistungsfähige Modelle, Rechenkapazität und Forschung. Es wird seinen wirtschaftlichen Wert aber nicht allein daran messen können, ob ein europäisches System an der Spitze einer globalen Bestenliste steht. Entscheidend ist, ob Unternehmen KI in Produkte, Fabriken, Infrastrukturen und professionelle Arbeit übersetzen.',
				'Hier besitzt Europa einen schwer kopierbaren Bestand: Domänenwissen, industrielle Kundenbeziehungen, qualifizierte Fachkräfte, technische Standards und komplexe reale Systeme. Dieser Bestand wird nur dann zum Vorteil, wenn die Organisationen schneller experimentieren und aus Prototypen produktive Fähigkeiten entwickeln.'
			] },
			{ title: 'Infrastruktur bleibt notwendig', paragraphs: [
				sourced('Der AI Continent Action Plan der Europäischen Kommission adressiert Recheninfrastruktur, Daten, Talente und die Entwicklung leistungsfähiger KI. Diese Grundlagen sind strategisch: Wer ausschließlich fremde Infrastruktur nutzt, akzeptiert Abhängigkeiten bei Preis, Verfügbarkeit und Gestaltungsmacht.', 'eu-ai'),
				'Infrastruktur ist jedoch kein Endprodukt. Ein Rechenzentrum verbessert noch keinen Serviceprozess, und ein Basismodell modernisiert keine Maschine. Zwischen technischer Fähigkeit und wirtschaftlicher Wirkung liegt Anwendungsarbeit: Daten verstehen, Nutzer einbeziehen, Schnittstellen bauen, Risiken begrenzen und das Ergebnis in einen Betrieb überführen.'
			] },
			{ title: 'Anwendung ist keine zweite Liga', paragraphs: [
				sourced('Mit der Apply AI Strategy richtet die Europäische Kommission den Blick ausdrücklich auf Einführung und sektorale Anwendung. Das ist mehr als nachgelagerte Verwertung. In Branchen wie Fertigung, Mobilität, Gesundheit oder Energie entstehen Anforderungen, Daten und Feedback, die wiederum bessere Technologien ermöglichen.', 'eu-apply'),
				'Europäische Unternehmen sollten sich deshalb nicht als bloße Kunden ausländischer KI verstehen. Wer einen schwierigen industriellen Workflow sicher löst, besitzt Produktwissen, Integrationsfähigkeit und Zugang zu Nutzern. Diese Assets können international wertvoller sein als ein weiteres allgemeines Interface auf demselben Modell.'
			] },
			{ title: 'Vertrauen muss ausführbar werden', paragraphs: [
				'Europa spricht viel über vertrauenswürdige KI. Der Begriff gewinnt erst Bedeutung, wenn ein konkreter Workflow Quellen zeigt, Unsicherheit behandelt, Zugriff begrenzt und einen Menschen an der richtigen Stelle entscheiden lässt. Vertrauen entsteht nicht aus einer Präambel, sondern aus beobachtbarem Systemverhalten.',
				sourced('Die Europäische Investitionsbank betrachtet KI als Teil von Innovation, Digitalisierung und Humankapital. Diese Verbindung ist zentral: Kapital für Technologie wirkt besser, wenn gleichzeitig Fähigkeiten, Prozesse und Organisationen investitionsfähig werden.', 'eib')
			], bullets: [
				'Industrie- und Fachwissen als Produktbestandteil behandeln.',
				'Offene und souveräne Infrastruktur dort stärken, wo sie kritisch ist.',
				'Reale sektorale Challenges schneller prototypisieren.',
				'Governance direkt in Nutzerfluss und Architektur übersetzen.',
				'Erfolgreiche Anwendungen über Unternehmen und Grenzen skalieren.'
			] },
			{ title: 'Europa braucht mehr Builder', paragraphs: [
				'Ein Agentic Engineering Hackathon ist klein im Verhältnis zur europäischen Strategie. Er adressiert aber die entscheidende Mikroebene: Menschen aus Engineering, Product und Fachbereich bauen gemeinsam einen funktionierenden Ablauf in der erlaubten Umgebung. Aus allgemeiner Technologie wird lokale Handlungskompetenz.',
				'Zwanzig Hackathons machen Europa nicht zum KI-Kontinent. Sie können jedoch zwanzig Organisationen zeigen, dass ihre Stärke nicht im Warten auf das perfekte Modell liegt. Europas Chance beginnt, wenn sein Domänenwissen schneller ausführbar wird.',
				'Die besten Ergebnisse sollten danach nicht in lokalen Präsentationen verschwinden. Unternehmen können technische Muster, Sicherheitsprinzipien und anonymisierte Lernerfahrungen über Verbände, Cluster und Partner verbreiten, während proprietäres Wissen geschützt bleibt. So wächst ein Anwendungsökosystem aus Belegen statt aus Behauptungen.',
				'Europa braucht dabei Ambition ohne Größenillusion. Es darf bei Infrastruktur und Modellen nicht abhängig werden, muss aber zugleich anerkennen, dass Weltmarktwert häufig in einer sehr spezifischen Anwendung entsteht. Wer diese Anwendungen schnell baut und verantwortungsvoll betreibt, gestaltet auch die nächste Technologiegeneration mit.'
			] }
		]
	)
];
