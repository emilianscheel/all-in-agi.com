export const GTM_HERO_IMAGES = {
	event: {
		src: '/images/all-in-agi-event.webp',
		placeholderSrc: '/images/placeholders/all-in-agi-event.webp',
		width: 2400,
		height: 1619,
		alt: 'Teilnehmende arbeiten gemeinsam bei einem ALL IN AGI Hackathon',
		caption: 'Gemeinsames Bauen beim ALL IN AGI Agentic Engineering Hackathon.'
	},
	adoption: {
		src: '/images/ai-adoption-hackathon.webp',
		placeholderSrc: '/images/placeholders/ai-adoption-hackathon.webp',
		width: 2400,
		height: 1619,
		alt: 'Team während einer Arbeitsphase bei einem AI-Adoption-Hackathon',
		caption: 'Ein interdisziplinäres Team übersetzt AI-Adoption in einen konkreten Prototyp.'
	},
	engineering: {
		src: '/images/team-meeting.webp',
		placeholderSrc: '/images/placeholders/team-meeting.webp',
		width: 2400,
		height: 1604,
		alt: 'Softwareteam bespricht gemeinsam einen technischen Prototyp',
		caption: 'Engineering, Product und Fachbereich arbeiten gemeinsam am technischen Pfad.'
	},
	industry: {
		src: '/images/article-industry.webp',
		placeholderSrc: '/images/placeholders/article-industry.webp',
		width: 2400,
		height: 1600,
		alt: 'Industriefachkräfte steigen gemeinsam eine Anlage hinauf',
		caption: 'Industrielle Veränderung beginnt dort, wo Menschen, Anlagen und digitale Workflows zusammenkommen. Foto: Sol / Unsplash.'
	},
	munich: {
		src: '/images/article-munich.webp',
		placeholderSrc: '/images/placeholders/article-munich.webp',
		width: 2400,
		height: 1600,
		alt: 'Die Türme der Frauenkirche über den Dächern von München',
		caption: 'München verbindet gewachsene Unternehmen mit anspruchsvoller Software- und Produktentwicklung. Foto: Jan Antonin Kolar / Unsplash.'
	},
	berlin: {
		src: '/images/article-berlin.webp',
		placeholderSrc: '/images/placeholders/article-berlin.webp',
		width: 2400,
		height: 1600,
		alt: 'Das Brandenburger Tor in Berlin bei Tageslicht',
		caption: 'Berlin bringt Produkt-, Engineering- und Innovationsteams auf engem Raum zusammen. Foto: Tim Hüfner / Unsplash.'
	},
	machinery: {
		src: '/images/article-machinery.webp',
		placeholderSrc: '/images/placeholders/article-machinery.webp',
		width: 2400,
		height: 1600,
		alt: 'Industrieroboter in einer automatisierten Fertigungshalle',
		caption: 'Automatisierte Fertigung bietet konkrete Ansatzpunkte für sichere Engineering-Prototypen. Foto: Simon Kadula / Unsplash.'
	},
	logistics: {
		src: '/images/article-logistics.webp',
		placeholderSrc: '/images/placeholders/article-logistics.webp',
		width: 2400,
		height: 1600,
		alt: 'Hochregale mit Paletten und Waren in einem Logistiklager',
		caption: 'Logistikprozesse werden besonders wertvoll, wenn operative Ausnahmen schnell verständlich werden. Foto: Chuttersnap / Unsplash.'
	},
	frankfurt: {
		src: '/images/article-frankfurt.webp',
		placeholderSrc: '/images/placeholders/article-frankfurt.webp',
		width: 2400,
		height: 1600,
		alt: 'Frankfurter Skyline mit Hochhäusern und Eiserner Steg',
		caption: 'Frankfurt steht für digitale Innovation unter klaren regulatorischen und operativen Leitplanken. Foto: Sinan Erg / Unsplash.'
	},
	hamburg: {
		src: '/images/article-hamburg.webp',
		placeholderSrc: '/images/placeholders/article-hamburg.webp',
		width: 2400,
		height: 1600,
		alt: 'Hamburger Innenstadt und Kirchtürme an der Binnenalster',
		caption: 'Hamburg verbindet Handel, Logistik und digitale Produktentwicklung. Foto: Julia Solonina / Unsplash.'
	},
	stuttgart: {
		src: '/images/article-stuttgart.webp',
		placeholderSrc: '/images/placeholders/article-stuttgart.webp',
		width: 2400,
		height: 1600,
		alt: 'Historische Gebäude in einer Stuttgarter Straße',
		caption: 'Stuttgart verbindet industrielle Stärke mit moderner Software- und Engineering-Arbeit. Foto: Christian Lue / Unsplash.'
	},
	finance: {
		src: '/images/article-finance.webp',
		placeholderSrc: '/images/placeholders/article-finance.webp',
		width: 2400,
		height: 1600,
		alt: 'Blick nach oben zwischen modernen Bürohochhäusern',
		caption: 'Finanz- und Versicherungsunternehmen testen neue Workflows innerhalb klarer Kontrollpunkte. Foto: Kevin Matos / Unsplash.'
	}
} as const;

export type GtmHeroKey = keyof typeof GTM_HERO_IMAGES;
