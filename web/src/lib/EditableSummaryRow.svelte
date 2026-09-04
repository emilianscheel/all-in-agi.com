<script lang="ts">
	import { slide } from 'svelte/transition';
	import { Pencil, X } from 'lucide-svelte';
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import type { Locale } from '$lib/i18n';

	let {
		icon: Icon,
		label,
		value,
		status,
		active = false,
		saving = false,
		error = '',
		total = false,
		onedit,
		onsave,
		oncancel,
		editor
	}: {
		icon: any;
		label: string;
		value: string;
		status: string;
		active?: boolean;
		saving?: boolean;
		error?: string;
		total?: boolean;
		onedit?: () => void;
		onsave?: () => void;
		oncancel?: () => void;
		editor?: Snippet;
	} = $props();

	let editable = $derived(Boolean(editor && onedit));
	let locale = $derived((page.data.locale ?? 'de') as Locale);
</script>

<div class:editable-summary-item={editable} class:active class:summary-total={total}>
	<div class:total class="summary-row">
		<Icon size={total ? 20 : 18} aria-hidden="true" />
		<span>{#if !total}<small>{label}</small>{/if}{value}</span>
		<b>{status}</b>
		{#if editable}
			<button
				class="summary-edit-button"
				type="button"
				aria-label={active ? `${label} ${locale === 'en' ? 'close' : 'schließen'}` : `${label} ${locale === 'en' ? 'edit' : 'bearbeiten'}`}
				aria-expanded={active}
				onclick={onedit}
			>
				<Pencil class="summary-edit-pencil" size={16} strokeWidth={2} aria-hidden="true" />
				<X class="summary-edit-close" size={17} strokeWidth={2} aria-hidden="true" />
			</button>
		{/if}
	</div>
	{#if active && editor}
		<div class="summary-row-editor" transition:slide={{ duration: 300 }}>
			{@render editor()}
			{#if error}<p class="inline-edit-error" role="alert">{error}</p>{/if}
			<div class="summary-edit-actions">
				<button class="button-secondary" type="button" onclick={oncancel} disabled={saving}>{locale === 'en' ? 'Cancel' : 'Abbrechen'}</button>
				<button class="button-primary" type="button" onclick={onsave} disabled={saving}>{locale === 'en' ? (saving ? 'Saving …' : 'Save') : (saving ? 'Wird gespeichert …' : 'Speichern')}</button>
			</div>
		</div>
	{/if}
</div>
