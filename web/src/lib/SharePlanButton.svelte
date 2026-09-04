<script lang="ts">
	import { Check, Share } from 'lucide-svelte';
	import { trackAnalyticsEvent } from '$lib/analytics';
	let { getUrl, label, locale = 'de' }: { getUrl: () => Promise<string>; label?: string; locale?: 'de' | 'en' } = $props();
	let visibleLabel = $derived(label ?? (locale === 'en' ? 'Share plan' : 'Plan teilen'));
	let state = $state<'idle' | 'copied' | 'error'>('idle');
	let resetTimer: ReturnType<typeof setTimeout> | undefined;

	async function copyPlan() {
		try {
			const url = await getUrl();
			if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
			else {
				const textarea = document.createElement('textarea'); textarea.value = url; textarea.style.position = 'fixed'; textarea.style.opacity = '0'; document.body.append(textarea); textarea.select(); document.execCommand('copy'); textarea.remove();
			}
			state = 'copied';
			trackAnalyticsEvent('booking_plan_shared');
		} catch { state = 'error'; }
		if (resetTimer) clearTimeout(resetTimer);
		resetTimer = setTimeout(() => (state = 'idle'), 2500);
	}
</script>

<button class="button-secondary action-button" type="button" onclick={copyPlan} aria-live="polite">
	{#if state === 'copied'}<Check size={18} aria-hidden="true" />{locale === 'en' ? 'Plan link copied' : 'Plan-Link kopiert'}{:else}<Share size={18} aria-hidden="true" />{state === 'error' ? (locale === 'en' ? 'Copy failed' : 'Kopieren fehlgeschlagen') : visibleLabel}{/if}
</button>
