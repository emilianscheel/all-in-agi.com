import {
	BadgeEuro,
	CalendarCheck,
	CircleHelp,
	ClipboardList,
	Clock,
	FileText,
	Presentation,
	Home,
	LayoutDashboard,
	LayoutGrid,
	ListOrdered,
	Mail,
	Rocket,
	Scale,
	Shield,
	Timer,
	Users
} from 'lucide-svelte';
import { gtmIcons, type GtmIconComponent } from '$lib/gtm-icons';
import { gtmPages, getGtmPage, type GtmIconName } from '$lib/gtm-pages';
import { localizedPath, type Locale } from '$lib/i18n';

export type CommandPaletteIcon = typeof Home | GtmIconComponent;

export type CommandPalettePage = {
	id: string;
	path: string;
	href: string;
	title: string;
	group: string;
	keywords: string[];
	icon: CommandPaletteIcon;
};

type CorePage = {
	id: string;
	path: string;
	hash?: string;
	/** Served at the internal path, without a /de or /en prefix. */
	bare?: boolean;
	icon: CommandPaletteIcon;
	group: { de: string; en: string };
	title: { de: string; en: string };
	keywords: { de: string[]; en: string[] };
};

const CORE_PAGES: CorePage[] = [
	{
		id: 'home',
		path: '/',
		icon: Home,
		group: { de: 'Seiten', en: 'Pages' },
		title: { de: 'Startseite', en: 'Home' },
		keywords: {
			de: ['home', 'start', 'all in agi'],
			en: ['home', 'start', 'all in agi']
		}
	},
	{
		id: 'landing-custom-formats',
		path: '/',
		hash: '#custom-formats',
		icon: LayoutGrid,
		group: { de: 'Startseite', en: 'Home' },
		title: { de: 'Wie Sie es brauchen', en: 'Built around your needs' },
		keywords: {
			de: ['formate', 'custom', 'bedarf', 'anpassen'],
			en: ['formats', 'custom', 'needs', 'built']
		}
	},
	{
		id: 'landing-format',
		path: '/',
		hash: '#format',
		icon: ListOrdered,
		group: { de: 'Startseite', en: 'Home' },
		title: { de: 'Ablaufplan', en: 'Agenda' },
		keywords: {
			de: ['ablauf', 'agenda', 'format', 'tag'],
			en: ['agenda', 'schedule', 'format', 'day']
		}
	},
	{
		id: 'landing-pricing',
		path: '/',
		hash: '#pricing',
		icon: BadgeEuro,
		group: { de: 'Startseite', en: 'Home' },
		title: { de: 'Preis', en: 'Pricing' },
		keywords: {
			de: ['preis', 'preise', 'kosten', 'pricing'],
			en: ['price', 'pricing', 'cost', 'preis']
		}
	},
	{
		id: 'landing-contact',
		path: '/',
		hash: '#contact',
		icon: Mail,
		group: { de: 'Startseite', en: 'Home' },
		title: { de: 'Kontakt', en: 'Contact' },
		keywords: {
			de: ['kontakt', 'email', 'telefon', 'anruf'],
			en: ['contact', 'email', 'phone', 'call']
		}
	},
	{
		id: 'landing-faq',
		path: '/',
		hash: '#faq',
		icon: CircleHelp,
		group: { de: 'Startseite', en: 'Home' },
		title: { de: 'Häufige Fragen', en: 'Frequently asked questions' },
		keywords: {
			de: ['faq', 'fragen', 'häufig', 'hilfe'],
			en: ['faq', 'questions', 'help', 'answers']
		}
	},
	{
		id: 'landing-closing',
		path: '/',
		hash: '#closing',
		icon: Rocket,
		group: { de: 'Startseite', en: 'Home' },
		title: {
			de: 'Was shippt Ihr Team an einem Tag?',
			en: 'What will your team ship in one day?'
		},
		keywords: {
			de: ['shippt', 'cta', 'abschluss', 'buchen'],
			en: ['ship', 'cta', 'closing', 'book']
		}
	},
	{
		id: 'buchen',
		path: '/buchen',
		icon: CalendarCheck,
		group: { de: 'Seiten', en: 'Pages' },
		title: { de: 'Hackathon planen', en: 'Plan a hackathon' },
		keywords: {
			de: ['buchen', 'buchung', 'planen', 'booking', 'go'],
			en: ['book', 'booking', 'plan', 'hackathon', 'go']
		}
	},
	{
		id: 'buchen-erfolg',
		path: '/buchen/erfolg',
		icon: ClipboardList,
		group: { de: 'Seiten', en: 'Pages' },
		title: { de: 'Buchung erfolgreich', en: 'Booking success' },
		keywords: {
			de: ['erfolg', 'bestätigung', 'confirmation'],
			en: ['success', 'confirmation', 'done']
		}
	},
	{
		id: 'verwalten',
		path: '/verwalten',
		icon: Users,
		group: { de: 'Seiten', en: 'Pages' },
		title: { de: 'Buchung verwalten', en: 'Manage booking' },
		keywords: {
			de: ['verwalten', 'manage', 'buchung'],
			en: ['manage', 'booking', 'admin']
		}
	},
	{
		id: 'impressum',
		path: '/impressum',
		icon: FileText,
		group: { de: 'Rechtliches', en: 'Legal' },
		title: { de: 'Impressum', en: 'Legal notice' },
		keywords: { de: ['impressum', 'legal'], en: ['legal', 'imprint', 'notice'] }
	},
	{
		id: 'agb',
		path: '/agb',
		icon: Scale,
		group: { de: 'Rechtliches', en: 'Legal' },
		title: { de: 'AGB', en: 'Terms and Conditions' },
		keywords: {
			de: ['agb', 'bedingungen', 'terms'],
			en: ['terms', 'conditions', 'tos']
		}
	},
	{
		id: 'datenschutz',
		path: '/datenschutz',
		icon: Shield,
		group: { de: 'Rechtliches', en: 'Legal' },
		title: { de: 'Datenschutz', en: 'Privacy' },
		keywords: {
			de: ['datenschutz', 'privacy', 'dsgvo'],
			en: ['privacy', 'gdpr', 'data']
		}
	},
	{
		id: 'teilnehmer-datenschutz',
		path: '/teilnehmer-datenschutz',
		icon: Shield,
		group: { de: 'Rechtliches', en: 'Legal' },
		title: {
			de: 'Teilnehmer-Datenschutz',
			en: 'Participant privacy'
		},
		keywords: {
			de: ['teilnehmer', 'datenschutz', 'privacy'],
			en: ['participant', 'privacy', 'attendee']
		}
	},
	{
		id: 'dashboard',
		path: '/dashboard',
		icon: LayoutDashboard,
		group: { de: 'Admin', en: 'Admin' },
		title: { de: 'Dashboard', en: 'Dashboard' },
		keywords: { de: ['dashboard', 'admin'], en: ['dashboard', 'admin'] }
	},
	{
		id: 'user',
		path: '/user',
		icon: Users,
		group: { de: 'Admin', en: 'Admin' },
		title: { de: 'Nutzer', en: 'Users' },
		keywords: { de: ['user', 'users', 'nutzer', 'benutzer', 'admin'], en: ['user', 'users', 'admin'] }
	},
	{
		id: 'buchungen',
		path: '/buchungen',
		icon: ClipboardList,
		group: { de: 'Admin', en: 'Admin' },
		title: { de: 'Buchungen', en: 'Bookings' },
		keywords: { de: ['buchungen', 'bookings', 'admin'], en: ['bookings', 'buchungen', 'admin'] }
	},
	{
		id: 'offer',
		path: '/offer',
		icon: FileText,
		group: { de: 'Admin', en: 'Admin' },
		title: { de: 'Angebote', en: 'Offers' },
		keywords: {
			de: ['angebot', 'offer', 'leistungsbeschreibung', 'admin'],
			en: ['offer', 'quote', 'statement of work', 'admin']
		}
	},
	{
		id: 'timer',
		path: '/timer',
		icon: Timer,
		group: { de: 'Admin', en: 'Admin' },
		title: { de: 'Timer', en: 'Timer' },
		keywords: { de: ['timer', 'präsentation'], en: ['timer', 'presentation'] }
	},
	{
		id: 'clock',
		path: '/clock',
		icon: Clock,
		group: { de: 'Admin', en: 'Admin' },
		title: { de: 'Clock', en: 'Clock' },
		keywords: { de: ['clock', 'uhr'], en: ['clock', 'time'] }
	},
	{
		id: 'slides',
		path: '/slides',
		icon: Presentation,
		group: { de: 'Admin', en: 'Admin' },
		title: { de: 'Folien', en: 'Slides' },
		keywords: {
			de: ['folien', 'slides', 'präsentation', 'erstgespräch', 'intro'],
			en: ['slides', 'presentation', 'intro call']
		}
	}
];

/** Internal paths excluded from Cmd+K navigation. */
export const COMMAND_PALETTE_EXCLUDED_PATHS = ['/offer/[token]'] as const;

export function getCommandPalettePages(locale: Locale): CommandPalettePage[] {
	const core = CORE_PAGES.map((page) => ({
		id: page.id,
		path: page.path,
		href: page.bare ? page.path : `${localizedPath(locale, page.path)}${page.hash ?? ''}`,
		title: page.title[locale],
		group: page.group[locale],
		keywords: page.keywords[locale],
		icon: page.icon
	}));

	const gtm = gtmPages.map((base) => {
		const page = getGtmPage(base.slug, locale);
		return {
			id: `gtm-${page.slug}`,
			path: `/${page.slug}`,
			href: localizedPath(locale, `/${page.slug}`),
			title: page.title,
			group: page.group,
			keywords: [page.slug, page.footerLabel, page.group, page.description],
			icon: gtmIcons[page.icon as GtmIconName]
		};
	});

	return [...core, ...gtm];
}

export function commandPalettePagePaths(): string[] {
	return getCommandPalettePages('de').map((page) => page.path);
}
