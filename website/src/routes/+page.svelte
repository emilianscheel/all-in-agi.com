<script lang="ts">
	import { reveal } from '$lib/motion';

	const schema = {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: 'WERKSPRUNG',
		description: 'AI Coding Hackathons für etablierte Unternehmen in Deutschland.',
		url: 'https://werksprung.de'
	};
</script>

<svelte:head>
	<title>WERKSPRUNG — AI Coding Hackathons</title>
	<meta name="description" content="Ein Tag, an dem Ihr Team aktuelle AI Coding Tools kennenlernt, echte Challenges löst und funktionierende Prototypen shippt." />
	<meta property="og:title" content="WERKSPRUNG — AI Coding Hackathons" />
	<meta property="og:description" content="From prompt to prototype. In one day." />
	<meta property="og:image" content="/images/werksprung-event.webp" />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<script type="application/ld+json">{JSON.stringify(schema)}</script>
</svelte:head>

<section class="hero">
	<div class="hero-copy" use:reveal>
		<p class="eyebrow">Agentic Engineering Hackathon</p>
		<h1 class="display-title">Build what’s next.</h1>
		<p class="lede">Ihr Team entdeckt AI Coding Agents und moderne Dev Workflows, löst echte Challenges und shippt funktionierende Prototypen.</p>
		<div class="hero-actions">
			<a class="button-primary" href="/buchen">Hackathon planen</a>
			<a class="button-secondary" href="#format">Format ansehen</a>
		</div>
	</div>
	<div class="hero-image">
		<img src="/images/werksprung-event.webp" alt="Team arbeitet gemeinsam an einem Hackathon-Projekt" fetchpriority="high" />
	</div>
</section>

<section id="format" class="manifesto">
	<div class="section-wrap compact-copy" use:reveal>
		<h2 class="section-title">Ein Tag. Echte Use Cases.<br />Live Demos am Abend.</h2>
		<p class="section-subtitle">Kein Slide Deck-Marathon. Nach einer kurzen Live Demo geht es direkt in den Build Sprint.</p>
	</div>
</section>

<section class="feature-stage" aria-labelledby="tools-title">
	<div class="feature-stage-inner" use:reveal={{ group: true }}>
		<div>
			<p class="eyebrow">Hands-on by design</p>
			<h2 id="tools-title" class="section-title">Neue Tools werden<br />durch Bauen verständlich.</h2>
			<p>Teams erleben AI Coding Agents, Agentic Workflows und Rapid Prototyping direkt an Problemen aus dem eigenen Unternehmen.</p>
		</div>
		<div class="tool-line" aria-label="Themenschwerpunkte">
			<span>AI Coding Agents</span><span>Agentic Workflows</span><span>Rapid Prototyping</span><span>Demo Day</span>
		</div>
		<div class="metric-row">
			<div class="metric"><b>70%</b><span>Build Time</span></div>
			<div class="metric"><b>1 Tag</b><span>Challenge bis Prototype</span></div>
			<div class="metric"><b>3–10</b><span>interdisziplinäre Teams</span></div>
		</div>
	</div>
</section>

<section id="ablauf" class="agenda">
	<div class="section-wrap">

		<div class="agenda-grid agenda-grid-four" use:reveal={{ group: true }}>
			<article class="agenda-card"><span class="time">09:00</span><h3>Kickoff</h3><p>Live Demo, Tool Stack, Teams und Challenges.</p></article>
			<article class="agenda-card"><span class="time">10:00</span><h3>Build Sprint</h3><p>Von Problem und User Flow zum ersten Working Prototype.</p></article>
			<article class="agenda-card"><span class="time">12:30</span><h3>Pizza & Iterate</h3><p>Gemeinsamer Lunch, Feedback und zweiter Build Sprint.</p></article>
			<article class="agenda-card"><span class="time">16:30</span><h3>Live Demo</h3><p>Problem, Lösung, How its used and build</p></article>
		</div>
	</div>
</section>

<section id="ergebnis">
	<div class="section-wrap">
		<div use:reveal>
			<h2 class="section-title">Am Ende läuft etwas.</h2>
		</div>
		<div class="outcomes-grid" use:reveal={{ group: true }}>
			<article class="outcome"><span class="outcome-index">1</span><h3>Working Prototypes</h3><p>Greifbare Lösungen für reale Use Cases.</p></article>
			<article class="outcome"><span class="outcome-index">2</span><h3>AI Champions</h3><p>Kolleg:innen mit eigener Build Experience.</p></article>
			<article class="outcome"><span class="outcome-index">3</span><h3>Next Steps</h3><p>Priorisierte Ideen für den nächsten Sprint.</p></article>
		</div>
	</div>
</section>

<section id="preis" class="pricing">
	<div class="section-wrap">

		<div class="pricing-grid" use:reveal={{ group: true }}>
			<article class="price-card"><h3>Bis 15 Personen</h3><strong>3.000 €</strong><span>netto</span><ul><li>1 Facilitator</li><li>Challenge Design</li><li>Demo Day & Follow-up</li></ul></article>
			<article class="price-card featured"><span class="tag">Most popular</span><h3>Bis 30 Personen</h3><strong>4.500 €</strong><span>netto</span><ul><li>2 Facilitators</li><li>Challenge Design</li><li>Demo Day & Follow-up</li></ul></article>
			<article class="price-card"><h3>Bis 50 Personen</h3><strong>6.500 €</strong><span>netto</span><ul><li>3 Facilitators</li><li>Challenge Design</li><li>Demo Day & Follow-up</li></ul></article>
		</div>
		<div class="section-action"><a class="button-primary" href="/buchen">Hackathon planen</a></div>
	</div>
</section>

<section>
	<div class="section-wrap faq-wrap">
		<div use:reveal><h2 class="section-title">FAQ</h2></div>
		<div class="faq-list">
			<details><summary>Müssen alle coden können?</summary><p>Nein. Engineering, Product und Fachbereiche arbeiten gemeinsam. Wir schneiden die Challenges auf verschiedene Skill Levels zu.</p></details>
			<details><summary>Welche Tools nutzt ihr?</summary><p>Aktuelle AI Coding Agents und Dev Tools, abgestimmt auf Ihre IT- und Security-Vorgaben. Den konkreten Tool Stack legen wir im Prep Call fest.</p></details>
			<details><summary>Wie bleiben Daten geschützt?</summary><p>Tools, Zugänge und Datenklassen werden vorab mit IT und Security geklärt. Gebaut wird nur in der vereinbarten Umgebung.</p></details>
			<details><summary>Was braucht es vor Ort?</summary><p>Einen großen Raum, stabiles WLAN und motivierte Builder. Fehlende Präsentationstechnik bringen wir mit.</p></details>
		</div>
	</div>
</section>

<section class="closing">
	<div class="closing-inner" use:reveal>
		<h2 class="section-title">Was shippt Ihr Team an einem Tag?</h2>
		<a class="button-primary" href="/buchen">Hackathon planen</a>
	</div>
</section>
