import type {
	EditorialPageContent,
	EditorialParagraph,
	EditorialSource,
	GtmIconName
} from '$lib/gtm-pages';

const publishedAt = '2026-08-02';

type BaseSpec = {
	slug: string;
	group: EditorialPageContent['group'];
	title: string;
	seoTitle: string;
	footerLabel: string;
	icon: GtmIconName;
	description: string;
	dek: string;
	sources: EditorialSource[];
	relatedSlugs: string[];
};

type SectionSpec = {
	title: string;
	paragraphs: Array<string | EditorialParagraph>;
	bullets?: Array<string | EditorialParagraph>;
};

function paragraph(value: string | EditorialParagraph): EditorialParagraph {
	return typeof value === 'string' ? { text: value } : value;
}

export function editorialPage(
	base: BaseSpec,
	sections: SectionSpec[],
	options: { blueprint?: boolean } = {}
): EditorialPageContent {
	const closingSection: SectionSpec[] = base.group === 'Tools'
		? [{
			title: 'Der praktische Startpunkt',
			paragraphs: [
				`Wer die These „${base.title}“ im eigenen Unternehmen prüfen will, sollte nicht mit einer flächendeckenden Richtlinie beginnen. Wählen Sie einen repräsentativen Workflow, ein verantwortliches Team und eine Qualitätsbedingung, die heute bereits ausführbar ist. Dokumentieren Sie den bisherigen Weg, damit Geschwindigkeit und zusätzlicher Review-Aufwand später ehrlich verglichen werden können.`,
				`Nach dem Versuch werden nur die Muster standardisiert, die im realen Repository getragen haben. Offene Zugänge, fehlende Tests und unklare Regeln kommen in ein konkretes Verbesserungsbacklog. So wird ${base.seoTitle} nicht zur weiteren Tippsammlung, sondern zur Grundlage einer messbaren, dauerhaft wirksamen Engineering-Entscheidung.`
			]
		}]
		: base.group === 'Gesellschaft'
			? [{
				title: 'Die Konsequenz für Entscheider',
				paragraphs: [
					`Die Position „${base.title}“ ist bewusst zugespitzt, aber sie entbindet niemanden von Gegenargumenten. Führung sollte offenlegen, welche Annahmen über Technologie, Arbeit und Wettbewerb hinter einer Entscheidung stehen und welche Beobachtung die eigene These widerlegen würde. Nur dann wird Ambition zu einer lernfähigen Strategie statt zu einem neuen Glaubenssatz.`,
					`Ein guter nächster Schritt ist klein genug, um innerhalb weniger Wochen Erkenntnisse zu liefern, und relevant genug, um eine echte Folgeentscheidung auszulösen. Das Team braucht einen Nutzer, eine erlaubte Umgebung, einen sichtbaren Erfolgstest und einen Sponsor. So verbindet sich gesellschaftliche Debatte mit verantwortbarer betrieblicher Praxis.`
				]
			}]
			: [];
	const completeSections = [...sections, ...closingSection];

	return {
		...base,
		kind: 'editorial',
		publishedAt,
		sections: completeSections.map((section) => ({
			title: section.title,
			paragraphs: section.paragraphs.map(paragraph),
			...(section.bullets ? { bullets: section.bullets.map(paragraph) } : {})
		})),
		...(options.blueprint ? { blueprint: true } : {})
	};
}

export function sourced(text: string, ...sourceIds: string[]): EditorialParagraph {
	return { text, sourceIds };
}
