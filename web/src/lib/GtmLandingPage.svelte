<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { ArrowUp, Check, Link as LinkIcon, Mail, MessageCircle, Send } from 'lucide-svelte';
	import SeoHead from '$lib/SeoHead.svelte';
	import JsonLd from '$lib/JsonLd.svelte';
	import ClosingCta from '$lib/ClosingCta.svelte';
	import ProgressiveImage from '$lib/ProgressiveImage.svelte';
	import { gtmArticleSchema } from '$lib/gtm-article';
	import { GTM_HERO_IMAGES } from '$lib/gtm-images';
	import { getGtmPage } from '$lib/gtm-pages';
	import { SITE_ORIGIN } from '$lib/seo';
	import { page as pageState } from '$app/state';
	import { localizedPath, type Locale } from '$lib/i18n';

	let { slug }: { slug: string } = $props();
	let locale = $derived((pageState.data.locale ?? 'de') as Locale);
	let page = $derived(getGtmPage(slug, locale));
	let path = $derived(`/${page.slug}`);
	let canonicalUrl = $derived(`${SITE_ORIGIN}${localizedPath(locale, path)}`);
	let hero = $derived(GTM_HERO_IMAGES[page.heroImage]);
	let seoTitle = $derived(page.kind === 'editorial' ? page.seoTitle : page.title);
	let categoryLabel = $derived(locale === 'en' ? (page.kind === 'editorial' && page.blueprint ? 'Industry blueprint' : 'Insights') : (page.kind === 'editorial' && page.blueprint ? 'Branchen-Blueprint' : page.group));
	let modifiedAt = $derived(page.kind === 'editorial' ? page.dateModified : undefined);
	let sourceById = $derived(
		page.kind === 'editorial' ? new Map(page.sources.map((source) => [source.id, source])) : new Map()
	);
	let relatedPages = $derived(
		page.kind === 'editorial' ? page.relatedSlugs.map((relatedSlug) => getGtmPage(relatedSlug, locale)) : []
	);
	let publishedLabel = $derived(
		new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'de-DE', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			timeZone: 'UTC'
		}).format(new Date(`${page.publishedAt}T12:00:00Z`))
	);
	let linkedinUrl = $derived(
		`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonicalUrl)}`
	);
	let xUrl = $derived(
		`https://x.com/intent/post?url=${encodeURIComponent(canonicalUrl)}&text=${encodeURIComponent(page.title)}`
	);
	let whatsappUrl = $derived(
		`https://wa.me/?text=${encodeURIComponent(`${page.title}\n${canonicalUrl}`)}`
	);
	let telegramUrl = $derived(
		`https://t.me/share/url?url=${encodeURIComponent(canonicalUrl)}&text=${encodeURIComponent(page.title)}`
	);
	let emailUrl = $derived(
		`mailto:?subject=${encodeURIComponent(page.title)}&body=${encodeURIComponent(`${page.title}\n\n${canonicalUrl}`)}`
	);
	let copied = $state(false);
	let copyStatus = $state('');
	let showScrollTop = $state(false);
	let copyResetTimer: ReturnType<typeof setTimeout> | undefined;

	onMount(() => {
		let frame: number | undefined;

		function updateScrollButton() {
			frame = undefined;
			showScrollTop = window.scrollY > 480;
		}

		function scheduleScrollButtonUpdate() {
			if (frame !== undefined) return;
			frame = requestAnimationFrame(updateScrollButton);
		}

		window.addEventListener('scroll', scheduleScrollButtonUpdate, { passive: true });
		updateScrollButton();

		return () => {
			if (frame !== undefined) cancelAnimationFrame(frame);
			window.removeEventListener('scroll', scheduleScrollButtonUpdate);
		};
	});

	function scrollToTop() {
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
	}

	async function copyCanonicalLink(successMessage = 'Link kopiert') {
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
			copyStatus = successMessage;
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

	async function copyArticleLink() {
		await copyCanonicalLink();
	}

	async function shareToInstagram() {
		if (navigator.share) {
			try {
				await navigator.share({
					title: page.title,
					text: page.description,
					url: canonicalUrl
				});
				return;
			} catch (error) {
				if (error instanceof DOMException && error.name === 'AbortError') return;
			}
		}

		await copyCanonicalLink('Link für Instagram kopiert');
	}

	onDestroy(() => {
		if (copyResetTimer) clearTimeout(copyResetTimer);
	});

	let schema = $derived(gtmArticleSchema(page));

	let phases = $derived(locale === 'en' ? [
		{ title: 'Before the hackathon', paragraphs: ['A sponsor call and challenge-design session select three to eight tasks. Each one gets a named user, current workflow, available information, risk boundary, and visible success test.', 'A separate setup check confirms that accounts, tools, and access work before the event.'] },
		{ title: 'During the build day', paragraphs: ['After a short live demo, mixed teams spend at least 70 percent of the day building. Facilitators help with scope, coding agents, and blockers.', 'Product and domain experts keep the user in view, engineers own the technical path, and every team prepares a live, reproducible demonstration.'] },
		{ title: 'After demo day', paragraphs: ['Each prototype is recorded with its functional state, value hypothesis, known limitations, tool friction, and next owner.', 'Within ten business days, a follow-up separates results worth continuing from prerequisites and experiments that should deliberately end.'] }
	] : [
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
	]);
</script>

<SeoHead
	title={`${seoTitle} | ALL IN AGI`}
	socialTitle={page.title}
	description={page.description}
	{path}
	imageUrl={`${SITE_ORIGIN}${hero.src}`}
	imageAlt={locale === 'en' ? `Illustration for ${page.title}` : hero.alt}
	imageWidth={hero.width}
	imageHeight={hero.height}
	ogType="article"
	publishedAt={page.publishedAt}
	{modifiedAt}
	{locale}
/>

<JsonLd data={schema} />

<article class="article-page">
	<header class="article-header">
		<div class="article-heading">
			<p class="article-meta">
				<span>{categoryLabel}</span>
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
				<a
					class="share-button"
					href={xUrl}
					target="_blank"
					rel="noreferrer"
					aria-label="Auf X teilen"
					title="Auf X teilen"
				>
					<span class="x-mark" aria-hidden="true">X</span>
				</a>
				<button
					class="share-button"
					type="button"
					onclick={shareToInstagram}
					aria-label="Für Instagram teilen"
					title="Für Instagram teilen"
				>
					<svg class="brand-icon" viewBox="0 0 24 24" aria-hidden="true">
						<rect x="3" y="3" width="18" height="18" rx="5" />
						<circle cx="12" cy="12" r="4" />
						<circle class="brand-icon-dot" cx="17.4" cy="6.6" r="1.15" />
					</svg>
				</button>
				<a
					class="share-button"
					href={whatsappUrl}
					target="_blank"
					rel="noreferrer"
					aria-label="Über WhatsApp teilen"
					title="Über WhatsApp teilen"
				>
					<MessageCircle size={18} strokeWidth={1.8} aria-hidden="true" />
				</a>
				<a
					class="share-button"
					href={telegramUrl}
					target="_blank"
					rel="noreferrer"
					aria-label="Über Telegram teilen"
					title="Über Telegram teilen"
				>
					<Send size={18} strokeWidth={1.8} aria-hidden="true" />
				</a>
				<a class="share-button" href={emailUrl} aria-label="Per E-Mail teilen" title="Per E-Mail teilen">
					<Mail size={19} strokeWidth={1.8} aria-hidden="true" />
				</a>
				<button
					class="share-button"
					type="button"
					onclick={copyArticleLink}
					aria-label={copied ? 'Link kopiert' : 'Link kopieren'}
					title={copied ? 'Link kopiert' : 'Link kopieren'}
				>
					{#if copied}
						<Check size={19} strokeWidth={1.8} aria-hidden="true" />
					{:else}
						<LinkIcon size={19} strokeWidth={1.8} aria-hidden="true" />
					{/if}
				</button>
				<span class="share-status" aria-live="polite">{copyStatus}</span>
			</div>
		</div>
	</header>

	<figure class="article-hero">
		<ProgressiveImage
			class="article-hero-image"
			src={hero.src}
			placeholderSrc={hero.placeholderSrc}
			alt={locale === 'en' ? `Illustration for ${page.title}` : hero.alt}
			width={hero.width}
			height={hero.height}
		/>
		<figcaption>{locale === 'en' ? `${page.title} — ALL IN AGI` : hero.caption}</figcaption>
	</figure>

	<div class="article-body">
		{#if page.kind === 'offer'}
			<div>
				{#each page.lead as paragraph}<p>{paragraph}</p>{/each}
			</div>

			<section aria-labelledby="relevance-title">
				<h2 id="relevance-title">{page.relevanceTitle}</h2>
				{#each page.relevance as paragraph}<p>{paragraph}</p>{/each}
			</section>

			<section aria-labelledby="prototype-title">
				<h2 id="prototype-title">{locale === 'en' ? 'What your team can prototype' : 'Was Ihr Team prototypisch bauen kann'}</h2>
				<p>{locale === 'en' ? 'The final selection depends on your area and approved setup. Suitable challenges include:' : 'Die konkrete Auswahl richtet sich nach Ihrem Bereich und dem freigegebenen Setup. Geeignete Challenges sind unter anderem:'}</p>
				<ul>{#each page.challenges as challenge}<li>{challenge}</li>{/each}</ul>
			</section>

			<section aria-labelledby="activation-title">
				<h2 id="activation-title">{locale === 'en' ? 'Turning one day into an activation pilot' : 'So wird aus einem Tag ein Activation Pilot'}</h2>
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
				<ul>{#each page.audience as audience}<li>{audience}</li>{/each}</ul>
			</section>

			<section aria-labelledby="security-title">
				<h2 id="security-title">{locale === 'en' ? 'Tools, data, and security' : 'Tools, Daten und Security'}</h2>
				{#each page.security as paragraph}<p>{paragraph}</p>{/each}
			</section>

			<section aria-labelledby="outcome-title">
				<h2 id="outcome-title">{locale === 'en' ? 'What remains after the day' : 'Was nach dem Tag bleibt'}</h2>
				{#each page.outcome as paragraph}<p>{paragraph}</p>{/each}
				<p class="article-summary">
					{locale === 'en' ? 'ALL IN AGI facilitates the on-site hackathon for 15 to 50 people. The price includes two facilitators, challenge design, demo day, follow-up, and lunch. We determine the right scope in the preparation call based on the team, tool stack, and challenges.' : 'ALL IN AGI moderiert den Hackathon vor Ort für 15 bis 50 Personen. Im Preis enthalten sind zwei Facilitator, Challenge Design, Demo Day, Follow-up und Lunch. Der passende Umfang wird im Vorbereitungsgespräch anhand von Team, Tool-Stack und Challenges festgelegt.'}
				</p>
			</section>
		{:else}
			<p class="article-dek">{page.dek}</p>
			{#each page.sections as section, sectionIndex}
				<section aria-labelledby={`editorial-section-${sectionIndex}`}>
					<h2 id={`editorial-section-${sectionIndex}`}>{section.title}</h2>
					{#each section.paragraphs as paragraph}
						<p>
							{paragraph.text}
							{#each paragraph.sourceIds ?? [] as sourceId}
								{@const source = sourceById.get(sourceId)}
								{#if source}<a class="citation" href={`#source-${sourceId}`} aria-label={`Quelle: ${source.label}`}>[{page.sources.indexOf(source) + 1}]</a>{/if}
							{/each}
						</p>
					{/each}
					{#if section.bullets}
						<ul>
							{#each section.bullets as bullet}
								<li>
									{bullet.text}
									{#each bullet.sourceIds ?? [] as sourceId}
										{@const source = sourceById.get(sourceId)}
										{#if source}<a class="citation" href={`#source-${sourceId}`} aria-label={`Quelle: ${source.label}`}>[{page.sources.indexOf(source) + 1}]</a>{/if}
									{/each}
								</li>
							{/each}
						</ul>
					{/if}
				</section>
			{/each}

			<section aria-labelledby="related-title">
				<h2 id="related-title">{locale === 'en' ? 'Keep reading' : 'Weiterlesen'}</h2>
				<ul class="related-links">
					{#each relatedPages as related}<li><a href={localizedPath(locale, `/${related.slug}`)}>{related.footerLabel}</a></li>{/each}
				</ul>
			</section>

			<section class="article-sources" aria-labelledby="sources-title">
				<h2 id="sources-title">{locale === 'en' ? 'Sources' : 'Quellen'}</h2>
				<ol>
					{#each page.sources as source}
						<li id={`source-${source.id}`}>
							<a href={source.url} target="_blank" rel="noreferrer">{source.publisher}: {source.label}</a>
						</li>
					{/each}
				</ol>
			</section>
		{/if}
	</div>
</article>

<ClosingCta {locale} />

<button
	class="scroll-top-button"
	class:visible={showScrollTop}
	type="button"
	onclick={scrollToTop}
	aria-label="Zum Seitenanfang scrollen"
	aria-hidden={!showScrollTop}
	tabindex={showScrollTop ? 0 : -1}
	title="Zum Seitenanfang"
>
	<ArrowUp size={19} strokeWidth={1.9} aria-hidden="true" />
</button>

<style>
	.article-page {
		padding: clamp(72px, 8vw, 116px) 24px clamp(104px, 12vw, 164px);
		background: var(--page);
	}

	.article-header,
	.article-hero {
		width: min(100%, 1080px);
		margin-inline: auto;
	}

	.article-heading {
		width: min(100%, 800px);
		margin-inline: auto;
	}

	.article-meta {
		margin: 0 0 28px;
		display: grid;
		gap: 5px;
		color: var(--muted);
		font-size: 13px;
		font-weight: 600;
		line-height: 1.25;
	}

	.article-meta span {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: .075em;
		text-transform: uppercase;
	}

	h1 {
		max-width: 800px;
		margin: 0;
		font-size: clamp(38px, 4.25vw, 58px);
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
		gap: 12px;
	}

	.share-button {
		width: 28px;
		height: 32px;
		padding: 0;
		display: inline-grid;
		place-items: center;
		border: 0;
		background: transparent;
		color: var(--muted);
		transition: color .2s ease;
	}

	.share-button:hover {
		color: var(--ink);
	}

	.linkedin-mark {
		font-size: 15px;
		font-weight: 700;
		letter-spacing: -.06em;
		line-height: 1;
	}

	.x-mark {
		font-size: 14px;
		font-weight: 500;
		line-height: 1;
	}

	.brand-icon {
		width: 18px;
		height: 18px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.8;
	}

	.brand-icon-dot {
		fill: currentColor;
		stroke: none;
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

	.article-hero :global(.article-hero-image) {
		width: 100%;
		border-radius: 26px;
	}

	.article-hero figcaption {
		width: min(100% - 40px, 700px);
		margin: 16px auto 0;
		color: var(--muted);
		font-size: 12px;
		font-weight: 600;
		line-height: 1.35;
	}

	.article-body {
		width: min(100%, 700px);
		margin: 58px auto 0;
	}

	.article-body section {
		margin-top: 76px;
	}

	.article-body p,
	.article-body li {
		color: var(--ink);
		font-size: clamp(16px, 1.35vw, 18px);
		line-height: 1.56;
		letter-spacing: -.018em;
	}

	.article-body p {
		margin: 0;
	}

	.article-body p + p {
		margin-top: 28px;
	}

	.article-body .article-dek {
		font-size: clamp(20px, 1.8vw, 24px);
		font-weight: 600;
		line-height: 1.42;
		letter-spacing: -.028em;
	}

	.citation {
		margin-left: 4px;
		color: var(--orange);
		font-size: .72em;
		font-weight: 700;
		vertical-align: super;
	}

	.article-body h2,
	.article-body h3 {
		margin: 0 0 26px;
		font-size: clamp(22px, 2.35vw, 28px);
		line-height: 1.12;
		letter-spacing: -.04em;
		text-wrap: balance;
	}

	.article-body h3 {
		margin-bottom: 14px;
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

	.article-body .related-links a {
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 4px;
	}

	.article-sources {
		padding-top: 8px;
		border-top: 1px solid var(--line);
	}

	.article-sources ol {
		margin: 24px 0 0;
		padding-left: 22px;
	}

	.article-sources li {
		padding: 8px 0 8px 6px;
		border: 0;
		color: var(--muted);
		font-size: 14px;
		line-height: 1.45;
	}

	.article-sources li::before {
		display: none;
	}

	.article-sources a {
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 3px;
	}

	.article-summary {
		margin-top: 42px !important;
		padding-top: 34px;
		border-top: 1px solid var(--line);
		font-weight: 600;
	}

	.scroll-top-button {
		position: fixed;
		right: clamp(16px, 2.4vw, 32px);
		bottom: clamp(16px, 2.4vw, 32px);
		z-index: 45;
		width: 44px;
		height: 44px;
		padding: 0;
		display: grid;
		place-items: center;
		border: 0;
		border-radius: 50%;
		background: var(--surface);
		color: var(--muted);
		box-shadow: 0 5px 18px rgba(0, 0, 0, .1);
		opacity: 0;
		visibility: hidden;
		pointer-events: none;
		transform: translateY(8px);
		transition: opacity .24s ease, visibility .24s ease, transform .24s ease, color .2s ease;
	}

	.scroll-top-button.visible {
		opacity: 1;
		visibility: visible;
		pointer-events: auto;
		transform: translateY(0);
	}

	.scroll-top-button:hover {
		color: var(--ink);
	}

	@media (max-width: 640px) {
		.article-page {
			padding: 58px 20px 100px;
		}

		.article-meta {
			margin-bottom: 22px;
		}

		h1 {
			font-size: clamp(34px, 10vw, 44px);
		}

		.share-row {
			margin-top: 36px;
		}

		.article-hero {
			margin-top: 46px;
		}

		.article-hero :global(.article-hero-image) {
			min-height: 290px;
			border-radius: 20px;
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
			font-size: 16px;
			line-height: 1.58;
		}

	}
</style>
