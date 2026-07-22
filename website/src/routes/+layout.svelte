<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/brand/werksprung-mark.svg" />
	<meta name="theme-color" content="#ffffff" />
</svelte:head>

<a class="skip-link" href="#main">Zum Inhalt springen</a>
<header class="site-header">
	<nav class="nav-inner" aria-label="Hauptnavigation">
		<a class="brand-mark" href="/" aria-label="WERKSPRUNG Startseite">
			<img src="/brand/werksprung-mark.svg" alt="" />
		</a>
		<div class="nav-links">
			<a href="/#format">Format</a>
			<a href="/#ablauf">Agenda</a>
			<a href="/#preis">Preis</a>
		</div>
		<a class="nav-cta" href="/buchen">Hackathon planen</a>
	</nav>
</header>

<main id="main">{@render children()}</main>

<footer class="site-footer">
	<div class="footer-inner">
		<span>© {new Date().getFullYear()} WERKSPRUNG · AI Coding Hackathons</span>
		<div class="footer-links">
			<a href="/impressum">Impressum</a>
			<a href="/datenschutz">Datenschutz</a>
		</div>
	</div>
</footer>
