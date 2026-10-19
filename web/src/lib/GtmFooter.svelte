<script lang="ts">
	import { gtmIcons } from '$lib/gtm-icons';
	import { GTM_GROUPS, gtmPagesForGroup } from '$lib/gtm-pages';
	import { localizedPath, type Locale } from '$lib/i18n';

	let { currentSlug, locale }: { currentSlug?: string; locale: Locale } = $props();
</script>

<footer class="gtm-footer">
	<nav class="gtm-footer-inner" aria-label="Hackathon-Themen">
		{#each GTM_GROUPS as group}
			<section class="gtm-footer-column" aria-label={group}>
				<ul>
					{#each gtmPagesForGroup(group, locale) as item}
						{@const Icon = gtmIcons[item.icon]}
						<li>
							<a
								href={localizedPath(locale, `/${item.slug}`)}
								class:active={currentSlug === item.slug}
								aria-current={currentSlug === item.slug ? 'page' : undefined}
							>
								<Icon size={16} strokeWidth={1.7} aria-hidden="true" />
								<span>{item.footerLabel}</span>
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</nav>
</footer>
