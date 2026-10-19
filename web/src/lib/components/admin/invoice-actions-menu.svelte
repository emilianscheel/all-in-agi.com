<script lang="ts">
	import { Download, Mail, ReceiptEuro } from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	let {
		label,
		downloadLabel,
		sendLabel,
		testLabel,
		downloadDisabled = false,
		sendDisabled = false,
		testDisabled = false,
		onDownload,
		onSend,
		onTest
	}: {
		label: string;
		downloadLabel: string;
		sendLabel: string;
		testLabel: string;
		downloadDisabled?: boolean;
		sendDisabled?: boolean;
		testDisabled?: boolean;
		onDownload: () => void;
		onSend: () => void;
		onTest: () => void;
	} = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<button {...props} class="button-secondary action-button" type="button">
				<ReceiptEuro size={18} aria-hidden="true" />
				{label}
			</button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="min-w-[280px]" align="end" sideOffset={6}>
		<DropdownMenu.Item disabled={downloadDisabled} onSelect={onDownload}>
			<Download size={16} aria-hidden="true" />
			{downloadLabel}
		</DropdownMenu.Item>
		<DropdownMenu.Item disabled={sendDisabled} onSelect={onSend}>
			<Mail size={16} aria-hidden="true" />
			{sendLabel}
		</DropdownMenu.Item>
		<DropdownMenu.Item disabled={testDisabled} onSelect={onTest}>
			<Mail size={16} aria-hidden="true" />
			{testLabel}
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
