<script lang="ts">
	import { slide } from 'svelte/transition';
	import { Check } from 'lucide-svelte';
	import {
		CAPACITY_PRICES,
		CODING_TOOLS,
		PROVIDED_CODING_TOOLS,
		TOOLS_SURCHARGES,
		VENUE_SURCHARGES,
		formatPrice,
		type Capacity,
		type CodingTool,
		type Equipment,
		type Lunch,
		type ToolProvision
	} from '$lib/booking';

	export interface OptionValues {
		capacity: Capacity;
		venueProvided: boolean;
		equipment: Equipment;
		lunch: Lunch;
		customLunch: string;
		toolProvision: ToolProvision | null;
		codingTools: CodingTool[];
		customCodingTool: string;
	}

	let {
		kind,
		values,
		onchange,
		idPrefix = 'config'
	}: {
		kind: 'capacity' | 'venue' | 'tools' | 'equipment' | 'lunch';
		values: OptionValues;
		onchange: (patch: Partial<OptionValues>) => void;
		idPrefix?: string;
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
</script>

{#if kind === 'capacity'}
	<div class="option-grid three">
		{#each [15, 30, 50] as size}
			<label class:selected={values.capacity === size} class="choice">
				<input type="radio" name={`${idPrefix}-capacity`} value={size} checked={values.capacity === size} onchange={() => onchange({ capacity: size as Capacity })} />
				<b>{size} Personen</b>
				<small>{size === 15 ? 'Kompaktes Team' : size === 30 ? 'Mehrere Build-Teams' : 'Große Demo Session'}</small>
				<span class="choice-price">{formatPrice(CAPACITY_PRICES[size as Capacity])}</span>
			</label>
		{/each}
	</div>
{:else if kind === 'venue'}
	<div class="option-grid">
		<label class:selected={values.venueProvided} class="choice">
			<input type="radio" name={`${idPrefix}-venue`} checked={values.venueProvided} onchange={() => onchange({ venueProvided: true })} />
			<b>Eigener Conference Room</b><small>Platz für Teams, stabiles WLAN, großer Screen.</small><span class="choice-price">Inklusive</span>
		</label>
		<label class:selected={!values.venueProvided} class="choice">
			<input type="radio" name={`${idPrefix}-venue`} checked={!values.venueProvided} onchange={() => onchange({ venueProvided: false })} />
			<b>Location organisieren lassen</b><small>Passender Raum im gewünschten Suchgebiet. Die genaue Location wird bestätigt.</small><span class="choice-price">+ {formatPrice(VENUE_SURCHARGES[values.capacity])}</span>
		</label>
	</div>
{:else if kind === 'tools'}
	<div class="option-grid tools-mode-grid">
		<label class:selected={values.toolProvision === 'existing'} class="choice">
			<input type="radio" name={`${idPrefix}-tool-provision`} checked={values.toolProvision === 'existing'} onchange={() => selectToolProvision('existing')} />
			<b>Wir haben Agentic Coding Tools</b><span class="choice-price">Inklusive</span>
		</label>
		<label class:selected={values.toolProvision === 'needed'} class="choice">
			<input type="radio" name={`${idPrefix}-tool-provision`} checked={values.toolProvision === 'needed'} onchange={() => selectToolProvision('needed')} />
			<b>Wir brauchen welche für den Tag</b><span class="choice-price">+ {formatPrice(TOOLS_SURCHARGES[values.capacity])}</span>
		</label>
	</div>
	{#if values.toolProvision}
		<div class:has-custom-tool={values.codingTools.includes('custom')} class="coding-tools" transition:slide={{ duration: 300 }}>
			<p>{values.toolProvision === 'needed' ? 'Welche Tools sollen wir mitbringen?' : 'Welche Coding Tools werden eingesetzt?'}</p>
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
						<label for={`${idPrefix}-custom-coding-tool`}>Individuelles Coding Tool</label>
						<input id={`${idPrefix}-custom-coding-tool`} maxlength="160" placeholder="z. B. internes Agent Framework" value={values.customCodingTool} oninput={(event) => onchange({ customCodingTool: event.currentTarget.value })} />
					</div>
				</div>
			{/if}
		</div>
	{/if}
{:else if kind === 'equipment'}
	<div class="option-grid demo-setup-grid">
		<label class:selected={values.equipment !== 'none'} class="choice">
			<input type="radio" name={`${idPrefix}-equipment`} checked={values.equipment !== 'none'} onchange={() => onchange({ equipment: 'projector' })} />
			<b>Projector / Display</b><small>Großer Screen vorhanden.</small>
		</label>
		<label class:selected={values.equipment === 'none'} class="choice">
			<input type="radio" name={`${idPrefix}-equipment`} checked={values.equipment === 'none'} onchange={() => onchange({ equipment: 'none' })} />
			<b>Kein Screen</b><small>Bringen wir mit.</small>
		</label>
	</div>
{:else}
	<div class="option-grid lunch-grid">
		<label class:selected={values.lunch === 'pizza'} class="choice"><input type="radio" name={`${idPrefix}-lunch`} checked={values.lunch === 'pizza'} onchange={() => onchange({ lunch: 'pizza' })} /><b>Pizza</b><small>Der Hackathon-Klassiker.</small><span class="choice-price">Inklusive</span></label>
		<label class:selected={values.lunch === 'custom'} class="choice"><input type="radio" name={`${idPrefix}-lunch`} checked={values.lunch === 'custom'} onchange={() => onchange({ lunch: 'custom' })} /><b>Custom</b><small>Catering nach Wunsch.</small><span class="choice-price">+ 500 €</span></label>
		<label class:selected={values.lunch === 'none'} class="choice"><input type="radio" name={`${idPrefix}-lunch`} checked={values.lunch === 'none'} onchange={() => onchange({ lunch: 'none' })} /><b>No lunch</b><small>Ohne Mahlzeit.</small><span class="choice-price">− 500 €</span></label>
		<label class:selected={values.lunch === 'self-organized'} class="choice"><input type="radio" name={`${idPrefix}-lunch`} checked={values.lunch === 'self-organized'} onchange={() => onchange({ lunch: 'self-organized' })} /><b>Selbstorganisiert</b><small>Sie kümmern sich um das Essen.</small><span class="choice-price">− 500 €</span></label>
	</div>
	{#if values.lunch === 'custom'}
		<div class="custom-lunch" transition:slide={{ duration: 300 }}>
			<div class="field">
				<label for={`${idPrefix}-custom-lunch`}>Catering-Wunsch</label>
				<input id={`${idPrefix}-custom-lunch`} maxlength="160" placeholder="z. B. vegetarische Bowls oder Buffet" value={values.customLunch} oninput={(event) => onchange({ customLunch: event.currentTarget.value })} />
			</div>
		</div>
	{/if}
	<p class="section-note">{values.lunch === 'none' ? 'Keine Mahlzeit eingeplant.' : values.lunch === 'self-organized' ? 'Das Catering wird von Ihnen organisiert.' : 'Wir organisieren das Catering für Sie.'}</p>
{/if}
