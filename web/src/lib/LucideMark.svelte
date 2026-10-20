<script lang="ts">
	import { lucideIconSvg } from '$lib/lucide-icons';

	let { name, size = 16 }: { name: string; size?: number } = $props();
	let markup = $state('');

	$effect(() => {
		const current = name;
		markup = '';
		void lucideIconSvg(current).then((svg) => {
			if (current === name) markup = svg ?? '';
		});
	});
</script>

<span class="lucide-mark" style:width="{size}px" style:height="{size}px" aria-hidden="true">{@html markup}</span>

<style>
	.lucide-mark { display: inline-grid; place-items: center; flex: none; color: inherit; }
	.lucide-mark :global(svg) { width: 100%; height: 100%; }
</style>
