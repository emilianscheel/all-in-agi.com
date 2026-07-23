<script lang="ts">
	import { Binoculars } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { installGlobalHaptics } from '$lib/haptics';
	import '../app.css';
	let { children } = $props();

	onMount(installGlobalHaptics);
</script>

<svelte:head>
	<link rel="icon" href="/brand/binoculars.svg?v=3" type="image/svg+xml" sizes="any" />
	<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
	<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
</svelte:head>

<a class="skip-link" href="#main">Zum Inhalt springen</a>
<header class="site-header">
	<nav class="nav-inner" aria-label="Hauptnavigation">
		<a class="brand-mark" href="/" aria-label="WERKSPRUNG Startseite">
			<Binoculars size={21} strokeWidth={2.1} aria-hidden="true" />
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
		</div>
	</div>
</footer>
