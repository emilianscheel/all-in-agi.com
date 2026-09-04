import { localizedPath, type Locale } from '$lib/i18n';
import type { RequestHandler } from './$types';

function absolute(locale: Locale, internalPath: string) {
	return `https://all-in-agi.com${localizedPath(locale, internalPath)}`;
}

export const _llmsContent = {
	de: (locale: Locale) => `# ALL IN AGI

> ALL IN AGI organisiert moderierte Agentic Engineering Hackathons für Unternehmen – vor Ort in Deutschland oder online. Gemischte Teams bauen mit aktuellen AI Coding Agents einen funktionierenden Prototyp.

## Angebot

- Standardformat: ein Tag, üblicherweise 09:00–17:00 Uhr, für 15, 30 oder 50 Personen.
- Enthalten: zwei Facilitators, Challenge Design, Demo Session, Follow-up, Lunch und Event-Fotos.
- Individuelle, internationale, mehrtägige und Online-Formate sind auf Anfrage möglich.
- Vorhandene Coding Tools können eingebunden oder für den Veranstaltungstag bereitgestellt werden.

## Buchung und Kontakt

- [Hackathon planen](${absolute(locale, '/buchen')})
- [Startseite](${absolute(locale, '/')})
- [AGB](${absolute(locale, '/agb')})
- [Datenschutz](${absolute(locale, '/datenschutz')})
- Kontakt: go@all-in-agi.com, +49 152 57257750
`,
	en: (locale: Locale) => `# ALL IN AGI

> ALL IN AGI runs facilitated agentic engineering hackathons for companies—on site in Germany or online. Mixed teams use current AI coding agents to build a working prototype.

## Offering

- Standard format: one day, typically 09:00–17:00, for 15, 30, or 50 participants.
- Includes two facilitators, challenge design, a demo session, follow-up, lunch, and event photography.
- Custom, international, multi-day, and online formats are available on request.
- Existing coding tools can be integrated or provided for the event day.

## Booking and contact

- [Plan a hackathon](${absolute(locale, '/buchen')})
- [Homepage](${absolute(locale, '/')})
- [Terms and Conditions](${absolute(locale, '/agb')})
- [Privacy](${absolute(locale, '/datenschutz')})
- Contact: go@all-in-agi.com, +49 152 57257750
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
