<script lang="ts">
	import { SITE_ORIGIN, SOCIAL_IMAGE_ALT, SOCIAL_IMAGE_URL } from '$lib/seo';

	let {
		title,
		description,
		path
	}: {
		title: string;
		description: string;
		path: '/' | '/impressum' | '/datenschutz' | '/buchen';
	} = $props();

	let canonicalUrl = $derived(`${SITE_ORIGIN}${path}`);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonicalUrl} />

	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:site_name" content="ALL IN AGI" />
	<meta property="og:locale" content="de_DE" />
	<meta property="og:type" content="website" />
	<meta property="og:image" content={SOCIAL_IMAGE_URL} />
	<meta property="og:image:width" content="2400" />
	<meta property="og:image:height" content="1619" />
	<meta property="og:image:alt" content={SOCIAL_IMAGE_ALT} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={SOCIAL_IMAGE_URL} />
	<meta name="twitter:image:alt" content={SOCIAL_IMAGE_ALT} />
</svelte:head>
