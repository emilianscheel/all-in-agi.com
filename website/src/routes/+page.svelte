<script lang="ts">
	import { onMount } from 'svelte';
	import { CalendarClock, Lightbulb, Mail, MapPin, Phone, Pizza, Presentation, Users } from 'lucide-svelte';
	import { Accordion } from 'bits-ui';
	import { CODING_TOOLS } from '$lib/booking';
	import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from '$lib/contact';
	import { reveal } from '$lib/motion';
	import SeoHead from '$lib/SeoHead.svelte';

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
		'@graph': [
			{
				'@type': 'Organization',
				'@id': 'https://all-in-agi.com/#organization',
				name: 'ALL IN AGI',
				description: 'Agentic Engineering Hackathons für etablierte Unternehmen in Deutschland.',
				url: 'https://all-in-agi.com',
				logo: 'https://all-in-agi.com/brand/all-in-agi-logo.png',
				email: CONTACT_EMAIL,
				telephone: CONTACT_PHONE_HREF
			},
			{
				'@type': 'WebSite',
				'@id': 'https://all-in-agi.com/#website',
				url: 'https://all-in-agi.com',
				name: 'ALL IN AGI',
				inLanguage: 'de-DE',
				publisher: { '@id': 'https://all-in-agi.com/#organization' }
			},
			{
				'@type': 'Service',
				'@id': 'https://all-in-agi.com/#agentic-engineering-hackathon',
				name: 'Agentic Engineering Hackathon',
				serviceType: 'Moderierter Agentic Engineering Hackathon für Unternehmen',
				description: 'Teams entwickeln an einem Tag gemeinsam einen funktionierenden Prototyp mit aktuellen KI-Entwicklerwerkzeugen.',
				areaServed: { '@type': 'Country', name: 'Deutschland' },
				provider: { '@id': 'https://all-in-agi.com/#organization' },
				url: 'https://all-in-agi.com/'
			}
		]
	};

	onMount(() => {
		const heroCopy = document.querySelector<HTMLElement>('.hero-copy');
		const root = document.documentElement;
		let frame: number | undefined;

		function updateMobileNavCta() {
			frame = undefined;
			root.classList.toggle('mobile-nav-cta-visible', Boolean(heroCopy && heroCopy.getBoundingClientRect().bottom <= 44));
		}

		function scheduleMobileNavCtaUpdate() {
			if (frame !== undefined) return;
			frame = requestAnimationFrame(updateMobileNavCta);
		}

		window.addEventListener('scroll', scheduleMobileNavCtaUpdate, { passive: true });
		window.addEventListener('resize', scheduleMobileNavCtaUpdate, { passive: true });
		updateMobileNavCta();

		return () => {
			if (frame !== undefined) cancelAnimationFrame(frame);
			window.removeEventListener('scroll', scheduleMobileNavCtaUpdate);
			window.removeEventListener('resize', scheduleMobileNavCtaUpdate);
			root.classList.remove('mobile-nav-cta-visible');
		};
	});
</script>

<SeoHead
	title="Agentic Engineering Hackathon für Unternehmen | ALL IN AGI"
	description="Ihr Team baut in einem Tag einen funktionierenden Prototyp mit aktuellen Coding Agents – als moderierter Hackathon vor Ort in Deutschland."
	path="/"
/>

<svelte:head><script type="application/ld+json">{JSON.stringify(schema)}</script></svelte:head>

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
		<h2 id="manifesto-title">Keine weitere Fortbildung</h2>
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
				<h2 id="adoption-gap-title">Let's do it</h2>
			<p class="adoption-gap-conclusion">
				Der beste Weg, die Adaptionslücke zu schließen: ein Hackathon, bei dem das Team gemeinsam
				baut und ausprobiert.
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
			<article class="agenda-card"><span class="time">16:30</span><h3>Demo Session</h3><p>Problem, Lösung, How its used and build</p></article>
		</div>
	</div>
</section>

<section id="preis" class="pricing">
	<div class="section-wrap">

		<div class="pricing-grid" use:reveal={{ group: true }}>
			<article class="price-card"><h3>Bis 15 Personen</h3><strong>4.000 €</strong><span>netto</span><ul><li><Users size={17} />2 Facilitator</li><li><Lightbulb size={17} />Challenge Design</li><li><Presentation size={17} />Demo Session & Follow-up</li><li><Pizza size={17} />Pizza & Cookies</li><li><MapPin size={17} />Vor Ort oder organisierte Location</li></ul></article>
			<article class="price-card featured"><span class="tag">Most popular</span><h3>Bis 30 Personen</h3><strong>5.000 €</strong><span>netto</span><ul><li><Users size={17} />2 Facilitators</li><li><Lightbulb size={17} />Challenge Design</li><li><Presentation size={17} />Demo Session & Follow-up</li><li><Pizza size={17} />Pizza & Cookies</li><li><MapPin size={17} />Vor Ort oder organisierte Location</li></ul></article>
			<article class="price-card"><h3>Bis 50 Personen</h3><strong>6.000 €</strong><span>netto</span><ul><li><Users size={17} />2 Facilitators</li><li><Lightbulb size={17} />Challenge Design</li><li><Presentation size={17} />Demo Session & Follow-up</li><li><Pizza size={17} />Pizza & Cookies</li><li><MapPin size={17} />Vor Ort oder organisierte Location</li></ul></article>
		</div>
		<div class="section-action"><a class="button-primary" href="/buchen">Hackathon planen</a><a class="button-secondary" href="#kontakt">Kontakt aufnehmen</a></div>
	</div>
</section>

<section id="kontakt" class="contact-section">
	<div class="section-wrap">
		<div use:reveal><h2 class="section-title">Kontakt</h2></div>
		<div class="team-profiles" use:reveal={{ group: true }} aria-label="Ihre Ansprechpartner">
			<article class="team-profile">
				<img src="/images/team/maddox-sciuchetti.jpg" alt="Maddox Sciuchetti" width="40" height="40" loading="lazy" decoding="async" />
				<div class="team-profile-details">
					<h3>Maddox Sciuchetti</h3>
					<div class="team-profile-links">
						<a href="https://github.com/MaddoxSciuchetti" target="_blank" rel="noreferrer" aria-label="GitHub-Profil von Maddox Sciuchetti" title="GitHub">
							<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.1-.75.4-1.26.74-1.55-2.57-.3-5.27-1.28-5.27-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.16 1.18A11 11 0 0 1 12 6.12c.98 0 1.95.13 2.87.39 2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.71 5.39-5.29 5.68.42.36.78 1.06.78 2.14v3.26c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" /></svg>
						</a>
						<a href="https://www.linkedin.com/in/maddoxsciuchetti/" target="_blank" rel="noreferrer" aria-label="LinkedIn-Profil von Maddox Sciuchetti" title="LinkedIn">
							<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V8.98h3.42v1.57h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.29ZM5.32 7.41a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.04H3.54V8.98H7.1v11.47ZM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0Z" /></svg>
						</a>
					</div>
				</div>
			</article>
			<article class="team-profile">
				<img src="/images/team/emilian-scheel.jpg" alt="Emilian Scheel" width="40" height="40" loading="lazy" decoding="async" />
				<div class="team-profile-details">
					<h3>Emilian Scheel</h3>
					<div class="team-profile-links">
						<a href="https://github.com/emilianscheel" target="_blank" rel="noreferrer" aria-label="GitHub-Profil von Emilian Scheel" title="GitHub">
							<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.1-.75.4-1.26.74-1.55-2.57-.3-5.27-1.28-5.27-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.16 1.18A11 11 0 0 1 12 6.12c.98 0 1.95.13 2.87.39 2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.71 5.39-5.29 5.68.42.36.78 1.06.78 2.14v3.26c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" /></svg>
						</a>
						<a href="https://www.linkedin.com/in/emilianscheel" target="_blank" rel="noreferrer" aria-label="LinkedIn-Profil von Emilian Scheel" title="LinkedIn">
							<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V8.98h3.42v1.57h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.29ZM5.32 7.41a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.04H3.54V8.98H7.1v11.47ZM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0Z" /></svg>
						</a>
					</div>
				</div>
			</article>
		</div>
		<div class="contact-grid" use:reveal={{ group: true }}>
			<article class="contact-card">
				<Mail size={46} strokeWidth={1.7} aria-hidden="true" />
				<h3>E-Mail</h3>
				<p>Jederzeit.</p>
				<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL} <span aria-hidden="true">›</span></a>
			</article>
			<article class="contact-card">
				<Phone size={46} strokeWidth={1.7} aria-hidden="true" />
				<h3>Telefon</h3>
				<p>Jederzeit oder schneller Rückruf.</p>
				<a href={`tel:${CONTACT_PHONE_HREF}`}>{CONTACT_PHONE_DISPLAY} <span aria-hidden="true">›</span></a>
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
