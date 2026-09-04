<script lang="ts">
	import { page } from '$app/state';
	import { switchLocalePath, type Locale } from '$lib/i18n';
	let { locale = 'de' }: { locale?: Locale } = $props();
	let password = $state('');
	let errorMessage = $state('');
	let submitting = $state(false);

	async function unlock() {
		errorMessage = '';
		submitting = true;
		try {
			const response = await fetch('/api/offer-access', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password }) });
			const result = await response.json() as { message?: string };
			if (!response.ok) throw new Error(result.message ?? 'Zugriff nicht möglich.');
			location.reload();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Zugriff nicht möglich.';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="offer-locked" aria-live="polite">
	<div class="offer-locked-preview" aria-hidden="true"><div></div><div></div><div></div><div></div></div>
	<div class="offer-lock-overlay">
		<form class="offer-lock-card" onsubmit={(event) => { event.preventDefault(); void unlock(); }}>
			<div class="offer-language"><a class:active={locale === 'de'} href={switchLocalePath(page.url, 'de')}>DE</a><a class:active={locale === 'en'} href={switchLocalePath(page.url, 'en')}>EN</a></div>
			<label>{locale === 'en' ? 'Password' : 'Passwort'}<input type="password" bind:value={password} autocomplete="current-password" /></label>
			{#if errorMessage}<span class="offer-lock-error">{errorMessage}</span>{/if}
			<button type="submit" disabled={submitting}>{locale === 'en' ? (submitting ? 'Checking …' : 'Open offer') : (submitting ? 'Wird geprüft …' : 'Angebot öffnen')}</button>
		</form>
	</div>
</div>

<style>
	.offer-locked { position: relative; min-height: 100svh; overflow: hidden; background: #ebebee; }
	.offer-locked-preview { position: absolute; inset: -20px; display: grid; grid-template-columns: 360px 1fr; gap: 34px; padding: 40px; filter: blur(15px); opacity: .76; }
	.offer-locked-preview div { border-radius: 18px; background: #fff; box-shadow: 0 20px 55px rgba(0,0,0,.12); }
	.offer-locked-preview div:nth-child(1) { grid-row: span 2; } .offer-locked-preview div:nth-child(3) { height: 180px; }
	.offer-lock-overlay { position: absolute; inset: 0; display: grid; place-items: center; padding: 24px; background: rgba(245,245,247,.46); backdrop-filter: blur(3px); }
	.offer-lock-card { width: min(100%, 380px); padding: 30px; border: 1px solid rgba(255,255,255,.8); border-radius: 22px; background: rgba(255,255,255,.9); box-shadow: 0 24px 70px rgba(0,0,0,.16); }
	.offer-lock-card label { display: grid; gap: 7px; color: #55555b; font-size: 12px; font-weight: 700; }
	.offer-lock-card input { width: 100%; padding: 11px 12px; border: 1px solid #ceced4; border-radius: 10px; background: #fff; color: #1d1d1f; font: inherit; outline: none; }
	.offer-lock-card input:focus { border-color: #ff4f18; box-shadow: 0 0 0 3px rgba(255,79,24,.15); }
	.offer-lock-card button { width: 100%; margin-top: 17px; padding: 12px; border: 0; border-radius: 10px; background: #ff4f18; color: #fff; font: inherit; font-size: 13px; font-weight: 700; }
	.offer-lock-card button:disabled { opacity: .6; }
	.offer-lock-error { display: block; margin-top: 11px; color: #a2290d; font-size: 12px; }
	.offer-language { display: flex; justify-content: flex-end; gap: 9px; margin-bottom: 14px; font-size: 11px; }
	.offer-language a { color: #55555b; opacity: .45; } .offer-language a.active { opacity: 1; font-weight: 700; }
</style>
