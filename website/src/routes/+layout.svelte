<script lang="ts">
	import { Binoculars } from 'lucide-svelte';
	import '../app.css';
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/brand/binoculars.svg" type="image/svg+xml" />
	<meta name="theme-color" content="#ffffff" />
</svelte:head>

<a class="skip-link" href="#main">Zum Inhalt springen</a>
<header class="site-header">
	<nav class="nav-inner" aria-label="Hauptnavigation">
		<a class="brand-mark" href="/" aria-label="WERKSPRUNG Startseite">
			<Binoculars size={25} strokeWidth={2.1} aria-hidden="true" />
		</a>
		<div class="nav-links">
			<a href="/#format">Format</a>
			<a href="/#ablauf">Agenda</a>
			<a href="/#preis">Preis</a>
			<a href="/#kontakt">Kontakt</a>
		</div>
		<a class="nav-cta" href="/buchen">Hackathon planen</a>
	</nav>
</header>

<main id="main">{@render children()}</main>

<footer class="site-footer">
	<div class="footer-inner">
		<span>© {new Date().getFullYear()} WERKSPRUNG · Agentic Engineering Hackathons</span>
		<div class="footer-links">
			<a href="/impressum">Impressum</a>
			<a href="/datenschutz">Datenschutz</a>
		</div>
	</div>
</footer>
