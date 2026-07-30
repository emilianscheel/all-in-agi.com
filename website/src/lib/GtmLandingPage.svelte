<script lang="ts">
	import SeoHead from '$lib/SeoHead.svelte';
	import JsonLd from '$lib/JsonLd.svelte';
	import { getGtmPage } from '$lib/gtm-pages';
	import { SITE_ORIGIN } from '$lib/seo';

	let { slug }: { slug: string } = $props();
	let page = $derived(getGtmPage(slug));
	let path = $derived(`/${page.slug}`);

	let schema = $derived({
		'@context': 'https://schema.org',
		'@type': 'Service',
		name: page.title,
		description: page.description,
		serviceType: 'Agentic Engineering Hackathon für Unternehmen',
		inLanguage: 'de-DE',
		url: `${SITE_ORIGIN}${path}`,
		areaServed: {
			'@type': 'Country',
			name: 'Deutschland'
		},
		provider: {
			'@type': 'Organization',
			'@id': `${SITE_ORIGIN}/#organization`,
			name: 'ALL IN AGI',
			url: SITE_ORIGIN
		},
		audience: {
			'@type': 'BusinessAudience',
			audienceType: 'Engineering-, Product-, Digital- und Fachverantwortliche in etablierten Unternehmen'
		}
	});

	const phases = [
		{
			title: 'Vor dem Hackathon',
			text: 'In einem Sponsor Call und einer Challenge-Design-Session werden drei bis acht Aufgaben ausgewählt. Für jede Challenge klären wir Nutzer, aktuellen Workflow, vorhandene Informationen, Risiko, Prototype Boundary und einen sichtbaren Erfolgstest. Ein separater Setup-Check stellt sicher, dass Accounts, Tools und Zugänge am Eventtag funktionieren.'
		},
		{
			title: 'Während des Build Days',
			text: 'Nach einer kurzen Live Demo arbeiten gemischte Teams mindestens 70 Prozent des Tages praktisch. Facilitator helfen beim Scope, bei der Nutzung aktueller Coding Agents und bei Blockaden. Product- und Domänenexpertinnen halten den Nutzer im Blick, Engineers verantworten den technischen Pfad und alle Teams bereiten eine live nachvollziehbare Demo vor.'
		},
		{
			title: 'Nach dem Demo Day',
			text: 'Jeder Prototype wird mit Funktionsstand, Nutzenhypothese, bekannten Grenzen, Tool-Reibung und einem nächsten Eigentümer festgehalten. Innerhalb von zehn Arbeitstagen folgt ein kurzer Termin, um weiterführbare Ergebnisse, notwendige Vorarbeiten und bewusst abgeschlossene Experimente voneinander zu trennen.'
		}
	];
</script>

<SeoHead title={`${page.title} | ALL IN AGI`} description={page.description} {path} />

<JsonLd data={schema} />

<div class="simple-page gtm-page">
	<article class="simple-card gtm-card">
		<h1>{page.title}</h1>
		{#each page.lead as paragraph}
			<p class="gtm-lead">{paragraph}</p>
		{/each}

		<h2>{page.relevanceTitle}</h2>
		{#each page.relevance as paragraph}
			<p>{paragraph}</p>
		{/each}

		<h2>Was Ihr Team prototypisch bauen kann</h2>
		<p>
			Die konkrete Auswahl richtet sich nach Ihrem Bereich und dem freigegebenen Setup. Geeignete
			Challenges sind unter anderem:
		</p>
		<ul class="gtm-list">
			{#each page.challenges as challenge}
				<li>{challenge}</li>
			{/each}
		</ul>

		<h2>So wird aus einem Tag ein Activation Pilot</h2>
		{#each phases as phase}
			<h3>{phase.title}</h3>
			<p>{phase.text}</p>
		{/each}

		<h2>{page.audienceTitle}</h2>
		<p>{page.audienceIntro}</p>
		<ul class="gtm-list">
			{#each page.audience as audience}
				<li>{audience}</li>
			{/each}
		</ul>

		<h2>Tools, Daten und Security</h2>
		{#each page.security as paragraph}
			<p>{paragraph}</p>
		{/each}

		<h2>Was nach dem Tag bleibt</h2>
		{#each page.outcome as paragraph}
			<p>{paragraph}</p>
		{/each}

		<p>
			ALL IN AGI moderiert den Hackathon vor Ort für 15 bis 50 Personen. Im Preis enthalten sind
			zwei Facilitator, Challenge Design, Demo Day, Follow-up und Lunch. Der passende Umfang wird
			im Vorbereitungsgespräch anhand von Team, Tool-Stack und Challenges festgelegt.
		</p>

		<div class="gtm-page-action">
			<a class="button-primary" href="/buchen">Hackathon planen</a>
		</div>
	</article>
</div>

<style>
	.gtm-card {
		max-width: 860px;
	}

	.gtm-card h1 {
		line-height: 1.02;
	}

	.gtm-card h3 {
		margin: 28px 0 8px;
		font-size: 17px;
		line-height: 1.35;
	}

	.gtm-card p,
	.gtm-card li {
		font-size: 17px;
	}

	.gtm-lead {
		color: var(--secondary-ink) !important;
		font-size: 19px !important;
	}

	.gtm-card h1 + .gtm-lead {
		margin-top: 28px;
	}

	.gtm-list {
		margin: 16px 0 0;
		padding-left: 22px;
	}

	.gtm-list li + li {
		margin-top: 9px;
	}

	.gtm-page-action {
		margin-top: 40px;
	}

	@media (max-width: 640px) {
		.gtm-card p,
		.gtm-card li {
			font-size: 16px;
		}

		.gtm-lead {
			font-size: 17px !important;
		}

		.gtm-page-action .button-primary {
			width: 100%;
		}
	}
</style>
