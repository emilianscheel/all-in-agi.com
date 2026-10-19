<script lang="ts">
	import { Ellipsis, Trash2 } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import type { Locale } from '$lib/i18n';
	import type { UserTableRow } from './booking-types';

	let {
		adminUser,
		locale,
		deleteBusyId,
		currentUserId,
		userCount,
		onConfirmDelete
	}: {
		adminUser: UserTableRow;
		locale: Locale;
		deleteBusyId: string | null;
		currentUserId: string;
		userCount: number;
		onConfirmDelete: (adminUser: UserTableRow) => void;
	} = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="outline"
				size="icon"
				class="dashboard-action-trigger size-[34px] rounded-full"
				aria-label={`${locale === 'en' ? 'Actions for' : 'Aktionen für'} ${adminUser.name}`}
			>
				<Ellipsis size={19} aria-hidden="true" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="min-w-[220px]" align="end" sideOffset={6}>
		<DropdownMenu.Item
			variant="destructive"
			disabled={deleteBusyId !== null || adminUser.id === currentUserId || userCount <= 1}
			onSelect={() => onConfirmDelete(adminUser)}
		>
			<Trash2 size={16} aria-hidden="true" />
			{locale === 'en' ? 'Delete user' : 'Nutzer löschen'}
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
