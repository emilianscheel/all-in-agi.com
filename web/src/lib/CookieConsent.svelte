<script lang="ts">
	import { onMount } from 'svelte';
	import { activateAnalyticsForPath, getAnalyticsConsent, setAnalyticsConsent } from '$lib/analytics';

	let mounted = $state(false);
	let consent = $state<'granted' | 'denied' | null>(null);

	onMount(() => {
		const update = () => (consent = getAnalyticsConsent());
		mounted = true;
		update();
		if (consent === 'granted') void activateAnalyticsForPath(location.pathname);
		window.addEventListener('all-in-agi:analytics-consent-change', update);
		return () => window.removeEventListener('all-in-agi:analytics-consent-change', update);
	});

	function choose(value: 'granted' | 'denied') {
		setAnalyticsConsent(value);
		consent = value;
		if (value === 'granted') void activateAnalyticsForPath(location.pathname);
	}
</script>

{#if mounted && consent === null}
	<aside class="cookie-banner" aria-label="Cookie-Einstellungen" role="region">
		<p>Wir verwenden optionale Analyse-Cookies, um unsere Website und den Buchungsprozess zu verbessern. <a href="/datenschutz#google-analytics">Datenschutz</a></p>
		<div class="cookie-actions">
			<button class="cookie-reject" type="button" onclick={() => choose('denied')}>Alle ablehnen</button>
			<button class="cookie-accept" type="button" onclick={() => choose('granted')}>Alle Cookies erlauben</button>
		</div>
	</aside>
{/if}

<style>
	.cookie-banner { position: fixed; z-index: 200; right: max(16px, env(safe-area-inset-right)); bottom: max(16px, env(safe-area-inset-bottom)); left: max(16px, env(safe-area-inset-left)); max-width: 760px; margin: 0 auto; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; gap: 18px; border: 1px solid var(--soft-line); border-radius: 18px; background: color-mix(in srgb, var(--card) 94%, transparent); box-shadow: var(--floating-shadow); backdrop-filter: blur(18px); }
	.cookie-banner p { margin: 0; color: var(--secondary-ink); font-size: 13px; line-height: 1.45; }
	.cookie-banner a { color: var(--link); text-decoration: underline; text-underline-offset: 2px; }
	.cookie-actions { display: flex; flex: none; gap: 8px; }
	.cookie-actions button { min-height: 38px; padding: 8px 12px; border-radius: 999px; font-size: 13px; font-weight: 650; cursor: pointer; }
	.cookie-reject { border: 1px solid var(--line); background: var(--card); color: var(--ink); }
	.cookie-accept { border: 1px solid var(--orange); background: var(--orange); color: var(--on-accent); }
	@media (max-width: 620px) { .cookie-banner { align-items: stretch; flex-direction: column; gap: 12px; } .cookie-actions { display: grid; grid-template-columns: 1fr 1fr; } }
</style>
