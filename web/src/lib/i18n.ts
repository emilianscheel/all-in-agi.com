import { PUBLIC_ID_PATTERN } from './public-id';

export const LOCALES = ['de', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const localeMeta = {
	de: { languageTag: 'de-DE', ogLocale: 'de_DE', label: 'Deutsch', shortLabel: 'DE' },
	en: { languageTag: 'en-US', ogLocale: 'en_US', label: 'English', shortLabel: 'EN' }
} as const satisfies Record<Locale, { languageTag: string; ogLocale: string; label: string; shortLabel: string }>;

/** Internal SvelteKit path -> locale-neutral public path. */
export const PUBLIC_ROUTE_ENTRIES = [
	['/', '/'],
	['/impressum', '/legal-notice'],
	['/agb', '/terms'],
	['/agb.txt', '/terms.txt'],
	['/llms.txt', '/llms.txt'],
	['/datenschutz', '/privacy'],
	['/teilnehmer-datenschutz', '/participant-privacy'],
	['/buchen', '/go'],
	['/buchen/erfolg', '/go/success'],
	['/verwalten', '/manage'],
	['/offer', '/offer'],
	['/hackathon-unternehmen-berlin', '/company-hackathon-berlin'],
	['/hackathon-unternehmen-hamburg', '/company-hackathon-hamburg'],
	['/hackathon-unternehmen-muenchen', '/company-hackathon-munich'],
	['/hackathon-unternehmen-stuttgart', '/company-hackathon-stuttgart'],
	['/hackathon-unternehmen-frankfurt', '/company-hackathon-frankfurt'],
	['/ki-hackathon-industrie', '/ai-hackathon-industry'],
	['/hackathon-softwareunternehmen', '/hackathon-software-companies'],
	['/ki-hackathon-logistik-handel', '/ai-hackathon-logistics-retail'],
	['/ki-hackathon-banken-versicherungen', '/ai-hackathon-banking-insurance'],
	['/hackathon-maschinenbau-automatisierung', '/hackathon-mechanical-engineering-automation'],
	['/ki-adoption-engineering', '/ai-adoption-engineering'],
	['/coding-agent-rollout-hackathon', '/coding-agent-rollout-hackathon'],
	['/developer-experience-ai-tools', '/developer-experience-ai-tools'],
	['/ki-strategie-working-prototype', '/ai-strategy-working-prototype'],
	['/interne-ai-champions', '/internal-ai-champions'],
	['/interner-ki-hackathon', '/internal-ai-hackathon'],
	['/hack-week-coding-agents', '/hack-week-coding-agents'],
	['/ai-innovation-day', '/ai-innovation-day'],
	['/legacy-modernisierung-coding-agents', '/legacy-modernization-coding-agents'],
	['/security-konformer-ki-hackathon', '/secure-ai-hackathon'],
	['/codex-best-practices', '/codex-best-practices'],
	['/claude-code-best-practices', '/claude-code-best-practices'],
	['/coding-agents-vergleich-unternehmen', '/coding-agents-comparison-companies'],
	['/coding-agent-tests-verifikation', '/coding-agent-tests-verification'],
	['/vibe-coding-im-unternehmen', '/vibe-coding-in-companies'],
	['/wird-ki-uns-ersetzen', '/will-ai-replace-us'],
	['/san-francisco-lebt-in-der-zukunft', '/san-francisco-lives-in-the-future'],
	['/deutschland-hat-ein-umsetzungsproblem', '/germany-has-an-implementation-problem'],
	['/ki-produktivitaet-ohne-stellenabbau', '/ai-productivity-without-layoffs'],
	['/europas-chance-mit-ki', '/europes-ai-opportunity'],
	['/ki-hackathon-sensorik-automatisierung', '/ai-hackathon-sensors-automation'],
	['/ki-hackathon-intralogistik', '/ai-hackathon-intralogistics'],
	['/ki-hackathon-robotik', '/ai-hackathon-robotics'],
	['/ki-hackathon-steuersoftware', '/ai-hackathon-tax-software'],
	['/ki-hackathon-digital-commerce', '/ai-hackathon-digital-commerce'],
	['/ki-fuer-den-mittelstand', '/ai-for-german-smes'],
	['/ki-hackathon-ostdeutschland', '/ai-hackathon-eastern-germany'],
	['/ki-hackathon-ostwestfalen-lippe', '/ai-hackathon-east-westphalia-lippe'],
	['/ki-hackathon-nuernberg-franken', '/ai-hackathon-nuremberg-franconia'],
	['/ki-hackathon-ruhrgebiet', '/ai-hackathon-ruhr-region']
] as const;

const internalToPublic = new Map<string, string>(PUBLIC_ROUTE_ENTRIES);
const publicToInternal = new Map<string, string>(PUBLIC_ROUTE_ENTRIES.map(([internal, publicPath]) => [publicPath, internal]));

export function isLocale(value: string | null | undefined): value is Locale {
	return value === 'de' || value === 'en';
}

export function localeFromPath(pathname: string): Locale | null {
	const segment = pathname.split('/')[1];
	return isLocale(segment) ? segment : null;
}

export function stripLocale(pathname: string) {
	const locale = localeFromPath(pathname);
	if (!locale) return { locale: null, pathname } as const;
	const stripped = pathname.slice(locale.length + 1) || '/';
	return { locale, pathname: stripped.startsWith('/') ? stripped : `/${stripped}` } as const;
}

function dynamicInternalPath(publicPath: string): string | null {
	if (PUBLIC_ID_PATTERN.test(publicPath.slice(1))) return publicPath;
	if (publicPath.startsWith('/go/') && publicPath !== '/go/success') return `/buchen/${publicPath.slice('/go/'.length)}`;
	if (publicPath.startsWith('/offer/')) return publicPath;
	return null;
}

function dynamicPublicPath(internalPath: string): string | null {
	if (PUBLIC_ID_PATTERN.test(internalPath.slice(1))) return internalPath;
	if (internalPath.startsWith('/buchen/') && internalPath !== '/buchen/erfolg') return `/go/${internalPath.slice('/buchen/'.length)}`;
	if (internalPath.startsWith('/offer/')) return internalPath;
	return null;
}

export function internalPathForPublic(publicPath: string) {
	return publicToInternal.get(publicPath) ?? dynamicInternalPath(publicPath);
}

export function publicPathForInternal(internalPath: string) {
	return internalToPublic.get(internalPath) ?? dynamicPublicPath(internalPath);
}

export function localizedPath(locale: Locale, internalPath: string) {
	const publicPath = publicPathForInternal(internalPath) ?? internalPath;
	return publicPath === '/' ? `/${locale}` : `/${locale}${publicPath}`;
}

export function localizedPathFromPublic(locale: Locale, publicPath: string) {
	return publicPath === '/' ? `/${locale}` : `/${locale}${publicPath}`;
}

/** Maps a visible localized URL to the existing single route tree. */
export function reroutePath(pathname: string) {
	const { locale, pathname: publicPath } = stripLocale(pathname);
	if (!locale) return undefined;
	return internalPathForPublic(publicPath) ?? undefined;
}

/** Returns the canonical public path for either a legacy internal or new public path. */
export function canonicalPublicPath(pathname: string) {
	return publicPathForInternal(pathname) ?? (internalPathForPublic(pathname) ? pathname : null);
}

export function switchLocalePath(url: URL, locale: Locale) {
	const current = stripLocale(url.pathname);
	const publicPath = current.locale
		? canonicalPublicPath(current.pathname) ?? current.pathname
		: canonicalPublicPath(url.pathname) ?? url.pathname;
	return `${localizedPathFromPublic(locale, publicPath)}${url.search}${url.hash}`;
}

export function preferredLocale(country: string | null, acceptLanguage: string | null): Locale {
	if (country) return country.toUpperCase() === 'DE' ? 'de' : 'en';
	const scores: Record<Locale, number> = { de: -1, en: -1 };
	for (const item of (acceptLanguage ?? '').split(',')) {
		const [tagPart, ...parameters] = item.trim().toLowerCase().split(';');
		const locale = tagPart?.split('-')[0];
		if (!isLocale(locale)) continue;
		const qualityText = parameters.find((part) => part.trim().startsWith('q='))?.split('=')[1];
		const quality = qualityText === undefined ? 1 : Number(qualityText);
		if (Number.isFinite(quality)) scores[locale] = Math.max(scores[locale], quality);
	}
	return scores.en > scores.de ? 'en' : 'de';
}

export const ui = {
	de: {
		skip: 'Zum Inhalt springen', navLabel: 'Hauptnavigation', homeLabel: 'ALL IN AGI Startseite',
		agenda: 'Agenda', price: 'Preis', contact: 'Kontakt', plan: 'Hackathon planen',
		legalNotice: 'Impressum', terms: 'Allgemeine Geschäftsbedingungen', privacy: 'Datenschutz', manage: 'Buchung verwalten',
		cookieLabel: 'Cookie-Einstellungen', cookieText: 'Wir verwenden optionale Analyse-Cookies, um unsere Website und den Buchungsprozess zu verbessern.',
		rejectCookies: 'Alle ablehnen', acceptCookies: 'Alle Cookies erlauben', closingTitle: 'Was shippt Ihr Team an einem Tag?'
	},
	en: {
		skip: 'Skip to content', navLabel: 'Main navigation', homeLabel: 'ALL IN AGI home',
		agenda: 'Agenda', price: 'Pricing', contact: 'Contact', plan: 'Plan a hackathon',
		legalNotice: 'Legal notice', terms: 'Terms and Conditions', privacy: 'Privacy', manage: 'Manage booking',
		cookieLabel: 'Cookie settings', cookieText: 'We use optional analytics cookies to improve our website and booking experience.',
		rejectCookies: 'Reject all', acceptCookies: 'Allow all cookies', closingTitle: 'What will your team ship in one day?'
	}
} as const;
