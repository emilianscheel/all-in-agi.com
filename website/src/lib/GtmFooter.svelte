<script lang="ts">
	import {
		Anchor,
		Bot,
		CalendarDays,
		CarFront,
		Code2,
		Cog,
		Factory,
		Gauge,
		Landmark,
		Lightbulb,
		LockKeyhole,
		MapPin,
		Mountain,
		RefreshCw,
		Rocket,
		Route,
		ShieldCheck,
		Trophy,
		Truck,
		UsersRound
	} from 'lucide-svelte';
	import { GTM_GROUPS, gtmPagesForGroup } from '$lib/gtm-pages';

	const icons = {
		MapPin,
		Anchor,
		Mountain,
		CarFront,
		Landmark,
		Factory,
		Code2,
		Truck,
		ShieldCheck,
		Cog,
		Rocket,
		Bot,
		Gauge,
		Route,
		UsersRound,
		Trophy,
		CalendarDays,
		Lightbulb,
		RefreshCw,
		LockKeyhole
	};

	let { currentSlug }: { currentSlug?: string } = $props();
</script>

<footer class="gtm-footer">
	<nav class="gtm-footer-inner" aria-label="Hackathon-Themen">
		{#each GTM_GROUPS as group}
			<section class="gtm-footer-column" aria-label={group}>
				<ul>
					{#each gtmPagesForGroup(group) as item}
						{@const Icon = icons[item.icon]}
						<li>
							<a
								href={`/${item.slug}`}
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
