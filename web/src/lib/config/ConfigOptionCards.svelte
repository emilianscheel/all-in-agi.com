<script lang="ts">
	import { slide } from 'svelte/transition';
	import { Check, Minus, Plus } from 'lucide-svelte';
	import {
		CAPACITY_PRICES,
		CODING_TOOLS,
		PROVIDED_CODING_TOOLS,
		TOOLS_SURCHARGES,
		DEVICE_PRICE,
		VENUE_SURCHARGES,
		formatPrice,
		type Capacity,
		type CodingTool,
		type Equipment,
		type Lunch,
		type ToolProvision,
		type DeviceProvision
	} from '$lib/booking';
	import type { Locale } from '$lib/i18n';

	export interface OptionValues {
		capacity: Capacity;
		venueProvided: boolean;
		equipment: Equipment;
		lunch: Lunch;
		customLunch: string;
		toolProvision: ToolProvision | null;
		codingTools: CodingTool[];
		customCodingTool: string;
		deviceProvision: DeviceProvision | null;
		deviceCount: number;
	}

	let {
		kind,
		values,
		onchange,
		idPrefix = 'config',
		locale = 'de'
	}: {
		kind: 'capacity' | 'venue' | 'tools' | 'devices' | 'equipment' | 'lunch';
		values: OptionValues;
		onchange: (patch: Partial<OptionValues>) => void;
		idPrefix?: string;
		locale?: Locale;
	} = $props();

	let visibleCodingTools = $derived(values.toolProvision === 'needed'
		? PROVIDED_CODING_TOOLS.map((id) => CODING_TOOLS.find((tool) => tool.id === id)!)
		: CODING_TOOLS);

	function selectToolProvision(provision: ToolProvision) {
		if (provision === 'needed') {
			onchange({
				toolProvision: provision,
				codingTools: values.codingTools.filter((tool) => PROVIDED_CODING_TOOLS.includes(tool)),
				customCodingTool: ''
			});
		} else {
			onchange({ toolProvision: provision });
		}
	}

	function toggleCodingTool(tool: CodingTool) {
		onchange({
			codingTools: values.codingTools.includes(tool)
				? values.codingTools.filter((selected) => selected !== tool)
				: [...values.codingTools, tool]
		});
	}

	function selectDeviceProvision(provision: DeviceProvision) {
		onchange({ deviceProvision: provision, deviceCount: provision === 'needed' ? 1 : 0 });
	}

	function normalizeDeviceCount(value: number) {
		return Math.min(values.capacity, Math.max(1, Number.isFinite(value) ? Math.round(value) : values.deviceCount || 1));
	}

	function changeDeviceCount(value: number) {
		onchange({ deviceCount: normalizeDeviceCount(value) });
	}
</script>

{#if kind === 'capacity'}
	<div class="option-grid three">
		{#each [15, 30, 50] as size}
			<label class:selected={values.capacity === size} class="choice">
				<input type="radio" name={`${idPrefix}-capacity`} value={size} checked={values.capacity === size} onchange={() => onchange({ capacity: size as Capacity })} />
				<b>{size} {locale === 'en' ? 'people' : 'Personen'}</b>
				<small>{locale === 'en' ? (size === 15 ? 'Compact team' : size === 30 ? 'Several build teams' : 'Large demo session') : (size === 15 ? 'Kompaktes Team' : size === 30 ? 'Mehrere Build-Teams' : 'Große Demo Session')}</small>
				<span class="choice-price">{formatPrice(CAPACITY_PRICES[size as Capacity], locale)}</span>
			</label>
		{/each}
	</div>
{:else if kind === 'venue'}
	<div class="option-grid">
		<label class:selected={values.venueProvided} class="choice">
			<input type="radio" name={`${idPrefix}-venue`} checked={values.venueProvided} onchange={() => onchange({ venueProvided: true })} />
			<b>{locale === 'en' ? 'Your conference room' : 'Eigener Conference Room'}</b><small>{locale === 'en' ? 'Space for teams, reliable Wi-Fi, and a large screen.' : 'Platz für Teams, stabiles WLAN, großer Screen.'}</small><span class="choice-price">{locale === 'en' ? 'Included' : 'Inklusive'}</span>
		</label>
		<label class:selected={!values.venueProvided} class="choice">
			<input type="radio" name={`${idPrefix}-venue`} checked={!values.venueProvided} onchange={() => onchange({ venueProvided: false })} />
			<b>{locale === 'en' ? 'Let us arrange a venue' : 'Location organisieren lassen'}</b><small>{locale === 'en' ? 'A suitable room in your preferred area. The exact venue will be confirmed.' : 'Passender Raum im gewünschten Suchgebiet. Die genaue Location wird bestätigt.'}</small><span class="choice-price">+ {formatPrice(VENUE_SURCHARGES[values.capacity], locale)}</span>
		</label>
	</div>
{:else if kind === 'tools'}
	<div class="option-grid tools-mode-grid">
		<label class:selected={values.toolProvision === 'existing'} class="choice">
			<input type="radio" name={`${idPrefix}-tool-provision`} checked={values.toolProvision === 'existing'} onchange={() => selectToolProvision('existing')} />
			<b>{locale === 'en' ? 'We have agentic coding tools' : 'Wir haben Agentic Coding Tools'}</b><span class="choice-price">{locale === 'en' ? 'Included' : 'Inklusive'}</span>
		</label>
		<label class:selected={values.toolProvision === 'needed'} class="choice">
			<input type="radio" name={`${idPrefix}-tool-provision`} checked={values.toolProvision === 'needed'} onchange={() => selectToolProvision('needed')} />
			<b>{locale === 'en' ? 'We need tools for the day' : 'Wir brauchen welche für den Tag'}</b><span class="choice-price">+ {formatPrice(TOOLS_SURCHARGES[values.capacity], locale)}</span>
		</label>
	</div>
	{#if values.toolProvision}
		<div class:has-custom-tool={values.codingTools.includes('custom')} class="coding-tools" transition:slide={{ duration: 300 }}>
			<p>{locale === 'en' ? (values.toolProvision === 'needed' ? 'Which tools should we provide?' : 'Which coding tools will be used?') : (values.toolProvision === 'needed' ? 'Welche Tools sollen wir mitbringen?' : 'Welche Coding Tools werden eingesetzt?')}</p>
			<div class="coding-tool-list">
				{#each visibleCodingTools as tool}
					<label class="coding-tool-option">
						<input type="checkbox" checked={values.codingTools.includes(tool.id)} onchange={() => toggleCodingTool(tool.id)} />
						<span class="round-checkbox" aria-hidden="true">{#if values.codingTools.includes(tool.id)}<Check size={18} strokeWidth={2.4} />{/if}</span>
						<span class="coding-tool-label">{tool.label}</span>
						{#if tool.icon}<img class="coding-tool-icon" src={tool.icon} alt="" width="30" height="30" loading="lazy" decoding="async" aria-hidden="true" />{/if}
					</label>
				{/each}
			</div>
			{#if values.codingTools.includes('custom')}
				<div class="custom-tool" transition:slide={{ duration: 280 }}>
					<div class="field">
						<label for={`${idPrefix}-custom-coding-tool`}>{locale === 'en' ? 'Custom coding tool' : 'Individuelles Coding Tool'}</label>
						<input id={`${idPrefix}-custom-coding-tool`} maxlength="160" placeholder={locale === 'en' ? 'e.g. an internal agent framework' : 'z. B. internes Agent Framework'} value={values.customCodingTool} oninput={(event) => onchange({ customCodingTool: event.currentTarget.value })} />
					</div>
				</div>
			{/if}
		</div>
	{/if}
{:else if kind === 'equipment'}
	<div class="option-grid demo-setup-grid">
		<label class:selected={values.equipment !== 'none'} class="choice">
			<input type="radio" name={`${idPrefix}-equipment`} checked={values.equipment !== 'none'} onchange={() => onchange({ equipment: 'projector' })} />
			<b>Projector / Display</b><small>{locale === 'en' ? 'A large screen is available.' : 'Großer Screen vorhanden.'}</small>
		</label>
		<label class:selected={values.equipment === 'none'} class="choice">
			<input type="radio" name={`${idPrefix}-equipment`} checked={values.equipment === 'none'} onchange={() => onchange({ equipment: 'none' })} />
			<b>{locale === 'en' ? 'No screen' : 'Kein Screen'}</b><small>{locale === 'en' ? 'We will provide one.' : 'Bringen wir mit.'}</small>
		</label>
	</div>
{:else if kind === 'devices'}
	<div class="option-grid devices-mode-grid">
		<label class:selected={values.deviceProvision === 'existing'} class="choice">
			<input type="radio" name={`${idPrefix}-device-provision`} checked={values.deviceProvision === 'existing'} onchange={() => selectDeviceProvision('existing')} />
			<b>{locale === 'en' ? 'Company laptops or personal devices' : 'Unternehmenslaptops oder private Geräte'}</b><span class="choice-price">{locale === 'en' ? 'Included' : 'Inklusive'}</span>
		</label>
		<label class:selected={values.deviceProvision === 'needed'} class="choice">
			<input type="radio" name={`${idPrefix}-device-provision`} checked={values.deviceProvision === 'needed'} onchange={() => selectDeviceProvision('needed')} />
			<b>{locale === 'en' ? 'We need devices for the day' : 'Wir brauchen welche für den Tag'}</b><span class="choice-price">+ {formatPrice(DEVICE_PRICE, locale)} {locale === 'en' ? 'per device' : 'pro Gerät'}</span>
		</label>
	</div>
	{#if values.deviceProvision === 'needed'}
		<div class="device-count-panel" transition:slide={{ duration: 300 }}>
			<label for={`${idPrefix}-device-count`}>{locale === 'en' ? 'Number of devices' : 'Anzahl der Geräte'}</label>
			<div class="device-stepper">
				<button type="button" aria-label={locale === 'en' ? 'One fewer device' : 'Ein Gerät weniger'} disabled={values.deviceCount <= 1} onclick={() => changeDeviceCount(values.deviceCount - 1)}><Minus size={18} /></button>
				<input id={`${idPrefix}-device-count`} type="number" min="1" max={values.capacity} step="1" value={values.deviceCount} oninput={(event) => {
					const next = event.currentTarget.valueAsNumber;
					if (Number.isFinite(next)) onchange({ deviceCount: next });
				}} onblur={(event) => {
					const normalized = normalizeDeviceCount(event.currentTarget.valueAsNumber);
					event.currentTarget.value = String(normalized);
					onchange({ deviceCount: normalized });
				}} />
				<button type="button" aria-label={locale === 'en' ? 'One more device' : 'Ein Gerät mehr'} disabled={values.deviceCount >= values.capacity} onclick={() => changeDeviceCount(values.deviceCount + 1)}><Plus size={18} /></button>
			</div>
			<p>{values.deviceCount} {locale === 'en' ? (values.deviceCount === 1 ? 'device' : 'devices') : (values.deviceCount === 1 ? 'Gerät' : 'Geräte')} × {formatPrice(DEVICE_PRICE, locale)} = <b>{formatPrice(values.deviceCount * DEVICE_PRICE, locale)}</b></p>
		</div>
	{/if}
	<p class="section-note device-admin-note">{locale === 'en' ? 'Participants need administrator privileges on these devices—or access to virtual machines where they have administrator privileges.' : 'Die Teilnehmenden benötigen Administratorrechte auf diesen Geräten – oder Zugriff auf virtuelle Maschinen, auf denen sie Administratorrechte haben.'}</p>
{:else}
	<div class="option-grid lunch-grid">
		<label class:selected={values.lunch === 'pizza'} class="choice"><input type="radio" name={`${idPrefix}-lunch`} checked={values.lunch === 'pizza'} onchange={() => onchange({ lunch: 'pizza' })} /><b>Pizza</b><small>{locale === 'en' ? 'The hackathon classic.' : 'Der Hackathon-Klassiker.'}</small><span class="choice-price">{locale === 'en' ? 'Included' : 'Inklusive'}</span></label>
		<label class:selected={values.lunch === 'custom'} class="choice"><input type="radio" name={`${idPrefix}-lunch`} checked={values.lunch === 'custom'} onchange={() => onchange({ lunch: 'custom' })} /><b>Custom</b><small>{locale === 'en' ? 'Catering tailored to your needs.' : 'Catering nach Wunsch.'}</small><span class="choice-price">+ {formatPrice(500, locale)}</span></label>
		<label class:selected={values.lunch === 'none'} class="choice"><input type="radio" name={`${idPrefix}-lunch`} checked={values.lunch === 'none'} onchange={() => onchange({ lunch: 'none' })} /><b>{locale === 'en' ? 'No lunch' : 'Kein Lunch'}</b><small>{locale === 'en' ? 'No meal included.' : 'Ohne Mahlzeit.'}</small><span class="choice-price">− {formatPrice(500, locale)}</span></label>
		<label class:selected={values.lunch === 'self-organized'} class="choice"><input type="radio" name={`${idPrefix}-lunch`} checked={values.lunch === 'self-organized'} onchange={() => onchange({ lunch: 'self-organized' })} /><b>{locale === 'en' ? 'Self-organized' : 'Selbstorganisiert'}</b><small>{locale === 'en' ? 'You arrange the food.' : 'Sie kümmern sich um das Essen.'}</small><span class="choice-price">− {formatPrice(500, locale)}</span></label>
	</div>
	{#if values.lunch === 'custom'}
		<div class="custom-lunch" transition:slide={{ duration: 300 }}>
			<div class="field">
				<label for={`${idPrefix}-custom-lunch`}>{locale === 'en' ? 'Catering preference' : 'Catering-Wunsch'}</label>
				<input id={`${idPrefix}-custom-lunch`} maxlength="160" placeholder={locale === 'en' ? 'e.g. vegetarian bowls or a buffet' : 'z. B. vegetarische Bowls oder Buffet'} value={values.customLunch} oninput={(event) => onchange({ customLunch: event.currentTarget.value })} />
			</div>
		</div>
	{/if}
	<p class="section-note">{locale === 'en' ? (values.lunch === 'none' ? 'No meal is planned.' : values.lunch === 'self-organized' ? 'You will arrange the catering.' : 'We will arrange the catering for you.') : (values.lunch === 'none' ? 'Keine Mahlzeit eingeplant.' : values.lunch === 'self-organized' ? 'Das Catering wird von Ihnen organisiert.' : 'Wir organisieren das Catering für Sie.')}</p>
{/if}
