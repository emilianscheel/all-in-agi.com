export type Slide = {
	kicker: string;
	title: string;
	points: readonly string[];
};

/** Intro-call questions from script/action.md, written to present on screen. */
export const slides = [
	{
		kicker: 'Erstgespräch',
		title: 'Intro Call',
		points: [
			'Fragen, bevor wir den Hackathon bei Ihnen vor Ort bauen.',
			'Ort, Verpflegung, Tools und Challenges.'
		]
	},
	{
		kicker: 'Allgemein',
		title: 'Ziel des Hackathons',
		points: [
			'Wo steht KI in Ihrer Organisation?',
			'Was wollen Sie mit dem Hackathon erreichen?',
			'Wobei können wir dabei helfen?'
		]
	},
	{
		kicker: 'Ort',
		title: 'Raum und Technik',
		points: [
			'Gibt es einen Ort, und reicht der Platz für alle?',
			'Gibt es einen Beamer oder ein digitales Whiteboard?',
			'Können wir per HDMI oder Thunderbolt anschließen?',
			'Sieht jeder den Bildschirm?',
			'Ist der Raum vorbereitet, oder sollen wir das übernehmen? Dann sind wir gerne einen Tag vorher da.',
			'Können Sie uns ein Foto des Raums schicken?'
		]
	},
	{
		kicker: 'Verpflegung',
		title: 'Mittagessen',
		points: [
			'Pizza und Cookies, oder etwas anderes?',
			'Wann soll das Mittagessen sein?',
			'Bei Start um 9 Uhr sind wir ab 8 Uhr im Gebäude.'
		]
	},
	{
		kicker: 'Tools',
		title: 'Setup',
		points: [
			'Gibt es schon agentic coding tools, oder sollen wir das übernehmen?',
			'Kennen die Teilnehmenden die Tools?',
			'Wie technisch ist die Gruppe ungefähr?',
			'Haben die Leute Admin-Rechte, oder Zugang zu virtuellen Maschinen?'
		]
	},
	{
		kicker: 'Challenge',
		title: 'Richtung',
		points: [
			'Sollen die Challenges in eine bestimmte Richtung gehen?',
			'Oder bauen wir interessante Tracks?'
		]
	}
] as const satisfies readonly Slide[];
