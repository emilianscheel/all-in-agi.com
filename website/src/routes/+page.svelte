<script lang="ts">
	import { CalendarClock, CircleMinus, Lightbulb, Mail, Phone, Pizza, Presentation, Users, Utensils } from 'lucide-svelte';
	import { Accordion } from 'bits-ui';
	import { CODING_TOOLS } from '$lib/booking';
	import { reveal } from '$lib/motion';

	const carouselTools = CODING_TOOLS.filter((tool) => tool.icon);
	const carouselRepeats = [0, 1, 2, 3];
	const carouselLabel = `Coding Tools im Hackathon: ${carouselTools.map((tool) => tool.label).join(', ')}`;

	const faqs = [
		{
			question: 'Müssen alle coden können?',
			answer: 'Nein. Engineering, Product und Fachbereiche arbeiten gemeinsam. Wir schneiden die Challenges auf verschiedene Skill Levels zu.'
		},
		{
			question: 'Welche Tools nutzt ihr?',
			answer: 'Aktuelle AI Coding Agents und Dev Tools, abgestimmt auf Ihre IT- und Security-Vorgaben. Den konkreten Tool Stack legen wir im Prep Call fest.'
		},
		{
			question: 'Wie bleiben Daten geschützt?',
			answer: 'Tools, Zugänge und Datenklassen werden vorab mit IT und Security geklärt. Gebaut wird nur in der vereinbarten Umgebung.'
		},
		{
			question: 'Was braucht es vor Ort?',
			answer: 'Einen großen Raum, stabiles WLAN und motivierte Builder. Fehlende Präsentationstechnik bringen wir mit.'
		}
	];

	const schema = {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: 'ALL-IN-AGI',
		description: 'Agentic Engineering Hackathons für etablierte Unternehmen in Deutschland.',
		url: 'https://all-in-agi.com'
	};
</script>

<svelte:head>
	<title>Agentic Engineering Hackathon</title>
	<meta name="description" content="Lassen Sie Ihr Team die neuen Möglichkeiten von Coding Agents Hands-on erleben und mit einem Projekt kennenlernen" />
	<meta property="og:title" content="Agentic Engineering Hackathon" />
	<meta property="og:description" content="Lassen Sie Ihr Team die neuen Möglichkeiten von Coding Agents Hands-on mit einem Hackathon bei Ihnen vor Ort erleben." />
	<meta property="og:image" content="/images/all-in-agi-event.webp" />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<script type="application/ld+json">{JSON.stringify(schema)}</script>
</svelte:head>

<section class="hero">
	<div class="hero-copy" use:reveal>
		<h1 class="display-title">Your Team Can Just Build Things</h1>
		<p class="lede">Lassen Sie Ihr Team die neuen Möglichkeiten von Coding Agents Hands-on mit einem Hackathon bei Ihnen vor Ort erleben.</p>
		<div class="hero-actions">
			<a class="button-primary" href="/buchen">Hackathon planen</a>
			<a class="button-secondary" href="#format">Agenda ansehen</a>
		</div>
	</div>
	<div class="hero-image">
		<img src="/images/all-in-agi-event.webp" alt="Team arbeitet gemeinsam an einem Hackathon-Projekt" fetchpriority="high" />
	</div>
</section>

<section class="manifesto" aria-labelledby="manifesto-title">
	<div class="manifesto-content" use:reveal>
		<h2 id="manifesto-title">Keine weitere Fortbildung.</h2>
		<p>Statt theoretischer Schulung entwickelt Ihr Team an einem Tag gemeinsam einen funktionierenden Prototyp mit aktuellen KI-Entwicklerwerkzeugen.</p>
	</div>
	<div class="tool-carousel" role="img" aria-label={carouselLabel}>
		<div class="tool-carousel-window">
			<div class="tool-carousel-track" aria-hidden="true">
				{#each [0, 1] as copy}
					<div class:duplicate={copy === 1} class="tool-carousel-group">
						{#each carouselRepeats as repetition}
							<div class:duplicate-set={repetition > 0} class="tool-carousel-set">
								{#each carouselTools as tool}
									<img src={tool.icon} alt="" width="96" height="96" />
								{/each}
							</div>
						{/each}
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

<section class="adoption-gap" aria-labelledby="adoption-gap-title">
	<img
		class="adoption-gap-image"
		src="/images/ai-adoption-hackathon.webp"
		alt=""
		loading="lazy"
		decoding="async"
	/>
	<div class="adoption-gap-inner">
		<div class="adoption-gap-copy" use:reveal>
			<h2 id="adoption-gap-title">Vom Wollen ins Machen.</h2>
			<p class="adoption-gap-conclusion">
				Der beste Weg, die Adaptionslücke zu schließen: ein Hackathon, bei dem das Team gemeinsam
				baut, ausprobiert.
			</p>
			<p class="adoption-gap-source">
				<a
					href="https://www.celonis.com/de/news/press/the-enterprise-ai-reality-check-high-ambitions-meet-operational-barriers"
					target="_blank"
					rel="noreferrer"
				>Celonis Process Optimization Report, März 2026</a>
			</p>
		</div>

		<dl class="adoption-gap-stats" use:reveal={{ group: true }}>
			<div class="adoption-gap-stat">
				<dt><strong>85</strong><span>%</span></dt>
				<dd>wollen in den nächsten zwei bis drei Jahren zum Agentic Enterprise werden.</dd>
			</div>
			<div class="adoption-gap-stat">
				<dt><strong>17</strong><span>%</span></dt>
				<dd>der Unternehmen im DACH-Raum nutzen bereits AI Agents.</dd>
			</div>
		</dl>
	</div>
</section>

<section id="format" class="agenda">
	<div class="section-wrap">

		<div class="agenda-grid agenda-grid-four" use:reveal={{ group: true }}>
			<article class="agenda-card"><span class="time">09:00</span><h3>Kickoff</h3><p>Live Demo, Tool Stack, Teams und Challenges.</p></article>
			<article class="agenda-card"><span class="time">09:30</span><h3>Build Sprint</h3><p>Von Problem und User Flow zum ersten Working Prototype.</p></article>
			<article class="agenda-card"><span class="time">13:00</span><h3>Pizza</h3><p>Gemeinsamer Lunch, Feedback und zweiter Build Sprint.</p></article>
			<article class="agenda-card"><span class="time">16:30</span><h3>Live Demo</h3><p>Problem, Lösung, How its used and build</p></article>
		</div>
	</div>
</section>

<section id="preis" class="pricing">
	<div class="section-wrap">

		<div class="pricing-grid" use:reveal={{ group: true }}>
			<article class="price-card"><h3>Bis 15 Personen</h3><strong>4.000 €</strong><span>netto</span><ul><li><Users size={17} />2 Facilitator</li><li><Lightbulb size={17} />Challenge Design</li><li><Presentation size={17} />Demo Day & Follow-up</li><li><Pizza size={17} />Pizza Lunch inklusive</li><li><CircleMinus size={17} />Ohne Lunch −500 €</li><li><Utensils size={17} />Custom Catering +500 €</li></ul></article>
			<article class="price-card featured"><span class="tag">Most popular</span><h3>Bis 30 Personen</h3><strong>5.000 €</strong><span>netto</span><ul><li><Users size={17} />2 Facilitators</li><li><Lightbulb size={17} />Challenge Design</li><li><Presentation size={17} />Demo Day & Follow-up</li><li><Pizza size={17} />Pizza Lunch inklusive</li><li><CircleMinus size={17} />Ohne Lunch −500 €</li><li><Utensils size={17} />Custom Catering +500 €</li></ul></article>
			<article class="price-card"><h3>Bis 50 Personen</h3><strong>6.000 €</strong><span>netto</span><ul><li><Users size={17} />2 Facilitators</li><li><Lightbulb size={17} />Challenge Design</li><li><Presentation size={17} />Demo Day & Follow-up</li><li><Pizza size={17} />Pizza Lunch inklusive</li><li><CircleMinus size={17} />Ohne Lunch −500 €</li><li><Utensils size={17} />Custom Catering +500 €</li></ul></article>
		</div>
		<div class="section-action"><a class="button-primary" href="/buchen">Hackathon planen</a><a class="button-secondary" href="#kontakt">Kontakt aufnehmen</a></div>
	</div>
</section>

<section id="kontakt" class="contact-section">
	<div class="section-wrap">
		<div use:reveal><h2 class="section-title">Kontakt</h2></div>
		<div class="contact-grid" use:reveal={{ group: true }}>
			<article class="contact-card">
				<Mail size={46} strokeWidth={1.7} aria-hidden="true" />
				<h3>E-Mail</h3>
				<p>Jederzeit.</p>
				<a href="mailto:emilian.scheel@gmail.com">emilian.scheel@gmail.com <span aria-hidden="true">›</span></a>
			</article>
			<article class="contact-card">
				<Phone size={46} strokeWidth={1.7} aria-hidden="true" />
				<h3>Telefon</h3>
				<p>Jederzeit oder schneller Rückruf.</p>
				<a href="tel:+4915257257750">0152 57257750 <span aria-hidden="true">›</span></a>
			</article>
			<article class="contact-card">
				<CalendarClock size={46} strokeWidth={1.7} aria-hidden="true" />
				<h3>Intro Call</h3>
				<p>60 Minuten für für alle Fragen. Unverbindlich.</p>
				<a href="/buchen">Termin auswählen <span aria-hidden="true">›</span></a>
			</article>
		</div>
	</div>
</section>

<section>
	<div class="section-wrap faq-wrap">
		<div use:reveal><h2 class="section-title">FAQ</h2></div>
		<Accordion.Root class="faq-list" type="multiple">
			{#each faqs as faq, index}
				<Accordion.Item class="faq-item" value={`faq-${index}`}>
					<Accordion.Header class="faq-header">
						<Accordion.Trigger class="faq-trigger">{faq.question}<span class="faq-symbol" aria-hidden="true"></span></Accordion.Trigger>
					</Accordion.Header>
					<Accordion.Content class="faq-answer"><div><p>{faq.answer}</p></div></Accordion.Content>
				</Accordion.Item>
			{/each}
		</Accordion.Root>
	</div>
</section>

<section class="closing">
	<div class="closing-inner" use:reveal>
		<h2 class="section-title">Was shippt Ihr Team an einem Tag?</h2>
		<a class="button-primary" href="/buchen">Hackathon planen</a>
	</div>
</section>
