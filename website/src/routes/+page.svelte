<script lang="ts">
	import { CalendarClock, CircleMinus, Lightbulb, Mail, Phone, Pizza, Presentation, Users, Utensils } from 'lucide-svelte';
	import { Accordion } from 'bits-ui';
	import { reveal } from '$lib/motion';

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
		name: 'WERKSPRUNG',
		description: 'Agentic Engineering Hackathons für etablierte Unternehmen in Deutschland.',
		url: 'https://werksprung.de'
	};
</script>

<svelte:head>
	<title>Agentic Engineering Hackathon</title>
	<meta name="description" content="Lassen Sie Ihr Team die neuen Möglichkeiten von Coding Agents Hands-on erleben und mit einem Projekt kennenlernen" />
	<meta property="og:title" content="Agentic Engineering Hackathon" />
	<meta property="og:description" content="From prompt to prototype. In one day." />
	<meta property="og:image" content="/images/werksprung-event.webp" />
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
		<img src="/images/werksprung-event.webp" alt="Team arbeitet gemeinsam an einem Hackathon-Projekt" fetchpriority="high" />
	</div>
</section>

<section id="format" class="agenda">
	<div class="section-wrap">

		<div class="agenda-grid agenda-grid-four" use:reveal={{ group: true }}>
			<article class="agenda-card"><span class="time">09:00</span><h3>Kickoff</h3><p>Live Demo, Tool Stack, Teams und Challenges.</p></article>
			<article class="agenda-card"><span class="time">09:30</span><h3>Build Sprint</h3><p>Von Problem und User Flow zum ersten Working Prototype.</p></article>
			<article class="agenda-card"><span class="time">13:00</span><h3>Pizza & Iterate</h3><p>Gemeinsamer Lunch, Feedback und zweiter Build Sprint.</p></article>
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
