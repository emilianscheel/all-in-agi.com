<script lang="ts">
	import { onMount } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { installGlobalHaptics } from '$lib/haptics';
	import { robotsDirective } from '$lib/seo';
	import GtmFooter from '$lib/GtmFooter.svelte';
	import { gtmPaths } from '$lib/gtm-pages';
	import '@fontsource/instrument-serif';
	import '../app.css';
	let { children, data } = $props();
	let presentationRoute = $derived(page.route.id === '/timer' || page.route.id === '/clock' || page.route.id === '/[id]/timer');
	let adminNavigation = $derived(page.route.id === '/dashboard' || (page.route.id === '/[id]' && data.admin.authorized));
	let gtmArticleRoute = $derived(gtmPaths.some((path) => path === page.url.pathname));
	let currentGtmSlug = $derived(gtmArticleRoute ? page.url.pathname.slice(1) : undefined);

	onMount(installGlobalHaptics);

	async function logout() {
		const { authClient } = await import('$lib/auth-client');
		await authClient.signOut();
		await invalidateAll();
		await goto('/dashboard');
	}
</script>

<svelte:head>
	<link rel="icon" href="/brand/all-in-agi-logo.png" type="image/png" sizes="512x512" />
	<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
	<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
	<meta name="robots" content={robotsDirective(page.url.pathname)} />
</svelte:head>

{#if !presentationRoute}
	<a class="skip-link" href="#main">Zum Inhalt springen</a>
	<header class:admin-header={adminNavigation} class="site-header">
	{#if adminNavigation}
		<nav class="nav-inner admin-nav-inner" aria-label="Admin-Navigation">
			<a class="brand-mark admin-brand-mark" href="/dashboard" aria-label="ALL IN AGI Dashboard">
				<span class="brand-icon" aria-hidden="true"><img src="/brand/all-in-agi-logo.png" alt="" width="512" height="512" /></span>
				<span class="brand-wordmark" aria-hidden="true">
					{#each [...'ALL IN AGI'] as character, index}
						<span class="brand-character" style={`--char-index: ${index}`}>{character === ' ' ? '\u00a0' : character}</span>
					{/each}
				</span>
			</a>
			<div class="admin-nav-links">
				<a class:active={page.route.id === '/dashboard'} href="/dashboard">Dashboard</a>
				<a href="/timer">Timer</a>
				<a href="/clock">Clock</a>
			</div>
			<div class="admin-nav-action">
				{#if data.admin.authenticated}<button class="nav-cta admin-logout" type="button" onclick={logout}>Logout</button>{/if}
			</div>
		</nav>
	{:else}
		<nav class="nav-inner" aria-label="Hauptnavigation">
			<a class="brand-mark" href="/" aria-label="ALL IN AGI Startseite">
				<span class="brand-icon" aria-hidden="true">
					<img src="/brand/all-in-agi-logo.png" alt="" width="512" height="512" />
				</span>
				<span class="brand-wordmark" aria-hidden="true">
					{#each [...'ALL IN AGI'] as character, index}
						<span class="brand-character" style={`--char-index: ${index}`}>{character === ' ' ? '\u00a0' : character}</span>
					{/each}
				</span>
			</a>
			<div class="nav-links">
				<a href="/#format">Agenda</a>
				<a href="/#preis">Preis</a>
				<a href="/#kontakt">Kontakt</a>
			</div>
			<a class="nav-cta" href="/buchen">Hackathon planen</a>
		</nav>
	{/if}
	</header>
{/if}

<main id="main" class:presentation-main={presentationRoute}>{@render children()}</main>

{#if !presentationRoute}
	{#if page.url.pathname === '/' || gtmArticleRoute}<GtmFooter currentSlug={currentGtmSlug} />{/if}
	<footer class="site-footer">
	<div class="footer-inner">
		<div class="footer-links">
			<a href="/impressum">Impressum</a>
			<a href="/agb">AGB</a>
			<a href="/datenschutz">Datenschutz</a>
			<a href="/verwalten">Buchung verwalten</a>
		</div>
	</div>
	</footer>
{/if}
