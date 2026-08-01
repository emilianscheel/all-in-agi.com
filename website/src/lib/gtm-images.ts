export const GTM_HERO_IMAGES = {
	event: {
		src: '/images/all-in-agi-event.webp',
		width: 2400,
		height: 1619,
		alt: 'Teilnehmende arbeiten gemeinsam bei einem ALL IN AGI Hackathon',
		caption: 'Gemeinsames Bauen beim ALL IN AGI Agentic Engineering Hackathon.'
	},
	adoption: {
		src: '/images/ai-adoption-hackathon.webp',
		width: 2400,
		height: 1619,
		alt: 'Team während einer Arbeitsphase bei einem AI-Adoption-Hackathon',
		caption: 'Ein interdisziplinäres Team übersetzt AI-Adoption in einen konkreten Prototyp.'
	},
	engineering: {
		src: '/images/team-meeting.webp',
		width: 2400,
		height: 1604,
		alt: 'Softwareteam bespricht gemeinsam einen technischen Prototyp',
		caption: 'Engineering, Product und Fachbereich arbeiten gemeinsam am technischen Pfad.'
	}
} as const;

export type GtmHeroKey = keyof typeof GTM_HERO_IMAGES;
