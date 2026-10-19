import {
	CalendarCheck,
	ClipboardList,
	Clock,
	FileText,
	Home,
	LayoutDashboard,
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
		title: { de: 'Angebot', en: 'Offer' },
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
	}
];

/** Internal paths excluded from Cmd+K navigation. */
export const COMMAND_PALETTE_EXCLUDED_PATHS = ['/offer/[token]'] as const;

export function getCommandPalettePages(locale: Locale): CommandPalettePage[] {
	const core = CORE_PAGES.map((page) => ({
		id: page.id,
		path: page.path,
		href: localizedPath(locale, page.path),
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
