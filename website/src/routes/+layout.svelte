<script lang="ts">
	import { onMount } from 'svelte';
	import { installGlobalHaptics } from '$lib/haptics';
	import '@fontsource/instrument-serif';
	import '../app.css';
	let { children } = $props();

	onMount(installGlobalHaptics);
</script>

<svelte:head>
	<link rel="icon" href="/brand/all-in-agi-logo.png" type="image/png" sizes="512x512" />
	<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
	<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
</svelte:head>

<a class="skip-link" href="#main">Zum Inhalt springen</a>
<header class="site-header">
	<nav class="nav-inner" aria-label="Hauptnavigation">
		<a class="brand-mark" href="/" aria-label="ALL-IN-AGI Startseite">
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
</header>

<main id="main">{@render children()}</main>

<footer class="site-footer">
	<div class="footer-inner">
		<div class="footer-links">
			<a href="/impressum">Impressum</a>
			<a href="/datenschutz">Datenschutz</a>
			<a href="/verwalten">Buchung verwalten</a>
		</div>
	</div>
</footer>
