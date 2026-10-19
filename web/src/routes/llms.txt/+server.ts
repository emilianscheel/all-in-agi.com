import { localizedPath, type Locale } from '$lib/i18n';
import type { RequestHandler } from './$types';

function absolute(locale: Locale, internalPath: string) {
	return `https://all-in-agi.com${localizedPath(locale, internalPath)}`;
}

export const _llmsContent = {
	de: (locale: Locale) => `# ALL IN AGI

> ALL IN AGI organisiert moderierte Agentic Engineering Hackathons für Unternehmen – vor Ort in Deutschland oder online. Gemischte Teams aus Engineering, Product und Fachbereichen bauen mit aktuellen AI Coding Agents einen funktionierenden Prototyp.

## Angebot

- Standardformat: ein Tag vor Ort, üblicherweise 09:00–17:00 Uhr, für bis zu 15, 30 oder 50 Personen.
- Tagesablauf: Kickoff mit Demo und Challenge-Setup, zwei Build Sprints, gemeinsamer Lunch, abschließende Demo Session.
- Enthalten: zwei Facilitators, Challenge Design, Demo Session, Follow-up, Pizza und Cookies, Winner Poster, Event-Fotos sowie Anreise innerhalb Deutschlands.
- Nettopreise starten bei 4.000 € für bis zu 15 Personen; 30- und 50-Personen-Formate sind über den Konfigurator buchbar.
- Individuelle Formate: bis zu 200 Personen, mehrtägig, international, hybrid oder online – auf Anfrage.
- Coding Tools: vorhandener Tool Stack kann eingebunden werden, oder passende Tools werden nach Absprache für den Tag bereitgestellt.
- Skill Levels: Challenges sind für unterschiedliche Kenntnisse zugeschnitten; nicht alle Teilnehmenden müssen coden können.
- IT, Security und Datenschutz: Tools, Zugänge, Datenklassen und Arbeitsumgebung werden vorab mit den zuständigen Teams geklärt; gebaut wird nur in der vereinbarten Umgebung.
- Vor Ort nötig: geeigneter Raum, stabiles WLAN, Arbeitsgeräte und motivierte Builder. Präsentationstechnik kann mitgebracht werden, falls kein großer Screen vorhanden ist.

## Buchung und Vorbereitung

- Zu jeder Buchung gehört ein 30-minütiges Vorbereitungsgespräch (Use Cases, Team, Tool Stack, Rahmenbedingungen).
- Termine werden über den Konfigurator angefragt: [Hackathon planen](${absolute(locale, '/buchen')}).
- Eigene Ideen und besondere Anforderungen sind willkommen; das Standardformat wird an Use Cases angepasst.

## Häufige Fragen (Kurzfassung)

- Was ist ein Agentic Engineering Hackathon? Moderiertes, praktisches Format: Teams entwickeln an einem Tag einen funktionierenden Prototyp mit AI Coding Agents.
- Müssen alle coden können? Nein – Challenges passen zu unterschiedlichen Skill Levels.
- Teamgrößen? Direkt buchbar bis 15/30/50; individuell bis 200 Personen.
- Was ist im Preis enthalten? Zwei Facilitators, Challenge Design, Demo, Follow-up, Verpflegung, Winner Poster, Event-Fotos, Anreise DE; ab 4.000 € netto (15 Personen).

## Kontakt und rechtliches

- Kontakt: go@all-in-agi.com, +49 152 57257750
- [Startseite](${absolute(locale, '/')})
- [Hackathon planen](${absolute(locale, '/buchen')})
- [AGB](${absolute(locale, '/agb')})
- [Datenschutz](${absolute(locale, '/datenschutz')})
- [Impressum](${absolute(locale, '/impressum')})
`,
	en: (locale: Locale) => `# ALL IN AGI

> ALL IN AGI runs facilitated agentic engineering hackathons for companies—on site in Germany or online. Mixed teams from engineering, product, and business functions use current AI coding agents to build a working prototype.

## Offering

- Standard format: one on-site day, typically 09:00–17:00, for up to 15, 30, or 50 participants.
- Day flow: kickoff with demo and challenge setup, two build sprints, lunch, and a final demo session.
- Included: two facilitators, challenge design, demo session, follow-up, pizza and cookies, a winner poster, event photography, and travel within Germany.
- Net prices start at €4,000 for up to 15 people; 30- and 50-person formats are available via the configurator.
- Custom formats: up to 200 people, multi-day, international, hybrid, or online—on request.
- Coding tools: use your approved stack, or we provide suitable tools by prior agreement.
- Skill levels: challenges fit mixed abilities; not everyone needs to code.
- IT, security, and privacy: tools, accounts, data classes, and environment are agreed beforehand; teams build only inside the approved setup.
- On site: a suitable room, stable Wi-Fi, work devices, and motivated builders. Presentation equipment can be provided if a large display is unavailable.

## Booking and preparation

- Every request includes a 30-minute preparation call (use cases, team, tool stack, constraints).
- Request a date via the configurator: [Plan a hackathon](${absolute(locale, '/buchen')}).
- Your own ideas and special requirements are welcome; the standard format adapts to your use cases.

## FAQ (summary)

- What is an Agentic Engineering Hackathon? A facilitated, hands-on day where teams build a working prototype with AI coding agents.
- Does everyone need to code? No—challenges are designed for different skill levels.
- Team sizes? Standard up to 15/30/50; custom up to 200 people.
- What’s included? Two facilitators, challenge design, demo, follow-up, food, winner poster, event photos, travel in Germany; from €4,000 net (15 people).

## Contact and legal

- Contact: go@all-in-agi.com, +49 152 57257750
- [Homepage](${absolute(locale, '/')})
- [Plan a hackathon](${absolute(locale, '/buchen')})
- [Terms and Conditions](${absolute(locale, '/agb')})
- [Privacy](${absolute(locale, '/datenschutz')})
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
