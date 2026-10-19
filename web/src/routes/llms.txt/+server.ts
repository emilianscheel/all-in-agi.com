import { localizedPath, type Locale } from '$lib/i18n';
import type { RequestHandler } from './$types';

function absolute(locale: Locale, internalPath: string) {
	return `https://all-in-agi.com${localizedPath(locale, internalPath)}`;
}

export const _llmsContent = {
	de: (locale: Locale) => `# ALL IN AGI

> ALL IN AGI organisiert moderierte Agentic Engineering Hackathons für Unternehmen – vor Ort in Deutschland oder online. Gemischte Teams aus Engineering, Product und Fachbereichen bauen mit aktuellen AI Coding Agents und Developer Tools einen funktionierenden Prototyp.

## Wer wir sind

- Marke / Anbieter: ALL IN AGI (all-in-agi.com).
- Fokus: praktische AI-Adoption im Engineering durch facilitated Hackathons – nicht nur Vorträge, sondern gemeinsames Bauen.
- Zielgruppe: etablierte Unternehmen in Deutschland und international (auch Softwareunternehmen, Industrie, Logistik/Handel, Banken/Versicherungen, Maschinenbau).

## Standardangebot

- Formatname: Agentic Engineering Hackathon.
- Dauer: ein ganzer Tag vor Ort, üblicherweise 09:00–17:00 Uhr.
- Direkt buchbare Größen: bis 15, 30 oder 50 Personen.
- Individuelle Formate: bis zu 200 Personen; mehrtägig, international, hybrid oder online auf Anfrage.
- Sprache: Deutsch oder Englisch.
- Ort: vor Ort in den Räumen des Kunden (Deutschland); Online/Hybrid möglich.

## Tagesablauf (Standard)

- 09:00 Kickoff – Live Demo, Tool Stack, Teams und Challenges.
- 09:30 Build Sprint – von Problem und User Flow zum ersten Working Prototype.
- 13:00 Pizza / Lunch – gemeinsames Essen, Feedback, Start des zweiten Build Sprints.
- 16:30 Demo Session – Problem, Lösung, Nutzung und wie es gebaut wurde.
- Danach: Follow-up nach dem Event.

## Preise (netto, Standardformate)

- Bis 15 Personen: 4.000 € netto.
- Bis 30 Personen: 5.000 € netto (häufigstes Paket).
- Bis 50 Personen: 6.000 € netto.
- Individuelle Formate („Was Sie brauchen“): Preis auf Anfrage über Kontakt oder Vorbereitungsgespräch.
- Preise gelten für das Standard-Tagesformat mit den unten genannten Leistungen; Sonderformate werden individuell kalkuliert.

## Im Preis enthalten (Standard)

- Zwei Facilitators.
- Challenge Design (auf Skill Levels und Use Cases zugeschnitten).
- Demo Session und Follow-up.
- Pizza und Cookies / Verpflegung am Tag.
- Winner Poster.
- Event-Fotos.
- Anreise der Facilitators innerhalb Deutschlands.
- Präsentationstechnik kann mitgebracht werden, falls kein großer Screen vorhanden ist.

## Tools und Technik

- Vorhandener Coding-/AI-Tool-Stack des Kunden kann eingebunden werden.
- Alternativ stellen wir nach Absprache passende Coding Agents / Developer Tools für den Tag bereit.
- Konkreter Einsatz wird im 30-minütigen Vorbereitungsgespräch geklärt.
- IT, Security und Datenschutz: Tools, Zugänge, zulässige Datenklassen und Arbeitsumgebung werden vorab mit den zuständigen Teams geklärt; gebaut wird nur in der vereinbarten Umgebung.

## Teilnehmende und Skills

- Nicht alle müssen coden können.
- Challenges werden für unterschiedliche Skill Levels designed, damit Engineering, Product und Fachbereiche gemeinsam bauen und lernen.
- Benötigt vor Ort: geeigneter Raum, stabiles WLAN, Arbeitsgeräte, motivierte Builder.

## Custom / erweiterte Optionen (Beispiele)

- Mehrtägige Formate, bis zu 200 Personen, Matchmaking-Plattform, individueller Zeitplan.
- Keynotes, Online, Hybrid, Vor Ort.
- Internationale Formate; Deutsch oder Englisch.
- Siegerposter / Siegerpokal, Pitch-Vorbereitung, Pitch- & Voting-System.
- Kollaboratives Whiteboard, Screen-Recording-Upload.
- IT- & Security-Abstimmung, eigene oder bereitgestellte Tools.

## Buchung und Vorbereitung

- Jede Anfrage enthält ein 30-minütiges Vorbereitungsgespräch (Use Cases, Teamzusammensetzung, Tool Stack, Rahmenbedingungen).
- Termin über den Konfigurator anfragen: [Hackathon planen](${absolute(locale, '/buchen')}).
- Eigene Ideen und besondere Anforderungen sind willkommen; das Standardformat wird an Use Cases angepasst.
- Unverbindlicher Kontakt auch direkt per E-Mail oder Telefon.

## Häufige Fragen (vollständig)

- Was ist ein Agentic Engineering Hackathon? Ein moderiertes, praktisches Format vor Ort: Teams aus Engineering, Product und Fachbereichen entwickeln an einem Tag einen funktionierenden Prototyp mit aktuellen AI Coding Agents und Developer Tools.
- Müssen alle Teilnehmenden coden können? Nein. Challenges werden auf unterschiedliche Skill Levels zugeschnitten.
- Für welche Teamgrößen? Direkt buchbar bis 15/30/50; individuell bis 200 Personen mit mehreren parallelen Build-Teams.
- Wie läuft der Tag ab? Kickoff mit Demo und Challenge-Setup, zwei Build Sprints, gemeinsamer Lunch, abschließende Demo Session.
- Welche Tools? Vorhandener Stack oder bereitgestellte Tools nach Absprache; Klärung im Vorbereitungsgespräch.
- IT/Security/Datenschutz? Vorab Abstimmung; Bau nur in der vereinbarten Umgebung.
- Was braucht ihr vor Ort? Raum, WLAN, Geräte, motivierte Builder; Präsentationstechnik optional von uns.
- Was ist im Preis enthalten? Zwei Facilitators, Challenge Design, Demo, Follow-up, Pizza & Cookies, Winner Poster, Event-Fotos, Anreise DE; ab 4.000 € netto (15 Personen), 5.000 € (30), 6.000 € (50).
- Vorbereitung und Buchung? 30-Minuten-Call, danach Anfrage über den Konfigurator.
- Eigene Idee / Sonderanforderungen? Ja – Standardformat wird angepasst; Kontakt aufnehmen.

## Kontakt und rechtliches

- E-Mail: go@all-in-agi.com
- Telefon: +49 152 57257750 (Anzeige oft 0152 57257750)
- [Startseite](${absolute(locale, '/')})
- [Hackathon planen](${absolute(locale, '/buchen')})
- [AGB](${absolute(locale, '/agb')})
- [Datenschutz](${absolute(locale, '/datenschutz')})
- [Teilnehmer-Datenschutz](${absolute(locale, '/teilnehmer-datenschutz')})
- [Impressum](${absolute(locale, '/impressum')})
`,
	en: (locale: Locale) => `# ALL IN AGI

> ALL IN AGI runs facilitated agentic engineering hackathons for companies—on site in Germany or online. Mixed teams from engineering, product, and business functions use current AI coding agents and developer tools to build a working prototype.

## Who we are

- Brand / provider: ALL IN AGI (all-in-agi.com).
- Focus: practical AI adoption in engineering through facilitated hackathons—hands-on building, not talks alone.
- Audience: established companies in Germany and internationally (software companies, industry, logistics/retail, banking/insurance, mechanical engineering, and more).

## Standard offering

- Format name: Agentic Engineering Hackathon.
- Duration: one full day on site, typically 09:00–17:00.
- Directly bookable sizes: up to 15, 30, or 50 participants.
- Custom formats: up to 200 people; multi-day, international, hybrid, or online on request.
- Language: German or English.
- Location: on site at the customer’s premises (Germany); online/hybrid available.

## Day schedule (standard)

- 09:00 Kickoff — live demo, tool stack, teams, and challenges.
- 09:30 Build sprint — from problem and user flow to a first working prototype.
- 13:00 Pizza / lunch — shared meal, feedback, and the second build sprint.
- 16:30 Demo session — problem, solution, how it is used, and how it was built.
- Afterward: follow-up after the event.

## Pricing (net, standard formats)

- Up to 15 people: €4,000 net.
- Up to 30 people: €5,000 net (most popular).
- Up to 50 people: €6,000 net.
- Custom (“whatever you need”): priced on request via contact or the preparation call.
- Prices cover the standard day format with the inclusions below; custom formats are quoted individually.

## Included (standard)

- Two facilitators.
- Challenge design tailored to skill levels and use cases.
- Demo session and follow-up.
- Pizza and cookies / day catering.
- Winner poster.
- Event photography.
- Facilitator travel within Germany.
- Presentation equipment can be provided if a large display is unavailable.

## Tools and technology

- The customer’s existing coding / AI tool stack can be integrated.
- Or we provide suitable coding agents / developer tools by prior agreement.
- Exact setup is confirmed in the 30-minute preparation call.
- IT, security, and privacy: tools, accounts, allowed data classes, and environment are agreed beforehand; teams build only inside the approved setup.

## Participants and skills

- Not everyone needs to know how to code.
- Challenges are designed for mixed skill levels so engineering, product, and domain experts can build and learn together.
- On site you need: a suitable room, stable Wi-Fi, work devices, and motivated builders.

## Custom / extended options (examples)

- Multi-day formats, up to 200 participants, matchmaking platform, custom schedule.
- Keynotes, online, hybrid, on site.
- International formats; German or English.
- Winner posters / trophy, pitch prep, pitch and voting system.
- Collaborative whiteboard, screen-recording uploads.
- IT and security coordination; your tools or ours.

## Booking and preparation

- Every request includes a 30-minute preparation call (use cases, team composition, tool stack, constraints).
- Request a date via the configurator: [Plan a hackathon](${absolute(locale, '/buchen')}).
- Your own ideas and special requirements are welcome; the standard format adapts to your use cases.
- You can also contact us directly by email or phone with no obligation.

## FAQ (full)

- What is an Agentic Engineering Hackathon? A facilitated, hands-on day where teams from engineering, product, and business build a working prototype with current AI coding agents and developer tools.
- Does everyone need to code? No—challenges fit different skill levels.
- Team sizes? Standard up to 15/30/50; custom up to 200 with several parallel build teams.
- Day flow? Kickoff with demo and challenge setup, two build sprints, lunch, final demo session.
- Tools? Your approved stack or tools we provide by agreement; confirmed in the prep call.
- IT/security/privacy? Agreed in advance; build only in the approved environment.
- On site needs? Room, Wi-Fi, devices, motivated builders; we can bring presentation gear.
- What’s included? Two facilitators, challenge design, demo, follow-up, pizza & cookies, winner poster, event photos, travel in Germany; from €4,000 net (15), €5,000 (30), €6,000 (50).
- Prep and booking? 30-minute call, then request via the configurator.
- Custom ideas? Yes—the format adapts; get in touch.

## Contact and legal

- Email: go@all-in-agi.com
- Phone: +49 152 57257750 (often shown as 0152 57257750)
- [Homepage](${absolute(locale, '/')})
- [Plan a hackathon](${absolute(locale, '/buchen')})
- [Terms and Conditions](${absolute(locale, '/agb')})
- [Privacy](${absolute(locale, '/datenschutz')})
- [Participant privacy](${absolute(locale, '/teilnehmer-datenschutz')})
- [Legal notice](${absolute(locale, '/impressum')})
`
} as const;

export const GET: RequestHandler = ({ locals }) => {
	const locale = locals.locale ?? 'de';
	return new Response(_llmsContent[locale](locale), {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
			'content-language': locale === 'en' ? 'en-US' : 'de-DE',
			'cache-control': 'public, max-age=3600'
		}
	});
};
