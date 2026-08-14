<script lang="ts">
	import {
		Anchor,
		Bot,
		BriefcaseBusiness,
		Building2,
		Calculator,
		CalendarDays,
		CarFront,
		CircuitBoard,
		Clock3,
		Code2,
		Cog,
		Cpu,
		Crown,
		Factory,
		FileText,
		Flag,
		Gauge,
		GitCompareArrows,
		Globe,
		Landmark,
		Lightbulb,
		LockKeyhole,
		MapPin,
		MapPinned,
		Mountain,
		Pickaxe,
		RadioTower,
		RefreshCw,
		Rocket,
		Route,
		ShoppingCart,
		ShieldCheck,
		Terminal,
		TestTubeDiagonal,
		Trophy,
		Truck,
		UserRoundCheck,
		UsersRound,
		Warehouse,
		Workflow
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
		LockKeyhole,
		Terminal,
		FileText,
		GitCompareArrows,
		TestTubeDiagonal,
		Workflow,
		UserRoundCheck,
		Clock3,
		Flag,
		BriefcaseBusiness,
		Globe,
		RadioTower,
		Warehouse,
		CircuitBoard,
		Calculator,
		ShoppingCart,
		Crown,
		MapPinned,
		Building2,
		Cpu,
		Pickaxe
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
