<script lang="ts">
	import { SITE_ORIGIN, SOCIAL_IMAGE_ALT, SOCIAL_IMAGE_URL } from '$lib/seo';
	import { localeMeta, localizedPath, publicPathForInternal, type Locale } from '$lib/i18n';
	import { page } from '$app/state';

	let {
		title,
		description,
		path,
		imageUrl = SOCIAL_IMAGE_URL,
		imageAlt = SOCIAL_IMAGE_ALT,
		imageWidth = 2400,
		imageHeight = 1619,
		ogType = 'website',
		publishedAt,
		modifiedAt,
		socialTitle = title,
		locale = (page.data.locale ?? 'de') as Locale
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
		modifiedAt?: string;
		socialTitle?: string;
		locale?: Locale;
	} = $props();
	let canonicalPath = $derived(localizedPath(locale, path));
	let canonicalUrl = $derived(`${SITE_ORIGIN}${canonicalPath}`);
	let deUrl = $derived(`${SITE_ORIGIN}${localizedPath('de', path)}`);
	let enUrl = $derived(`${SITE_ORIGIN}${localizedPath('en', path)}`);
	let defaultUrl = $derived(`${SITE_ORIGIN}${publicPathForInternal(path) ?? path}`);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonicalUrl} />
	<link rel="alternate" hreflang="de-DE" href={deUrl} />
	<link rel="alternate" hreflang="en-US" href={enUrl} />
	<link rel="alternate" hreflang="x-default" href={defaultUrl} />

	<meta property="og:title" content={socialTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:site_name" content="ALL IN AGI" />
	<meta property="og:locale" content={localeMeta[locale].ogLocale} />
	<meta property="og:type" content={ogType} />
	<meta property="og:image" content={imageUrl} />
	<meta property="og:image:width" content={String(imageWidth)} />
	<meta property="og:image:height" content={String(imageHeight)} />
	<meta property="og:image:alt" content={imageAlt} />
	{#if ogType === 'article' && publishedAt}<meta property="article:published_time" content={publishedAt} />{/if}
	{#if ogType === 'article' && modifiedAt}<meta property="article:modified_time" content={modifiedAt} />{/if}

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={socialTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={imageUrl} />
	<meta name="twitter:image:alt" content={imageAlt} />
</svelte:head>
