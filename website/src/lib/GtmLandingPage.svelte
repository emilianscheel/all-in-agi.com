<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Check, Link as LinkIcon, Mail } from 'lucide-svelte';
	import SeoHead from '$lib/SeoHead.svelte';
	import JsonLd from '$lib/JsonLd.svelte';
	import ClosingCta from '$lib/ClosingCta.svelte';
	import { gtmArticleSchema } from '$lib/gtm-article';
	import { GTM_HERO_IMAGES } from '$lib/gtm-images';
	import { getGtmPage } from '$lib/gtm-pages';
	import { SITE_ORIGIN } from '$lib/seo';

	let { slug }: { slug: string } = $props();
	let page = $derived(getGtmPage(slug));
	let path = $derived(`/${page.slug}`);
	let canonicalUrl = $derived(`${SITE_ORIGIN}${path}`);
	let hero = $derived(GTM_HERO_IMAGES[page.heroImage]);
	let publishedLabel = $derived(
		new Intl.DateTimeFormat('de-DE', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			timeZone: 'UTC'
		}).format(new Date(`${page.publishedAt}T12:00:00Z`))
	);
	let linkedinUrl = $derived(
		`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonicalUrl)}`
	);
	let emailUrl = $derived(
		`mailto:?subject=${encodeURIComponent(page.title)}&body=${encodeURIComponent(`${page.title}\n\n${canonicalUrl}`)}`
	);
	let copied = $state(false);
	let copyStatus = $state('');
	let copyResetTimer: ReturnType<typeof setTimeout> | undefined;

	async function copyArticleLink() {
		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(canonicalUrl);
			} else {
				const input = document.createElement('textarea');
				input.value = canonicalUrl;
				input.setAttribute('readonly', '');
				input.style.position = 'fixed';
				input.style.opacity = '0';
				document.body.appendChild(input);
				input.select();
				if (!document.execCommand('copy')) throw new Error('Copy command failed');
				input.remove();
			}

			copied = true;
			copyStatus = 'Link kopiert';
			if (copyResetTimer) clearTimeout(copyResetTimer);
			copyResetTimer = setTimeout(() => {
				copied = false;
				copyStatus = '';
			}, 2400);
		} catch {
			copied = false;
			copyStatus = 'Link konnte nicht kopiert werden';
		}
	}

	onDestroy(() => {
		if (copyResetTimer) clearTimeout(copyResetTimer);
	});

	let schema = $derived(gtmArticleSchema(page));

	const phases = [
		{
			title: 'Vor dem Hackathon',
			paragraphs: [
				'In einem Sponsor Call und einer Challenge-Design-Session werden drei bis acht Aufgaben ausgewählt. Für jede Challenge klären wir Nutzer, aktuellen Workflow, vorhandene Informationen, Risiko, Prototype Boundary und einen sichtbaren Erfolgstest.',
				'Ein separater Setup-Check stellt sicher, dass Accounts, Tools und Zugänge am Eventtag funktionieren.'
			]
		},
		{
			title: 'Während des Build Days',
			paragraphs: [
				'Nach einer kurzen Live Demo arbeiten gemischte Teams mindestens 70 Prozent des Tages praktisch. Facilitator helfen beim Scope, bei der Nutzung aktueller Coding Agents und bei Blockaden.',
				'Product- und Domänenexpertinnen halten den Nutzer im Blick, Engineers verantworten den technischen Pfad und alle Teams bereiten eine live nachvollziehbare Demo vor.'
			]
		},
		{
			title: 'Nach dem Demo Day',
			paragraphs: [
				'Jeder Prototype wird mit Funktionsstand, Nutzenhypothese, bekannten Grenzen, Tool-Reibung und einem nächsten Eigentümer festgehalten.',
				'Innerhalb von zehn Arbeitstagen folgt ein kurzer Termin, um weiterführbare Ergebnisse, notwendige Vorarbeiten und bewusst abgeschlossene Experimente voneinander zu trennen.'
			]
		}
	];
</script>

<SeoHead
	title={`${page.title} | ALL IN AGI`}
	description={page.description}
	{path}
	imageUrl={`${SITE_ORIGIN}${hero.src}`}
	imageAlt={hero.alt}
	imageWidth={hero.width}
	imageHeight={hero.height}
	ogType="article"
	publishedAt={page.publishedAt}
/>

<JsonLd data={schema} />

<article class="article-page">
	<header class="article-header">
		<div class="article-heading">
			<p class="article-meta">
				<span>{page.group}</span>
				<time datetime={page.publishedAt}>{publishedLabel}</time>
			</p>
			<h1>{page.title}</h1>
			<div class="share-row" aria-label="Artikel teilen">
				<a
					class="share-button"
					href={linkedinUrl}
					target="_blank"
					rel="noreferrer"
					aria-label="Auf LinkedIn teilen"
					title="Auf LinkedIn teilen"
				>
					<span class="linkedin-mark" aria-hidden="true">in</span>
				</a>
				<a class="share-button" href={emailUrl} aria-label="Per E-Mail teilen" title="Per E-Mail teilen">
					<Mail size={22} strokeWidth={1.8} aria-hidden="true" />
				</a>
				<button
					class="share-button"
					type="button"
					onclick={copyArticleLink}
					aria-label={copied ? 'Link kopiert' : 'Link kopieren'}
					title={copied ? 'Link kopiert' : 'Link kopieren'}
				>
					{#if copied}
						<Check size={22} strokeWidth={1.8} aria-hidden="true" />
					{:else}
						<LinkIcon size={22} strokeWidth={1.8} aria-hidden="true" />
					{/if}
				</button>
				<span class="share-status" aria-live="polite">{copyStatus}</span>
			</div>
		</div>
	</header>

	<figure class="article-hero">
		<img
			src={hero.src}
			alt={hero.alt}
			width={hero.width}
			height={hero.height}
			fetchpriority="high"
			decoding="async"
		/>
		<figcaption>{hero.caption}</figcaption>
	</figure>

	<div class="article-body">
		<div class="article-lead">
			{#each page.lead as paragraph}
				<p>{paragraph}</p>
			{/each}
		</div>

		<section aria-labelledby="relevance-title">
			<h2 id="relevance-title">{page.relevanceTitle}</h2>
			{#each page.relevance as paragraph}<p>{paragraph}</p>{/each}
		</section>

		<section aria-labelledby="prototype-title">
			<h2 id="prototype-title">Was Ihr Team prototypisch bauen kann</h2>
			<p>Die konkrete Auswahl richtet sich nach Ihrem Bereich und dem freigegebenen Setup. Geeignete Challenges sind unter anderem:</p>
			<ul>
				{#each page.challenges as challenge}<li>{challenge}</li>{/each}
			</ul>
		</section>

		<section aria-labelledby="activation-title">
			<h2 id="activation-title">So wird aus einem Tag ein Activation Pilot</h2>
			{#each phases as phase}
				<div class="article-subsection">
					<h3>{phase.title}</h3>
					{#each phase.paragraphs as paragraph}<p>{paragraph}</p>{/each}
				</div>
			{/each}
		</section>

		<section aria-labelledby="audience-title">
			<h2 id="audience-title">{page.audienceTitle}</h2>
			<p>{page.audienceIntro}</p>
			<ul>
				{#each page.audience as audience}<li>{audience}</li>{/each}
			</ul>
		</section>

		<section aria-labelledby="security-title">
			<h2 id="security-title">Tools, Daten und Security</h2>
			{#each page.security as paragraph}<p>{paragraph}</p>{/each}
		</section>

		<section aria-labelledby="outcome-title">
			<h2 id="outcome-title">Was nach dem Tag bleibt</h2>
			{#each page.outcome as paragraph}<p>{paragraph}</p>{/each}
			<p class="article-summary">
				ALL IN AGI moderiert den Hackathon vor Ort für 15 bis 50 Personen. Im Preis enthalten sind
				zwei Facilitator, Challenge Design, Demo Day, Follow-up und Lunch. Der passende Umfang wird
				im Vorbereitungsgespräch anhand von Team, Tool-Stack und Challenges festgelegt.
			</p>
		</section>
	</div>
</article>

<ClosingCta />

<style>
	.article-page {
		padding: clamp(72px, 8vw, 116px) 24px clamp(104px, 12vw, 164px);
		background: var(--page);
	}

	.article-header,
	.article-hero {
		width: min(100%, 1180px);
		margin-inline: auto;
	}

	.article-heading {
		width: min(100%, 900px);
		margin-inline: auto;
	}

	.article-meta {
		margin: 0 0 28px;
		display: grid;
		gap: 5px;
		color: var(--muted);
		font-size: 15px;
		font-weight: 600;
		line-height: 1.25;
	}

	.article-meta span {
		font-size: 13px;
		font-weight: 700;
		letter-spacing: .075em;
		text-transform: uppercase;
	}

	h1 {
		max-width: 900px;
		margin: 0;
		font-size: clamp(48px, 6.2vw, 82px);
		font-weight: 700;
		line-height: .99;
		letter-spacing: -.058em;
		text-wrap: balance;
	}

	.share-row {
		position: relative;
		margin-top: 52px;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.share-button {
		width: 42px;
		height: 42px;
		padding: 0;
		display: inline-grid;
		place-items: center;
		border: 0;
		border-radius: 50%;
		background: var(--surface);
		color: var(--muted);
		transition: color .2s ease, transform .2s ease, background .2s ease;
	}

	.share-button:hover {
		color: var(--ink);
		transform: translateY(-1px);
	}

	.linkedin-mark {
		font-size: 18px;
		font-weight: 700;
		letter-spacing: -.06em;
		line-height: 1;
	}

	.share-status {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.article-hero {
		margin-top: 66px;
	}

	.article-hero img {
		width: 100%;
		height: auto;
		aspect-ratio: 2400 / 1619;
		border-radius: 26px;
		object-fit: cover;
		background: var(--surface);
	}

	.article-hero figcaption {
		width: min(100% - 40px, 760px);
		margin: 16px auto 0;
		color: var(--muted);
		font-size: 13px;
		font-weight: 600;
		line-height: 1.35;
	}

	.article-body {
		width: min(100%, 760px);
		margin: 58px auto 0;
	}

	.article-body section {
		margin-top: 76px;
	}

	.article-body p,
	.article-body li {
		color: var(--ink);
		font-size: clamp(18px, 1.65vw, 21px);
		line-height: 1.56;
		letter-spacing: -.018em;
	}

	.article-body p {
		margin: 0;
	}

	.article-body p + p {
		margin-top: 28px;
	}

	.article-lead p {
		font-size: clamp(21px, 2vw, 25px);
		line-height: 1.48;
		letter-spacing: -.025em;
	}

	.article-body h2 {
		margin: 0 0 26px;
		font-size: clamp(32px, 4vw, 45px);
		line-height: 1.08;
		letter-spacing: -.045em;
		text-wrap: balance;
	}

	.article-body h3 {
		margin: 0 0 14px;
		font-size: clamp(23px, 2.5vw, 29px);
		line-height: 1.18;
		letter-spacing: -.035em;
	}

	.article-subsection {
		margin-top: 42px;
	}

	.article-body ul {
		margin: 30px 0 0;
		padding: 0;
		list-style: none;
		border-top: 1px solid var(--soft-line);
	}

	.article-body li {
		position: relative;
		padding: 18px 0 18px 28px;
		border-bottom: 1px solid var(--soft-line);
	}

	.article-body li::before {
		content: '';
		position: absolute;
		left: 2px;
		top: 31px;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--orange);
	}

	.article-summary {
		margin-top: 42px !important;
		padding-top: 34px;
		border-top: 1px solid var(--line);
		font-weight: 600;
	}

	@media (max-width: 640px) {
		.article-page {
			padding: 58px 20px 100px;
		}

		.article-meta {
			margin-bottom: 22px;
		}

		h1 {
			font-size: clamp(42px, 13vw, 58px);
		}

		.share-row {
			margin-top: 36px;
		}

		.article-hero {
			margin-top: 46px;
		}

		.article-hero img {
			min-height: 290px;
			border-radius: 20px;
			object-position: center;
		}

		.article-hero figcaption {
			width: 100%;
			margin-top: 12px;
		}

		.article-body {
			margin-top: 44px;
		}

		.article-body section {
			margin-top: 60px;
		}

		.article-body p,
		.article-body li {
			font-size: 17px;
			line-height: 1.58;
		}

		.article-lead p {
			font-size: 20px;
		}
	}
</style>
