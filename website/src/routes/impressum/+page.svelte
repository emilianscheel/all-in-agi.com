<script lang="ts">
	import { CONTACT_EMAIL, CONTACT_PHONE_HREF } from '$lib/contact';
</script>

<svelte:head>
	<title>Impressum — ALL IN AGI</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="simple-page">
	<article class="simple-card">
		<h1>Impressum</h1>
		<h2>Angaben gemäß § 5 DDG</h2>
		<p>Emilian Scheel<br />Moosdorfstraße 10<br />12435 Berlin</p>

		<h2>Kontakt</h2>
		<div class="imprint-contact">
			<a href={`tel:${CONTACT_PHONE_HREF}`}>015257257750</a>
			<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
		</div>
	</article>
</div>

<style>
	.imprint-contact {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 10px;
	}

	.imprint-contact a {
		color: var(--link);
		font-size: 18px;
		line-height: 1.3;
		text-decoration-thickness: 1px;
		text-underline-offset: 6px;
	}

	.imprint-contact a:hover {
		text-decoration: underline;
	}
</style>
