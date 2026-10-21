export type SlidePoint = {
	label: string;
	text: string;
};

export type IntroSlide = {
	kind: 'intro';
	title: string;
	lede: string;
};

export type ContentSlide = {
	kind: 'content';
	kicker: string;
	title: string;
	points: readonly [SlidePoint, SlidePoint, SlidePoint];
};

export type Slide = IntroSlide | ContentSlide;

/** Company deck: one title slide, then the same header-and-content layout. */
export const slides = [
	{
		kind: 'intro',
		title: 'Your Team Can Just Build Things',
		lede: 'Agentic Engineering Hackathons.'
	},
	{
		kind: 'content',
		kicker: 'Wir',
		title: 'Zwei Facilitators',
		points: [
			{ label: 'Emilian Scheel', text: 'emilian@all-in-agi.com' },
			{ label: 'Maddox Sciuchetti', text: 'maddox@all-in-agi.com' },
			{ label: 'Vor Ort', text: 'Wir kommen zu Ihrem Team und moderieren den Tag in Deutschland.' }
		]
	},
	{
		kind: 'content',
		kicker: 'Was wir machen',
		title: 'Kein Training. Ein Hackathon.',
		points: [
			{ label: 'Ein Tag', text: 'Ihr Team baut einen funktionierenden Prototyp, nicht eine Folie.' },
			{ label: 'Coding Agents', text: 'Aktuelle AI Developer Tools, Hands-on, an echten Aufgaben.' },
			{ label: 'Ihre Cases', text: 'Die Challenges kommen aus Ihrem Unternehmen, nicht aus einem Lehrbuch.' }
		]
	},
	{
		kind: 'content',
		kicker: 'Der Tag',
		title: 'Von Kickoff bis Demo',
		points: [
			{ label: '09:00 Kickoff', text: 'Live Demo, Tool Stack, Teams und Challenges.' },
			{ label: '09:30 Build', text: 'Vom Problem zum Prototype, mit Pizza-Lunch um 13 Uhr.' },
			{ label: '16:30 Demo', text: 'Problem, Lösung, wie es genutzt wird, und wie es gebaut wurde.' }
		]
	},
	{
		kind: 'content',
		kicker: 'Der Rahmen',
		title: 'Was wir mitbringen',
		points: [
			{ label: 'Challenge Design', text: 'Wir schneiden die Aufgaben so, dass an einem Tag etwas entsteht.' },
			{ label: 'Demo und Follow-up', text: 'Der Tag endet mit einer Demo Session und einem nächsten Schritt.' },
			{ label: 'Vor Ort', text: 'Pizza, Cookies, Event-Fotos und ein Siegerposter, in Ihren Räumen.' }
		]
	},
	{
		kind: 'content',
		kicker: 'Kontakt',
		title: 'ALL IN AGI',
		points: [
			{ label: 'Mail', text: 'go@all-in-agi.com' },
			{ label: 'Telefon', text: '0152 57257750' },
			{ label: 'Website', text: 'all-in-agi.com' }
		]
	}
] as const satisfies readonly Slide[];
