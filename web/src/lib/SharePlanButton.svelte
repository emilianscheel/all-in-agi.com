<script lang="ts">
	import { Check, Share } from 'lucide-svelte';
	let { getUrl, label = 'Plan teilen' }: { getUrl: () => Promise<string>; label?: string } = $props();
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
		} catch { state = 'error'; }
		if (resetTimer) clearTimeout(resetTimer);
		resetTimer = setTimeout(() => (state = 'idle'), 2500);
	}
</script>

<button class="button-secondary action-button" type="button" onclick={copyPlan} aria-live="polite">
	{#if state === 'copied'}<Check size={18} aria-hidden="true" />Plan-Link kopiert{:else}<Share size={18} aria-hidden="true" />{state === 'error' ? 'Kopieren fehlgeschlagen' : label}{/if}
</button>
