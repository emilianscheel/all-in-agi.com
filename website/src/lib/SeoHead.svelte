<script lang="ts">
	import { SITE_ORIGIN, SOCIAL_IMAGE_ALT, SOCIAL_IMAGE_URL } from '$lib/seo';

	let {
		title,
		description,
		path,
		imageUrl = SOCIAL_IMAGE_URL,
		imageAlt = SOCIAL_IMAGE_ALT,
		imageWidth = 2400,
		imageHeight = 1619,
		ogType = 'website',
		publishedAt
	}: {
		title: string;
		description: string;
		path: string;
		imageUrl?: string;
		imageAlt?: string;
		imageWidth?: number;
		imageHeight?: number;
		ogType?: 'website' | 'article';
		publishedAt?: string;
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
	<meta property="og:type" content={ogType} />
	<meta property="og:image" content={imageUrl} />
	<meta property="og:image:width" content={String(imageWidth)} />
	<meta property="og:image:height" content={String(imageHeight)} />
	<meta property="og:image:alt" content={imageAlt} />
	{#if ogType === 'article' && publishedAt}<meta property="article:published_time" content={publishedAt} />{/if}

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={imageUrl} />
	<meta name="twitter:image:alt" content={imageAlt} />
</svelte:head>
