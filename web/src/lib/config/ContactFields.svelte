<script lang="ts">
	let {
		companyName,
		contactName,
		email,
		phone,
		onchange,
		showCompany = true,
		idPrefix = 'contact'
	}: {
		companyName: string;
		contactName: string;
		email: string;
		phone: string;
		onchange: (patch: Partial<{ companyName: string; contactName: string; email: string; phone: string }>) => void;
		showCompany?: boolean;
		idPrefix?: string;
	} = $props();
</script>

<div class="field-grid">
	{#if showCompany}<div class="field full"><label for={`${idPrefix}-company`}>Unternehmen</label><input id={`${idPrefix}-company`} autocomplete="organization" value={companyName} oninput={(event) => onchange({ companyName: event.currentTarget.value })} /></div>{/if}
	<div class="field full"><label for={`${idPrefix}-name`}>Ansprechperson</label><input id={`${idPrefix}-name`} autocomplete="name" value={contactName} oninput={(event) => onchange({ contactName: event.currentTarget.value })} /></div>
	<div class="field full"><label for={`${idPrefix}-email`}>E-Mail-Adresse</label><input id={`${idPrefix}-email`} type="email" autocomplete="email" value={email} oninput={(event) => onchange({ email: event.currentTarget.value })} /></div>
	<div class="field full"><label for={`${idPrefix}-phone`}>Telefonnummer</label><input id={`${idPrefix}-phone`} type="tel" autocomplete="tel" value={phone} oninput={(event) => onchange({ phone: event.currentTarget.value })} /></div>
</div>
