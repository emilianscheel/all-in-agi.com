export type IntroSlide = {
	kind: 'intro';
	title: string;
	lede: string;
};

export type ContentSlide = {
	kind: 'content';
	kicker: string;
	title: string;
	points: readonly [string, string, string];
};

export type Slide = IntroSlide | ContentSlide;

/** Company deck: one title slide, then at most three sentences each. */
export const slides = [
	{
		kind: 'intro',
		title: 'Your Team Can Just Build Things',
		lede: 'Agentic Engineering Hackathons.'
	},
	{
		kind: 'content',
		kicker: 'Wir',
		title: 'Warum wir?',
		points: [
			'Wir haben bereits mehrere Hackathons geplant und durchgeführt.',
			'Wir haben an mehr als 30 Hackathons in Berlin, München und San Francisco teilgenommen.',
			'Wir sind beide Softwareentwickler.'
		]
	},
	{
		kind: 'content',
		kicker: 'Hackathon',
		title: 'Warum ein Hackathon?',
		points: [
			'Laut der BCG AI Radar 2026 sehen nur 6 Prozent der Unternehmen einen klaren finanziellen Nutzen aus KI.',
			'Ein Hackathon zeigt dem Team schnell, was möglich ist und wie man mit den neuesten Technologien arbeitet.',
			'Schnelle Adoption ist wichtiger denn je, damit Fortschritt und Wachstum im Unternehmen ankommen.'
		]
	},
	{
		kind: 'content',
		kicker: 'Danach',
		title: 'Nächste Schritte',
		points: [
			'Wir nehmen Ihre Wünsche auf.',
			'Wir stellen die Rückfragen, die für volle Klarheit fehlen.',
			'Sie erhalten ein Angebot.'
		]
	}
] as const satisfies readonly Slide[];
